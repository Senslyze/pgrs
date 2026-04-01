import { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { CreateDepartmentRequest, UpdateDepartmentRequest, QueryDepartmentRequest } from "../interfaces/department.interface";
import { de } from "zod/locales";

const prisma = new PrismaClient();

export class DepartmentService {
  static async create(data: CreateDepartmentRequest) {
    // Check if department with same name already exists
    const existing = await prisma.department.findFirst({
      where: {
        name: data.name,
      },
    });

    if (existing) {
      throw new Error("Department with this name already exists");
    }

    const department = await prisma.department.create({
      data: {
        name: data.name,
        subject: data.subject,
        subSubject: data.subSubject,
      },
      include: {
        _count: {
          select: {
            users: true,
            tickets: true,
          },
        },
      },
    });

    return department;
  }

  static async getById(id: string) {
    const department = await prisma.department.findFirst({
      where: { id, deletedAt: null },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            fullName: true,
            role: true,
            phoneNumber: true,
          },
        },
        _count: {
          select: {
            users: true,
            tickets: true,
          },
        },
      },
    });

    if (!department) {
      throw new Error("Department not found");
    }

    return department;
  }

  static async getAll(query: QueryDepartmentRequest) {
    // Convert string query params to numbers
    const page = typeof query.page === 'string' ? parseInt(query.page, 10) : (query.page || 1);
    const limit = typeof query.limit === 'string' ? parseInt(query.limit, 10) : (query.limit || 10);
    const { search } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.DepartmentWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { subject: { contains: search } },
        { subSubject: { contains: search } },
      ];
    }

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: {
              users: true,
              tickets: true,
            },
          },
        },
      }),
      prisma.department.count({ where }),
    ]);

    return {
      departments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async update(id: string, data: UpdateDepartmentRequest) {
    // Check if department exists
    const existing = await prisma.department.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("Department not found");
    }

    // If name is being updated, check if new name already exists
    if (data.name && data.name !== existing.name) {
      const nameExists = await prisma.department.findFirst({
        where: {
          name: data.name,
        },
      });

      if (nameExists) {
        throw new Error("Department with this name already exists");
      }
    }

    const updateData: Prisma.DepartmentUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.subject !== undefined) updateData.subject = data.subject;
    if (data.subSubject !== undefined) updateData.subSubject = data.subSubject;

    const department = await prisma.department.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            users: true,
            tickets: true,
          },
        },
      },
    });

    return department;
  }

  static async delete(id: string) {
    // Check if department exists
    const existing = await prisma.department.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            users: true,
            tickets: true,
          },
        },
      },
    });

    if (!existing) {
      throw new Error("Department not found");
    }

    // Check if department has users or tickets
    if (existing._count.users > 0) {
      throw new Error("Cannot delete department with associated users. Please reassign or remove users first.");
    }

    if (existing._count.tickets > 0) {
      throw new Error("Cannot delete department with associated tickets. Please reassign or remove tickets first.");
    }

    const department = await prisma.department.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return department;
  }
}

