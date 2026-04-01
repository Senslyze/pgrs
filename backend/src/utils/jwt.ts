import jwt from "jsonwebtoken";
import type { JwtPayload } from "../interfaces/auth.interface";

const SECRET = process.env.JWT_SECRET || "";

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, SECRET, { expiresIn: "1h" });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, SECRET) as JwtPayload;
};

// NEW: Generate long-lived service token
export const generateServiceToken = (serviceName: string) => {
  return jwt.sign(
    {
      service: serviceName,
      type: 'service-to-service',
      iat: Math.floor(Date.now() / 1000)
    },
    SECRET,
    { expiresIn: '365d' } // 1 year
  );
};

// NEW: Check if token is a service token
export const isServiceToken = (payload: any): boolean => {
  return payload.type === 'service-to-service' && !!payload.service;
};

