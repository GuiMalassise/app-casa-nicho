export function normalizarPrefixoSku(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function gerarSku(prefixo: string, volumeMl: number) {
  return `${normalizarPrefixoSku(prefixo)}-${volumeMl}ML`;
}
