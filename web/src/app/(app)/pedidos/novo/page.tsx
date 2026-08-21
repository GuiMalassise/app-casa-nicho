import { createClient } from "@/lib/supabase/server";
import { NovoPedidoForm } from "./form";

export default async function NovoPedidoPage() {
  const supabase = await createClient();

  const [{ data: canais }, { data: variacoes }] = await Promise.all([
    supabase.from("canais").select("id, nome").order("nome"),
    supabase
      .from("variacoes")
      .select("id, sku, volume_ml, preco_venda, perfumes (nome)")
      .eq("ativo", true)
      .order("sku"),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <h1 className="mb-6 font-display text-3xl text-bordeaux">Novo pedido</h1>
      <NovoPedidoForm
        canais={(canais ?? []).map((c) => ({ id: c.id, nome: c.nome }))}
        variacoes={(variacoes ?? []).map((v) => ({
          id: v.id,
          label: `${v.perfumes?.nome ?? "?"} — ${v.volume_ml}ml (${v.sku})`,
          precoSugerido: v.preco_venda,
        }))}
      />
    </div>
  );
}
