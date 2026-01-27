"use client";

import type { ChangeEvent, FormEvent } from "react";
import type { RefObject } from "react";

type BackofficeModalFormProps = {
  backofficeEnabled: boolean;
  email: string;
  password: string;
  status: "idle" | "sending" | "error";
  errorMsg: string;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onEmailChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onPasswordChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  usernameRef: RefObject<HTMLInputElement>;
};

export default function BackofficeModalForm({
  backofficeEnabled,
  email,
  password,
  status,
  errorMsg,
  onSubmit,
  onEmailChange,
  onPasswordChange,
  onCancel,
  usernameRef,
}: BackofficeModalFormProps) {
  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <input
        name="username"
        type="text"
        placeholder="Identifiant"
        value={email}
        onChange={onEmailChange}
        autoComplete="username"
        disabled={!backofficeEnabled}
        ref={usernameRef}
        className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
      />

      <input
        name="password"
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={onPasswordChange}
        autoComplete="current-password"
        disabled={!backofficeEnabled}
        className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
      />

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-neutral-200 px-4 py-2 text-sm dark:border-neutral-800"
        >
          Annuler
        </button>

        <button
          type="submit"
          disabled={status === "sending" || !backofficeEnabled}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {status === "sending" ? "Connexion..." : "Se connecter"}
        </button>
      </div>

      {status === "error" ? <p className="text-sm text-red-700">{errorMsg}</p> : null}
    </form>
  );
}

