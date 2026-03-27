import { generateKeyPairSync } from "crypto";

const keyPair = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicExponent: 0x10001,
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

process.env.PRIVATE_PEM_KEY = keyPair.privateKey.replace(/\n/g, "\\n");
process.env.PORT = process.env.PORT || "3001";
process.env.WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY || "test-api-key";
process.env.WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "test-phone-number-id";
process.env.WHATSAPP_API_BASE_URL = process.env.WHATSAPP_API_BASE_URL || "https://api.pinbot.in";

export const flowTestKeyPair = keyPair;
