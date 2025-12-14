import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthUserPayload } from "../types";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = header.split(" ")[1];

  try {
    const secret = process.env.JWT_SECRET as string;
    const payload = jwt.verify(token, secret) as AuthUserPayload;
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}
