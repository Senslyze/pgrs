# Zod Schemas Specification

## Core Principles

### 1. Match Payload Structure Exactly
- **The payloads are the source of truth** - replicate their structure exactly
- Don't break down schemas into base/derived patterns
- Don't abstract common fields unless truly necessary
- Each schema should be self-contained and match one specific payload type

### 2. Discriminated Unions
- Use `z.discriminatedUnion("discriminator_field", [...])` for robust type inference w.r.t business-logic (and such is mentioned in the task request)
- **The discriminator field must be at the root level** of the object - otherwise TypeScript inference is lost
- Only add discriminator via transform when there isn't already a suitable field for discriminated union
- If a field already exists that can discriminate, use it directly instead of adding a new one
- This enables proper TypeScript narrowing without manual type guards

### 3. Arrays: Use Tuple + Rest Pattern
- **Always use**: `z.tuple([schema]).rest(schema)` for arrays that must have at least one element
- **Never use**: `z.array(schema).nonempty()` or `z.array(schema).min(1)`
- The tuple pattern gives TypeScript the type `[T, ...T[]]` which guarantees the first element exists
- This enables direct access like `array[0]` without TypeScript errors

## Schema Pattern

### Standard Schema Structure

```typescript
import { z } from "zod";
import { DISCRIMINATOR_CONSTANTS } from "./constants";

export const schemaName = z.object({
  // Match payload structure exactly
  field1: z.string(),
  field2: z.object({
    nested: z.string(),
  }),
  arrayField: z.tuple([itemSchema]).rest(itemSchema), // Use tuple + rest for arrays
}).transform((data) => {
  // Simple transform - only add discriminator
  return {
    ...data,
    discriminator_field: DISCRIMINATOR_CONSTANTS.VALUE
  }
});
```

### Example: Text Message Schema

```typescript
import { z } from "zod";
import { WHATSAPP_CALLBACK_TYPES } from "./constants";

export const whatsappTextCallbackMessageSchema = z.object({
  object: z.literal("whatsapp_business_account"),
  entry: z.tuple([z.object({
    id: z.string(),
    changes: z.tuple([z.object({
      field: z.literal("messages"),
      value: z.object({
        messaging_product: z.literal("whatsapp"),
        metadata: z.object({
          display_phone_number: z.string(),
          phone_number_id: z.string(),
        }),
        contacts: z.tuple([contactSchema]).rest(contactSchema), // Tuple + rest
        messages: z.tuple([z.object({
          from: z.string(),
          id: z.string(),
          timestamp: z.string(),
          type: z.literal("text"),
          text: z.object({
            body: z.string(),
          }),
        })]).rest(z.never()),
      })
    })]).rest(z.never()),
  })]).rest(z.never()),
}).transform((data) => {
  return {
    ...data,
    message_type: WHATSAPP_CALLBACK_TYPES.TEXT
  }
});
```

## Discriminated Union Setup

### Creating the Union

```typescript
import { z } from "zod";
import { schema1 } from "./schema1";
import { schema2 } from "./schema2";
// ... import all schemas

export const mainSchema = z.discriminatedUnion("message_type", [
  schema1,
  schema2,
  // ... all schemas
]);

export type MainSchemaType = z.infer<typeof mainSchema>;
```

## Common Patterns

### Shared Schemas
- Extract truly shared schemas to `common.ts`
- Only extract if used in multiple places
- Don't over-extract - prefer duplication over premature abstraction

### Constants
- Define discriminator constants in `constants.ts`
- Use `as const` for type safety
- Import and reuse - don't duplicate

### Transform Logic
- Keep transforms at the schema level
- Only add discriminator fields
- No business logic in transforms
- Business logic belongs in separate transform files (e.g., `transformParsedCallback.ts`)

## Anti-Patterns to Avoid

### ❌ Don't Do This

```typescript
// Breaking down into base schemas
const baseSchema = z.object({ ... });
const derivedSchema = baseSchema.extend({ ... });

// Adding validation
z.array(schema).nonempty()
z.array(schema).min(1)
schema.refine(...)

// Non-null assertions
data.field[0]!

// Complex transforms
.transform((data) => {
  // Complex validation logic
  if (!data.field) throw new Error(...);
  // Business logic
  return processData(data);
})
```

### ✅ Do This Instead

```typescript
// Self-contained schema matching payload exactly
const schema = z.object({
  // Full structure here
  arrayField: z.tuple([itemSchema]).rest(itemSchema),
}).transform((data) => {
  // Simple - just add discriminator
  return { ...data, message_type: CONSTANT };
});
```

## When to Use Each Pattern

### Use Tuple + Rest When:
- Array must have at least one element
- You need to access `array[0]` without TypeScript errors
- The payload always has at least one item

### Use Regular Array When:
- Array can be empty
- No need to access first element directly

### Use Discriminated Union When:
- You have multiple similar schemas that differ in one field
- You want TypeScript to narrow types based on that field
- You have clear sample payloads for each type
- **The discriminator field must be at the root level** - nested fields won't work for type narrowing

### When to Add Discriminator vs Use Existing Field:
- **Use existing field**: If the payload already has a root-level field that can discriminate (e.g., `type: "text"` vs `type: "audio"`), use it directly
- **Add via transform**: Only when no suitable root-level discriminator exists in the payload structure

## Summary

1. **Match payloads exactly** - they're the source of truth
2. **Use tuple + rest for arrays** - enables `array[0]` access
3. **Simple transforms** - only add discriminators
4. **Discriminated unions** - for type narrowing
5. **No validation logic** - payload structure is validation
6. **Self-contained schemas** - don't break down unnecessarily
7. **Keep it simple** - avoid over-engineering
