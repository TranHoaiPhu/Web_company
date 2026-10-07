// lib/auth.ts
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET!; // Trùng với server Python

interface JwtPayload {
  sub: string;
  role: string;
  exp: number;
  [key: string]: unknown;
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error("Token không hợp lệ:", error);
    return null;
  }
}
