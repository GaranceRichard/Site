"use client";

import type { ReactNode } from "react";

type BackofficeModalCardProps = {
  visible: boolean;
  ease: string;
  dur: string;
  children: ReactNode;
};

export default function BackofficeModalCard({
  visible,
  ease,
  dur,
  children,
}: BackofficeModalCardProps) {
  return (
    <div
      className={[
        "relative z-10 w-[min(420px,92vw)] rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl",
        "dark:border-neutral-800 dark:bg-neutral-900",
        "transition-[transform,opacity] will-change-transform",
        ease,
        dur,
        visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-[0.98]",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

