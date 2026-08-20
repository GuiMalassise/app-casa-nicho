"use client";

import { useActionState } from "react";
import { criarLancamento } from "./actions";
import { Botao } from "@/components/botao";

const inputClass =
  "rounded border border-ink/20 bg-bone px-3 py-2 text-sm outline-none focus:border-bordeaux";

export function LancamentoForm() {
  const [state, formAction, pending] = useActionState(criarLancamento, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <select name="tipo" defaultValue="despesa" className={inputClass}>
        <option value="despesa">Despesa</option>
        <option value="receita">Receita</option>
      </select>
      <input name="categoria" placeholder="Categoria" required className={`${inputClass} w-40`} />
      <input
        type="number"
        name="valor"
        placeholder="Valor (R$)"
        min={0}
        step="0.01"
        required
        className={`${inputClass} w-32`}
      />
      <input
        type="date"
        name="data"
        required
        defaultValue={new Date().toISOString().slice(0, 10)}
        className={inputClass}
      />
      <Botao type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Novo lançamento"}
      </Botao>
      {state?.erro && <p className="w-full text-xs text-bordeaux">{state.erro}</p>}
    </form>
  );
}
