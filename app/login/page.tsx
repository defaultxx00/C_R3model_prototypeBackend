"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [tipo, setTipo] = useState<"aluno" | "professor">("aluno");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user.tipo === "aluno") {
        router.push("/dashboard/aluno");
      } else if (user.tipo === "professor") {
        router.push("/dashboard/professor");
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha, tipo }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user));
        
        if (data.user.tipo === "aluno") {
          router.push("/dashboard/aluno");
        } else {
          router.push("/dashboard/professor");
        }
      } else {
        setErro(data.message || "Credenciais inválidas");
      }
    } catch {
      setErro("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative z-10">
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-red-600 to-transparent shadow-[0_0_15px_rgba(220,38,38,0.8)]" />

        <div className="p-8">
          <header className="flex flex-col items-center mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Barracred <span className="text-red-500">Conecta</span>
            </h1>
            <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest">Área Restrita</p>
          </header>

          <div className="flex bg-white/5 p-1 rounded-xl mb-8 border border-white/5">
            <button
              type="button"
              onClick={() => setTipo("aluno")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-300 font-medium ${
                tipo === "aluno" 
                ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Aluno
            </button>
            <button
              type="button"
              onClick={() => setTipo("professor")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all duration-300 font-medium ${
                tipo === "professor" 
                ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Professor
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase ml-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tipo === "aluno" ? "joao@aluno.com" : "professor@barracred.com"}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600 transition-all duration-300"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase ml-1">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:border-red-600 transition-all duration-300"
                required
              />
            </div>

            {erro && (
              <div className="p-3 bg-red-600/10 border border-red-600/30 rounded-xl text-red-500 text-sm text-center">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-bold py-3.5 rounded-xl shadow-[0_0_25px_rgba(220,38,38,0.3)] hover:shadow-[0_0_35px_rgba(220,38,38,0.5)] transition-all duration-300 transform active:scale-[0.98] disabled:cursor-not-allowed"
            >
              {loading ? "ENTRANDO..." : "ENTRAR NO SISTEMA"}
            </button>
          </form>

          <footer className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Dev: dev@dev / dev<br/>
              Demo: aluno@barracred.com / professor@barracred.com<br/>
              Senha: 123456
            </p>

            <iframe width="560" height="315" src="https://www.youtube.com/embed/44UaY-AN6ho?si=Z9tm1_HFYrTkS25r" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
            </footer>
        </div>
      </div>
    </div>
  );
}
