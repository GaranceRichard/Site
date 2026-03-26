"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { ANALYTICS_EVENTS, trackEvent } from "../lib/analytics";
import { resolveApiBaseUrl } from "../lib/backoffice";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
  consent: boolean;
  source: string;
  website: string;
};

export default function ContactForm({ onSuccess }: { onSuccess?: () => void }) {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
    consent: false,
    source: "contact-page",
    website: "",
  });

  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const apiBase = resolveApiBaseUrl() ?? "/api-proxy";
  const requestTimeoutMs = Number(process.env.NEXT_PUBLIC_CONTACT_TIMEOUT_MS || "10000");

  function onTextChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.currentTarget;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function onConsentChange(e: ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, consent: e.target.checked }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");

    // Honeypot: si rempli, on simule un succes sans appeler l'API.
    if (form.website.trim().length > 0) {
      setStatus("success");
      onSuccess?.();
      return;
    }

    setStatus("sending");
    trackEvent(ANALYTICS_EVENTS.CONTACT_FORM_ATTEMPT);
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, requestTimeoutMs);

    try {
      const res = await fetch(`${apiBase}/api/contact/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
          consent: form.consent,
          source: form.source,
        }),
      });

      if (!res.ok) {
        let detail = "";
        try {
          const data = await res.json();
          detail = JSON.stringify(data, null, 2);
        } catch {
          detail = await res.text();
        }
        throw new Error(detail || `Erreur API (${res.status})`);
      }

      setStatus("success");
      trackEvent(ANALYTICS_EVENTS.CONTACT_FORM_SUCCESS);
      setForm((f) => ({
        ...f,
        name: "",
        email: "",
        subject: "",
        message: "",
        consent: false,
        website: "",
      }));

      onSuccess?.();
    } catch (err: unknown) {
      setStatus("error");
      const isAbortError = err instanceof DOMException && err.name === "AbortError";
      if (isAbortError) {
        setErrorMsg("Delai depasse. Veuillez reessayer.");
      } else {
        setErrorMsg(err instanceof Error ? err.message : "Erreur inattendue");
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
        <label>
          Website
          <input
            name="website"
            value={form.website}
            onChange={onTextChange}
            autoComplete="off"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Nom
          <input
            required
            name="name"
            value={form.name}
            onChange={onTextChange}
            className="field-input text-sm"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          Email
          <input
            required
            type="email"
            name="email"
            value={form.email}
            onChange={onTextChange}
            className="field-input text-sm"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold">
        Sujet
        <input
          name="subject"
          value={form.subject}
          onChange={onTextChange}
          className="field-input text-sm"
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold">
        Message
        <textarea
          required
          name="message"
          value={form.message}
          onChange={onTextChange}
          rows={6}
          className="field-input min-h-[140px] text-sm"
        />
      </label>

      <label className="flex items-center gap-3 text-sm [color:var(--text-secondary)]">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={onConsentChange}
        />
        J&apos;accepte que mes informations soient utilisees pour etre recontacte(e).
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className="primary-button interactive-lift px-5 py-3 text-sm font-semibold disabled:opacity-60"
      >
        {status === "sending" ? "Envoi..." : "Envoyer"}
      </button>

      {status === "success" && (
        <p className="text-sm [color:var(--text-secondary)]">Merci, votre message a bien ete envoye.</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-700 whitespace-pre-wrap">Erreur : {errorMsg}</p>
      )}
    </form>
  );
}
