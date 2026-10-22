// Express middleware that protects routes.
// It reads the "Authorization: Bearer <token>" header, checks the token,
// and attaches the user id to the request. If the token is missing or bad,
// it stops the request with 401 Unauthorized.

import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../auth";

// Add `userId` to Express's Request type so TypeScript is happy.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Please log in first." });
  }

  req.userId = payload.userId;
  next();
}
