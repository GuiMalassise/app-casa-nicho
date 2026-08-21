import { createClient } from "@/lib/supabase/server";
import { NovaProducaoForm } from "./form";

export default async function NovaProducaoPage() {
  const supabase = await createClient();

  const [{ data: variacoes }, { data: estoquePerfume }] = await Promise.all([
    supabase
      .from("variacoes")
      .select("id, volume_ml, sku, perfume_id, perfumes (nome)")
      .eq("modo_venda", "fracionado")
      .order("sku"),
    supabase.from("vw_estoque_perfume").select("perfume_id, volume_total_ml"),
  ]);

  const disponivelPorPerfume = new Map(
    (estoquePerfume ?? []).map((e) => [e.perfume_id, e.volume_total_ml])
  );

  return (
    <div className="mx-auto max-w-lg px-8 py-10">
      <h1 className="mb-6 font-display text-3xl text-bordeaux">Nova produção</h1>
      <NovaProducaoForm
        variacoes={(variacoes ?? []).map((v) => ({
          id: v.id,
          label: `${v.perfumes?.nome ?? "?"} — ${v.volume_ml}ml (${v.sku})`,
          volumeMl: v.volume_ml,
          disponivelMl: disponivelPorPerfume.get(v.perfume_id) ?? 0,
        }))}
      />
    </div>
  );
}
