# Errors & Logging

- Use `err` as the key when logging error instances, never `error`.
- On validation failure: log context then return the error response.

**Example:**
```typescript
logger.error({ err: error }, "Error message");
if (!validationResult.valid) {
  logger.error({ validationResult, mediaId }, "Failed to validate media file size");
  return c.json({ success: false, error: validationResult.error }, 400);
}
```
