"use client";

import { useActionState } from "react";
import { criarPerfume } from "../actions";

const inputClass =
  "w-full rounded border border-ink/20 bg-bone px-3 py-2 text-sm outline-none focus:border-bordeaux";
const selectClass =
  "rounded border border-ink/20 bg-bone px-2 py-1 text-sm outline-none focus:border-bordeaux";

export function NovoPerfumeForm({ tamanhosPadrao }: { tamanhosPadrao: number[] }) {
  const [state, formAction, pending] = useActionState(criarPerfume, null);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-1">
        <label htmlFor="nome" className="text-sm text-ink/70">
          Nome do perfume
        </label>
        <input id="nome" name="nome" required className={inputClass} />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm text-ink/70">Tamanhos</legend>
        {tamanhosPadrao.map((tamanho) => (
          <div key={tamanho} className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="tamanho" value={tamanho} defaultChecked />
              {tamanho}ml
            </label>
            <select name={`modo-${tamanho}`} defaultValue="fracionado" className={selectClass}>
              <option value="fracionado">Fracionado (decant)</option>
              <option value="inteiro">Inteiro (frasco fechado)</option>
            </select>
          </div>
        ))}

        <div className="flex items-center gap-3">
          <input
            type="number"
            name="outroVolume"
            placeholder="Outro tamanho (ml)"
            min={0}
            step="0.01"
            className={`${inputClass} w-40`}
          />
          <select name="modo-outro" defaultValue="fracionado" className={selectClass}>
            <option value="fracionado">Fracionado (decant)</option>
            <option value="inteiro">Inteiro (frasco fechado)</option>
          </select>
        </div>
      </fieldset>

      {state?.erro && <p className="text-sm text-bordeaux">{state.erro}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-bordeaux px-4 py-2 text-sm font-medium text-bone disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar perfume"}
      </button>
    </form>
  );
}
