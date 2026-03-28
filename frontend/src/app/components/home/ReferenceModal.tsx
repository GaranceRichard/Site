// frontend/src/app/components/home/ReferenceModal.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type { ReferenceItem } from "../../content/references";
import { ANALYTICS_EVENTS, trackEvent } from "../../lib/analytics";
import ReferenceModalBackdrop from "./ReferenceModalBackdrop";
import ReferenceModalBody from "./ReferenceModalBody";
import ReferenceModalHeader from "./ReferenceModalHeader";
import ReferenceModalShell from "./ReferenceModalShell";

const EXIT_MS = 520;

function clearTimeoutRef(ref: MutableRefObject<number | null>) {
  window.clearTimeout(ref.current as number);
  ref.current = null;
}

function cancelAnimationFrameRef(ref: MutableRefObject<number | null>) {
  cancelAnimationFrame(ref.current as number);
  ref.current = null;
}

export default function ReferenceModal({
  item,
  onClose,
}: {
  item: ReferenceItem | null;
  onClose: () => void;
}) {
  const [mountedItem, setMountedItem] = useState<ReferenceItem | null>(null);
  const [open, setOpen] = useState(false);

  const closingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const forcedCloseRef = useRef<number | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const beginClose = useCallback(
    (notifyParent: boolean) => {
      if (closingRef.current) return;
      closingRef.current = true;

      setOpen(false);

      clearTimeoutRef(closeTimerRef);
      closeTimerRef.current = window.setTimeout(() => {
        setMountedItem(null);
        closingRef.current = false;
        const previousFocus = previousFocusRef.current;
        if (previousFocus && document.contains(previousFocus)) {
          previousFocus.focus();
        }
        if (notifyParent) onClose();
      }, EXIT_MS);
    },
    [onClose],
  );

  const requestClose = useCallback(() => beginClose(true), [beginClose]);

  useEffect(() => {
    if (!item) {
      return;
    }

    trackEvent(ANALYTICS_EVENTS.REFERENCE_OPEN, {
      reference_name: item.nameExpanded,
    });
  }, [item]);

  useEffect(() => {
    if (!item) {
      // Parent forced close: animate out but do not call onClose again.
      if (mountedItem && !closingRef.current) {
        clearTimeoutRef(forcedCloseRef);
        forcedCloseRef.current = window.setTimeout(() => beginClose(false), 0);
      }
      return;
    }

    const activeEl = document.activeElement;
    previousFocusRef.current = activeEl instanceof HTMLElement ? activeEl : null;

    // This local state is intentionally driven by a prop change to enable exit animations.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMountedItem(item);
    closingRef.current = false;

    cancelAnimationFrameRef(rafRef);
    rafRef.current = requestAnimationFrame(() => {
      setOpen(true);
      // Focus a safe control once visible.
      window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    });

    return () => {
      cancelAnimationFrameRef(rafRef);
      clearTimeoutRef(forcedCloseRef);
    };
  }, [item, mountedItem, beginClose]);

  useEffect(() => {
    if (!mountedItem) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mountedItem, requestClose]);

  useEffect(() => {
    return () => {
      clearTimeoutRef(closeTimerRef);
      cancelAnimationFrameRef(rafRef);
      clearTimeoutRef(forcedCloseRef);
    };
  }, []);

  if (!mountedItem) return null;

  const ease = "ease-[cubic-bezier(0.22,1,0.36,1)]";
  const dur = open ? "duration-[420ms]" : "duration-[520ms]";

  const badgeSrc = mountedItem.badgeSrc;
  const badgeAlt = mountedItem.badgeAlt ?? "Badge";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Détail de mission — ${mountedItem.nameExpanded}`}
      className="fixed inset-0 z-[120] p-4"
    >
      <ReferenceModalBackdrop open={open} ease={ease} dur={dur} onClose={requestClose} />

      <ReferenceModalShell imageSrc={mountedItem.imageSrc} open={open} ease={ease} dur={dur}>
        <ReferenceModalHeader
          key={badgeSrc ?? mountedItem.id}
          nameExpanded={mountedItem.nameExpanded}
          badgeSrc={badgeSrc}
          badgeAlt={badgeAlt}
          onClose={requestClose}
          closeButtonRef={closeButtonRef}
        />

        <ReferenceModalBody
          situation={mountedItem.situation}
          tasks={mountedItem.tasks}
          actions={mountedItem.actions}
          results={mountedItem.results}
        />
      </ReferenceModalShell>
    </div>
  );
}
