import { createClient } from "@/lib/supabase/server";
import { BotaoLink } from "@/components/botao";
import { ROTULO_STATUS, type PedidoStatus } from "./status";
import { PedidoAcoes, ItemAcoes } from "./pedido-acoes";

export default async function PedidosPage() {
  const supabase = await createClient();

  const { data: pedidos } = await supabase
    .from("pedidos")
    .select(
      `id, id_externo, cliente_nome, status, valor_produtos, valor_frete, taxa_valor_aplicada,
       canais (nome),
       pedido_itens (id, quantidade, preco_unitario, status, variacoes (sku)),
       pedido_expedicao (tipo_caixa, embalado_em, enviado_em)`
    )
    .order("criado_em", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl text-bordeaux">Pedidos</h1>
        <BotaoLink href="/pedidos/novo">Novo pedido</BotaoLink>
      </div>

      {!pedidos || pedidos.length === 0 ? (
        <p className="text-sm text-ink/60">Nenhum pedido registrado ainda.</p>
      ) : (
        <div className="space-y-4">
          {pedidos.map((p) => (
            <div key={p.id} className="rounded-lg border border-ink/10 p-4">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-xl">
                  {p.canais?.nome ?? "?"} · #{p.id_externo}
                  {p.cliente_nome ? ` — ${p.cliente_nome}` : ""}
                </h2>
                <span
                  className={`text-sm ${
                    p.status === "cancelado" || p.status === "pendente_conflito"
                      ? "text-bordeaux"
                      : "text-ink/60"
                  }`}
                >
                  {ROTULO_STATUS[p.status as PedidoStatus]}
                </span>
              </div>

              <p className="text-sm text-ink/70">
                Produtos R$ {p.valor_produtos} · Frete R$ {p.valor_frete} · Taxa do canal R${" "}
                {p.taxa_valor_aplicada ?? 0}
                {p.pedido_expedicao && ` · Caixa ${p.pedido_expedicao.tipo_caixa}`}
              </p>

              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-ink/50">
                      <th className="pb-1 font-normal">Item</th>
                      <th className="pb-1 font-normal">Qtd</th>
                      <th className="pb-1 font-normal">Preço</th>
                      <th className="pb-1 font-normal">Status</th>
                      <th className="pb-1 font-normal"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.pedido_itens.map((item) => (
                      <tr key={item.id} className="border-t border-ink/10">
                        <td className="py-1 font-mono text-xs break-all">{item.variacoes?.sku ?? "?"}</td>
                        <td className="py-1 tabular-nums">{item.quantidade}</td>
                        <td className="py-1 tabular-nums">R$ {item.preco_unitario}</td>
                        <td className="py-1 capitalize">{item.status}</td>
                        <td className="py-1">
                          <ItemAcoes
                            pedidoItemId={item.id}
                            statusItem={item.status}
                            pedidoStatus={p.status as PedidoStatus}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <PedidoAcoes pedidoId={p.id} status={p.status as PedidoStatus} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
