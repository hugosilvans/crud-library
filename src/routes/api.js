const express = require('express');
const router = express.Router();

const livrosRouter = require('./livros');
const authRouter = require('./auth');
const usuariosRouter = require('./usuarios');
const emprestimosRouter = require('./emprestimos');

router.use('/livros', livrosRouter);
router.use('/auth', authRouter);
router.use('/usuarios', usuariosRouter);
router.use('/emprestimos', emprestimosRouter);

module.exports = router;
