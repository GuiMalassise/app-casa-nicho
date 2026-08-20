"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ItemCompra =
  | { perfumeId: string; volumeMl: number; valorPago: number }
  | { variacaoId: string; quantidade: number; valorPago: number }
  | { insumoId: string; quantidade: number; valorPago: number };

export async function registrarCompra(_prevState: { erro: string } | null, formData: FormData) {
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) {
    return { erro: "Sessão expirada, faça login de novo." };
  }

  const { data: usuario } = await supabase.from("usuarios").select("empresa_id").single();
  if (!usuario) {
    return { erro: "Usuário sem empresa vinculada." };
  }

  const nomeFornecedor = String(formData.get("fornecedor") ?? "").trim();
  const data = String(formData.get("data") ?? "");
  const freteTotal = Number(formData.get("freteTotal") ?? 0);
  const itensJson = String(formData.get("itens") ?? "[]");

  if (!nomeFornecedor) return { erro: "Informe o fornecedor." };
  if (!data) return { erro: "Informe a data da compra." };

  let itens: ItemCompra[];
  try {
    itens = JSON.parse(itensJson);
  } catch {
    return { erro: "Itens da compra inválidos." };
  }
  if (itens.length === 0) {
    return { erro: "Adicione pelo menos um item." };
  }

  // Fornecedor: reaproveita se já existir com esse nome, senão cria.
  const { data: fornecedorExistente } = await supabase
    .from("fornecedores")
    .select("id")
    .eq("nome", nomeFornecedor)
    .maybeSingle();

  let fornecedorId = fornecedorExistente?.id;
  if (!fornecedorId) {
    const { data: novoFornecedor, error: erroFornecedor } = await supabase
      .from("fornecedores")
      .insert({ empresa_id: usuario.empresa_id, nome: nomeFornecedor })
      .select("id")
      .single();

    if (erroFornecedor || !novoFornecedor) {
      return { erro: `Não consegui salvar o fornecedor: ${erroFornecedor?.message}` };
    }
    fornecedorId = novoFornecedor.id;
  }

  const itensRpc = itens.map((item) => {
    if ("perfumeId" in item) {
      return { perfume_id: item.perfumeId, volume_ml: item.volumeMl, valor_pago: item.valorPago };
    }
    if ("insumoId" in item) {
      return { insumo_id: item.insumoId, quantidade: item.quantidade, valor_pago: item.valorPago };
    }
    return { variacao_id: item.variacaoId, quantidade: item.quantidade, valor_pago: item.valorPago };
  });

  const { error } = await supabase.rpc("fn_registrar_compra", {
    p_empresa_id: usuario.empresa_id,
    p_fornecedor_id: fornecedorId,
    p_data: data,
    p_frete_total: freteTotal,
    p_itens: itensRpc,
  });

  if (error) {
    return { erro: `Não consegui registrar a compra: ${error.message}` };
  }

  revalidatePath("/compras");
  redirect("/compras");
}
