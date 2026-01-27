"use client";

import type { Msg } from "../types";

type MessageModalProps = {
  message: Msg | null;
  onClose: () => void;
};

export default function MessageModal({ message, onClose }: MessageModalProps) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
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
              {new Date(message.created_at).toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-200 px-3 py-1 text-xs font-semibold hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            Fermer
          </button>
        </div>

        <div className="mt-5 space-y-3 text-sm break-words">
          <p>
            <span className="font-semibold">Nom :</span> {message.name}
          </p>
          <p>
            <span className="font-semibold">Email :</span> {message.email}
          </p>
          <p>
            <span className="font-semibold">Sujet :</span> {message.subject || "—"}
          </p>
          <div>
            <p className="font-semibold">Message :</p>
            <p className="mt-2 whitespace-pre-wrap break-words text-neutral-700 dark:text-neutral-200">
              {message.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

