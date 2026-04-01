# Handlers

- Handler reads like a story: validate -> delete old -> cleanup -> create new -> update -> queue.
- Abstract bloating code (e.g. long resource checks) into functions with comprehensive, self-explanatory names.
- Function naming: action + condition (e.g. `updateFileIfAdmin`, `getLiveAgentIfExists`).
- Return shapes: `{ canProceed: boolean, error: string | null }`, `{ agent: Agent | null, found: boolean }`, etc.
- Handle negative cases/invalid checks first with minimal comments.
- A function does only what its name says; choose explicit implementations.
