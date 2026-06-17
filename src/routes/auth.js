const express = require('express');
const router = express.Router();
const pool = require('../db');

// REGISTRAR
router.post('/registrar', async (req, res) => {
    try {
        const { nome, email, senha, perfil } = req.body;

        const [usuarioExistente] = await pool.query(
            'SELECT * FROM usuario WHERE email = ?',
            [email]
        );

        if (usuarioExistente.length > 0) {
            return res.status(400).json({
                mensagem: 'Email já cadastrado.'
            });
        }

        await pool.query(
            'INSERT INTO usuario (nome, email, senha, perfil) VALUES (?, ?, ?, ?)',
            [nome, email, senha, perfil]
        );

        res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso.'
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            mensagem: 'Erro ao cadastrar usuário.'
        });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        const [usuarios] = await pool.query(
            'SELECT * FROM usuario WHERE email = ? AND senha = ?',
            [email, senha]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                mensagem: 'Email ou senha inválidos.'
            });
        }

        const usuario = usuarios[0];

        res.json({
            token: 'biblioteca-token',
            usuario: {
                id: usuario.id_usuario,
                nome: usuario.nome,
                email: usuario.email,
                perfil: usuario.perfil
            }
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            mensagem: 'Erro ao realizar login.'
        });
    }
});

module.exports = router;