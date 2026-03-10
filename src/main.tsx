import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./utils/registerServiceWorker";
import { checkAppVersion } from "./utils/versionCheck";

// Check for version updates
const versionUpdated = checkAppVersion();
if (versionUpdated) {
  console.log('App updated to new version');
}

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for PWA functionality
if (import.meta.env.PROD) {
  registerServiceWorker();
}
