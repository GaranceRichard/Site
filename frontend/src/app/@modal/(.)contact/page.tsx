"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ContactForm from "../../contact/ContactForm";

const ENTER_MS = 320;
const EXIT_MS = 260;

export default function ContactModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // entrée : on laisse un frame au navigateur pour éviter l'effet "flash"
    const t = window.setTimeout(() => setOpen(true), 20);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    if (closing) return;
    setClosing(true);
    setOpen(false);
    window.setTimeout(() => router.back(), EXIT_MS);
  }

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop premium : fade doux + léger blur */}
      <button
        aria-label="Fermer"
        onClick={close}
        className={[
          "absolute inset-0 transition-all",
          "duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          open ? "opacity-100 bg-black/40 backdrop-blur-[2px]" : "opacity-0 bg-black/0 backdrop-blur-0",
        ].join(" ")}
      />

      {/* Panel centré */}
      <div className="absolute left-1/2 top-1/2 w-[min(760px,92vw)] -translate-x-1/2 -translate-y-1/2">
        <div
          className={[
            "rounded-3xl border border-neutral-200 bg-white shadow-2xl",
            "transition-all will-change-transform",
            `duration-[${ENTER_MS}ms] ease-[cubic-bezier(0.22,1,0.36,1)]`,
            open ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-5 scale-[0.97]",
          ].join(" ")}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-6">
            <div>
              <h2 className="text-xl font-semibold">Contact</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Un premier échange, simple et direct.
              </p>
            </div>

            <button
              onClick={close}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
            >
              Fermer
            </button>
          </div>

          {/* Contenu : petite “respiration” décalée */}
          <div
            className={[
              "p-6 transition-all will-change-transform",
              "duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              open ? "opacity-100 translate-y-0 delay-[60ms]" : "opacity-0 translate-y-2 delay-0",
            ].join(" ")}
          >
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
