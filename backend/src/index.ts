import "./config"; // Load environment variables
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import authRoutes from "./routes/auth.route";
import grievanceRoutes from "./routes/grievance.route";
import ticketRoutes from "./routes/ticket.route";
import userRoutes from "./routes/user.route";
import departmentRoutes from "./routes/department.route";
import slaRoutes from "./routes/sla.route";
import violationRoutes from "./routes/violation.route";

// Create the app
const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  })
);

// Health check route
app.get("/", (c) => c.text("✅ Server is running!"));

// Mount auth routes directly at /api/auth
app.route("/api/auth", authRoutes);

// Mount grievance routes at /api/grievances
app.route("/api/grievances", grievanceRoutes);

// Mount ticket routes at /api/tickets
app.route("/api/tickets", ticketRoutes);

// Mount user routes at /api/users (ADMIN only)
app.route("/api/users", userRoutes);

// Mount department routes at /api/departments (ADMIN only)
app.route("/api/departments", departmentRoutes);

// Mount SLA routes at /api/slas (ADMIN only)
app.route("/api/slas", slaRoutes);

// Mount violation routes at /api/violations
app.route("/api/violations", violationRoutes);

// Example API routes
app.get("/api/hello", (c) =>
  c.json({ message: "Hello from Municipality!" })
);

// Example POST route
app.post("/api/data", async (c) => {
  const body = await c.req.json<{ name: string }>();
  return c.json({ received: body.name });
});

// Global 404 handler
app.notFound((c) => c.json({ error: "Not Found" }, 404));

// Error handler
app.onError((err, c) => {
  console.error("🔥 Error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
});

// Start the server
const port = Number(process.env.PORT) || 3000;
console.log(`🚀 Server running at http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
