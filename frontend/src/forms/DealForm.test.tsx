import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addDays } from "date-fns";
import { beforeEach, expect, test, vi } from "vitest";
import { isoDate } from "../lib/format";
import { DealForm } from "./DealForm";

const fetchMock = vi.fn(async () => Response.json([]));

beforeEach(() => {
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
});

function setup() {
  const client = new QueryClient();
  render(
    <QueryClientProvider client={client}>
      <DealForm onDone={() => {}} />
    </QueryClientProvider>,
  );
  return userEvent.setup();
}

test("changing the stage sets the usual probability", async () => {
  const user = setup();
  await user.selectOptions(screen.getByLabelText(/Stage/), "Negotiation");
  expect(screen.getByLabelText(/Probability/)).toHaveValue(75);
});

test("a new deal closes 30 days from today", () => {
  setup();
  expect(screen.getByLabelText(/Close date/)).toHaveValue(isoDate(addDays(new Date(), 30)));
});

test("saving without a name shows Required and doesn't save", async () => {
  const user = setup();
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(screen.getByText("Required")).toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalledWith("/api/deals", expect.objectContaining({ method: "POST" }));
});

test("picking Won shows today's close date, as saving will set it", async () => {
  const user = setup();
  await user.selectOptions(screen.getByLabelText(/Stage/), "Won");
  expect(screen.getByLabelText(/Close date/)).toHaveValue(isoDate(new Date()));
  expect(screen.getByLabelText(/Probability/)).toHaveValue(100);
});
