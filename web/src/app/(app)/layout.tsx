import Link from "next/link";
import { VillaMark } from "@/components/villa-mark";
import { SairButton } from "./sair-button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 px-6 py-4">
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <VillaMark className="h-6 w-6 text-terracotta" />
            <span className="font-display text-lg italic text-bordeaux">
              PerfumeHub
            </span>
          </Link>
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/70">
            <Link href="/dashboard" className="hover:text-bordeaux">
              Dashboard
            </Link>
            <Link href="/perfumes" className="hover:text-bordeaux">
              Perfumes
            </Link>
            <Link href="/estoque" className="hover:text-bordeaux">
              Estoque
            </Link>
            <Link href="/compras" className="hover:text-bordeaux">
              Compras
            </Link>
            <Link href="/producao" className="hover:text-bordeaux">
              Produção
            </Link>
            <Link href="/pedidos" className="hover:text-bordeaux">
              Pedidos
            </Link>
            <Link href="/financeiro" className="hover:text-bordeaux">
              Financeiro
            </Link>
            <Link href="/configuracoes" className="hover:text-bordeaux">
              Configurações
            </Link>
          </nav>
        </div>
        <SairButton />
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
