import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db, type Usuario } from "../db";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tipo = url.searchParams.get("tipo");
  
  if (tipo === "alunos") {
    return NextResponse.json(db.alunos);
  }
  
  if (tipo === "solicitacoes") {
    const professorId = url.searchParams.get("professorId");
    const filtered = professorId ? db.solicitacoes.filter(s => s.professorId === parseInt(professorId)) : db.solicitacoes;
    return NextResponse.json(filtered);
  }
  
  if (tipo === "usuarios") {
    return NextResponse.json(Object.values(db.usuarios));
  }
  
  return NextResponse.json({ message: "Parâmetro 'tipo' requerido" }, { status: 400 });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action, data } = body;

  if (action === "criar") {
    const novoAluno = {
      id: db.alunos.length + 1,
      nome: data.nome,
      email: data.email,
      telefone: data.telefone || "",
      cidade: data.cidade || "",
      serie: data.serie || "",
      biografia: data.biografia || "",
      status: "pendente",
      professorId: data.professorId || 1
    };
    db.alunos.push(novoAluno);
    
    db.usuarios[data.email] = {
      id: novoAluno.id,
      nome: data.nome,
      email: data.email,
      senha: data.senha || "123",
      tipo: "aluno",
      professorId: data.professorId || 1
    } as Usuario;
    
    return NextResponse.json({ success: true, aluno: novoAluno });
  }

  if (action === "editar") {
    const index = db.alunos.findIndex(a => a.id === data.id);
    if (index !== -1) {
      db.alunos[index] = { ...db.alunos[index], ...data };
      return NextResponse.json({ success: true, aluno: db.alunos[index] });
    }
    return NextResponse.json({ success: false, message: "Aluno não encontrado" }, { status: 404 });
  }

  if (action === "excluir") {
    const aluno = db.alunos.find(a => a.id === data.id);
    if (aluno && db.usuarios[aluno.email]) {
      delete db.usuarios[aluno.email];
    }
    db.alunos = db.alunos.filter(a => a.id !== data.id);
    return NextResponse.json({ success: true });
  }

  if (action === "solicitar_alteracao") {
    const aluno = db.alunos.find(a => a.id === data.alunoId);
    const novaSolicitacao = {
      id: db.solicitacoes.length + 1,
      alunoId: data.alunoId,
      alunoNome: aluno?.nome || "Aluno Desconhecido",
      professorId: data.professorId,
      campoAlterado: data.campoAlterado,
      valorAnterior: data.valorAnterior,
      valorNovo: data.valorNovo,
      status: "pendente",
      respostaProfessor: null,
      createdAt: new Date().toISOString()
    };
    db.solicitacoes.push(novaSolicitacao);
    return NextResponse.json({ success: true, solicitacao: novaSolicitacao });
  }

  if (action === "responder_solicitacao") {
    const index = db.solicitacoes.findIndex(s => s.id === data.solicitacaoId);
    if (index !== -1) {
      db.solicitacoes[index].status = data.status;
      db.solicitacoes[index].respostaProfessor = data.resposta;
      
      if (data.status === "aprovada") {
        const alunoIndex = db.alunos.findIndex(a => a.id === db.solicitacoes[index].alunoId);
        if (alunoIndex !== -1) {
          const campo = db.solicitacoes[index].campoAlterado as keyof typeof db.alunos[0];
          (db.alunos[alunoIndex] as Record<string, unknown>)[campo] = db.solicitacoes[index].valorNovo;
        }
      }
      
      return NextResponse.json({ success: true, solicitacao: db.solicitacoes[index] });
    }
    return NextResponse.json({ success: false, message: "Solicitação não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ message: "Ação não reconhecida" }, { status: 400 });
}
