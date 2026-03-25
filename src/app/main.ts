import { app } from "./server";
import { env } from "../shared/lib/env";
import { logger } from "../shared/lib/logger";

const server = Bun.serve({
  port: env.port,
  fetch: app.fetch,
});

logger.info({ url: server.url.toString() }, "Starter server running");
