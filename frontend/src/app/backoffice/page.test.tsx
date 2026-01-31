import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import BackofficePage from "./page";
import { setBackofficeSection } from "./sectionStore";

const isBackofficeEnabledMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("../lib/backoffice", () => ({
  isBackofficeEnabled: () => isBackofficeEnabledMock(),
}));

vi.mock("./useBackofficeMessages", () => ({
  useBackofficeMessages: () => ({
    openLogin: false,
    setOpenLogin: vi.fn(),
    status: "idle",
    errorMsg: null,
    authMsg: null,
    selected: null,
    setSelected: vi.fn(),
    page: 1,
    setPage: vi.fn(),
    query: "",
    selectedIds: [],
    undoIds: [],
    totalCount: 0,
    totalPages: 1,
    visibleItems: [],
    load: vi.fn(),
    toggleSelected: vi.fn(),
    changeSort: vi.fn(),
    getSortArrow: vi.fn(),
    deleteSelected: vi.fn(),
    undoDelete: vi.fn(),
    closeLoginModal: vi.fn(),
    onSearchChange: vi.fn(),
  }),
}));

vi.mock("../components/BackofficeModal", () => ({
  default: () => <div data-testid="backoffice-modal" />,
}));

vi.mock("./components/AuthAlert", () => ({
  default: () => <div data-testid="auth-alert" />,
}));

vi.mock("./components/DisabledView", () => ({
  default: () => <div data-testid="disabled-view" />,
}));

vi.mock("./components/MessageModal", () => ({
  default: () => <div data-testid="message-modal" />,
}));

vi.mock("./components/MessagesTable", () => ({
  default: () => <div data-testid="messages-table" />,
}));

vi.mock("./components/ReferencesManager", () => ({
  default: () => <div data-testid="references-manager" />,
}));

vi.mock("./components/Sidebar", () => ({
  default: () => <div data-testid="sidebar" />,
}));

vi.mock("./components/StatusBlocks", () => ({
  default: () => <div data-testid="status-blocks" />,
}));

vi.mock("./components/UndoToast", () => ({
  default: () => <div data-testid="undo-toast" />,
}));

const SECTION_KEY = "backoffice_section";

describe("BackofficePage", () => {
  beforeEach(() => {
    window.localStorage.removeItem(SECTION_KEY);
    isBackofficeEnabledMock.mockReturnValue(true);
  });

  it("renders disabled view when backoffice is disabled", () => {
    isBackofficeEnabledMock.mockReturnValue(false);
    render(<BackofficePage />);
    expect(screen.getByTestId("disabled-view")).toBeInTheDocument();
  });

  it("renders messages section by default", () => {
    render(<BackofficePage />);
    expect(screen.getByTestId("messages-table")).toBeInTheDocument();
    expect(screen.queryByTestId("references-manager")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Rechercher par nom, email ou sujet")).toBeInTheDocument();
  });

  it("renders references section when stored", () => {
    setBackofficeSection("references");
    render(<BackofficePage />);
    expect(screen.getAllByTestId("references-manager").length).toBeGreaterThan(0);
    expect(screen.queryAllByTestId("messages-table")).toHaveLength(0);
    expect(screen.queryByPlaceholderText("Rechercher par nom, email ou sujet")).not.toBeInTheDocument();
  });
});
