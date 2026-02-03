"use client";
import { useEffect, useState } from "react";

type ReferenceModalHeaderProps = {
  nameExpanded: string;
  badgeSrc?: string | null;
  badgeAlt: string;
  onClose: () => void;
  closeButtonRef: React.RefObject<HTMLButtonElement | null>;
};

export default function ReferenceModalHeader({
  nameExpanded,
  badgeSrc,
  badgeAlt,
  onClose,
  closeButtonRef,
}: ReferenceModalHeaderProps) {
  const [badgeVisible, setBadgeVisible] = useState(Boolean(badgeSrc));

  useEffect(() => {
    setBadgeVisible(Boolean(badgeSrc));
  }, [badgeSrc]);

  return (
    <div className="relative z-10 flex items-start justify-between gap-6 border-b border-neutral-200/70 bg-transparent p-6 dark:border-neutral-800/70">
      <div className="min-w-0">
        <h3 className="truncate text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
          {nameExpanded}
        </h3>
      </div>

      <div className="flex shrink-0 items-start gap-3">
        {badgeSrc && badgeVisible ? (
          <div className="shrink-0">
            <div className="relative h-20 w-28 overflow-hidden bg-transparent">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={badgeSrc}
                alt={badgeAlt}
                className="h-full w-full object-contain"
                loading="lazy"
                decoding="async"
                onError={() => setBadgeVisible(false)}
              />
            </div>
          </div>
        ) : null}

        <button
          type="button"
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Fermer"
          className="rounded-full border border-neutral-200/70 bg-white/60 px-3 py-2 text-sm font-semibold text-neutral-900 backdrop-blur-sm hover:bg-white/80
                     focus:outline-none focus:ring-2 focus:ring-neutral-400/40
                     dark:border-neutral-800/70 dark:bg-neutral-950/35 dark:text-neutral-50 dark:hover:bg-neutral-950/55"
        >
          X
        </button>
      </div>
    </div>
  );
}
