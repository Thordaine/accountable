import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { LogActivity } from "./ActivityForm";

afterEach(() => vi.useRealTimers());

test("an untouched Happened at means the moment the activity is logged", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 15, 9, 0));
  const fetchMock = vi.fn(async () => Response.json({}));
  vi.stubGlobal("fetch", fetchMock);
  render(
    <QueryClientProvider client={new QueryClient()}>
      <LogActivity contactId={1} />
    </QueryClientProvider>,
  );
  vi.setSystemTime(new Date(2026, 10, 15, 11, 30));
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/Description/), "Called back");
  await user.click(screen.getByRole("button", { name: "Log activity" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  const body = JSON.parse(
    (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
      .body as string,
  );
  expect(body.happened_at).toBe("2026-11-15T11:30");
});
