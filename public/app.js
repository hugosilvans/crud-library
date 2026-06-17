/*
  ============================================================
  APP.JS - O "CEREBRO" DAS TELAS
  ============================================================

  Pense neste arquivo como o atendente da biblioteca.

  O HTML mostra os botoes, formularios e tabelas.
  O CSS deixa tudo bonito.
  Este JavaScript faz a pagina "se mexer".

  Exemplo:
  - A pessoa digita email e senha.
  - O app.js pega esses dados.
  - O app.js pergunta para o backend: "esse usuario existe?"
  - O backend consulta o banco de dados.
  - O app.js recebe a resposta e decide para qual tela mandar a pessoa.

  Entao:
  - Frontend = o que aparece na tela.
  - Backend/API = o servidor que responde pedidos.
  - Banco de dados = onde ficam guardados usuarios, livros e emprestimos.
*/

// Endereco base da API.
// Como o frontend e o backend estao no mesmo projeto, nao precisa escrever
// http://localhost:3000/api toda vez. Basta comecar por /api.
const BASE_URL = '/api';

// Arrays usados pelo painel do bibliotecario.
// Eles guardam os livros e usuarios carregados da API para montar os selects de emprestimo.
// Imagine como duas listas temporarias em cima da mesa:
// uma lista com os livros e outra lista com os usuarios.
let livrosBibliotecario = [];
let usuariosBibliotecario = [];

// Salva os dados de login no navegador.
// localStorage continua guardando os dados mesmo se a pagina for recarregada.
// Pense no localStorage como uma gavetinha do navegador.
// Quando a pessoa entra, guardamos ali quem ela e.
function salvarSessao(token, usuario) {
  localStorage.setItem('token', token);
  localStorage.setItem('usuario', JSON.stringify(usuario));
}

// Recupera o token salvo no login.
// Token e como um cracha simples dizendo: "essa pessoa entrou no sistema".
function getToken() {
  return localStorage.getItem('token');
}

// Recupera o usuario salvo. JSON.parse transforma o texto de volta em objeto JavaScript.
// O usuario foi guardado como texto; JSON.parse transforma esse texto de volta
// em um objeto com nome, email, id e perfil.
function getUsuario() {
  const dados = localStorage.getItem('usuario');
  return dados ? JSON.parse(dados) : null;
}

// Apaga a sessao local e volta para a tela de login.
// E como devolver o cracha e sair da biblioteca.
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = 'index.html';
}

// Retorna a data de hoje somada a uma quantidade de dias no formato AAAA-MM-DD.
// Esse formato e o esperado por inputs do tipo date e pelo backend.
// Exemplo: se hoje fosse 2026-06-17 e dias fosse 7,
// a funcao devolveria uma data parecida com 2026-06-24.
function hojeMaisDias(dias) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString().slice(0, 10);
}

// Funcao central para chamar a API.
// Ela evita repetir fetch, headers, JSON.stringify e tratamento de resposta em todo lugar.
//
// Pense nela como um mensageiro:
// - voce entrega um bilhete dizendo o caminho, o metodo e os dados;
// - ela leva esse pedido ate o backend;
// - depois ela volta com a resposta.
//
// caminho: para onde vai o pedido. Exemplo: /livros
// metodo: o tipo de pedido. Exemplo: GET, POST, PUT ou DELETE
// corpo: os dados enviados. Exemplo: { email, senha }
async function chamarApi(caminho, metodo = 'GET', corpo = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();

  // Se existir token, envia no cabecalho Authorization.
  // O backend atual nao valida esse token, mas o frontend ja fica preparado para isso.
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const opcoes = { method: metodo, headers };

  // GET normalmente nao tem corpo. POST, PUT e DELETE podem ter.
  // JSON.stringify transforma um objeto JavaScript em texto JSON,
  // que e o formato que o backend entende.
  if (corpo) opcoes.body = JSON.stringify(corpo);

  // fetch e a funcao do navegador que faz pedidos HTTP.
  // Ela e como "ir ate o servidor e pedir alguma coisa".
  const resposta = await fetch(BASE_URL + caminho, opcoes);
  let dados = null;

  // Tenta ler JSON. Se a resposta vier vazia, nao deixa a aplicacao quebrar.
  try {
    dados = await resposta.json();
  } catch (e) {
    dados = null;
  }

  // ok indica se o status HTTP foi de sucesso, como 200 ou 201.
  return { ok: resposta.ok, dados };
}

// Mostra uma mensagem visual na tela.
// Exemplo: "Livro cadastrado com sucesso" ou "Email ou senha invalidos".
function mostrarMensagem(texto, tipo) {
  const msg = document.getElementById('mensagem');
  if (!msg) return;

  msg.textContent = texto;
  msg.style.display = 'block';
  msg.className = 'mensagem' + (tipo === 'sucesso' ? ' sucesso' : '');
}

// Esconde a mensagem da tela.
// Usamos isso antes de uma nova acao para limpar avisos antigos.
function esconderMensagem() {
  const msg = document.getElementById('mensagem');
  if (!msg) return;
  msg.style.display = 'none';
}

// Inicializa a pagina index.html, que possui login e registro.
//
// Inicializar significa "preparar a pagina para funcionar".
// Aqui o JavaScript liga os botoes e formularios.
// Sem esta funcao, os botoes ate apareceriam, mas nao fariam nada.
function inicializarLogin() {
  const tabLogin = document.getElementById('tabLogin');
  const tabRegistro = document.getElementById('tabRegistro');
  const formLogin = document.getElementById('formLogin');
  const formRegistro = document.getElementById('formRegistro');

  // Botao "Entrar": mostra o formulario de login e esconde o de registro.
  // E como trocar de aba em um caderno: agora estamos vendo a aba Entrar.
  tabLogin.addEventListener('click', () => {
    formLogin.style.display = '';
    formRegistro.style.display = 'none';
    esconderMensagem();
  });

  // Botao "Registrar": mostra o formulario de registro e esconde o de login.
  // Aqui fazemos o contrario: mostramos cadastro e escondemos login.
  tabRegistro.addEventListener('click', () => {
    formRegistro.style.display = '';
    formLogin.style.display = 'none';
    esconderMensagem();
  });

  // Evento submit acontece quando o formulario de login e enviado.
  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que o navegador recarregue a pagina.
    esconderMensagem();

    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;

    const resposta = await chamarApi('/auth/login', 'POST', { email, senha });

    // Se o backend respondeu erro, mostramos uma mensagem e paramos aqui.
    // O return impede que o codigo continue tentando entrar.
    if (!resposta.ok) {
      mostrarMensagem(resposta.dados?.mensagem || 'Email ou senha invalidos.', 'erro');
      return;
    }

    const { token, usuario } = resposta.dados;
    salvarSessao(token, usuario);

    // Redireciona de acordo com o perfil do usuario retornado pelo backend.
    // Bibliotecario vai para a tela de gerenciamento.
    // Leitor vai para a tela onde pode ver livros e emprestimos.
    if (usuario.perfil === 'bibliotecario') {
      window.location.href = 'bibliotecario.html';
    } else {
      window.location.href = 'leitor.html';
    }
  });

  // Evento submit do formulario de cadastro de conta.
  // Funciona parecido com o login, mas envia os dados para criar um usuario novo.
  formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();
    esconderMensagem();

    const nome = document.getElementById('registroNome').value;
    const email = document.getElementById('registroEmail').value;
    const senha = document.getElementById('registroSenha').value;
    const perfil = document.getElementById('registroPerfil').value;

    const resposta = await chamarApi('/auth/registrar', 'POST', { nome, email, senha, perfil });

    if (!resposta.ok) {
      mostrarMensagem(resposta.dados?.mensagem || 'Nao foi possivel registrar.', 'erro');
      return;
    }

    mostrarMensagem('Conta criada com sucesso! Voce ja pode entrar.', 'sucesso');
    formRegistro.reset();
    tabLogin.click();
  });
}

// Inicializa a pagina bibliotecario.html.
//
// Esta e a tela do "funcionario da biblioteca".
// Nela a pessoa pode:
// - cadastrar livros;
// - editar livros;
// - excluir livros;
// - cadastrar usuarios;
// - fazer emprestimos;
// - aprovar devolucoes.
function inicializarBibliotecario() {
  const usuario = getUsuario();

  // Protecao simples: se nao houver usuario logado ou se o perfil nao for bibliotecario,
  // o visitante volta para a tela de login.
  if (!usuario || usuario.perfil !== 'bibliotecario') {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('nomeUsuario').textContent = usuario.nome;
  document.getElementById('btnSair').addEventListener('click', logout);

  // Carrega os dados iniciais das tabelas.
  // Quando a pagina abre, ela ainda nao sabe quais livros, usuarios e emprestimos existem.
  // Por isso precisa pedir esses dados para a API.
  carregarLivrosBibliotecario();
  carregarUsuariosBibliotecario();
  carregarEmprestimosBibliotecario();

  // Liga os formularios e botoes as funcoes correspondentes.
  document.getElementById('formLivro').addEventListener('submit', salvarLivro);
  document.getElementById('btnCancelarEdicao').addEventListener('click', cancelarEdicaoLivro);
  document.getElementById('formUsuario').addEventListener('submit', salvarUsuario);
  document.getElementById('btnCancelarUsuario').addEventListener('click', cancelarEdicaoUsuario);
  document.getElementById('formEmprestimo').addEventListener('submit', salvarEmprestimoBibliotecario);

  // Define uma data minima e uma sugestao inicial para devolucao.
  const dataPrevista = document.getElementById('emprestimoDataPrevista');
  dataPrevista.min = hojeMaisDias(1);
  dataPrevista.value = hojeMaisDias(7);
}

// Busca livros na API e preenche a tabela do bibliotecario.
//
// Imagine que a tela tem uma tabela vazia.
// Esta funcao vai ate o backend, pega os livros e monta uma linha da tabela
// para cada livro encontrado.
async function carregarLivrosBibliotecario() {
  const tabela = document.getElementById('tabelaLivros');
  const resposta = await chamarApi('/livros');

  if (!resposta.ok) {
    tabela.innerHTML = '<tr><td colspan="6">Erro ao carregar livros.</td></tr>';
    return;
  }

  const livros = resposta.dados?.livros || resposta.dados || [];

  // Guarda os livros na lista temporaria para usar em outras partes da tela,
  // como no select de novo emprestimo.
  livrosBibliotecario = livros;
  atualizarSelectLivrosEmprestimo();

  if (livros.length === 0) {
    tabela.innerHTML = '<tr><td colspan="6">Nenhum livro cadastrado.</td></tr>';
    return;
  }

  tabela.innerHTML = '';
  livros.forEach((livro) => {
    const linha = document.createElement('tr');

    // innerHTML cria as celulas da linha usando os dados do livro.
    // Cada <td> e uma celula da tabela.
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

    // Quando clicar em editar, os dados desse livro vao para o formulario.
    linha.querySelector('[data-acao="editar"]').addEventListener('click', () => {
      preencherFormularioLivro(livro);
    });

    // Quando clicar em excluir, primeiro pergunta se a pessoa tem certeza.
    linha.querySelector('[data-acao="excluir"]').addEventListener('click', async () => {
      if (!confirm(`Remover o livro "${livro.titulo}"?`)) return;

      const respostaExclusao = await chamarApi(`/livros/${livro.id}`, 'DELETE');
      if (!respostaExclusao.ok) {
        mostrarMensagem(respostaExclusao.dados?.mensagem || 'Erro ao remover livro.', 'erro');
        return;
      }

      mostrarMensagem('Livro removido com sucesso.', 'sucesso');

      // Depois de excluir, recarrega as tabelas para mostrar a informacao atualizada.
      carregarLivrosBibliotecario();
      carregarEmprestimosBibliotecario();
    });

    tabela.appendChild(linha);
  });
}

// Coloca os dados de um livro no formulario para permitir edicao.
// E como pegar uma ficha do livro e colocar na mesa para corrigir.
function preencherFormularioLivro(livro) {
  document.getElementById('livroId').value = livro.id;
  document.getElementById('livroTitulo').value = livro.titulo;
  document.getElementById('livroAutor').value = livro.autor;
  document.getElementById('livroAno').value = livro.ano_publicacao ?? '';
  document.getElementById('livroQuantidade').value = livro.quantidade_disponivel;

  document.getElementById('tituloFormLivro').textContent = 'Editar livro';
  document.getElementById('btnSalvarLivro').textContent = 'Salvar alteracoes';
  document.getElementById('btnCancelarEdicao').style.display = 'inline-block';
}

// Limpa o formulario de livro e volta para o modo cadastro.
// Se antes estavamos editando, agora voltamos a cadastrar livro novo.
function cancelarEdicaoLivro() {
  document.getElementById('formLivro').reset();
  document.getElementById('livroId').value = '';
  document.getElementById('tituloFormLivro').textContent = 'Cadastrar novo livro';
  document.getElementById('btnSalvarLivro').textContent = 'Cadastrar';
  document.getElementById('btnCancelarEdicao').style.display = 'none';
}

// Cadastra ou atualiza um livro, dependendo se existe ID escondido no formulario.
//
// O campo escondido livroId decide o modo:
// - se livroId esta vazio: e um livro novo;
// - se livroId tem numero: e uma edicao de livro existente.
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

  // Se tem ID, usa PUT para editar. Se nao tem ID, usa POST para criar.
  // POST = criar.
  // PUT = atualizar.
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

// Busca usuarios na API e preenche a tabela do bibliotecario.
// A ideia e igual a dos livros, so que agora com pessoas cadastradas.
async function carregarUsuariosBibliotecario() {
  const tabela = document.getElementById('tabelaUsuarios');
  const resposta = await chamarApi('/usuarios');

  if (!resposta.ok) {
    tabela.innerHTML = '<tr><td colspan="5">Erro ao carregar usuarios.</td></tr>';
    return;
  }

  const usuarios = resposta.dados?.usuarios || resposta.dados || [];

  // Guarda os usuarios para montar o select de leitores no cadastro de emprestimo.
  usuariosBibliotecario = usuarios;
  atualizarSelectLeitoresEmprestimo();

  if (usuarios.length === 0) {
    tabela.innerHTML = '<tr><td colspan="5">Nenhum usuario cadastrado.</td></tr>';
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

      // Evita que o bibliotecario exclua a propria conta enquanto esta logado.
      if (usuarioLogado?.id === usuarioItem.id) {
        mostrarMensagem('Voce nao pode excluir o proprio usuario logado.', 'erro');
        return;
      }

      if (!confirm(`Remover o usuario "${usuarioItem.nome}"?`)) return;

      const respostaExclusao = await chamarApi(`/usuarios/${usuarioItem.id}`, 'DELETE');
      if (!respostaExclusao.ok) {
        mostrarMensagem(respostaExclusao.dados?.mensagem || 'Erro ao remover usuario.', 'erro');
        return;
      }

      mostrarMensagem('Usuario removido com sucesso.', 'sucesso');
      carregarUsuariosBibliotecario();
      carregarEmprestimosBibliotecario();
    });

    tabela.appendChild(linha);
  });
}

// Preenche o formulario de usuario para edicao.
// O bibliotecario clica em Editar e os campos recebem nome, email e perfil.
function preencherFormularioUsuario(usuarioItem) {
  document.getElementById('usuarioId').value = usuarioItem.id;
  document.getElementById('usuarioNome').value = usuarioItem.nome;
  document.getElementById('usuarioEmail').value = usuarioItem.email;
  document.getElementById('usuarioSenha').value = '';
  document.getElementById('usuarioSenha').required = true;
  document.getElementById('usuarioPerfil').value = usuarioItem.perfil;

  document.getElementById('tituloFormUsuario').textContent = 'Editar usuario';
  document.getElementById('btnSalvarUsuario').textContent = 'Salvar alteracoes';
  document.getElementById('btnCancelarUsuario').style.display = 'inline-block';
}

// Limpa o formulario de usuario e volta para o modo cadastro.
// Assim o proximo envio cria um usuario novo em vez de editar o anterior.
function cancelarEdicaoUsuario() {
  document.getElementById('formUsuario').reset();
  document.getElementById('usuarioId').value = '';
  document.getElementById('usuarioSenha').required = true;
  document.getElementById('tituloFormUsuario').textContent = 'Cadastrar novo usuario';
  document.getElementById('btnSalvarUsuario').textContent = 'Cadastrar';
  document.getElementById('btnCancelarUsuario').style.display = 'none';
}

// Cadastra ou edita um usuario.
// Funciona igual ao salvarLivro: se tem ID, edita; se nao tem ID, cadastra.
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
    mostrarMensagem(resposta.dados?.mensagem || 'Erro ao salvar usuario.', 'erro');
    return;
  }

  mostrarMensagem(id ? 'Usuario atualizado com sucesso.' : 'Usuario cadastrado com sucesso.', 'sucesso');
  cancelarEdicaoUsuario();
  carregarUsuariosBibliotecario();
}

// Atualiza o select de livros do formulario de emprestimo.
//
// Select e aquela caixinha de escolher uma opcao.
// Aqui colocamos dentro dela apenas livros que ainda tem quantidade disponivel.
function atualizarSelectLivrosEmprestimo() {
  const select = document.getElementById('emprestimoLivro');
  if (!select) return;

  // Mostra somente livros com estoque maior que zero.
  const opcoes = livrosBibliotecario
    .filter((livro) => livro.quantidade_disponivel > 0)
    .map((livro) => {
      const texto = `${livro.titulo} - ${livro.autor} (${livro.quantidade_disponivel} disp.)`;
      return `<option value="${livro.id}">${texto}</option>`;
    });

  select.innerHTML = '<option value="">Selecione um livro</option>' + opcoes.join('');
}

// Atualiza o select de leitores do formulario de emprestimo.
// Aqui entram somente usuarios com perfil "leitor".
function atualizarSelectLeitoresEmprestimo() {
  const select = document.getElementById('emprestimoLeitor');
  if (!select) return;

  // Emprestimos so podem ser feitos para usuarios com perfil leitor.
  const opcoes = usuariosBibliotecario
    .filter((usuarioItem) => usuarioItem.perfil === 'leitor')
    .map((usuarioItem) => (
      `<option value="${usuarioItem.id}">${usuarioItem.nome} - ${usuarioItem.email}</option>`
    ));

  select.innerHTML = '<option value="">Selecione um leitor</option>' + opcoes.join('');
}

// Cria um novo emprestimo pelo painel do bibliotecario.
//
// Um emprestimo precisa de:
// - qual livro sera emprestado;
// - qual leitor vai pegar o livro;
// - qual a data prevista para devolver.
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
    mostrarMensagem(resposta.dados?.mensagem || 'Erro ao cadastrar emprestimo.', 'erro');
    return;
  }

  mostrarMensagem('Emprestimo cadastrado com sucesso.', 'sucesso');
  document.getElementById('formEmprestimo').reset();
  document.getElementById('emprestimoDataPrevista').value = hojeMaisDias(7);
  carregarLivrosBibliotecario();
  carregarEmprestimosBibliotecario();
}

// Lista todos os emprestimos para o bibliotecario.
// O bibliotecario ve emprestimos de todos os leitores.
async function carregarEmprestimosBibliotecario() {
  const tabela = document.getElementById('tabelaEmprestimos');
  const resposta = await chamarApi('/emprestimos');

  if (!resposta.ok) {
    tabela.innerHTML = '<tr><td colspan="6">Erro ao carregar emprestimos.</td></tr>';
    return;
  }

  const emprestimos = resposta.dados?.emprestimos || resposta.dados || [];

  if (emprestimos.length === 0) {
    tabela.innerHTML = '<tr><td colspan="6">Nenhum emprestimo registrado.</td></tr>';
    return;
  }

  tabela.innerHTML = '';
  emprestimos.forEach((emp) => {
    const linha = document.createElement('tr');

    // So faz sentido aprovar devolucao se o emprestimo ainda nao foi devolvido.
    const podeAprovar = emp.status === 'ativo' || emp.status === 'atrasado' || emp.status === 'pendente';
    const botoes = [];

    if (podeAprovar) {
      botoes.push('<button type="button" data-acao="aprovar">Aprovar devolucao</button>');
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
      // Botao que chama a API para registrar a devolucao do livro.
      linha.querySelector('[data-acao="aprovar"]').addEventListener('click', async () => {
        const respostaAprovacao = await chamarApi(`/emprestimos/${emp.id}/aprovar-devolucao`, 'PUT');
        if (!respostaAprovacao.ok) {
          mostrarMensagem(respostaAprovacao.dados?.mensagem || 'Erro ao aprovar devolucao.', 'erro');
          return;
        }
        mostrarMensagem('Devolucao aprovada.', 'sucesso');
        carregarEmprestimosBibliotecario();
        carregarLivrosBibliotecario();
      });
    }

    // Botao que exclui o emprestimo.
    linha.querySelector('[data-acao="excluir"]').addEventListener('click', async () => {
      if (!confirm('Excluir este emprestimo?')) return;

      const respostaExclusao = await chamarApi(`/emprestimos/${emp.id}`, 'DELETE');
      if (!respostaExclusao.ok) {
        mostrarMensagem(respostaExclusao.dados?.mensagem || 'Erro ao excluir emprestimo.', 'erro');
        return;
      }

      mostrarMensagem('Emprestimo excluido com sucesso.', 'sucesso');
      carregarEmprestimosBibliotecario();
      carregarLivrosBibliotecario();
    });

    tabela.appendChild(linha);
  });
}

// Inicializa a pagina leitor.html.
//
// Esta e a tela da pessoa que pega livros emprestados.
// Ela pode:
// - ver livros;
// - solicitar emprestimo;
// - ver seus proprios emprestimos;
// - solicitar devolucao.
function inicializarLeitor() {
  const usuario = getUsuario();

  // Protecao simples: somente usuarios leitores podem ficar nessa pagina.
  if (!usuario || usuario.perfil !== 'leitor') {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('nomeUsuario').textContent = usuario.nome;
  document.getElementById('btnSair').addEventListener('click', logout);

  carregarLivrosLeitor();
  carregarMeusEmprestimos();
}

// Lista livros para o leitor e mostra um botao para solicitar emprestimo.
// Aqui o leitor nao edita nem exclui livros; ele apenas ve e solicita.
async function carregarLivrosLeitor() {
  const tabela = document.getElementById('tabelaLivros');
  const resposta = await chamarApi('/livros');

  if (!resposta.ok) {
    tabela.innerHTML = '<tr><td colspan="6">Erro ao carregar livros.</td></tr>';
    return;
  }

  const livros = resposta.dados?.livros || resposta.dados || [];

  if (livros.length === 0) {
    tabela.innerHTML = '<tr><td colspan="6">Nenhum livro disponivel.</td></tr>';
    return;
  }

  tabela.innerHTML = '';
  livros.forEach((livro) => {
    const linha = document.createElement('tr');

    // Se quantidade_disponivel for maior que zero, o botao fica ativo.
    // Se for zero, o botao fica desabilitado.
    const disponivel = livro.quantidade_disponivel > 0;

    linha.innerHTML = `
      <td>${livro.id}</td>
      <td>${livro.titulo}</td>
      <td>${livro.autor}</td>
      <td>${livro.ano_publicacao ?? '-'}</td>
      <td>${livro.quantidade_disponivel}</td>
      <td>
        <button type="button" data-acao="solicitar" ${disponivel ? '' : 'disabled'}>
          ${disponivel ? 'Solicitar emprestimo' : 'Indisponivel'}
        </button>
      </td>
    `;

    if (disponivel) {
      // Ao clicar, o leitor informa a data prevista de devolucao.
      linha.querySelector('[data-acao="solicitar"]').addEventListener('click', async () => {
        const dataPrevista = prompt('Data de devolucao prevista (AAAA-MM-DD):');
        if (!dataPrevista) return;

        const resposta2 = await chamarApi('/emprestimos', 'POST', {
          livro_id: livro.id,
          id_leitor: getUsuario().id,
          data_devolucao_prevista: dataPrevista,
        });

        if (!resposta2.ok) {
          mostrarMensagem(resposta2.dados?.mensagem || 'Erro ao solicitar emprestimo.', 'erro');
          return;
        }

        mostrarMensagem('Emprestimo solicitado com sucesso.', 'sucesso');
        carregarLivrosLeitor();
        carregarMeusEmprestimos();
      });
    }

    tabela.appendChild(linha);
  });
}

// Lista apenas os emprestimos do leitor logado.
// Diferente do bibliotecario, o leitor so enxerga os proprios emprestimos.
async function carregarMeusEmprestimos() {
  const tabela = document.getElementById('tabelaEmprestimos');
  const usuario = getUsuario();
  const resposta = await chamarApi(`/emprestimos/meus?id_leitor=${usuario.id}`);

  if (!resposta.ok) {
    tabela.innerHTML = '<tr><td colspan="5">Erro ao carregar emprestimos.</td></tr>';
    return;
  }

  const emprestimos = resposta.dados?.emprestimos || resposta.dados || [];

  if (emprestimos.length === 0) {
    tabela.innerHTML = '<tr><td colspan="5">Voce nao possui emprestimos.</td></tr>';
    return;
  }

  tabela.innerHTML = '';
  emprestimos.forEach((emp) => {
    const linha = document.createElement('tr');

    // So aparece botao de devolucao se o emprestimo ainda estiver aberto.
    const podeDevolver = emp.status === 'ativo' || emp.status === 'atrasado';

    linha.innerHTML = `
      <td>${emp.livro_titulo || emp.livro || '-'}</td>
      <td>${emp.data_emprestimo || '-'}</td>
      <td>${emp.data_devolucao_prevista || '-'}</td>
      <td>${emp.status}</td>
      <td>${podeDevolver ? '<button type="button" data-acao="devolver">Solicitar devolucao</button>' : '-'}</td>
    `;

    if (podeDevolver) {
      linha.querySelector('[data-acao="devolver"]').addEventListener('click', async () => {
        if (!confirm('Solicitar devolucao deste livro?')) return;

        const respostaDevolucao = await chamarApi(`/emprestimos/${emp.id}/solicitar-devolucao`, 'PUT');
        if (!respostaDevolucao.ok) {
          mostrarMensagem(respostaDevolucao.dados?.mensagem || 'Erro ao solicitar devolucao.', 'erro');
          return;
        }

        mostrarMensagem('Devolucao solicitada com sucesso.', 'sucesso');
        carregarMeusEmprestimos();
      });
    }

    tabela.appendChild(linha);
  });
}

// DOMContentLoaded roda quando o HTML terminou de carregar.
// Aqui o mesmo app.js descobre em qual pagina esta e chama a inicializacao correta.
//
// Este projeto usa um unico app.js para tres paginas.
// Por isso ele faz uma pergunta:
// - existe formulario de login? entao estou na index.html;
// - existe formulario de livro? entao estou na bibliotecario.html;
// - existe tabela de livros e o titulo fala Leitor? entao estou na leitor.html.
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('formLogin')) {
    inicializarLogin();
  } else if (document.getElementById('formLivro')) {
    inicializarBibliotecario();
  } else if (document.getElementById('tabelaLivros') && document.title.includes('Leitor')) {
    inicializarLeitor();
  }
});
