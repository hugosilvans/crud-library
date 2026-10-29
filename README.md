# CRUD Library

Sistema acadêmico de biblioteca com interface web, API em Node.js/Express e banco MySQL. O projeto reúne cadastro e consulta de livros, usuários e empréstimos, além de telas para leitor e bibliotecário.

## Tecnologias

- JavaScript, HTML e CSS
- Node.js e Express
- MySQL com `mysql2/promise`

## Executar localmente

1. Clone o repositório:

```bash
git clone https://github.com/hugosilvans/crud-library.git
cd crud-library
npm ci
```

2. Com o MySQL em execução, importe [database.sql](database.sql) em uma instalação de desenvolvimento. O script cria o banco `biblioteca`, suas tabelas e dados de demonstração. Execute a importação uma vez em um banco novo.

```bash
mysql -u root -p < database.sql
```

3. Copie `.env.example` para `.env` e configure as variáveis `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` e `DB_PORT` para seu MySQL local. Não versione o arquivo `.env`.
4. Inicie o servidor:

```bash
node --env-file=.env index.js
```

5. Acesse [http://localhost:3000](http://localhost:3000). A porta pode ser definida pela variável de ambiente `PORT`.

Use o formulário de cadastro para criar um usuário de demonstração. As telas por perfil estão em [public/leitor.html](public/leitor.html) e [public/bibliotecario.html](public/bibliotecario.html).

## Estrutura

| Caminho | Responsabilidade |
| --- | --- |
| [index.js](index.js) | Inicialização do servidor e arquivos estáticos |
| [public](public/) | Interface web |
| [src/db.js](src/db.js) | Conexão com MySQL |
| [src/routes](src/routes/) | Rotas de autenticação, livros, usuários e empréstimos |
| [database.sql](database.sql) | Estrutura e dados iniciais |

As rotas são montadas sob `/api/auth`, `/api/livros`, `/api/usuarios` e `/api/emprestimos`.

## Contexto

Trabalho acadêmico identificado como GP 8. Consulte a seção de segurança abaixo para os procedimentos atuais.

## Dependências e versionamento

A pasta `node_modules` é gerada por `npm ci` e não faz parte do código versionado. O `package-lock.json` foi preservado para reproduzir as dependências.

## Segurança e execução atualizadas

- Senhas novas usam scrypt com salt aleatório; o cadastro público cria somente leitores.
- As rotas protegidas validam sessão e perfil no servidor. O leitor só acessa seus empréstimos.
- Sessões expiram em uma hora, são revogadas no logout e não sobrevivem ao reinício.
- Banco novo: importe `database.sql`. Contas fictícias: `biblioteca@example.com` (bibliotecário) e `leitor1@example.com` (leitor), senha local `Estudo123!`.
- Banco antigo: faça backup e execute `node --env-file=.env scripts/migrar-senhas.js` antes do login (ou `npm run migrate:passwords` com as variáveis já exportadas). A migração não altera a senha conhecida pelo usuário; transforma o valor armazenado em hash. Depois, troque senhas fracas pelos fluxos administrativos.
- Configure as variáveis de `.env.example`. Com Node.js 20.6+ é possível usar `node --env-file=.env index.js`; `npm start` lê variáveis já exportadas pelo ambiente.
- `npm run dev` usa o modo watch do Node.js. `npm test` valida hash, sessões e bloqueio por perfil, sem conectar ao MySQL.
- A integração completa das operações SQL ainda requer uma instância MySQL local. Esta base continua acadêmica: HTTPS, limitação de tentativas e persistência distribuída de sessões são etapas para hospedagem real.

## Guia do código

Consulte [GUIA_CODIGO.md](GUIA_CODIGO.md) para localizar os módulos, entender as convenções e estudar as alterações.
