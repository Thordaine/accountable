import { expect, test, vi } from "vitest";
import type { Session } from "../auth/session";
import { api, ApiError, setSession } from "./client";

function signedIn(): Session {
  return {
    local: true,
    signIn: vi.fn(),
    signOut: vi.fn(async () => {}),
    token: async () => "a-token",
    onChange: () => () => {},
  };
}

function answer(status: number, body: unknown) {
  const fetch = vi.fn<typeof globalThis.fetch>(async () =>
    Response.json(body, { status }),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

test("every call sends the bearer token and the browser's time zone", async () => {
  setSession(signedIn());
  const fetch = answer(200, []);
  await api("/deals", "POST", { name: "Pilot" });
  const headers = new Headers(fetch.mock.calls[0][1]!.headers);
  expect(headers.get("Authorization")).toBe("Bearer a-token");
  expect(headers.get("X-Time-Zone")).toBe(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  expect(headers.get("Content-Type")).toBe("application/json");
});

test("a 401 signs out", async () => {
  const session = signedIn();
  setSession(session);
  answer(401, { detail: "Not signed in" });
  await expect(api("/deals")).rejects.toBeInstanceOf(ApiError);
  expect(session.signOut).toHaveBeenCalled();
});
