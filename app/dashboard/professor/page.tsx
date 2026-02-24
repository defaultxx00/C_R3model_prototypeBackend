"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

interface Solicitacao {
  id: number;
  alunoId: number;
  professorId: number;
  campoAlterado: string;
  valorAnterior: string;
  valorNovo: string;
  status: string;
  respostaProfessor: string | null;
  createdAt: string;
}

interface User {
  id: number;
  nome: string;
  email: string;
  tipo: string;
}

export default function DashboardProfessor() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
  const [modalNotificacoesAberto, setModalNotificacoesAberto] = useState(false);
  const [alunoEditando, setAlunoEditando] = useState<Aluno | null>(null);
  const [novoAluno, setNovoAluno] = useState({ nome: "", email: "", telefone: "", serie: "", cidade: "", biografia: "" });
  const [user, setUser] = useState<User | null>(null);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const carregarDados = async () => {
    const resAlunos = await fetch("/api/alunos?tipo=alunos");
    const dataAlunos = await resAlunos.json();
    setAlunos(dataAlunos);

    const resSolicitacoes = await fetch("/api/alunos?tipo=solicitacoes&professorId=1");
    const dataSolicitacoes = await resSolicitacoes.json();
    setSolicitacoes(dataSolicitacoes);
    setNotificacoesNaoLidas(dataSolicitacoes.filter((s: Solicitacao) => s.status === "pendente").length);
  };

  useEffect(() => {
    if (isAuthenticated) return;
    
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      router.push("/login");
      return;
    }
    
    const userData = JSON.parse(savedUser);
    if (userData.tipo !== "professor") {
      router.push("/dashboard/aluno");
      return;
    }
    
    setUser(userData);
    setIsAuthenticated(true);
    carregarDados();
  }, [router, isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const alunosFiltrados = alunos.filter((aluno) => {
    const matchBusca = aluno.nome.toLowerCase().includes(busca.toLowerCase()) || aluno.email.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === "todos" || aluno.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const handleMudarStatus = async (id: number, novoStatus: string) => {
    const res = await fetch("/api/alunos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "editar", data: { id, status: novoStatus } }),
    });
    const data = await res.json();
    if (data.success) {
      setAlunos(alunos.map((a) => (a.id === id ? { ...a, status: novoStatus } : a)));
    }
  };

  const handleExcluirAluno = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este aluno?")) return;
    
    const res = await fetch("/api/alunos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "excluir", data: { id } }),
    });
    const data = await res.json();
    if (data.success) {
      setAlunos(alunos.filter((a) => a.id !== id));
    }
  };

  const handleCriarAluno = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/alunos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "criar", data: { ...novoAluno, professorId: user?.id || 1 } }),
    });
    const data = await res.json();
    if (data.success) {
      setAlunos([...alunos, data.aluno]);
      setModalAberto(false);
      setNovoAluno({ nome: "", email: "", telefone: "", serie: "", cidade: "", biografia: "" });
    }
  };

  const handleEditarAluno = (aluno: Aluno) => {
    setAlunoEditando(aluno);
    setModalEdicaoAberto(true);
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alunoEditando) return;

    const res = await fetch("/api/alunos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "editar", data: alunoEditando }),
    });
    const data = await res.json();
    if (data.success) {
      setAlunos(alunos.map((a) => (a.id === alunoEditando.id ? alunoEditando : a)));
      setModalEdicaoAberto(false);
      setAlunoEditando(null);
    }
  };

  const handleResponderSolicitacao = async (solicitacaoId: number, status: "aprovada" | "rejeitada", resposta: string) => {
    const res = await fetch("/api/alunos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "responder_solicitacao", data: { solicitacaoId, status, resposta } }),
    });
    const data = await res.json();
    if (data.success) {
      await carregarDados();
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "ativo": return "bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]";
      case "inativo": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "pendente": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  const getCampoLabel = (campo: string) => {
    const labels: Record<string, string> = {
      nome: "Nome",
      email: "E-mail",
      cidade: "Cidade",
      biografia: "Biografia",
      telefone: "Telefone",
    };
    return labels[campo] || campo;
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#050505] text-gray-300 font-sans">
      
      <aside className="w-72 bg-black/60 border-r border-white/5 backdrop-blur-2xl flex flex-col z-20">
        <div className="p-8 flex flex-col items-center">
          <img src="https://www.barracred.com.br/wp-content/uploads/2023/08/barracred.png" alt="Logo" className="h-12 mb-4 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
          <h2 className="text-sm font-black tracking-[0.3em] text-white">PROFESSOR</h2>
          <div className="w-12 h-[2px] bg-red-600 mt-2 shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] font-bold transition-all">
            <i className="fas fa-users"></i> Gerenciar Alunos
          </button>
          <button onClick={() => setModalAberto(true)} className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all">
            <i className="fas fa-user-plus"></i> Novo Aluno
          </button>
          <button 
            onClick={() => setModalNotificacoesAberto(true)}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all relative"
          >
            <i className="fas fa-bell"></i> Notificações
            {notificacoesNaoLidas > 0 && (
              <span className="absolute right-4 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{notificacoesNaoLidas}</span>
            )}
          </button>
          <Link href="/" className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-white/5 text-gray-400 transition-all">
            <i className="fas fa-home"></i> Site Principal
          </Link>
        </nav>

        <div className="p-6">
          <button onClick={handleLogout} className="w-full py-3 rounded-xl border border-red-900/50 text-red-500 font-bold hover:bg-red-600 hover:text-white transition-all text-xs tracking-widest">
            LOGOUT SYSTEM
          </button>
        </div>
      </aside>

      <main className="flex-1 p-10 relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 blur-[150px] -z-10" />

        <header className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter">Database <span className="text-red-600 uppercase text-2xl ml-2 tracking-widest font-light">Alunos</span></h1>
            <p className="text-gray-500 mt-2">Monitoramento de acessos e usuários ativos no Barracred Conecta.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-center backdrop-blur-md">
              <span className="block text-2xl font-bold text-white">{alunos.length}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-tighter">Total Registrado</span>
            </div>
            <div className="bg-red-6/10 border border-red-600/20 rounded-2xl px-6 py-3 text-center backdrop-blur-md">
              <span className="block text-2xl font-bold text-red-500">{alunos.filter(a => a.status === 'ativo').length}</span>
              <span className="text-[10px] text-red-400 uppercase tracking-tighter">Online agora</span>
            </div>
          </div>
        </header>

        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative group">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-red-500 transition-colors"></i>
            <input 
              type="text" 
              placeholder="Pesquisar por nome ou e-mail..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all text-sm"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <select 
            className="bg-white/5 border border-white/10 rounded-2xl px-6 outline-none focus:border-red-600 transition-all text-sm text-gray-400"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="todos">Todos os Status</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
            <option value="pendente">Pendentes</option>
          </select>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-[11px] uppercase tracking-[0.2em] text-gray-500">
                <th className="px-8 py-5 font-bold">Identificação do Aluno</th>
                <th className="px-6 py-5 font-bold">Série / Local</th>
                <th className="px-6 py-5 font-bold">Status</th>
                <th className="px-8 py-5 font-bold text-right">Controles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {alunosFiltrados.map((aluno) => (
                <tr key={aluno.id} className="hover:bg-red-600/5 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-white font-bold shadow-lg shadow-red-900/20">
                        {aluno.nome.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-red-500 transition-colors">{aluno.nome}</div>
                        <div className="text-xs text-gray-500 font-mono">{aluno.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-bold text-gray-400">{aluno.serie}</div>
                    <div className="text-[10px] text-gray-600 uppercase">{aluno.cidade}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(aluno.status)}`}>
                      {aluno.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right space-x-2">
                    <button onClick={() => handleEditarAluno(aluno)} className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all"><i className="fas fa-edit text-xs"></i></button>
                    <button 
                      onClick={() => handleMudarStatus(aluno.id, aluno.status === 'ativo' ? 'inativo' : 'ativo')}
                      className="p-2.5 bg-white/5 rounded-xl hover:bg-red-600/20 text-gray-400 hover:text-red-500 transition-all"
                    >
                      <i className={`fas ${aluno.status === 'ativo' ? 'fa-ban' : 'fa-check'} text-xs`}></i>
                    </button>
                    <button 
                      onClick={() => handleExcluirAluno(aluno.id)}
                      className="p-2.5 bg-white/5 rounded-xl hover:bg-red-600/20 text-gray-400 hover:text-red-500 transition-all"
                    >
                      <i className="fas fa-trash text-xs"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {modalAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm bg-black/60">
            <div className="bg-[#0f0f0f] border border-red-600/30 w-full max-w-lg rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.15)] animate-in zoom-in-95 duration-200">
              <div className="bg-red-600 px-8 py-6 flex justify-between items-center">
                <h2 className="text-white font-black uppercase tracking-widest">New Entry / Aluno</h2>
                <button onClick={() => setModalAberto(false)} className="text-white/60 hover:text-white"><i className="fas fa-times"></i></button>
              </div>
              <form onSubmit={handleCriarAluno} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Full Name</label>
                  <input type="text" className="w-full bg-black border border-white/10 rounded-xl p-4 outline-none focus:border-red-600 transition-all" placeholder="Nome do estudante" value={novoAluno.nome} onChange={e => setNovoAluno({...novoAluno, nome: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Email Address</label>
                  <input type="email" className="w-full bg-black border border-white/10 rounded-xl p-4 outline-none focus:border-red-600 transition-all" placeholder="exemplo@aluno.com" value={novoAluno.email} onChange={e => setNovoAluno({...novoAluno, email: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Série</label>
                    <input type="text" className="w-full bg-black border border-white/10 rounded-xl p-4 outline-none focus:border-red-600 transition-all" placeholder="2º Ano EM" value={novoAluno.serie} onChange={e => setNovoAluno({...novoAluno, serie: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Cidade</label>
                    <input type="text" className="w-full bg-black border border-white/10 rounded-xl p-4 outline-none focus:border-red-600 transition-all" placeholder="Cidade - UF" value={novoAluno.cidade} onChange={e => setNovoAluno({...novoAluno, cidade: e.target.value})} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button type="button" onClick={() => setModalAberto(false)} className="py-4 rounded-xl text-gray-500 font-bold hover:bg-white/5 transition-all">ABORTAR</button>
                  <button type="submit" className="bg-red-600 py-4 rounded-xl text-white font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all">REGISTRAR</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {modalEdicaoAberto && alunoEditando && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm bg-black/60">
            <div className="bg-[#0f0f0f] border border-red-600/30 w-full max-w-lg rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.15)] animate-in zoom-in-95 duration-200">
              <div className="bg-red-600 px-8 py-6 flex justify-between items-center">
                <h2 className="text-white font-black uppercase tracking-widest">Editar Aluno</h2>
                <button onClick={() => { setModalEdicaoAberto(false); setAlunoEditando(null); }} className="text-white/60 hover:text-white"><i className="fas fa-times"></i></button>
              </div>
              <form onSubmit={handleSalvarEdicao} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Nome</label>
                  <input type="text" className="w-full bg-black border border-white/10 rounded-xl p-4 outline-none focus:border-red-600 transition-all" value={alunoEditando.nome} onChange={e => setAlunoEditando({...alunoEditando, nome: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">E-mail</label>
                  <input type="email" className="w-full bg-black border border-white/10 rounded-xl p-4 outline-none focus:border-red-600 transition-all" value={alunoEditando.email} onChange={e => setAlunoEditando({...alunoEditando, email: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Série</label>
                    <input type="text" className="w-full bg-black border border-white/10 rounded-xl p-4 outline-none focus:border-red-600 transition-all" value={alunoEditando.serie} onChange={e => setAlunoEditando({...alunoEditando, serie: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Cidade</label>
                    <input type="text" className="w-full bg-black border border-white/10 rounded-xl p-4 outline-none focus:border-red-600 transition-all" value={alunoEditando.cidade} onChange={e => setAlunoEditando({...alunoEditando, cidade: e.target.value})} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Biografia</label>
                  <textarea className="w-full bg-black border border-white/10 rounded-xl p-4 outline-none focus:border-red-600 transition-all" rows={3} value={alunoEditando.biografia} onChange={e => setAlunoEditando({...alunoEditando, biografia: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button type="button" onClick={() => { setModalEdicaoAberto(false); setAlunoEditando(null); }} className="py-4 rounded-xl text-gray-500 font-bold hover:bg-white/5 transition-all">CANCELAR</button>
                  <button type="submit" className="bg-red-600 py-4 rounded-xl text-white font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all">SALVAR</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {modalNotificacoesAberto && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm bg-black/60"
            onClick={() => setModalNotificacoesAberto(false)}
          >
            <div 
              className="bg-[#0f0f0f] border border-red-600/30 w-full max-w-2xl rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.15)] animate-in zoom-in-95 duration-200 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-red-600 px-8 py-6 flex justify-between items-center sticky top-0">
                <h2 className="text-white font-black uppercase tracking-widest">Solicitações de Alteração</h2>
                <button onClick={() => setModalNotificacoesAberto(false)} className="text-white/60 hover:text-white text-xl">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="p-8 space-y-4">
                {solicitacoes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhuma solicitação pendente</p>
                ) : (
                  solicitacoes.map((sol) => (
                    <div key={sol.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(sol.status)}`}>
                            {sol.status}
                          </span>
                          <p className="text-gray-400 text-sm mt-2">
                            <strong className="text-white">Campo:</strong> {getCampoLabel(sol.campoAlterado)}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(sol.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-black/30 p-3 rounded-lg">
                          <p className="text-[10px] text-gray-500 uppercase">Valor Anterior</p>
                          <p className="text-white text-sm">{sol.valorAnterior}</p>
                        </div>
                        <div className="bg-red-600/10 p-3 rounded-lg border border-red-600/30">
                          <p className="text-[10px] text-red-400 uppercase">Novo Valor</p>
                          <p className="text-white text-sm">{sol.valorNovo}</p>
                        </div>
                      </div>

                      {sol.status === "pendente" ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleResponderSolicitacao(sol.id, "aprovada", "Alteração aprovada pelo professor")}
                            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-all"
                          >
                            APROVAR
                          </button>
                          <button 
                            onClick={() => handleResponderSolicitacao(sol.id, "rejeitada", "Alteração rejeitada pelo professor")}
                            className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-all"
                          >
                            REJEITAR
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">
                          <strong className="text-white">Resposta:</strong> {sol.respostaProfessor}
                        </p>
                      )}
                    </div>
                  ))
                )}
                
                <button 
                  onClick={() => setModalNotificacoesAberto(false)}
                  className="w-full py-3 mt-4 bg-white/10 hover:bg-white/20 text-gray-400 rounded-xl font-bold transition-all"
                >
                  FECHAR
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
