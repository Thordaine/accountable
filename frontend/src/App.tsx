import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, Outlet } from "react-router";
import { RouterProvider } from "react-router/dom";
import { Toaster } from "sonner";
import { NavBar } from "./components/NavBar";
import { Contact } from "./pages/Contact";
import { Contacts } from "./pages/Contacts";
import { Dashboard } from "./pages/Dashboard";
import { Deal } from "./pages/Deal";
import { Deals } from "./pages/Deals";
import { Organization } from "./pages/Organization";
import { Organizations } from "./pages/Organizations";
import { Pipeline } from "./pages/Pipeline";

const queryClient = new QueryClient();

function Layout() {
  return (
    <div className="wrap">
      <NavBar />
      <Outlet />
      <Toaster position="bottom-right" toastOptions={{ className: "toast" }} />
    </div>
  );
}

const router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "organizations", Component: Organizations },
      { path: "organizations/:id", Component: Organization },
      { path: "contacts", Component: Contacts },
      { path: "contacts/:id", Component: Contact },
      { path: "deals", Component: Deals },
      { path: "deals/:id", Component: Deal },
      { path: "pipeline", Component: Pipeline },
    ],
  },
]);

/** Providers and routes. */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
