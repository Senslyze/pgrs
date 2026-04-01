import type { Context } from "hono";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { GrievanceService } from "../services/grievance.service";
import { createGrievanceSchema } from "../validations/grievance.schema";

const prisma = new PrismaClient();

export class GrievanceController {
  static async create(c: Context) {
    try {
      const body = await c.req.json();
      const parsed = createGrievanceSchema.safeParse(body);

      if (!parsed.success) {
        return c.json({ error: "Validation failed", details: parsed.error.format() }, 400);
      }

      const grievance = await GrievanceService.create(parsed.data);
      return c.json({ message: "Grievance created successfully", grievance }, 201);
    } catch (error: any) {
      return c.json({ error: error.message || "Failed to create grievance" }, 500);
    }
  }

  static async getById(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ error: "Grievance ID is required" }, 400);
      }

      const grievance = await GrievanceService.getById(id);
      return c.json({ grievance });
    } catch (error: any) {
      if (error.message === "Grievance not found") {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message || "Failed to fetch grievance" }, 500);
    }
  }

  static async getByReportId(c: Context) {
    try {
      const reportId = c.req.param("reportId");
      if (!reportId) {
        return c.json({ error: "Report ID is required" }, 400);
      }

      const grievance = await GrievanceService.getByReportId(reportId);
      return c.json({ grievance });
    } catch (error: any) {
      if (error.message === "Grievance not found") {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message || "Failed to fetch grievance" }, 500);
    }
  }

  static async getAll(c: Context) {
    try {
      const user = c.get("user");
      const queryParams = c.req.query();
      
      // Get user's department and role for filtering
      let userDepartmentId: string | null = null;
      let userRole: string | null = null;
      let userId: string | null = null;
      
      if (user && user.userId) {
        // Fetch user details to get departmentId and role
        const userDetails = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { departmentId: true, role: true },
        });
        
        if (userDetails) {
          userDepartmentId = userDetails.departmentId;
          userRole = userDetails.role;
        }
      }
      
      const result = await GrievanceService.getAll(queryParams, userDepartmentId, userRole);
      return c.json({data: result});
    } catch (error: any) {
      return c.json({ error: error.message || "Failed to fetch grievances" }, 500);
    }
  }

  static async update(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ error: "Grievance ID is required" }, 400);
      }

      const body = await c.req.json();
      const grievance = await GrievanceService.update(id, body);
      return c.json({ message: "Grievance updated successfully", grievance });
    } catch (error: any) {
      if (error.message === "Grievance not found") {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message || "Failed to update grievance" }, 500);
    }
  }

  static async delete(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ error: "Grievance ID is required" }, 400);
      }

      await GrievanceService.delete(id);
      return c.json({ message: "Grievance deleted successfully" });
    } catch (error: any) {
      if (error.message === "Grievance not found") {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message || "Failed to delete grievance" }, 500);
    }
  }

  static async getStatsSummary(c: Context) {
    try {
      const user = c.get("user");
      let userDepartmentId: string | null = null;
      let userRole: string | null = null;
      
      if (user && user.userId) {
        const userDetails = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { departmentId: true, role: true },
        });
        
        if (userDetails) {
          userDepartmentId = userDetails.departmentId;
          userRole = userDetails.role;
        }
      }

      const stats = await GrievanceService.getStatsSummary(userDepartmentId, userRole);
      return c.json(stats);
    } catch (error: any) {
      return c.json({ error: error.message || "Failed to fetch grievance statistics" }, 500);
    }
  }

  static async search(c: Context) {
    try {
      const user = c.get("user");
      const queryParams = c.req.query();
      
      let userDepartmentId: string | null = null;
      let userRole: string | null = null;
      
      if (user && user.userId) {
        const userDetails = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { departmentId: true, role: true },
        });
        
        if (userDetails) {
          userDepartmentId = userDetails.departmentId;
          userRole = userDetails.role;
        }
      }

      const result = await GrievanceService.search(queryParams, userDepartmentId, userRole);
      return c.json({data: result});
    } catch (error: any) {
      return c.json({ error: error.message || "Failed to search grievances" }, 500);
    }
  }

  static async updateStatus(c: Context) {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ error: "Grievance ID is required" }, 400);
      }

      const body = await c.req.json();
      const { status, comment } = body;

      if (!status) {
        return c.json({ error: "Status is required" }, 400);
      }

      const grievance = await GrievanceService.updateStatus(id, status, comment);
      return c.json({ message: "Grievance status updated successfully", grievance });
    } catch (error: any) {
      if (error.message === "Grievance not found") {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: error.message || "Failed to update grievance status" }, 500);
    }
  }

  /**
   * Download media securely from WhatsApp API
   * POST /api/grievances/download/:mediaId
   */
  static async downloadMedia(c: Context) {
    try {
      const mediaId = c.req.param("mediaId");
      if (!mediaId) {
        return c.json({ success: false, error: "Media ID is required" }, 400);
      }

      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const apiKey = process.env.PINBOT_API_KEY;

      if (!phoneNumberId || !apiKey) {
        return c.json({ success: false, error: "WhatsApp API configuration missing" }, 500);
      }

      // Download media from Pinbot API
      const response = await axios.post(
        `https://partnersv1.pinbot.ai/v3/downloadMedia/${mediaId}?phone_number_id=${phoneNumberId}`,
        {}, // Empty body for POST request
        {
          headers: {
            apikey: apiKey,
          },
          responseType: "arraybuffer",
        }
      );

      // Get content type from response or default to application/octet-stream
      const contentType = response.headers["content-type"] || "application/octet-stream";

      // Return binary data with appropriate content type
      return c.body(response.data, 200, {
        "Content-Type": contentType,
      });
    } catch (error: any) {
      console.error("Error downloading media:", error.response?.data || error.message);
      return c.json(
        { success: false, error: "Failed to download media" },
        500
      );
    }
  }
}

