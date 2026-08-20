import Link from "next/link";
import type { ComponentProps } from "react";

export const classeBotao =
  "inline-flex cursor-pointer items-center justify-center rounded-full bg-bordeaux px-4 py-2 text-sm font-medium text-bone hover:bg-bordeaux/90 disabled:cursor-default disabled:opacity-60";
const classeBase = classeBotao;

export function Botao({ className, ...props }: ComponentProps<"button">) {
  return <button className={`${classeBase} ${className ?? ""}`} {...props} />;
}

export function BotaoLink({ className, ...props }: ComponentProps<typeof Link>) {
  return <Link className={`${classeBase} ${className ?? ""}`} {...props} />;
}
