import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import ReferenceModalShell from "./ReferenceModalShell";

afterEach(() => {
  cleanup();
});

function renderShell(imageSrc: string) {
  return render(
    <ReferenceModalShell imageSrc={imageSrc} open={true} ease="ease" dur="dur">
      <div>Contenu</div>
    </ReferenceModalShell>
  );
}

describe("ReferenceModalShell", () => {
  it("affiche une image quand imageSrc est fourni", () => {
    renderShell("/references/demo.png");
    expect(screen.getByRole("presentation")).toBeInTheDocument();
  });

  it("affiche un fallback quand imageSrc est vide", () => {
    renderShell("");
    expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
  });
});