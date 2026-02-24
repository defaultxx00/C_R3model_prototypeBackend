-- Schema do Banco de Dados - Sistema Barracred Conecta
-- MySQL / MariaDB

-- Tabela de Professores
CREATE TABLE IF NOT EXISTS professores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Alunos
CREATE TABLE IF NOT EXISTS alunos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    cidade VARCHAR(255),
    serie VARCHAR(50),
    biografia TEXT,
    status ENUM('ativo', 'inativo', 'pendente') DEFAULT 'pendente',
    professor_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE SET NULL
);

-- Tabela de Solicitações de Alteração de Perfil (Aluno -> Professor)
CREATE TABLE IF NOT EXISTS solicitacoes_alteracao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    professor_id INT NOT NULL,
    campo_alterado VARCHAR(100) NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT NOT NULL,
    status ENUM('pendente', 'aprovada', 'rejeitada') DEFAULT 'pendente',
    resposta_professor TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE,
    FOREIGN KEY (professor_id) REFERENCES professores(id) ON DELETE CASCADE
);

-- Tabela de Posts do Blog
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    conteudo TEXT NOT NULL,
    likes INT DEFAULT 0,
    comentarios INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aluno_id) REFERENCES alunos(id) ON DELETE CASCADE
);

-- Inserir dados iniciais - Professores (senha: 123456)
INSERT INTO professores (nome, email, senha, telefone) VALUES
('Professor Admin', 'professor@barracred.com', '$2a$10$rQEY7z7JXQxBJHJJJDFFDODLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL', '(14) 99999-9999');

-- Inserir dados iniciais - Alunos (senha: 123456)
INSERT INTO alunos (nome, email, senha, telefone, cidade, serie, biografia, status, professor_id) VALUES
('João Silva Santos', 'joao@aluno.com', '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', '(14) 99999-9999', 'Barra Bonita - SP', '2º Ano do Ensino Médio', 'Estudante apaixonado por tecnologia e sempre em busca de novos conhecimentos.', 'ativo', 1),
('Maria Oliveira', 'maria@aluno.com', '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', '(14) 88888-8888', 'Igaraçu do Tietê - SP', '3º Ano do Ensino Médio', 'Aluna dedicada ao programa Barracred Conecta.', 'ativo', 1),
('Pedro Costa', 'pedro@aluno.com', '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', '(14) 77777-7777', 'Barra Bonita - SP', '1º Ano do Ensino Médio', 'Estudante de TI.', 'inativo', 1),
('Ana Julia Rodrigues', 'ana@aluno.com', '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', '(14) 66666-6666', 'Barra Bonita - SP', '2º Ano do Ensino Médio', 'Participante do programa Barracred Conecta.', 'ativo', 1);
