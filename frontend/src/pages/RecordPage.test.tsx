import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { Details } from "./RecordPage";

const added = {
  id: 1,
  created_at: "2026-11-03T09:00:00Z",
  updated_at: "2026-11-03T09:00:00Z",
  created_by: "Sam Lee",
  updated_by: "Sam Lee",
};

test("a changed record says who last changed it and when", () => {
  render(
    <Details
      items={[]}
      stamped={{
        ...added,
        updated_at: "2026-11-18T10:00:00Z",
        updated_by: "Ingo Prause",
      }}
    />,
  );
  expect(screen.getByText("Added by Sam Lee on 3 Nov 2026")).toBeVisible();
  expect(
    screen.getByText("Last changed by Ingo Prause on 18 Nov 2026"),
  ).toBeVisible();
});
