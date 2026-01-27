"use client";

type StatusBlocksProps = {
  status: "idle" | "loading" | "error";
  errorMsg: string;
  itemsLength: number;
};

export default function StatusBlocks({ status, errorMsg, itemsLength }: StatusBlocksProps) {
  return (
    <>
      {status === "loading" ? (
        <p className="mt-6 text-sm text-neutral-600 dark:text-neutral-300">Chargement…</p>
      ) : null}

      {status === "error" ? (
        <p className="mt-6 whitespace-pre-wrap text-sm text-red-700">Erreur : {errorMsg}</p>
      ) : null}

      {itemsLength === 0 && status === "idle" ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600
                        dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          Aucun message.
        </div>
      ) : null}
    </>
  );
}

