import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BackofficeModalCard from "./BackofficeModalCard";

describe("BackofficeModalCard", () => {
  it("renders its children with visible styles", () => {
    render(
      <BackofficeModalCard visible={true} ease="ease-test" dur="duration-test">
        <p>Card content</p>
      </BackofficeModalCard>
    );

    expect(screen.getByText("Card content")).toBeInTheDocument();
    expect(screen.getByText("Card content").parentElement?.className).toContain("opacity-100");
  });

  it("uses hidden transform styles when not visible", () => {
    render(
      <BackofficeModalCard visible={false} ease="ease-test" dur="duration-test">
        <p>Hidden card</p>
      </BackofficeModalCard>
    );

    expect(screen.getByText("Hidden card").parentElement?.className).toContain("translate-y-4");
  });
});
