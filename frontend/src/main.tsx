import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/jetbrains-mono";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { loadConfig } from "./auth/config";
import { sessionFor } from "./auth/session";
import "./styles/tokens.css";
import "./styles/app.css";

const session = sessionFor(await loadConfig());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App session={session} />
  </StrictMode>,
);
