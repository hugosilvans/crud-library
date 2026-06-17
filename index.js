const express = require('express');
const path = require('path');

// Cria a aplicacao Express. O Express e o framework que recebe requisicoes HTTP
// do navegador e devolve paginas, arquivos ou respostas JSON.
const app = express();

// Usa a porta informada pelo ambiente ou, se nao existir, usa a porta 3000.
const PORT = process.env.PORT || 3000;

// Permite que o servidor entenda JSON enviado no corpo das requisicoes.
// Exemplo: quando o frontend envia email e senha no login.
app.use(express.json());

// Disponibiliza todos os arquivos da pasta public para o navegador.
// Por isso index.html, style.css e app.js podem ser acessados pelo browser.
app.use(express.static('public'));

// Todas as rotas que comecam com /api sao encaminhadas para o roteador principal.
// Exemplo: /api/livros, /api/auth/login, /api/usuarios.
app.use('/api', require('./src/routes/api'));

// Inicia o servidor e deixa a aplicacao escutando requisicoes na porta definida.
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
