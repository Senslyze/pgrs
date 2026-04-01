import { Hono } from "hono";
import { UserController } from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";

const user = new Hono();

// Apply auth middleware to all routes
user.use("*", authMiddleware);

// Apply admin middleware to all routes (only ADMIN can manage users)
user.use("*", adminMiddleware);

// Get all users with pagination and filters (must come before /:id)
user.get("/get", UserController.getAll);

// Create a new user (must be related to a department)
user.post("/create-user", UserController.create);

// Update a user
user.put("/update/:id", UserController.update);
user.patch("/update/:id", UserController.update);

// Get user by ID
user.get("/:id", UserController.getById);

// Delete a user
user.delete("delete-user/:id", UserController.delete);

export default user;
