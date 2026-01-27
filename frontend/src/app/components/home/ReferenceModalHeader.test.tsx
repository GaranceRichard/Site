import { render, screen, cleanup } from "@testing-library/react";
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
  it("rend le label et le badge quand fournis", () => {
    render(
      <ReferenceModalHeader
        label="Label"
        nameExpanded="Titre"
        missionTitle="Mission"
        badgeSrc="/badge.png"
        badgeAlt="Badge"
        onClose={() => {}}
        closeButtonRef={{ current: null }}
      />,
    );

    expect(screen.getByText("Label")).toBeInTheDocument();
    expect(screen.getByAltText("Badge")).toBeInTheDocument();
  });

  it("n'affiche pas le badge si badgeSrc est absent", () => {
    render(
      <ReferenceModalHeader
        label={null}
        nameExpanded="Titre"
        missionTitle="Mission"
        badgeSrc={null}
        badgeAlt="Badge"
        onClose={() => {}}
        closeButtonRef={{ current: null }}
      />,
    );

    expect(screen.queryByAltText("Badge")).toBeNull();
  });
});
