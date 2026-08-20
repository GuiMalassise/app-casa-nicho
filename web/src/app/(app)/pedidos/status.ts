import type { Database } from "@/lib/supabase/database.types";

export type PedidoStatus = Database["public"]["Enums"]["pedido_status"];

export const ROTULO_STATUS: Record<PedidoStatus, string> = {
  recebido: "Recebido",
  pagamento_confirmado: "Pagamento confirmado",
  estoque_reservado: "Estoque reservado",
  preparacao: "Em preparação",
  nf_emitida: "NF emitida",
  embalagem: "Embalagem",
  enviado: "Enviado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  pendente_conflito: "Conflito de estoque",
};

export const ORDEM_STATUS: PedidoStatus[] = [
  "recebido",
  "pagamento_confirmado",
  "estoque_reservado",
  "preparacao",
  "nf_emitida",
  "embalagem",
  "enviado",
  "concluido",
];

export function proximoStatus(atual: PedidoStatus): PedidoStatus | null {
  const i = ORDEM_STATUS.indexOf(atual);
  if (i === -1 || i === ORDEM_STATUS.length - 1) return null;
  return ORDEM_STATUS[i + 1];
}
