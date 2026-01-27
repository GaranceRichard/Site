import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MessageModal from "./MessageModal";
import type { Msg } from "../types";

const message: Msg = {
  id: 2,
  name: "Bob Smith",
  email: "bob@example.com",
  subject: "",
  message: "Ping",
  consent: true,
  source: "tests",
  created_at: new Date("2025-01-02T10:00:00Z").toISOString(),
};

describe("MessageModal", () => {
  it("retourne null si aucun message", () => {
    const { container } = render(<MessageModal message={null} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("affiche le contenu et ferme via overlay", () => {
    const onClose = vi.fn();
    render(<MessageModal message={message} onClose={onClose} />);

    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();

    fireEvent.click(screen.getAllByLabelText("Fermer")[0]);
    expect(onClose).toHaveBeenCalled();
  });
});

