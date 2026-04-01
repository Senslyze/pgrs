import { Hono } from "hono";
import { SLAController } from "../controllers/sla.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";

const sla = new Hono();

// Apply auth middleware to all routes
sla.use("*", authMiddleware);

// Apply admin middleware to all routes (only ADMIN can manage SLA settings)
sla.use("*", adminMiddleware);

// ========== SLA Definition Routes ==========

// Create SLA rule
sla.post("/", SLAController.createSLADefinition);

// Get all SLA rules
sla.get("/", SLAController.getAllSLADefinitions);

// ========== SLA Escalation Routes (must come before /:id routes) ==========

// Create escalation setting
sla.post("/escalations", SLAController.createSLAEscalation);

// Get all escalation settings
sla.get("/escalations", SLAController.getAllSLAEscalations);

// Update escalation setting
sla.put("/escalations/:id", SLAController.updateSLAEscalation);
sla.patch("/escalations/:id", SLAController.updateSLAEscalation);

// Delete escalation setting
sla.delete("/escalations/:id", SLAController.deleteSLAEscalation);

// ========== SLA Definition Routes (parameterized routes come last) ==========

// Get SLA rule by ID
sla.get("/:id", SLAController.getSLADefinitionById);

// Update SLA rule
sla.put("/:id", SLAController.updateSLADefinition);
sla.patch("/:id", SLAController.updateSLADefinition);

// Delete SLA rule
sla.delete("/:id", SLAController.deleteSLADefinition);

export default sla;

