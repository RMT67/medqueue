import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/db/models/User";

type UserRole = "admin" | "doctor" | "patient";

interface RegisterBody {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = (await req.json()) as RegisterBody;
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Nama, email, dan password wajib diisi." },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email });

    if (existing) {
      return NextResponse.json(
        { message: "Email sudah terdaftar." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const finalRole: UserRole = role ?? "patient";

    const user = await User.create({
      fullName: name,
      email,
      passwordHash,
      role: finalRole,
    });

    return NextResponse.json(
      {
        user: {
          _id: user._id.toString(),
          name: user.fullName as string,
          email: user.email as string,
          role: user.role as UserRole,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in /api/register:", error);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
