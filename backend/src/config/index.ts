import { config } from "dotenv";
config({ path: `.env` });

export const CREDENTIALS = process.env.CREDENTIALS === "true";

export const { LOG_DIR, DATABASE_URL } = process.env;

