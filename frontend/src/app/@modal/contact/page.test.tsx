import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();
const usePathnameMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => usePathnameMock(),
}));

vi.mock("../../contact/ContactForm", () => ({
  default: ({ onSuccess }: { onSuccess?: () => void }) => (
    <div>
      <button type="button" onClick={onSuccess}>
        Fake submit
      </button>
    </div>
  ),
}));

import ContactModal from "./page";

describe("ContactModal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    usePathnameMock.mockReturnValue("/contact");
    pushMock.mockReset();
    document.body.style.overflow = "";
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    document.body.style.overflow = "";
  });

  it("restores page scrolling when clicking outside the modal", () => {
    render(<ContactModal />);

    expect(document.body.style.overflow).toBe("hidden");

    act(() => {
      vi.advanceTimersByTime(20);
    });

    const backdrop = screen.getAllByRole("button", { name: "Fermer" })[0];
    fireEvent.click(backdrop);

    expect(document.body.style.overflow).toBe("");
    expect(pushMock).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(520);
    });

    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("renders nothing when the pathname is not /contact", () => {
    usePathnameMock.mockReturnValue("/");

    const { container } = render(<ContactModal />);

    expect(container.firstChild).toBeNull();
    expect(document.body.style.overflow).toBe("");
  });

  it("stores the flash flag and closes after a successful submit", () => {
    const sessionSetItemSpy = vi.spyOn(window.sessionStorage.__proto__, "setItem");

    render(<ContactModal />);

    act(() => {
      vi.advanceTimersByTime(20);
    });

    fireEvent.click(screen.getByRole("button", { name: "Fake submit" }));

    expect(document.body.style.overflow).toBe("");
    expect(sessionSetItemSpy).toHaveBeenCalledWith("flash", "contact_success");

    act(() => {
      vi.advanceTimersByTime(520);
    });

    expect(pushMock).toHaveBeenCalledWith("/");
  });
});
