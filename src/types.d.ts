import { JwtPayload } from "jsonwebtoken";

export interface AuthUserPayload extends JwtPayload {
  id: number;
  role: "admin" | "customer";
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role: "admin" | "customer" };
    }
  }
}

export {};
