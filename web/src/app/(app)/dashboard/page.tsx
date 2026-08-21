import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ROTULO_STATUS, type PedidoStatus } from "../pedidos/status";

function noMesAtual(dataIso: string) {
  const hoje = new Date();
  const d = new Date(dataIso);
  return d.getFullYear() === hoje.getFullYear() && d.getMonth() === hoje.getMonth();
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { data: config },
    { data: pedidos },
    { data: variacoesEstoque },
    { data: insumosEstoque },
  ] = await Promise.all([
    supabase.from("configuracoes").select("valor").eq("chave", "estoque_minimo_padrao").maybeSingle(),
    supabase
      .from("pedidos")
      .select(
        `id, id_externo, status, criado_em, taxa_valor_aplicada,
         canais (nome),
         pedido_itens (quantidade, preco_unitario, custo_unitario_historico, status)`
      )
      .order("criado_em", { ascending: false }),
    supabase.from("vw_estoque_variacao_disponivel").select("sku, estoque_disponivel"),
    supabase.from("vw_estoque_insumo").select("nome, estoque_atual"),
  ]);

  const minimo = Number(config?.valor ?? 5);

  const pendentes = (pedidos ?? []).filter(
    (p) => p.status !== "concluido" && p.status !== "cancelado"
  );

  const vendasDoMes = (pedidos ?? [])
    .filter((p) => noMesAtual(p.criado_em))
    .map((p) => {
      const itensAtivos = p.pedido_itens.filter((i) => i.status === "ativo");
      const faturamento = itensAtivos.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0);
      const custo = itensAtivos.reduce(
        (s, i) => s + i.quantidade * (i.custo_unitario_historico ?? 0),
        0
      );
      return { faturamento, custo, taxa: p.taxa_valor_aplicada ?? 0 };
    });

  const faturamentoMes = vendasDoMes.reduce((s, v) => s + v.faturamento, 0);
  const margemMes = vendasDoMes.reduce((s, v) => s + v.faturamento - v.custo - v.taxa, 0);

  const decantsBaixos = (variacoesEstoque ?? []).filter((v) => (v.estoque_disponivel ?? 0) <= minimo);
  const insumosBaixos = (insumosEstoque ?? []).filter((i) => (i.estoque_atual ?? 0) <= minimo);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-8 py-10">
      <h1 className="font-display text-3xl text-bordeaux">Dashboard</h1>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Faturamento do mês", `R$ ${faturamentoMes.toFixed(2)}`],
          ["Margem do mês", `R$ ${margemMes.toFixed(2)}`],
          ["Pedidos pendentes", pendentes.length],
          ["Itens com estoque baixo", decantsBaixos.length + insumosBaixos.length],
        ].map(([label, valor]) => (
          <div key={label as string} className="rounded-lg border border-ink/10 p-3">
            <p className="text-xs text-ink/50">{label}</p>
            <p className="tabular-nums font-display text-lg">{valor}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-ink/10 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl">Pedidos pendentes</h2>
          <Link href="/pedidos" className="text-sm text-bordeaux hover:underline">
            Ver todos
          </Link>
        </div>
        {pendentes.length === 0 ? (
          <p className="text-sm text-ink/60">Nenhum pedido pendente.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {pendentes.slice(0, 8).map((p) => (
              <li key={p.id} className="flex justify-between border-t border-ink/10 py-1">
                <span>
                  {p.canais?.nome} #{p.id_externo}
                </span>
                <span className="text-ink/60">{ROTULO_STATUS[p.status as PedidoStatus]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-ink/10 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl">Estoque baixo</h2>
          <Link href="/estoque" className="text-sm text-bordeaux hover:underline">
            Ver estoque
          </Link>
        </div>
        {decantsBaixos.length === 0 && insumosBaixos.length === 0 ? (
          <p className="text-sm text-ink/60">Nada abaixo do mínimo ({minimo}) no momento.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {decantsBaixos.map((v) => (
              <li key={v.sku} className="flex justify-between border-t border-ink/10 py-1">
                <span className="font-mono text-xs">{v.sku}</span>
                <span className="tabular-nums text-bordeaux">{v.estoque_disponivel}</span>
              </li>
            ))}
            {insumosBaixos.map((i) => (
              <li key={i.nome} className="flex justify-between border-t border-ink/10 py-1">
                <span>{i.nome}</span>
                <span className="tabular-nums text-bordeaux">{i.estoque_atual}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
