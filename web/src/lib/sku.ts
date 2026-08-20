export function gerarSku(nomePerfume: string, volumeMl: number) {
  const base = nomePerfume
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base}-${volumeMl}ML`;
}
