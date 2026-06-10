const express = require('express');
const app = express();
app.use(express.json()); // OBRIGATORIO para req.body funcionar em POST/PUT/PATCH
// GET — Listar todos
app.get('/usuarios', (req, res) => {
res.json(resultados);
});
// POST — Criar novo (dados vêm do CORPO - req.body)
app.post('/usuarios', (req, res) => {
const { nome, email } = req.body;
res.send(`Usuario ${nome} criado!`);
});
// PUT — Atualizar COMPLETO (ID na URL, dados novos no CORPO)
app.put('/usuarios/:id', (req, res) => {
const userId = req.params.id; // ID vem da URL
const { nome, email } = req.body;
res.send(`Usuario ${userId} totalmente atualizado!`);
});
// PATCH — Atualizar PARCIAL (apenas os campos enviados)
app.patch('/usuarios/:id', (req, res) => {
res.send(`Campos do usuario ${req.params.id} atualizados!`);
});
// DELETE — Remover (NAO usa req.body)
app.delete('/usuarios/:id', (req, res) => {
const userId = req.params.id;
res.send(`Usuario ${userId} removido com sucesso!`);
});
app.listen(3000, () => console.log('Servidor rodando na porta 3000'));