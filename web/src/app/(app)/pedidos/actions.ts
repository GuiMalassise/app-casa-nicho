"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type PedidoStatus = Database["public"]["Enums"]["pedido_status"];

type ContextoUsuario =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; empresaId: string }
  | { ok: false; erro: string };

async function empresaDoUsuario(): Promise<ContextoUsuario> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) {
    return { ok: false, erro: "Sessão expirada, faça login de novo." };
  }

  const { data: usuario } = await supabase.from("usuarios").select("empresa_id").single();
  if (!usuario) {
    return { ok: false, erro: "Usuário sem empresa vinculada." };
  }

  return { ok: true, supabase, empresaId: usuario.empresa_id };
}

export async function registrarPedido(_prevState: { erro: string } | null, formData: FormData) {
  const ctx = await empresaDoUsuario();
  if (!ctx.ok) return { erro: ctx.erro };
  const { supabase, empresaId } = ctx;

  const canalId = String(formData.get("canalId") ?? "");
  const idExterno = String(formData.get("idExterno") ?? "").trim();
  const clienteNome = String(formData.get("clienteNome") ?? "").trim();
  const valorFrete = Number(formData.get("valorFrete") ?? 0);
  const itensJson = String(formData.get("itens") ?? "[]");

  if (!canalId) return { erro: "Escolha o canal." };
  if (!idExterno) return { erro: "Informe o número/referência do pedido." };

  let itens: { variacaoId: string; quantidade: number; precoUnitario: number }[];
  try {
    itens = JSON.parse(itensJson);
  } catch {
    return { erro: "Itens do pedido inválidos." };
  }
  if (itens.length === 0) return { erro: "Adicione pelo menos um item." };

  const { error } = await supabase.rpc("fn_registrar_pedido", {
    p_empresa_id: empresaId,
    p_canal_id: canalId,
    p_id_externo: idExterno,
    p_cliente_nome: clienteNome,
    p_valor_frete: valorFrete,
    p_itens: itens.map((i) => ({
      variacao_id: i.variacaoId,
      quantidade: i.quantidade,
      preco_unitario: i.precoUnitario,
    })),
  });

  if (error) {
    if (error.code === "23505") {
      return { erro: "Já existe um pedido com esse número/referência nesse canal." };
    }
    return { erro: `Não consegui registrar o pedido: ${error.message}` };
  }

  revalidatePath("/pedidos");
  redirect("/pedidos");
}

export async function avancarStatus(pedidoId: string, novoStatus: PedidoStatus) {
  const ctx = await empresaDoUsuario();
  if (!ctx.ok) return { erro: ctx.erro };
  const { supabase } = ctx;

  const { error } = await supabase.rpc("fn_avancar_status_pedido", {
    p_pedido_id: pedidoId,
    p_novo_status: novoStatus,
  });

  if (error) return { erro: `Não consegui avançar o status: ${error.message}` };
  revalidatePath("/pedidos");
  return { ok: true as const };
}

export async function cancelarItem(pedidoItemId: string) {
  const ctx = await empresaDoUsuario();
  if (!ctx.ok) return { erro: ctx.erro };
  const { supabase } = ctx;

  const { error } = await supabase.rpc("fn_cancelar_item_pedido", {
    p_pedido_item_id: pedidoItemId,
  });

  if (error) return { erro: `Não consegui cancelar o item: ${error.message}` };
  revalidatePath("/pedidos");
  return { ok: true as const };
}

export async function devolverItem(pedidoItemId: string) {
  const ctx = await empresaDoUsuario();
  if (!ctx.ok) return { erro: ctx.erro };
  const { supabase } = ctx;

  const { error } = await supabase.rpc("fn_devolver_item_pedido", {
    p_pedido_item_id: pedidoItemId,
  });

  if (error) return { erro: `Não consegui registrar a devolução: ${error.message}` };
  revalidatePath("/pedidos");
  return { ok: true as const };
}
