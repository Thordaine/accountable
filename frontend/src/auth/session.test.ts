import { expect, test, vi } from "vitest";
import { fakeApi } from "../test/fakeApi";
import { localSession, WrongCredentials } from "./session";

test("the local session signs in, keeps the token after a reload and drops it on sign out", async () => {
  const requests = fakeApi();
  const session = localSession();
  const changed = vi.fn();
  session.onChange(changed);

  await session.signIn("test@example.com", "test");
  expect(requests).toContainEqual({
    method: "POST",
    path: "/local-sign-in",
    body: { email: "test@example.com", password: "test" },
  });
  expect(changed).toHaveBeenCalledTimes(1);
  expect(await localSession().token()).toBe("local-test-user");

  await session.signOut();
  expect(changed).toHaveBeenCalledTimes(2);
  expect(await localSession().token()).toBeNull();
});

test("a wrong password is refused as wrong credentials", async () => {
  fakeApi();
  await expect(
    localSession().signIn("test@example.com", "nope"),
  ).rejects.toBeInstanceOf(WrongCredentials);
  expect(await localSession().token()).toBeNull();
});
