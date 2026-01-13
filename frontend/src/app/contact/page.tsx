"use client";

import { useState } from "react";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
  consent: boolean;
  source: string;
  website: string; // honeypot anti-spam
};

export default function ContactPage() {
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

    // Honeypot : si rempli, on "fait comme si" c'était ok
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
        const txt = await res.text();
        throw new Error(txt || `Erreur API (${res.status})`);
      }

      setStatus("success");
      setForm((f) => ({ ...f, name: "", email: "", subject: "", message: "", consent: false, website: "" }));
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message ?? "Erreur inattendue");
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 16px" }}>
      <h1 style={{ fontSize: 40, lineHeight: 1.1, marginBottom: 16 }}>Contact</h1>
      <p style={{ marginBottom: 24 }}>
        Décrivez votre contexte et votre besoin. Je vous réponds rapidement.
      </p>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        {/* Honeypot invisible */}
        <div style={{ position: "absolute", left: -10000, top: "auto", width: 1, height: 1, overflow: "hidden" }}>
          <label>
            Website
            <input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              autoComplete="off"
            />
          </label>
        </div>

        <label>
          Nom
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <label>
          Email
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <label>
          Sujet
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <label>
          Message
          <textarea
            required
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            rows={6}
            style={{ width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
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
          style={{ padding: 12, fontWeight: 600 }}
        >
          {status === "sending" ? "Envoi..." : "Envoyer"}
        </button>

        {status === "success" && <p>Merci, votre message a bien été envoyé.</p>}
        {status === "error" && <p style={{ whiteSpace: "pre-wrap" }}>Erreur : {errorMsg}</p>}
      </form>
    </main>
  );
}
