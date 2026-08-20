"use client";

import { useActionState, useState } from "react";
import { registrarPedido } from "../actions";
import { Botao } from "@/components/botao";

const inputClass =
  "w-full rounded border border-ink/20 bg-bone px-3 py-2 text-sm outline-none focus:border-bordeaux";
const selectClass = inputClass;

type VariacaoOpcao = { id: string; label: string; precoSugerido: number | null };
type LinhaItem = { variacaoId: string; quantidade: string; precoUnitario: string };

function linhaVazia(): LinhaItem {
  return { variacaoId: "", quantidade: "1", precoUnitario: "" };
}

export function NovoPedidoForm({
  canais,
  variacoes,
}: {
  canais: { id: string; nome: string }[];
  variacoes: VariacaoOpcao[];
}) {
  const [state, formAction, pending] = useActionState(registrarPedido, null);
  const [itens, setItens] = useState<LinhaItem[]>([linhaVazia()]);

  function atualizar(i: number, campo: keyof LinhaItem, valor: string) {
    setItens((atual) =>
      atual.map((linha, idx) => {
        if (idx !== i) return linha;
        const nova = { ...linha, [campo]: valor };
        if (campo === "variacaoId" && !linha.precoUnitario) {
          const v = variacoes.find((x) => x.id === valor);
          if (v?.precoSugerido) nova.precoUnitario = String(v.precoSugerido);
        }
        return nova;
      })
    );
  }

  const payload = itens
    .map((linha) => {
      const quantidade = Number(linha.quantidade);
      const precoUnitario = Number(linha.precoUnitario);
      if (!linha.variacaoId || !quantidade || !precoUnitario) return null;
      return { variacaoId: linha.variacaoId, quantidade, precoUnitario };
    })
    .filter((x) => x !== null);

  const total = payload.reduce((soma, i) => soma + i.quantidade * i.precoUnitario, 0);

  return (
    <form action={formAction} className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <div className="space-y-1">
          <label className="text-sm text-ink/70">Canal</label>
          <select name="canalId" required className={selectClass}>
            <option value="">Selecione...</option>
            {canais.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-ink/70">Nº/referência do pedido</label>
          <input name="idExterno" required className={`${inputClass} w-40`} />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-ink/70">Cliente (opcional)</label>
          <input name="clienteNome" className={`${inputClass} w-48`} />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-ink/70">Frete (R$)</label>
          <input type="number" name="valorFrete" min={0} step="0.01" defaultValue={0} className={`${inputClass} w-28`} />
        </div>
      </div>

      <div className="space-y-4">
        <span className="text-sm text-ink/70">Itens</span>
        {itens.map((linha, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 rounded border border-ink/10 p-3">
            <select
              value={linha.variacaoId}
              onChange={(e) => atualizar(i, "variacaoId", e.target.value)}
              className={`${selectClass} w-56`}
            >
              <option value="">Variação...</option>
              {variacoes.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Qtd"
              min={1}
              step="1"
              value={linha.quantidade}
              onChange={(e) => atualizar(i, "quantidade", e.target.value)}
              className={`${inputClass} w-20`}
            />
            <input
              type="number"
              placeholder="Preço unit. (R$)"
              min={0}
              step="0.01"
              value={linha.precoUnitario}
              onChange={(e) => atualizar(i, "precoUnitario", e.target.value)}
              className={`${inputClass} w-32`}
            />
            {itens.length > 1 && (
              <button
                type="button"
                onClick={() => setItens((atual) => atual.filter((_, idx) => idx !== i))}
                className="text-xs text-ink/50 hover:text-bordeaux"
              >
                Remover
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => setItens((atual) => [...atual, linhaVazia()])}
          className="text-sm text-bordeaux hover:underline"
        >
          + Adicionar item
        </button>
      </div>

      {total > 0 && <p className="text-sm text-ink/70">Total dos produtos: R$ {total.toFixed(2)}</p>}

      <input type="hidden" name="itens" value={JSON.stringify(payload)} />

      {state?.erro && <p className="text-sm text-bordeaux">{state.erro}</p>}

      <Botao type="submit" disabled={pending || payload.length === 0}>
        {pending ? "Salvando..." : "Salvar pedido"}
      </Botao>
    </form>
  );
}
