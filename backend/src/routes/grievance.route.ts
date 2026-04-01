import { Hono } from "hono";
import { GrievanceController } from "../controllers/grievance.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { serviceAuthMiddleware } from "../middlewares/serviceAuth.middleware";

const grievance = new Hono();

// Get all grievances with pagination and filters
grievance.get("/", authMiddleware, GrievanceController.getAll);

// Get grievance statistics summary
grievance.get("/stats/summary", authMiddleware, GrievanceController.getStatsSummary);

// Search grievances (must come before /manage/:id)
grievance.get("/search", authMiddleware, GrievanceController.search);

// Get grievance by report ID (must come before /manage/:id)
grievance.get("/report/:reportId", authMiddleware, GrievanceController.getByReportId);

// Create a new grievance (with service auth middleware for external services)
grievance.post("/manage", serviceAuthMiddleware, GrievanceController.create);

// Get grievance by ID (manage endpoint)
grievance.get("/manage/:id", authMiddleware, GrievanceController.getById);

// Update a grievance
grievance.put("/manage/:id", authMiddleware, GrievanceController.update);
grievance.patch("/manage/:id", authMiddleware, GrievanceController.update);

// Update grievance status
grievance.put("/manage/:id/status", authMiddleware, GrievanceController.updateStatus);

// Delete a grievance (soft delete)
grievance.delete("/manage/:id", authMiddleware, GrievanceController.delete);

/**
 * Download media securely from WhatsApp API
 * POST /api/grievances/download/:mediaId
 */
grievance.post("/download/:mediaId", authMiddleware, GrievanceController.downloadMedia);

export default grievance;

