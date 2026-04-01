import { Hono } from "hono";
import { ViolationController } from "../controllers/violation.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";
import { SLAService } from "../services/sla.service";

const violation = new Hono();

// Apply auth middleware to all routes
violation.use("*", authMiddleware);

// Background job endpoint to check all tickets for violations (admin only)
// This should be called automatically, but also available for manual trigger
violation.post("/check-all", adminMiddleware, async (c) => {
  try {
    const result = await SLAService.checkAllTicketsForViolations();
    return c.json({ message: "Violation check completed", data: result });
  } catch (error: any) {
    return c.json({ error: error.message || "Failed to check violations" }, 500);
  }
});

// Get my violations (for both admin and users)
violation.get("/my", ViolationController.getMyViolations);

// Get team violations (admin only - all violations)
violation.get("/team", ViolationController.getTeamViolations);

// Get violation statistics
violation.get("/stats", ViolationController.getViolationStats);

export default violation;

