const { test } = require('node:test');
const assert = require('node:assert/strict');
const pool = require('../src/db');
const { hashSenha } = require('../src/security/passwords');
const app = require('../index');

test('HTTP: sessão, perfil e cadastro público sem elevação de privilégio', async (t) => {
  // Banco simulado testa a política HTTP; não substitui testes de integração MySQL.
  const hash = await hashSenha('SenhaDeEstudo123!');
  const leitor = {
    id_usuario: 2,
    id: 2,
    nome: 'Leitor',
    email: 'leitor@example.com',
    perfil: 'leitor',
    senha: hash,
  };
  let perfilInserido;
  pool.query = async (sql, valores) => {
    if (sql.startsWith('SELECT * FROM usuario')) return [[leitor]];
    if (sql.startsWith('SELECT id_usuario AS id')) return [[leitor]];
    if (sql.startsWith('INSERT INTO usuario')) {
      perfilInserido = valores[3];
      return [{ insertId: 3 }];
    }
    throw new Error('Consulta inesperada no cenário de teste');
  };
  const servidor = app.listen(0);
  t.after(async () => {
    servidor.close();
    await pool.end();
  });
  const base = `http://127.0.0.1:${servidor.address().port}/api`;
  const enviar = (caminho, dados, token) =>
    fetch(base + caminho, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(dados),
    });
  assert.equal((await fetch(base + '/livros')).status, 401);
  const login = await enviar('/auth/login', { email: leitor.email, senha: 'SenhaDeEstudo123!' });
  assert.equal(login.status, 200);
  const { token } = await login.json();
  assert.equal((await enviar('/livros', { titulo: 'Teste' }, token)).status, 403);
  assert.equal(
    (await fetch(base + '/usuarios', { headers: { Authorization: `Bearer ${token}` } })).status,
    403,
  );
  const registro = await enviar('/auth/registrar', {
    nome: 'Teste',
    email: 'novo@example.com',
    senha: 'SenhaDeEstudo123!',
    perfil: 'bibliotecario',
  });
  assert.equal(registro.status, 201);
  assert.equal(perfilInserido, 'leitor');
  assert.equal((await enviar('/auth/logout', {}, token)).status, 204);
  assert.equal(
    (await fetch(base + '/livros', { headers: { Authorization: `Bearer ${token}` } })).status,
    401,
  );
});
