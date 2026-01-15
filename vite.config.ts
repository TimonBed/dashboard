import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const safeExec = (command: string): string | null => {
  try {
    return execSync(command, { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
};

const packageJson = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version?: string };
const appVersion = packageJson.version ?? "0.0.0";

const gitBuildNumber = safeExec("git rev-list --count HEAD");
const gitSha = safeExec("git rev-parse --short HEAD");
const buildNumber = process.env.BUILD_NUMBER ?? gitBuildNumber ?? String(Date.now());
const buildTime = new Date().toISOString();

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __BUILD_NUMBER__: JSON.stringify(buildNumber),
    __BUILD_SHA__: JSON.stringify(gitSha ?? ""),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  plugins: [
    react(),
    {
      name: "dashboard-api",
      configureServer(server) {
        server.middlewares.use(async (req: any, res: any, next: any) => {
          // GET /api/dashboards - List all dashboards
          if (req.method === "GET" && req.url === "/api/dashboards") {
            try {
              const fs = await import("fs");
              const path = await import("path");
              const url = await import("url");
              const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
              const dashboardDir = path.resolve(__dirname, "src/data/dashboards");

              if (!fs.existsSync(dashboardDir)) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, error: "Dashboard directory not found" }));
                return;
              }

              const files = fs.readdirSync(dashboardDir).filter((file: string) => file.endsWith(".json"));
              const dashboards = files.map((file: string) => {
                const filePath = path.join(dashboardDir, file);
                const content = fs.readFileSync(filePath, "utf-8");
                return JSON.parse(content);
              });

              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: true, dashboards }));
            } catch (error: any) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ success: false, error: error.message }));
            }
            return;
          }

          // POST /api/dashboard - Save a dashboard
          if (req.method === "POST" && req.url === "/api/dashboard") {
            let body = "";
            req.on("data", (chunk: any) => {
              body += chunk.toString();
            });
            req.on("end", async () => {
              try {
                const { dashboardId, data } = JSON.parse(body);
                const fs = await import("fs");
                const path = await import("path");
                const url = await import("url");
                const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
                const filePath = path.resolve(__dirname, `src/data/dashboards/${dashboardId}.json`);
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, message: "Dashboard saved successfully", path: filePath }));
              } catch (error: any) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, error: error.message }));
              }
            });
            return;
          }

          next();
        });
      },
    } as Plugin,
  ],
  server: {
    port: 3001,
    host: true,
  },
});
