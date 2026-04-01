# Municipality PGRS — Pothole Grievance (Bot + Frontend + Backend)

This project is a **ready to reference implementation** for a civic grievance flow where a citizen reports a pothole on WhatsApp, the bot collects the required evidence (photo + location), and the report is finalized using a **WhatsApp Flow** form.

It is intentionally split into 3 modules so teams can work independently:

- **`bot/`**: WhatsApp bot (the “entrypoint” for citizens)
- **`frontend/`**: web UI (admin/training screens as needed)
- **`backend/`**: server APIs + persistence (optional integration target for the bot)

This README is written for:

- **Users / Ops**: what the system does and how the WhatsApp journey behaves
- **Developers**: how to run each module, how callbacks/media/fl ows work, and which files to read first

> `frontend_old/` is the previous legacy frontend folder before this restructure. Keep it only if you need it for reference.

## What problem this solves (and why the design looks like this)

A “pothole complaint” sounds simple, but in real deployments the flow breaks because:

- Citizens send **random photos** (not potholes) and the system accepts garbage data.
- Location is missing/incorrect → complaints can’t be actioned.
- Long forms inside chat increase drop-off.
- WhatsApp media isn’t a public URL — you must handle **media id → download** securely.

This project addresses that with:

- A deterministic **state machine** in the WhatsApp bot (image → location → review form).
- Optional **AI-based pothole validation** before moving forward (reject non-pothole images).
- A WhatsApp **Flow** for structured data collection (review + confirm) with **prefill**.
- Optional forwarding to a backend API for persistence/processing.

## System overview (modules)

### `bot/` — WhatsApp bot backend (core)

What it does:

- Receives WhatsApp webhook callbacks at `POST /chat`
- Extracts the **media id** from the webhook payload (image message)
- Downloads the image bytes using the provider API (media id → `Buffer`)
- Optionally runs AI validation and assigns:
  - **priority** (`low|medium|high|critical`)
  - **confidence** (0–1)
- Collects WhatsApp **location**
- Launches a **WhatsApp Flow** (“Review & Confirm”) to capture final details
- Handles Flow submit callback (`nfm_reply`) and optionally forwards to backend

### `frontend/` — Training frontend

This is a React/Vite frontend (from `municipality-poc-fe:training-fe`). It’s not required to run the WhatsApp journey, but it’s part of the training workspace for UI/API integration.

### `backend/` — Training backend service

This is a Bun/Hono + Prisma backend (from `senslyze-pocs:training-be`). The bot can optionally forward the grievance payload to this backend (or any external backend) when enabled.

## End-to-end journey (WhatsApp)

Citizen experience:

- **Step 0 — Start**
  - The bot greets and asks the user to **share a pothole image**.
- **Step 1 — Image**
  - User sends a photo.
  - Bot validates that the image is actually a pothole (if AI is enabled).
  - Bot assigns a **priority** and asks for **location**.
- **Step 2 — Location**
  - User shares WhatsApp location pin.
  - Bot responds with a summary and a **“Review & Confirm”** CTA.
- **Step 3 — Flow form**
  - User opens the Flow.
  - Flow fields are **prefilled** from the chat session (name, phone, location, priority, etc).
- **Step 4 — Submit**
  - On submit, WhatsApp sends an `nfm_reply` callback to `POST /chat`.
  - Bot parses it and forwards to backend if configured.

## Key technical terms (glossary)

- **Webhook**: HTTP endpoint that WhatsApp calls for inbound events (messages, interactive replies).
- **Media ID**: WhatsApp does *not* send a public file URL. It sends an **id** (`messages[0].image.id`). You must call an API to download bytes.
- **WhatsApp Flow**: A structured UI inside WhatsApp (screens + form fields) that your backend powers.
- **Encrypted Flow endpoint (`POST /flow`)**: WhatsApp encrypts Flow requests. Your backend must decrypt using **RSA private key**, and respond with AES-encrypted payload.
- **Prefill**: The bot caches session values and returns them on Flow `INIT` so fields are auto-filled.
- **ACK vs Reply**: Your webhook response is just an acknowledgment (to stop retries). User-visible replies must be sent via outbound WhatsApp APIs.

## Repo layout

```text
Municipality-PGRS/
  bot/            # WhatsApp bot (Bun + Hono)
  frontend/       # Training FE (React + Vite)
  backend/        # Training BE (Bun + Hono + Prisma)
  frontend_old/   # legacy folder (optional)
```

## Module deep dive: `bot/`

### Tech stack (bot)

- **Runtime**: Bun
- **Language**: TypeScript (ESM)
- **Framework**: Hono
- **Env validation**: Zod + `@t3-oss/env-core`
- **AI (optional)**: OpenAI Vision (`gpt-4o-mini`) for pothole validation
- **WhatsApp Flow crypto**: RSA (private key) + AES (Flow payload)

### Public endpoints (bot)

- `GET /health`
- `POST /chat` — inbound WhatsApp webhook:
  - text / image / location
  - interactive callbacks
  - Flow submit callback (`nfm_reply`)
- `POST /flow` — encrypted Flow endpoint:
  - `INIT`, `data_exchange`, `BACK`, `ping`, `complete`

### “Start reading here” (bot key files)

If you want to understand the bot fast, read in this order:

- **(1) Server routes**
  - `bot/src/app/server.ts`: mounts `/chat` and `/flow`
  - `bot/src/app/main.ts`: Bun `serve()` entrypoint
- **(2) Webhook parsing**
  - `bot/src/shared/whatsapp/callbacks/parseCallback.ts`: validates the raw payload
  - `bot/src/shared/whatsapp/callbacks/transformParsedCallback.ts`: normalizes message types
  - `bot/src/shared/whatsapp/callbacks/adaptCallbackToLegacyFormat.ts`: converts to `ParsedMessageReceived` with `imageId`, `location`, etc.
- **(3) Municipality state machine**
  - `bot/src/features/municipality/lib/municipalityChatHandler.ts`:
    - stage `municipality_awaiting_image` → download + validate → ask location
    - stage `municipality_awaiting_location` → ask Flow / accept updated image
- **(4) Media download**
  - `bot/src/shared/whatsapp/apis/downloadMediaBuffer.ts`: provider call to download image bytes by media id
- **(5) AI pothole validation**
  - `bot/src/features/municipality/lib/potholeValidation.ts`:
    - if `OPENAI_API_KEY` missing → fallback “accept”
    - else → strict JSON output {isPothole, priority, confidence}
- **(6) Flow backend**
  - `bot/src/features/flow/server/flow.router.ts`: decrypt → `flowHandler` → encrypt
  - `bot/src/features/flow/lib/municipality/flowHandler.ts`: Flow screen routing + prefill + submit behavior
  - `bot/src/features/municipality/lib/municipalityFlowResponseHandler.ts`: handles final submit (`nfm_reply`)

### Environment variables (bot)

Create `.env`:

```bash
cd bot
cp .env.example .env
```

**Required (bot won’t boot without these)**:

- `PORT`
- `PRIVATE_PEM_KEY` (Flow decrypt)
- `WHATSAPP_API_BASE_URL`
- `WHATSAPP_API_KEY`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_FLOW_MODE` (`draft` | `published`)
- `MUNICIPALITY_FLOW_ID` (to launch the grievance Flow)

**Optional (recommended)**:

- `OPENAI_API_KEY` — enables strict pothole image validation

**Optional (backend forwarding)**:

- `MUNICIPALITY_BACKEND_ENABLED=true`
- `MUNICIPALITY_BACKEND_URL`
- `MUNICIPALITY_SERVICE_TOKEN`
- `MUNICIPALITY_BACKEND_TIMEOUT`
- `MUNICIPALITY_BACKEND_MAX_RETRIES`
- `MUNICIPALITY_BACKEND_RETRY_DELAY`

### Setup & run (bot)

```bash
cd bot
bun install
bun run dev
```

### WhatsApp configuration (bot)

You need a public HTTPS URL so WhatsApp can hit your endpoints.

- Webhook URL → `https://<your-domain>/chat`
- Flow endpoint URL → `https://<your-domain>/flow`

Locally, use a tunnel (ngrok/cloudflared) and paste the HTTPS URL into your WhatsApp provider/Meta config.

### Flow crypto (bot)

Generate keypair (if needed):

```bash
cd bot
bun run flow:generate-keys
```

Put the **private key** into `PRIVATE_PEM_KEY` in `bot/.env`.

## Module deep dive: `frontend/`

### Tech stack (frontend)

From `frontend/package.json`:

- **React 19 + TypeScript**
- **Vite**
- **React Router**
- **TanStack Query** + **TanStack Form**
- **Tailwind CSS** + Radix UI
- **Axios** + **Zod**

### Setup & run (frontend)

```bash
cd frontend
npm install
npm run dev
```

## Module deep dive: `backend/`

### Tech stack (backend)

From `backend/package.json`:

- **Bun** + **Hono**
- **Prisma** (DB)
- **JWT** (`jsonwebtoken`)
- **Zod**
- **Logging** (`pino`, `winston`)

### Setup & run (backend)

```bash
cd backend
bun install
bun run dev
```

## Recommended dev workflow

- Start `backend/` (if bot forwarding is enabled).
- Start `bot/` and expose it publicly (tunnel) for WhatsApp.
- Start `frontend/` for UI work.

## Troubleshooting (practical)

- **Bot fails at startup (env error)**
  - `PRIVATE_PEM_KEY`, `WHATSAPP_API_KEY`, `WHATSAPP_PHONE_NUMBER_ID` must be set (validated at boot).
- **Pothole validation never rejects**
  - If `OPENAI_API_KEY` is missing, it intentionally defaults to “accept”.
- **Flow CTA doesn’t open**
  - Check `MUNICIPALITY_FLOW_ID` and `WHATSAPP_FLOW_MODE`.
- **Media download fails**
  - `WHATSAPP_API_BASE_URL` might be wrong for your provider; download API must accept the `mediaId`.

## Security notes

- Never commit `.env`, RSA private keys, or tokens.
- Treat Flow private keys as production secrets.


