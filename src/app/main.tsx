import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/i18n/index.ts";
import App from "@/app/App.tsx";
import "@/styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
