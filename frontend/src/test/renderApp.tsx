import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { routes } from "../App";
import { AuthProvider } from "../auth/AuthProvider";
import { localSession, TOKEN_KEY } from "../auth/session";
import { fakeApi } from "./fakeApi";

/** Render the whole app at a path, against the fake API; signed in unless asked. */
export function renderApp(path: string, { signedIn = true } = {}) {
  const requests = fakeApi();
  if (signedIn) localStorage.setItem(TOKEN_KEY, "local-test-user");
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={client}>
      <AuthProvider session={localSession()}>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return { user: userEvent.setup(), requests, router };
}
