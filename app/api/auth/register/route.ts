import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import User from "@/db/models/User";

type UserRole = "admin" | "doctor" | "patient";

interface RegisterBody {
  fullName: string;
  email: string;
  password: string;
  role?: UserRole;
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment variables");
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = (await req.json()) as RegisterBody;
    const { fullName, email, password, role = "patient" } = body;

    // Validation
    if (!fullName || !email || !password) {
      return NextResponse.json(
        { message: "Full name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists." },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      fullName,
      email,
      passwordHash,
      role,
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role as UserRole },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      token,
      user: {
        _id: user._id.toString(),
        name: user.fullName,
        email: user.email,
        role: user.role as UserRole,
        photoUrl: user.photoUrl || null,
      },
    });
  } catch (error) {
    console.error("Error in /api/auth/register:", error);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
