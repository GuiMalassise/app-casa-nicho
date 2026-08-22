import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditarPerfumeForm } from "./form";

export default async function EditarPerfumePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("empresa_id")
    .single();

  const { data: perfume } = await supabase
    .from("perfumes")
    .select("id, nome, foto_url, variacoes (id, volume_ml, modo_venda, sku, preco_venda)")
    .eq("id", id)
    .single();

  if (!perfume) notFound();

  return (
    <div className="mx-auto max-w-lg px-8 py-10">
      <h1 className="mb-6 font-display text-3xl text-bordeaux">Editar perfume</h1>
      <EditarPerfumeForm perfume={perfume} empresaId={usuario?.empresa_id ?? ""} />
    </div>
  );
}
