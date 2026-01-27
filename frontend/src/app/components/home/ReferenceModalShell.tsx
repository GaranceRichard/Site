"use client";

import Image from "next/image";
import type { ReactNode } from "react";

type ReferenceModalShellProps = {
  imageSrc: string;
  open: boolean;
  ease: string;
  dur: string;
  children: ReactNode;
};

export default function ReferenceModalShell({
  imageSrc,
  open,
  ease,
  dur,
  children,
}: ReferenceModalShellProps) {
  return (
    <div
      className={[
        "relative mx-auto w-[min(980px,95vw)] overflow-hidden rounded-3xl border border-neutral-200 bg-white/85 shadow-2xl backdrop-blur-md",
        "dark:border-neutral-800 dark:bg-neutral-900/80",
        "transition-[transform,opacity] will-change-transform",
        ease,
        dur,
        open
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-4 scale-[0.98]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            fill
            sizes="(min-width: 768px) 980px, 95vw"
            className="object-cover opacity-[0.22] dark:opacity-[0.16] blur-[6px]"
            priority={false}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-neutral-800 via-neutral-700 to-neutral-900 opacity-[0.35]" />
        )}
        <div className="absolute inset-0 bg-white/18 dark:bg-black/18" />
      </div>

      {children}
    </div>
  );
}
