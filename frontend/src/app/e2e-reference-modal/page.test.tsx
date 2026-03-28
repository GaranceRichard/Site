import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import ReferenceModalE2EPage from "./page";

afterEach(() => {
  cleanup();
});

describe("ReferenceModalE2EPage", () => {
  it("opens the modal and can force close it", async () => {
    render(<ReferenceModalE2EPage />);

    fireEvent.click(screen.getByRole("button", { name: "Open modal" }));
    expect(screen.getByRole("dialog", { name: /Ref Harness Modal/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Force close modal" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: /Ref Harness Modal/i })).not.toBeInTheDocument();
    });
  });

  it("increments close count when the modal requests its own close", async () => {
    render(<ReferenceModalE2EPage />);

    fireEvent.click(screen.getByRole("button", { name: "Open modal" }));
    expect(screen.getByRole("dialog", { name: /Ref Harness Modal/i })).toBeInTheDocument();

    fireEvent.click(screen.getByText("X"));

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: /Ref Harness Modal/i })).not.toBeInTheDocument();
    });
    expect(screen.getByText("Close count: 1")).toBeInTheDocument();
  });
});
