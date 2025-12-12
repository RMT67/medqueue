import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment variables")
}

/**
 * Verify JWT token from Authorization header
 * Returns userId and role if valid, throws error if invalid
 */
export function verifyToken(authHeader: string | null): { userId: string; role: string } {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized")
  }

  const token = authHeader.substring(7)
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
  
  return decoded
}

/**
 * Get authenticated user ID from request
 * Returns null if not authenticated
 */
export function getAuthUserId(req: Request): string | null {
  try {
    const authHeader = req.headers.get("authorization")
    const decoded = verifyToken(authHeader)
    return decoded.userId
  } catch {
    return null
  }
}

