"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SairButton } from "./sair-button";

const itens = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/perfumes", label: "Perfumes" },
  { href: "/estoque", label: "Estoque" },
  { href: "/compras", label: "Compras" },
  { href: "/producao", label: "Produção" },
  { href: "/pedidos", label: "Pedidos" },
  { href: "/financeiro", label: "Financeiro" },
  { href: "/configuracoes", label: "Configurações" },
];

function itemAtivo(pathname: string | null, href: string) {
  return pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
}

export function Nav() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const tituloAtual = itens.find((item) => itemAtivo(pathname, item.href))?.label ?? "PerfumeOS";

  return (
    <>
      {/* Mobile: botão de menu + nome da página atual */}
      <div className="flex flex-1 items-center gap-3 sm:hidden">
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/20 text-lg leading-none text-ink/70"
        >
          {aberto ? "✕" : "☰"}
        </button>
        <span className="font-display text-lg text-bordeaux">{tituloAtual}</span>
      </div>

      {/* Desktop: nav horizontal completa */}
      <nav className="hidden flex-wrap gap-x-2 gap-y-1 text-sm text-ink/70 sm:flex">
        {itens.map((item) => {
          const ativo = itemAtivo(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                ativo
                  ? "rounded-full border border-bordeaux px-3 py-1 text-bordeaux"
                  : "rounded-full px-3 py-1 hover:text-bordeaux"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Menu suspenso mobile */}
      {aberto && (
        <div className="w-full border-t border-ink/10 pt-3 sm:hidden">
          <nav className="flex flex-col gap-1">
            {itens.map((item) => {
              const ativo = itemAtivo(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setAberto(false)}
                  className={
                    ativo
                      ? "rounded-full border border-bordeaux px-3 py-2 text-sm text-bordeaux"
                      : "rounded-full px-3 py-2 text-sm text-ink/70 hover:text-bordeaux"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3">
            <SairButton />
          </div>
        </div>
      )}
    </>
  );
}
