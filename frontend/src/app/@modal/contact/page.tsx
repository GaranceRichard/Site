// frontend/src/app/@modal/contact/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import ContactForm from "../../contact/ContactForm";

const EXIT_MS = 520;
const FLASH_KEY = "flash";

export default function ContactModal() {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  const prevOverflowRef = useRef<string>("");
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (pathname !== "/contact") {
      setOpen(false);
      setClosing(false);
      if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      return;
    }

    prevOverflowRef.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    openTimerRef.current = window.setTimeout(() => setOpen(true), 20);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function close() {
    if (closing) return;
    setClosing(true);
    setOpen(false);

    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      document.body.style.overflow = prevOverflowRef.current;
      router.push("/");
    }, EXIT_MS);
  }

  function handleSuccess() {
    try {
      window.sessionStorage.setItem(FLASH_KEY, "contact_success");
    } catch {
      // no-op
    }
    close();
  }

  if (pathname !== "/contact") return null;

  const ease = "ease-[cubic-bezier(0.22,1,0.36,1)]";
  const dur = open ? "duration-[420ms]" : "duration-[520ms]";

  return (
    <div
      className={[
        "fixed inset-0 z-[100]",
        open ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Fermer"
        onClick={close}
        className={[
          "absolute inset-0",
          "transition-[opacity,backdrop-filter,background-color]",
          ease,
          dur,
          open
            ? "pointer-events-auto opacity-100 bg-black/40 backdrop-blur-[2px]"
            : "pointer-events-none opacity-0 bg-black/0 backdrop-blur-0",
        ].join(" ")}
      />

      {/* Panel centré */}
      <div className="absolute left-1/2 top-1/2 w-[min(760px,92vw)] -translate-x-1/2 -translate-y-1/2">
        <div
          className={[
            "rounded-3xl border border-neutral-200 bg-white text-neutral-900 shadow-2xl",
            "dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50",
            "transition-[transform,opacity] will-change-transform",
            ease,
            dur,
            open
              ? "pointer-events-auto opacity-100 translate-y-0 scale-100"
              : "pointer-events-none opacity-0 translate-y-4 scale-[0.98]",
          ].join(" ")}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-6 dark:border-neutral-800">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
                Contact
              </h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                Un premier échange, simple et direct.
              </p>
            </div>

            <button
              type="button"
              onClick={close}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-50
                         dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:hover:bg-neutral-900"
            >
              Fermer
            </button>
          </div>

          {/* Contenu */}
          <div
            className={[
              "p-6",
              "transition-[transform,opacity] will-change-transform",
              ease,
              dur,
              open
                ? "opacity-100 translate-y-0 delay-[90ms]"
                : "opacity-0 translate-y-2 delay-0",
            ].join(" ")}
          >
            <ContactForm onSuccess={handleSuccess} />
          </div>
        </div>
      </div>
    </div>
  );
}
