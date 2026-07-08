import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import { initMonitoring } from "@/services/monitoring";
import { initAnalytics } from "@/services/analytics";
import "@/styles/globals.css";

initMonitoring();
initAnalytics();

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
