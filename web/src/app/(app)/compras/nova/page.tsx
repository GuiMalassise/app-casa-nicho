import { createClient } from "@/lib/supabase/server";
import { NovaCompraForm } from "./form";

export default async function NovaCompraPage() {
  const supabase = await createClient();

  const [{ data: perfumes }, { data: variacoesInteiras }, { data: fornecedores }, { data: insumos }] =
    await Promise.all([
      supabase.from("perfumes").select("id, nome").order("nome"),
      supabase
        .from("variacoes")
        .select("id, perfume_id, volume_ml, sku, perfumes(nome)")
        .eq("modo_venda", "inteiro"),
      supabase.from("fornecedores").select("nome").order("nome"),
      supabase.from("insumos").select("id, nome, tipo").order("nome"),
    ]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 font-display text-3xl text-bordeaux">Nova compra</h1>
      <NovaCompraForm
        perfumes={(perfumes ?? []).map((p) => ({ id: p.id, nome: p.nome }))}
        variacoesInteiras={(variacoesInteiras ?? []).map((v) => ({
          id: v.id,
          label: `${v.perfumes?.nome ?? "?"} — ${v.volume_ml}ml (${v.sku})`,
        }))}
        fornecedores={(fornecedores ?? []).map((f) => f.nome)}
        insumos={(insumos ?? []).map((i) => ({
          id: i.id,
          label: `${i.nome} (${i.tipo === "producao" ? "produção" : "expedição"})`,
        }))}
      />
    </div>
  );
}
