"use client";

type BackofficeModalHeaderProps = {
  backofficeEnabled: boolean;
};

export default function BackofficeModalHeader({ backofficeEnabled }: BackofficeModalHeaderProps) {
  return (
    <>
      <h2 className="text-lg font-semibold">Accès back-office</h2>

      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
        {backofficeEnabled
          ? "Authentification requise (compte admin)."
          : "Le back-office est désactivé pour cet environnement."}
      </p>
    </>
  );
}

