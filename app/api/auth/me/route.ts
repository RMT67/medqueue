import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/db"
import User from "@/models/User"

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment variables")
}

export async function GET(req: Request) {
  try {
    await connectDB()

    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
      const user = await User.findById(decoded.userId)

      if (!user) {
        return NextResponse.json(
          { message: "User not found." },
          { status: 404 }
        )
      }

      return NextResponse.json({
        user: {
          _id: user._id.toString(),
          name: user.fullName,
          email: user.email,
          role: user.role,
        },
      })
    } catch (jwtError) {
      return NextResponse.json(
        { message: "Invalid token." },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("Error in /api/auth/me:", error)
    return NextResponse.json(
      { message: "Server error." },
      { status: 500 }
    )
  }
}

