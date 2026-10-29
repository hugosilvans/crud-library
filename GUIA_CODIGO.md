# Guia de leitura do código

Este guia descreve a organização para estudar e explicar o repositório. Os comentários do código destacam regras, contratos, validações e responsabilidade pela memória ou pelos dados.

## Por onde começar

| Caminho | Responsabilidade |
| --- | --- |
| [index.js](index.js) | Interpreta JSON e monta arquivos estáticos e API. |
| [src/routes/api.js](src/routes/api.js) | Autenticação, perfil e acesso aos empréstimos. |
| [src/security/passwords.js](src/security/passwords.js) | Valida usuário e calcula/verifica hash de senha. |
| [src/security/sessions.js](src/security/sessions.js) | Tokens aleatórios, expiração e logout. |
| [public/app.js](public/app.js) | Eventos da interface, API e inserção segura de texto. |
| [test](test) | Regressões de autenticação e autorização. |

## Como estudar uma alteração

1. Identifique a entrada: argumento, formulário ou requisição HTTP.
2. Localize a validação e a função que transforma os dados.
3. Observe a saída e o comportamento quando algo falha.
4. Execute um exemplo pequeno antes de mudar a regra.
5. Consulte o diff do Git para distinguir formatação de mudanças de comportamento.

## Convenções

- `.editorconfig` define codificação, indentação e final de linha.
- Comentários explicam motivos e restrições; não repetem cada comando.
- Arquivos gerados, dependências e credenciais locais ficam fora do versionamento.
- Um `main` pertence ao seu exercício; projetos de aula independentes não formam um único executável.
- Créditos, autoria anterior e licenças são preservados.
- `.prettierrc.json` registra a formatação dos arquivos web.

## Inventário de fontes próprias e didáticas

1 arquivo(s) `.css`, 3 arquivo(s) `.html`, 13 arquivo(s) `.js`.

## Limite desta organização

A formatação e os comentários não comprovam que todos os exercícios estejam completos. Os testes adicionados cobrem os fluxos descritos no README; validar sintaxe não equivale a testar todos os resultados. Veja também as instruções e limitações específicas do projeto.

Os testes HTTP usam um banco simulado. A importação SQL, a migração de senhas e as operações de empréstimo devem ser conferidas em uma instância MySQL de desenvolvimento.
