"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function empresaDoUsuario() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return { ok: false as const, erro: "Sessão expirada, faça login de novo." };

  const { data: usuario } = await supabase.from("usuarios").select("empresa_id").single();
  if (!usuario) return { ok: false as const, erro: "Usuário sem empresa vinculada." };

  return { ok: true as const, supabase, empresaId: usuario.empresa_id };
}

export async function criarDespesaFixa(_prevState: { erro: string } | null, formData: FormData) {
  const ctx = await empresaDoUsuario();
  if (!ctx.ok) return { erro: ctx.erro };

  const nome = String(formData.get("nome") ?? "").trim();
  const valor = Number(formData.get("valor") ?? 0);
  if (!nome) return { erro: "Informe o nome da despesa." };
  if (!valor || valor <= 0) return { erro: "Informe o valor." };

  const { error } = await ctx.supabase
    .from("despesas_fixas")
    .insert({ empresa_id: ctx.empresaId, nome, valor, recorrencia: "mensal" });

  if (error) return { erro: `Não consegui salvar: ${error.message}` };
  revalidatePath("/financeiro");
  return { erro: "" };
}

export async function lancarDespesasDoMes() {
  const ctx = await empresaDoUsuario();
  if (!ctx.ok) return { erro: ctx.erro };

  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10);

  const { data: despesas } = await ctx.supabase
    .from("despesas_fixas")
    .select("id, nome, valor")
    .eq("ativo", true);

  if (!despesas || despesas.length === 0) return { ok: true as const };

  const { data: jaLancadas } = await ctx.supabase
    .from("lancamentos_financeiros")
    .select("despesa_fixa_id")
    .gte("data", inicioMes)
    .lte("data", fimMes)
    .not("despesa_fixa_id", "is", null);

  const idsJaLancados = new Set((jaLancadas ?? []).map((l) => l.despesa_fixa_id));
  const pendentes = despesas.filter((d) => !idsJaLancados.has(d.id));

  if (pendentes.length === 0) return { ok: true as const };

  const { error } = await ctx.supabase.from("lancamentos_financeiros").insert(
    pendentes.map((d) => ({
      empresa_id: ctx.empresaId,
      tipo: "despesa" as const,
      categoria: d.nome,
      valor: d.valor,
      data: hoje.toISOString().slice(0, 10),
      despesa_fixa_id: d.id,
    }))
  );

  if (error) return { erro: `Não consegui lançar: ${error.message}` };
  revalidatePath("/financeiro");
  return { ok: true as const };
}

export async function criarLancamento(_prevState: { erro: string } | null, formData: FormData) {
  const ctx = await empresaDoUsuario();
  if (!ctx.ok) return { erro: ctx.erro };

  const tipo = String(formData.get("tipo") ?? "despesa") as "receita" | "despesa";
  const categoria = String(formData.get("categoria") ?? "").trim();
  const valor = Number(formData.get("valor") ?? 0);
  const data = String(formData.get("data") ?? "");

  if (!categoria) return { erro: "Informe a categoria." };
  if (!valor || valor <= 0) return { erro: "Informe o valor." };
  if (!data) return { erro: "Informe a data." };

  const { error } = await ctx.supabase
    .from("lancamentos_financeiros")
    .insert({ empresa_id: ctx.empresaId, tipo, categoria, valor, data });

  if (error) return { erro: `Não consegui salvar: ${error.message}` };
  revalidatePath("/financeiro");
  return { erro: "" };
}

export async function criarRecebimento(_prevState: { erro: string } | null, formData: FormData) {
  const ctx = await empresaDoUsuario();
  if (!ctx.ok) return { erro: ctx.erro };

  const valor = Number(formData.get("valor") ?? 0);
  const recebidoEm = String(formData.get("recebidoEm") ?? "");
  const pedidoIdExterno = String(formData.get("pedidoIdExterno") ?? "").trim();

  if (!valor || valor <= 0) return { erro: "Informe o valor recebido." };
  if (!recebidoEm) return { erro: "Informe a data." };

  let pedidoId: string | null = null;
  if (pedidoIdExterno) {
    const { data: pedido } = await ctx.supabase
      .from("pedidos")
      .select("id")
      .eq("id_externo", pedidoIdExterno)
      .maybeSingle();
    if (!pedido) return { erro: "Pedido não encontrado com essa referência." };
    pedidoId = pedido.id;
  }

  const { error } = await ctx.supabase
    .from("caixa_movimentos")
    .insert({ empresa_id: ctx.empresaId, pedido_id: pedidoId, valor, recebido_em: recebidoEm });

  if (error) return { erro: `Não consegui salvar: ${error.message}` };
  revalidatePath("/financeiro");
  return { erro: "" };
}
