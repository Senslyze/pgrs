// scripts/generateServiceToken.ts
import { generateServiceToken } from "../utils/jwt";

const token = generateServiceToken("whatsapp-handler");

console.log("=".repeat(60));
console.log("SERVICE TOKEN GENERATED");
console.log("=".repeat(60));
console.log("\nToken:", token);
console.log("\n📝 Add this to your WhatsApp backend .env file:");
console.log(`SERVICE_TOKEN=${token}`);
console.log("\n⚠️  Keep this token secure and never commit it to Git!");
console.log("=".repeat(60));