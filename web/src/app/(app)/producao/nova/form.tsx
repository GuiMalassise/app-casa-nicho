"use client";

import { useActionState, useMemo, useState } from "react";
import { registrarProducao } from "../actions";
import { Botao } from "@/components/botao";

const inputClass =
  "w-full rounded border border-ink/20 bg-bone px-3 py-2 text-sm outline-none focus:border-bordeaux";

type VariacaoOpcao = { id: string; label: string; volumeMl: number; disponivelMl: number };

export function NovaProducaoForm({ variacoes }: { variacoes: VariacaoOpcao[] }) {
  const [state, formAction, pending] = useActionState(registrarProducao, null);
  const [variacaoId, setVariacaoId] = useState("");
  const [quantidade, setQuantidade] = useState("");

  const variacaoSelecionada = variacoes.find((v) => v.id === variacaoId);

  const mlNecessario = useMemo(
    () => (variacaoSelecionada?.volumeMl ?? 0) * (Number(quantidade) || 0),
    [variacaoSelecionada, quantidade]
  );

  const insuficiente =
    variacaoSelecionada && mlNecessario > 0 && mlNecessario > variacaoSelecionada.disponivelMl;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm text-ink/70">Variação a produzir</label>
        <select
          name="variacaoId"
          required
          value={variacaoId}
          onChange={(e) => setVariacaoId(e.target.value)}
          className={inputClass}
        >
          <option value="">Selecione...</option>
          {variacoes.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-ink/70">Quantidade a produzir</label>
        <input
          type="number"
          name="quantidade"
          min={1}
          step="1"
          required
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          className={`${inputClass} w-32`}
        />
      </div>

      {variacaoSelecionada && mlNecessario > 0 && (
        <p className={`text-sm ${insuficiente ? "text-bordeaux" : "text-ink/60"}`}>
          Precisa de {mlNecessario}ml — disponível no lote: {variacaoSelecionada.disponivelMl}ml
          {insuficiente && " (insuficiente)"}
        </p>
      )}

      {state?.erro && <p className="text-sm text-bordeaux">{state.erro}</p>}

      <Botao type="submit" disabled={pending}>
        {pending ? "Produzindo..." : "Registrar produção"}
      </Botao>
    </form>
  );
}
