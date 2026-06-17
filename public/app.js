
const BASE_URL = '/api';
let livrosBibliotecario = [];
let usuariosBibliotecario = [];


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
  carregarUsuariosBibliotecario();
  carregarEmprestimosBibliotecario();

  document.getElementById('formLivro').addEventListener('submit', salvarLivro);
  document.getElementById('btnCancelarEdicao').addEventListener('click', cancelarEdicaoLivro);
  document.getElementById('formUsuario').addEventListener('submit', salvarUsuario);
  document.getElementById('btnCancelarUsuario').addEventListener('click', cancelarEdicaoUsuario);
  document.getElementById('formEmprestimo').addEventListener('submit', salvarEmprestimoBibliotecario);

  const dataPrevista = document.getElementById('emprestimoDataPrevista');
  dataPrevista.min = hojeMaisDias(1);
  dataPrevista.value = hojeMaisDias(7);
}

async function carregarLivrosBibliotecario() {
  const tabela = document.getElementById('tabelaLivros');
  const resposta = await chamarApi('/livros');

  if (!resposta.ok) {
    tabela.innerHTML = '<tr><td colspan="6">Erro ao carregar livros.</td></tr>';
    return;
  }

  const livros = resposta.dados?.livros || resposta.dados || [];
  livrosBibliotecario = livros;
  atualizarSelectLivrosEmprestimo();

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
      carregarEmprestimosBibliotecario();
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
  carregarEmprestimosBibliotecario();
}

async function carregarUsuariosBibliotecario() {
  const tabela = document.getElementById('tabelaUsuarios');
  const resposta = await chamarApi('/usuarios');

  if (!resposta.ok) {
    tabela.innerHTML = '<tr><td colspan="5">Erro ao carregar usuários.</td></tr>';
    return;
  }

  const usuarios = resposta.dados?.usuarios || resposta.dados || [];
  usuariosBibliotecario = usuarios;
  atualizarSelectLeitoresEmprestimo();

  if (usuarios.length === 0) {
    tabela.innerHTML = '<tr><td colspan="5">Nenhum usuário cadastrado.</td></tr>';
    return;
  }

  tabela.innerHTML = '';
  usuarios.forEach((usuarioItem) => {
    const linha = document.createElement('tr');
    linha.innerHTML = `
      <td>${usuarioItem.id}</td>
      <td>${usuarioItem.nome}</td>
      <td>${usuarioItem.email}</td>
      <td>${usuarioItem.perfil}</td>
      <td>
        <button type="button" data-acao="editar">Editar</button>
        <button type="button" data-acao="excluir">Excluir</button>
      </td>
    `;

    linha.querySelector('[data-acao="editar"]').addEventListener('click', () => {
      preencherFormularioUsuario(usuarioItem);
    });

    linha.querySelector('[data-acao="excluir"]').addEventListener('click', async () => {
      const usuarioLogado = getUsuario();
      if (usuarioLogado?.id === usuarioItem.id) {
        mostrarMensagem('Você não pode excluir o próprio usuário logado.', 'erro');
        return;
      }

      if (!confirm(`Remover o usuário "${usuarioItem.nome}"?`)) return;

      const respostaExclusao = await chamarApi(`/usuarios/${usuarioItem.id}`, 'DELETE');
      if (!respostaExclusao.ok) {
        mostrarMensagem(respostaExclusao.dados?.mensagem || 'Erro ao remover usuário.', 'erro');
        return;
      }

      mostrarMensagem('Usuário removido com sucesso.', 'sucesso');
      carregarUsuariosBibliotecario();
      carregarEmprestimosBibliotecario();
    });

    tabela.appendChild(linha);
  });
}

function preencherFormularioUsuario(usuarioItem) {
  document.getElementById('usuarioId').value = usuarioItem.id;
  document.getElementById('usuarioNome').value = usuarioItem.nome;
  document.getElementById('usuarioEmail').value = usuarioItem.email;
  document.getElementById('usuarioSenha').value = '';
  document.getElementById('usuarioSenha').required = true;
  document.getElementById('usuarioPerfil').value = usuarioItem.perfil;

  document.getElementById('tituloFormUsuario').textContent = 'Editar usuário';
  document.getElementById('btnSalvarUsuario').textContent = 'Salvar alterações';
  document.getElementById('btnCancelarUsuario').style.display = 'inline-block';
}

function cancelarEdicaoUsuario() {
  document.getElementById('formUsuario').reset();
  document.getElementById('usuarioId').value = '';
  document.getElementById('usuarioSenha').required = true;
  document.getElementById('tituloFormUsuario').textContent = 'Cadastrar novo usuário';
  document.getElementById('btnSalvarUsuario').textContent = 'Cadastrar';
  document.getElementById('btnCancelarUsuario').style.display = 'none';
}

async function salvarUsuario(e) {
  e.preventDefault();
  esconderMensagem();

  const id = document.getElementById('usuarioId').value;
  const nome = document.getElementById('usuarioNome').value;
  const email = document.getElementById('usuarioEmail').value;
  const senha = document.getElementById('usuarioSenha').value;
  const perfil = document.getElementById('usuarioPerfil').value;

  const corpo = { nome, email, senha, perfil };
  const resposta = id
    ? await chamarApi(`/usuarios/${id}`, 'PUT', corpo)
    : await chamarApi('/usuarios', 'POST', corpo);

  if (!resposta.ok) {
    mostrarMensagem(resposta.dados?.mensagem || 'Erro ao salvar usuário.', 'erro');
    return;
  }

  mostrarMensagem(id ? 'Usuário atualizado com sucesso.' : 'Usuário cadastrado com sucesso.', 'sucesso');
  cancelarEdicaoUsuario();
  carregarUsuariosBibliotecario();
}

function atualizarSelectLivrosEmprestimo() {
  const select = document.getElementById('emprestimoLivro');
  if (!select) return;

  const opcoes = livrosBibliotecario
    .filter((livro) => livro.quantidade_disponivel > 0)
    .map((livro) => {
      const texto = `${livro.titulo} - ${livro.autor} (${livro.quantidade_disponivel} disp.)`;
      return `<option value="${livro.id}">${texto}</option>`;
    });

  select.innerHTML = '<option value="">Selecione um livro</option>' + opcoes.join('');
}

function atualizarSelectLeitoresEmprestimo() {
  const select = document.getElementById('emprestimoLeitor');
  if (!select) return;

  const opcoes = usuariosBibliotecario
    .filter((usuarioItem) => usuarioItem.perfil === 'leitor')
    .map((usuarioItem) => (
      `<option value="${usuarioItem.id}">${usuarioItem.nome} - ${usuarioItem.email}</option>`
    ));

  select.innerHTML = '<option value="">Selecione um leitor</option>' + opcoes.join('');
}

async function salvarEmprestimoBibliotecario(e) {
  e.preventDefault();
  esconderMensagem();

  const idLivro = document.getElementById('emprestimoLivro').value;
  const idLeitor = document.getElementById('emprestimoLeitor').value;
  const dataDevolucaoPrevista = document.getElementById('emprestimoDataPrevista').value;

  const resposta = await chamarApi('/emprestimos', 'POST', {
    id_livro: idLivro,
    id_leitor: idLeitor,
    data_devolucao_prevista: dataDevolucaoPrevista,
  });

  if (!resposta.ok) {
    mostrarMensagem(resposta.dados?.mensagem || 'Erro ao cadastrar empréstimo.', 'erro');
    return;
  }

  mostrarMensagem('Empréstimo cadastrado com sucesso.', 'sucesso');
  document.getElementById('formEmprestimo').reset();
  document.getElementById('emprestimoDataPrevista').value = hojeMaisDias(7);
  carregarLivrosBibliotecario();
  carregarEmprestimosBibliotecario();
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
    const botoes = [];

    if (podeAprovar) {
      botoes.push('<button type="button" data-acao="aprovar">Aprovar devolução</button>');
    }

    botoes.push('<button type="button" data-acao="excluir">Excluir</button>');

    linha.innerHTML = `
      <td>${emp.leitor_nome || emp.leitor || '-'}</td>
      <td>${emp.livro_titulo || emp.livro || '-'}</td>
      <td>${emp.data_emprestimo || '-'}</td>
      <td>${emp.data_devolucao_prevista || '-'}</td>
      <td>${emp.status}</td>
      <td>${botoes.join(' ')}</td>
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

    linha.querySelector('[data-acao="excluir"]').addEventListener('click', async () => {
      if (!confirm('Excluir este empréstimo?')) return;

      const respostaExclusao = await chamarApi(`/emprestimos/${emp.id}`, 'DELETE');
      if (!respostaExclusao.ok) {
        mostrarMensagem(respostaExclusao.dados?.mensagem || 'Erro ao excluir empréstimo.', 'erro');
        return;
      }

      mostrarMensagem('Empréstimo excluído com sucesso.', 'sucesso');
      carregarEmprestimosBibliotecario();
      carregarLivrosBibliotecario();
    });

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
          id_leitor: getUsuario().id,
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
  const usuario = getUsuario();
  const resposta = await chamarApi(`/emprestimos/meus?id_leitor=${usuario.id}`);

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
