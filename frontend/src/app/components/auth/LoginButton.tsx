"use client";

import { useState } from "react";
import Image from "next/image";
import BackofficeModal from "../BackofficeModal";

export default function LoginButton({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Accès back-office"
        onClick={() => setOpen(true)}
        className={`opacity-60 hover:opacity-100 transition-opacity ${className ?? ""}`}
      >
        <Image
          src="/brand/logo.png"
          alt=""
          width={size}
          height={size}
          className="object-contain"
        />
      </button>

      <BackofficeModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
