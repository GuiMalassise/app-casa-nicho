"use client";

import { useActionState } from "react";
import { criarDespesaFixa } from "./actions";
import { Botao } from "@/components/botao";

const inputClass =
  "rounded border border-ink/20 bg-bone px-3 py-2 text-sm outline-none focus:border-bordeaux";

export function DespesaFixaForm() {
  const [state, formAction, pending] = useActionState(criarDespesaFixa, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input name="nome" placeholder="Nome da despesa" required className={`${inputClass} w-48`} />
      <input
        type="number"
        name="valor"
        placeholder="Valor (R$)"
        min={0}
        step="0.01"
        required
        className={`${inputClass} w-32`}
      />
      <Botao type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Nova despesa fixa"}
      </Botao>
      {state?.erro && <p className="w-full text-xs text-bordeaux">{state.erro}</p>}
    </form>
  );
}
