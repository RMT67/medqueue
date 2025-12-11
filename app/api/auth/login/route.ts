import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/db"
import User from "@/models/User"

type UserRole = "admin" | "doctor" | "patient"

interface LoginBody {
  email: string
  password: string
  role?: UserRole
}

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment variables")
}

export async function POST(req: Request) {
  try {
    await connectDB()

    const body = (await req.json()) as LoginBody
    const { email, password, role } = body

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      )
    }

    const user = await User.findOne({ email })

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      )
    }

    // Validate role if provided
    if (role && user.role !== role) {
      return NextResponse.json(
        { message: "Account role does not match." },
        { status: 403 }
      )
    }

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role as UserRole },
      JWT_SECRET,
      { expiresIn: "7d" }
    )

    return NextResponse.json({
      token,
      user: {
        _id: user._id.toString(),
        name: user.fullName,
        email: user.email,
        role: user.role as UserRole,
      },
    })
  } catch (error) {
    console.error("Error in /api/auth/login:", error)
    return NextResponse.json(
      { message: "Server error." },
      { status: 500 }
    )
  }
}

