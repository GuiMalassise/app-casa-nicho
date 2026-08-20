"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function registrarProducao(_prevState: { erro: string } | null, formData: FormData) {
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) {
    return { erro: "Sessão expirada, faça login de novo." };
  }

  const { data: usuario } = await supabase.from("usuarios").select("empresa_id").single();
  if (!usuario) {
    return { erro: "Usuário sem empresa vinculada." };
  }

  const variacaoId = String(formData.get("variacaoId") ?? "");
  const quantidade = Number(formData.get("quantidade") ?? 0);

  if (!variacaoId) return { erro: "Escolha a variação a produzir." };
  if (!quantidade || quantidade <= 0) return { erro: "Informe a quantidade a produzir." };

  const { error } = await supabase.rpc("fn_registrar_producao", {
    p_empresa_id: usuario.empresa_id,
    p_variacao_id: variacaoId,
    p_quantidade: quantidade,
  });

  if (error) {
    if (error.message?.includes("Perfume insuficiente")) {
      return { erro: "Perfume insuficiente nos lotes pra essa quantidade." };
    }
    if (error.code === "P0001") {
      return { erro: "Estoque de insumo insuficiente pra essa produção." };
    }
    return { erro: `Não consegui registrar a produção: ${error.message}` };
  }

  revalidatePath("/producao");
  redirect("/producao");
}
