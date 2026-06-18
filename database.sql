CREATE DATABASE IF NOT EXISTS biblioteca;
USE biblioteca;

CREATE TABLE usuario (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  email VARCHAR(80) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  perfil ENUM('bibliotecario', 'leitor') NOT NULL
);

CREATE TABLE livro (
  id_livro INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(80) NOT NULL,
  autor VARCHAR(80) NOT NULL,
  ano_publicacao INT,
  quantidade_disponivel INT NOT NULL DEFAULT 0
);

CREATE TABLE emprestimo (
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

INSERT INTO usuario (nome, email, senha, perfil) 
VALUES 

('Maria', 'Maria@gmail.com', '1234', 'bibliotecario'),
('Ranyelson', 'Ranyelson@gmail.com', '1234', 'leitor'),
('Ana Carolina', 'Anac@gmail.com', '1234', 'leitor'),
('Pedro', 'Joao@gmail.com', '1234', 'leitor'),
('Camila', 'Camila@gmail.com', '1234', 'leitor');

INSERT INTO livro (titulo, autor, ano_publicacao, quantidade_disponivel)
VALUES 
('O Pequeno Príncipe', 'Antoine de Saint-Exupéry', 1943, 3),
('Dom Casmurro', 'Machado de Assis', 1899, 5),
('A Hora da Estrela', 'Clarice Lispector', 1977, 2),
('O Senhor dos Anéis', 'J.R.R. Tolkien', 1954, 5),
('Memórias Postumas de Brás Cubas', 'Machado de Assis', 1881, 3),
('Harry Potter e a Pedra Filosofal', 'J.K. Rowling', 1997, 10),
('Capitães da Areia', 'Jorge Amado', 1937, 6);



  
