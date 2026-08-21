import { createClient } from "@/lib/supabase/server";
import {
  ParametrosGeraisForm,
  CanalForm,
  TaxaCanalForm,
  InsumoForm,
  RegraEmbalagemForm,
} from "./forms";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();

  const [
    { data: config },
    { data: canais },
    { data: taxas },
    { data: insumos },
    { data: regras },
  ] = await Promise.all([
    supabase.from("configuracoes").select("chave, valor"),
    supabase.from("canais").select("id, nome").order("nome"),
    supabase
      .from("taxas_canal")
      .select("id, faixa_valor_min, faixa_valor_max, percentual, taxa_fixa, canais (nome)")
      .order("faixa_valor_min"),
    supabase.from("insumos").select("id, nome, tipo, volume_ml, custo_medio").order("nome"),
    supabase.from("regras_embalagem").select("id, tipo_caixa, qtd_minima, qtd_maxima").order("qtd_minima"),
  ]);

  const mapaConfig = new Map((config ?? []).map((c) => [c.chave, c.valor]));
  const tamanhos = (mapaConfig.get("tamanhos_padrao_ml") as number[] | undefined) ?? [];
  const margemAlvo = (mapaConfig.get("margem_alvo_padrao") as number | undefined) ?? 0;
  const custoEmbalagem = (mapaConfig.get("custo_embalagem_estimado") as number | undefined) ?? 0;
  const estoqueMinimo = (mapaConfig.get("estoque_minimo_padrao") as number | undefined) ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-8 py-10">
      <h1 className="font-display text-3xl text-bordeaux">Configurações</h1>

      <section className="rounded-lg border border-ink/10 p-4">
        <h2 className="mb-3 font-display text-xl">Parâmetros gerais</h2>
        <ParametrosGeraisForm
          tamanhos={tamanhos}
          margemAlvo={margemAlvo}
          custoEmbalagem={custoEmbalagem}
          estoqueMinimo={estoqueMinimo}
        />
      </section>

      <section className="rounded-lg border border-ink/10 p-4">
        <h2 className="mb-3 font-display text-xl">Canais e taxas</h2>
        <ul className="mb-4 space-y-1 text-sm">
          {(taxas ?? []).map((t) => (
            <li key={t.id} className="flex justify-between border-t border-ink/10 py-1">
              <span>
                {t.canais?.nome} · R$ {t.faixa_valor_min} a{" "}
                {t.faixa_valor_max ?? "sem limite"}
              </span>
              <span className="tabular-nums">
                {t.percentual}% + R$ {t.taxa_fixa}
              </span>
            </li>
          ))}
        </ul>
        <div className="space-y-3">
          <CanalForm />
          <TaxaCanalForm canais={canais ?? []} />
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 p-4">
        <h2 className="mb-3 font-display text-xl">Insumos e custos</h2>
        <ul className="mb-4 space-y-1 text-sm">
          {(insumos ?? []).map((i) => (
            <li key={i.id} className="flex justify-between border-t border-ink/10 py-1">
              <span>
                {i.nome} {i.volume_ml ? `(${i.volume_ml}ml)` : ""} ·{" "}
                {i.tipo === "producao" ? "produção" : "expedição"}
              </span>
              <span className="tabular-nums">R$ {i.custo_medio}</span>
            </li>
          ))}
        </ul>
        <InsumoForm />
      </section>

      <section className="rounded-lg border border-ink/10 p-4">
        <h2 className="mb-3 font-display text-xl">Regras de embalagem</h2>
        <ul className="mb-4 space-y-1 text-sm">
          {(regras ?? []).map((r) => (
            <li key={r.id} className="flex justify-between border-t border-ink/10 py-1">
              <span>{r.tipo_caixa}</span>
              <span className="tabular-nums">
                {r.qtd_minima} a {r.qtd_maxima} itens
              </span>
            </li>
          ))}
        </ul>
        <RegraEmbalagemForm />
      </section>
    </div>
  );
}
