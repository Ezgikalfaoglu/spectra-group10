
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  // Each full page load (refresh / reopen the site) starts a fresh pipeline —
  // don't keep the previously uploaded specimen or its in-progress stage settings.
  // In-app navigation does NOT reload this file, so the flow is preserved while
  // moving between pipeline steps; only a real reload clears it.
  for (const k of [
    "spectra_upload",
    "spectra_preprocessing",
    "spectra_transform",
    "spectra_quantization",
    "spectra_entropy",
  ]) {
    try { localStorage.removeItem(k); } catch { /* ignore */ }
  }

  createRoot(document.getElementById("root")!).render(<App />);
