import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BackofficeModalHeader from "./BackofficeModalHeader";

describe("BackofficeModalHeader", () => {
  it("affiche le texte actif quand le backoffice est activé", () => {
    render(<BackofficeModalHeader backofficeEnabled={true} />);
    expect(screen.getByText(/Authentification requise/i)).toBeInTheDocument();
  });

  it("affiche le texte désactivé quand le backoffice est off", () => {
    render(<BackofficeModalHeader backofficeEnabled={false} />);
    expect(screen.getByText(/back-office est désactivé/i)).toBeInTheDocument();
  });
});

