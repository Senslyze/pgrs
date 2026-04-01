import { PrismaClient, Priority, GrievanceStatus, TicketStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type { CreateGrievanceRequest, UpdateGrievanceRequest, QueryGrievanceRequest } from "../interfaces/grievance.interface";
import { SLAService } from "./sla.service";

const prisma = new PrismaClient();

export class GrievanceService {
  static async create(data: CreateGrievanceRequest) {
    // Check if report_id already exists
    const existing = await prisma.grievance.findUnique({
      where: { report_id: data.report_id },
    });

    if (existing) {
      throw new Error("Grievance with this report_id already exists");
    }

    // Find department by name to get departmentId for ticket creation
    const department = await prisma.department.findFirst({
      where: {
        name: data.department,
      },
    });

    if (!department) {
      throw new Error(`Department "${data.department}" not found. Please create the department first.`);
    }

    // Validate userId if provided
    if (data.userId) {
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        throw new Error(`User with ID "${data.userId}" not found. Please provide a valid user ID or omit userId field.`);
      }
    }

    // Create grievance with status OPEN
    const grievance = await prisma.grievance.create({
      data: {
        report_id: data.report_id,
        name: data.name,
        phone_number: data.phone_number,
        age: data.age,
        gender: data.gender,
        department: data.department,
        subject: data.subject,
        sub_subject: data.sub_subject,
        grievance_address: data.grievance_address,
        remark: data.remark,
        latitude: data.latitude,
        longitude: data.longitude,
        location_name: data.location_name,
        location_address: data.location_address,
        media_id: data.media_id,
        image_url: data.image_url,
        download_url: data.download_url,
        ai_priority: Priority[data.ai_priority as keyof typeof Priority],
        ai_confidence: data.ai_confidence,
        is_image_validated: data.is_image_validated,
        status: GrievanceStatus.OPEN, // Always set to OPEN when created
        userId: data.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Automatically create a ticket for the grievance with status UN_ASSIGNED
    const ticket = await prisma.ticket.create({
      data: {
        grievanceId: grievance.id,
        description: `Ticket created automatically for grievance: ${data.report_id}`,
        priority: Priority[data.ai_priority as keyof typeof Priority],
        departmentId: department.id,
        createdUserId: data.userId || null,
        status: TicketStatus.UN_ASSIGNED, // Initial status is UN_ASSIGNED
        AssignedAt: new Date(), // Set creation time for SLA tracking
      },
    });

    // Set SLA deadline for UN_ASSIGNED status if SLA definition exists
    await SLAService.setSLADeadline(
      ticket.id,
      department.id,
      TicketStatus.UN_ASSIGNED,
      ticket.AssignedAt
    );

    // Check for immediate violation (in case deadline has already passed)
    await SLAService.checkAndUpdateSLAViolation(ticket.id);

    // Fetch the grievance again with the ticket included
    const grievanceWithTicket = await prisma.grievance.findUnique({
      where: { id: grievance.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
        ticket: {
          include: {
            assignedUser: {
              select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
                subject: true,
                subSubject: true,
              },
            },
            createdUser: {
              select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const result = grievanceWithTicket || grievance;
    // Add download_url if media_id exists
    if (result && (result as any).media_id) {
      (result as any).download_url = `/api/grievances/download/${(result as any).media_id}`;
    } else if (result) {
      (result as any).download_url = null;
    }
    return result;
  }

  static async getById(id: string) {
    const grievance = await prisma.grievance.findFirst({
      where: {
        id,
        is_deleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
        ticket: {
          include: {
            assignedUser: {
              select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!grievance) {
      throw new Error("Grievance not found");
    }

    // Add download_url if media_id exists
    (grievance as any).download_url = grievance.media_id ? `/api/grievances/download/${grievance.media_id}` : null;

    return grievance;
  }

  static async getByReportId(reportId: string) {
    const grievance = await prisma.grievance.findFirst({
      where: {
        report_id: reportId,
        is_deleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
        ticket: {
          include: {
            assignedUser: {
              select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!grievance) {
      throw new Error("Grievance not found");
    }

    // Add download_url if media_id exists
    (grievance as any).download_url = grievance.media_id ? `/api/grievances/download/${grievance.media_id}` : null;

    return grievance;
  }

  static async getAll(query: QueryGrievanceRequest, userDepartmentId?: string | null, userRole?: string | null) {
    // Convert string query params to numbers
    const page = typeof query.page === 'string' ? parseInt(query.page, 10) : (query.page || 1);
    const limit = typeof query.limit === 'string' ? parseInt(query.limit, 10) : (query.limit || 10);
    const { status, department, priority, userId, search } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.GrievanceWhereInput = {
      is_deleted: false,
    };

    // If user is not admin and has a department, filter grievances by their department
    if (userRole !== "ADMIN" && userDepartmentId) {
      // Find the department name from the departmentId
      const userDepartment = await prisma.department.findUnique({
        where: { id: userDepartmentId },
        select: { name: true },
      });

      if (userDepartment) {
        where.department = userDepartment.name;
      }
    } else if (department) {
      // If admin explicitly filters by department
      where.department = {
        contains: department,
      };
    }

    if (status) {
      where.status = GrievanceStatus[status as keyof typeof GrievanceStatus];
    }

    if (priority) {
      where.ai_priority = Priority[priority as keyof typeof Priority];
    }

    if (userId) {
      where.userId = userId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { report_id: { contains: search } },
        { subject: { contains: search } },
        { sub_subject: { contains: search } },
        { grievance_address: { contains: search } },
      ];
    }

    const [grievances, total] = await Promise.all([
      prisma.grievance.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          created_at: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              email: true,
            },
          },
          ticket: {
            include: {
              assignedUser: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  email: true,
                },
              },
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.grievance.count({ where }),
    ]);

    return {
      grievances,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async update(id: string, data: UpdateGrievanceRequest) {
    // Check if grievance exists
    const existing = await prisma.grievance.findFirst({
      where: {
        id,
        is_deleted: false,
      },
    });

    if (!existing) {
      throw new Error("Grievance not found");
    }


    const updateData: Prisma.GrievanceUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone_number !== undefined) updateData.phone_number = data.phone_number;
    if (data.age !== undefined) updateData.age = data.age;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.sub_subject !== undefined) updateData.sub_subject = data.sub_subject;
    if (data.grievance_address !== undefined) updateData.grievance_address = data.grievance_address;
    if (data.remark !== undefined) updateData.remark = data.remark;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.location_name !== undefined) updateData.location_name = data.location_name;
    if (data.location_address !== undefined) updateData.location_address = data.location_address;
    if (data.media_id !== undefined) updateData.media_id = data.media_id;
    if (data.image_url !== undefined) updateData.image_url = data.image_url;
    if (data.download_url !== undefined) updateData.download_url = data.download_url;
    if (data.ai_priority !== undefined) {
      updateData.ai_priority = Priority[data.ai_priority as keyof typeof Priority];
    }
    if (data.ai_confidence !== undefined) updateData.ai_confidence = data.ai_confidence;
    if (data.is_image_validated !== undefined) updateData.is_image_validated = data.is_image_validated;
    if (data.status !== undefined) {
      updateData.status = GrievanceStatus[data.status as keyof typeof GrievanceStatus];
    }
    const grievance = await prisma.grievance.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Add download_url if media_id exists
    (grievance as any).download_url = grievance.media_id ? `/api/grievances/download/${grievance.media_id}` : null;

    return grievance;
  }

  static async delete(id: string) {
    // Check if grievance exists
    const existing = await prisma.grievance.findFirst({
      where: {
        id,
        is_deleted: false,
      },
    });

    if (!existing) {
      throw new Error("Grievance not found");
    }

    // Soft delete
    const grievance = await prisma.grievance.update({
      where: { id },
      data: { is_deleted: true },
    });

    return grievance;
  }

  static async getStatsSummary(userDepartmentId?: string | null, userRole?: string | null) {
    const where: Prisma.GrievanceWhereInput = {
      is_deleted: false,
    };

    // If user is not admin and has a department, filter grievances by their department
    if (userRole !== "ADMIN" && userDepartmentId) {
      const userDepartment = await prisma.department.findUnique({
        where: { id: userDepartmentId },
        select: { name: true },
      });

      if (userDepartment) {
        where.department = userDepartment.name;
      }
    }

    const [total, open, inProgress, closed] = await Promise.all([
      prisma.grievance.count({ where }),
      prisma.grievance.count({ where: { ...where, status: GrievanceStatus.OPEN } }),
      prisma.grievance.count({ where: { ...where, status: GrievanceStatus.IN_PROGRESS } }),
      prisma.grievance.count({ where: { ...where, status: GrievanceStatus.CLOSED } }),
    ]);

    return {
      total,
      open,
      inProgress,
      closed,
    };
  }

  static async search(query: Record<string, string | number | undefined>, userDepartmentId?: string | null, userRole?: string | null) {
    const page = typeof query.page === 'string' ? parseInt(query.page, 10) : (query.page || 1);
    const limit = typeof query.limit === 'string' ? parseInt(query.limit, 10) : (query.limit || 10);
    const { type, value } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.GrievanceWhereInput = {
      is_deleted: false,
    };

    // If user is not admin and has a department, filter grievances by their department
    if (userRole !== "ADMIN" && userDepartmentId) {
      const userDepartment = await prisma.department.findUnique({
        where: { id: userDepartmentId },
        select: { name: true },
      });

      if (userDepartment) {
        where.department = userDepartment.name;
      }
    }

    // Search based on type
    if (type && value) {
      const searchValue = String(value); // Convert to string for Prisma contains filter
      switch (type) {
        case "report_id":
          where.report_id = { contains: searchValue };
          break;
        case "phone_number":
          where.phone_number = { contains: searchValue };
          break;
        case "aadhaar":
          // Note: aadhaar field doesn't exist in schema, might need to add it
          // For now, we'll skip this
          break;
        case "postal_code":
          // Note: postal_code field doesn't exist in schema, might need to add it
          // For now, we'll search in grievance_address
          where.grievance_address = { contains: searchValue };
          break;
        default:
          where.OR = [
            { report_id: { contains: searchValue } },
            { phone_number: { contains: searchValue } },
            { name: { contains: searchValue } },
          ];
      }
    }

    const [grievances, total] = await Promise.all([
      prisma.grievance.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          created_at: "desc",
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              email: true,
            },
          },
          ticket: {
            include: {
              assignedUser: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  email: true,
                },
              },
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.grievance.count({ where }),
    ]);

    // Map grievances to include download_url if media_id exists
    const grievancesWithDownload = grievances.map((grievance: any) => {
      grievance.download_url = grievance.media_id ? `/api/grievances/download/${grievance.media_id}` : null;
      return grievance;
    });

    return {
      grievances: grievancesWithDownload,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async updateStatus(id: string, status: string, comment?: string) {
    const existing = await prisma.grievance.findFirst({
      where: {
        id,
        is_deleted: false,
      },
    });

    if (!existing) {
      throw new Error("Grievance not found");
    }

    const grievance = await prisma.grievance.update({
      where: { id },
      data: {
        status: GrievanceStatus[status as keyof typeof GrievanceStatus],
        // Note: comment field doesn't exist in schema, might need to add a comments/notes table
        // For now, we'll just update the status
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
        ticket: {
          include: {
            assignedUser: {
              select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Add download_url if media_id exists
    (grievance as any).download_url = grievance.media_id ? `/api/grievances/download/${grievance.media_id}` : null;

    return grievance;
  }

  static async getMediaById(mediaId: string) {
    const grievance = await prisma.grievance.findFirst({
      where: {
        media_id: mediaId,
        is_deleted: false,
      },
      select: {
        id: true,
        media_id: true,
        image_url: true,
        download_url: true,
      },
    });

    return grievance;
  }
}

