import { Hono } from "hono";
import { DepartmentController } from "../controllers/department.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/admin.middleware";

const department = new Hono();

// Apply auth middleware to all routes
department.use("*", authMiddleware);

// Get all departments with pagination and filters (accessible to all authenticated users)
department.get("/", DepartmentController.getAll);

// Get department by ID (accessible to all authenticated users)
department.get("/:id", DepartmentController.getById);

// Admin-only routes
const adminOnly = new Hono();
adminOnly.use("*", adminMiddleware);

// Create a new department (ADMIN only)
adminOnly.post("/create", DepartmentController.create);

// Update a department (ADMIN only)
adminOnly.put("/:id", DepartmentController.update);
adminOnly.patch("/:id", DepartmentController.update);

// Delete a department (ADMIN only)
adminOnly.delete("delete-department/:id", DepartmentController.delete);

// Mount admin routes
department.route("/", adminOnly);

export default department;

