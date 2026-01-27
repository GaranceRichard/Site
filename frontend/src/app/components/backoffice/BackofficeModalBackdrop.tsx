"use client";

type BackofficeModalBackdropProps = {
  visible: boolean;
  ease: string;
  dur: string;
  onClose: () => void;
};

export default function BackofficeModalBackdrop({
  visible,
  ease,
  dur,
  onClose,
}: BackofficeModalBackdropProps) {
  return (
    <button
      type="button"
      aria-label="Fermer"
      onClick={onClose}
      className={[
        "absolute inset-0",
        "transition-[opacity,backdrop-filter,background-color]",
        ease,
        dur,
        visible
          ? "opacity-100 bg-black/50 backdrop-blur-sm"
          : "opacity-0 bg-black/0 backdrop-blur-0",
      ].join(" ")}
    />
  );
}

