const express = require('express');
const router = express.Router();
const pool = require('../db');

// Listar todos os livros
router.get('/', async (req, res) => {
    try {

        const [livros] = await pool.query(
            'SELECT id_livro AS id, titulo, autor, ano_publicacao, quantidade_disponivel FROM livro'
        );

        res.json({ livros });

    } catch (err) {
        res.status(500).json({
            mensagem: 'Erro ao buscar livros.'
        });
    }
});

// Buscar livro por ID
router.get('/:id', async (req, res) => {
    try {

        const [livros] = await pool.query(
            'SELECT id_livro AS id, titulo, autor, ano_publicacao, quantidade_disponivel FROM livro WHERE id_livro = ?',
            [req.params.id]
        );

        if (livros.length === 0) {
            return res.status(404).json({
                mensagem: 'Livro não encontrado.'
            });
        }

        res.json(livros[0]);

    } catch (err) {
        res.status(500).json({
            mensagem: 'Erro ao buscar livro.'
        });
    }
});

// Cadastrar livro
router.post('/', async (req, res) => {
    try {

        const {
            titulo,
            autor,
            ano_publicacao,
            quantidade_disponivel
        } = req.body;

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

// Atualizar livro
router.put('/:id', async (req, res) => {
    try {

        const {
            titulo,
            autor,
            ano_publicacao,
            quantidade_disponivel
        } = req.body;

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

// Excluir livro
router.delete('/:id', async (req, res) => {
    try {

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

module.exports = router;
