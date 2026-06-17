-- Cria o banco de dados biblioteca caso ele ainda nao exista.
CREATE DATABASE IF NOT EXISTS biblioteca;

-- Define que os proximos comandos serao executados dentro desse banco.
USE biblioteca;

-- Tabela de usuarios do sistema.
-- O campo perfil separa bibliotecarios de leitores.
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  email VARCHAR(80) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  perfil ENUM('bibliotecario', 'leitor') NOT NULL
);

-- Tabela de livros cadastrados na biblioteca.
-- quantidade_disponivel representa o estoque que pode ser emprestado.
CREATE TABLE IF NOT EXISTS livro (
  id_livro INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(80) NOT NULL,
  autor VARCHAR(80) NOT NULL,
  ano_publicacao INT,
  quantidade_disponivel INT NOT NULL DEFAULT 0
);

-- Tabela de emprestimos.
-- Ela liga um livro a um leitor usando chaves estrangeiras.
CREATE TABLE IF NOT EXISTS emprestimo (
  id_emprestimo INT AUTO_INCREMENT PRIMARY KEY,
  id_livro INT NOT NULL,
  id_leitor INT NOT NULL,
  data_emprestimo DATE NOT NULL,
  data_devolucao_prevista DATE NOT NULL,
  data_devolucao_real DATE,
  status ENUM('ativo', 'devolvido', 'atrasado') NOT NULL DEFAULT 'ativo',
  FOREIGN KEY (id_livro) REFERENCES livro(id_livro),
  FOREIGN KEY (id_leitor) REFERENCES usuario(id_usuario)
);
