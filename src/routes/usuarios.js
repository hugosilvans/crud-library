const express = require('express');
const router = express.Router();
const pool = require('../db');

router.param('id', (req, res, next, valor) => {
  if (!/^\d+$/.test(valor) || !Number.isSafeInteger(Number(valor)) || Number(valor) < 1) {
    return res.status(400).json({ mensagem: 'ID inválido.' });
  }
  next();
});
const { hashSenha, validarUsuario } = require('../security/passwords');

router.get('/', async (req, res) => {
  try {
    const [usuarios] = await pool.query(
      'SELECT id_usuario AS id, nome, email, perfil FROM usuario',
    );

    res.json({ usuarios });
  } catch (err) {
    res.status(500).json({
      mensagem: 'Erro ao buscar usuários.',
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [usuarios] = await pool.query(
      'SELECT id_usuario AS id, nome, email, perfil FROM usuario WHERE id_usuario = ?',
      [req.params.id],
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        mensagem: 'Usuário não encontrado.',
      });
    }

    res.json(usuarios[0]);
  } catch (err) {
    res.status(500).json({
      mensagem: 'Erro ao buscar usuário.',
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nome, email, senha, perfil } = req.body;
    if (!validarUsuario(req.body))
      return res
        .status(400)
        .json({ mensagem: 'Dados de usuário inválidos; senha mínima de 8 caracteres.' });
    const senhaHash = await hashSenha(senha);

    await pool.query('INSERT INTO usuario (nome, email, senha, perfil) VALUES (?, ?, ?, ?)', [
      nome.trim(),
      email.trim().toLowerCase(),
      senhaHash,
      perfil,
    ]);

    res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso.',
    });
  } catch (err) {
    res.status(500).json({
      mensagem: 'Erro ao cadastrar usuário.',
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { nome, email, senha, perfil } = req.body;
    if (!validarUsuario(req.body))
      return res
        .status(400)
        .json({ mensagem: 'Dados de usuário inválidos; senha mínima de 8 caracteres.' });
    const senhaHash = await hashSenha(senha);

    const [resultado] = await pool.query(
      'UPDATE usuario SET nome = ?, email = ?, senha = ?, perfil = ? WHERE id_usuario = ?',
      [nome.trim(), email.trim().toLowerCase(), senhaHash, perfil, req.params.id],
    );

    if (resultado.affectedRows === 0)
      return res.status(404).json({ mensagem: 'Registro não encontrado.' });
    res.json({
      mensagem: 'Usuário atualizado com sucesso.',
    });
  } catch (err) {
    res.status(500).json({
      mensagem: 'Erro ao atualizar usuário.',
    });
  }
});

router.delete('/:id', async (req, res) => {
  if (Number(req.params.id) === req.usuario.id)
    return res.status(400).json({ mensagem: 'Não é permitido excluir seu próprio usuário.' });
  try {
    const [resultado] = await pool.query('DELETE FROM usuario WHERE id_usuario = ?', [
      req.params.id,
    ]);

    if (resultado.affectedRows === 0)
      return res.status(404).json({ mensagem: 'Registro não encontrado.' });
    res.json({
      mensagem: 'Usuário removido com sucesso.',
    });
  } catch (err) {
    res.status(500).json({
      mensagem: 'Erro ao remover usuário.',
    });
  }
});

module.exports = router;
