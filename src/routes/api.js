const express = require('express');
const router = express.Router();

const livrosRouter = require('./livros');
const authRouter = require('./auth');

router.use('/livros', livrosRouter);
router.use('/auth', authRouter);

module.exports = router;