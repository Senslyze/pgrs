import type { Context } from "hono";
import { UserService } from "../services/user.service";
import { createUserSchema } from "../validations/user.schema";

export class UserController {
  static async create(c: Context) {
    try {
      const body = await c.req.json();
      const parsed = createUserSchema.safeParse(body);

      if (!parsed.success) {
        return c.json(
          { error: "Validation failed", details: parsed.error.format() },
          400
        );
      }

      const user = await UserService.create(parsed.data);
      return c.json({ message: "User created successfully", user }, 201);
    } catch (error: any) {
      return c.json({ error: error.message || "Failed to create user" }, 500);
    }
  }

  static async getById(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ error: "User ID is required" }, 400);
      }

      const user = await UserService.getById(id);
      return c.json({data: user, message: "User fetched successfully"});
    } catch (error: any) {
      if (error.message === "User not found") {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message || "Failed to fetch user" }, 500);
    }
  }

  static async getAll(c: Context) {
    try {
      const queryParams = c.req.query();
      const result = await UserService.getAll(queryParams);
      return c.json({ data: result, message: "Users fetched successfully" });
    } catch (error: any) {
      return c.json({ error: error.message || "Failed to fetch users" }, 500);
    }
  }

  static async update(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ error: "User ID is required" }, 400);
      }

      const body = await c.req.json();
      const user = await UserService.update(id, body);
      return c.json({ message: "User updated successfully", user });
    } catch (error: any) {
      if (
        error.message === "User not found" ||
        error.message === "Department not found" ||
        error.message.includes("already exists")
      ) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: error.message || "Failed to update user" }, 500);
    }
  }

  static async delete(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ error: "User ID is required" }, 400);
      }

      const result = await UserService.delete(id);
      return c.json({ message: "User deleted successfully", data: result }, 200);
    } catch (error: any) {
      if (error.message === "User not found") {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message || "Failed to delete user" }, 500);
    }
  }
}
