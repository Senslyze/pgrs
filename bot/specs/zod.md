# Zod

- All APIs must have response validations via zod schemas.
- Validation in schema (`.refine()`, `.transform()`), not in handler code.
- Error pattern: `z.prettifyError(parsedData.error)`.

**Example (parse + error):**
```typescript
const data = await response.json();
const parsedData = await wabaDetailsResponseSchema.safeParseAsync(data);
if (!parsedData.success) {
  throw new Error(`WABA API Validation Error: ${z.prettifyError(parsedData.error)}`);
}
```

**Example (validation in schema):**
```typescript
export const uploadPropertyMediaSchema = zfd.formData({
  file: zfd.file()
    .refine((file) => file.size > 0, { message: "File cannot be empty" })
    .refine((file) => file.size <= 10 * 1024 * 1024, { message: "File size must be less than 10MB" }),
});
// Handler: const { file } = await c.req.valid("form");
```

- Schema organization: inline as possible; avoid single-use fragments. Keep related structures together; do not over-abstract into one-off helper schemas for every nested block.

**Arrays: use `z.tuple` + `z.rest` when you know at least X elements** (at start or end). That gives index-based type safety for those positions (e.g. `arr[0]`, `arr[1]`); `z.array(T).min(n)` still yields `T[]`, so indexed access can be treated as possibly undefined. Use `z.tuple([T1, T2, ...]).rest(z.never())` for exactly X, or `.rest(T)` for "at least X, rest same type". When length is unknown (0 to n), `z.array` is fine.

**Example:**
```typescript
// Known at least 1 at start -> arr[0] typed
contacts: z.tuple([contactSchema]).rest(z.never())
// Known at least 3 at start -> arr[0], arr[1], arr[2] typed
headers: z.tuple([z.string(), z.string(), z.string()]).rest(z.string())

// Unknown 0..n -> z.array is fine
tags: z.array(z.string())
```
