import { createClient } from "@/lib/supabase/server";
import { DespesaFixaForm } from "./despesa-form";
import { LancamentoForm } from "./lancamento-form";
import { RecebimentoForm } from "./recebimento-form";
import { LancarDespesasButton } from "./lancar-despesas-button";

function noMesAtual(dataIso: string) {
  const hoje = new Date();
  const d = new Date(dataIso);
  return d.getFullYear() === hoje.getFullYear() && d.getMonth() === hoje.getMonth();
}

export default async function FinanceiroPage() {
  const supabase = await createClient();

  const [
    { data: pedidos },
    { data: despesasFixas },
    { data: lancamentos },
    { data: caixaMovimentos },
  ] = await Promise.all([
    supabase
      .from("pedidos")
      .select(
        `id, id_externo, criado_em, taxa_valor_aplicada,
         canais (nome),
         pedido_itens (quantidade, preco_unitario, custo_unitario_historico, status)`
      )
      .order("criado_em", { ascending: false }),
    supabase.from("despesas_fixas").select("id, nome, valor, recorrencia, ativo").order("nome"),
    supabase
      .from("lancamentos_financeiros")
      .select("id, tipo, categoria, valor, data")
      .order("data", { ascending: false })
      .limit(30),
    supabase
      .from("caixa_movimentos")
      .select("id, valor, recebido_em, pedidos (id_externo)")
      .order("recebido_em", { ascending: false })
      .limit(30),
  ]);

  const vendas = (pedidos ?? []).map((p) => {
    const itensAtivos = p.pedido_itens.filter((i) => i.status === "ativo");
    const faturamento = itensAtivos.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0);
    const custo = itensAtivos.reduce(
      (s, i) => s + i.quantidade * (i.custo_unitario_historico ?? 0),
      0
    );
    const taxa = p.taxa_valor_aplicada ?? 0;
    const margem = faturamento - custo - taxa;
    return { ...p, faturamento, custo, margem };
  });

  const vendasDoMes = vendas.filter((v) => noMesAtual(v.criado_em));
  const faturamentoMes = vendasDoMes.reduce((s, v) => s + v.faturamento, 0);
  const custoMes = vendasDoMes.reduce((s, v) => s + v.custo, 0);
  const taxasMes = vendasDoMes.reduce((s, v) => s + (v.taxa_valor_aplicada ?? 0), 0);

  const despesasMes = (lancamentos ?? [])
    .filter((l) => l.tipo === "despesa" && noMesAtual(l.data))
    .reduce((s, l) => s + l.valor, 0);

  const margemMes = faturamentoMes - custoMes - taxasMes - despesasMes;
  const caixaMes = (caixaMovimentos ?? [])
    .filter((c) => noMesAtual(c.recebido_em))
    .reduce((s, c) => s + c.valor, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-8 py-10">
      <h1 className="font-display text-3xl text-bordeaux">Financeiro</h1>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Faturamento do mês", faturamentoMes],
          ["Despesas do mês", despesasMes],
          ["Margem do mês", margemMes],
          ["Caixa recebido no mês", caixaMes],
        ].map(([label, valor]) => (
          <div key={label as string} className="rounded-lg border border-ink/10 p-3">
            <p className="text-xs text-ink/50">{label}</p>
            <p className="tabular-nums font-display text-lg">
              R$ {(valor as number).toFixed(2)}
            </p>
          </div>
        ))}
      </section>
      <p className="-mt-4 text-xs text-ink/40">
        Faturamento x caixa: faturamento é o valor da venda no pedido; caixa é o que
        efetivamente entrou (pode chegar depois, com desconto de taxa do canal).
      </p>

      <section className="rounded-lg border border-ink/10 p-4">
        <h2 className="mb-3 font-display text-xl">Vendas — faturamento, custo e margem</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink/50">
                <th className="pb-1 font-normal">Pedido</th>
                <th className="pb-1 font-normal">Faturamento</th>
                <th className="pb-1 font-normal">Custo</th>
                <th className="pb-1 font-normal">Taxa</th>
                <th className="pb-1 font-normal">Margem</th>
              </tr>
            </thead>
            <tbody>
              {vendas.map((v) => (
                <tr key={v.id} className="border-t border-ink/10">
                  <td className="py-1">
                    {v.canais?.nome} #{v.id_externo}
                  </td>
                  <td className="py-1 tabular-nums">R$ {v.faturamento.toFixed(2)}</td>
                  <td className="py-1 tabular-nums">R$ {v.custo.toFixed(2)}</td>
                  <td className="py-1 tabular-nums">R$ {(v.taxa_valor_aplicada ?? 0).toFixed(2)}</td>
                  <td
                    className={`py-1 tabular-nums ${v.margem < 0 ? "text-bordeaux" : ""}`}
                  >
                    R$ {v.margem.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 p-4">
        <h2 className="mb-3 font-display text-xl">Despesas fixas</h2>
        <ul className="mb-4 space-y-1 text-sm">
          {(despesasFixas ?? []).map((d) => (
            <li key={d.id} className="flex justify-between border-t border-ink/10 py-1">
              <span>
                {d.nome} {!d.ativo && <span className="text-ink/40">(inativa)</span>}
              </span>
              <span className="tabular-nums">R$ {d.valor}</span>
            </li>
          ))}
        </ul>
        <DespesaFixaForm />
        <div className="mt-3">
          <LancarDespesasButton />
        </div>
      </section>

      <section className="rounded-lg border border-ink/10 p-4">
        <h2 className="mb-3 font-display text-xl">Lançamentos</h2>
        <ul className="mb-4 space-y-1 text-sm">
          {(lancamentos ?? []).map((l) => (
            <li key={l.id} className="flex justify-between border-t border-ink/10 py-1">
              <span>
                {new Date(l.data).toLocaleDateString("pt-BR")} · {l.categoria}
              </span>
              <span className={`tabular-nums ${l.tipo === "despesa" ? "text-bordeaux" : ""}`}>
                {l.tipo === "despesa" ? "-" : "+"}R$ {l.valor}
              </span>
            </li>
          ))}
        </ul>
        <LancamentoForm />
      </section>

      <section className="rounded-lg border border-ink/10 p-4">
        <h2 className="mb-3 font-display text-xl">Caixa (recebimentos)</h2>
        <ul className="mb-4 space-y-1 text-sm">
          {(caixaMovimentos ?? []).map((c) => (
            <li key={c.id} className="flex justify-between border-t border-ink/10 py-1">
              <span>
                {new Date(c.recebido_em).toLocaleDateString("pt-BR")}
                {c.pedidos ? ` · pedido #${c.pedidos.id_externo}` : ""}
              </span>
              <span className="tabular-nums">R$ {c.valor}</span>
            </li>
          ))}
        </ul>
        <RecebimentoForm />
      </section>
    </div>
  );
}
