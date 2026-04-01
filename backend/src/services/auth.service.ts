import { PrismaClient, Role } from "@prisma/client";
import { hashPassword, comparePassword } from "../utils/password";
import { generateToken } from "../utils/jwt";
import type { RegisterRequest, LoginRequest } from "../interfaces/auth.interface";

const prisma = new PrismaClient();

export class AuthService {
  static async register(data: RegisterRequest) {
    const { username, email, fullName, password, role } = data;

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        fullName,
        password: hashed,
        role: role ? Role[role as keyof typeof Role] : Role.USER,     
     },
    });

    return user;
  }

  static async login(data: LoginRequest) {
    const { username, password } = data;

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) throw new Error("Invalid credentials");

    const valid = await comparePassword(password, user.password);

    if (!valid) throw new Error("Invalid credentials");

    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role as string,
    });

    const { password: _, ...safeUser } = user;

    return { token, user: safeUser };
  }
}
