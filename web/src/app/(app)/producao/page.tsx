import { createClient } from "@/lib/supabase/server";
import { BotaoLink } from "@/components/botao";

export default async function ProducaoPage() {
  const supabase = await createClient();

  const { data: producoes } = await supabase
    .from("producoes")
    .select(
      `id, quantidade, perfume_consumido_ml, custo_unitario_historico, criado_em,
       variacoes (sku, perfumes (nome)),
       producao_lotes_consumidos (id, quantidade_ml_consumida, custo_por_ml_no_momento),
       producao_insumos_consumidos (id, quantidade, insumos (nome))`
    )
    .order("criado_em", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl text-bordeaux">Produção</h1>
        <BotaoLink href="/producao/nova">Nova produção</BotaoLink>
      </div>

      {!producoes || producoes.length === 0 ? (
        <p className="text-sm text-ink/60">Nenhuma produção registrada ainda.</p>
      ) : (
        <div className="space-y-4">
          {producoes.map((p) => (
            <div key={p.id} className="rounded-lg border border-ink/10 p-4">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-xl">
                  {p.variacoes?.perfumes?.nome ?? "?"} — {p.variacoes?.sku}
                </h2>
                <span className="text-sm text-ink/60">
                  {new Date(p.criado_em).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <p className="text-sm text-ink/70">
                {p.quantidade} decants · {p.perfume_consumido_ml}ml consumidos · custo unitário R${" "}
                {p.custo_unitario_historico}
              </p>

              <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink/50">
                <div>
                  <span className="font-medium">Lotes: </span>
                  {p.producao_lotes_consumidos
                    .map((l) => `${l.quantidade_ml_consumida}ml a R$${l.custo_por_ml_no_momento}/ml`)
                    .join(" + ")}
                </div>
                <div>
                  <span className="font-medium">Insumos: </span>
                  {p.producao_insumos_consumidos
                    .map((i) => `${i.insumos?.nome} (${i.quantidade})`)
                    .join(", ")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
