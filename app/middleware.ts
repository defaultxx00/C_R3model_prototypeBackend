import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware de Proteção de Rotas
 * 
 * Este middleware controla o acesso às rotas do sistema:
 * 
 * 1. Redireciona usuários não autenticados para /login
 * 2. Usuários autenticados são redirecionados para sua área correta
 * 3. Protege rotas de dashboard (aluno e professor)
 * 4. Evita que alunoaccess área do professor e vice-versa
 * 
 * Rotas protegidas:
 * - /dashboard/* (requer autenticação)
 * - /login (redireciona se já estiver logado)
 * - / (página inicial - redireciona se logado)
 */

export function middleware(request: NextRequest) {
  // Recupera cookie de autenticação
  const token = request.cookies.get("auth_token");
  
  // Verifica se está tentando acessar rota de dashboard
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  // Verifica se está na página de login
  const isLogin = request.nextUrl.pathname === "/login";
  // Verifica se está na raiz (página inicial)
  const isRoot = request.nextUrl.pathname === "/";

  // Tratamento especial para página inicial (/)
  // Se usuário estiver logado, redireciona para sua área
  if (isRoot) {
    if (token) {
      try {
        const user = JSON.parse(token.value);
        if (user.tipo === "aluno") {
          return NextResponse.redirect(new URL("/dashboard/aluno", request.url));
        } else if (user.tipo === "professor") {
          return NextResponse.redirect(new URL("/dashboard/professor", request.url));
        }
      } catch {
        // Token inválido, permite acesso à página inicial
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  // Protege rotas de dashboard
  // Se não tiver token, redireciona para login
  if (!token && isDashboard) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Se estiver na página de login, permite acesso SEMPRE
  // Não verifica sessão aqui - a página de login trata isso
  if (isLogin) {
    return NextResponse.next();
  }

  // Protege contra acesso cruzado
  // Aluno não pode acessar área do professor e vice-versa
  if (token && isDashboard) {
    try {
      const user = JSON.parse(token.value);
      const path = request.nextUrl.pathname;
      
      // Se é aluno, não pode acessar rotas de professor
      if (user.tipo === "aluno" && path.includes("/professor")) {
        return NextResponse.redirect(new URL("/dashboard/aluno", request.url));
      }
      // Se é professor, não pode acessar rotas de aluno
      if (user.tipo === "professor" && path.includes("/aluno")) {
        return NextResponse.redirect(new URL("/dashboard/professor", request.url));
      }
    } catch {
      return NextResponse.next();
    }
  }

  // Permite acesso se todas as verificações passaram
  return NextResponse.next();
}

/**
 * Configuração de quais rotas o middleware deve interceptar
 * Aplica a todas as rotas de dashboard, login e raiz
 */
export const config = {
  matcher: ["/dashboard/:path*", "/"],
};
