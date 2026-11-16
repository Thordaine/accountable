import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, test, vi } from "vitest";
import { useMoveDeal } from "./queries";

test("moving a deal that isn't in a stale cached list still saves", async () => {
  const fetchMock = vi.fn(async () => Response.json({}));
  vi.stubGlobal("fetch", fetchMock);
  const client = new QueryClient();
  client.setQueryData(["deals"], []);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useMoveDeal(), { wrapper });
  act(() => result.current.mutate({ id: 7, stage: "Qualified", index: 0 }));
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/deals/7/move",
    expect.objectContaining({ method: "POST" }),
  );
});
