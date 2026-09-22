import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { getConvexUrl } from "@convex-dev/static-hosting";
import App from "./App";
import "./index.css";

function resolveConvexUrl(): string {
  if (import.meta.env.VITE_CONVEX_URL) return import.meta.env.VITE_CONVEX_URL;
  try {
    return getConvexUrl();
  } catch {
    return "";
  }
}

const url = resolveConvexUrl();
const root = document.getElementById("root")!;

if (!url) {
  createRoot(root).render(
    <div className="boot-error">
      <h1>Northbridge Desk</h1>
      <p>
        Set <code>VITE_CONVEX_URL</code> or run{" "}
        <code>npx convex dev</code> /{" "}
        <code>npx @convex-dev/static-hosting deploy</code>.
      </p>
    </div>,
  );
} else {
  const convex = new ConvexReactClient(url);
  createRoot(root).render(
    <StrictMode>
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    </StrictMode>,
  );
}
