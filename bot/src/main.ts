import { app } from "./app/server";
import { env } from "./shared/lib/env";
import { logger } from "./shared/lib/logger";

export default app;

if (import.meta.main) {
  Bun.serve({
    port: env.port,
    fetch: app.fetch,
  });
  logger.info({ port: env.port }, "Starter server running");
}
