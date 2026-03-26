import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ReferenceModalHeader from "./ReferenceModalHeader";

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

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("ReferenceModalHeader", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("renders title and badge when provided", () => {
    render(
      <ReferenceModalHeader
        nameExpanded="Titre"
        badgeSrc="/badge.png"
        badgeAlt="Badge"
        onClose={() => {}}
        closeButtonRef={{ current: null }}
      />,
    );

    expect(screen.getByText("Titre")).toBeInTheDocument();
    expect(screen.getByAltText("Badge")).toBeInTheDocument();
  });

  it("does not render the badge when badgeSrc is missing", () => {
    render(
      <ReferenceModalHeader
        nameExpanded="Titre"
        badgeSrc={null}
        badgeAlt="Badge"
        onClose={() => {}}
        closeButtonRef={{ current: null }}
      />,
    );

    expect(screen.queryByAltText("Badge")).toBeNull();
  });

  it("calls onClose when clicking the close button", () => {
    const onClose = vi.fn();

    render(
      <ReferenceModalHeader
        nameExpanded="Titre"
        badgeSrc={null}
        badgeAlt="Badge"
        onClose={onClose}
        closeButtonRef={{ current: null }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("hides the badge after an image error and shows it again when the source changes", () => {
    const { rerender } = render(
      <ReferenceModalHeader
        nameExpanded="Titre"
        badgeSrc="/badge-a.png"
        badgeAlt="Badge"
        onClose={() => {}}
        closeButtonRef={{ current: null }}
      />,
    );

    fireEvent.error(screen.getByAltText("Badge"));
    vi.advanceTimersByTime(250);
    expect(screen.getByAltText("Badge")).toHaveAttribute("src", expect.stringMatching(/\/badge-a\.png\?retry=/));

    fireEvent.error(screen.getByAltText("Badge"));
    expect(screen.queryByAltText("Badge")).toBeNull();

    rerender(
      <ReferenceModalHeader
        nameExpanded="Titre"
        badgeSrc="/badge-b.png"
        badgeAlt="Badge"
        onClose={() => {}}
        closeButtonRef={{ current: null }}
      />,
    );

    expect(screen.getByAltText("Badge")).toBeInTheDocument();
  });

  it("syncs badge visibility when the source appears and then disappears", () => {
    const { rerender } = render(
      <ReferenceModalHeader
        nameExpanded="Titre"
        badgeSrc={null}
        badgeAlt="Badge"
        onClose={() => {}}
        closeButtonRef={{ current: null }}
      />,
    );

    expect(screen.queryByAltText("Badge")).toBeNull();

    rerender(
      <ReferenceModalHeader
        nameExpanded="Titre"
        badgeSrc="/badge-c.png"
        badgeAlt="Badge"
        onClose={() => {}}
        closeButtonRef={{ current: null }}
      />,
    );

    expect(screen.getByAltText("Badge")).toBeInTheDocument();

    rerender(
      <ReferenceModalHeader
        nameExpanded="Titre"
        badgeSrc={null}
        badgeAlt="Badge"
        onClose={() => {}}
        closeButtonRef={{ current: null }}
      />,
    );

    expect(screen.queryByAltText("Badge")).toBeNull();
  });

  it("retries the same badge source once before hiding it", () => {
    render(
      <ReferenceModalHeader
        nameExpanded="Titre"
        badgeSrc="/badge-stable.png"
        badgeAlt="Badge"
        onClose={() => {}}
        closeButtonRef={{ current: null }}
      />,
    );

    const badge = screen.getByAltText("Badge");
    fireEvent.error(badge);
    vi.advanceTimersByTime(250);

    expect(screen.getByAltText("Badge")).toHaveAttribute(
      "src",
      expect.stringMatching(/\/badge-stable\.png\?retry=/),
    );
  });

  it("ignores duplicate image errors while a retry timer is already pending", () => {
    render(
      <ReferenceModalHeader
        nameExpanded="Titre"
        badgeSrc="/badge-pending.png"
        badgeAlt="Badge"
        onClose={() => {}}
        closeButtonRef={{ current: null }}
      />,
    );

    const badge = screen.getByAltText("Badge");
    fireEvent.error(badge);
    fireEvent.error(badge);
    vi.advanceTimersByTime(250);

    expect(screen.getByAltText("Badge")).toHaveAttribute(
      "src",
      expect.stringMatching(/\/badge-pending\.png\?retry=/),
    );
  });

  it("does not overwrite a newer badge source when a pending retry resolves", () => {
    const { rerender } = render(
      <ReferenceModalHeader
        nameExpanded="Titre"
        badgeSrc="/badge-a.png"
        badgeAlt="Badge"
        onClose={() => {}}
        closeButtonRef={{ current: null }}
      />,
    );

    fireEvent.error(screen.getByAltText("Badge"));

    rerender(
      <ReferenceModalHeader
        nameExpanded="Titre"
        badgeSrc="/badge-b.png"
        badgeAlt="Badge"
        onClose={() => {}}
        closeButtonRef={{ current: null }}
      />,
    );

    vi.advanceTimersByTime(250);
    expect(screen.getByAltText("Badge")).toHaveAttribute("src", "/badge-b.png");
  });

  it("appends retry with an ampersand when the badge source already has query params", () => {
    render(
      <ReferenceModalHeader
        nameExpanded="Titre"
        badgeSrc="/badge-query.png?size=small"
        badgeAlt="Badge"
        onClose={() => {}}
        closeButtonRef={{ current: null }}
      />,
    );

    fireEvent.error(screen.getByAltText("Badge"));
    vi.advanceTimersByTime(250);

    expect(screen.getByAltText("Badge")).toHaveAttribute(
      "src",
      expect.stringMatching(/\/badge-query\.png\?size=small&retry=/),
    );
  });

  it("clears the pending retry timer on unmount", () => {
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    const { unmount } = render(
      <ReferenceModalHeader
        nameExpanded="Titre"
        badgeSrc="/badge-cleanup.png"
        badgeAlt="Badge"
        onClose={() => {}}
        closeButtonRef={{ current: null }}
      />,
    );

    fireEvent.error(screen.getByAltText("Badge"));
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
