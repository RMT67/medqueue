import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import User from "@/db/models/User";

type UserRole = "admin" | "doctor" | "patient";

interface LoginBody {
  email: string;
  password: string;
  role?: UserRole;
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment variables");
}

export async function POST(req: Request) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/cf3da9b3-e361-40d2-9804-0e59c14855ca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/login/route.ts:21',message:'POST handler entry',data:{hasJwtSecret:!!JWT_SECRET},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/cf3da9b3-e361-40d2-9804-0e59c14855ca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/login/route.ts:23',message:'before connectDB',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    await connectDB();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/cf3da9b3-e361-40d2-9804-0e59c14855ca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/login/route.ts:25',message:'after connectDB',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    const body = (await req.json()) as LoginBody;
    const { email, password, role } = body;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/cf3da9b3-e361-40d2-9804-0e59c14855ca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/login/route.ts:28',message:'request body parsed',data:{hasEmail:!!email,hasPassword:!!password,role},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Validate role if provided
    if (role && user.role !== role) {
      return NextResponse.json(
        { message: "Account role does not match." },
        { status: 403 }
      );
    }

    const token = jwt.sign(
      { userId: user._id.toString(), role: user.role as UserRole },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/cf3da9b3-e361-40d2-9804-0e59c14855ca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/login/route.ts:66',message:'before return success response',data:{userId:user._id.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/cf3da9b3-e361-40d2-9804-0e59c14855ca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/login/route.ts:78',message:'catch block - error occurred',data:{errorMessage:error instanceof Error ? error.message : String(error),errorStack:error instanceof Error ? error.stack : undefined,errorName:error instanceof Error ? error.name : undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    console.error("Error in /api/auth/login:", error);
    
    // Check if it's a MongoDB connection error
    const errorMessage = error instanceof Error ? error.message : String(error);
    let userMessage = "Server error.";
    
    if (errorMessage.includes("querySrv") || errorMessage.includes("EBADNAME") || errorMessage.includes("MongoServerError") || errorMessage.includes("MongooseError")) {
      userMessage = "Database connection error. Please check your MongoDB configuration.";
    } else if (errorMessage.includes("MONGODB_URI")) {
      userMessage = "Database configuration error. Please check your environment variables.";
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/cf3da9b3-e361-40d2-9804-0e59c14855ca',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/login/route.ts:87',message:'returning error response',data:{userMessage,errorMessage},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return NextResponse.json({ message: userMessage }, { status: 500 });
  }
}
