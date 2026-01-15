import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: "10mb" }));

// Helper function to get dashboard directory
const getDashboardDir = () => {
  const distPath = path.join(__dirname, "dist", "data", "dashboards");
  const srcPath = path.join(__dirname, "src", "data", "dashboards");

  // Use dist in production, src in development
  if (fs.existsSync(distPath)) {
    return distPath;
  }
  return srcPath;
};

// API endpoint to get all dashboards
app.get("/api/dashboards", (req, res) => {
  try {
    const dashboardDir = getDashboardDir();

    if (!fs.existsSync(dashboardDir)) {
      return res.status(404).json({
        success: false,
        error: "Dashboard directory not found",
      });
    }

    const files = fs.readdirSync(dashboardDir).filter((file) => file.endsWith(".json"));
    const dashboards = files.map((file) => {
      const filePath = path.join(dashboardDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    });

    res.json({
      success: true,
      dashboards: dashboards,
    });
  } catch (error) {
    console.error("Error loading dashboards:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// API endpoint to get a single dashboard
app.get("/api/dashboards/:id", (req, res) => {
  try {
    const { id } = req.params;
    const dashboardDir = getDashboardDir();
    const filePath = path.join(dashboardDir, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: "Dashboard not found",
      });
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const dashboard = JSON.parse(content);

    res.json({
      success: true,
      dashboard: dashboard,
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// API endpoint for saving dashboards
app.post("/api/dashboard", (req, res) => {
  try {
    const { dashboardId, data } = req.body;

    if (!dashboardId || !data) {
      return res.status(400).json({
        success: false,
        error: "Missing dashboardId or data",
      });
    }

    const dashboardDir = getDashboardDir();
    const filePath = path.join(dashboardDir, `${dashboardId}.json`);

    // Ensure directory exists
    if (!fs.existsSync(dashboardDir)) {
      fs.mkdirSync(dashboardDir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

    console.log(`✅ Dashboard saved: ${filePath}`);

    res.json({
      success: true,
      message: "Dashboard saved successfully",
      path: filePath,
    });
  } catch (error) {
    console.error("Error saving dashboard:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// API endpoint for deleting dashboards
app.delete("/api/dashboard/:id", (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Missing dashboard id" });
    }

    const dashboardDir = getDashboardDir();
    const safeId = decodeURIComponent(String(id)).replace(/\.json$/i, "");
    const filePath = path.join(dashboardDir, `${safeId}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: "Dashboard not found" });
    }

    fs.unlinkSync(filePath);
    console.log(`🗑️ Dashboard deleted: ${filePath}`);

    return res.json({ success: true, message: "Dashboard deleted successfully", path: filePath });
  } catch (error) {
    console.error("Error deleting dashboard:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, "dist")));

// SPA fallback - serve index.html for all other routes
app.get("*", (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  const indexPath = path.join(__dirname, "dist", "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Application not built. Run 'npm run build' first.");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Production server running on http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, "dist")}`);
  console.log(`💾 Dashboard API available at: http://localhost:${PORT}/api/dashboard`);
});
