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

3. Ajuste host, usuário e senha em [src/db.js](src/db.js) conforme seu MySQL local. A configuração atual utiliza `localhost`, usuário `root`, senha vazia e banco `biblioteca`.
4. Inicie o servidor:

```bash
npm start
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

## Contexto e limitações

Trabalho acadêmico identificado no `package.json` como GP 8. A autenticação atual é demonstrativa: o código armazena senhas sem hash e retorna um token fixo. Use dados fictícios e ambiente local. Antes de uma publicação para uso real, será necessário implementar hash de senhas, autenticação e autorização no servidor.

O script `npm test` ainda é um placeholder. O comando `npm run dev` depende de `nodemon`, que não consta nas dependências; para a instalação atual, utilize `npm start`.

## Dependências e versionamento

A pasta `node_modules` é gerada por `npm ci` e não faz parte do código versionado. O `package-lock.json` foi preservado para reproduzir as dependências.
