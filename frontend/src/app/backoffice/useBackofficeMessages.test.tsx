import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useBackofficeMessages } from "./useBackofficeMessages";

type HarnessProps = {
  apiBase: string | undefined;
  backofficeEnabled?: boolean;
  onReady: (api: ReturnType<typeof useBackofficeMessages>) => void;
};

function HookHarness({ apiBase, backofficeEnabled = true, onReady }: HarnessProps) {
  const api = useBackofficeMessages({
    apiBase,
    backofficeEnabled,
    routerPush: vi.fn(),
  });

  onReady(api);
  return null;
}

describe("useBackofficeMessages", () => {
  it("signale une erreur si la suppression est demandee sans API base", async () => {
    let api: ReturnType<typeof useBackofficeMessages> | null = null;

    render(
      <HookHarness
        apiBase={undefined}
        onReady={(value) => {
          api = value;
        }}
      />
    );

    await waitFor(() => {
      expect(api).not.toBeNull();
    });

    await api?.deleteSelected();

    await waitFor(() => {
      expect(api?.errorMsg).toBe("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.");
    });
  });
});
