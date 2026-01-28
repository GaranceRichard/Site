// frontend/src/app/components/auth/LoginButton.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import BackofficeModal from "../BackofficeModal";
import { isAccessTokenValid, isBackofficeEnabled } from "../../lib/backoffice";

export default function LoginButton({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const router = useRouter();
  const backofficeEnabled = isBackofficeEnabled();
  const [open, setOpen] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
  let cancelled = false;

  const compute = () => {
    try {
      return isAccessTokenValid(sessionStorage.getItem("access_token"));
    } catch {
      return false;
    }
  };

  const update = () => {
    if (cancelled) return;
    setIsLogged(compute());
  };

  if (typeof queueMicrotask === "function") {
    queueMicrotask(update);
  } else {
    window.setTimeout(update, 0);
  }

  return () => {
    cancelled = true;
  };
}, [open]);

  function onClick() {
    if (!backofficeEnabled) return;
    let logged = false;
    try {
      logged = isAccessTokenValid(sessionStorage.getItem("access_token"));
      setIsLogged(logged);
    } catch {
      logged = false;
      setIsLogged(false);
    }

    if (logged) {
      router.push("/backoffice");
      return;
    }

    setOpen(true);
  }

  if (!backofficeEnabled) return null;

  return (
    <>
      <button
        type="button"
        aria-label={isLogged ? "Back-office (connecté)" : "Accès back-office"}
        title={isLogged ? "Back-office (connecté)" : "Accès back-office"}
        onClick={onClick}
        className={[
          "transition-opacity",
          isLogged ? "opacity-100" : "opacity-60 hover:opacity-100",
          className ?? "",
        ].join(" ")}
      >
        <Image src="/brand/logo.png" alt="" width={size} height={size} className="object-contain" />
      </button>

      <BackofficeModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => router.push("/backoffice")}
      />
    </>
  );
}
