import { VillaMark } from "@/components/villa-mark";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <VillaMark className="h-16 w-16 text-terracotta" />
      <div className="space-y-2">
        <h1 className="font-display text-4xl italic text-bordeaux">
          PerfumeHub
        </h1>
        <p className="text-sm text-ink/70">
          Gestão de perfumes, decants, estoque e pedidos.
        </p>
      </div>
      <p className="text-xs uppercase tracking-widest text-ink/40">
        Módulo Perfumes em construção
      </p>
    </main>
  );
}
