"use client";

import { useActionState, useState } from "react";
import { registrarAjuste } from "./actions";
import { Botao } from "@/components/botao";

const inputClass =
  "w-full max-w-full rounded border border-ink/20 bg-bone px-3 py-2 text-sm outline-none focus:border-bordeaux";
const selectClass = inputClass;

type Item = { id: string; label: string };

export function AjusteForm({ variacoes, insumos }: { variacoes: Item[]; insumos: Item[] }) {
  const [state, formAction, pending] = useActionState(registrarAjuste, null);
  const [itemTipo, setItemTipo] = useState<"variacao" | "insumo">("variacao");
  const [tipoAjuste, setTipoAjuste] = useState<"perda" | "avaria" | "ajuste">("perda");

  const itens = itemTipo === "variacao" ? variacoes : insumos;

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="space-y-1">
          <label className="text-sm text-ink/70">O que ajustar</label>
          <select
            name="itemTipo"
            value={itemTipo}
            onChange={(e) => setItemTipo(e.target.value as "variacao" | "insumo")}
            className={selectClass}
          >
            <option value="variacao">Decant</option>
            <option value="insumo">Insumo</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-ink/70">Tipo</label>
          <select
            name="tipoAjuste"
            value={tipoAjuste}
            onChange={(e) => setTipoAjuste(e.target.value as "perda" | "avaria" | "ajuste")}
            className={selectClass}
          >
            <option value="perda">Perda</option>
            <option value="avaria">Avaria</option>
            <option value="ajuste">Ajuste de contagem</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-ink/70">Item</label>
        <select name="itemId" required className={selectClass}>
          <option value="">Selecione...</option>
          {itens.map((i) => (
            <option key={i.id} value={i.id}>
              {i.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm text-ink/70">
          {tipoAjuste === "ajuste" ? "Diferença (+ ou -)" : "Quantidade perdida/avariada"}
        </label>
        <input type="number" name="quantidade" step="0.001" required className={`${inputClass} w-40`} />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-ink/70">Motivo</label>
        <input type="text" name="motivo" required className={inputClass} />
      </div>

      {state && "erro" in state && <p className="text-sm text-bordeaux">{state.erro}</p>}
      {state && "ok" in state && <p className="text-sm text-olive">Ajuste registrado.</p>}

      <Botao type="submit" disabled={pending}>
        {pending ? "Registrando..." : "Registrar ajuste"}
      </Botao>
    </form>
  );
}
