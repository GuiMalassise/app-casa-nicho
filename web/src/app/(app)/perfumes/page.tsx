import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PerfumesPage() {
  const supabase = await createClient();

  const { data: perfumes } = await supabase
    .from("perfumes")
    .select("id, nome, variacoes (id, volume_ml, modo_venda, sku, preco_venda)")
    .order("nome");

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl text-bordeaux">Perfumes</h1>
        <Link
          href="/perfumes/novo"
          className="rounded bg-bordeaux px-4 py-2 text-sm font-medium text-bone"
        >
          Novo perfume
        </Link>
      </div>

      {!perfumes || perfumes.length === 0 ? (
        <p className="text-sm text-ink/60">Nenhum perfume cadastrado ainda.</p>
      ) : (
        <div className="space-y-4">
          {perfumes.map((p) => (
            <div key={p.id} className="rounded-lg border border-ink/10 p-4">
              <h2 className="font-display text-xl">{p.nome}</h2>
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="text-left text-ink/50">
                    <th className="pb-1 font-normal">Tamanho</th>
                    <th className="pb-1 font-normal">Modo</th>
                    <th className="pb-1 font-normal">SKU</th>
                    <th className="pb-1 font-normal">Preço</th>
                  </tr>
                </thead>
                <tbody>
                  {p.variacoes.map((v) => (
                    <tr key={v.id} className="border-t border-ink/10">
                      <td className="py-1 tabular-nums">{v.volume_ml}ml</td>
                      <td className="py-1">
                        {v.modo_venda === "fracionado" ? "Fracionado" : "Inteiro"}
                      </td>
                      <td className="py-1 font-mono text-xs">{v.sku}</td>
                      <td className="py-1 tabular-nums">
                        {v.preco_venda ? `R$ ${v.preco_venda}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
