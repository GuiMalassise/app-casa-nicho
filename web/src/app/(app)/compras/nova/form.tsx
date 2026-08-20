"use client";

import { useActionState, useState } from "react";
import { registrarCompra } from "../actions";
import { Botao } from "@/components/botao";

const inputClass =
  "w-full rounded border border-ink/20 bg-bone px-3 py-2 text-sm outline-none focus:border-bordeaux";
const selectClass = inputClass;

type Modo = "fracionado" | "inteiro";
type LinhaItem = {
  modo: Modo;
  perfumeId: string;
  volumeMl: string;
  variacaoId: string;
  quantidade: string;
  valorPago: string;
};

function linhaVazia(): LinhaItem {
  return { modo: "fracionado", perfumeId: "", volumeMl: "", variacaoId: "", quantidade: "", valorPago: "" };
}

export function NovaCompraForm({
  perfumes,
  variacoesInteiras,
  fornecedores,
}: {
  perfumes: { id: string; nome: string }[];
  variacoesInteiras: { id: string; label: string }[];
  fornecedores: string[];
}) {
  const [state, formAction, pending] = useActionState(registrarCompra, null);
  const [itens, setItens] = useState<LinhaItem[]>([linhaVazia()]);

  function atualizar(i: number, campo: keyof LinhaItem, valor: string) {
    setItens((atual) => atual.map((linha, idx) => (idx === i ? { ...linha, [campo]: valor } : linha)));
  }

  const payload = itens
    .map((linha) => {
      const valorPago = Number(linha.valorPago);
      if (!valorPago) return null;
      if (linha.modo === "fracionado") {
        if (!linha.perfumeId || !linha.volumeMl) return null;
        return { perfumeId: linha.perfumeId, volumeMl: Number(linha.volumeMl), valorPago };
      }
      if (!linha.variacaoId || !linha.quantidade) return null;
      return { variacaoId: linha.variacaoId, quantidade: Number(linha.quantidade), valorPago };
    })
    .filter((x) => x !== null);

  return (
    <form action={formAction} className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <div className="space-y-1">
          <label className="text-sm text-ink/70">Fornecedor</label>
          <input name="fornecedor" list="fornecedores" required className={inputClass} />
          <datalist id="fornecedores">
            {fornecedores.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1">
          <label className="text-sm text-ink/70">Data</label>
          <input
            type="date"
            name="data"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-ink/70">Frete total (R$)</label>
          <input type="number" name="freteTotal" min={0} step="0.01" defaultValue={0} className={`${inputClass} w-32`} />
        </div>
      </div>

      <div className="space-y-4">
        <span className="text-sm text-ink/70">Itens comprados</span>
        {itens.map((linha, i) => (
          <div key={i} className="space-y-2 rounded border border-ink/10 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={linha.modo}
                onChange={(e) => atualizar(i, "modo", e.target.value)}
                className={`${selectClass} w-40`}
              >
                <option value="fracionado">Fracionado (perfume a granel)</option>
                <option value="inteiro">Inteiro (frasco fechado)</option>
              </select>
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

            {linha.modo === "fracionado" ? (
              <div className="flex flex-wrap gap-2">
                <select
                  value={linha.perfumeId}
                  onChange={(e) => atualizar(i, "perfumeId", e.target.value)}
                  className={`${selectClass} w-48`}
                >
                  <option value="">Perfume...</option>
                  {perfumes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Volume (ml)"
                  min={0}
                  step="0.01"
                  value={linha.volumeMl}
                  onChange={(e) => atualizar(i, "volumeMl", e.target.value)}
                  className={`${inputClass} w-32`}
                />
                <input
                  type="number"
                  placeholder="Valor pago (R$)"
                  min={0}
                  step="0.01"
                  value={linha.valorPago}
                  onChange={(e) => atualizar(i, "valorPago", e.target.value)}
                  className={`${inputClass} w-36`}
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <select
                  value={linha.variacaoId}
                  onChange={(e) => atualizar(i, "variacaoId", e.target.value)}
                  className={`${selectClass} w-56`}
                >
                  <option value="">Variação (frasco)...</option>
                  {variacoesInteiras.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Quantidade"
                  min={0}
                  step="1"
                  value={linha.quantidade}
                  onChange={(e) => atualizar(i, "quantidade", e.target.value)}
                  className={`${inputClass} w-28`}
                />
                <input
                  type="number"
                  placeholder="Valor pago (R$)"
                  min={0}
                  step="0.01"
                  value={linha.valorPago}
                  onChange={(e) => atualizar(i, "valorPago", e.target.value)}
                  className={`${inputClass} w-36`}
                />
              </div>
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

      <input type="hidden" name="itens" value={JSON.stringify(payload)} />

      {state?.erro && <p className="text-sm text-bordeaux">{state.erro}</p>}

      <Botao type="submit" disabled={pending || payload.length === 0}>
        {pending ? "Salvando..." : "Salvar compra"}
      </Botao>
    </form>
  );
}
