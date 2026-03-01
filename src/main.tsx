import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/theme-provider";
import App from "./App";
import "./index.css";

const CHUNK_RELOAD_KEY = "abm-chunk-reload-once";

function reloadOnceForChunkError() {
  if (typeof window === "undefined") return;
  const alreadyRetried = window.sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";
  if (alreadyRetried) return;
  window.sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  window.location.reload();
}

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  reloadOnceForChunkError();
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  const message = typeof reason?.message === "string" ? reason.message : String(reason ?? "");
  if (/Failed to fetch dynamically imported module/i.test(message)) {
    event.preventDefault();
    reloadOnceForChunkError();
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
