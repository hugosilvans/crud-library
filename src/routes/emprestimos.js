const express = require('express');
const router = express.Router();
const pool = require('../db');

// Consulta base usada em varias rotas de emprestimos.
// Ela junta emprestimo + livro + usuario para retornar nomes legiveis no frontend.
const SELECT_EMPRESTIMOS = `
    SELECT
        e.id_emprestimo AS id,
        e.id_livro,
        e.id_leitor,
        l.titulo AS livro_titulo,
        u.nome AS leitor_nome,
        DATE_FORMAT(e.data_emprestimo, '%Y-%m-%d') AS data_emprestimo,
        DATE_FORMAT(e.data_devolucao_prevista, '%Y-%m-%d') AS data_devolucao_prevista,
        DATE_FORMAT(e.data_devolucao_real, '%Y-%m-%d') AS data_devolucao_real,
        CASE
            WHEN e.status = 'ativo' AND e.data_devolucao_prevista < CURDATE() THEN 'atrasado'
            ELSE e.status
        END AS status
    FROM emprestimo e
    INNER JOIN livro l ON l.id_livro = e.id_livro
    INNER JOIN usuario u ON u.id_usuario = e.id_leitor
`;

// Confere se uma data esta no formato AAAA-MM-DD.
function validarData(data) {
    return /^\d{4}-\d{2}-\d{2}$/.test(data || '');
}

// Finaliza um emprestimo marcando como devolvido e devolvendo 1 unidade ao estoque.
// A mesma funcao e usada pelo leitor e pelo bibliotecario.
async function finalizarEmprestimo(idEmprestimo) {
    // getConnection pega uma conexao especifica do pool.
    // Isso e necessario porque a transacao precisa usar a mesma conexao do inicio ao fim.
    const conn = await pool.getConnection();

    try {
        // Transacao garante que todas as alteracoes acontecam juntas.
        // Se uma parte falhar, tudo e desfeito com rollback.
        await conn.beginTransaction();

        // FOR UPDATE bloqueia o registro durante a transacao para evitar conflito.
        const [emprestimos] = await conn.query(
            'SELECT id_livro, status FROM emprestimo WHERE id_emprestimo = ? FOR UPDATE',
            [idEmprestimo]
        );

        if (emprestimos.length === 0) {
            await conn.rollback();
            return { status: 404, mensagem: 'Emprestimo nao encontrado.' };
        }

        if (emprestimos[0].status === 'devolvido') {
            await conn.rollback();
            return { status: 400, mensagem: 'Emprestimo ja devolvido.' };
        }

        // Marca o emprestimo como devolvido e registra a data real da devolucao.
        await conn.query(
            "UPDATE emprestimo SET status = 'devolvido', data_devolucao_real = CURDATE() WHERE id_emprestimo = ?",
            [idEmprestimo]
        );

        // Aumenta o estoque do livro porque uma unidade voltou para a biblioteca.
        await conn.query(
            'UPDATE livro SET quantidade_disponivel = quantidade_disponivel + 1 WHERE id_livro = ?',
            [emprestimos[0].id_livro]
        );

        // Confirma as duas alteracoes no banco.
        await conn.commit();
        return { status: 200, mensagem: 'Devolucao registrada com sucesso.' };
    } catch (err) {
        // Se qualquer comando falhar, desfaz tudo que aconteceu na transacao.
        await conn.rollback();
        throw err;
    } finally {
        // Sempre devolve a conexao ao pool, mesmo em caso de erro.
        conn.release();
    }
}

// Rota GET /api/emprestimos
// Lista todos os emprestimos, mais recentes primeiro.
router.get('/', async (req, res) => {
    try {
        const [emprestimos] = await pool.query(`${SELECT_EMPRESTIMOS} ORDER BY e.id_emprestimo DESC`);
        res.json({ emprestimos });
    } catch (err) {
        res.status(500).json({
            mensagem: 'Erro ao buscar emprestimos.'
        });
    }
});

// Rota GET /api/emprestimos/meus?id_leitor=ID
// Lista somente os emprestimos de um leitor.
router.get('/meus', async (req, res) => {
    try {
        // Aceita dois nomes de parametro para facilitar chamadas diferentes do frontend.
        const idLeitor = req.query.id_leitor || req.query.usuario_id;

        if (!idLeitor) {
            return res.status(400).json({
                mensagem: 'Informe o leitor.'
            });
        }

        const [emprestimos] = await pool.query(
            `${SELECT_EMPRESTIMOS} WHERE e.id_leitor = ? ORDER BY e.id_emprestimo DESC`,
            [idLeitor]
        );

        res.json({ emprestimos });
    } catch (err) {
        res.status(500).json({
            mensagem: 'Erro ao buscar emprestimos.'
        });
    }
});

// Rota GET /api/emprestimos/:id
// Busca um emprestimo especifico.
router.get('/:id', async (req, res) => {
    try {
        const [emprestimos] = await pool.query(
            `${SELECT_EMPRESTIMOS} WHERE e.id_emprestimo = ?`,
            [req.params.id]
        );

        if (emprestimos.length === 0) {
            return res.status(404).json({
                mensagem: 'Emprestimo nao encontrado.'
            });
        }

        res.json(emprestimos[0]);
    } catch (err) {
        res.status(500).json({
            mensagem: 'Erro ao buscar emprestimo.'
        });
    }
});

// Rota POST /api/emprestimos
// Cria um novo emprestimo e reduz a quantidade disponivel do livro.
router.post('/', async (req, res) => {
    let conn;

    try {
        conn = await pool.getConnection();

        // Aceita nomes alternativos porque algumas telas podem mandar campos diferentes.
        const idLivro = req.body.id_livro || req.body.livro_id;
        const idLeitor = req.body.id_leitor || req.body.leitor_id || req.body.usuario_id;
        const dataEmprestimo = req.body.data_emprestimo || new Date().toISOString().slice(0, 10);
        const dataDevolucaoPrevista = req.body.data_devolucao_prevista;

        // Valida dados obrigatorios antes de tentar gravar.
        if (!idLivro || !idLeitor || !validarData(dataEmprestimo) || !validarData(dataDevolucaoPrevista)) {
            return res.status(400).json({
                mensagem: 'Informe livro, leitor e datas validas.'
            });
        }

        await conn.beginTransaction();

        // Bloqueia o livro para conferir e alterar o estoque com seguranca.
        const [livros] = await conn.query(
            'SELECT quantidade_disponivel FROM livro WHERE id_livro = ? FOR UPDATE',
            [idLivro]
        );

        if (livros.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                mensagem: 'Livro nao encontrado.'
            });
        }

        if (livros[0].quantidade_disponivel <= 0) {
            await conn.rollback();
            return res.status(400).json({
                mensagem: 'Livro indisponivel para emprestimo.'
            });
        }

        // Garante que o usuario escolhido existe e tem perfil de leitor.
        const [leitores] = await conn.query(
            "SELECT id_usuario FROM usuario WHERE id_usuario = ? AND perfil = 'leitor'",
            [idLeitor]
        );

        if (leitores.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                mensagem: 'Leitor nao encontrado.'
            });
        }

        // Cria o emprestimo com status ativo.
        const [resultado] = await conn.query(
            'INSERT INTO emprestimo (id_livro, id_leitor, data_emprestimo, data_devolucao_prevista, status) VALUES (?, ?, ?, ?, ?)',
            [idLivro, idLeitor, dataEmprestimo, dataDevolucaoPrevista, 'ativo']
        );

        // Diminui o estoque do livro emprestado.
        await conn.query(
            'UPDATE livro SET quantidade_disponivel = quantidade_disponivel - 1 WHERE id_livro = ?',
            [idLivro]
        );

        await conn.commit();

        res.status(201).json({
            mensagem: 'Emprestimo cadastrado com sucesso.',
            id: resultado.insertId
        });
    } catch (err) {
        if (conn) await conn.rollback();
        res.status(500).json({
            mensagem: 'Erro ao cadastrar emprestimo.'
        });
    } finally {
        if (conn) conn.release();
    }
});

// Rota PUT /api/emprestimos/:id
// Atualiza os dados de um emprestimo ja existente.
router.put('/:id', async (req, res) => {
    try {
        const {
            id_livro,
            id_leitor,
            data_emprestimo,
            data_devolucao_prevista,
            data_devolucao_real,
            status
        } = req.body;

        if (!id_livro || !id_leitor || !validarData(data_emprestimo) || !validarData(data_devolucao_prevista)) {
            return res.status(400).json({
                mensagem: 'Informe livro, leitor e datas validas.'
            });
        }

        const [resultado] = await pool.query(
            'UPDATE emprestimo SET id_livro = ?, id_leitor = ?, data_emprestimo = ?, data_devolucao_prevista = ?, data_devolucao_real = ?, status = ? WHERE id_emprestimo = ?',
            [
                id_livro,
                id_leitor,
                data_emprestimo,
                data_devolucao_prevista,
                data_devolucao_real || null,
                status || 'ativo',
                req.params.id
            ]
        );

        // affectedRows informa quantas linhas foram alteradas.
        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: 'Emprestimo nao encontrado.'
            });
        }

        res.json({
            mensagem: 'Emprestimo atualizado com sucesso.'
        });
    } catch (err) {
        res.status(500).json({
            mensagem: 'Erro ao atualizar emprestimo.'
        });
    }
});

// Rota PUT /api/emprestimos/:id/solicitar-devolucao
// Permite que o leitor solicite/deixe registrada a devolucao.
router.put('/:id/solicitar-devolucao', async (req, res) => {
    try {
        const resultado = await finalizarEmprestimo(req.params.id);
        res.status(resultado.status).json({
            mensagem: resultado.mensagem
        });
    } catch (err) {
        res.status(500).json({
            mensagem: 'Erro ao solicitar devolucao.'
        });
    }
});

// Rota PUT /api/emprestimos/:id/aprovar-devolucao
// Permite que o bibliotecario aprove a devolucao.
router.put('/:id/aprovar-devolucao', async (req, res) => {
    try {
        const resultado = await finalizarEmprestimo(req.params.id);
        res.status(resultado.status).json({
            mensagem: resultado.mensagem
        });
    } catch (err) {
        res.status(500).json({
            mensagem: 'Erro ao aprovar devolucao.'
        });
    }
});

// Rota DELETE /api/emprestimos/:id
// Exclui um emprestimo. Se ele ainda nao foi devolvido, devolve o livro ao estoque.
router.delete('/:id', async (req, res) => {
    let conn;

    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const [emprestimos] = await conn.query(
            'SELECT id_livro, status FROM emprestimo WHERE id_emprestimo = ? FOR UPDATE',
            [req.params.id]
        );

        if (emprestimos.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                mensagem: 'Emprestimo nao encontrado.'
            });
        }

        await conn.query(
            'DELETE FROM emprestimo WHERE id_emprestimo = ?',
            [req.params.id]
        );

        // Se o emprestimo estava ativo/atrasado, a exclusao deve repor o livro no estoque.
        if (emprestimos[0].status !== 'devolvido') {
            await conn.query(
                'UPDATE livro SET quantidade_disponivel = quantidade_disponivel + 1 WHERE id_livro = ?',
                [emprestimos[0].id_livro]
            );
        }

        await conn.commit();

        res.json({
            mensagem: 'Emprestimo removido com sucesso.'
        });
    } catch (err) {
        if (conn) await conn.rollback();
        res.status(500).json({
            mensagem: 'Erro ao remover emprestimo.'
        });
    } finally {
        if (conn) conn.release();
    }
});

// Exporta as rotas de emprestimos para o roteador principal.
module.exports = router;
