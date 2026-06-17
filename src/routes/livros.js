const express = require('express');
const router = express.Router();
const pool = require('../db');

// Rota GET /api/livros
// Lista todos os livros cadastrados no banco.
router.get('/', async (req, res) => {
    try {

        // O AS troca id_livro por id na resposta, deixando o JSON mais simples.
        const [livros] = await pool.query(
            'SELECT id_livro AS id, titulo, autor, ano_publicacao, quantidade_disponivel FROM livro'
        );

        // Envia a lista de livros para o frontend.
        res.json({ livros });

    } catch (err) {
        // Se houver erro de banco ou servidor, devolve uma mensagem generica.
        res.status(500).json({
            mensagem: 'Erro ao buscar livros.'
        });
    }
});

// Rota GET /api/livros/:id
// Busca um unico livro pelo ID informado na URL.
router.get('/:id', async (req, res) => {
    try {

        // req.params.id pega o valor que veio no lugar de :id.
        const [livros] = await pool.query(
            'SELECT id_livro AS id, titulo, autor, ano_publicacao, quantidade_disponivel FROM livro WHERE id_livro = ?',
            [req.params.id]
        );

        // Se a consulta voltou vazia, nao existe livro com esse ID.
        if (livros.length === 0) {
            return res.status(404).json({
                mensagem: 'Livro nao encontrado.'
            });
        }

        // Como a busca e por ID, retorna somente o primeiro item.
        res.json(livros[0]);

    } catch (err) {
        res.status(500).json({
            mensagem: 'Erro ao buscar livro.'
        });
    }
});

// Rota POST /api/livros
// Cadastra um novo livro usando os dados enviados pelo formulario.
router.post('/', async (req, res) => {
    try {

        // Extrai do corpo da requisicao os campos necessarios.
        const {
            titulo,
            autor,
            ano_publicacao,
            quantidade_disponivel
        } = req.body;

        // Insere uma nova linha na tabela livro.
        await pool.query(
            'INSERT INTO livro (titulo, autor, ano_publicacao, quantidade_disponivel) VALUES (?, ?, ?, ?)',
            [titulo, autor, ano_publicacao, quantidade_disponivel]
        );

        res.status(201).json({
            mensagem: 'Livro cadastrado com sucesso.'
        });

    } catch (err) {
        res.status(500).json({
            mensagem: 'Erro ao cadastrar livro.'
        });
    }
});

// Rota PUT /api/livros/:id
// Atualiza os dados de um livro existente.
router.put('/:id', async (req, res) => {
    try {

        // Recebe os novos valores enviados pelo frontend.
        const {
            titulo,
            autor,
            ano_publicacao,
            quantidade_disponivel
        } = req.body;

        // Atualiza a linha cujo id_livro e igual ao parametro da URL.
        await pool.query(
            'UPDATE livro SET titulo = ?, autor = ?, ano_publicacao = ?, quantidade_disponivel = ? WHERE id_livro = ?',
            [
                titulo,
                autor,
                ano_publicacao,
                quantidade_disponivel,
                req.params.id
            ]
        );

        res.json({
            mensagem: 'Livro atualizado com sucesso.'
        });

    } catch (err) {
        res.status(500).json({
            mensagem: 'Erro ao atualizar livro.'
        });
    }
});

// Rota DELETE /api/livros/:id
// Remove um livro pelo ID.
router.delete('/:id', async (req, res) => {
    try {

        // Deleta o registro da tabela livro.
        await pool.query(
            'DELETE FROM livro WHERE id_livro = ?',
            [req.params.id]
        );

        res.json({
            mensagem: 'Livro removido com sucesso.'
        });

    } catch (err) {
        res.status(500).json({
            mensagem: 'Erro ao remover livro.'
        });
    }
});

// Exporta as rotas de livros para o roteador principal.
module.exports = router;
