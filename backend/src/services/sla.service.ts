import { PrismaClient, TicketStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type {
  CreateSLADefinitionRequest,
  UpdateSLADefinitionRequest,
  CreateSLAEscalationRequest,
  UpdateSLAEscalationRequest,
  QuerySLARequest,
} from "../interfaces/sla.interface";

const prisma = new PrismaClient();

export class SLAService {
  // ========== SLA Definition Methods ==========

  static async createSLADefinition(data: CreateSLADefinitionRequest) {
    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });

    if (!department) {
      throw new Error("Department not found");
    }

    // Check if SLA definition already exists for this department and status
    const existing = await prisma.departmentSLADefinition.findUnique({
      where: {
        departmentId_status: {
          departmentId: data.departmentId,
          status: TicketStatus[data.status as keyof typeof TicketStatus],
        },
      },
    });

    if (existing) {
      throw new Error(`SLA definition already exists for this department and status`);
    }

    const slaDefinition = await prisma.departmentSLADefinition.create({
      data: {
        departmentId: data.departmentId,
        status: TicketStatus[data.status as keyof typeof TicketStatus],
        timeLimit: data.timeLimit, // Store as seconds
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      id: slaDefinition.id,
      departmentId: slaDefinition.departmentId,
      status: slaDefinition.status,
      timeLimit: slaDefinition.timeLimit,
      isActive: true, // Default to active (isActive field not in schema yet)
      createdAt: slaDefinition.createdAt,
      updatedAt: slaDefinition.updatedAt,
      department: slaDefinition.department,
    };
  }

  static async getSLADefinitionById(id: string) {
    const slaDefinition = await prisma.departmentSLADefinition.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!slaDefinition) {
      throw new Error("SLA definition not found");
    }

    return {
      id: slaDefinition.id,
      departmentId: slaDefinition.departmentId,
      status: slaDefinition.status,
      timeLimit: slaDefinition.timeLimit,
      isActive: true, // Default to active (isActive field not in schema yet)
      createdAt: slaDefinition.createdAt,
      updatedAt: slaDefinition.updatedAt,
      department: slaDefinition.department,
    };
  }

  static async getAllSLADefinitions(query: QuerySLARequest) {
    const page = typeof query.page === 'string' ? parseInt(query.page, 10) : (query.page || 1);
    const limit = typeof query.limit === 'string' ? parseInt(query.limit, 10) : (query.limit || 10);
    const { departmentId, status } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.DepartmentSLADefinitionWhereInput = {};

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (status) {
      where.status = TicketStatus[status as keyof typeof TicketStatus];
    }

    const [slaDefinitions, total] = await Promise.all([
      prisma.departmentSLADefinition.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.departmentSLADefinition.count({ where }),
    ]);

    const formattedDefinitions = slaDefinitions.map((def) => {
      return {
        id: def.id,
        departmentId: def.departmentId,
        status: def.status,
        timeLimit: def.timeLimit,
        isActive: true, // Default to active (isActive field not in schema yet)
        createdAt: def.createdAt,
        updatedAt: def.updatedAt,
        department: def.department,
      };
    });

    return {
      slaDefinitions: formattedDefinitions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async updateSLADefinition(id: string, data: UpdateSLADefinitionRequest) {
    const existing = await prisma.departmentSLADefinition.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("SLA definition not found");
    }

    const updateData: Prisma.DepartmentSLADefinitionUpdateInput = {};

    if (data.status !== undefined) {
      updateData.status = TicketStatus[data.status as keyof typeof TicketStatus];
    }

    if (data.timeLimit !== undefined) {
      updateData.timeLimit = data.timeLimit;
    }

    const updated = await prisma.departmentSLADefinition.update({
      where: { id },
      data: updateData,
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      departmentId: updated.departmentId,
      status: updated.status,
      timeLimit: updated.timeLimit,
      isActive: true, // Default to active (isActive field not in schema yet)
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      department: updated.department,
    };
  }

  static async deleteSLADefinition(id: string) {
    const existing = await prisma.departmentSLADefinition.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("SLA definition not found");
    }

    await prisma.departmentSLADefinition.delete({
      where: { id },
    });

    return { message: "SLA definition deleted successfully" };
  }

  // ========== SLA Escalation Methods ==========

  static async createSLAEscalation(data: CreateSLAEscalationRequest) {
    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });

    if (!department) {
      throw new Error("Department not found");
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: data.responsibleUserId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Check if escalation already exists for this department and status
    const existing = await prisma.departmentSLAEscalation.findUnique({
      where: {
        departmentId_status: {
          departmentId: data.departmentId,
          status: TicketStatus[data.status as keyof typeof TicketStatus],
        },
      },
    });

    if (existing) {
      throw new Error(`SLA escalation already exists for this department and status`);
    }

    const escalation = await prisma.departmentSLAEscalation.create({
      data: {
        departmentId: data.departmentId,
        status: TicketStatus[data.status as keyof typeof TicketStatus],
        responsibleUserId: data.responsibleUserId,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        responsibleUser: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return {
      id: escalation.id,
      departmentId: escalation.departmentId,
      status: escalation.status,
      responsibleUserId: escalation.responsibleUserId,
      isActive: true, // Default to active (isActive field not in schema yet)
      createdAt: escalation.createdAt,
      updatedAt: escalation.updatedAt,
      department: escalation.department,
      responsibleUser: escalation.responsibleUser,
    };
  }

  static async getSLAEscalationById(id: string) {
    const escalation = await prisma.departmentSLAEscalation.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        responsibleUser: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!escalation) {
      throw new Error("SLA escalation not found");
    }

    return {
      id: escalation.id,
      departmentId: escalation.departmentId,
      status: escalation.status,
      responsibleUserId: escalation.responsibleUserId,
      isActive: true, // Default to active (isActive field not in schema yet)
      createdAt: escalation.createdAt,
      updatedAt: escalation.updatedAt,
      department: escalation.department,
      responsibleUser: escalation.responsibleUser,
    };
  }

  static async getAllSLAEscalations(query: QuerySLARequest) {
    const page = typeof query.page === 'string' ? parseInt(query.page, 10) : (query.page || 1);
    const limit = typeof query.limit === 'string' ? parseInt(query.limit, 10) : (query.limit || 10);
    const { departmentId, status } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.DepartmentSLAEscalationWhereInput = {};

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (status) {
      where.status = TicketStatus[status as keyof typeof TicketStatus];
    }

    const [escalations, total] = await Promise.all([
      prisma.departmentSLAEscalation.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          responsibleUser: {
            select: {
              id: true,
              username: true,
              fullName: true,
              email: true,
            },
          },
        },
      }),
      prisma.departmentSLAEscalation.count({ where }),
    ]);

    const formattedEscalations = escalations.map((esc) => ({
      ...esc,
      isActive: true, // Default to active (isActive field not in schema yet)
    }));

    return {
      escalations: formattedEscalations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async updateSLAEscalation(id: string, data: UpdateSLAEscalationRequest) {
    const existing = await prisma.departmentSLAEscalation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("SLA escalation not found");
    }

    if (data.responsibleUserId) {
      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: data.responsibleUserId },
      });

      if (!user) {
        throw new Error("User not found");
      }
    }

    const updateData: Prisma.DepartmentSLAEscalationUncheckedUpdateInput = {};

    if (data.status !== undefined) {
      updateData.status = TicketStatus[data.status as keyof typeof TicketStatus];
    }

    if (data.responsibleUserId !== undefined) {
      updateData.responsibleUserId = data.responsibleUserId;
    }

    const updated = await prisma.departmentSLAEscalation.update({
      where: { id },
      data: updateData,
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        responsibleUser: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      departmentId: updated.departmentId,
      status: updated.status,
      responsibleUserId: updated.responsibleUserId,
      isActive: true, // Default to active (isActive field not in schema yet)
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      department: updated.department,
      responsibleUser: updated.responsibleUser,
    };
  }

  static async deleteSLAEscalation(id: string) {
    const existing = await prisma.departmentSLAEscalation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("SLA escalation not found");
    }

    await prisma.departmentSLAEscalation.delete({
      where: { id },
    });

    return { message: "SLA escalation deleted successfully" };
  }

  // ========== SLA Violation Checking Logic ==========

  /**
   * Check if a ticket has violated its SLA and update accordingly
   * This should be called when ticket status changes or periodically
   */
  static async checkAndUpdateSLAViolation(ticketId: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        department: {
          include: {
            slas: true,
          },
        },
      },
    });

    if (!ticket || ticket.is_deleted) {
      return;
    }

    // Find SLA definition for this department and status
    const slaDefinition = await prisma.departmentSLADefinition.findUnique({
      where: {
        departmentId_status: {
          departmentId: ticket.departmentId,
          status: ticket.status,
        },
      },
    });

    if (!slaDefinition) {
      // No SLA defined for this status, clear violation if exists
      if (ticket.isInViolation) {
        await prisma.ticket.update({
          where: { id: ticketId },
          data: { isInViolation: false },
        });
      }
      return;
    }

    // Calculate deadline based on when ticket entered this status
    let statusStartTime: Date;
    if (ticket.status === TicketStatus.UN_ASSIGNED) {
      // For UN_ASSIGNED, use ticket creation time (AssignedAt is set on creation)
      statusStartTime = ticket.AssignedAt;
    } else if (ticket.status === TicketStatus.ASSIGNED) {
      statusStartTime = ticket.AssignedAt;
    } else if (ticket.status === TicketStatus.RESPONDED) {
      // For RESPONDED, use updatedAt when status changed to RESPONDED
      // We track this by checking when status was last updated to RESPONDED
      statusStartTime = ticket.updatedAt;
    } else {
      // RESOLVED status doesn't need SLA checking - clear violation if exists
      if (ticket.isInViolation) {
        await prisma.ticket.update({
          where: { id: ticketId },
          data: { isInViolation: false },
        });
      }
      return;
    }

    // Calculate deadline (timeLimit is stored as seconds)
    const deadline = new Date(statusStartTime.getTime() + slaDefinition.timeLimit * 1000);
    const now = new Date();

    // Update SLA deadline if not set or if status changed
    if (!ticket.slaDeadline || ticket.slaDeadline.getTime() !== deadline.getTime()) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { slaDeadline: deadline },
      });
    }

    // Check if SLA is violated
    // Use >= instead of > to handle edge cases where deadline exactly matches
    const isViolated = now.getTime() >= deadline.getTime();
    
    if (isViolated) {
      if (!ticket.isInViolation) {
        // Mark as violated
        await prisma.ticket.update({
          where: { id: ticketId },
          data: { isInViolation: true },
        });

        // Trigger escalation
        await this.triggerEscalation(ticketId, ticket.departmentId, ticket.status);
      }
    } else {
      // SLA is not violated - clear violation if it exists
      if (ticket.isInViolation) {
        await prisma.ticket.update({
          where: { id: ticketId },
          data: { isInViolation: false },
        });
      }
    }
  }

  /**
   * Check all tickets for SLA violations (background job)
   * This should be called periodically (e.g., every minute)
   */
  static async checkAllTicketsForViolations() {
    // Get all tickets that are not deleted and not resolved
    const tickets = await prisma.ticket.findMany({
      where: {
        is_deleted: false,
        status: {
          in: [TicketStatus.UN_ASSIGNED, TicketStatus.ASSIGNED, TicketStatus.RESPONDED],
        },
      },
      select: {
        id: true,
      },
    });

    // Check each ticket for violations
    for (const ticket of tickets) {
      await this.checkAndUpdateSLAViolation(ticket.id);
    }

    return { checked: tickets.length };
  }

  /**
   * Trigger escalation when SLA is violated
   */
  static async triggerEscalation(ticketId: string, departmentId: string, status: TicketStatus) {
    // Find escalation setting for this department and status
    const escalation = await prisma.departmentSLAEscalation.findUnique({
      where: {
        departmentId_status: {
          departmentId,
          status,
        },
      },
      include: {
        responsibleUser: true,
      },
    });

    if (!escalation) {
      // No escalation configured, just log it
      console.log(`SLA violation detected for ticket ${ticketId}, but no escalation configured`);
      return;
    }

    // Here you would typically:
    // 1. Send notification to responsible user
    // 2. Create escalation record
    // 3. Update ticket with escalation info
    // For now, we'll just log it
    console.log(`SLA violation escalated for ticket ${ticketId} to user ${escalation.responsibleUser.username}`);

    // TODO: Implement notification system
    // TODO: Create escalation history record
    // TODO: Send email/notification to responsible user
  }

  /**
   * Calculate and set SLA deadline when ticket status changes
   */
  static async setSLADeadline(ticketId: string, departmentId: string, status: TicketStatus, statusStartTime: Date) {
    const slaDefinition = await prisma.departmentSLADefinition.findUnique({
      where: {
        departmentId_status: {
          departmentId,
          status,
        },
      },
    });

    if (!slaDefinition) {
      return; // No SLA defined for this status
    }

    // Calculate deadline (timeLimit is stored as seconds)
    const deadline = new Date(statusStartTime.getTime() + slaDefinition.timeLimit * 1000);

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { slaDeadline: deadline },
    });
  }
}

