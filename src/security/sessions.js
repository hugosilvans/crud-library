const { randomBytes, createHash } = require('node:crypto');
const sessoes = new Map();
const DURACAO = 60 * 60 * 1000;
const chave = (token) => createHash('sha256').update(token).digest('hex');

// Exemplo de sessão no servidor: expira em uma hora e ao reiniciar o processo.
function criarSessao(usuario, agora = Date.now()) {
  for (const [id, sessao] of sessoes) if (sessao.expira <= agora) sessoes.delete(id);
  const token = randomBytes(32).toString('hex');
  sessoes.set(chave(token), { ...usuario, expira: agora + DURACAO });
  return token;
}
function lerSessao(token, agora = Date.now()) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return null;
  const id = chave(token),
    sessao = sessoes.get(id);
  if (!sessao || sessao.expira <= agora) {
    sessoes.delete(id);
    return null;
  }
  return sessao;
}
function encerrarSessao(token) {
  if (typeof token === 'string') sessoes.delete(chave(token));
}
function autenticar(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  const sessao = lerSessao(token);
  if (!sessao) return res.status(401).json({ mensagem: 'Entre novamente para continuar.' });
  req.usuario = sessao;
  req.token = token;
  next();
}
function bibliotecario(req, res, next) {
  if (req.usuario.perfil !== 'bibliotecario')
    return res.status(403).json({ mensagem: 'Acesso restrito ao bibliotecário.' });
  next();
}
module.exports = { criarSessao, lerSessao, encerrarSessao, autenticar, bibliotecario };
