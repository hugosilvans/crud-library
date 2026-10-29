const pool = require('../src/db');
const { hashSenha } = require('../src/security/passwords');

// Execute uma vez em bancos antigos; não imprime senhas nem hashes.
async function migrar() {
  try {
    const [usuarios] = await pool.query('SELECT id_usuario, senha FROM usuario');
    for (const usuario of usuarios) {
      if (usuario.senha.startsWith('scrypt$')) continue;
      const hash = await hashSenha(usuario.senha);
      await pool.query('UPDATE usuario SET senha = ? WHERE id_usuario = ?', [
        hash,
        usuario.id_usuario,
      ]);
    }
    console.log('Migração de senhas concluída.');
  } finally {
    await pool.end();
  }
}
migrar().catch((erro) => {
  console.error('Falha na migração:', erro.code || erro.message);
  process.exitCode = 1;
});
