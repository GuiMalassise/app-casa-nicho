"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { avancarStatus, cancelarItem, devolverItem } from "./actions";
import { ORDEM_STATUS, ROTULO_STATUS, proximoStatus, type PedidoStatus } from "./status";

export function PedidoAcoes({ pedidoId, status }: { pedidoId: string; status: PedidoStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const proximo = proximoStatus(status);
  const podeCancelar = !["enviado", "concluido", "cancelado"].includes(status);

  function executar(acao: () => Promise<{ erro: string } | { ok: true }>) {
    setErro(null);
    startTransition(async () => {
      const resultado = await acao();
      if ("erro" in resultado) setErro(resultado.erro);
      else router.refresh();
    });
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      {proximo && (
        <button
          type="button"
          disabled={pending}
          onClick={() => executar(() => avancarStatus(pedidoId, proximo))}
          className="text-sm text-bordeaux hover:underline disabled:opacity-60"
        >
          Avançar para: {ROTULO_STATUS[proximo]}
        </button>
      )}
      {podeCancelar && (
        <button
          type="button"
          disabled={pending}
          onClick={() => executar(() => avancarStatus(pedidoId, "cancelado" as PedidoStatus))}
          className="text-sm text-ink/50 hover:text-bordeaux disabled:opacity-60"
        >
          Cancelar pedido
        </button>
      )}
      {erro && <p className="w-full text-xs text-bordeaux">{erro}</p>}
    </div>
  );
}

export function ItemAcoes({
  pedidoItemId,
  statusItem,
  pedidoStatus,
}: {
  pedidoItemId: string;
  statusItem: "ativo" | "cancelado" | "devolvido";
  pedidoStatus: PedidoStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  if (statusItem !== "ativo") return null;

  const jaEnviado = ORDEM_STATUS.indexOf(pedidoStatus) >= ORDEM_STATUS.indexOf("enviado");

  function executar(acao: () => Promise<{ erro: string } | { ok: true }>) {
    setErro(null);
    startTransition(async () => {
      const resultado = await acao();
      if ("erro" in resultado) setErro(resultado.erro);
      else router.refresh();
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      {!jaEnviado && (
        <button
          type="button"
          disabled={pending}
          onClick={() => executar(() => cancelarItem(pedidoItemId))}
          className="text-xs text-ink/50 hover:text-bordeaux disabled:opacity-60"
        >
          Cancelar item
        </button>
      )}
      {jaEnviado && (
        <button
          type="button"
          disabled={pending}
          onClick={() => executar(() => devolverItem(pedidoItemId))}
          className="text-xs text-ink/50 hover:text-bordeaux disabled:opacity-60"
        >
          Devolver
        </button>
      )}
      {erro && <span className="text-xs text-bordeaux">{erro}</span>}
    </span>
  );
}
