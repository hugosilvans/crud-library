const express = require('express');
const router = express.Router();
const pool = require('../db');

// Rota GET /api/usuarios
// Lista os usuarios cadastrados, sem retornar a senha.
router.get('/', async (req, res) => {
    try {

        // Seleciona somente os campos que o frontend precisa exibir.
        const [usuarios] = await pool.query(
            'SELECT id_usuario AS id, nome, email, perfil FROM usuario'
        );

        res.json({ usuarios });

    } catch (err) {

        res.status(500).json({
            mensagem: 'Erro ao buscar usuarios.'
        });
    }
});

// Rota GET /api/usuarios/:id
// Busca um usuario especifico pelo ID.
router.get('/:id', async (req, res) => {
    try {

        // req.params.id pega o ID que veio na URL.
        const [usuarios] = await pool.query(
            'SELECT id_usuario AS id, nome, email, perfil FROM usuario WHERE id_usuario = ?',
            [req.params.id]
        );

        // Se a lista veio vazia, nao existe usuario com esse ID.
        if (usuarios.length === 0) {
            return res.status(404).json({
                mensagem: 'Usuario nao encontrado.'
            });
        }

        res.json(usuarios[0]);

    } catch (err) {

        res.status(500).json({
            mensagem: 'Erro ao buscar usuario.'
        });
    }
});

// Rota POST /api/usuarios
// Cadastra um usuario pelo painel do bibliotecario.
router.post('/', async (req, res) => {
    try {

        // Dados recebidos do formulario.
        const { nome, email, senha, perfil } = req.body;

        // Salva o usuario no banco.
        await pool.query(
            'INSERT INTO usuario (nome, email, senha, perfil) VALUES (?, ?, ?, ?)',
            [nome, email, senha, perfil]
        );

        res.status(201).json({
            mensagem: 'Usuario cadastrado com sucesso.'
        });

    } catch (err) {

        res.status(500).json({
            mensagem: 'Erro ao cadastrar usuario.'
        });
    }
});

// Rota PUT /api/usuarios/:id
// Atualiza todos os dados principais de um usuario.
router.put('/:id', async (req, res) => {
    try {

        // Novos dados enviados pelo frontend.
        const { nome, email, senha, perfil } = req.body;

        // Atualiza o usuario que possui o ID da URL.
        await pool.query(
            'UPDATE usuario SET nome = ?, email = ?, senha = ?, perfil = ? WHERE id_usuario = ?',
            [nome, email, senha, perfil, req.params.id]
        );

        res.json({
            mensagem: 'Usuario atualizado com sucesso.'
        });

    } catch (err) {

        res.status(500).json({
            mensagem: 'Erro ao atualizar usuario.'
        });
    }
});

// Rota DELETE /api/usuarios/:id
// Remove um usuario pelo ID.
router.delete('/:id', async (req, res) => {
    try {

        // Deleta o registro da tabela usuario.
        await pool.query(
            'DELETE FROM usuario WHERE id_usuario = ?',
            [req.params.id]
        );

        res.json({
            mensagem: 'Usuario removido com sucesso.'
        });

    } catch (err) {

        res.status(500).json({
            mensagem: 'Erro ao remover usuario.'
        });
    }
});

// Exporta as rotas de usuarios para o roteador principal.
module.exports = router;
