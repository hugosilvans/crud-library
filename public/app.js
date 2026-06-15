
const BASE_URL = 'http://localhost:3000/api';


function salvarSessao(token, usuario) {
  localStorage.setItem('token', token);
  localStorage.setItem('usuario', JSON.stringify(usuario));
}

function getToken() {
  return localStorage.getItem('token');
}

function getUsuario() {
  const dados = localStorage.getItem('usuario');
  return dados ? JSON.parse(dados) : null;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = 'index.html';
}

async function chamarApi(caminho, metodo = 'GET', corpo = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const opcoes = { method: metodo, headers };
  if (corpo) opcoes.body = JSON.stringify(corpo);

  const resposta = await fetch(BASE_URL + caminho, opcoes);
  let dados = null;
  try {
    dados = await resposta.json();
  } catch (e) {
    dados = null;
  }

  return { ok: resposta.ok, dados };
}

function mostrarMensagem(texto, tipo) {
  const msg = document.getElementById('mensagem');
  if (!msg) return;
  msg.textContent = texto;
  msg.style.display = 'block';
  msg.className = 'mensagem' + (tipo === 'sucesso' ? ' sucesso' : '');
}

function esconderMensagem() {
  const msg = document.getElementById('mensagem');
  if (!msg) return;
  msg.style.display = 'none';
}

function inicializarLogin() {
  const tabLogin = document.getElementById('tabLogin');
  const tabRegistro = document.getElementById('tabRegistro');
  const formLogin = document.getElementById('formLogin');
  const formRegistro = document.getElementById('formRegistro');

  tabLogin.addEventListener('click', () => {
    formLogin.style.display = '';
    formRegistro.style.display = 'none';
    esconderMensagem();
  });

  tabRegistro.addEventListener('click', () => {
    formRegistro.style.display = '';
    formLogin.style.display = 'none';
    esconderMensagem();
  });

  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    esconderMensagem();

    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;

    const resposta = await chamarApi('/auth/login', 'POST', { email, senha });

    if (!resposta.ok) {
      mostrarMensagem(resposta.dados?.mensagem || 'Email ou senha inválidos.', 'erro');
      return;
    }

    const { token, usuario } = resposta.dados;
    salvarSessao(token, usuario);

    if (usuario.perfil === 'bibliotecario') {
      window.location.href = 'bibliotecario.html';
    } else {
      window.location.href = 'leitor.html';
    }
  });

  formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();
    esconderMensagem();

    const nome = document.getElementById('registroNome').value;
    const email = document.getElementById('registroEmail').value;
    const senha = document.getElementById('registroSenha').value;
    const perfil = document.getElementById('registroPerfil').value;

    const resposta = await chamarApi('/auth/registrar', 'POST', { nome, email, senha, perfil });

    if (!resposta.ok) {
      mostrarMensagem(resposta.dados?.mensagem || 'Não foi possível registrar.', 'erro');
      return;
    }

    mostrarMensagem('Conta criada com sucesso! Você já pode entrar.', 'sucesso');
    formRegistro.reset();
    tabLogin.click();
  });
}


function inicializarBibliotecario() {
  const usuario = getUsuario();
  if (!usuario || usuario.perfil !== 'bibliotecario') {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('nomeUsuario').textContent = usuario.nome;
  document.getElementById('btnSair').addEventListener('click', logout);

  carregarLivrosBibliotecario();
  carregarEmprestimosBibliotecario();

  document.getElementById('formLivro').addEventListener('submit', salvarLivro);
  document.getElementById('btnCancelarEdicao').addEventListener('click', cancelarEdicaoLivro);
}

async function carregarLivrosBibliotecario() {
  const tabela = document.getElementById('tabelaLivros');
  const resposta = await chamarApi('/livros');

  if (!resposta.ok) {
    tabela.innerHTML = '<tr><td colspan="6">Erro ao carregar livros.</td></tr>';
    return;
  }

  const livros = resposta.dados?.livros || resposta.dados || [];

  if (livros.length === 0) {
    tabela.innerHTML = '<tr><td colspan="6">Nenhum livro cadastrado.</td></tr>';
    return;
  }

  tabela.innerHTML = '';
  livros.forEach((livro) => {
    const linha = document.createElement('tr');
    linha.innerHTML = `
      <td>${livro.id}</td>
      <td>${livro.titulo}</td>
      <td>${livro.autor}</td>
      <td>${livro.ano_publicacao ?? '-'}</td>
      <td>${livro.quantidade_disponivel}</td>
      <td>
        <button type="button" data-acao="editar">Editar</button>
        <button type="button" data-acao="excluir">Excluir</button>
      </td>
    `;

    linha.querySelector('[data-acao="editar"]').addEventListener('click', () => {
      preencherFormularioLivro(livro);
    });

    linha.querySelector('[data-acao="excluir"]').addEventListener('click', async () => {
      if (!confirm(`Remover o livro "${livro.titulo}"?`)) return;

      const respostaExclusao = await chamarApi(`/livros/${livro.id}`, 'DELETE');
      if (!respostaExclusao.ok) {
        mostrarMensagem(respostaExclusao.dados?.mensagem || 'Erro ao remover livro.', 'erro');
        return;
      }

      mostrarMensagem('Livro removido com sucesso.', 'sucesso');
      carregarLivrosBibliotecario();
    });

    tabela.appendChild(linha);
  });
}

function preencherFormularioLivro(livro) {
  document.getElementById('livroId').value = livro.id;
  document.getElementById('livroTitulo').value = livro.titulo;
  document.getElementById('livroAutor').value = livro.autor;
  document.getElementById('livroAno').value = livro.ano_publicacao ?? '';
  document.getElementById('livroQuantidade').value = livro.quantidade_disponivel;

  document.getElementById('tituloFormLivro').textContent = 'Editar livro';
  document.getElementById('btnSalvarLivro').textContent = 'Salvar alterações';
  document.getElementById('btnCancelarEdicao').style.display = 'inline-block';
}

function cancelarEdicaoLivro() {
  document.getElementById('formLivro').reset();
  document.getElementById('livroId').value = '';
  document.getElementById('tituloFormLivro').textContent = 'Cadastrar novo livro';
  document.getElementById('btnSalvarLivro').textContent = 'Cadastrar';
  document.getElementById('btnCancelarEdicao').style.display = 'none';
}

async function salvarLivro(e) {
  e.preventDefault();
  esconderMensagem();

  const id = document.getElementById('livroId').value;
  const titulo = document.getElementById('livroTitulo').value;
  const autor = document.getElementById('livroAutor').value;
  const ano = document.getElementById('livroAno').value;
  const quantidade = document.getElementById('livroQuantidade').value;

  const corpo = {
    titulo,
    autor,
    ano_publicacao: ano ? Number(ano) : null,
    quantidade_disponivel: Number(quantidade),
  };

  const resposta = id
    ? await chamarApi(`/livros/${id}`, 'PUT', corpo)
    : await chamarApi('/livros', 'POST', corpo);

  if (!resposta.ok) {
    mostrarMensagem(resposta.dados?.mensagem || 'Erro ao salvar livro.', 'erro');
    return;
  }

  mostrarMensagem(id ? 'Livro atualizado com sucesso.' : 'Livro cadastrado com sucesso.', 'sucesso');
  cancelarEdicaoLivro();
  carregarLivrosBibliotecario();
}

async function carregarEmprestimosBibliotecario() {
  const tabela = document.getElementById('tabelaEmprestimos');
  const resposta = await chamarApi('/emprestimos');

  if (!resposta.ok) {
    tabela.innerHTML = '<tr><td colspan="6">Erro ao carregar empréstimos.</td></tr>';
    return;
  }

  const emprestimos = resposta.dados?.emprestimos || resposta.dados || [];

  if (emprestimos.length === 0) {
    tabela.innerHTML = '<tr><td colspan="6">Nenhum empréstimo registrado.</td></tr>';
    return;
  }

  tabela.innerHTML = '';
  emprestimos.forEach((emp) => {
    const linha = document.createElement('tr');
    const podeAprovar = emp.status === 'ativo' || emp.status === 'atrasado' || emp.status === 'pendente';

    linha.innerHTML = `
      <td>${emp.leitor_nome || emp.leitor || '-'}</td>
      <td>${emp.livro_titulo || emp.livro || '-'}</td>
      <td>${emp.data_emprestimo || '-'}</td>
      <td>${emp.data_devolucao_prevista || '-'}</td>
      <td>${emp.status}</td>
      <td>${podeAprovar ? '<button type="button" data-acao="aprovar">Aprovar devolução</button>' : '-'}</td>
    `;

    if (podeAprovar) {
      linha.querySelector('[data-acao="aprovar"]').addEventListener('click', async () => {
        const respostaAprovacao = await chamarApi(`/emprestimos/${emp.id}/aprovar-devolucao`, 'PUT');
        if (!respostaAprovacao.ok) {
          mostrarMensagem(respostaAprovacao.dados?.mensagem || 'Erro ao aprovar devolução.', 'erro');
          return;
        }
        mostrarMensagem('Devolução aprovada.', 'sucesso');
        carregarEmprestimosBibliotecario();
        carregarLivrosBibliotecario();
      });
    }

    tabela.appendChild(linha);
  });
}



function inicializarLeitor() {
  const usuario = getUsuario();
  if (!usuario || usuario.perfil !== 'leitor') {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('nomeUsuario').textContent = usuario.nome;
  document.getElementById('btnSair').addEventListener('click', logout);

  carregarLivrosLeitor();
  carregarMeusEmprestimos();
}

async function carregarLivrosLeitor() {
  const tabela = document.getElementById('tabelaLivros');
  const resposta = await chamarApi('/livros');

  if (!resposta.ok) {
    tabela.innerHTML = '<tr><td colspan="6">Erro ao carregar livros.</td></tr>';
    return;
  }

  const livros = resposta.dados?.livros || resposta.dados || [];

  if (livros.length === 0) {
    tabela.innerHTML = '<tr><td colspan="6">Nenhum livro disponível.</td></tr>';
    return;
  }

  tabela.innerHTML = '';
  livros.forEach((livro) => {
    const linha = document.createElement('tr');
    const disponivel = livro.quantidade_disponivel > 0;

    linha.innerHTML = `
      <td>${livro.id}</td>
      <td>${livro.titulo}</td>
      <td>${livro.autor}</td>
      <td>${livro.ano_publicacao ?? '-'}</td>
      <td>${livro.quantidade_disponivel}</td>
      <td>
        <button type="button" data-acao="solicitar" ${disponivel ? '' : 'disabled'}>
          ${disponivel ? 'Solicitar empréstimo' : 'Indisponível'}
        </button>
      </td>
    `;

    if (disponivel) {
      linha.querySelector('[data-acao="solicitar"]').addEventListener('click', async () => {
        const dataPrevista = prompt('Data de devolução prevista (AAAA-MM-DD):');
        if (!dataPrevista) return;

        const resposta2 = await chamarApi('/emprestimos', 'POST', {
          livro_id: livro.id,
          data_devolucao_prevista: dataPrevista,
        });

        if (!resposta2.ok) {
          mostrarMensagem(resposta2.dados?.mensagem || 'Erro ao solicitar empréstimo.', 'erro');
          return;
        }

        mostrarMensagem('Empréstimo solicitado com sucesso.', 'sucesso');
        carregarLivrosLeitor();
        carregarMeusEmprestimos();
      });
    }

    tabela.appendChild(linha);
  });
}

async function carregarMeusEmprestimos() {
  const tabela = document.getElementById('tabelaEmprestimos');
  const resposta = await chamarApi('/emprestimos/meus');

  if (!resposta.ok) {
    tabela.innerHTML = '<tr><td colspan="5">Erro ao carregar empréstimos.</td></tr>';
    return;
  }

  const emprestimos = resposta.dados?.emprestimos || resposta.dados || [];

  if (emprestimos.length === 0) {
    tabela.innerHTML = '<tr><td colspan="5">Você não possui empréstimos.</td></tr>';
    return;
  }

  tabela.innerHTML = '';
  emprestimos.forEach((emp) => {
    const linha = document.createElement('tr');
    const podeDevolver = emp.status === 'ativo' || emp.status === 'atrasado';

    linha.innerHTML = `
      <td>${emp.livro_titulo || emp.livro || '-'}</td>
      <td>${emp.data_emprestimo || '-'}</td>
      <td>${emp.data_devolucao_prevista || '-'}</td>
      <td>${emp.status}</td>
      <td>${podeDevolver ? '<button type="button" data-acao="devolver">Solicitar devolução</button>' : '-'}</td>
    `;

    if (podeDevolver) {
      linha.querySelector('[data-acao="devolver"]').addEventListener('click', async () => {
        if (!confirm('Solicitar devolução deste livro?')) return;

        const respostaDevolucao = await chamarApi(`/emprestimos/${emp.id}/solicitar-devolucao`, 'PUT');
        if (!respostaDevolucao.ok) {
          mostrarMensagem(respostaDevolucao.dados?.mensagem || 'Erro ao solicitar devolução.', 'erro');
          return;
        }

        mostrarMensagem('Devolução solicitada com sucesso.', 'sucesso');
        carregarMeusEmprestimos();
      });
    }

    tabela.appendChild(linha);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('formLogin')) {
    inicializarLogin();
  } else if (document.getElementById('formLivro')) {
    inicializarBibliotecario();
  } else if (document.getElementById('tabelaLivros') && document.title.includes('Leitor')) {
    inicializarLeitor();
  }
});
