"use client";

import { useEffect, useRef, useState } from "react";

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
  const retryTimerRef = useRef<number | null>(null);
  const badgeImageRef = useRef<HTMLImageElement | null>(null);
  const retryPerformedRef = useRef<Record<string, true>>({});
  const [hiddenSources, setHiddenSources] = useState<Record<string, true>>({});

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  const currentSource = badgeSrc ?? "";
  const badgeVisible = Boolean(currentSource) && !hiddenSources[currentSource];

  function handleBadgeError() {
    if (retryPerformedRef.current[currentSource]) {
      setHiddenSources((prev) => (prev[currentSource] ? prev : { ...prev, [currentSource]: true }));
      return;
    }

    if (retryTimerRef.current) {
      return;
    }

    retryTimerRef.current = window.setTimeout(() => {
      retryPerformedRef.current[currentSource] = true;
      const img = badgeImageRef.current;
      if (img && img.getAttribute("src") === currentSource) {
        const separator = currentSource.includes("?") ? "&" : "?";
        img.setAttribute("src", `${currentSource}${separator}retry=${Date.now()}`);
      }
      retryTimerRef.current = null;
    }, 250);
  }

  return (
    <div className="relative z-10 flex items-start justify-between gap-6 border-b subtle-divider bg-transparent p-6">
      <div className="min-w-0">
        <h3 className="truncate text-3xl font-semibold tracking-[-0.04em]">{nameExpanded}</h3>
      </div>

      <div className="flex shrink-0 items-start gap-3">
        {badgeVisible ? (
          <div className="shrink-0">
            <div className="relative h-20 w-28 overflow-hidden bg-transparent">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={badgeImageRef}
                src={currentSource}
                alt={badgeAlt}
                className="h-full w-full object-contain"
                loading="eager"
                decoding="async"
                onError={handleBadgeError}
              />
            </div>
          </div>
        ) : null}

        <button
          type="button"
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Fermer"
          className="secondary-button px-3 py-2 text-sm font-semibold backdrop-blur-sm focus:outline-none"
        >
          X
        </button>
      </div>
    </div>
  );
}
