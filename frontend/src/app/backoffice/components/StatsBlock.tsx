"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type StatsSummaryResponse = {
  configured: boolean;
  stale?: boolean;
  warning?: string;
  cachedAt?: string;
  data?: {
    visitors30d: {
      total: number;
      trend: Array<{ date: string; value: number }>;
    };
    topCtas: Array<{ label: string; location: string; clicks: number }>;
    topReferences: Array<{ name: string; opens: number }>;
    contactFormCompletion: {
      attempts: number;
      successes: number;
      completionRate: number;
    };
  };
};

type HealthStatus = "ok" | "ko" | "unreachable";

type HealthResponse = {
  ok: boolean;
  db?: { ok?: boolean; skipped?: boolean };
  redis?: { ok?: boolean; skipped?: boolean };
};

type StatsBlockProps = {
  apiBase: string | undefined;
  onRequestLogin: () => void;
};

const HEALTH_TIMEOUT_MS = 5000;

function formatDateTime(value?: string | null): string {
  if (!value) return "Jamais";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStoredAccessToken(): string | null {
  try {
    return sessionStorage.getItem("access_token");
  } catch {
    return null;
  }
}

function toHealthStatus(value?: boolean): HealthStatus {
  if (value === true) return "ok";
  if (value === false) return "ko";
  return "unreachable";
}

function StatusPill({ label, status }: { label: string; status: HealthStatus }) {
  const tone =
    status === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "ko"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-amber-200 bg-amber-50 text-amber-700";
  const copy = status === "ok" ? "OK" : status === "ko" ? "KO" : "Injoignable";

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">{label}</p>
      <span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${tone}`}>
        {copy}
      </span>
    </div>
  );
}

function Sparkline({ points }: { points: Array<{ date: string; value: number }> }) {
  const chart = useMemo(() => {
    if (points.length === 0) {
      return "";
    }

    const max = Math.max(...points.map((point) => point.value), 1);
    return points
      .map((point, index) => {
        const x = (index / Math.max(points.length - 1, 1)) * 100;
        const y = 32 - (point.value / max) * 28;
        return `${x},${y}`;
      })
      .join(" ");
  }, [points]);

  if (!chart) {
    return <p className="mt-3 text-xs text-neutral-500">Pas encore de tendance exploitable.</p>;
  }

  return (
    <svg viewBox="0 0 100 32" className="mt-4 h-12 w-full" aria-hidden="true">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={chart}
        className="text-neutral-900 dark:text-neutral-100"
      />
    </svg>
  );
}

export default function StatsBlock({ apiBase, onRequestLogin }: StatsBlockProps) {
  const [summary, setSummary] = useState<StatsSummaryResponse | null>(null);
  const [summaryStatus, setSummaryStatus] = useState<"loading" | "ready" | "error">("loading");
  const [summaryError, setSummaryError] = useState("");
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthStatus, setHealthStatus] = useState<"loading" | "ready" | "error">("loading");
  const [healthError, setHealthError] = useState("");
  const [lastPolledAt, setLastPolledAt] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setSummaryStatus("loading");
    setSummaryError("");

    if (!apiBase) {
      setSummaryStatus("error");
      setSummaryError("Configuration API manquante.");
      return;
    }

    const token = getStoredAccessToken();
    if (!token) {
      onRequestLogin();
      setSummaryStatus("error");
      setSummaryError("Session admin manquante.");
      return;
    }

    try {
      const res = await fetch(`${apiBase}/api/stats/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        onRequestLogin();
        throw new Error("Session expiree ou acces refuse.");
      }

      const payload = (await res.json()) as StatsSummaryResponse & { detail?: string };
      if (!res.ok) {
        throw new Error(payload.warning || payload.detail || `Erreur API (${res.status})`);
      }

      setSummary(payload);
      setSummaryStatus("ready");
    } catch (error: unknown) {
      setSummaryStatus("error");
      setSummaryError(error instanceof Error ? error.message : "Erreur inattendue");
    }
  }, [apiBase, onRequestLogin]);

  const pollHealth = useCallback(async () => {
    setHealthStatus("loading");
    setHealthError("");

    if (!apiBase) {
      setHealthStatus("error");
      setHealthError("Configuration API manquante.");
      setLastPolledAt(new Date().toISOString());
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

    try {
      const res = await fetch(`${apiBase}/api/health`, {
        signal: controller.signal,
      });
      const payload = (await res.json()) as HealthResponse;
      setHealth(payload);
      setHealthStatus("ready");
    } catch (error: unknown) {
      setHealth({ ok: false });
      setHealthStatus("error");
      const isAbortError = error instanceof DOMException && error.name === "AbortError";
      setHealthError(isAbortError ? "Injoignable" : "Impossible de joindre /api/health.");
    } finally {
      window.clearTimeout(timeoutId);
      setLastPolledAt(new Date().toISOString());
    }
  }, [apiBase]);

  useEffect(() => {
    void loadSummary();
    void pollHealth();
  }, [loadSummary, pollHealth]);

  const apiStatus: HealthStatus =
    healthStatus === "error" && healthError === "Injoignable"
      ? "unreachable"
      : toHealthStatus(health?.ok);
  const dbStatus: HealthStatus =
    healthStatus === "error" && healthError === "Injoignable"
      ? "unreachable"
      : toHealthStatus(health?.db?.ok);
  const redisStatus: HealthStatus =
    healthStatus === "error" && healthError === "Injoignable"
      ? "unreachable"
      : health?.redis?.skipped
        ? "ok"
        : toHealthStatus(health?.redis?.ok);

  const visitors = summary?.data?.visitors30d;
  const topCtas = summary?.data?.topCtas ?? [];
  const topReferences = summary?.data?.topReferences ?? [];
  const formCompletion = summary?.data?.contactFormCompletion;

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
      <article className="rounded-3xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Rapport GA4
            </p>
            <h3 className="mt-2 text-xl font-semibold">Engagement des 30 derniers jours</h3>
          </div>
          {summary?.cachedAt ? (
            <p className="text-xs text-neutral-500">Cache: {formatDateTime(summary.cachedAt)}</p>
          ) : null}
        </div>

        {summaryStatus === "loading" ? (
          <p className="mt-6 text-sm text-neutral-500">Chargement du rapport Google Analytics…</p>
        ) : null}

        {summaryStatus === "error" ? (
          <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {summaryError}
          </p>
        ) : null}

        {summaryStatus === "ready" && summary?.configured === false ? (
          <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300">
            Google Analytics non configuré.
          </div>
        ) : null}

        {summaryStatus === "ready" && summary?.configured && summary?.data ? (
          <>
            {summary.warning ? (
              <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {summary.warning}
              </p>
            ) : null}

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-950">
                <p className="text-sm text-neutral-500">Visiteurs uniques</p>
                <p className="mt-2 text-3xl font-semibold">{visitors?.total ?? 0}</p>
                <Sparkline points={visitors?.trend ?? []} />
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-950">
                <p className="text-sm text-neutral-500">Taux de complétion formulaire</p>
                <p className="mt-2 text-3xl font-semibold">
                  {formCompletion?.completionRate?.toFixed(1) ?? "0.0"}%
                </p>
                <p className="mt-2 text-sm text-neutral-500">
                  {formCompletion?.successes ?? 0} soumissions / {formCompletion?.attempts ?? 0} tentatives
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-950">
                <p className="text-sm font-semibold">Top CTAs</p>
                <ul className="mt-4 space-y-3 text-sm">
                  {topCtas.length > 0 ? (
                    topCtas.map((item) => (
                      <li key={`${item.label}-${item.location}`} className="flex items-center justify-between gap-4">
                        <span>
                          {item.label} <span className="text-neutral-500">({item.location})</span>
                        </span>
                        <strong>{item.clicks}</strong>
                      </li>
                    ))
                  ) : (
                    <li className="text-neutral-500">Aucun clic CTA remonté.</li>
                  )}
                </ul>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-950">
                <p className="text-sm font-semibold">Top références ouvertes</p>
                <ul className="mt-4 space-y-3 text-sm">
                  {topReferences.length > 0 ? (
                    topReferences.map((item) => (
                      <li key={item.name} className="flex items-center justify-between gap-4">
                        <span>{item.name}</span>
                        <strong>{item.opens}</strong>
                      </li>
                    ))
                  ) : (
                    <li className="text-neutral-500">Aucune ouverture remontée.</li>
                  )}
                </ul>
              </div>
            </div>
          </>
        ) : null}
      </article>

      <article className="rounded-3xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Santé système
            </p>
            <h3 className="mt-2 text-xl font-semibold">État DB, Redis et API</h3>
          </div>
          <button
            type="button"
            onClick={() => void pollHealth()}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-800"
          >
            Actualiser
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <StatusPill label="API" status={apiStatus} />
          <StatusPill label="Base de données" status={dbStatus} />
          <StatusPill label="Redis" status={redisStatus} />
        </div>

        <p className="mt-4 text-sm text-neutral-500">Dernier poll: {formatDateTime(lastPolledAt)}</p>

        {healthStatus === "loading" ? (
          <p className="mt-4 text-sm text-neutral-500">Vérification de l’état système…</p>
        ) : null}

        {healthError ? (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {healthError}
          </p>
        ) : null}
      </article>
    </div>
  );
}
