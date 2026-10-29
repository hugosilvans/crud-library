const express = require('express');
const { autenticar, bibliotecario } = require('../security/sessions');
const pool = require('../db');
const router = express.Router();

router.use('/auth', require('./auth'));
// A interface também verifica perfil, mas a autorização efetiva pertence ao servidor.
router.use(autenticar);
router.use(async (req, res, next) => {
  try {
    const [usuarios] = await pool.query(
      'SELECT id_usuario AS id, nome, email, perfil FROM usuario WHERE id_usuario = ?',
      [req.usuario.id],
    );
    if (!usuarios[0])
      return res.status(401).json({ mensagem: 'Usuário não está mais disponível.' });
    req.usuario = usuarios[0];
    next();
  } catch (erro) {
    res.status(500).json({ mensagem: 'Erro ao validar sessão.' });
  }
});
router.use(
  '/livros',
  (req, res, next) => (req.method === 'GET' ? next() : bibliotecario(req, res, next)),
  require('./livros'),
);
router.use('/usuarios', bibliotecario, require('./usuarios'));
router.use(
  '/emprestimos',
  async (req, res, next) => {
    if (req.usuario.perfil === 'bibliotecario') return next();
    if (req.method === 'GET' && req.path === '/meus') {
      req.leitorAutenticado = req.usuario.id;
      return next();
    }
    if (req.method === 'POST' && req.path === '/') {
      req.body = req.body || {};
      req.body.id_leitor = req.usuario.id;
      return next();
    }
    if (req.method === 'PUT' && /^\/\d+\/solicitar-devolucao$/.test(req.path)) {
      try {
        const [linhas] = await pool.query(
          'SELECT id_leitor FROM emprestimo WHERE id_emprestimo = ?',
          [req.path.split('/')[1]],
        );
        if (linhas[0]?.id_leitor === req.usuario.id) return next();
      } catch (erro) {
        return res.status(500).json({ mensagem: 'Erro ao verificar empréstimo.' });
      }
    }
    res.status(403).json({ mensagem: 'Você não tem permissão para esta operação.' });
  },
  require('./emprestimos'),
);

module.exports = router;
