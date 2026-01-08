import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/db/models/User";
import { verifyToken } from "@/lib/auth-helper";

export async function GET(req: Request) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    try {
      const decoded = verifyToken(authHeader.split(" ")[1]);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return NextResponse.json(
          { message: "User not found." },
          { status: 404 }
        );
      }

      return NextResponse.json({
        user: {
          _id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          phoneNumber: user.phoneNumber || null,
          photoUrl: user.photoUrl || null,
          dateOfBirth: user.dateOfBirth
            ? user.dateOfBirth.toISOString().split("T")[0]
            : null,
          gender: user.gender || null,
          address: user.address || null,
          isActive: user.isActive !== undefined ? user.isActive : true,
        },
      });
    } catch (jwtError) {
      return NextResponse.json({ message: "Invalid token." }, { status: 401 });
    }
  } catch (error) {
    console.error("Error in /api/profile GET:", error);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    try {
      const decoded = verifyToken(authHeader);
      const body = await req.json();

      // Whitelist fields that can be updated
      const allowedFields: Record<string, unknown> = {};

      if (body.fullName !== undefined) {
        allowedFields.fullName = body.fullName;
      }
      if (body.phoneNumber !== undefined) {
        allowedFields.phoneNumber = body.phoneNumber;
      }
      if (body.dateOfBirth !== undefined) {
        allowedFields.dateOfBirth = body.dateOfBirth;
      }
      if (body.gender !== undefined) {
        allowedFields.gender = body.gender;
      }
      if (body.address !== undefined) {
        allowedFields.address = body.address;
      }
      if (body.isActive !== undefined) {
        allowedFields.isActive = body.isActive;
      }

      // Validate fullName if provided
      if (allowedFields.fullName !== undefined) {
        if (
          typeof allowedFields.fullName !== "string" ||
          allowedFields.fullName.trim().length === 0
        ) {
          return NextResponse.json(
            { message: "Full name cannot be empty." },
            { status: 400 }
          );
        }
        allowedFields.fullName = (allowedFields.fullName as string).trim();
      }

      // Validate gender if provided
      if (allowedFields.gender !== null && allowedFields.gender !== undefined) {
        if (
          allowedFields.gender !== "male" &&
          allowedFields.gender !== "female"
        ) {
          return NextResponse.json(
            { message: "Gender must be 'male' or 'female'." },
            { status: 400 }
          );
        }
      }

      // Validate isActive if provided
      if (
        allowedFields.isActive !== undefined &&
        typeof allowedFields.isActive !== "boolean"
      ) {
        return NextResponse.json(
          { message: "isActive must be a boolean." },
          { status: 400 }
        );
      }

      // Validate and convert dateOfBirth if provided
      if (
        allowedFields.dateOfBirth !== null &&
        allowedFields.dateOfBirth !== undefined
      ) {
        if (
          typeof allowedFields.dateOfBirth === "string" &&
          allowedFields.dateOfBirth.trim() !== ""
        ) {
          // Accept YYYY-MM-DD format
          const date = new Date(allowedFields.dateOfBirth);
          if (isNaN(date.getTime())) {
            return NextResponse.json(
              {
                message:
                  "Invalid date format for dateOfBirth. Expected YYYY-MM-DD.",
              },
              { status: 400 }
            );
          }
          allowedFields.dateOfBirth = date;
        } else if (
          allowedFields.dateOfBirth === null ||
          allowedFields.dateOfBirth === ""
        ) {
          allowedFields.dateOfBirth = null;
        } else {
          return NextResponse.json(
            {
              message:
                "dateOfBirth must be a string in YYYY-MM-DD format or null.",
            },
            { status: 400 }
          );
        }
      }

      // Update user
      const user = await User.findByIdAndUpdate(
        decoded.userId,
        { $set: allowedFields },
        { new: true, runValidators: true }
      );

      if (!user) {
        return NextResponse.json(
          { message: "User not found." },
          { status: 404 }
        );
      }

      // Return consistent response shape
      return NextResponse.json({
        user: {
          _id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          phoneNumber: user.phoneNumber || null,
          photoUrl: user.photoUrl || null,
          dateOfBirth: user.dateOfBirth
            ? user.dateOfBirth.toISOString().split("T")[0]
            : null,
          gender: user.gender || null,
          address: user.address || null,
          isActive: user.isActive !== undefined ? user.isActive : true,
        },
      });
    } catch (jwtError) {
      console.error("JWT error in /api/profile PATCH:", jwtError);
      return NextResponse.json({ message: "Invalid token." }, { status: 401 });
    }
  } catch (error) {
    console.error("Error in /api/profile PATCH:", error);
    return NextResponse.json({ message: "Server error." }, { status: 500 });
  }
}
