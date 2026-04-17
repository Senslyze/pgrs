# Building a Municipality PGRS WhatsApp System — Pothole Intake with Media, Location, Flow Forms, and an Admin Console

Citizen complaint systems fail in practice not because the “form” is hard, but because real-world intake is messy: wrong photos, missing locations, long chat questionnaires, and media that isn’t a public URL. `Municipality-PGRS` is a **reference implementation** of a WhatsApp-first pothole grievance journey that collects the minimum evidence required to act (**photo + GPS location**), uses a **WhatsApp Flow** for structured final details (with **prefill**), and optionally forwards the final payload to a backend for persistence/workflows.

This document is an “info-style” narrative (problem → solution → architecture → integrations → runbook → code map), complementing the more operational `README.md`.

---

## The problem

A “report a pothole” bot breaks in real deployments because:

- Citizens share **random photos** (not potholes) and the system accepts garbage.
- **Location** is missing or inaccurate → complaints can’t be assigned.
- Long, free-form data collection inside chat causes drop-off.
- WhatsApp media is not a public URL; you receive a **media id** and must **download** securely.
- Flows are **encrypted**; implementations often get crypto wrong and fail silently.

---

## Solution at a glance

The system deliberately splits responsibilities across three modules:

- **`bot/`** (core): WhatsApp webhook + state machine + media download + optional AI validation + Flow launch + Flow submit handling.
- **`backend/`** (optional): Bun/Hono + Prisma API service to persist grievances, manage tickets/SLA/users, and support secure media download for the admin UI.
- **`frontend/`** (optional): React/Vite admin/training UI to view grievances, statuses, departments, tickets, etc.

Citizen journey on WhatsApp:

1. **Start**: bot welcomes user and asks for a pothole image.
2. **Image**: user sends an image; bot downloads bytes; optionally runs AI validation; assigns **priority** + **confidence**.
3. **Location**: user shares WhatsApp location pin; bot confirms details and offers a CTA to complete the report.
4. **Flow form**: bot launches a WhatsApp Flow (“Review & Confirm”) with **prefilled** fields.
5. **Submit**: Flow submission returns as an `nfm_reply` to the bot; bot can forward to backend if enabled.

---

## High-level architecture

### Inbound (WhatsApp → bot)

- WhatsApp/provider calls `POST /chat` on the **bot** with webhook payloads.
- The bot validates + adapts payload shape (message types, interactive replies, `nfm_reply`).
- A deterministic **stage machine** decides what to do next based on the session stage:
  - `municipality_awaiting_image` → accept/validate image → ask location
  - `municipality_awaiting_location` → accept location → offer Flow CTA

### Media download (image id → bytes)

WhatsApp sends an **image media id** (not a URL). The bot calls a provider download API to fetch bytes into a `Buffer`.

- Implementation: `bot/src/shared/whatsapp/apis/downloadMediaBuffer.ts`
- Typical provider detail: multipart body is required in some deployments.

### Optional AI validation (Vision)

To reduce garbage intake, the bot can validate that the image actually shows a pothole.

- Model: `gpt-4o-mini` (OpenAI Vision)
- Output: strict JSON `{ isPothole, priority, confidence }`
- Behavior when AI not configured: if `OPENAI_API_KEY` is missing, the bot **accepts** the image and assigns a default priority/confidence.

Implementation: `bot/src/features/municipality/lib/potholeValidation.ts`

### WhatsApp Flow (structured “Review & Confirm”)

Free-form chat is great for the first two evidence items (photo + GPS pin), but the final details are best captured with a structured form UI.

This project uses a WhatsApp Flow for:

- Reviewing extracted/prefilled fields (name/phone, location fields, priority/confidence, media id)
- Editing any field before submission
- Submitting a single “final payload” back to the bot

Flow requests are **encrypted**. The bot exposes `POST /flow`, decrypts the request with an RSA private key, routes to a handler, then encrypts the response using the provided AES key/IV.

- Endpoint: `bot/src/features/flow/server/flow.router.ts`
- Municipality flow handler: `bot/src/features/flow/lib/municipality/flowHandler.ts`
- Prefill + flow token association helpers:
  - `bot/src/shared/lib/municipality/flowCache.ts`
  - `bot/src/shared/lib/municipality/flowSession.ts`

### Submit handling (`nfm_reply`)

Flow submissions are delivered to the WhatsApp webhook as `nfm_reply` callbacks (not to `/flow`).

The bot parses the reply and can:

- Confirm submission to the citizen
- Optionally forward the grievance payload to a backend API

Implementation pointer: `bot/src/features/municipality/lib/municipalityFlowResponseHandler.ts`

---

## Backend module (optional): persistence + workflows

The `backend/` module is a training service that can receive final grievances and provide an API layer for the admin UI.

Highlights (from code):

- **Routes**: `backend/src/routes/grievance.route.ts`
  - `POST /grievances/manage` (service-authenticated create)
  - `GET /grievances` (admin-authenticated list with pagination/filtering)
  - `GET /grievances/report/:reportId` (lookup by report id)
  - `PUT /grievances/manage/:id/status` (status updates)
  - `POST /grievances/download/:mediaId` (secure media download via backend)
- **Validation**: `backend/src/validations/grievance.schema.ts`
- **Controller**: `backend/src/controllers/grievance.controller.ts`
- **DB**: Prisma schema under `backend/src/prisma/schema.prisma`

The `POST /grievances/manage` endpoint is protected by `serviceAuthMiddleware` so external services (like the bot) can create grievances without a user login session.

---

## Frontend module (optional): admin/training UI

The `frontend/` module is a React/Vite UI used in training/workshop contexts to interact with the backend:

- Fetch grievances, view details, update status, download media
- Navigate tickets/SLA/users/departments depending on enabled routes

API wiring example:

- `frontend/src/services/api/grievance.ts` wraps the backend’s grievance endpoints.

---

## Code pointers (start reading here)

If you want to understand the WhatsApp journey end-to-end, read in this order:

- **Bot entrypoints**
  - `bot/src/app/main.ts`
  - `bot/src/app/server.ts` (mounts `/chat` and `/flow`)
- **Callback parsing**
  - `bot/src/shared/whatsapp/callbacks/parseCallback.ts`
  - `bot/src/shared/whatsapp/callbacks/transformParsedCallback.ts`
  - `bot/src/shared/whatsapp/callbacks/adaptCallbackToLegacyFormat.ts`
- **Municipality state machine**
  - `bot/src/features/municipality/lib/municipalityChatHandler.ts`
- **Media download**
  - `bot/src/shared/whatsapp/apis/downloadMediaBuffer.ts`
- **AI validation**
  - `bot/src/features/municipality/lib/potholeValidation.ts`
- **Flow crypto + routing**
  - `bot/src/features/flow/server/flow.router.ts`
  - `bot/src/features/flow/lib/municipality/flowHandler.ts`

---

## Setup and run (local)

### Bot

```bash
cd Municipality-PGRS/bot
cp .env.example .env
bun install
bun run dev
```

### Frontend

```bash
cd Municipality-PGRS/frontend
npm install
npm run dev
```

### Backend

```bash
cd Municipality-PGRS/backend
bun install
bun run dev
```

---

## Environment variables (bot)

Create `Municipality-PGRS/bot/.env` from `.env.example`.

**Required (bot won’t boot without these)**:

- `PORT`
- `PRIVATE_PEM_KEY` (Flow decrypt)
- `WHATSAPP_API_BASE_URL`
- `WHATSAPP_API_KEY`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_FLOW_MODE` (`draft` | `published`)
- `MUNICIPALITY_FLOW_ID` (Flow ID used by the bot CTA)

**Optional (recommended)**:

- `OPENAI_API_KEY` (enables strict pothole validation; otherwise image is accepted by default)

**Optional (backend forwarding)**:

- `MUNICIPALITY_BACKEND_ENABLED=true`
- `MUNICIPALITY_BACKEND_URL`
- `MUNICIPALITY_SERVICE_TOKEN`
- `MUNICIPALITY_BACKEND_TIMEOUT`
- `MUNICIPALITY_BACKEND_MAX_RETRIES`
- `MUNICIPALITY_BACKEND_RETRY_DELAY`

---

## WhatsApp configuration notes

You need a **public HTTPS** URL for WhatsApp/provider callbacks.

- Webhook URL → `https://<your-domain>/chat`
- Flow endpoint URL → `https://<your-domain>/flow`

For local development, use a tunnel (ngrok/cloudflared) and paste the HTTPS URL into your provider config.

---

## Troubleshooting (practical)

- **Bot fails at startup (env error)**: confirm required vars are set; env is validated at boot.
- **Media download fails**: your provider base URL may not match; ensure the download endpoint accepts the `mediaId` and uses the expected auth headers/body.
- **Pothole validation never rejects**: if `OPENAI_API_KEY` is missing, the validator intentionally defaults to “accept.”
- **Flow CTA doesn’t open**: verify `MUNICIPALITY_FLOW_ID` and `WHATSAPP_FLOW_MODE` matches the Flow’s state (draft/published).
- **Flow endpoint never hit**: confirm Meta Flow config points to `/flow` and your public URL is reachable; check access logs in `flow.router.ts`.

---

## Lessons and takeaways

- **Deterministic stages beat “LLM-driven conversations”** for evidence collection.
- **Validate early** (image correctness) and collect **location** before long forms.
- **Use Flows** for structured fields: higher completion, cleaner backend payloads.
- **Treat webhook responses as ACK only**; all user-visible replies must be sent via outbound WhatsApp APIs.

---

## Closing

`Municipality-PGRS` is designed to be a practical reference: it demonstrates the full WhatsApp mechanics (callbacks, media download, Flow crypto, prefill, `nfm_reply`) while keeping the citizen experience minimal and action-oriented. Teams can use only the `bot/` module for a lightweight deployment, or attach `backend/` + `frontend/` to build a complete grievance intake + operations workflow.

