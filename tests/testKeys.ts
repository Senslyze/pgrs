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

export const flowTestKeyPair = keyPair;
