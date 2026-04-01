import type { Context } from "hono";
import { SLAService } from "../services/sla.service";
import {
  createSLADefinitionSchema,
  updateSLADefinitionSchema,
  createSLAEscalationSchema,
  updateSLAEscalationSchema,
} from "../validations/sla.schema";

export class SLAController {
  // ========== SLA Definition Endpoints ==========

  static async createSLADefinition(c: Context) {
    try {
      const body = await c.req.json();
      const parsed = createSLADefinitionSchema.safeParse(body);

      if (!parsed.success) {
        return c.json({ error: "Validation failed", details: parsed.error.format() }, 400);
      }

      const slaDefinition = await SLAService.createSLADefinition(parsed.data);
      return c.json({ message: "SLA definition created successfully", slaDefinition }, 201);
    } catch (error: any) {
      if (
        error.message === "Department not found" ||
        error.message.includes("already exists")
      ) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: error.message || "Failed to create SLA definition" }, 500);
    }
  }

  static async getSLADefinitionById(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ error: "SLA definition ID is required" }, 400);
      }

      const slaDefinition = await SLAService.getSLADefinitionById(id);
      return c.json({ slaDefinition });
    } catch (error: any) {
      if (error.message === "SLA definition not found") {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message || "Failed to fetch SLA definition" }, 500);
    }
  }

  static async getAllSLADefinitions(c: Context) {
    try {
      const queryParams = c.req.query();
      const result = await SLAService.getAllSLADefinitions(queryParams);
      return c.json(result);
    } catch (error: any) {
      return c.json({ error: error.message || "Failed to fetch SLA definitions" }, 500);
    }
  }

  static async updateSLADefinition(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ error: "SLA definition ID is required" }, 400);
      }

      const body = await c.req.json();
      const parsed = updateSLADefinitionSchema.safeParse(body);

      if (!parsed.success) {
        return c.json({ error: "Validation failed", details: parsed.error.format() }, 400);
      }

      const slaDefinition = await SLAService.updateSLADefinition(id, parsed.data);
      return c.json({ message: "SLA definition updated successfully", slaDefinition });
    } catch (error: any) {
      if (error.message === "SLA definition not found") {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message || "Failed to update SLA definition" }, 500);
    }
  }

  static async deleteSLADefinition(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ error: "SLA definition ID is required" }, 400);
      }

      await SLAService.deleteSLADefinition(id);
      return c.json({ message: "SLA definition deleted successfully" });
    } catch (error: any) {
      if (error.message === "SLA definition not found") {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message || "Failed to delete SLA definition" }, 500);
    }
  }

  // ========== SLA Escalation Endpoints ==========

  static async createSLAEscalation(c: Context) {
    try {
      const body = await c.req.json();
      const parsed = createSLAEscalationSchema.safeParse(body);

      if (!parsed.success) {
        return c.json({ error: "Validation failed", details: parsed.error.format() }, 400);
      }

      const escalation = await SLAService.createSLAEscalation(parsed.data);
      return c.json({ message: "SLA escalation created successfully", escalation }, 201);
    } catch (error: any) {
      if (
        error.message === "Department not found" ||
        error.message === "User not found" ||
        error.message.includes("already exists")
      ) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: error.message || "Failed to create SLA escalation" }, 500);
    }
  }

  static async getSLAEscalationById(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ error: "SLA escalation ID is required" }, 400);
      }

      const escalation = await SLAService.getSLAEscalationById(id);
      return c.json({ escalation });
    } catch (error: any) {
      if (error.message === "SLA escalation not found") {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message || "Failed to fetch SLA escalation" }, 500);
    }
  }

  static async getAllSLAEscalations(c: Context) {
    try {
      const queryParams = c.req.query();
      const result = await SLAService.getAllSLAEscalations(queryParams);
      return c.json(result);
    } catch (error: any) {
      return c.json({ error: error.message || "Failed to fetch SLA escalations" }, 500);
    }
  }

  static async updateSLAEscalation(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ error: "SLA escalation ID is required" }, 400);
      }

      const body = await c.req.json();
      const parsed = updateSLAEscalationSchema.safeParse(body);

      if (!parsed.success) {
        return c.json({ error: "Validation failed", details: parsed.error.format() }, 400);
      }

      const escalation = await SLAService.updateSLAEscalation(id, parsed.data);
      return c.json({ message: "SLA escalation updated successfully", escalation });
    } catch (error: any) {
      if (error.message === "SLA escalation not found" || error.message === "User not found") {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message || "Failed to update SLA escalation" }, 500);
    }
  }

  static async deleteSLAEscalation(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ error: "SLA escalation ID is required" }, 400);
      }

      await SLAService.deleteSLAEscalation(id);
      return c.json({ message: "SLA escalation deleted successfully" });
    } catch (error: any) {
      if (error.message === "SLA escalation not found") {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message || "Failed to delete SLA escalation" }, 500);
    }
  }
}

