import type { Context } from "hono";
import { PrismaClient } from "@prisma/client";
import { ViolationService } from "../services/violation.service";
import { SLAService } from "../services/sla.service";

const prisma = new PrismaClient();

export class ViolationController {
  /**
   * Get my violations
   * - For ADMIN: Returns violations where they are escalation responsible
   * - For USER: Returns violations for tickets assigned to them
   */
  static async getMyViolations(c: Context) {
    try {
      const user = c.get("user");
      if (!user || !user.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get user role
      const userDetails = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { role: true },
      });

      if (!userDetails) {
        return c.json({ error: "User not found" }, 404);
      }

      // First, trigger a violation check to ensure violations are up-to-date
      // This ensures violations are detected even if background job hasn't run
      await SLAService.checkAllTicketsForViolations();

      const queryParams = c.req.query();
      const result = await ViolationService.getMyViolations(
        user.userId,
        userDetails.role,
        queryParams
      );

      return c.json({data:result});
    } catch (error: any) {
      return c.json({ error: error.message || "Failed to fetch my violations" }, 500);
    }
  }

  /**
   * Get team violations (all violations - Admin only)
   */
  static async getTeamViolations(c: Context) {
    try {
      const user = c.get("user");
      if (!user || !user.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get user role
      const userDetails = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { role: true },
      });

      if (!userDetails) {
        return c.json({ error: "User not found" }, 404);
      }

      // Only ADMIN can view team violations
      if (userDetails.role !== "ADMIN") {
        return c.json({ error: "Access denied. Admin only." }, 403);
      }

      // First, trigger a violation check to ensure violations are up-to-date
      await SLAService.checkAllTicketsForViolations();

      const queryParams = c.req.query();
      const result = await ViolationService.getTeamViolations(queryParams);

      return c.json({data: result});
    } catch (error: any) {
      return c.json({ error: error.message || "Failed to fetch team violations" }, 500);
    }
  }

  /**
   * Get violation statistics
   */
  static async getViolationStats(c: Context) {
    try {
      const user = c.get("user");
      if (!user || !user.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Get user role
      const userDetails = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { role: true },
      });

      if (!userDetails) {
        return c.json({ error: "User not found" }, 404);
      }

      const stats = await ViolationService.getViolationStats(
        user.userId,
        userDetails.role
      );

      return c.json({data:stats});
    } catch (error: any) {
      return c.json({ error: error.message || "Failed to fetch violation statistics" }, 500);
    }
  }
}

