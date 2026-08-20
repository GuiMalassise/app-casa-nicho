"use client";

import { useActionState } from "react";
import {
  salvarParametrosGerais,
  criarCanal,
  criarTaxaCanal,
  criarInsumo,
  criarRegraEmbalagem,
} from "./actions";
import { Botao } from "@/components/botao";

const inputClass =
  "rounded border border-ink/20 bg-bone px-3 py-2 text-sm outline-none focus:border-bordeaux";

export function ParametrosGeraisForm({
  tamanhos,
  margemAlvo,
  custoEmbalagem,
  estoqueMinimo,
}: {
  tamanhos: number[];
  margemAlvo: number;
  custoEmbalagem: number;
  estoqueMinimo: number;
}) {
  const [state, formAction, pending] = useActionState(salvarParametrosGerais, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <label className="text-xs text-ink/60">Tamanhos padrão (ml, separados por vírgula)</label>
        <input
          name="tamanhos"
          defaultValue={tamanhos.join(", ")}
          className={`${inputClass} w-48`}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-ink/60">Margem-alvo padrão (%)</label>
        <input
          type="number"
          name="margemAlvo"
          step="0.01"
          defaultValue={(margemAlvo * 100).toFixed(2)}
          className={`${inputClass} w-24`}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-ink/60">Custo de embalagem estimado (R$)</label>
        <input
          type="number"
          name="custoEmbalagem"
          step="0.01"
          defaultValue={custoEmbalagem}
          className={`${inputClass} w-32`}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-ink/60">Estoque mínimo padrão</label>
        <input
          type="number"
          name="estoqueMinimo"
          step="1"
          defaultValue={estoqueMinimo}
          className={`${inputClass} w-24`}
        />
      </div>
      <Botao type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Botao>
      {state?.erro && <p className="w-full text-xs text-bordeaux">{state.erro}</p>}
    </form>
  );
}

export function CanalForm() {
  const [state, formAction, pending] = useActionState(criarCanal, null);
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input name="nome" placeholder="Nome do canal" required className={`${inputClass} w-48`} />
      <Botao type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Novo canal"}
      </Botao>
      {state?.erro && <p className="w-full text-xs text-bordeaux">{state.erro}</p>}
    </form>
  );
}

export function TaxaCanalForm({ canais }: { canais: { id: string; nome: string }[] }) {
  const [state, formAction, pending] = useActionState(criarTaxaCanal, null);
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <select name="canalId" required className={inputClass}>
        <option value="">Canal...</option>
        {canais.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </select>
      <input type="number" name="faixaMin" placeholder="Faixa min (R$)" step="0.01" defaultValue={0} className={`${inputClass} w-28`} />
      <input type="number" name="faixaMax" placeholder="Faixa max (vazio = sem limite)" step="0.01" className={`${inputClass} w-40`} />
      <input type="number" name="percentual" placeholder="% do canal" step="0.01" required className={`${inputClass} w-24`} />
      <input type="number" name="taxaFixa" placeholder="Taxa fixa (R$)" step="0.01" defaultValue={0} className={`${inputClass} w-28`} />
      <Botao type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Nova faixa de taxa"}
      </Botao>
      {state?.erro && <p className="w-full text-xs text-bordeaux">{state.erro}</p>}
    </form>
  );
}

export function InsumoForm() {
  const [state, formAction, pending] = useActionState(criarInsumo, null);
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input name="nome" placeholder="Nome do insumo" required className={`${inputClass} w-48`} />
      <select name="tipo" defaultValue="producao" className={inputClass}>
        <option value="producao">Produção</option>
        <option value="expedicao">Expedição</option>
      </select>
      <input type="number" name="volumeMl" placeholder="Tamanho (ml, se for frasco)" step="0.01" className={`${inputClass} w-48`} />
      <input type="number" name="custoMedio" placeholder="Custo inicial (R$)" step="0.0001" defaultValue={0} className={`${inputClass} w-36`} />
      <Botao type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Novo insumo"}
      </Botao>
      {state?.erro && <p className="w-full text-xs text-bordeaux">{state.erro}</p>}
    </form>
  );
}

export function RegraEmbalagemForm() {
  const [state, formAction, pending] = useActionState(criarRegraEmbalagem, null);
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input name="tipoCaixa" placeholder="Nome da caixa" required className={`${inputClass} w-40`} />
      <input type="number" name="qtdMinima" placeholder="Qtd mínima" step="1" required className={`${inputClass} w-28`} />
      <input type="number" name="qtdMaxima" placeholder="Qtd máxima" step="1" required className={`${inputClass} w-28`} />
      <Botao type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Nova regra"}
      </Botao>
      {state?.erro && <p className="w-full text-xs text-bordeaux">{state.erro}</p>}
    </form>
  );
}
