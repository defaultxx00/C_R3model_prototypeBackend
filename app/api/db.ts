export type Usuario = {
  id: number;
  nome: string;
  email: string;
  senha: string;
  tipo: string;
  professorId?: number;
};

export const db: {
  alunos: Array<{
    id: number;
    nome: string;
    email: string;
    telefone: string;
    cidade: string;
    serie: string;
    biografia: string;
    status: string;
    professorId: number;
  }>;
  usuarios: Record<string, Usuario>;
  solicitacoes: Array<{
    id: number;
    alunoId: number;
    alunoNome: string;
    professorId: number;
    campoAlterado: string;
    valorAnterior: string;
    valorNovo: string;
    status: string;
    respostaProfessor: string | null;
    createdAt: string;
  }>;
} = {
  alunos: [
    { id: 1, nome: "Aluno 1", email: "aluno1@bcred.com", telefone: "(14) 99999-9999", cidade: "Barra Bonita - SP", serie: "2º Ano do Ensino Médio", biografia: "Estudante do programa Barracred Conecta.", status: "ativo", professorId: 1 },
    { id: 2, nome: "Aluno 2", email: "aluno2@bcred.com", telefone: "(14) 88888-8888", cidade: "Igaraçu do Tietê - SP", serie: "3º Ano do Ensino Médio", biografia: "Aluna dedicada ao programa.", status: "ativo", professorId: 2 },
  ],
  usuarios: {
    'aluno1@bcred.com': { id: 1, nome: 'Aluno 1', email: 'aluno1@bcred.com', senha: '123', tipo: 'aluno', professorId: 1 },
    'aluno2@bcred.com': { id: 2, nome: 'Aluno 2', email: 'aluno2@bcred.com', senha: '123', tipo: 'aluno', professorId: 2 },
    'dev1@dev': { id: 1, nome: 'Professor Dev 1', email: 'dev1@dev', senha: 'dev', tipo: 'professor' },
    'dev2@dev': { id: 2, nome: 'Professor Dev 2', email: 'dev2@dev', senha: 'dev', tipo: 'professor' },
  },
  solicitacoes: [],
};
