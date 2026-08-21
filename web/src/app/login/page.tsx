"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Botao } from "@/components/botao";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setCarregando(false);

    if (error) {
      setErro("E-mail ou senha incorretos.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-8">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icone.png" alt="" className="h-12 w-12 rounded object-cover" />
        <h1 className="font-display text-3xl italic text-bordeaux">
          PerfumeOS
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-lg border border-ink/10 bg-white/40 p-8"
      >
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm text-ink/70">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-ink/20 bg-bone px-3 py-2 text-sm outline-none focus:border-bordeaux"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="senha" className="text-sm text-ink/70">
            Senha
          </label>
          <input
            id="senha"
            type="password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded border border-ink/20 bg-bone px-3 py-2 text-sm outline-none focus:border-bordeaux"
          />
        </div>

        {erro && <p className="text-sm text-bordeaux">{erro}</p>}

        <Botao type="submit" disabled={carregando} className="w-full">
          {carregando ? "Entrando..." : "Entrar"}
        </Botao>
      </form>
    </main>
  );
}
