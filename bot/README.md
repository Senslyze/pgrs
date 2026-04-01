# WhatsApp Hono Starter

Bun + Hono WhatsApp backend starter with feature-based architecture and reusable WhatsApp utility modules.

## Architecture

This boilerplate follows an `app -> features -> shared` dependency direction:

- `src/app/` - server composition and runtime entrypoint
- `src/features/` - domain handlers (`chat`, `flow`)
- `src/shared/` - reusable primitives (`env`, logger, WhatsApp utilities)

## Included capabilities

- `POST /chat` webhook endpoint with robust callback validation
- `POST /flow` encrypted dynamic flow endpoint (`INIT`, `data_exchange`, `BACK`, `ping`, `complete`)
- Flow crypto helpers (decrypt request / encrypt response)
- Reusable WhatsApp API utility set in `src/shared/whatsapp/apis/`
- Reusable callback parsing/adaptation utility set in `src/shared/whatsapp/callbacks/`
- WhatsApp markdown sanitizer and flow-response schema helpers
- RSA keypair generation utility for flow endpoint setup
- Starter tests for `/chat` and `/flow`

## Quick start

- copy `.env.example` to `.env`
- install deps: `bun install`
- start server: `bun run dev`
- run tests: `bun test tests`

## Municipality bot runbook

This service runs the Municipality pothole → location → Flow form → submit → forward journey.

### Endpoints

- `GET /health`
- `POST /chat` (WhatsApp webhook)
- `POST /flow` (WhatsApp Flow encrypted endpoint)

### Required env vars

- `PRIVATE_PEM_KEY`: RSA private key used by `/flow`
- `WHATSAPP_API_BASE_URL`, `WHATSAPP_API_KEY`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_FLOW_MODE`
- `MUNICIPALITY_FLOW_ID`: WhatsApp Flow ID for `flows/grievance/municipality_pothole.flow.json`

### Optional env vars

- `OPENAI_API_KEY`: enables pothole image validation (if absent, image is accepted with default priority)
- `MUNICIPALITY_BACKEND_ENABLED=true`
- `MUNICIPALITY_BACKEND_URL`: external backend base URL
- `MUNICIPALITY_SERVICE_TOKEN`: Bearer token for external backend

## Notable paths

- `src/app/server.ts`
- `src/features/chat/server/chat.router.ts`
- `src/features/flow/server/flow.router.ts`
- `src/shared/lib/env.ts`
- `src/shared/whatsapp/`
- `scripts/generateWhatsappFlowKeyPair.ts`

## Reference docs

- Flow endpoint guide: https://developers.facebook.com/docs/whatsapp/flows/guides/implementingyourflowendpoint/
- Flow JSON reference: https://developers.facebook.com/docs/whatsapp/flows/reference/flowjson/
- Flow error codes: https://developers.facebook.com/docs/whatsapp/flows/reference/error-codes/#business-endpoint-error-codes
- Cloud API webhooks: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/
