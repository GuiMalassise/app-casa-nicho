import Link from "next/link";
import { SairButton } from "./sair-button";
import { Nav } from "./nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 px-8 py-4">
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-icone.png" alt="" className="h-8 w-8 rounded object-cover" />
            <span className="font-display text-lg italic text-bordeaux">
              PerfumeOS
            </span>
          </Link>
          <Nav />
        </div>
        <SairButton />
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
