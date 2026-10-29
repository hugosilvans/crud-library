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

-- Contas exclusivamente de demonstração. Senha local: Estudo123!
INSERT INTO usuario (nome, email, senha, perfil) VALUES
('Bibliotecário Demo', 'biblioteca@example.com', 'scrypt$5bd07a1455a6546320d1d8ed4829e308$ba182f0f235a51d7c68cd5c02022ef22fc75ba70e49327d00b64fcc5b8d82bac00b70c2df6cb4b8165a17190f2d80a7b61a5cdf418ba1fe1aca56d9356396223', 'bibliotecario'),
('Leitor Um', 'leitor1@example.com', 'scrypt$f30c14c199bdfcdb233c60f32c2f599a$df926558761486545a038b24bab15cf1c813142f345a4040044b30b891f2d0214ad55088a167a78ae6bf783211e224aa3ba7c585f7091b04e8a6a2f0a3d40c5e', 'leitor'),
('Leitor Dois', 'leitor2@example.com', 'scrypt$f403a32ca6f7898ed26933fdf54c0d3d$88ff9c1bd979e116f38d44c603fd4f134a3fbd8c2b0709b41c33c4c58a634d2558e9f163c09a68e58713a253e7610a700917cddf65685a34484b69dd952ab7ee', 'leitor'),
('Leitor Três', 'leitor3@example.com', 'scrypt$d7ce478a3d3f686af044bcc7c1b24c1c$48e0c47f184770b82225bfc06fe4ffe82b6c5c919ce6debc24355b97bb40d3c1b04a7298621202e6fefabfd5781f5914eb7c4b39e413925e0b509d4a88684d44', 'leitor'),
('Leitor Quatro', 'leitor4@example.com', 'scrypt$c9741026a89b8ce59606b2e3256287d1$c5b7663de3a856fc0c36bf9e5a7423a0bcc93554ad0488ead626984fac4b2901efafa397efd309ea1f71d50550c649ce52206c957c9d74e5ed0a759b6e1d338f', 'leitor');

INSERT INTO livro (titulo, autor, ano_publicacao, quantidade_disponivel)
VALUES 
('O Pequeno Príncipe', 'Antoine de Saint-Exupéry', 1943, 3),
('Dom Casmurro', 'Machado de Assis', 1899, 5),
('A Hora da Estrela', 'Clarice Lispector', 1977, 2),
('O Senhor dos Anéis', 'J.R.R. Tolkien', 1954, 5),
('Memórias Postumas de Brás Cubas', 'Machado de Assis', 1881, 3),
('Harry Potter e a Pedra Filosofal', 'J.K. Rowling', 1997, 10),
('Capitães da Areia', 'Jorge Amado', 1937, 6);

INSERT INTO emprestimo
(id_livro, id_leitor, data_emprestimo, data_devolucao_prevista, data_devolucao_real, status)
VALUES
(1, 2, '2026-06-10', '2026-06-24', NULL, 'ativo'),
(2, 3, '2026-05-01', '2026-05-15', '2026-05-13', 'devolvido'),
(4, 4, '2026-05-20', '2026-06-03', NULL, 'atrasado'),
(6, 5, '2026-06-15', '2026-06-29', NULL, 'ativo');

  
