const express = require('express');

// Este arquivo junta os roteadores menores em um unico roteador principal.
const router = express.Router();

// Cada arquivo abaixo cuida das rotas de uma parte do sistema.
const livrosRouter = require('./livros');
const authRouter = require('./auth');
const usuariosRouter = require('./usuarios');
const emprestimosRouter = require('./emprestimos');

// Define os prefixos das rotas.
// Exemplo: tudo em livrosRouter fica acessivel a partir de /api/livros.
router.use('/livros', livrosRouter);
router.use('/auth', authRouter);
router.use('/usuarios', usuariosRouter);
router.use('/emprestimos', emprestimosRouter);

// Exporta o roteador para ser usado no index.js.
module.exports = router;
