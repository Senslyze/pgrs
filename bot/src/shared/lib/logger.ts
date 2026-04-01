type LogLevel = "info" | "warn" | "error";

const writeLog = (level: LogLevel, message: string, context: Record<string, unknown> = {}) => {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };
  const output = JSON.stringify(payload);

  if (level === "error") {
    console.error(output);
    return;
  }

  console.log(output);
};

export const logger = {
  info: (context: Record<string, unknown> | string, message?: string) => {
    if (typeof context === "string") {
      writeLog("info", context);
      return;
    }
    writeLog("info", message ?? "", context);
  },
  warn: (context: Record<string, unknown> | string, message?: string) => {
    if (typeof context === "string") {
      writeLog("warn", context);
      return;
    }
    writeLog("warn", message ?? "", context);
  },
  error: (context: Record<string, unknown> | string, message?: string) => {
    if (typeof context === "string") {
      writeLog("error", context);
      return;
    }
    writeLog("error", message ?? "", context);
  },
  debug: (context: Record<string, unknown> | string, message?: string) => {
    if (typeof context === "string") {
      writeLog("info", context);
      return;
    }
    writeLog("info", message ?? "", context);
  },
};
