"use client";

import { useState } from "react";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
  consent: boolean;
  source: string;
  website: string; // honeypot
};

export default function ContactForm() {
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

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (form.website.trim().length > 0) {
      setStatus("success");
      return;
    }

    if (!apiBase) {
      setStatus("error");
      setErrorMsg("Configuration API manquante (NEXT_PUBLIC_API_BASE_URL).");
      return;
    }

    setStatus("sending");

    try {
      const res = await fetch(`${apiBase}/api/contact/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        // DRF renvoie souvent du JSON : on tente json(), sinon text()
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
      setForm((f) => ({ ...f, name: "", email: "", subject: "", message: "", consent: false, website: "" }));
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message ?? "Erreur inattendue");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {/* Honeypot invisible */}
      <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
        <label>
          Website
          <input
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            autoComplete="off"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Nom
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-400"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          Email
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-400"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold">
        Sujet
        <input
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-400"
        />
      </label>

      <label className="grid gap-2 text-sm font-semibold">
        Message
        <textarea
          required
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={6}
          className="min-h-[140px] w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-400"
        />
      </label>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => setForm({ ...form, consent: e.target.checked })}
        />
        J’accepte que mes informations soient utilisées pour être recontacté(e).
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-xl border border-neutral-200 bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
      >
        {status === "sending" ? "Envoi..." : "Envoyer"}
      </button>

      {status === "success" && <p className="text-sm text-neutral-700">Merci, votre message a bien été envoyé.</p>}
      {status === "error" && <p className="text-sm text-red-700 whitespace-pre-wrap">Erreur : {errorMsg}</p>}
    </form>
  );
}
