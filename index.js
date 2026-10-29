const express = require('express');
const path = require('node:path');
const app = express();

app.use(express.json({ limit: '100kb' }));
// Caminho absoluto permite iniciar o app a partir de qualquer diretório.
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', require('./src/routes/api'));
app.use((erro, req, res, next) => {
  const status =
    erro.type === 'entity.parse.failed' ? 400 : erro.type === 'entity.too.large' ? 413 : 500;
  res.status(status).json({ mensagem: 'Não foi possível processar a requisição.' });
});
if (require.main === module) {
  app.listen(Number(process.env.PORT || 3000), () => console.log('Biblioteca iniciada.'));
}
module.exports = app;
