"use client";

type ReferenceModalBackdropProps = {
  open: boolean;
  ease: string;
  dur: string;
  onClose: () => void;
};

export default function ReferenceModalBackdrop({
  open,
  ease,
  dur,
  onClose,
}: ReferenceModalBackdropProps) {
  return (
    <button
      type="button"
      aria-label="Fermer"
      onClick={onClose}
      className={[
        "absolute inset-0 touch-none",
        "transition-[opacity,backdrop-filter,background-color]",
        ease,
        dur,
        open
          ? "opacity-100 bg-black/45 backdrop-blur-[2px]"
          : "opacity-0 bg-black/0 backdrop-blur-0",
      ].join(" ")}
    />
  );
}

