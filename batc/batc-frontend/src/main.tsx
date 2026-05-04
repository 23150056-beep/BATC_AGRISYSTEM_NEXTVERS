import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Providers } from "./app/providers";

async function prepare() {
  if (import.meta.env.VITE_USE_MOCK === "true") {
    const { startMockWorker } = await import("./mocks/browser");
    await startMockWorker();
  }
}

prepare().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Providers />
    </StrictMode>
  );
});
