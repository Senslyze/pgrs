// middleware/serviceAuth.ts
import { verifyToken, isServiceToken } from "../utils/jwt";
import type { Context, Next } from "hono";

export const serviceAuthMiddleware = async (c: Context, next: Next) => {
  const header = c.req.header("Authorization");

  if (!header || !header.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized - No token provided" }, 401);
  }

  const token = header.split(" ")[1];

  if (!token) {
    return c.json({ error: "Unauthorized - Invalid token format" }, 401);
  }

  try {
    const payload = verifyToken(token) as any;
    
    // Check if this is a service token
    if (!isServiceToken(payload)) {
      return c.json({ 
        error: "Unauthorized - Invalid service token",
        message: "This endpoint requires service authentication"
      }, 401);
    }
    
    // Attach service info to context
    c.set("service", payload.service);
    c.set("isService", true);
    
    console.log(`✅ Authenticated service: ${payload.service}`);
    
    await next();
  } catch (error) {
    console.error("Service auth error:", error);
    return c.json({ error: "Invalid or expired token" }, 401);
  }
};