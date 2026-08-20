"use client";

import { useActionState, useEffect, useState } from "react";
import { criarPerfume } from "../actions";
import { gerarSku, normalizarPrefixoSku } from "@/lib/sku";

const inputClass =
  "w-full rounded border border-ink/20 bg-bone px-3 py-2 text-sm outline-none focus:border-bordeaux";
const selectClass =
  "rounded border border-ink/20 bg-bone px-2 py-1 text-sm outline-none focus:border-bordeaux";

export function NovoPerfumeForm({ tamanhosPadrao }: { tamanhosPadrao: number[] }) {
  const [state, formAction, pending] = useActionState(criarPerfume, null);

  const [nome, setNome] = useState("");
  const [prefixo, setPrefixo] = useState("");
  const [prefixoEditado, setPrefixoEditado] = useState(false);
  const [outroVolume, setOutroVolume] = useState("");

  useEffect(() => {
    if (!prefixoEditado) setPrefixo(normalizarPrefixoSku(nome));
  }, [nome, prefixoEditado]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-1">
        <label htmlFor="nome" className="text-sm text-ink/70">
          Nome do perfume
        </label>
        <input
          id="nome"
          name="nome"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="prefixoSku" className="text-sm text-ink/70">
          Prefixo do SKU
        </label>
        <input
          id="prefixoSku"
          name="prefixoSku"
          value={prefixo}
          onChange={(e) => {
            setPrefixo(e.target.value);
            setPrefixoEditado(true);
          }}
          className={`${inputClass} font-mono text-xs`}
        />
        <p className="text-xs text-ink/50">
          Pode encurtar — o SKU final é {normalizarPrefixoSku(prefixo) || "PREFIXO"}
          -[TAMANHO]ML.
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm text-ink/70">Tamanhos</legend>
        {tamanhosPadrao.map((tamanho) => (
          <div key={tamanho} className="flex flex-wrap items-center gap-2">
            <label className="flex w-40 items-center gap-2 text-sm">
              <input type="checkbox" name="tamanho" value={tamanho} defaultChecked />
              {tamanho}ml
            </label>
            <select name={`modo-${tamanho}`} defaultValue="fracionado" className={selectClass}>
              <option value="fracionado">Fracionado (decant)</option>
              <option value="inteiro">Inteiro (frasco fechado)</option>
            </select>
            <span className="font-mono text-xs text-ink/40">
              {gerarSku(prefixo, tamanho)}
            </span>
          </div>
        ))}

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            name="outroVolume"
            placeholder="Outro tamanho (ml)"
            min={0}
            step="0.01"
            value={outroVolume}
            onChange={(e) => setOutroVolume(e.target.value)}
            className={`${inputClass} w-40`}
          />
          <select name="modo-outro" defaultValue="fracionado" className={selectClass}>
            <option value="fracionado">Fracionado (decant)</option>
            <option value="inteiro">Inteiro (frasco fechado)</option>
          </select>
          {outroVolume && (
            <span className="font-mono text-xs text-ink/40">
              {gerarSku(prefixo, Number(outroVolume))}
            </span>
          )}
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
