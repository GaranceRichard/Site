import { describe, expect, it } from "vitest";

import { normalizeAboutSettings } from "./siteSettingsNormalization";
import { DEFAULT_ABOUT_SETTINGS } from "./siteSettingsSchema";

describe("siteSettingsNormalization", () => {
  it("falls back to default about highlight values when highlight is invalid", () => {
    expect(
      normalizeAboutSettings({
        title: "  A propos  ",
        subtitle: "  Une posture claire  ",
        highlight: "not-an-object",
      }),
    ).toEqual({
      title: "A propos",
      subtitle: "Une posture claire",
      highlight: DEFAULT_ABOUT_SETTINGS.highlight,
    });
  });

  it("falls back to default about highlight items when items are not an array", () => {
    expect(
      normalizeAboutSettings({
        title: "  A propos  ",
        subtitle: "  Une posture claire  ",
        highlight: {
          intro: "  Intro  ",
          items: "not-an-array",
        },
      }),
    ).toEqual({
      title: "A propos",
      subtitle: "Une posture claire",
      highlight: {
        intro: "Intro",
        items: DEFAULT_ABOUT_SETTINGS.highlight.items,
      },
    });
  });
});
