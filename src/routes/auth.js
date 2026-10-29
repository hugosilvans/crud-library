const express = require('express');
const pool = require('../db');
const { hashSenha, verificarSenha, validarUsuario } = require('../security/passwords');
const { criarSessao, encerrarSessao, autenticar } = require('../security/sessions');
const router = express.Router();

router.post('/registrar', async (req, res) => {
  // Cadastro público nunca concede o perfil de administrador por escolha do cliente.
  const dados = { ...req.body, perfil: 'leitor' };
  if (!validarUsuario(dados))
    return res.status(400).json({ mensagem: 'Informe nome, email e senha de 8 a 128 caracteres.' });
  try {
    const senha = await hashSenha(dados.senha);
    await pool.query('INSERT INTO usuario (nome, email, senha, perfil) VALUES (?, ?, ?, ?)', [
      dados.nome.trim(),
      dados.email.trim().toLowerCase(),
      senha,
      'leitor',
    ]);
    res.status(201).json({ mensagem: 'Leitor cadastrado com sucesso.' });
  } catch (erro) {
    res
      .status(erro.code === 'ER_DUP_ENTRY' ? 409 : 500)
      .json({ mensagem: 'Não foi possível cadastrar o usuário.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, senha } = req.body || {};
  if (typeof email !== 'string' || typeof senha !== 'string' || senha.length > 128) {
    return res.status(400).json({ mensagem: 'Informe email e senha válidos.' });
  }
  try {
    const [usuarios] = await pool.query('SELECT * FROM usuario WHERE email = ?', [
      email.trim().toLowerCase(),
    ]);
    const usuario = usuarios[0];
    if (!usuario || !(await verificarSenha(senha, usuario.senha))) {
      return res.status(401).json({ mensagem: 'Email ou senha inválidos.' });
    }
    const publico = {
      id: usuario.id_usuario,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    };
    res.json({ token: criarSessao(publico), usuario: publico });
  } catch (erro) {
    res.status(500).json({ mensagem: 'Erro ao realizar login.' });
  }
});

router.post('/logout', autenticar, (req, res) => {
  encerrarSessao(req.token);
  res.status(204).end();
});
module.exports = router;
