"use client";

type DisabledViewProps = {
  onGoHome: () => void;
};

export default function DisabledView({ onGoHome }: DisabledViewProps) {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-16">
        <h1 className="text-2xl font-semibold">Backoffice désactivé</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          Cette page n’est pas disponible dans cet environnement.
        </p>
        <button
          type="button"
          onClick={onGoHome}
          className="w-fit rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-neutral-50
                     dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
        >
          Retour à l’accueil
        </button>
      </div>
    </main>
  );
}

