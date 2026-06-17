const express = require('express');
const router = express.Router();

const livrosRouter = require('./livros');
const authRouter = require('./auth');
const usuariosRouter = require('./usuarios');

router.use('/livros', livrosRouter);
router.use('/auth', authRouter);
router.use('/usuarios', usuariosRouter);

module.exports = router;
