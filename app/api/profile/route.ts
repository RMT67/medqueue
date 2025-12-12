import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import User from "@/db/models/User"
import { verifyToken } from "@/lib/auth-helper"

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

    try {
      const decoded = verifyToken(authHeader)
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
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          photoUrl: user.photoUrl || null,
          phoneNumber: user.phoneNumber || null,
        },
      })
    } catch (jwtError) {
      return NextResponse.json(
        { message: "Invalid token." },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("Error in /api/profile GET:", error)
    return NextResponse.json(
      { message: "Server error." },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB()

    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 }
      )
    }

    try {
      const decoded = verifyToken(authHeader)
      const body = await req.json()
      
      // Whitelist fields that can be updated
      const allowedFields: Record<string, unknown> = {}
      if (body.fullName !== undefined) {
        allowedFields.fullName = body.fullName
      }
      if (body.phoneNumber !== undefined) {
        allowedFields.phoneNumber = body.phoneNumber
      }

      // Validate fullName if provided
      if (allowedFields.fullName && typeof allowedFields.fullName === "string" && allowedFields.fullName.trim().length === 0) {
        return NextResponse.json(
          { message: "Full name cannot be empty." },
          { status: 400 }
        )
      }

      const user = await User.findByIdAndUpdate(
        decoded.userId,
        { $set: allowedFields },
        { new: true, runValidators: true }
      )

      if (!user) {
        return NextResponse.json(
          { message: "User not found." },
          { status: 404 }
        )
      }

      return NextResponse.json({
        user: {
          _id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          photoUrl: user.photoUrl || null,
          phoneNumber: user.phoneNumber || null,
        },
      })
    } catch (jwtError) {
      return NextResponse.json(
        { message: "Invalid token." },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error("Error in /api/profile PATCH:", error)
    return NextResponse.json(
      { message: "Server error." },
      { status: 500 }
    )
  }
}

