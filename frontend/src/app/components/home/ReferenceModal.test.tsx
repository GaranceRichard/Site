import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ReferenceModal from "./ReferenceModal";
import type { ReferenceItem } from "../../content/references";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { alt, src, className, sizes } = props as {
      alt?: string;
      src?: string;
      className?: string;
      sizes?: string;
    };
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt ?? ""} src={src} className={className} sizes={sizes} />;
  },
}));

const ITEM: ReferenceItem = {
  id: "ref-test",
  nameCollapsed: "Ref",
  nameExpanded: "Reference Test",
  missionTitle: "Mission",
  label: "Reference",
  imageSrc: "/references/test.png",
  situation: "Situation",
  tasks: ["Task A"],
  actions: ["Action A"],
  results: ["Result A"],
};

describe("ReferenceModal", () => {
  beforeEach(() => {
    vi.useFakeTimers();

    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("opens, focuses close, and restores focus on close", async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <>
        <button type="button">Trigger</button>
        <ReferenceModal item={null} onClose={onClose} />
      </>,
    );

    const trigger = screen.getByRole("button", { name: "Trigger" });
    trigger.focus();

    rerender(
      <>
        <button type="button">Trigger</button>
        <ReferenceModal item={ITEM} onClose={onClose} />
      </>,
    );

    vi.advanceTimersByTime(0);

    expect(screen.getByRole("dialog", { name: /détail de mission/i })).toBeInTheDocument();

    const closeButtons = screen.getAllByRole("button", { name: "Fermer" });
    const closeButton = closeButtons[1];
    expect(closeButton).toHaveFocus();

    fireEvent.click(closeButton);
    rerender(
      <>
        <button type="button">Trigger</button>
        <ReferenceModal item={null} onClose={onClose} />
      </>,
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveFocus();
  });

  it("closes when clicking the overlay", async () => {
    const onClose = vi.fn();
    const { rerender } = render(<ReferenceModal item={ITEM} onClose={onClose} />);

    vi.advanceTimersByTime(0);

    const buttons = screen.getAllByRole("button", { name: "Fermer" });
    const overlayButton = buttons[0];

    fireEvent.click(overlayButton);
    rerender(<ReferenceModal item={null} onClose={onClose} />);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on Escape key", async () => {
    const onClose = vi.fn();
    const { rerender } = render(<ReferenceModal item={ITEM} onClose={onClose} />);

    vi.advanceTimersByTime(0);

    fireEvent.keyDown(window, { key: "Escape" });
    rerender(<ReferenceModal item={null} onClose={onClose} />);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not call onClose again when parent forces item to null", async () => {
    const onClose = vi.fn();

    const { rerender } = render(<ReferenceModal item={ITEM} onClose={onClose} />);

    vi.advanceTimersByTime(0);

    rerender(<ReferenceModal item={null} onClose={onClose} />);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
