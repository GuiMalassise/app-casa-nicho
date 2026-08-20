"use client";

import { useActionState, useEffect, useState } from "react";
import { criarPerfume } from "../actions";
import { gerarSku, normalizarPrefixoSku } from "@/lib/sku";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "w-full rounded border border-ink/20 bg-bone px-3 py-2 text-sm outline-none focus:border-bordeaux";
const selectClass =
  "rounded border border-ink/20 bg-bone px-2 py-1 text-sm outline-none focus:border-bordeaux";
const precoClass = `${inputClass} w-24`;

export function NovoPerfumeForm({
  tamanhosPadrao,
  empresaId,
}: {
  tamanhosPadrao: number[];
  empresaId: string;
}) {
  const [state, formAction, pending] = useActionState(criarPerfume, null);

  const [nome, setNome] = useState("");
  const [prefixo, setPrefixo] = useState("");
  const [prefixoEditado, setPrefixoEditado] = useState(false);
  const [outroVolume, setOutroVolume] = useState("");

  const [fotoUrl, setFotoUrl] = useState("");
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [erroFoto, setErroFoto] = useState<string | null>(null);

  useEffect(() => {
    if (!prefixoEditado) setPrefixo(normalizarPrefixoSku(nome));
  }, [nome, prefixoEditado]);

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
      <div className="space-y-1">
        <label htmlFor="nome" className="text-sm text-ink/70">
          Nome do perfume
        </label>
        <input
          id="nome"
          name="nome"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="prefixoSku" className="text-sm text-ink/70">
          Prefixo do SKU
        </label>
        <input
          id="prefixoSku"
          name="prefixoSku"
          value={prefixo}
          onChange={(e) => {
            setPrefixo(e.target.value);
            setPrefixoEditado(true);
          }}
          className={`${inputClass} font-mono text-xs`}
        />
        <p className="text-xs text-ink/50">
          Pode encurtar — o SKU final é {normalizarPrefixoSku(prefixo) || "PREFIXO"}
          -[TAMANHO]ML.
        </p>
      </div>

      <div className="space-y-2">
        <span className="text-sm text-ink/70">Foto do perfume</span>
        <div className="flex flex-wrap items-center gap-3">
          {fotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fotoUrl}
              alt="Prévia do perfume"
              className="h-16 w-16 rounded object-cover"
            />
          )}
          <label
            htmlFor="foto"
            className="cursor-pointer rounded-full bg-bordeaux px-4 py-1.5 text-sm font-medium text-bone hover:bg-bordeaux/90"
          >
            Escolher foto
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
            {enviandoFoto ? "Enviando..." : nomeArquivo || "Nenhuma foto selecionada"}
          </span>
        </div>
        <input type="hidden" name="fotoUrl" value={fotoUrl} />
        {erroFoto && <p className="text-xs text-bordeaux">{erroFoto}</p>}
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm text-ink/70">Tamanhos</legend>
        {tamanhosPadrao.map((tamanho) => (
          <div key={tamanho} className="flex flex-wrap items-center gap-2">
            <label className="flex w-32 items-center gap-2 text-sm">
              <input type="checkbox" name="tamanho" value={tamanho} defaultChecked />
              {tamanho}ml
            </label>
            <select name={`modo-${tamanho}`} defaultValue="fracionado" className={selectClass}>
              <option value="fracionado">Fracionado (decant)</option>
              <option value="inteiro">Inteiro (frasco fechado)</option>
            </select>
            <input
              type="number"
              name={`preco-${tamanho}`}
              placeholder="Preço R$"
              min={0}
              step="0.01"
              className={precoClass}
            />
            <span className="font-mono text-xs text-ink/40">
              {gerarSku(prefixo, tamanho)}
            </span>
          </div>
        ))}

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            name="outroVolume"
            placeholder="Outro tamanho (ml)"
            min={0}
            step="0.01"
            value={outroVolume}
            onChange={(e) => setOutroVolume(e.target.value)}
            className={`${inputClass} w-32`}
          />
          <select name="modo-outro" defaultValue="fracionado" className={selectClass}>
            <option value="fracionado">Fracionado (decant)</option>
            <option value="inteiro">Inteiro (frasco fechado)</option>
          </select>
          <input
            type="number"
            name="preco-outro"
            placeholder="Preço R$"
            min={0}
            step="0.01"
            className={precoClass}
          />
          {outroVolume && (
            <span className="font-mono text-xs text-ink/40">
              {gerarSku(prefixo, Number(outroVolume))}
            </span>
          )}
        </div>
      </fieldset>

      {state?.erro && <p className="text-sm text-bordeaux">{state.erro}</p>}

      <button
        type="submit"
        disabled={pending || enviandoFoto}
        className="rounded bg-bordeaux px-4 py-2 text-sm font-medium text-bone disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar perfume"}
      </button>
    </form>
  );
}
