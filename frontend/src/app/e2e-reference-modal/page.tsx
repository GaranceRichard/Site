"use client";

import { useMemo, useState } from "react";
import ReferenceModal from "../components/home/ReferenceModal";

const sampleItem = {
  id: "ref-e2e-harness",
  nameCollapsed: "Ref Harness",
  nameExpanded: "Ref Harness Modal",
  missionTitle: "Mission de test",
  label: "Reference",
  imageSrc: "/brand/logo.png",
  badgeSrc: "/brand/logo.png",
  badgeAlt: "Badge harness",
  situation: "Situation de reference pour le harness E2E.",
  tasks: ["Task harness"],
  actions: ["Action harness"],
  results: ["Result harness"],
};

export default function ReferenceModalE2EPage() {
  const [item, setItem] = useState<null | typeof sampleItem>(null);
  const [closeCount, setCloseCount] = useState(0);

  const currentItem = useMemo(() => (item ? { ...sampleItem, ...item } : null), [item]);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 p-6">
      <button type="button" className="w-fit rounded border px-3 py-2" onClick={() => setItem(sampleItem)}>
        Open modal
      </button>
      <button
        type="button"
        className="fixed right-6 top-6 z-[200] w-fit rounded border bg-white px-3 py-2 shadow"
        onClick={() => setItem(null)}
      >
        Force close modal
      </button>
      <button type="button" className="w-fit rounded border px-3 py-2">
        Focus anchor
      </button>
      <p>Close count: {closeCount}</p>

      <ReferenceModal
        item={currentItem}
        onClose={() => {
          setCloseCount((count) => count + 1);
          setItem(null);
        }}
      />
    </main>
  );
}
