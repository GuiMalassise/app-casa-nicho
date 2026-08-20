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

export async function salvarParametrosGerais(_prevState: { erro: string } | null, formData: FormData) {
  const ctx = await empresaDoUsuario();
  if (!ctx.ok) return { erro: ctx.erro };

  const tamanhos = String(formData.get("tamanhos") ?? "")
    .split(",")
    .map((t) => Number(t.trim()))
    .filter((n) => n > 0);
  const margemAlvo = Number(formData.get("margemAlvo") ?? 0) / 100;
  const custoEmbalagem = Number(formData.get("custoEmbalagem") ?? 0);
  const estoqueMinimo = Number(formData.get("estoqueMinimo") ?? 0);

  if (tamanhos.length === 0) return { erro: "Informe pelo menos um tamanho padrão." };

  const { error } = await ctx.supabase.from("configuracoes").upsert(
    [
      { empresa_id: ctx.empresaId, chave: "tamanhos_padrao_ml", valor: tamanhos },
      { empresa_id: ctx.empresaId, chave: "margem_alvo_padrao", valor: margemAlvo },
      { empresa_id: ctx.empresaId, chave: "custo_embalagem_estimado", valor: custoEmbalagem },
      { empresa_id: ctx.empresaId, chave: "estoque_minimo_padrao", valor: estoqueMinimo },
    ],
    { onConflict: "empresa_id,chave" }
  );

  if (error) return { erro: `Não consegui salvar: ${error.message}` };
  revalidatePath("/configuracoes");
  return { erro: "" };
}

export async function criarCanal(_prevState: { erro: string } | null, formData: FormData) {
  const ctx = await empresaDoUsuario();
  if (!ctx.ok) return { erro: ctx.erro };

  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { erro: "Informe o nome do canal." };

  const { error } = await ctx.supabase.from("canais").insert({ empresa_id: ctx.empresaId, nome });
  if (error) return { erro: `Não consegui salvar: ${error.message}` };
  revalidatePath("/configuracoes");
  return { erro: "" };
}

export async function criarTaxaCanal(_prevState: { erro: string } | null, formData: FormData) {
  const ctx = await empresaDoUsuario();
  if (!ctx.ok) return { erro: ctx.erro };

  const canalId = String(formData.get("canalId") ?? "");
  const faixaMin = Number(formData.get("faixaMin") ?? 0);
  const faixaMaxRaw = String(formData.get("faixaMax") ?? "").trim();
  const percentual = Number(formData.get("percentual") ?? 0);
  const taxaFixa = Number(formData.get("taxaFixa") ?? 0);

  if (!canalId) return { erro: "Escolha o canal." };

  const { error } = await ctx.supabase.from("taxas_canal").insert({
    canal_id: canalId,
    faixa_valor_min: faixaMin,
    faixa_valor_max: faixaMaxRaw ? Number(faixaMaxRaw) : null,
    percentual,
    taxa_fixa: taxaFixa,
  });

  if (error) return { erro: `Não consegui salvar: ${error.message}` };
  revalidatePath("/configuracoes");
  return { erro: "" };
}

export async function criarInsumo(_prevState: { erro: string } | null, formData: FormData) {
  const ctx = await empresaDoUsuario();
  if (!ctx.ok) return { erro: ctx.erro };

  const nome = String(formData.get("nome") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "producao") as "producao" | "expedicao";
  const volumeMlRaw = String(formData.get("volumeMl") ?? "").trim();
  const custoMedio = Number(formData.get("custoMedio") ?? 0);

  if (!nome) return { erro: "Informe o nome do insumo." };

  const { error } = await ctx.supabase.from("insumos").insert({
    empresa_id: ctx.empresaId,
    nome,
    tipo,
    volume_ml: volumeMlRaw ? Number(volumeMlRaw) : null,
    custo_medio: custoMedio,
  });

  if (error) return { erro: `Não consegui salvar: ${error.message}` };
  revalidatePath("/configuracoes");
  return { erro: "" };
}

export async function criarRegraEmbalagem(_prevState: { erro: string } | null, formData: FormData) {
  const ctx = await empresaDoUsuario();
  if (!ctx.ok) return { erro: ctx.erro };

  const tipoCaixa = String(formData.get("tipoCaixa") ?? "").trim();
  const qtdMinima = Number(formData.get("qtdMinima") ?? 0);
  const qtdMaxima = Number(formData.get("qtdMaxima") ?? 0);

  if (!tipoCaixa) return { erro: "Informe o nome da caixa." };
  if (!qtdMinima || !qtdMaxima || qtdMaxima < qtdMinima) {
    return { erro: "Faixa de quantidade inválida." };
  }

  const { error } = await ctx.supabase
    .from("regras_embalagem")
    .insert({ empresa_id: ctx.empresaId, tipo_caixa: tipoCaixa, qtd_minima: qtdMinima, qtd_maxima: qtdMaxima });

  if (error) return { erro: `Não consegui salvar: ${error.message}` };
  revalidatePath("/configuracoes");
  return { erro: "" };
}
