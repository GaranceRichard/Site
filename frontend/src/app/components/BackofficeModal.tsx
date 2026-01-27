// frontend/src/app/components/BackofficeModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { isBackofficeEnabled } from "../lib/backoffice";
import BackofficeModalBackdrop from "./backoffice/BackofficeModalBackdrop";
import BackofficeModalCard from "./backoffice/BackofficeModalCard";
import BackofficeModalForm from "./backoffice/BackofficeModalForm";
import BackofficeModalHeader from "./backoffice/BackofficeModalHeader";

const EXIT_MS = 520;

export default function BackofficeModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const backofficeEnabled = isBackofficeEnabled();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const [email, setEmail] = useState<string>(""); // identifiant (username)
  const [password, setPassword] = useState<string>("");

  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  const usernameRef = useRef<HTMLInputElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const closingRef = useRef(false);

  useEffect(() => {
    if (open) {
      if (!backofficeEnabled) {
        setMounted(true);
        setVisible(true);
        return;
      }
      setMounted(true);
      closingRef.current = false;

      setEmail("");
      setPassword("");
      setStatus("idle");
      setErrorMsg("");

      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        setVisible(true);
        // Focus the username field as soon as the modal is visible.
        setTimeout(() => {
          usernameRef.current?.focus();
        }, 0);
      });
      return;
    }

    if (!mounted) return;

    if (closingRef.current) return;
    closingRef.current = true;

    setVisible(false);

    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setMounted(false);
      closingRef.current = false;
    }, EXIT_MS);
  }, [open, mounted, backofficeEnabled]);

  useEffect(() => {
    if (!mounted) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };

    window.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function requestClose() {
    onClose();
  }

  function onEmailChange(e: ChangeEvent<HTMLInputElement>) {
    setEmail(e.currentTarget.value);
  }

  function onPasswordChange(e: ChangeEvent<HTMLInputElement>) {
    setPassword(e.currentTarget.value);
  }

  async function login() {
    setErrorMsg("");

    if (!apiBase) {
      setStatus("error");
      setErrorMsg("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.");
      return;
    }

    if (!email.trim() || !password) {
      setStatus("error");
      setErrorMsg("Identifiant et mot de passe requis.");
      return;
    }

    setStatus("sending");

    try {
      const res = await fetch(`${apiBase}/api/auth/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: email.trim(),
          password: password,
        }),
      });

      if (!res.ok) {
        setStatus("error");
        setErrorMsg("Identifiant ou mot de passe invalide.");
        return;
      }

      const data: { access: string; refresh: string } = await res.json();

      sessionStorage.setItem("access_token", data.access);
      sessionStorage.setItem("refresh_token", data.refresh);

      setStatus("idle");
      requestClose();
      onSuccess?.();
    } catch {
      setStatus("error");
      setErrorMsg("Erreur réseau. Réessayez.");
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); // ✅ Entrée valide le formulaire
    if (!backofficeEnabled) return;
    if (status === "sending") return;
    void login();
  }

  if (!mounted) return null;

  const ease = "ease-[cubic-bezier(0.22,1,0.36,1)]";
  const dur = visible ?"duration-[420ms]" : "duration-[520ms]";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      <BackofficeModalBackdrop visible={visible} ease={ease} dur={dur} onClose={requestClose} />

      <BackofficeModalCard visible={visible} ease={ease} dur={dur}>
        <BackofficeModalHeader backofficeEnabled={backofficeEnabled} />
        <BackofficeModalForm
          backofficeEnabled={backofficeEnabled}
          email={email}
          password={password}
          status={status}
          errorMsg={errorMsg}
          onSubmit={onSubmit}
          onEmailChange={onEmailChange}
          onPasswordChange={onPasswordChange}
          onCancel={requestClose}
          usernameRef={usernameRef}
        />
      </BackofficeModalCard>
    </div>
  );
}
