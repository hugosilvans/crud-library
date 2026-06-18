const express = require('express');
const router = express.Router();
const pool = require('../db');

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

function validarData(data) {
    return /^\d{4}-\d{2}-\d{2}$/.test(data || '');
}

async function finalizarEmprestimo(idEmprestimo) {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const [emprestimos] = await conn.query(
            'SELECT id_livro, status FROM emprestimo WHERE id_emprestimo = ? FOR UPDATE',
            [idEmprestimo]
        );

        if (emprestimos.length === 0) {
            await conn.rollback();
            return { status: 404, mensagem: 'Empréstimo não encontrado.' };
        }

        if (emprestimos[0].status === 'devolvido') {
            await conn.rollback();
            return { status: 400, mensagem: 'Empréstimo já devolvido.' };
        }

        await conn.query(
            "UPDATE emprestimo SET status = 'devolvido', data_devolucao_real = CURDATE() WHERE id_emprestimo = ?",
            [idEmprestimo]
        );

        await conn.query(
            'UPDATE livro SET quantidade_disponivel = quantidade_disponivel + 1 WHERE id_livro = ?',
            [emprestimos[0].id_livro]
        );

        await conn.commit();
        return { status: 200, mensagem: 'Devolução registrada com sucesso.' };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

router.get('/', async (req, res) => {
    try {
        const [emprestimos] = await pool.query(`${SELECT_EMPRESTIMOS} ORDER BY e.id_emprestimo DESC`);
        res.json({ emprestimos });
    } catch (err) {
        res.status(500).json({
            mensagem: 'Erro ao buscar empréstimos.'
        });
    }
});

router.get('/meus', async (req, res) => {
    try {
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
            mensagem: 'Erro ao buscar empréstimos.'
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [emprestimos] = await pool.query(
            `${SELECT_EMPRESTIMOS} WHERE e.id_emprestimo = ?`,
            [req.params.id]
        );

        if (emprestimos.length === 0) {
            return res.status(404).json({
                mensagem: 'Empréstimo não encontrado.'
            });
        }

        res.json(emprestimos[0]);
    } catch (err) {
        res.status(500).json({
            mensagem: 'Erro ao buscar empréstimo.'
        });
    }
});

router.post('/', async (req, res) => {
    let conn;

    try {
        conn = await pool.getConnection();
        const idLivro = req.body.id_livro || req.body.livro_id;
        const idLeitor = req.body.id_leitor || req.body.leitor_id || req.body.usuario_id;
        const dataEmprestimo = req.body.data_emprestimo || new Date().toISOString().slice(0, 10);
        const dataDevolucaoPrevista = req.body.data_devolucao_prevista;

        if (!idLivro || !idLeitor || !validarData(dataEmprestimo) || !validarData(dataDevolucaoPrevista)) {
            return res.status(400).json({
                mensagem: 'Informe livro, leitor e datas válidas.'
            });
        }

        await conn.beginTransaction();

        const [livros] = await conn.query(
            'SELECT quantidade_disponivel FROM livro WHERE id_livro = ? FOR UPDATE',
            [idLivro]
        );

        if (livros.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                mensagem: 'Livro não encontrado.'
            });
        }

        if (livros[0].quantidade_disponivel <= 0) {
            await conn.rollback();
            return res.status(400).json({
                mensagem: 'Livro indisponível para empréstimo.'
            });
        }

        const [leitores] = await conn.query(
            "SELECT id_usuario FROM usuario WHERE id_usuario = ? AND perfil = 'leitor'",
            [idLeitor]
        );

        if (leitores.length === 0) {
            await conn.rollback();
            return res.status(404).json({
                mensagem: 'Leitor não encontrado.'
            });
        }

        const [resultado] = await conn.query(
            'INSERT INTO emprestimo (id_livro, id_leitor, data_emprestimo, data_devolucao_prevista, status) VALUES (?, ?, ?, ?, ?)',
            [idLivro, idLeitor, dataEmprestimo, dataDevolucaoPrevista, 'ativo']
        );

        await conn.query(
            'UPDATE livro SET quantidade_disponivel = quantidade_disponivel - 1 WHERE id_livro = ?',
            [idLivro]
        );

        await conn.commit();

        res.status(201).json({
            mensagem: 'Empréstimo cadastrado com sucesso.',
            id: resultado.insertId
        });
    } catch (err) {
        if (conn) await conn.rollback();
        res.status(500).json({
            mensagem: 'Erro ao cadastrar empréstimo.'
        });
    } finally {
        if (conn) conn.release();
    }
});

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
                mensagem: 'Informe livro, leitor e datas válidas.'
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

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: 'Empréstimo não encontrado.'
            });
        }

        res.json({
            mensagem: 'Empréstimo atualizado com sucesso.'
        });
    } catch (err) {
        res.status(500).json({
            mensagem: 'Erro ao atualizar empréstimo.'
        });
    }
});

router.put('/:id/solicitar-devolucao', async (req, res) => {
    try {
        const resultado = await finalizarEmprestimo(req.params.id);
        res.status(resultado.status).json({
            mensagem: resultado.mensagem
        });
    } catch (err) {
        res.status(500).json({
            mensagem: 'Erro ao solicitar devolução.'
        });
    }
});

router.put('/:id/aprovar-devolucao', async (req, res) => {
    try {
        const resultado = await finalizarEmprestimo(req.params.id);
        res.status(resultado.status).json({
            mensagem: resultado.mensagem
        });
    } catch (err) {
        res.status(500).json({
            mensagem: 'Erro ao aprovar devolução.'
        });
    }
});

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
                mensagem: 'Empréstimo não encontrado.'
            });
        }

        await conn.query(
            'DELETE FROM emprestimo WHERE id_emprestimo = ?',
            [req.params.id]
        );

        if (emprestimos[0].status !== 'devolvido') {
            await conn.query(
                'UPDATE livro SET quantidade_disponivel = quantidade_disponivel + 1 WHERE id_livro = ?',
                [emprestimos[0].id_livro]
            );
        }

        await conn.commit();

        res.json({
            mensagem: 'Empréstimo removido com sucesso.'
        });
    } catch (err) {
        if (conn) await conn.rollback();
        res.status(500).json({
            mensagem: 'Erro ao remover empréstimo.'
        });
    } finally {
        if (conn) conn.release();
    }
});

module.exports = router;
