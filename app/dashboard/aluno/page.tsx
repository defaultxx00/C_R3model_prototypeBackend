"use client";

/**
 * Página do Dashboard do Aluno
 * 
 * Funcionalidades:
 * - Visualização e edição de perfil (com solicitação ao professor)
 * - Sistema de blog para publicações
 * - Logout e navegação
 * - Proteção de rota (apenas alunos podem acessar)
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  nome: string;
  email: string;
  tipo: string;
  professorId?: number;
}

interface Aluno {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cidade: string;
  serie: string;
  biografia: string;
  status: string;
  professorId: number;
}

const postsExemplo = [
  {
    id: 1,
    titulo: "Minha experiência no Barracred Conecta",
    conteudo: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...",
    data: "15/02/2025",
    likes: 24,
    comentarios: 8,
  },
  {
    id: 2,
    titulo: "O que aprendi no módulo de TI",
    conteudo: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat...",
    data: "10/02/2025",
    likes: 18,
    comentarios: 5,
  },
];

export default function DashboardAluno() {
  const [aba, setAba] = useState<"perfil" | "blog">("perfil");
  const [editando, setEditando] = useState(false);
  const [isNovoPostOpen, setIsNovoPostOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  const [perfil, setPerfil] = useState({
    nome: "Aluno",
    email: "aluno@bcred.com",
    telefone: "(14) 99999-9999",
    cidade: "Barra Bonita - SP",
    serie: "2º Ano do Ensino Médio",
    biografia: "Estudante do programa Barracred Conecta.",
  });
  
  const [perfilOriginal, setPerfilOriginal] = useState({ ...perfil });
  const [posts, setPosts] = useState(postsExemplo);
  const [novoPost, setNovoPost] = useState({ titulo: "", conteudo: "" });
  const router = useRouter();

  const carregarPerfil = async (userId: number) => {
    try {
      const res = await fetch("/api/alunos?tipo=alunos");
      const dataAlunos = await res.json();
      const alunoAtual = dataAlunos.find((a: Aluno) => a.id === userId);
      if (alunoAtual) {
        const dadosPerfil = {
          nome: alunoAtual.nome,
          email: alunoAtual.email,
          telefone: alunoAtual.telefone,
          cidade: alunoAtual.cidade,
          serie: alunoAtual.serie,
          biografia: alunoAtual.biografia,
        };
        setPerfil(dadosPerfil);
        setPerfilOriginal(dadosPerfil);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      router.push("/login");
      return;
    }
    const userData = JSON.parse(savedUser);
    if (userData.tipo !== "aluno") {
      router.push("/dashboard/professor");
      return;
    }
    setUser(userData);
    setPerfil({
      nome: userData.nome || "Aluno",
      email: userData.email || "aluno@bcred.com",
      telefone: "(14) 99999-9999",
      cidade: "Barra Bonita - SP",
      serie: "2º Ano do Ensino Médio",
      biografia: "Estudante do programa Barracred Conecta.",
    });
    setPerfilOriginal({
      nome: userData.nome || "Aluno",
      email: userData.email || "aluno@bcred.com",
      telefone: "(14) 99999-9999",
      cidade: "Barra Bonita - SP",
      serie: "2º Ano do Ensino Médio",
      biografia: "Estudante do programa Barracred Conecta.",
    });
    carregarPerfil(userData.id);
    const interval = setInterval(() => carregarPerfil(userData.id), 5000);
    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const handleCancelarEdicao = () => {
    setPerfil(perfilOriginal);
    setEditando(false);
    setMensagem(null);
  };

  const handleSolicitarAlteracao = async () => {
    setLoading(true);
    setMensagem(null);

    try {
      const alteracoes: { campo: string; anterior: string; novo: string }[] = [];
      
      if (perfil.nome !== perfilOriginal.nome) {
        alteracoes.push({ campo: "nome", anterior: perfilOriginal.nome, novo: perfil.nome });
      }
      if (perfil.email !== perfilOriginal.email) {
        alteracoes.push({ campo: "email", anterior: perfilOriginal.email, novo: perfil.email });
      }
      if (perfil.cidade !== perfilOriginal.cidade) {
        alteracoes.push({ campo: "cidade", anterior: perfilOriginal.cidade, novo: perfil.cidade });
      }
      if (perfil.biografia !== perfilOriginal.biografia) {
        alteracoes.push({ campo: "biografia", anterior: perfilOriginal.biografia, novo: perfil.biografia });
      }

      for (const alt of alteracoes) {
        const res = await fetch("/api/alunos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "solicitar_alteracao",
            data: {
              alunoId: user?.id || 1,
              professorId: user?.professorId || 1,
              campoAlterado: alt.campo,
              valorAnterior: alt.anterior,
              valorNovo: alt.novo,
            },
          }),
        });
        
        const data = await res.json();
        if (!data.success) {
          throw new Error("Erro ao enviar solicitação");
        }
      }

      setMensagem({ tipo: "sucesso", texto: "Solicitação enviada ao professor para aprovação!" });
      setEditando(false);
    } catch {
      setMensagem({ tipo: "erro", texto: "Erro ao enviar solicitação. Tente novamente." });
    } finally {
      setLoading(false);
    }
  };

  const handleCriarPost = (e: React.FormEvent) => {
    e.preventDefault();
    const post = {
      id: posts.length + 1,
      titulo: novoPost.titulo,
      conteudo: novoPost.conteudo,
      data: new Date().toLocaleDateString("pt-BR"),
      likes: 0,
      comentarios: 0,
    };
    setPosts([post, ...posts]);
    setNovoPost({ titulo: "", conteudo: "" });
    setIsNovoPostOpen(false);
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#050505] text-gray-200 font-sans">
      <aside className="w-64 bg-black/50 border-r border-green-900/30 backdrop-blur-xl flex flex-col">
        <div className="p-6 flex flex-col items-center border-b border-white/5">
          <img
            src="https://www.barracred.com.br/wp-content/uploads/2023/08/barracred.png"
            alt="Logo"
            className="h-10 mb-2 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]"
          />
          <span className="text-xs tracking-[0.2em] font-bold text-green-500">PAINEL DO ALUNO</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setAba("perfil")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              aba === "perfil" ? "bg-green-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]" : "hover:bg-white/5"
            }`}
          >
            <i className="fas fa-user text-sm"></i> Meu Perfil
          </button>
          <button
            onClick={() => setAba("blog")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              aba === "blog" ? "bg-green-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]" : "hover:bg-white/5"
            }`}
          >
            <i className="fas fa-blog text-sm"></i> Meu Blog
          </button>
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-all text-gray-400">
            <i className="fas fa-home text-sm"></i> Voltar ao Site
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-green-500 border border-green-500/20 rounded-lg hover:bg-green-500/10 transition-all"
          >
            <i className="fas fa-sign-out-alt"></i> SAIR
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto relative">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-green-600/5 blur-[100px] pointer-events-none" />
        
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Bem-vindo, <span className="text-green-600">{user.nome.split(" ")[0]}!</span>
          </h1>
          <p className="text-gray-500">Controle de hardware e publicações do sistema.</p>
        </header>

        {aba === "perfil" && (
          <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
              <div className="bg-gradient-to-r from-green-900/40 to-black p-8 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-black border-2 border-green-600 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                    <i className="fas fa-user text-green-600"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{perfil.nome}</h2>
                    <p className="text-green-400 text-sm font-mono">{perfil.serie}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (editando) {
                      handleCancelarEdicao();
                    } else {
                      setPerfilOriginal({ ...perfil });
                      setEditando(true);
                    }
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-all border border-white/10"
                >
                  {editando ? "Cancelar" : "Editar Perfil"}
                </button>
              </div>

              <div className="p-8">
                {mensagem && (
                  <div className={`mb-6 p-4 rounded-xl ${
                    mensagem.tipo === "sucesso" 
                      ? "bg-green-600/10 border border-green-600/30 text-green-500" 
                      : "bg-green-600/10 border border-green-600/30 text-green-500"
                  }`}>
                    {mensagem.texto}
                  </div>
                )}

                {editando ? (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase text-gray-500 font-bold">Nome</label>
                        <input className="bg-black/50 border border-white/10 rounded-lg p-3 focus:border-green-600 outline-none transition-all" value={perfil.nome} onChange={e => setPerfil({...perfil, nome: e.target.value})} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase text-gray-500 font-bold">E-mail</label>
                        <input className="bg-black/50 border border-white/10 rounded-lg p-3 focus:border-green-600 outline-none transition-all" value={perfil.email} onChange={e => setPerfil({...perfil, email: e.target.value})} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase text-gray-500 font-bold">Cidade</label>
                        <input className="bg-black/50 border border-white/10 rounded-lg p-3 focus:border-green-600 outline-none transition-all" value={perfil.cidade} onChange={e => setPerfil({...perfil, cidade: e.target.value})} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs uppercase text-gray-500 font-bold">Telefone</label>
                        <input className="bg-black/50 border border-white/10 rounded-lg p-3 focus:border-green-600 outline-none transition-all" value={perfil.telefone} onChange={e => setPerfil({...perfil, telefone: e.target.value})} />
                    </div>
                    <div className="col-span-2 flex flex-col gap-2">
                        <label className="text-xs uppercase text-gray-500 font-bold">Bio</label>
                        <textarea rows={3} className="bg-black/50 border border-white/10 rounded-lg p-3 focus:border-green-600 outline-none transition-all" value={perfil.biografia} onChange={e => setPerfil({...perfil, biografia: e.target.value})} />
                    </div>
                    <button 
                      onClick={handleSolicitarAlteracao}
                      disabled={loading}
                      className="col-span-2 bg-green-600 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:bg-green-700 disabled:bg-green-800 transition-all"
                    >
                      {loading ? "ENVIANDO SOLICITAÇÃO..." : "ENVIAR SOLICITAÇÃO AO PROFESSOR"}
                    </button>
                    <p className="col-span-2 text-xs text-gray-500 text-center">
                      Suas alterações serão enviadas para aprovação do professor
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-gray-400"><i className="fas fa-envelope text-green-600 w-5"></i> {perfil.email}</div>
                        <div className="flex items-center gap-3 text-gray-400"><i className="fas fa-phone text-green-600 w-5"></i> {perfil.telefone}</div>
                        <div className="flex items-center gap-3 text-gray-400"><i className="fas fa-map-marker-alt text-green-600 w-5"></i> {perfil.cidade}</div>
                    </div>
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                        <h4 className="text-xs font-bold text-green-500 uppercase mb-2 tracking-widest">Biografia</h4>
                        <p className="text-sm text-gray-300 leading-relaxed italic">&quot;{perfil.biografia}&quot;</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {aba === "blog" && (
          <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                Minhas Publicações
              </h2>
              <button 
                onClick={() => setIsNovoPostOpen(!isNovoPostOpen)}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
              >
                <i className={`fas ${isNovoPostOpen ? 'fa-times' : 'fa-plus'}`}></i> {isNovoPostOpen ? 'Fechar' : 'Novo Post'}
              </button>
            </div>

            {isNovoPostOpen && (
              <form onSubmit={handleCriarPost} className="bg-white/5 border border-green-600/30 p-6 rounded-2xl space-y-4 shadow-[0_0_30px_rgba(220,38,38,0.1)]">
                <input 
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 outline-none focus:border-green-600 transition-all" 
                  placeholder="Título da publicação" 
                  value={novoPost.titulo}
                  onChange={e => setNovoPost({...novoPost, titulo: e.target.value})}
                  required
                />
                <textarea 
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 outline-none focus:border-green-600 transition-all" 
                  placeholder="Conteúdo do post..." 
                  rows={4}
                  value={novoPost.conteudo}
                  onChange={e => setNovoPost({...novoPost, conteudo: e.target.value})}
                  required
                />
                <button type="submit" className="w-full bg-green-600 py-3 rounded-xl font-bold shadow-lg shadow-green-600/20">PUBLICAR AGORA</button>
              </form>
            )}

            <div className="grid gap-4">
              {posts.map((post) => (
                <div key={post.id} className="group bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-green-600/50 transition-all backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button className="p-2 bg-white/5 rounded-md hover:bg-green-600/20 hover:text-green-500"><i className="fas fa-edit"></i></button>
                    <button className="p-2 bg-white/5 rounded-md hover:bg-green-600/20 hover:text-green-500"><i className="fas fa-trash"></i></button>
                  </div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-green-500 transition-colors">{post.titulo}</h3>
                      <span className="text-xs text-gray-500 font-mono">{post.data}</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">{post.conteudo}</p>
                  <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest border-t border-white/5 pt-4">
                    <span className="flex items-center gap-1 hover:text-green-500 cursor-pointer"><i className="fas fa-heart"></i> {post.likes} LIKES</span>
                    <span className="flex items-center gap-1 hover:text-green-500 cursor-pointer"><i className="fas fa-comment"></i> {post.comentarios} COMENTÁRIOS</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
