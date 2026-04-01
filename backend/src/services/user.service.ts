import { PrismaClient, Role } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { hashPassword } from "../utils/password";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  QueryUserRequest,
} from "../interfaces/user.interface";

const prisma = new PrismaClient();

export class UserService {
  static async create(data: CreateUserRequest) {
    const role = data.role || "USER";

    // If role is USER, departmentId is required
    if (role === "USER") {
      if (!data.departmentId) {
        throw new Error("Department is required when role is USER");
      }

      // Verify department exists
      const department = await prisma.department.findUnique({
        where: { id: data.departmentId },
      });

      if (!department) {
        throw new Error("Department not found");
      }
    } else if (data.departmentId) {
      // If role is ADMIN but departmentId is provided, verify it exists
      const department = await prisma.department.findUnique({
        where: { id: data.departmentId },
      });

      if (!department) {
        throw new Error("Department not found");
      }
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      throw new Error("Username already exists");
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new Error("Email already exists");
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        password: hashedPassword,
        phoneNumber: data.phoneNumber,
        role: Role[role as keyof typeof Role],
        departmentId: data.departmentId || null, // Required for USER, optional for ADMIN
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            subject: true,
            subSubject: true,
          },
        },
      },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async getById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            subject: true,
            subSubject: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async getAll(query: QueryUserRequest) {
    // Convert string query params to numbers
    const page =
      typeof query.page === "string"
        ? parseInt(query.page, 10)
        : query.page || 1;
    const limit =
      typeof query.limit === "string"
        ? parseInt(query.limit, 10)
        : query.limit || 10;
    const { role, departmentId, search } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (role) {
      where.role = Role[role as keyof typeof Role];
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
        { fullName: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
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
              subject: true,
              subSubject: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async update(id: string, data: UpdateUserRequest) {
    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error("User not found");
    }

    // Determine the final role after update
    const finalRole = data.role
      ? Role[data.role as keyof typeof Role]
      : existing.role;

    // If role is being set to USER, departmentId is required
    if (data.role === "USER") {
      // If departmentId is being set, use it; otherwise use existing departmentId
      const departmentIdToUse =
        data.departmentId !== undefined
          ? data.departmentId
          : existing.departmentId;

      if (!departmentIdToUse) {
        throw new Error("Department is required when role is USER");
      }

      // Verify department exists
      const department = await prisma.department.findUnique({
        where: { id: departmentIdToUse },
      });

      if (!department) {
        throw new Error("Department not found");
      }
    } else if (data.departmentId) {
      // If role is ADMIN but departmentId is provided, verify it exists
      const department = await prisma.department.findUnique({
        where: { id: data.departmentId },
      });

      if (!department) {
        throw new Error("Department not found");
      }
    } else if (finalRole === "USER" && !existing.departmentId) {
      // If existing user has no department and role is USER, require departmentId
      throw new Error("Department is required when role is USER");
    }

    // Check if username is being updated and already exists
    if (data.username && data.username !== existing.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username: data.username },
      });

      if (usernameExists) {
        throw new Error("Username already exists");
      }
    }

    // Check if email is being updated and already exists
    if (data.email && data.email !== existing.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new Error("Email already exists");
      }
    }

    let updateData: Prisma.UserUncheckedUpdateInput = {};

    if (data.username !== undefined) updateData.username = data.username;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.phoneNumber !== undefined)
      updateData.phoneNumber = data.phoneNumber;
    if (data.role !== undefined) {
      updateData.role = Role[data.role as keyof typeof Role];
    }
    if (data.departmentId !== undefined) {
      // If setting to null/empty and role is USER, that's not allowed
      if (
        (data.departmentId === null || data.departmentId === "") &&
        finalRole === "USER"
      ) {
        throw new Error("Department is required when role is USER");
      }
      // If setting to null and role is ADMIN, that's allowed
      updateData.departmentId = data.departmentId || null;
    }
    // Note: If role is changed to ADMIN and departmentId is not provided,
    // we keep the existing departmentId (ADMIN can have a department, it's just optional)
    if (data.password !== undefined) {
      updateData.password = await hashPassword(data.password);
    }

    const user = await prisma.user.update({
      where: { id },
      // data: updateData,
      data: updateData,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            subject: true,
            subSubject: true,
          },
        },
      },
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async delete(id: string) {
    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new Error("User not found");
    }

    const user = await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return user;
  }
}
