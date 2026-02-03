import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
});

describe("ReferenceModalHeader", () => {
  it("rend le titre et le badge quand fournis", () => {
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

  it("n'affiche pas le badge si badgeSrc est absent", () => {
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

  it("appelle onClose au clic sur fermer", () => {
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

  it("masque le badge après erreur image puis le réaffiche si la source change", () => {
    const { rerender } = render(
      <ReferenceModalHeader
        nameExpanded="Titre"
        badgeSrc="/badge-a.png"
        badgeAlt="Badge"
        onClose={() => {}}
        closeButtonRef={{ current: null }}
      />,
    );

    const badge = screen.getByAltText("Badge");
    fireEvent.error(badge);
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
});
