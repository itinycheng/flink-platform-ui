import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./i18n";
import "./global.css";
import App from "./App";

async function bootstrap() {
  document.title = __APP_NAME__;

  if (import.meta.env.DEV) {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

bootstrap().catch((err) => console.error("[bootstrap] failed", err));
