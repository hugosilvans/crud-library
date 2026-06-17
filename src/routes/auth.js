const express = require('express');
const router = express.Router();
const pool = require('../db');

// Rota POST /api/auth/registrar
// Recebe os dados de um novo usuario e salva no banco.
router.post('/registrar', async (req, res) => {
    try {
        // req.body contem os dados enviados pelo frontend no formato JSON.
        const { nome, email, senha, perfil } = req.body;

        // Antes de cadastrar, verifica se ja existe alguem usando o mesmo email.
        // O ponto de interrogacao (?) e preenchido pelo mysql2 com o valor do array.
        const [usuarioExistente] = await pool.query(
            'SELECT * FROM usuario WHERE email = ?',
            [email]
        );

        // Se a consulta encontrou pelo menos um usuario, o email ja esta em uso.
        if (usuarioExistente.length > 0) {
            return res.status(400).json({
                mensagem: 'Email ja cadastrado.'
            });
        }

        // Insere o novo usuario na tabela usuario.
        await pool.query(
            'INSERT INTO usuario (nome, email, senha, perfil) VALUES (?, ?, ?, ?)',
            [nome, email, senha, perfil]
        );

        // Status 201 significa que um recurso foi criado com sucesso.
        res.status(201).json({
            mensagem: 'Usuario cadastrado com sucesso.'
        });

    } catch (erro) {
        // Mostra o erro no terminal para ajudar durante o desenvolvimento.
        console.error(erro);

        // Status 500 indica erro inesperado no servidor.
        res.status(500).json({
            mensagem: 'Erro ao cadastrar usuario.'
        });
    }
});

// Rota POST /api/auth/login
// Confere email e senha e, se estiverem corretos, devolve dados do usuario.
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        // Busca um usuario que tenha exatamente o email e a senha informados.
        // Observacao: em sistemas reais, senhas devem ser criptografadas.
        const [usuarios] = await pool.query(
            'SELECT * FROM usuario WHERE email = ? AND senha = ?',
            [email, senha]
        );

        // Se nenhum usuario foi encontrado, o login falhou.
        if (usuarios.length === 0) {
            return res.status(401).json({
                mensagem: 'Email ou senha invalidos.'
            });
        }

        // Como a consulta encontrou o usuario, usamos o primeiro resultado.
        const usuario = usuarios[0];

        // Retorna um token simples e os dados que o frontend precisa guardar.
        // Este token e didatico; nao e uma autenticacao segura para producao.
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

// Exporta este roteador para ser conectado em /api/auth pelo arquivo api.js.
module.exports = router;
