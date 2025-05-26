import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/i18n/index.ts"; // Import i18n configuration before App
import App from "@/app/App.tsx";
import "@/styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
