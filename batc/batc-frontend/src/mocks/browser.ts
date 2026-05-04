import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// The service worker file is in public/ and gets copied to the build output
// at the app root.  BASE_URL keeps this correct whether the app is served
// from "/" (local dev) or "/BATC_AGRISYSTEM_NEXTVERS/" (GitHub Pages).
const worker = setupWorker(...handlers);

export async function startMockWorker() {
  await worker.start({
    serviceWorker: {
      url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
    },
    onUnhandledRequest: "bypass",
  });
}
