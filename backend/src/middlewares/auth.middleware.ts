import { verifyToken } from "../utils/jwt";
import type { Context } from "hono";
import type { Next } from "hono";

export const authMiddleware = async (c: Context, next: Next) => {
  const header = c.req.header("Authorization");

  if (!header || !header.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = header.split(" ")[1];

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = verifyToken(token);
    c.set("user", payload); // attach user to context
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
};
