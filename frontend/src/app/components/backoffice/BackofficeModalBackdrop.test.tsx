import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import BackofficeModalBackdrop from "./BackofficeModalBackdrop";

describe("BackofficeModalBackdrop", () => {
  afterEach(() => {
    cleanup();
  });

  it("calls onClose when clicked", () => {
    const onClose = vi.fn();

    render(
      <BackofficeModalBackdrop visible={true} ease="ease-test" dur="duration-test" onClose={onClose} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("uses hidden styles when not visible", () => {
    const { container } = render(
      <BackofficeModalBackdrop visible={false} ease="ease-test" dur="duration-test" onClose={() => {}} />
    );

    expect(container.querySelector("button")?.className).toContain("opacity-0");
  });
});
