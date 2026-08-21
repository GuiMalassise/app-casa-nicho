import { createClient } from "@/lib/supabase/server";
import { AjusteForm } from "./ajuste-form";

export default async function EstoquePage() {
  const supabase = await createClient();

  const [
    { data: perfumes },
    { data: variacoes },
    { data: insumos },
    { data: lotesView },
    { data: variacoesView },
    { data: insumosView },
  ] = await Promise.all([
    supabase.from("perfumes").select("id, nome"),
    supabase.from("variacoes").select("id, perfume_id, volume_ml, modo_venda, sku"),
    supabase.from("insumos").select("id, nome, tipo"),
    supabase
      .from("vw_estoque_lote")
      .select("lote_id, perfume_id, volume_inicial_ml, volume_atual_ml, custo_por_ml, criado_em")
      .order("criado_em"),
    supabase
      .from("vw_estoque_variacao_disponivel")
      .select("variacao_id, sku, estoque_fisico, estoque_reservado, estoque_disponivel"),
    supabase.from("vw_estoque_insumo").select("insumo_id, nome, tipo, estoque_atual").order("nome"),
  ]);

  const nomePerfume = new Map((perfumes ?? []).map((p) => [p.id, p.nome]));

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-8 py-10">
      <h1 className="font-display text-3xl text-bordeaux">Estoque</h1>

      <section className="rounded-lg border border-ink/10 p-4">
        <h2 className="mb-3 font-display text-xl">Perfume original (por lote)</h2>
        {!lotesView || lotesView.length === 0 ? (
          <p className="text-sm text-ink/60">Nenhum lote registrado ainda (aguarda o módulo de Compras).</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink/50">
                  <th className="pb-1 font-normal">Perfume</th>
                  <th className="pb-1 font-normal">Volume inicial</th>
                  <th className="pb-1 font-normal">Volume atual</th>
                  <th className="pb-1 font-normal">Custo/ml</th>
                </tr>
              </thead>
              <tbody>
                {lotesView.map((l) => (
                  <tr key={l.lote_id} className="border-t border-ink/10">
                    <td className="py-1">{nomePerfume.get(l.perfume_id ?? "") ?? "—"}</td>
                    <td className="py-1 tabular-nums">{l.volume_inicial_ml}ml</td>
                    <td className="py-1 tabular-nums">{l.volume_atual_ml}ml</td>
                    <td className="py-1 tabular-nums">R$ {l.custo_por_ml}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-ink/10 p-4">
        <h2 className="mb-3 font-display text-xl">Produto acabado (decants)</h2>
        {!variacoesView || variacoesView.length === 0 ? (
          <p className="text-sm text-ink/60">Nenhum decant produzido ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink/50">
                  <th className="pb-1 font-normal">SKU</th>
                  <th className="pb-1 font-normal">Físico</th>
                  <th className="pb-1 font-normal">Reservado</th>
                  <th className="pb-1 font-normal">Disponível</th>
                </tr>
              </thead>
              <tbody>
                {variacoesView.map((v) => (
                  <tr key={v.variacao_id} className="border-t border-ink/10">
                    <td className="py-1 font-mono text-xs break-all">{v.sku}</td>
                    <td className="py-1 tabular-nums">{v.estoque_fisico}</td>
                    <td className="py-1 tabular-nums">{v.estoque_reservado}</td>
                    <td className="py-1 tabular-nums">{v.estoque_disponivel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-ink/10 p-4">
        <h2 className="mb-3 font-display text-xl">Insumos</h2>
        {!insumosView || insumosView.length === 0 ? (
          <p className="text-sm text-ink/60">Nenhum insumo cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink/50">
                  <th className="pb-1 font-normal">Insumo</th>
                  <th className="pb-1 font-normal">Tipo</th>
                  <th className="pb-1 font-normal">Estoque</th>
                </tr>
              </thead>
              <tbody>
                {insumosView.map((i) => (
                  <tr key={i.insumo_id} className="border-t border-ink/10">
                    <td className="py-1">{i.nome}</td>
                    <td className="py-1">{i.tipo === "producao" ? "Produção" : "Expedição"}</td>
                    <td className="py-1 tabular-nums">{i.estoque_atual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-ink/10 p-4">
        <h2 className="mb-3 font-display text-xl">Ajuste manual</h2>
        <AjusteForm
          variacoes={(variacoes ?? []).map((v) => ({
            id: v.id,
            label: `${nomePerfume.get(v.perfume_id) ?? "?"} — ${v.volume_ml}ml (${v.sku})`,
          }))}
          insumos={(insumos ?? []).map((i) => ({ id: i.id, label: i.nome }))}
        />
      </section>
    </div>
  );
}
