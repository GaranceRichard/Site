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
  const [section, setSection] = useState<"messages" | "stats" | "settings">("messages");
  const [items, setItems] = useState<Msg[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [authMsg, setAuthMsg] = useState<string>("");
  const [selected, setSelected] = useState<Msg | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  const PAGE_SIZE = 8;

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

  function goHome() {
    router.push("/");
  }

  async function load() {
    setErrorMsg("");
    setAuthMsg("");
    setPage(1);

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
      setStatus("idle");
      setItems([]);
      setAuthMsg("Connexion requise pour acceder au backoffice.");
      setOpenLogin(true);
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch(`${apiBase}/api/contact/messages/admin?limit=500`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        setStatus("idle");
        setItems([]);
        clearTokens();
        setAuthMsg("Session expiree ou acces refuse. Reconnectez-vous.");
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
      setAuthMsg("");
    } catch (e: unknown) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Erreur inattendue");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = query.trim().toLowerCase();
  const filteredItems = search
    ? items.filter((m) => {
        const name = m.name.toLowerCase();
        const email = m.email.toLowerCase();
        const subject = (m.subject || "").toLowerCase();
        return name.includes(search) || email.includes(search) || subject.includes(search);
      })
    : items;

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const visibleItems = filteredItems.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <main className="h-screen overflow-hidden bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <div className="flex h-full">
        <aside className="w-64 shrink-0 border-r border-neutral-200 bg-white px-5 py-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Admin</p>
            <h1 className="mt-3 text-xl font-semibold">Backoffice</h1>
          </div>

          <div className="mt-8 space-y-2">
            <button
              type="button"
              onClick={() => setSection("messages")}
              className={[
                "w-full rounded-xl px-3 py-2 text-left text-sm font-semibold",
                section === "messages"
                  ? "bg-neutral-900 text-white"
                  : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
                "dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900",
              ].join(" ")}
            >
              Messages contact
            </button>
            <button
              type="button"
              onClick={() => setSection("stats")}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left text-sm font-semibold text-neutral-400"
              disabled
            >
              Statistiques (bientôt)
            </button>
            <button
              type="button"
              onClick={() => setSection("settings")}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left text-sm font-semibold text-neutral-400"
              disabled
            >
              Réglages (bientôt)
            </button>
          </div>

          <div className="mt-auto space-y-2 pt-6">
            <button
              type="button"
              onClick={goHome}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left text-sm font-semibold hover:bg-neutral-50
                         dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
            >
              Retour au site
            </button>
            <button
              type="button"
              onClick={load}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left text-sm font-semibold hover:bg-neutral-50
                         dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
            >
              Rafraîchir
            </button>
            <button
              type="button"
              onClick={logoutAndGoHome}
              className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left text-sm font-semibold hover:bg-neutral-50
                         dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
            >
              Se déconnecter
            </button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Messages de contact</h2>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                Vue condensée des messages les plus récents.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.currentTarget.value);
                setPage(1);
              }}
              placeholder="Rechercher par nom, email ou sujet"
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm outline-none focus:border-neutral-400
                         dark:border-neutral-800 dark:bg-neutral-950"
            />
          </div>

          {status === "loading" ? (
            <p className="mt-6 text-sm text-neutral-600 dark:text-neutral-300">Chargement…</p>
          ) : null}

          {status === "error" ? (
            <p className="mt-6 whitespace-pre-wrap text-sm text-red-700">Erreur : {errorMsg}</p>
          ) : null}

          {authMsg ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p>{authMsg}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setOpenLogin(true)}
                  className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-amber-100"
                >
                  Se reconnecter
                </button>
                <button
                  type="button"
                  onClick={logoutAndGoHome}
                  className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-amber-100"
                >
                  Retour accueil
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex-1">
            {items.length === 0 && status === "idle" ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600
                              dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                Aucun message.
              </div>
            ) : null}

            {items.length > 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <div className="grid grid-cols-[1.2fr_1.4fr_1.4fr_0.7fr] gap-3 border-b border-neutral-200 pb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:border-neutral-800">
                  <span>Nom</span>
                  <span>Email</span>
                  <span>Sujet</span>
                  <span className="text-right">Date</span>
                </div>
                <ul className="divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
                  {visibleItems.map((m) => (
                    <li key={m.id} className="py-3">
                      <button
                        type="button"
                        onClick={() => setSelected(m)}
                        className="grid w-full grid-cols-[1.2fr_1.4fr_1.4fr_0.7fr] items-center gap-3 text-left"
                      >
                        <span className="truncate font-semibold">{m.name}</span>
                        <span className="truncate text-neutral-600 dark:text-neutral-300">{m.email}</span>
                        <span className="truncate text-neutral-600 dark:text-neutral-300">
                          {m.subject || "—"}
                        </span>
                        <span className="text-right text-xs text-neutral-500 dark:text-neutral-400">
                          {new Date(m.created_at).toLocaleDateString()}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                  <span>
                    Page {safePage} / {totalPages} — {filteredItems.length} message(s)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="rounded-lg border border-neutral-200 px-3 py-1 text-xs font-semibold disabled:opacity-50
                                 dark:border-neutral-800"
                    >
                      Précédent
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="rounded-lg border border-neutral-200 px-3 py-1 text-xs font-semibold disabled:opacity-50
                                 dark:border-neutral-800"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <BackofficeModal
        open={openLogin}
        onClose={() => {
          setOpenLogin(false);
          load();
        }}
      />

      {selected ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center">
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setSelected(null)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <div
            data-testid="message-modal"
            className="relative z-10 w-[min(620px,92vw)] rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Message de contact</h3>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {new Date(selected.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-neutral-200 px-3 py-1 text-xs font-semibold hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
              >
                Fermer
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <p>
                <span className="font-semibold">Nom :</span> {selected.name}
              </p>
              <p>
                <span className="font-semibold">Email :</span> {selected.email}
              </p>
              <p>
                <span className="font-semibold">Sujet :</span> {selected.subject || "—"}
              </p>
              <div>
                <p className="font-semibold">Message :</p>
                <p className="mt-2 whitespace-pre-wrap text-neutral-700 dark:text-neutral-200">
                  {selected.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
