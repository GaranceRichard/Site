import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MessagesTable from "./MessagesTable";
import type { Msg } from "../types";

const sampleMessage: Msg = {
  id: 1,
  name: "Alice Doe",
  email: "alice@example.com",
  subject: "",
  message: "Hello",
  consent: true,
  source: "tests",
  created_at: new Date("2025-01-01T10:00:00Z").toISOString(),
};

describe("MessagesTable", () => {
  it("retourne null si aucun item", () => {
    const { container } = render(
      <MessagesTable
        items={[]}
        selectedIds={new Set()}
        page={1}
        totalPages={1}
        totalCount={0}
        onToggleSelected={vi.fn()}
        onSelectMessage={vi.fn()}
        onDeleteSelected={vi.fn()}
        onPrevPage={vi.fn()}
        onNextPage={vi.fn()}
        onSetPage={vi.fn()}
        onChangeSort={vi.fn()}
        getSortArrow={vi.fn().mockReturnValue(null)}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("declenche les actions utilisateur principales", () => {
    const onToggleSelected = vi.fn();
    const onSelectMessage = vi.fn();
    const onDeleteSelected = vi.fn();
    const onPrevPage = vi.fn();
    const onNextPage = vi.fn();
    const onSetPage = vi.fn();
    const onChangeSort = vi.fn();
    const getSortArrow = vi.fn().mockReturnValue("↑");

    render(
      <MessagesTable
        items={[sampleMessage]}
        selectedIds={new Set([1])}
        page={5}
        totalPages={10}
        totalCount={100}
        onToggleSelected={onToggleSelected}
        onSelectMessage={onSelectMessage}
        onDeleteSelected={onDeleteSelected}
        onPrevPage={onPrevPage}
        onNextPage={onNextPage}
        onSetPage={onSetPage}
        onChangeSort={onChangeSort}
        getSortArrow={getSortArrow}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Trier par nom" }));
    expect(onChangeSort).toHaveBeenCalledWith("name");

    fireEvent.click(screen.getByRole("checkbox", { name: /Selectionner/i }));
    expect(onToggleSelected).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByText("Alice Doe"));
    expect(onSelectMessage).toHaveBeenCalledWith(sampleMessage);

    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    expect(onDeleteSelected).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Prev" }));
    expect(onPrevPage).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onNextPage).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Page 1" }));
    expect(onSetPage).toHaveBeenCalledWith(1);
  });
});

