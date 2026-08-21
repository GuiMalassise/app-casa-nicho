"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { excluirPerfume } from "./actions";

export function ExcluirBotao({ perfumeId, nome }: { perfumeId: string; nome: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function excluir() {
    if (!confirm(`Excluir "${nome}"? Essa ação não pode ser desfeita.`)) return;

    setErro(null);
    startTransition(async () => {
      const resultado = await excluirPerfume(perfumeId);
      if (resultado.erro) setErro(resultado.erro);
      else router.refresh();
    });
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={excluir}
        disabled={pending}
        className="text-xs text-ink/50 hover:text-bordeaux disabled:opacity-60"
      >
        {pending ? "Excluindo..." : "Excluir"}
      </button>
      {erro && <p className="mt-1 text-xs text-bordeaux">{erro}</p>}
    </div>
  );
}
