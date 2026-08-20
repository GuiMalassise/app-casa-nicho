"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-ink/70">
      {itens.map((item) => {
        const ativo = pathname === item.href || pathname?.startsWith(`${item.href}/`);
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
  );
}
