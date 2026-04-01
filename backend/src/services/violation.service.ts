import { PrismaClient, TicketStatus, Priority } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type { QueryViolationRequest } from "../interfaces/violation.interface";

const prisma = new PrismaClient();

export class ViolationService {
  /**
   * Get violations for the current user
   * - For ADMIN: Returns violations where they are the escalation responsible user
   * - For USER: Returns violations for tickets assigned to them
   */
  static async getMyViolations(userId: string, userRole: string, query: QueryViolationRequest) {
    // Convert string query params to numbers
    const page = typeof query.page === 'string' ? parseInt(query.page, 10) : (query.page || 1);
    const limit = typeof query.limit === 'string' ? parseInt(query.limit, 10) : (query.limit || 10);
    const { status, priority, departmentId, search } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.TicketWhereInput = {
      is_deleted: false,
      isInViolation: true, // Only show violations
    };

    if (userRole === "ADMIN") {
      // Admin sees violations where they are the escalation responsible user
      // We need to find tickets where the escalation responsible user matches
      // First, get all escalations where this user is responsible
      const escalations = await prisma.departmentSLAEscalation.findMany({
        where: {
          responsibleUserId: userId,
        },
        select: {
          departmentId: true,
          status: true,
        },
      });

      if (escalations.length === 0) {
        // No escalations for this admin, return empty result
        return {
          violations: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        };
      }

      // Build OR conditions for each escalation
      // Each condition must match both departmentId AND status
      where.OR = escalations.map((esc) => ({
        AND: [
          { departmentId: esc.departmentId },
          { status: esc.status },
        ],
      }));
    } else {
      // User sees violations for tickets assigned to them
      where.assignedTo = userId;
    }

    // Handle additional filters
    const additionalFilters: Prisma.TicketWhereInput = {};

    if (status) {
      additionalFilters.status = TicketStatus[status as keyof typeof TicketStatus];
    }

    if (priority) {
      additionalFilters.priority = Priority[priority as keyof typeof Priority];
    }

    if (departmentId) {
      additionalFilters.departmentId = departmentId;
    }

    if (search) {
      additionalFilters.OR = [
        { description: { contains: search } },
        {
          grievance: {
            OR: [
              { name: { contains: search } },
              { report_id: { contains: search } },
              { subject: { contains: search } },
            ],
          },
        },
      ];
    }

    // Combine escalation conditions with additional filters
    if (where.OR && Array.isArray(where.OR)) {
      // Admin case: combine escalation OR with additional filters using AND
      where.AND = [
        { OR: where.OR },
        ...Object.keys(additionalFilters).length > 0 ? [additionalFilters] : [],
      ];
      delete where.OR;
    } else {
      // User case: merge additional filters directly
      Object.assign(where, additionalFilters);
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          slaDeadline: "asc", // Order by deadline (earliest first)
        },
        include: {
          grievance: {
            select: {
              id: true,
              report_id: true,
              subject: true,
              created_at: true,
            },
          },
          assignedUser: {
            select: {
              id: true,
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
      }),
      prisma.ticket.count({ where }),
    ]);

    // Get escalation responsible user for each violation
    const violationsWithEscalation = await Promise.all(
      tickets.map(async (ticket) => {
        // Find escalation setting for this ticket's department and status
        const escalation = await prisma.departmentSLAEscalation.findUnique({
          where: {
            departmentId_status: {
              departmentId: ticket.departmentId,
              status: ticket.status,
            },
          },
          include: {
            responsibleUser: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        });

        return {
          id: ticket.id,
          ticketId: ticket.id,
          status: ticket.status,
          priority: ticket.priority,
          department: ticket.department,
          assignedUser: ticket.assignedUser,
          escalationUser: escalation?.responsibleUser || null,
          slaDeadline: ticket.slaDeadline!,
          isInViolation: ticket.isInViolation,
          grievance: ticket.grievance,
          createdAt: ticket.AssignedAt, // Use AssignedAt as creation time
          updatedAt: ticket.updatedAt,
        };
      })
    );

    return {
      violations: violationsWithEscalation,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all violations (Team Violations - Admin only)
   * Shows all violations in the system
   */
  static async getTeamViolations(query: QueryViolationRequest) {
    // Convert string query params to numbers
    const page = typeof query.page === 'string' ? parseInt(query.page, 10) : (query.page || 1);
    const limit = typeof query.limit === 'string' ? parseInt(query.limit, 10) : (query.limit || 10);
    const { status, priority, departmentId, assignedTo, search } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.TicketWhereInput = {
      is_deleted: false,
      isInViolation: true, // Only show violations
    };

    if (status) {
      where.status = TicketStatus[status as keyof typeof TicketStatus];
    }

    if (priority) {
      where.priority = Priority[priority as keyof typeof Priority];
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        {
          grievance: {
            OR: [
              { name: { contains: search } },
              { report_id: { contains: search } },
              { subject: { contains: search } },
            ],
          },
        },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          slaDeadline: "asc", // Order by deadline (earliest first)
        },
        include: {
          grievance: {
            select: {
              id: true,
              report_id: true,
              subject: true,
              created_at: true,
            },
          },
          assignedUser: {
            select: {
              id: true,
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
      }),
      prisma.ticket.count({ where }),
    ]);

    // Get escalation responsible user for each violation
    const violationsWithEscalation = await Promise.all(
      tickets.map(async (ticket) => {
        // Find escalation setting for this ticket's department and status
        const escalation = await prisma.departmentSLAEscalation.findUnique({
          where: {
            departmentId_status: {
              departmentId: ticket.departmentId,
              status: ticket.status,
            },
          },
          include: {
            responsibleUser: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        });

        return {
          id: ticket.id,
          ticketId: ticket.id,
          status: ticket.status,
          priority: ticket.priority,
          department: ticket.department,
          assignedUser: ticket.assignedUser,
          escalationUser: escalation?.responsibleUser || null,
          slaDeadline: ticket.slaDeadline!,
          isInViolation: ticket.isInViolation,
          grievance: ticket.grievance,
          createdAt: ticket.AssignedAt, // Use AssignedAt as creation time
          updatedAt: ticket.updatedAt,
        };
      })
    );

    return {
      violations: violationsWithEscalation,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get violation statistics
   */
  static async getViolationStats(userId?: string, userRole?: string) {
    const where: Prisma.TicketWhereInput = {
      is_deleted: false,
      isInViolation: true,
    };

    if (userRole === "ADMIN" && userId) {
      // Admin sees violations where they are escalation responsible
      where.department = {
        escalations: {
          some: {
            responsibleUserId: userId,
          },
        },
      };
    } else if (userRole === "USER" && userId) {
      // User sees violations for their assigned tickets
      where.assignedTo = userId;
    }

    const total = await prisma.ticket.count({ where });

    return {
      total,
    };
  }
}

