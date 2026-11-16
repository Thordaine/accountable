import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { expect, test } from "vitest";
import type { Dashboard } from "../api/types";
import { PipelineHero } from "./PipelineHero";

const stages: Dashboard["open"]["stages"] = [
  { stage: "New", count: 4, value: 63500, expected: 6350 },
  { stage: "Qualified", count: 4, value: 115500, expected: 28875 },
  { stage: "Proposal", count: 4, value: 125500, expected: 62750 },
  { stage: "Negotiation", count: 4, value: 197750, expected: 148312.5 },
];
const open = { value: 502250, expected: 246287.5, count: 16, late: 3, stages };
const empty = {
  value: 0,
  expected: 0,
  count: 0,
  late: 0,
  stages: stages.map((s) => ({ ...s, count: 0, value: 0, expected: 0 })),
};

function renderHero(props: Parameters<typeof PipelineHero>[0]) {
  const router = createMemoryRouter([
    { path: "*", element: <PipelineHero {...props} /> },
  ]);
  render(<RouterProvider router={router} />);
}

test("shows the open pipeline's figures in the mockup's words", () => {
  renderHero({ open, winRate: 74 });
  const hero = screen.getByRole("region", { name: "Open pipeline" });
  expect(hero).toHaveTextContent("US$502,250");
  expect(hero).toHaveTextContent("US$246,288");
  expect(screen.getByText("16")).toBeInTheDocument();
  expect(hero).toHaveTextContent("Open deals, 3 late");
  expect(screen.getByText("74%")).toBeInTheDocument();
  expect(hero).toHaveTextContent("Win rate, last 12 months");
});

test("each stage segment is as wide as its share of the value and links to the pipeline", () => {
  renderHero({ open, winRate: 74 });
  const segments = screen.getAllByRole("link");
  expect(segments).toHaveLength(4);
  expect(segments.map((s) => s.style.flexGrow)).toEqual([
    "63500",
    "115500",
    "125500",
    "197750",
  ]);
  expect(segments[0]).toHaveAttribute("href", "/pipeline");
});

test("no open deals and no win rate", () => {
  renderHero({ open: empty, winRate: null });
  expect(screen.getByText("No open deals")).toBeInTheDocument();
  expect(screen.queryAllByRole("link")).toHaveLength(0);
  expect(screen.getByText("—")).toBeInTheDocument();
});

test("a stage holding only US$0 deals shades nothing instead of dividing by zero", () => {
  const zero = {
    ...open,
    stages: [
      { stage: "New" as const, count: 2, value: 0, expected: 0 },
      ...stages.slice(1),
    ],
  };
  renderHero({ open: zero, winRate: 74 });
  const shade = screen
    .getAllByRole("link")[0]
    .querySelector(".exp") as HTMLElement;
  expect(shade.style.height).toBe("0%");
});
