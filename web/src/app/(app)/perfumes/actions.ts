"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { gerarSku } from "@/lib/sku";

export async function criarPerfume(_prevState: { erro: string } | null, formData: FormData) {
  const supabase = await createClient();

  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) {
    return { erro: "Sessão expirada, faça login de novo." };
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("empresa_id")
    .single();

  if (!usuario) {
    return { erro: "Usuário sem empresa vinculada." };
  }

  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) {
    return { erro: "Informe o nome do perfume." };
  }

  const prefixoSku = String(formData.get("prefixoSku") ?? "").trim() || nome;
  const fotoUrl = String(formData.get("fotoUrl") ?? "").trim() || null;

  function precoDe(chave: string): number | null {
    const valor = Number(formData.get(chave) ?? 0);
    return valor > 0 ? valor : null;
  }

  const variacoes: {
    volumeMl: number;
    modoVenda: "fracionado" | "inteiro";
    preco: number | null;
  }[] = [];

  for (const volumeStr of formData.getAll("tamanho") as string[]) {
    const volumeMl = Number(volumeStr);
    const modoVenda = formData.get(`modo-${volumeStr}`) === "inteiro" ? "inteiro" : "fracionado";
    variacoes.push({ volumeMl, modoVenda, preco: precoDe(`preco-${volumeStr}`) });
  }

  const outroVolume = Number(formData.get("outroVolume") ?? 0);
  if (outroVolume > 0) {
    const modoVenda = formData.get("modo-outro") === "inteiro" ? "inteiro" : "fracionado";
    variacoes.push({ volumeMl: outroVolume, modoVenda, preco: precoDe("preco-outro") });
  }

  if (variacoes.length === 0) {
    return { erro: "Escolha pelo menos um tamanho." };
  }

  const { data: perfume, error: erroPerfume } = await supabase
    .from("perfumes")
    .insert({ empresa_id: usuario.empresa_id, nome, foto_url: fotoUrl })
    .select("id")
    .single();

  if (erroPerfume || !perfume) {
    return { erro: `Não consegui salvar o perfume: ${erroPerfume?.message}` };
  }

  for (const v of variacoes) {
    const { data: variacao, error: erroVariacao } = await supabase
      .from("variacoes")
      .insert({
        empresa_id: usuario.empresa_id,
        perfume_id: perfume.id,
        volume_ml: v.volumeMl,
        modo_venda: v.modoVenda,
        preco_venda: v.preco,
        sku: gerarSku(prefixoSku, v.volumeMl),
      })
      .select("id")
      .single();

    if (erroVariacao || !variacao) {
      return { erro: `Não consegui salvar a variação ${v.volumeMl}ml: ${erroVariacao?.message}` };
    }

    // Ficha técnica padrão: frasco/válvula do tamanho (casado por volume_ml)
    // + insumos gerais de produção (volume_ml nulo, ex: etiqueta de decant).
    // Só pra fracionado — inteiro não passa por produção (§52).
    if (v.modoVenda === "fracionado") {
      const { data: insumosPadrao } = await supabase
        .from("insumos")
        .select("id")
        .eq("tipo", "producao")
        .or(`volume_ml.eq.${v.volumeMl},volume_ml.is.null`);

      if (insumosPadrao && insumosPadrao.length > 0) {
        await supabase.from("fichas_tecnicas").insert(
          insumosPadrao.map((i) => ({
            variacao_id: variacao.id,
            insumo_id: i.id,
            quantidade: 1,
          }))
        );
      }
    }
  }

  revalidatePath("/perfumes");
  redirect("/perfumes");
}
