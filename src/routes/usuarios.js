const express = require('express');
const router = express.Router();
const pool = require('../db');

// Listar usuários
router.get('/', async (req, res) => {
    try {

        const [usuarios] = await pool.query(
            'SELECT id_usuario AS id, nome, email, perfil FROM usuario'
        );

        res.json({ usuarios });

    } catch (err) {

        res.status(500).json({
            mensagem: 'Erro ao buscar usuários.'
        });
    }
});

// Buscar usuário por ID
router.get('/:id', async (req, res) => {
    try {

        const [usuarios] = await pool.query(
            'SELECT id_usuario AS id, nome, email, perfil FROM usuario WHERE id_usuario = ?',
            [req.params.id]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                mensagem: 'Usuário não encontrado.'
            });
        }

        res.json(usuarios[0]);

    } catch (err) {

        res.status(500).json({
            mensagem: 'Erro ao buscar usuário.'
        });
    }
});

// Cadastrar usuário
router.post('/', async (req, res) => {
    try {

        const { nome, email, senha, perfil } = req.body;

        await pool.query(
            'INSERT INTO usuario (nome, email, senha, perfil) VALUES (?, ?, ?, ?)',
            [nome, email, senha, perfil]
        );

        res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso.'
        });

    } catch (err) {

        res.status(500).json({
            mensagem: 'Erro ao cadastrar usuário.'
        });
    }
});

// Atualizar usuário
router.put('/:id', async (req, res) => {
    try {

        const { nome, email, senha, perfil } = req.body;

        await pool.query(
            'UPDATE usuario SET nome = ?, email = ?, senha = ?, perfil = ? WHERE id_usuario = ?',
            [nome, email, senha, perfil, req.params.id]
        );

        res.json({
            mensagem: 'Usuário atualizado com sucesso.'
        });

    } catch (err) {

        res.status(500).json({
            mensagem: 'Erro ao atualizar usuário.'
        });
    }
});

// Excluir usuário
router.delete('/:id', async (req, res) => {
    try {

        await pool.query(
            'DELETE FROM usuario WHERE id_usuario = ?',
            [req.params.id]
        );

        res.json({
            mensagem: 'Usuário removido com sucesso.'
        });

    } catch (err) {

        res.status(500).json({
            mensagem: 'Erro ao remover usuário.'
        });
    }
});

module.exports = router;
