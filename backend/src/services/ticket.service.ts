import { PrismaClient, Priority, TicketStatus, GrievanceStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type { CreateTicketRequest, UpdateTicketRequest, QueryTicketRequest, AssignTicketRequest } from "../interfaces/ticket.interface";
import { SLAService } from "./sla.service";

const prisma = new PrismaClient();

export class TicketService {
  static async create(data: CreateTicketRequest) {
    // Check if grievance exists
    const grievance = await prisma.grievance.findUnique({
      where: { id: data.grievanceId },
    });

    if (!grievance) {
      throw new Error("Grievance not found");
    }

    // Check if ticket already exists for this grievance
    const existing = await prisma.ticket.findUnique({
      where: { grievanceId: data.grievanceId },
    });

    if (existing) {
      throw new Error("Ticket already exists for this grievance");
    }

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });

    if (!department) {
      throw new Error("Department not found");
    }

    const ticket = await prisma.ticket.create({
      data: {
        grievanceId: data.grievanceId,
        description: data.description,
        priority: data.priority ? Priority[data.priority as keyof typeof Priority] : Priority.MEDIUM,
        departmentId: data.departmentId,
        createdUserId: data.createdUserId,
        status: TicketStatus.UN_ASSIGNED,
        AssignedAt: new Date(), // Set creation time for SLA tracking
      },
      include: {
        grievance: {
          select: {
            id: true,
            report_id: true,
            name: true,
            subject: true,
            sub_subject: true,
            status: true,
            created_at: true,
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
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
    });

    return ticket;
  }

  static async getById(id: string) {
    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        is_deleted: false,
      },
      include: {
        grievance: {
          select: {
            id: true,
            report_id: true,
            name: true,
            subject: true,
            sub_subject: true,
            status: true,
            created_at: true,
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
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
    });

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    return ticket;
  }

  static async getByGrievanceId(grievanceId: string) {
    const ticket = await prisma.ticket.findFirst({
      where: {
        grievanceId,
        is_deleted: false,
      },
      include: {
        grievance: {
          select: {
            id: true,
            report_id: true,
            name: true,
            subject: true,
            sub_subject: true,
            status: true,
            created_at: true,
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
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
    });

    if (!ticket) {
      throw new Error("Ticket not found for this grievance");
    }

    return ticket;
  }

  static async getAll(query: QueryTicketRequest) {
    // Convert string query params to numbers
    const page = typeof query.page === 'string' ? parseInt(query.page, 10) : (query.page || 1);
    const limit = typeof query.limit === 'string' ? parseInt(query.limit, 10) : (query.limit || 10);
    const { status, priority, departmentId, assignedTo, isInViolation, search } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.TicketWhereInput = {
      is_deleted: false,
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

    if (isInViolation !== undefined) {
      where.isInViolation = isInViolation;
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
          updatedAt: "desc",
        },
        include: {
          grievance: {
            select: {
              id: true,
              report_id: true,
              name: true,
              subject: true,
              sub_subject: true,
              status: true,
              created_at: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  email: true,
                },
              },
            },
          },
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
      }),
      prisma.ticket.count({ where }),
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getMyTickets(userId: string, query: QueryTicketRequest) {
    // Convert string query params to numbers
    const page = typeof query.page === 'string' ? parseInt(query.page, 10) : (query.page || 1);
    const limit = typeof query.limit === 'string' ? parseInt(query.limit, 10) : (query.limit || 10);
    const { status, priority, isInViolation, search } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.TicketWhereInput = {
      is_deleted: false,
      assignedTo: userId, // Only tickets assigned to this user
    };

    if (status) {
      where.status = TicketStatus[status as keyof typeof TicketStatus];
    }

    if (priority) {
      where.priority = Priority[priority as keyof typeof Priority];
    }

    if (isInViolation !== undefined) {
      where.isInViolation = isInViolation;
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
          updatedAt: "desc",
        },
        include: {
          grievance: {
            select: {
              id: true,
              report_id: true,
              name: true,
              subject: true,
              sub_subject: true,
              status: true,
              created_at: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  email: true,
                },
              },
            },
          },
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
      }),
      prisma.ticket.count({ where }),
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async update(id: string, data: UpdateTicketRequest) {
    // Check if ticket exists
    const existing = await prisma.ticket.findFirst({
      where: {
        id,
        is_deleted: false,
      },
    });

    if (!existing) {
      throw new Error("Ticket not found");
    }

    const updateData: Prisma.TicketUncheckedUpdateInput = {};

    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) {
      updateData.priority = Priority[data.priority as keyof typeof Priority];
    }
    if (data.departmentId !== undefined) {
      // Verify department exists
      const department = await prisma.department.findUnique({
        where: { id: data.departmentId },
      });
      if (!department) {
        throw new Error("Department not found");
      }
      updateData.departmentId = data.departmentId;
    }
    if (data.slaDeadline !== undefined) updateData.slaDeadline = data.slaDeadline;
    if (data.isInViolation !== undefined) updateData.isInViolation = data.isInViolation;
    if (data.resolvedAt !== undefined) updateData.resolvedAt = data.resolvedAt;

    // Handle status update
    let statusChanged = false;
    let newStatus: TicketStatus | undefined;
    if (data.status !== undefined) {
      newStatus = TicketStatus[data.status as keyof typeof TicketStatus];
      if (existing.status !== newStatus) {
        statusChanged = true;
        updateData.status = newStatus;
      }
    }

    // Handle assignment - if assignedTo is set and status is UN_ASSIGNED, change to ASSIGNED
    let assignmentChanged = false;
    if (data.assignedTo !== undefined) {
      if (data.assignedTo && !existing.assignedTo) {
        // Assigning ticket
        updateData.assignedTo = data.assignedTo;
        updateData.AssignedAt = new Date();
        if (existing.status === TicketStatus.UN_ASSIGNED) {
          updateData.status = TicketStatus.ASSIGNED;
          statusChanged = true;
          newStatus = TicketStatus.ASSIGNED;
        }
        assignmentChanged = true;
      } else if (!data.assignedTo && existing.assignedTo) {
        // Unassigning ticket
        updateData.assignedTo = null;
        assignmentChanged = true;
      } else if (data.assignedTo !== existing.assignedTo) {
        // Reassigning ticket
        updateData.assignedTo = data.assignedTo;
        updateData.AssignedAt = new Date();
        assignmentChanged = true;
      }
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        grievance: {
          select: {
            id: true,
            report_id: true,
            name: true,
            subject: true,
            sub_subject: true,
            status: true,
            created_at: true,
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
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
    });

    // Sync grievance status when ticket is assigned (UN_ASSIGNED → ASSIGNED)
    if (statusChanged && newStatus === TicketStatus.ASSIGNED && existing.status === TicketStatus.UN_ASSIGNED) {
      // Update grievance status from OPEN to IN_PROGRESS (only if grievance is currently OPEN)
      const grievance = await prisma.grievance.findUnique({
        where: { id: ticket.grievanceId },
      });

      if (grievance && grievance.status === GrievanceStatus.OPEN) {
        await prisma.grievance.update({
          where: { id: ticket.grievanceId },
          data: { status: GrievanceStatus.IN_PROGRESS },
        });
      }

      // Set SLA deadline when ticket is assigned
      if (ticket.status === TicketStatus.ASSIGNED) {
        await SLAService.setSLADeadline(
          ticket.id,
          ticket.departmentId,
          TicketStatus.ASSIGNED,
          ticket.AssignedAt
        );
      }
    }

    // Clear violation when status changes
    if (statusChanged && existing.isInViolation) {
      await prisma.ticket.update({
        where: { id },
        data: { isInViolation: false },
      });
    }

    // Set SLA deadline for new status and check violation
    if (statusChanged) {
      if (newStatus === TicketStatus.ASSIGNED) {
        await SLAService.setSLADeadline(
          id,
          ticket.departmentId,
          TicketStatus.ASSIGNED,
          ticket.AssignedAt || new Date()
        );
      } else if (newStatus === TicketStatus.RESPONDED) {
        await SLAService.setSLADeadline(
          id,
          ticket.departmentId,
          TicketStatus.RESPONDED,
          new Date()
        );
      }

      // Check SLA violation for new status
      await SLAService.checkAndUpdateSLAViolation(ticket.id);
    }

    return ticket;
  }

  static async assign(id: string, data: AssignTicketRequest) {
    // Check if ticket exists
    const existing = await prisma.ticket.findFirst({
      where: {
        id,
        is_deleted: false,
      },
    });

    if (!existing) {
      throw new Error("Ticket not found");
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: data.assignedTo },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Department is required when assigning
    if (!data.departmentId) {
      throw new Error("Department is required when assigning a ticket");
    }

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });

    if (!department) {
      throw new Error("Department not found");
    }

    // Verify that the user belongs to the selected department
    if (user.departmentId !== data.departmentId) {
      throw new Error("User does not belong to the selected department");
    }

    const updateData: Prisma.TicketUncheckedUpdateInput = {
      assignedTo: data.assignedTo,
      AssignedAt: new Date(),
      departmentId: data.departmentId, // Always update department when assigning
    };

    // If status is UN_ASSIGNED, change to ASSIGNED
    if (existing.status === TicketStatus.UN_ASSIGNED) {
      updateData.status = TicketStatus.ASSIGNED;
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        grievance: {
          select: {
            id: true,
            report_id: true,
            name: true,
            subject: true,
            sub_subject: true,
            status: true,
            created_at: true,
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
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
    });

    // Sync grievance status: OPEN → IN_PROGRESS when ticket is assigned
    if (existing.status === TicketStatus.UN_ASSIGNED) {
      const grievance = await prisma.grievance.findUnique({
        where: { id: ticket.grievanceId },
      });

      if (grievance && grievance.status === GrievanceStatus.OPEN) {
        await prisma.grievance.update({
          where: { id: ticket.grievanceId },
          data: { status: GrievanceStatus.IN_PROGRESS },
        });
      }

      // Set SLA deadline when ticket is assigned
      if (ticket.status === TicketStatus.ASSIGNED) {
        await SLAService.setSLADeadline(
          ticket.id,
          ticket.departmentId,
          TicketStatus.ASSIGNED,
          ticket.AssignedAt
        );
      }
    }

    // Clear violation when ticket is assigned (status changed from UN_ASSIGNED)
    if (existing.status === TicketStatus.UN_ASSIGNED && ticket.status === TicketStatus.ASSIGNED && existing.isInViolation) {
      await prisma.ticket.update({
        where: { id },
        data: { isInViolation: false },
      });
    }

    // Set SLA deadline for ASSIGNED status and check violation
    if (existing.status === TicketStatus.UN_ASSIGNED && ticket.status === TicketStatus.ASSIGNED) {
      await SLAService.setSLADeadline(
        ticket.id,
        ticket.departmentId,
        TicketStatus.ASSIGNED,
        ticket.AssignedAt
      );
      await SLAService.checkAndUpdateSLAViolation(ticket.id);
    }

    return ticket;
  }

  static async updateStatus(id: string, status: string, comment?: string) {
    const existing = await prisma.ticket.findFirst({
      where: {
        id,
        is_deleted: false,
      },
    });

    if (!existing) {
      throw new Error("Ticket not found");
    }

    const newStatus = TicketStatus[status as keyof typeof TicketStatus];
    const updateData: Prisma.TicketUncheckedUpdateInput = {
      status: newStatus,
    };

    // If status changes to RESPONDED, set SLA deadline
    if (status === "RESPONDED" && existing.status !== TicketStatus.RESPONDED) {
      await SLAService.setSLADeadline(
        id,
        existing.departmentId,
        TicketStatus.RESPONDED,
        new Date()
      );
    }

    // If status changes to RESOLVED, set resolvedAt
    if (status === "RESOLVED" && existing.status !== TicketStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        grievance: {
          select: {
            id: true,
            report_id: true,
            name: true,
            subject: true,
            sub_subject: true,
            status: true,
            created_at: true,
            phone_number: true,
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
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
            phoneNumber: true,
          },
        },
      },
    });

    // Clear violation when status changes (violation is resolved)
    if (existing.status !== newStatus && existing.isInViolation) {
      await prisma.ticket.update({
        where: { id },
        data: { isInViolation: false },
      });
    }

    // Sync grievance status based on ticket status
    if (existing.status !== newStatus) {
      const grievance = await prisma.grievance.findUnique({
        where: { id: ticket.grievanceId },
      });

      if (grievance) {
        // If ticket is RESOLVED, close the grievance
        if (newStatus === TicketStatus.RESOLVED && grievance.status !== GrievanceStatus.CLOSED) {
          await prisma.grievance.update({
            where: { id: ticket.grievanceId },
            data: { status: GrievanceStatus.CLOSED },
          });
        }
        // If ticket is ASSIGNED and grievance is OPEN, set to IN_PROGRESS
        else if (newStatus === TicketStatus.ASSIGNED && grievance.status === GrievanceStatus.OPEN) {
          await prisma.grievance.update({
            where: { id: ticket.grievanceId },
            data: { status: GrievanceStatus.IN_PROGRESS },
          });
        }
      }
    }

    // Set SLA deadline for new status and check violation
    if (existing.status !== newStatus) {
      // Set SLA deadline for the new status
      if (newStatus === TicketStatus.ASSIGNED) {
        await SLAService.setSLADeadline(
          id,
          ticket.departmentId,
          TicketStatus.ASSIGNED,
          ticket.AssignedAt || new Date()
        );
      } else if (newStatus === TicketStatus.RESPONDED) {
        await SLAService.setSLADeadline(
          id,
          ticket.departmentId,
          TicketStatus.RESPONDED,
          new Date()
        );
      }

      // Check SLA violation for new status
      await SLAService.checkAndUpdateSLAViolation(ticket.id);
    }

    // Send WhatsApp notification for status update
    try {
      if (ticket.grievance?.phone_number) {
        // Lazy load WhatsApp service to avoid module resolution issues
        const { WhatsAppService } = require("./whatsapp.service");
        const whatsappService = new WhatsAppService(
          process.env.PINBOT_API_URL || "https://partnersv1.pinbot.ai",
          process.env.PINBOT_API_KEY || "",
          process.env.WHATSAPP_PHONE_NUMBER_ID || ""
        );

        // Create a status update message
        let statusMessage = `🔔 *Grievance/Ticket Status Update*\n\n`;
        statusMessage += `Your grievance with ID: *${ticket.grievance.report_id}* status has been updated.\n\n`;
        statusMessage += `*New Status:* ${ticket.status}\n`;

        if (ticket.department) {
          statusMessage += `*Department:* ${ticket.department.name}\n`;
        }

        if (comment) {
          statusMessage += `\n*Message:* ${comment}\n`;
        }

        statusMessage += `\nWe will keep you updated on the progress of your grievance.`;

        const phoneNumber = ticket.grievance.phone_number;
        if (phoneNumber && /^[0-9]{10,15}$/.test(phoneNumber.replace(/^\+/, ''))) {
          const response = await whatsappService.sendTextMessage(phoneNumber, statusMessage);
          if (response?.status === "FAILED" || response?.code === "100") {
            console.error(`❌ WhatsApp notification failed to ${phoneNumber}: ${response?.message || 'Unknown error'}`);
          } else {
            console.log(`✅ WhatsApp notification sent to ${phoneNumber} (grievance submitter) for ticket status update`);
          }
        } else {
          console.log(`⚠️ WhatsApp notification skipped - invalid phone number format for grievance ${ticket.grievance.report_id}`);
        }
      } else if (ticket.createdUser?.phoneNumber) {
        // Fallback to ticket creator if no grievance linked
        const { WhatsAppService } = require("./whatsapp.service");
        const whatsappService = new WhatsAppService(
          process.env.PINBOT_API_URL || "https://partnersv1.pinbot.ai",
          process.env.PINBOT_API_KEY || "",
          process.env.WHATSAPP_PHONE_NUMBER_ID || ""
        );

        let statusMessage = `🎫 *Ticket Status Update*\n\n`;
        statusMessage += `Your ticket status has been updated.\n\n`;
        statusMessage += `*New Status:* ${ticket.status}\n`;

        if (ticket.department) {
          statusMessage += `*Department:* ${ticket.department.name}\n`;
        }

        if (comment) {
          statusMessage += `\n*Message:* ${comment}\n`;
        }

        statusMessage += `\nWe will keep you updated on the progress of your ticket.`;

        const userPhoneNumber = ticket.createdUser.phoneNumber;
        if (/^[0-9]{10,15}$/.test(userPhoneNumber.replace(/^\+/, ''))) {
          const response = await whatsappService.sendTextMessage(userPhoneNumber, statusMessage);
          if (response?.status === "FAILED" || response?.code === "100") {
            console.error(`❌ WhatsApp notification failed to ${userPhoneNumber}: ${response?.message || 'Unknown error'}`);
          } else {
            console.log(`✅ WhatsApp notification sent to ${userPhoneNumber} (ticket creator) for ticket status update`);
          }
        }
      } else {
        console.log(`⚠️ WhatsApp notification skipped - no grievance linked and ticket creator has no phone number`);
      }
    } catch (whatsappError) {
      console.error("❌ Error preparing WhatsApp notification for ticket status update:", whatsappError);
      // Don't fail the request if WhatsApp notification fails
    }

    return ticket;
  }

  static async delete(id: string) {
    // Check if ticket exists
    const existing = await prisma.ticket.findFirst({
      where: {
        id,
        is_deleted: false,
      },
    });

    if (!existing) {
      throw new Error("Ticket not found");
    }

    // Soft delete
    const ticket = await prisma.ticket.update({
      where: { id },
      data: { is_deleted: true },
    });

    return ticket;
  }
}

