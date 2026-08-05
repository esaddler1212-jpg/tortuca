import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { migrateRenamedKeys } from "./storage";
import "./index.css";

migrateRenamedKeys();

if (import.meta.env.PROD) {
  void import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
