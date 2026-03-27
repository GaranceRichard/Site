"use client";

import { useEffect, useRef, useState } from "react";

import { replaceSiteSettings, type SiteSettings } from "../../content/siteSettingsStore";
import { invalidateReferencesCache } from "../../lib/references";

type ContentExchangeManagerProps = {
  apiBase: string | undefined;
  onRequestLogin: () => void;
};

type ImportResponse = {
  detail: string;
  references_count: number;
  settings: SiteSettings;
};

function getToken(): string | null {
  try {
    return sessionStorage.getItem("access_token");
  } catch {
    return null;
  }
}

function getErrorMessage(detail: unknown): string {
  if (typeof detail === "string") {
    return detail;
  }
  if (detail && typeof detail === "object") {
    return JSON.stringify(detail);
  }
  return "Erreur inattendue.";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ContentExchangeManager({
  apiBase,
  onRequestLogin,
}: ContentExchangeManagerProps) {
  const [template, setTemplate] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState("");
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isDownloadingDictionary, setIsDownloadingDictionary] = useState(false);
  const [isDownloadingExport, setIsDownloadingExport] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadTemplate() {
      if (!apiBase) {
        setStatus("error");
        setMessage("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.");
        return;
      }

      const token = getToken();
      if (!token) {
        setStatus("error");
        setMessage("Connexion requise pour accéder au chargeur / extracteur.");
        onRequestLogin();
        return;
      }

      setStatus("loading");
      setMessage("");
      try {
        const response = await fetch(`${apiBase}/api/contact/exchange/admin/template`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401 || response.status === 403) {
          setStatus("error");
          setMessage("Connexion requise pour accéder au chargeur / extracteur.");
          onRequestLogin();
          return;
        }

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const text = await response.text();
        if (!isCancelled) {
          setTemplate(text);
          setStatus("idle");
        }
      } catch (error) {
        if (!isCancelled) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "Erreur inattendue.");
        }
      }
    }

    void loadTemplate();
    return () => {
      isCancelled = true;
    };
  }, [apiBase, onRequestLogin]);

  async function downloadFile(kind: "template" | "dictionary" | "export") {
    if (!apiBase) {
      setStatus("error");
      setMessage("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.");
      return;
    }

    const token = getToken();
    if (!token) {
      setStatus("error");
      setMessage("Connexion requise pour accéder au chargeur / extracteur.");
      onRequestLogin();
      return;
    }

    if (kind === "template") {
      setIsDownloadingTemplate(true);
    } else if (kind === "dictionary") {
      setIsDownloadingDictionary(true);
    } else {
      setIsDownloadingExport(true);
    }
    setMessage("");

    try {
      const response = await fetch(`${apiBase}/api/contact/exchange/admin/${kind}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        setStatus("error");
        setMessage("Connexion requise pour accéder au chargeur / extracteur.");
        onRequestLogin();
        return;
      }

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const extension = kind === "dictionary" ? "txt" : "toml";
      const filename = match?.[1] ?? `backoffice-exchange-${kind}.${extension}`;
      const blob = await response.blob();
      downloadBlob(blob, filename);
      setStatus("success");
      setMessage(
        kind === "template"
          ? "Canevas téléchargé."
          : kind === "dictionary"
            ? "Dictionnaire téléchargé."
            : "Extraction téléchargée.",
      );
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Erreur inattendue.");
    } finally {
      if (kind === "template") {
        setIsDownloadingTemplate(false);
      } else if (kind === "dictionary") {
        setIsDownloadingDictionary(false);
      } else {
        setIsDownloadingExport(false);
      }
    }
  }

  async function onFilePicked(file: File) {
    if (!apiBase) {
      setStatus("error");
      setMessage("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.");
      return;
    }

    const token = getToken();
    if (!token) {
      setStatus("error");
      setMessage("Connexion requise pour accéder au chargeur / extracteur.");
      onRequestLogin();
      return;
    }

    setIsUploading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${apiBase}/api/contact/exchange/admin/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.status === 401 || response.status === 403) {
        setStatus("error");
        setMessage("Connexion requise pour accéder au chargeur / extracteur.");
        onRequestLogin();
        return;
      }

      const data = (await response.json()) as ImportResponse | { detail?: unknown };
      if (!response.ok) {
        throw new Error(getErrorMessage(data.detail));
      }

      replaceSiteSettings((data as ImportResponse).settings);
      invalidateReferencesCache();
      setStatus("success");
      setMessage(
        `Import terminé : ${(data as ImportResponse).references_count} référence(s) rechargée(s).`,
      );
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Erreur inattendue.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Flux texte intégral
            </h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              Le fichier TOML contient tous les contenus éditables du site et les références.
              Lors d&apos;un import, les références sont recréées avec une image factice.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void downloadFile("template")}
              disabled={isDownloadingTemplate}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-800 dark:hover:bg-neutral-800"
            >
              {isDownloadingTemplate ? "Chargement..." : "Télécharger le canevas"}
            </button>
            <button
              type="button"
              onClick={() => void downloadFile("dictionary")}
              disabled={isDownloadingDictionary}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-800 dark:hover:bg-neutral-800"
            >
              {isDownloadingDictionary ? "Chargement..." : "Télécharger le dictionnaire"}
            </button>
            <button
              type="button"
              onClick={() => void downloadFile("export")}
              disabled={isDownloadingExport}
              className="rounded-lg bg-neutral-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {isDownloadingExport ? "Extraction..." : "Télécharger l'extraction"}
            </button>
          </div>
        </div>

        {message ? (
          <div
            className={[
              "mt-4 rounded-xl px-3 py-2 text-sm",
              status === "error"
                ? "border border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200"
                : "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200",
            ].join(" ")}
          >
            {message}
          </div>
        ) : null}

        <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
          <input
            ref={fileInputRef}
            type="file"
            accept=".toml,.txt,text/plain"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) {
                void onFilePicked(file);
              }
              event.currentTarget.value = "";
            }}
            className="hidden"
          />
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Importer un fichier
          </p>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
            Le fichier est contrôlé avant application. Si une section est invalide, aucun
            changement n&apos;est enregistré.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-800 dark:hover:bg-neutral-800"
            >
              {isUploading ? "Import..." : "Choisir un fichier"}
            </button>
            <span className="self-center text-xs text-neutral-500">
              Formats acceptés : `.toml` ou `.txt` UTF-8
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            Canevas d&apos;échange
          </h3>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
            Utilisez ce format comme base de préparation. L&apos;ordre des blocs de références
            définit l&apos;ordre d&apos;affichage final.
          </p>
        </div>

        <textarea
          readOnly
          value={template}
          className="mt-4 min-h-[36rem] w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 font-mono text-xs leading-6 text-neutral-800 outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100"
        />
      </section>
    </div>
  );
}
