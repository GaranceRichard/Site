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
        "panel-elevated relative mx-auto w-[min(980px,95vw)] overflow-hidden backdrop-blur-md",
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
          <div className="h-full w-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 opacity-[0.35]" />
        )}
        <div className="absolute inset-0 bg-[color:color-mix(in_srgb,var(--surface-elevated)_80%,transparent)]/80" />
      </div>

      {children}
    </div>
  );
}
