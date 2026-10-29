const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const derivar = promisify(scrypt);

// Salt aleatório evita que duas senhas iguais produzam o mesmo hash armazenado.
async function hashSenha(senha) {
  const salt = randomBytes(16).toString('hex');
  const hash = await derivar(senha, salt, 64);
  return `scrypt$${salt}$${hash.toString('hex')}`;
}

async function verificarSenha(senha, armazenada) {
  if (typeof armazenada !== 'string') return false;
  const [algoritmo, salt, hash] = armazenada.split('$');
  if (
    algoritmo !== 'scrypt' ||
    !/^[a-f0-9]{32}$/.test(salt || '') ||
    !/^[a-f0-9]{128}$/.test(hash || '')
  )
    return false;
  const resultado = await derivar(senha, salt, 64);
  return timingSafeEqual(resultado, Buffer.from(hash, 'hex'));
}

function validarUsuario({ nome, email, senha, perfil } = {}) {
  return (
    typeof nome === 'string' &&
    nome.trim().length > 0 &&
    nome.length <= 80 &&
    typeof email === 'string' &&
    email.length <= 80 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    typeof senha === 'string' &&
    senha.length >= 8 &&
    senha.length <= 128 &&
    ['leitor', 'bibliotecario'].includes(perfil)
  );
}
module.exports = { hashSenha, verificarSenha, validarUsuario };
