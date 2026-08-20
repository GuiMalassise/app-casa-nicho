import { createClient } from "@/lib/supabase/server";
import { BotaoLink } from "@/components/botao";

export default async function ComprasPage() {
  const supabase = await createClient();

  const { data: compras } = await supabase
    .from("compras")
    .select(
      `id, data, frete_total, fornecedores (nome),
       compra_itens (
         id, valor_pago, frete_rateado, custo_total, custo_por_ml, custo_unitario,
         volume_ml, quantidade,
         perfumes (nome),
         variacoes (sku),
         insumos (nome)
       )`
    )
    .order("data", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl text-bordeaux">Compras</h1>
        <BotaoLink href="/compras/nova">Nova compra</BotaoLink>
      </div>

      {!compras || compras.length === 0 ? (
        <p className="text-sm text-ink/60">Nenhuma compra registrada ainda.</p>
      ) : (
        <div className="space-y-4">
          {compras.map((c) => (
            <div key={c.id} className="rounded-lg border border-ink/10 p-4">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-xl">{c.fornecedores?.nome ?? "—"}</h2>
                <span className="text-sm text-ink/60">
                  {new Date(c.data).toLocaleDateString("pt-BR")} · frete R$ {c.frete_total}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-ink/50">
                      <th className="pb-1 font-normal">Item</th>
                      <th className="pb-1 font-normal">Valor pago</th>
                      <th className="pb-1 font-normal">Frete rateado</th>
                      <th className="pb-1 font-normal">Custo total</th>
                      <th className="pb-1 font-normal">Custo/ml ou un.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.compra_itens.map((item) => (
                      <tr key={item.id} className="border-t border-ink/10">
                        <td className="py-1">
                          {item.perfumes
                            ? `${item.perfumes.nome} (${item.volume_ml}ml)`
                            : item.insumos
                              ? `${item.insumos.nome} (${item.quantidade}un)`
                              : `${item.variacoes?.sku ?? "?"} (${item.quantidade}un)`}
                        </td>
                        <td className="py-1 tabular-nums">R$ {item.valor_pago}</td>
                        <td className="py-1 tabular-nums">R$ {item.frete_rateado}</td>
                        <td className="py-1 tabular-nums">R$ {item.custo_total}</td>
                        <td className="py-1 tabular-nums">
                          R$ {item.custo_por_ml ?? item.custo_unitario}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
