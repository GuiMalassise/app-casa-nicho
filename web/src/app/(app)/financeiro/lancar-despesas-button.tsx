"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { lancarDespesasDoMes } from "./actions";
import { Botao } from "@/components/botao";

export function LancarDespesasButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function executar() {
    setErro(null);
    startTransition(async () => {
      const resultado = await lancarDespesasDoMes();
      if ("erro" in resultado && resultado.erro) setErro(resultado.erro);
      else router.refresh();
    });
  }

  return (
    <div>
      <Botao type="button" disabled={pending} onClick={executar}>
        {pending ? "Lançando..." : "Lançar despesas fixas do mês"}
      </Botao>
      {erro && <p className="mt-1 text-xs text-bordeaux">{erro}</p>}
    </div>
  );
}
