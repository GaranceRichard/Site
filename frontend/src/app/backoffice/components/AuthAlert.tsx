"use client";

type AuthAlertProps = {
  message: string;
  onReconnect: () => void;
  onGoHome: () => void;
};

export default function AuthAlert({ message, onReconnect, onGoHome }: AuthAlertProps) {
  if (!message) return null;

  return (
    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p>{message}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onReconnect}
          className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-amber-100"
        >
          Se reconnecter
        </button>
        <button
          type="button"
          onClick={onGoHome}
          className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-amber-100"
        >
          Retour accueil
        </button>
      </div>
    </div>
  );
}

