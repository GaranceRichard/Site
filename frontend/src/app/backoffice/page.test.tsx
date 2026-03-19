import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import BackofficePage from "./page";
import { setBackofficeSection } from "./sectionStore";

const isBackofficeEnabledMock = vi.fn();
const routerPushMock = vi.fn();
const clearAuthTokensMock = vi.fn();
const setOpenLoginMock = vi.fn();
const setSelectedMock = vi.fn();
const setPageMock = vi.fn();
const loadMock = vi.fn();
const toggleSelectedMock = vi.fn();
const changeSortMock = vi.fn();
const getSortArrowMock = vi.fn();
const deleteSelectedMock = vi.fn();
const undoDeleteMock = vi.fn();
const closeLoginModalMock = vi.fn();
const onSearchChangeMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock }),
}));

vi.mock("../lib/backoffice", () => ({
  isBackofficeEnabled: () => isBackofficeEnabledMock(),
  resolveApiBaseUrl: () => "/api-proxy",
}));

vi.mock("./logic", () => ({
  clearAuthTokens: () => clearAuthTokensMock(),
}));

vi.mock("./useBackofficeMessages", () => ({
  useBackofficeMessages: () => ({
    openLogin: false,
    setOpenLogin: setOpenLoginMock,
    status: "idle",
    errorMsg: null,
    authMsg: "session expiree",
    selected: { id: "msg-1" },
    setSelected: setSelectedMock,
    page: 1,
    setPage: setPageMock,
    query: "",
    selectedIds: [],
    undoIds: ["undo-1"],
    totalCount: 3,
    totalPages: 2,
    visibleItems: [{ id: "msg-1" }],
    load: loadMock,
    toggleSelected: toggleSelectedMock,
    changeSort: changeSortMock,
    getSortArrow: getSortArrowMock,
    deleteSelected: deleteSelectedMock,
    undoDelete: undoDeleteMock,
    closeLoginModal: closeLoginModalMock,
    onSearchChange: onSearchChangeMock,
  }),
}));

vi.mock("../components/BackofficeModal", () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <button data-testid="backoffice-modal" onClick={onClose} type="button">
      close modal
    </button>
  ),
}));

vi.mock("./components/AuthAlert", () => ({
  default: ({
    onReconnect,
    onGoHome,
  }: {
    onReconnect: () => void;
    onGoHome: () => void;
  }) => (
    <div data-testid="auth-alert">
      <button onClick={onReconnect} type="button">
        reconnect
      </button>
      <button onClick={onGoHome} type="button">
        auth go home
      </button>
    </div>
  ),
}));

vi.mock("./components/DisabledView", () => ({
  default: ({ onGoHome }: { onGoHome: () => void }) => (
    <button data-testid="disabled-view" onClick={onGoHome} type="button">
      disabled home
    </button>
  ),
}));

vi.mock("./components/HeaderSettingsManager", () => ({
  default: () => <div data-testid="header-settings-manager" />,
}));

vi.mock("./components/HomeSettingsManager", () => ({
  default: () => <div data-testid="home-settings-manager" />,
}));

vi.mock("./components/MessageModal", () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <button data-testid="message-modal" onClick={onClose} type="button">
      close message
    </button>
  ),
}));

vi.mock("./components/MessagesTable", () => ({
  default: ({
    onToggleSelected,
    onSelectMessage,
    onDeleteSelected,
    onPrevPage,
    onNextPage,
    onSetPage,
    onChangeSort,
  }: {
    onToggleSelected: (id: string) => void;
    onSelectMessage: (message: { id: string }) => void;
    onDeleteSelected: () => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onSetPage: (page: number) => void;
    onChangeSort: (field: string) => void;
  }) => (
    <div data-testid="messages-table">
      <button onClick={() => onToggleSelected("msg-1")} type="button">
        toggle row
      </button>
      <button onClick={() => onSelectMessage({ id: "msg-2" })} type="button">
        select row
      </button>
      <button onClick={onDeleteSelected} type="button">
        delete selected
      </button>
      <button onClick={onPrevPage} type="button">
        prev page
      </button>
      <button onClick={onNextPage} type="button">
        next page
      </button>
      <button onClick={() => onSetPage(2)} type="button">
        set page
      </button>
      <button onClick={() => onChangeSort("createdAt")} type="button">
        sort date
      </button>
    </div>
  ),
}));

vi.mock("./components/PromiseSettingsManager", () => ({
  default: () => <div data-testid="promise-settings-manager" />,
}));

vi.mock("./components/ReferencesManager", () => ({
  default: ({ onRequestLogin }: { onRequestLogin: () => void }) => (
    <div data-testid="references-manager">
      <button onClick={onRequestLogin} type="button">
        references login
      </button>
    </div>
  ),
}));

vi.mock("./components/Sidebar", () => ({
  default: ({
    onSelectSection,
    onGoHome,
    onRefresh,
    onLogout,
  }: {
    onSelectSection: (section: string) => void;
    onGoHome: () => void;
    onRefresh: () => void;
    onLogout: () => void;
  }) => (
    <div data-testid="sidebar">
      <button onClick={() => onSelectSection("references")} type="button">
        to references
      </button>
      <button onClick={onGoHome} type="button">
        sidebar home
      </button>
      <button onClick={onRefresh} type="button">
        refresh
      </button>
      <button onClick={onLogout} type="button">
        logout
      </button>
    </div>
  ),
}));

vi.mock("./components/StatusBlocks", () => ({
  default: () => <div data-testid="status-blocks" />,
}));

vi.mock("./components/StatsBlock", () => ({
  default: ({ onRequestLogin }: { onRequestLogin: () => void }) => (
    <div data-testid="stats-block">
      <button onClick={onRequestLogin} type="button">
        stats login
      </button>
    </div>
  ),
}));

vi.mock("./components/UndoToast", () => ({
  default: ({ onUndo }: { onUndo: () => void }) => (
    <button data-testid="undo-toast" onClick={onUndo} type="button">
      undo
    </button>
  ),
}));

const SECTION_KEY = "backoffice_section";

describe("BackofficePage", () => {
  beforeEach(() => {
    cleanup();
    window.localStorage.removeItem(SECTION_KEY);
    isBackofficeEnabledMock.mockReturnValue(true);
    routerPushMock.mockReset();
    clearAuthTokensMock.mockReset();
    setOpenLoginMock.mockReset();
    setSelectedMock.mockReset();
    setPageMock.mockReset();
    loadMock.mockReset();
    toggleSelectedMock.mockReset();
    changeSortMock.mockReset();
    getSortArrowMock.mockReset();
    deleteSelectedMock.mockReset();
    undoDeleteMock.mockReset();
    closeLoginModalMock.mockReset();
    onSearchChangeMock.mockReset();
  });

  it("renders disabled view when backoffice is disabled and can go home", () => {
    isBackofficeEnabledMock.mockReturnValue(false);
    render(<BackofficePage />);
    fireEvent.click(screen.getByTestId("disabled-view"));
    expect(routerPushMock).toHaveBeenCalledWith("/");
  });

  it("renders messages section by default and wires message actions", () => {
    render(<BackofficePage />);

    expect(screen.getByRole("heading", { name: "Messages de contact" })).toBeInTheDocument();
    expect(screen.getByTestId("messages-table")).toBeInTheDocument();
    expect(screen.queryByTestId("references-manager")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Rechercher par nom, email ou sujet")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Rechercher par nom, email ou sujet"), {
      target: { value: "alice" },
    });
    fireEvent.click(screen.getByRole("button", { name: "toggle row" }));
    fireEvent.click(screen.getByRole("button", { name: "select row" }));
    fireEvent.click(screen.getByRole("button", { name: "delete selected" }));
    fireEvent.click(screen.getByRole("button", { name: "prev page" }));
    fireEvent.click(screen.getByRole("button", { name: "next page" }));
    fireEvent.click(screen.getByRole("button", { name: "set page" }));
    fireEvent.click(screen.getByRole("button", { name: "sort date" }));
    fireEvent.click(screen.getByRole("button", { name: "reconnect" }));
    fireEvent.click(screen.getByRole("button", { name: "auth go home" }));
    fireEvent.click(screen.getByTestId("undo-toast"));
    fireEvent.click(screen.getByTestId("message-modal"));
    fireEvent.click(screen.getByRole("button", { name: "refresh" }));
    fireEvent.click(screen.getByRole("button", { name: "sidebar home" }));
    fireEvent.click(screen.getByRole("button", { name: "logout" }));

    expect(onSearchChangeMock).toHaveBeenCalledWith("alice");
    expect(toggleSelectedMock).toHaveBeenCalledWith("msg-1");
    expect(setSelectedMock).toHaveBeenCalledWith({ id: "msg-2" });
    expect(setSelectedMock).toHaveBeenCalledWith(null);
    expect(deleteSelectedMock).toHaveBeenCalled();
    expect(setPageMock).toHaveBeenCalledTimes(3);
    expect(changeSortMock).toHaveBeenCalledWith("createdAt");
    expect(setOpenLoginMock).toHaveBeenCalledWith(true);
    expect(undoDeleteMock).toHaveBeenCalled();
    expect(loadMock).toHaveBeenCalledWith(1);
    expect(clearAuthTokensMock).toHaveBeenCalledTimes(2);
    expect(routerPushMock).toHaveBeenCalledWith("/");
  });

  it("renders references section when stored and can reopen auth", () => {
    setBackofficeSection("references");
    render(<BackofficePage />);

    expect(screen.getByRole("heading", { name: "References" })).toBeInTheDocument();
    expect(screen.getAllByTestId("references-manager").length).toBeGreaterThan(0);
    expect(screen.queryAllByTestId("messages-table")).toHaveLength(0);
    expect(screen.queryByPlaceholderText("Rechercher par nom, email ou sujet")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "references login" }));
    expect(setOpenLoginMock).toHaveBeenCalledWith(true);
  });

  it("renders header section when stored", () => {
    setBackofficeSection("header");
    render(<BackofficePage />);
    expect(screen.getByRole("heading", { name: "Header" })).toBeInTheDocument();
    expect(screen.getByTestId("header-settings-manager")).toBeInTheDocument();
    expect(screen.queryAllByTestId("messages-table")).toHaveLength(0);
    expect(screen.queryAllByTestId("references-manager")).toHaveLength(0);
  });

  it("renders home section when stored", () => {
    setBackofficeSection("home");
    render(<BackofficePage />);
    expect(screen.getByRole("heading", { name: "Accueil" })).toBeInTheDocument();
    expect(screen.getByTestId("home-settings-manager")).toBeInTheDocument();
    expect(screen.queryAllByTestId("messages-table")).toHaveLength(0);
    expect(screen.queryAllByTestId("references-manager")).toHaveLength(0);
  });

  it("renders promise section when stored", () => {
    setBackofficeSection("promise");
    render(<BackofficePage />);
    expect(screen.getByRole("heading", { name: "Positionnement" })).toBeInTheDocument();
    expect(screen.getByTestId("promise-settings-manager")).toBeInTheDocument();
    expect(screen.queryAllByTestId("messages-table")).toHaveLength(0);
    expect(screen.queryAllByTestId("references-manager")).toHaveLength(0);
  });

  it("renders stats section when stored", () => {
    setBackofficeSection("stats");
    render(<BackofficePage />);

    expect(screen.getByRole("heading", { name: "Statistiques" })).toBeInTheDocument();
    expect(screen.getByTestId("stats-block")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "stats login" }));
    expect(setOpenLoginMock).toHaveBeenCalledWith(true);
  });

  it("closes the login modal through its close handler", () => {
    render(<BackofficePage />);
    fireEvent.click(screen.getByTestId("backoffice-modal"));
    expect(closeLoginModalMock).toHaveBeenCalled();
  });
});
