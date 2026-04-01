import type { Context } from "hono";
import { DepartmentService } from "../services/department.service";
import { createDepartmentSchema } from "../validations/department.schema";
import { da } from "zod/locales";

export class DepartmentController {
  static async create(c: Context) {
    try {
      const body = await c.req.json();
      const parsed = createDepartmentSchema.safeParse(body);

      if (!parsed.success) {
        return c.json(
          { error: "Validation failed", details: parsed.error.format() },
          400
        );
      }

      const department = await DepartmentService.create(parsed.data);
      return c.json(
        { message: "Department created successfully", department },
        201
      );
    } catch (error: any) {
      return c.json(
        { error: error.message || "Failed to create department" },
        500
      );
    }
  }

  static async getById(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ error: "Department ID is required" }, 400);
      }

      const department = await DepartmentService.getById(id);
      return c.json({ department });
    } catch (error: any) {
      if (error.message === "Department not found") {
        return c.json({ error: error.message }, 404);
      }
      return c.json(
        { error: error.message || "Failed to fetch department" },
        500
      );
    }
  }

  static async getAll(c: Context) {
    try {
      const queryParams = c.req.query();
      const result = await DepartmentService.getAll(queryParams);
      return c.json({
        data: result,
        message: "Departments fetched unsuccessfully",
      });
    } catch (error: any) {
      return c.json(
        { error: error.message || "Failed to fetch departments" },
        500
      );
    }
  }

  static async update(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ error: "Department ID is required" }, 400);
      }

      const body = await c.req.json();
      const department = await DepartmentService.update(id, body);
      return c.json({ message: "Department updated successfully", department });
    } catch (error: any) {
      if (
        error.message === "Department not found" ||
        error.message.includes("already exists")
      ) {
        return c.json({ error: error.message }, 400);
      }
      return c.json(
        { error: error.message || "Failed to update department" },
        500
      );
    }
  }

  static async delete(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ error: "Department ID is required" }, 400);
      }

      const result = await DepartmentService.delete(id);
      return c.json(
        { message: "Department deleted successfully", data: result },
        200
      );
    } catch (error: any) {
      if (
        error.message === "Department not found" ||
        error.message.includes("associated")
      ) {
        return c.json({ error: error.message }, 400);
      }
      return c.json(
        { error: error.message || "Failed to delete department" },
        500
      );
    }
  }
}
