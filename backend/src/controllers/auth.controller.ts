import type { Context } from "hono";
import { AuthService } from "../services/auth.service";
import { registerSchema, loginSchema } from "../validations/auth.schema";

export class AuthController {
  static async register(c: Context) {
    try {
      const body = await c.req.json();
      const parsed = registerSchema.safeParse(body);

      if (!parsed.success) {
        return c.json({ error: "Validation failed", details: parsed.error.format() }, 400);
      }

      const user = await AuthService.register(parsed.data);
      return c.json({ message: "User created", user });
    } catch (error: any) {
      return c.json({ error: error.message || "Registration failed" }, 500);
    }
  }

  static async login(c: Context) {
    try {
      const body = await c.req.json();
      const parsed = loginSchema.safeParse(body);

      if (!parsed.success) {
        return c.json({ error: "Validation failed", details: parsed.error.format() }, 400);
      }

      const result = await AuthService.login(parsed.data);
      return c.json(result);
    } catch (error: any) {
      return c.json({ error: error.message || "Login failed" }, 500);
    }
  }
}
