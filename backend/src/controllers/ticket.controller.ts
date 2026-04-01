import type { Context } from "hono";
import { TicketService } from "../services/ticket.service";
import { createTicketSchema, assignTicketSchema } from "../validations/ticket.schema";

export class TicketController {
  static async create(c: Context) {
    try {
      const body = await c.req.json();
      const parsed = createTicketSchema.safeParse(body);

      if (!parsed.success) {
        return c.json({ error: "Validation failed", details: parsed.error.format() }, 400);
      }

      const ticket = await TicketService.create(parsed.data);
      return c.json({ message: "Ticket created successfully", ticket }, 201);
    } catch (error: any) {
      return c.json({ error: error.message || "Failed to create ticket" }, 500);
    }
  }

  static async getById(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ error: "Ticket ID is required" }, 400);
      }

      const ticket = await TicketService.getById(id);
      return c.json({ ticket });
    } catch (error: any) {
      if (error.message === "Ticket not found") {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message || "Failed to fetch ticket" }, 500);
    }
  }

  static async getByGrievanceId(c: Context) {
    try {
      const grievanceId = c.req.param("grievanceId");
      if (!grievanceId) {
        return c.json({ error: "Grievance ID is required" }, 400);
      }

      const ticket = await TicketService.getByGrievanceId(grievanceId);
      return c.json({ ticket });
    } catch (error: any) {
      if (error.message === "Ticket not found for this grievance") {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message || "Failed to fetch ticket" }, 500);
    }
  }

  static async getAll(c: Context) {
    try {
      const queryParams = c.req.query();
      const result = await TicketService.getAll(queryParams);
      return c.json(result);
    } catch (error: any) {
      return c.json({ error: error.message || "Failed to fetch tickets" }, 500);
    }
  }

  static async getMyTickets(c: Context) {
    try {
      const user = c.get("user");
      if (!user || !user.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const queryParams = c.req.query();
      const result = await TicketService.getMyTickets(user.userId, queryParams);
      return c.json(result);
    } catch (error: any) {
      return c.json({ error: error.message || "Failed to fetch my tickets" }, 500);
    }
  }

  static async update(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ error: "Ticket ID is required" }, 400);
      }

      const body = await c.req.json();
      const ticket = await TicketService.update(id, body);
      return c.json({ message: "Ticket updated successfully", ticket });
    } catch (error: any) {
      if (error.message === "Ticket not found" || error.message === "Department not found") {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message || "Failed to update ticket" }, 500);
    }
  }

  static async assign(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ error: "Ticket ID is required" }, 400);
      }

      const body = await c.req.json();
      const parsed = assignTicketSchema.safeParse(body);

      if (!parsed.success) {
        return c.json({ error: "Validation failed", details: parsed.error.format() }, 400);
      }

      const ticket = await TicketService.assign(id, parsed.data);
      return c.json({ message: "Ticket assigned successfully", ticket });
    } catch (error: any) {
      if (error.message === "Ticket not found" || error.message === "User not found" || error.message === "Department not found" || error.message === "Department is required when assigning a ticket" || error.message === "User does not belong to the selected department") {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: error.message || "Failed to assign ticket" }, 500);
    }
  }

  static async updateStatus(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ error: "Ticket ID is required" }, 400);
      }

      const user = c.get("user");
      if (!user || !user.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Check if ticket exists and verify user has permission
      const existingTicket = await TicketService.getById(id);
      
      // If user is not admin, they can only update tickets assigned to them
      const userRole = user.role as string;
      if (userRole !== "ADMIN" && existingTicket.assignedTo !== user.userId) {
        return c.json({ error: "You can only update tickets assigned to you" }, 403);
      }

      const body = await c.req.json();
      const { status, comment } = body;

      if (!status) {
        return c.json({ error: "Status is required" }, 400);
      }

      const ticket = await TicketService.updateStatus(id, status, comment);
      return c.json({ message: "Ticket status updated successfully", ticket });
    } catch (error: any) {
      if (error.message === "Ticket not found") {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message || "Failed to update ticket status" }, 500);
    }
  }

  static async delete(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ error: "Ticket ID is required" }, 400);
      }

      await TicketService.delete(id);
      return c.json({ message: "Ticket deleted successfully" });
    } catch (error: any) {
      if (error.message === "Ticket not found") {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message || "Failed to delete ticket" }, 500);
    }
  }
}

