import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "dashboard-api",
      configureServer(server) {
        server.middlewares.use("/api/dashboard", (req: any, res: any, next: any) => {
          if (req.method === "POST") {
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
                res.end(JSON.stringify({ success: true, message: "Dashboard saved successfully" }));
              } catch (error: any) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, error: error.message }));
              }
            });
          } else {
            next();
          }
        });
      },
    } as Plugin,
  ],
  server: {
    port: 3001,
    host: true,
  },
});
