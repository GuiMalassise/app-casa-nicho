"use client";

import { useActionState, useState } from "react";
import { editarPerfume } from "../../actions";
import { createClient } from "@/lib/supabase/client";
import { Botao, classeBotao } from "@/components/botao";

const inputClass =
  "w-full max-w-full rounded border border-ink/20 bg-bone px-3 py-2 text-sm outline-none focus:border-bordeaux";
const precoClass = `${inputClass} w-24`;

type Variacao = {
  id: string;
  volume_ml: number;
  modo_venda: string;
  sku: string;
  preco_venda: number | null;
};

export function EditarPerfumeForm({
  perfume,
  empresaId,
}: {
  perfume: { id: string; nome: string; foto_url: string | null; variacoes: Variacao[] };
  empresaId: string;
}) {
  const [state, formAction, pending] = useActionState(editarPerfume, null);

  const [fotoUrl, setFotoUrl] = useState(perfume.foto_url ?? "");
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [erroFoto, setErroFoto] = useState<string | null>(null);

  async function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setNomeArquivo(arquivo.name);

    if (!arquivo.type.startsWith("image/")) {
      setErroFoto("Envie um arquivo de imagem.");
      return;
    }
    if (arquivo.size > 5 * 1024 * 1024) {
      setErroFoto("Imagem maior que 5MB — tenta uma menor.");
      return;
    }

    setErroFoto(null);
    setEnviandoFoto(true);

    const supabase = createClient();
    const extensao = arquivo.name.split(".").pop();
    const caminho = `${empresaId}/${crypto.randomUUID()}.${extensao}`;

    const { error } = await supabase.storage.from("perfumes").upload(caminho, arquivo);

    setEnviandoFoto(false);

    if (error) {
      setErroFoto(`Não consegui enviar a foto: ${error.message}`);
      return;
    }

    const { data } = supabase.storage.from("perfumes").getPublicUrl(caminho);
    setFotoUrl(data.publicUrl);
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="perfumeId" value={perfume.id} />

      <div className="space-y-1">
        <label htmlFor="nome" className="text-sm text-ink/70">
          Nome do perfume
        </label>
        <input id="nome" name="nome" required defaultValue={perfume.nome} className={inputClass} />
      </div>

      <div className="space-y-2">
        <span className="text-sm text-ink/70">Foto do perfume</span>
        <div className="flex flex-wrap items-center gap-3">
          {fotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fotoUrl} alt="Prévia do perfume" className="h-16 w-16 rounded object-cover" />
          )}
          <label htmlFor="foto" className={classeBotao}>
            Trocar foto
          </label>
          <input
            id="foto"
            type="file"
            accept="image/*"
            onChange={handleFoto}
            disabled={enviandoFoto}
            className="sr-only"
          />
          <span className="text-xs text-ink/50">
            {enviandoFoto ? "Enviando..." : nomeArquivo || "Nenhuma foto nova selecionada"}
          </span>
        </div>
        <input type="hidden" name="fotoUrl" value={fotoUrl} />
        {erroFoto && <p className="text-xs text-bordeaux">{erroFoto}</p>}
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm text-ink/70">Preços por tamanho</legend>
        <p className="text-xs text-ink/50">
          Tamanho, modo e SKU não podem ser alterados aqui — exclua e cadastre de novo se precisar
          mudar isso.
        </p>
        {perfume.variacoes.map((v) => (
          <div key={v.id} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="variacaoId" value={v.id} />
            <span className="w-20 text-sm">
              {v.volume_ml}ml · {v.modo_venda === "fracionado" ? "DEC" : "CX"}
            </span>
            <span className="font-mono text-xs text-ink/40">{v.sku}</span>
            <input
              type="number"
              name={`preco-${v.id}`}
              placeholder="Preço R$"
              min={0}
              step="0.01"
              defaultValue={v.preco_venda ?? ""}
              className={precoClass}
            />
          </div>
        ))}
      </fieldset>

      {state?.erro && <p className="text-sm text-bordeaux">{state.erro}</p>}

      <Botao type="submit" disabled={pending || enviandoFoto}>
        {pending ? "Salvando..." : "Salvar alterações"}
      </Botao>
    </form>
  );
}
