import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../db";

export async function POST(request: Request) {
  const { email, senha, tipo } = await request.json();

  if ((email === 'dev1@dev' || email === 'dev2@dev') && senha === 'dev') {
    const userData = db.usuarios[email];
    const user = {
      id: userData.id,
      nome: userData.nome,
      email: email,
      tipo: tipo,
      professorId: tipo === 'aluno' ? userData.id : userData.id
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

  const user = Object.values(db.usuarios).find(u => u.email === email && u.senha === senha && u.tipo === tipo);

  if (user) {
    const response = NextResponse.json({ 
      success: true, 
      user: { id: user.id, nome: user.nome, email: user.email, tipo: user.tipo }
    });

    response.cookies.set("auth_token", JSON.stringify({
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo: user.tipo,
      professorId: user.professorId
    }), {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  }

  return NextResponse.json({ success: false, message: "Credenciais inválidas" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth_token");
  
  if (token) {
    try {
      const user = JSON.parse(token.value);
      return NextResponse.json({ authenticated: true, user });
    } catch {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  }
  
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
