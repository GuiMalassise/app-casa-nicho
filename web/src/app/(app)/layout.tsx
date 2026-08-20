import Link from "next/link";
import { VillaMark } from "@/components/villa-mark";
import { SairButton } from "./sair-button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
        <Link href="/perfumes" className="flex items-center gap-2">
          <VillaMark className="h-6 w-6 text-terracotta" />
          <span className="font-display text-lg italic text-bordeaux">
            PerfumeHub
          </span>
        </Link>
        <SairButton />
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
