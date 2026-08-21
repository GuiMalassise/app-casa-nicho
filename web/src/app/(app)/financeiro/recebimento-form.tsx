"use client";

import { useActionState } from "react";
import { criarRecebimento } from "./actions";
import { Botao } from "@/components/botao";

const inputClass =
  "max-w-full rounded border border-ink/20 bg-bone px-3 py-2 text-sm outline-none focus:border-bordeaux";

export function RecebimentoForm() {
  const [state, formAction, pending] = useActionState(criarRecebimento, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input
        name="pedidoIdExterno"
        placeholder="Nº do pedido (opcional)"
        className={`${inputClass} w-44`}
      />
      <input
        type="number"
        name="valor"
        placeholder="Valor recebido (R$)"
        min={0}
        step="0.01"
        required
        className={`${inputClass} w-36`}
      />
      <input
        type="date"
        name="recebidoEm"
        required
        defaultValue={new Date().toISOString().slice(0, 10)}
        className={inputClass}
      />
      <Botao type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Registrar recebimento"}
      </Botao>
      {state?.erro && <p className="w-full text-xs text-bordeaux">{state.erro}</p>}
    </form>
  );
}
