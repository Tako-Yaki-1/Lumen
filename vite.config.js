import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { handleAI } from "./server/ai.js";

// Runs the /api/ai route inside Vite's own server, so one command starts everything
// and the API key (from .env) stays on the server side, never in the browser code.
function lumenApi(env) {
  const attach = (server) => {
    server.middlewares.use("/api/ai", (req, res) => handleAI(req, res, env));
  };
  return {
    name: "lumen-api",
    configureServer: attach,
    configurePreviewServer: attach,
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ""); // "" = load all vars, not just VITE_*
  return {
    plugins: [react(), lumenApi(env)],
  };
});
