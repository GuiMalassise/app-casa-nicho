import { createClient } from "@/lib/supabase/server";
import { VillaMark } from "@/components/villa-mark";
import { BotaoLink } from "@/components/botao";
import { ExcluirBotao } from "./excluir-botao";

export default async function PerfumesPage() {
  const supabase = await createClient();

  const [{ data: perfumes }, { data: estoqueView }] = await Promise.all([
    supabase
      .from("perfumes")
      .select("id, nome, foto_url, variacoes (id, volume_ml, modo_venda, sku, preco_venda)")
      .order("nome"),
    supabase.from("vw_estoque_variacao_disponivel").select("sku, estoque_disponivel"),
  ]);

  const estoquePorSku = new Map((estoqueView ?? []).map((e) => [e.sku, e.estoque_disponivel]));

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl text-bordeaux">Perfumes</h1>
        <BotaoLink href="/perfumes/novo">Novo perfume</BotaoLink>
      </div>

      {!perfumes || perfumes.length === 0 ? (
        <p className="text-sm text-ink/60">Nenhum perfume cadastrado ainda.</p>
      ) : (
        <div className="space-y-4">
          {perfumes.map((p) => (
            <div key={p.id} className="rounded-lg border border-ink/10 p-4">
              <div className="mb-3 flex items-center gap-3">
                {p.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.foto_url}
                    alt={p.nome}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-bordeaux/5">
                    <VillaMark className="h-6 w-6 text-terracotta/60" />
                  </div>
                )}
                <h2 className="font-display text-xl">{p.nome}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-ink/50">
                      <th className="pb-1 pr-3 font-normal">Tamanho</th>
                      <th className="pb-1 pr-3 font-normal">Modo</th>
                      <th className="pb-1 pr-3 font-normal">SKU</th>
                      <th className="pb-1 pr-3 font-normal">Preço</th>
                      <th className="pb-1 font-normal">Estoque</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.variacoes.map((v) => (
                      <tr key={v.id} className="border-t border-ink/10">
                        <td className="py-1 pr-3 tabular-nums">{v.volume_ml}ml</td>
                        <td className="py-1 pr-3">
                          {v.modo_venda === "fracionado" ? "DEC" : "CX"}
                        </td>
                        <td className="py-1 pr-3 font-mono text-xs break-all">{v.sku}</td>
                        <td className="py-1 pr-3 tabular-nums">
                          {v.preco_venda ? `R$ ${v.preco_venda}` : "—"}
                        </td>
                        <td className="py-1 tabular-nums">
                          {(() => {
                            const estoque = estoquePorSku.get(v.sku);
                            if (estoque === undefined || estoque === null) return "—";
                            return (
                              <span className={estoque > 0 ? "text-olive" : "text-bordeaux"}>
                                {estoque}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ExcluirBotao perfumeId={p.id} nome={p.nome} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
