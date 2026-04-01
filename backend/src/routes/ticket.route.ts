import { Hono } from "hono";
import { TicketController } from "../controllers/ticket.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const ticket = new Hono();

// Apply auth middleware to all routes
ticket.use("*", authMiddleware);

// Get all tickets with pagination and filters (must come before /my and /:id)
ticket.get("/all-tickets", TicketController.getAll);

// Get my tickets (tickets assigned to current user) - must come before /:id
ticket.get("/my-tickets", TicketController.getMyTickets);

// Create a new ticket
ticket.post("create-ticket/", TicketController.create);

// Get ticket by ID
ticket.get("get-ticket/:id", TicketController.getById);

// Assign a ticket to a user
ticket.patch("assign-ticket/:id/assign", TicketController.assign);

// Update ticket status
ticket.patch("update-status/:id/status", TicketController.updateStatus);

// Update a ticket
ticket.put("update-ticket/:id", TicketController.update);
ticket.patch("/:id", TicketController.update);

// Delete a ticket (soft delete)
ticket.delete("delete-ticket/:id", TicketController.delete);

export default ticket;

