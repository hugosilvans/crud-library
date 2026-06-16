const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
    try {
        const [livros] = await pool.query(
            'SELECT id_livro AS id, titulo, autor, ano_publicacao,',
            'quantidade_disponivel FROM livro'
        );  
        res.json({livros});  
    } catch (err) {
        res.status(500).json({ mensagem: 'Erro ao buscar livros.'});
    }
})


router.get('/:id',async (req, res) => {
    try{
        const [rows] = await pool.query(
            'SELECT id_livro AS id, titulo, autor, ano_publicacao, quantidade_disponivel FROM livro WHERE id_livro = ?',
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ mensagem : 'Livro nao encontrado.' });
        }
        
        res.json(rows[0]);

    } catch (err) {
        res.status(500).json({ mensagem: 'Erro ao buscar livro.' });
    }
});

module.exports = router;