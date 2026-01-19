// frontend/src/app/backoffice/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackofficeModal from "../components/BackofficeModal";

type Msg = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  consent: boolean;
  source: string;
  created_at: string;
};

export default function BackofficePage() {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [openLogin, setOpenLogin] = useState(false);
  const [items, setItems] = useState<Msg[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  function clearTokens() {
    try {
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("refresh_token");
    } catch {
      // no-op
    }
  }

  function logoutAndGoHome() {
    clearTokens();
    router.push("/");
  }

  async function load() {
    setErrorMsg("");

    if (!apiBase) {
      setStatus("error");
      setErrorMsg("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.");
      return;
    }

    let token: string | null = null;
    try {
      token = sessionStorage.getItem("access_token");
    } catch {
      token = null;
    }

    if (!token) {
      router.push("/");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch(`${apiBase}/api/contact/messages/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        setStatus("idle");
        setItems([]);
        clearTokens();
        setOpenLogin(true);
        return;
      }

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Erreur API (${res.status})`);
      }

      const data = (await res.json()) as Msg[];
      setItems(data);
      setStatus("idle");
    } catch (e: unknown) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Erreur inattendue");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Backoffice</h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              Messages reçus via le formulaire de contact.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={load}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50
                         dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              Rafraîchir
            </button>

            <button
              type="button"
              onClick={logoutAndGoHome}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50
                         dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              Se déconnecter
            </button>
          </div>
        </div>

        {status === "loading" ? (
          <p className="mt-8 text-sm text-neutral-600 dark:text-neutral-300">Chargement…</p>
        ) : null}

        {status === "error" ? (
          <p className="mt-8 whitespace-pre-wrap text-sm text-red-700">Erreur : {errorMsg}</p>
        ) : null}

        <div className="mt-8 grid gap-4">
          {items.length === 0 && status === "idle" ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600
                            dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
              Aucun message.
            </div>
          ) : null}

          {items.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)]
                         dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold">
                  {m.name} — {m.email}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {new Date(m.created_at).toLocaleString()}
                </p>
              </div>

              {m.subject ? (
                <p className="mt-3 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  Sujet : {m.subject}
                </p>
              ) : null}

              <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-200">
                {m.message}
              </p>

              <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
                Source : {m.source || "—"} • Consentement : {m.consent ? "oui" : "non"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <BackofficeModal
        open={openLogin}
        onClose={() => {
          setOpenLogin(false);
          load();
        }}
      />
    </main>
  );
}
