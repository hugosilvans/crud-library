const { test } = require('node:test');
const assert = require('node:assert/strict');
const { hashSenha, verificarSenha, validarUsuario } = require('../src/security/passwords');
const {
  criarSessao,
  lerSessao,
  encerrarSessao,
  autenticar,
  bibliotecario,
} = require('../src/security/sessions');

test('hash usa salt e só aceita a senha correta', async () => {
  const a = await hashSenha('SenhaDeEstudo123!'),
    b = await hashSenha('SenhaDeEstudo123!');
  assert.notEqual(a, b);
  assert.equal(await verificarSenha('SenhaDeEstudo123!', a), true);
  assert.equal(await verificarSenha('outra', a), false);
  assert.equal(await verificarSenha('1234', '1234'), false);
});
test('sessões expiram e logout revoga o token', () => {
  const usuario = { id: 1, perfil: 'leitor' };
  const token = criarSessao(usuario, 1000);
  assert.equal(lerSessao(token, 1001).id, 1);
  assert.equal(lerSessao(token, 3601000), null);
  const outro = criarSessao(usuario);
  encerrarSessao(outro);
  assert.equal(lerSessao(outro), null);
});
test('middleware impede requisição sem sessão e leitor em operação administrativa', () => {
  let status;
  const res = {
    status(codigo) {
      status = codigo;
      return this;
    },
    json() {},
  };
  autenticar({ headers: {} }, res, () => assert.fail('não deveria autorizar'));
  assert.equal(status, 401);
  bibliotecario({ usuario: { perfil: 'leitor' } }, res, () => assert.fail('não deveria autorizar'));
  assert.equal(status, 403);
  assert.equal(
    validarUsuario({ nome: 'Ana', email: 'a@exemplo.com', senha: '123', perfil: 'leitor' }),
    false,
  );
});
