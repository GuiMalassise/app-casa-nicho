import { createClient } from "@/lib/supabase/server";
import { NovoPerfumeForm } from "./form";

export default async function NovoPerfumePage() {
  const supabase = await createClient();

  const { data: config } = await supabase
    .from("configuracoes")
    .select("valor")
    .eq("chave", "tamanhos_padrao_ml")
    .single();

  const tamanhosPadrao = (config?.valor as number[] | undefined) ?? [];

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("empresa_id")
    .single();

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <h1 className="mb-6 font-display text-3xl text-bordeaux">Novo perfume</h1>
      <NovoPerfumeForm tamanhosPadrao={tamanhosPadrao} empresaId={usuario?.empresa_id ?? ""} />
    </div>
  );
}
