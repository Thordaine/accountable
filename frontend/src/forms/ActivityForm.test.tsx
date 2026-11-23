import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeAll, expect, test, vi } from "vitest";
import { call } from "../test/fakeApi";
import { ActivityForm, LogActivity } from "./ActivityForm";

beforeAll(() => vi.stubEnv("TZ", "Pacific/Kiritimati"));
afterAll(() => vi.unstubAllEnvs());
afterEach(() => vi.useRealTimers());

function stubFetch() {
  const fetchMock = vi.fn(async () => Response.json({}));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function sentBody(fetchMock: ReturnType<typeof stubFetch>) {
  const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  return JSON.parse(init.body as string);
}

function renderWithClient(ui: React.ReactNode) {
  render(
    <QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>,
  );
  return userEvent.setup();
}

test("the tests run in a zone 14 hours ahead of UTC", () => {
  expect(new Date("2026-11-15T00:00:00Z").getTimezoneOffset()).toBe(-14 * 60);
});

test("an untouched Happened at means the moment the activity is logged, with the browser's offset", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 15, 9, 0));
  const fetchMock = stubFetch();
  const user = renderWithClient(<LogActivity contactId={1} />);
  vi.setSystemTime(new Date(2026, 10, 15, 11, 30));
  await user.type(screen.getByLabelText(/Description/), "Called back");
  await user.click(screen.getByRole("button", { name: "Log activity" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  expect(sentBody(fetchMock).happened_at).toBe("2026-11-15T11:30:00+14:00");
});

test("editing shows a saved UTC time in the browser's zone and sends it back unchanged", async () => {
  const fetchMock = stubFetch();
  const user = renderWithClient(
    <ActivityForm
      activity={{ ...call, happened_at: "2026-11-10T08:00:00Z" }}
      onDone={() => {}}
    />,
  );
  expect(screen.getByLabelText(/Happened at/)).toHaveValue("2026-11-10T22:00");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  expect(sentBody(fetchMock).happened_at).toBe("2026-11-10T22:00:00+14:00");
});
