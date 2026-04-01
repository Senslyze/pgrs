import type { Context } from "hono";
import type { Next } from "hono";
import type { JwtPayload } from "../interfaces/auth.interface";

export const adminMiddleware = async (c: Context, next: Next) => {
  const user = c.get("user") as JwtPayload | undefined;

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (user.role !== "ADMIN") {
    return c.json({ error: "Forbidden: Admin access required" }, 403);
  }

  await next();
};

