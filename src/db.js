const mysql = require ('mysql2/promise');

// Cria um "pool" de conexoes com o MySQL/MariaDB.
// Pool significa que a aplicacao reutiliza conexoes em vez de abrir uma nova
// conexao do zero para cada consulta, deixando o sistema mais eficiente.
const pool = mysql.createPool({
    // O banco esta rodando na propria maquina.
    host: 'localhost',

    // Usuario padrao do XAMPP/MariaDB local.
    user: 'root',

    // Senha vazia porque o projeto esta configurado assim para ambiente local.
    password: '',

    // Nome do banco criado pelo arquivo database.sql.
    database: 'biblioteca',

    // Se todas as conexoes estiverem ocupadas, novas consultas esperam na fila.
    waitForConnections: true,

    // Numero maximo de conexoes simultaneas abertas pelo pool.
    connectionLimit: 10,
});

// Exporta o pool para que as rotas possam fazer consultas SQL.
module.exports = pool;
