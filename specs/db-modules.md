# DB modules

- DB layer tightly coupled with Prisma: use Prisma types for function parameters; do not manually define params.
- Function names: action + entity + filter (e.g. `getAgentById(id)`, `getAgentByCurrentUser(id, user_id)`).
