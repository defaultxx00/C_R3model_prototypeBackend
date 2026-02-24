import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * API de Autenticação do Sistema Barracred Conecta
 * 
 * Endpoints disponíveis:
 * - POST /api/auth: Realiza login de usuário (aluno ou professor)
 * - GET /api/auth: Verifica se usuário está autenticado
 */

// Dados mockados de usuários para demonstração
// Em produção, esses dados viriam de um banco de dados real
// Login de desenvolvimento: dev@dev / dev (funciona para ambos os tipos)
const mockUsers: Record<string, { id: number; nome: string; email: string; senha: string; tipo: string; professorId?: number }> = {
  'dev@dev': { id: 0, nome: 'Desenvolvedor', email: 'dev@dev', senha: 'dev', tipo: 'professor' },
  'aluno@barracred.com': { id: 1, nome: 'João Silva Santos', email: 'aluno@barracred.com', senha: '123456', tipo: 'aluno', professorId: 1 },
  'professor@barracred.com': { id: 1, nome: 'Professor Admin', email: 'professor@barracred.com', senha: '123456', tipo: 'professor' },
};

/**
 * POST - Realiza autenticação de usuário
 * 
 * Recebe no body:
 * - email: string - E-mail do usuário
 * - senha: string - Senha do usuário
 * - tipo: string - Tipo de usuário ('aluno' ou 'professor')
 * 
 * Retorna:
 * - success: true + dados do usuário se login for bem-sucedido
 * - success: false + mensagem de erro se credenciais forem inválidas
 */
export async function POST(request: Request) {
  const { email, senha, tipo } = await request.json();

  // Login especial de desenvolvimento (dev@dev / dev)
  // Permite acesso a qualquer área escolhida pelo usuário
  if (email === 'dev@dev' && senha === 'dev') {
    const user = {
      id: 0,
      nome: 'Desenvolvedor',
      email: 'dev@dev',
      tipo: tipo, // Usa o tipo selecionado na aba (aluno ou professor)
      professorId: tipo === 'aluno' ? 1 : undefined
    };

    const response = NextResponse.json({ 
      success: true, 
      user: user
    });

    response.cookies.set("auth_token", JSON.stringify(user), {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  }

  // Procura usuário que corresponda ao email, senha e tipo informados
  const user = Object.values(mockUsers).find(u => u.email === email && u.senha === senha && u.tipo === tipo);

  if (user) {
    // Cria resposta bem-sucedida
    const response = NextResponse.json({ 
      success: true, 
      user: { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo }
    });

    // Define cookie de autenticação com dados do usuário
    // Este cookie será usado pelo middleware para verificar autenticação
    response.cookies.set("auth_token", JSON.stringify({
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo: user.tipo,
      professorId: user.professorId
    }), {
      httpOnly: false,  // Permite acesso via JavaScript (localStorage)
      path: "/",
      maxAge: 60 * 60 * 24 * 7,  // Expira em 7 dias
    });

    return response;
  }

  // Retorna erro se credenciais forem inválidas
  return NextResponse.json({ success: false, message: "Credenciais inválidas" }, { status: 401 });
}

/**
 * GET - Verifica estado de autenticação do usuário
 * 
 * Utilizado pelo frontend para verificar se há uma sessão ativa
 * 
 * Retorna:
 * - authenticated: true + dados do usuário se estiver logado
 * - authenticated: false se não houver sessão ativa
 */
export async function GET(request: NextRequest) {
  // Verifica se existe cookie de autenticação
  const token = request.cookies.get("auth_token");
  
  if (token) {
    try {
      // Tenta parsear os dados do usuário do cookie
      const user = JSON.parse(token.value);
      return NextResponse.json({ authenticated: true, user });
    } catch {
      // Cookie inválido ou corrompido
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  }
  
  // Não há cookie de autenticação
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
