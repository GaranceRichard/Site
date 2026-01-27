"use client";

import Image from "next/image";

type ReferenceModalHeaderProps = {
  label?: string | null;
  nameExpanded: string;
  missionTitle: string;
  badgeSrc?: string | null;
  badgeAlt: string;
  onClose: () => void;
  closeButtonRef: React.RefObject<HTMLButtonElement>;
};

export default function ReferenceModalHeader({
  label,
  nameExpanded,
  missionTitle,
  badgeSrc,
  badgeAlt,
  onClose,
  closeButtonRef,
}: ReferenceModalHeaderProps) {
  return (
    <div className="relative z-10 flex items-start justify-between gap-6 border-b border-neutral-200/70 p-6 dark:border-neutral-800/70">
      <div className="min-w-0">
        {label ? (
          <span className="inline-flex items-center rounded-full border border-neutral-200/70 bg-white/55 px-3 py-1 text-xs font-medium text-neutral-700 backdrop-blur-sm dark:border-neutral-800/70 dark:bg-neutral-950/35 dark:text-neutral-200">
            {label}
          </span>
        ) : null}

        <h3 className="mt-3 truncate text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          {nameExpanded}
        </h3>
        <p className="mt-1 truncate text-sm text-neutral-700 dark:text-neutral-200">
          {missionTitle}
        </p>
      </div>

      <div className="flex shrink-0 items-start gap-3">
        {badgeSrc ? (
          <div className="shrink-0">
            <div className="relative h-20 w-28 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white/55 backdrop-blur-sm dark:border-neutral-800/70 dark:bg-neutral-950/35">
              <Image
                src={badgeSrc}
                alt={badgeAlt}
                fill
                sizes="112px"
                className="object-contain p-2"
                priority={false}
              />
            </div>
          </div>
        ) : null}

        <button
          type="button"
          ref={closeButtonRef}
          onClick={onClose}
          className="rounded-xl border border-neutral-200/70 bg-white/60 px-3 py-2 text-sm font-semibold text-neutral-900 backdrop-blur-sm hover:bg-white/80
                     focus:outline-none focus:ring-2 focus:ring-neutral-400/40
                     dark:border-neutral-800/70 dark:bg-neutral-950/35 dark:text-neutral-50 dark:hover:bg-neutral-950/55"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

