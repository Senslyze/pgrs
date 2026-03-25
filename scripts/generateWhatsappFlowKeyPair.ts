import { generateKeyPairSync } from "crypto";
import { mkdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";

const DEFAULT_OUTPUT_DIR = "data/keys";
const PUBLIC_KEY_FILE_NAME = "whatsapp_flow_public_key.pem";
const PRIVATE_KEY_FILE_NAME = "whatsapp_flow_private_key.pem";
const ENV_PRIVATE_KEY_FILE_NAME = "private_pem_key.env";

const getOutputDirectory = () => {
  const outputDirectoryFlagIndex = process.argv.findIndex(
    (argument) => argument === "--out-dir"
  );

  if (outputDirectoryFlagIndex === -1) return DEFAULT_OUTPUT_DIR;

  const outputDirectoryValue = process.argv[outputDirectoryFlagIndex + 1];
  if (!outputDirectoryValue) {
    throw new Error("Missing value for --out-dir");
  }

  return outputDirectoryValue;
};

const outputDirectoryPath = resolve(process.cwd(), getOutputDirectory());
mkdirSync(outputDirectoryPath, { recursive: true });

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
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

const publicKeyPath = join(outputDirectoryPath, PUBLIC_KEY_FILE_NAME);
const privateKeyPath = join(outputDirectoryPath, PRIVATE_KEY_FILE_NAME);
const envPrivateKeyPath = join(outputDirectoryPath, ENV_PRIVATE_KEY_FILE_NAME);

writeFileSync(publicKeyPath, publicKey, { encoding: "utf8" });
writeFileSync(privateKeyPath, privateKey, { encoding: "utf8", mode: 0o600 });

const envReadyPrivateKey = privateKey.replace(/\n/g, "\\n");
writeFileSync(
  envPrivateKeyPath,
  `PRIVATE_PEM_KEY="${envReadyPrivateKey}"\n`,
  { encoding: "utf8", mode: 0o600 }
);

console.log("WhatsApp Flow key pair generated.");
console.log(`Public key: ${publicKeyPath}`);
console.log(`Private key: ${privateKeyPath}`);
console.log(`Env file: ${envPrivateKeyPath}`);
console.log("\nUpload this public key to Meta Flow endpoint configuration:\n");
console.log(publicKey);
console.log("\nPRIVATE_PEM_KEY written to env file (not printed for security).");
