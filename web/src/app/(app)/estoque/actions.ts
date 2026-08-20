"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function registrarAjuste(_prevState: { erro: string } | { ok: true } | null, formData: FormData) {
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) {
    return { erro: "Sessão expirada, faça login de novo." };
  }

  const { data: usuario } = await supabase.from("usuarios").select("empresa_id").single();
  if (!usuario) {
    return { erro: "Usuário sem empresa vinculada." };
  }

  const itemTipo = String(formData.get("itemTipo") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const tipoAjuste = String(formData.get("tipoAjuste") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim();
  const quantidadeInformada = Number(formData.get("quantidade") ?? 0);

  if ((itemTipo !== "variacao" && itemTipo !== "insumo") || !itemId) {
    return { erro: "Escolha o item a ajustar." };
  }
  if (!motivo) {
    return { erro: "Informe o motivo do ajuste." };
  }
  if (!quantidadeInformada) {
    return { erro: "Informe a quantidade." };
  }

  // Perda e avaria são sempre saída (negativo), independente do sinal digitado.
  // Ajuste de contagem usa o sinal digitado (pode corrigir pra cima ou pra baixo).
  const quantidade =
    tipoAjuste === "ajuste" ? quantidadeInformada : -Math.abs(quantidadeInformada);

  const movimentacaoTipo = tipoAjuste === "perda" || tipoAjuste === "avaria" ? tipoAjuste : "ajuste";

  const { error } = await supabase.from("movimentacoes_estoque").insert({
    empresa_id: usuario.empresa_id,
    item_tipo: itemTipo,
    item_id: itemId,
    movimentacao_tipo: movimentacaoTipo,
    quantidade,
    origem_tipo: "ajuste_manual",
    origem_id: crypto.randomUUID(),
    motivo,
  });

  if (error) {
    if (error.code === "P0001") {
      return { erro: "Estoque insuficiente pra essa baixa — confere o saldo atual." };
    }
    return { erro: `Não consegui registrar o ajuste: ${error.message}` };
  }

  revalidatePath("/estoque");
  return { ok: true as const };
}
