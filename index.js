const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());

app.use(express.static('public'));

app.use('/api', require('./src/routes/api'));

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});