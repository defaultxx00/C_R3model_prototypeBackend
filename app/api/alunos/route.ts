import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * API de Gerenciamento de Alunos e Solicitações
 * 
 * Esta API gerencia:
 * - CRUD completo de alunos (Create, Read, Update, Delete)
 * - Sistema de solicitações de alteração de perfil
 * - Aprovação/rejeição de mudanças pelos professores
 * 
 * Endpoints:
 * - GET /api/alunos?tipo=alunos - Lista todos os alunos
 * - GET /api/alunos?tipo=solicitacoes - Lista solicitações pendentes
 * - POST /api/alunos - Executa ações (criar, editar, excluir, solicitar_alteracao, responder_solicitacao)
 */

// Dados mockados em memória (em produção, seria um banco de dados real)
// Armazena lista de alunos do sistema
let alunos = [
  { id: 1, nome: "João Silva Santos", email: "joao@aluno.com", telefone: "(14) 99999-9999", cidade: "Barra Bonita - SP", serie: "2º Ano do Ensino Médio", biografia: "Estudante apaixonado por tecnologia.", status: "ativo", professorId: 1 },
  { id: 2, nome: "Maria Oliveira", email: "maria@aluno.com", telefone: "(14) 88888-8888", cidade: "Igaraçu do Tietê - SP", serie: "3º Ano do Ensino Médio", biografia: "Aluna dedicada.", status: "ativo", professorId: 1 },
  { id: 3, nome: "Pedro Costa", email: "pedro@aluno.com", telefone: "(14) 77777-7777", cidade: "Barra Bonita - SP", serie: "1º Ano do Ensino Médio", biografia: "Estudante de TI.", status: "inativo", professorId: 1 },
  { id: 4, nome: "Ana Julia Rodrigues", email: "ana@aluno.com", telefone: "(14) 66666-6666", cidade: "Barra Bonita - SP", serie: "2º Ano do Ensino Médio", biografia: "Participante do programa.", status: "ativo", professorId: 1 },
];

// Armazena solicitações de alteração de perfil enviadas pelos alunos
const solicitacoes = [
  { id: 1, alunoId: 1, professorId: 1, campoAlterado: "cidade", valorAnterior: "Barra Bonita - SP", valorNovo: "São Paulo - SP", status: "pendente", respostaProfessor: null, createdAt: new Date().toISOString() }
];

/**
 * GET - Lista alunos ou solicitações
 * 
 * Parâmetros via query string:
 * - tipo: 'alunos' ou 'solicitacoes'
 * - professorId: (opcional) filtra solicitações por professor
 * 
 * Retorna:
 * - Lista de alunos ou lista de solicitações
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tipo = url.searchParams.get("tipo");
  
  // Retorna lista de todos os alunos
  if (tipo === "alunos") {
    return NextResponse.json(alunos);
  }
  
  // Retorna lista de solicitações (opcionalmente filtrada por professor)
  if (tipo === "solicitacoes") {
    const professorId = url.searchParams.get("professorId");
    const filtered = professorId ? solicitacoes.filter(s => s.professorId === parseInt(professorId)) : solicitacoes;
    return NextResponse.json(filtered);
  }
  
  return NextResponse.json({ message: "Parâmetro 'tipo' requerido" }, { status: 400 });
}

/**
 * POST - Executa ações de gerenciamento
 * 
 * Ações disponíveis:
 * - criar: Adiciona novo aluno
 * - editar: Atualiza dados de um aluno existente
 * - excluir: Remove um aluno do sistema
 * - solicitar_alteracao: Aluno solicita mudança de perfil (envia para professor)
 * - responder_solicitacao: Professor aprova ou rejeita uma solicitação
 * 
 * Retorna:
 * - success: true + dados processados em caso de sucesso
 * - success: false + mensagem de erro em caso de falha
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { action, data } = body;

  // Ação: Criar novo aluno no sistema
  if (action === "criar") {
    const novoAluno = {
      id: alunos.length + 1,
      ...data,
      status: "pendente",
      professorId: data.professorId || 1
    };
    alunos.push(novoAluno);
    return NextResponse.json({ success: true, aluno: novoAluno });
  }

  // Ação: Editar dados de um aluno existente
  if (action === "editar") {
    const index = alunos.findIndex(a => a.id === data.id);
    if (index !== -1) {
      // Merge dos dados existentes com novos dados
      alunos[index] = { ...alunos[index], ...data };
      return NextResponse.json({ success: true, aluno: alunos[index] });
    }
    return NextResponse.json({ success: false, message: "Aluno não encontrado" }, { status: 404 });
  }

  // Ação: Excluir aluno do sistema
  if (action === "excluir") {
    alunos = alunos.filter(a => a.id !== data.id);
    return NextResponse.json({ success: true });
  }

  // Ação: Aluno solicita alteração de perfil
  // Esta solicitação fica pendente até o professor aprovar ou rejeitar
  if (action === "solicitar_alteracao") {
    const novaSolicitacao = {
      id: solicitacoes.length + 1,
      alunoId: data.alunoId,
      professorId: data.professorId,
      campoAlterado: data.campoAlterado,
      valorAnterior: data.valorAnterior,
      valorNovo: data.valorNovo,
      status: "pendente",
      respostaProfessor: null,
      createdAt: new Date().toISOString()
    };
    solicitacoes.push(novaSolicitacao);
    return NextResponse.json({ success: true, solicitacao: novaSolicitacao });
  }

  // Ação: Professor responde uma solicitação
  // Se aprovada, aplica a mudança automaticamente no perfil do aluno
  if (action === "responder_solicitacao") {
    const index = solicitacoes.findIndex(s => s.id === data.solicitacaoId);
    if (index !== -1) {
      // Atualiza status e resposta da solicitação
      solicitacoes[index].status = data.status;
      solicitacoes[index].respostaProfessor = data.resposta;
      
      // Se aprovada, aplica a mudança no perfil do aluno
      if (data.status === "aprovada") {
        const alunoIndex = alunos.findIndex(a => a.id === solicitacoes[index].alunoId);
        if (alunoIndex !== -1) {
          const campo = solicitacoes[index].campoAlterado as keyof typeof alunos[0];
          (alunos[alunoIndex] as Record<string, unknown>)[campo] = solicitacoes[index].valorNovo;
        }
      }
      
      return NextResponse.json({ success: true, solicitacao: solicitacoes[index] });
    }
    return NextResponse.json({ success: false, message: "Solicitação não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ message: "Ação não reconhecida" }, { status: 400 });
}
