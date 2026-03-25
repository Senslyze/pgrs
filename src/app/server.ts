import { Hono } from "hono";
import { chatRouter } from "../features/chat/server/chat.router";
import { flowRouter } from "../features/flow/server/flow.router";

export const app = new Hono();

app.get("/health", (c) =>
  c.json({
    success: true,
    status: "ok",
  })
);

app.route("/chat", chatRouter);
app.route("/flow", flowRouter);

app.notFound((c) =>
  c.json(
    {
      success: false,
      error: "Route not found",
    },
    404
  )
);
