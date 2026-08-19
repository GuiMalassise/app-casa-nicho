export function VillaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* casa */}
      <path d="M20 60 L20 92 L100 92 L100 60 L60 20 Z" />
      {/* losango no cume do telhado */}
      <path d="M60 28 L66 34 L60 40 L54 34 Z" />
      {/* porta em arco */}
      <path d="M52 92 L52 72 A8 8 0 0 1 68 72 L68 92" />
      {/* moeda na porta */}
      <circle cx="60" cy="82" r="3.5" />
      {/* vaso esquerdo */}
      <path d="M28 92 L28 82 L36 82 L36 92" />
      <path d="M32 82 L32 68 M32 74 L26 68 M32 74 L38 68" />
      {/* vaso direito */}
      <path d="M84 92 L84 82 L92 82 L92 92" />
      <path d="M88 82 L88 68 M88 74 L82 68 M88 74 L94 68" />
    </svg>
  );
}
