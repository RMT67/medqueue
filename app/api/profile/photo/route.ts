import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/db/models/User";
import Doctor from "@/db/models/Doctor";
import { verifyToken } from "@/lib/auth-helper";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function POST(req: Request) {
  try {
    // Validate Cloudinary config
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.error("Cloudinary configuration missing");
      return NextResponse.json(
        {
          message: "Server configuration error. Please contact administrator.",
        },
        { status: 500 }
      );
    }

    await connectDB();

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    try {
      const decoded = verifyToken(authHeader);

      // Get FormData from request
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { message: "No file provided." },
          { status: 400 }
        );
      }

      // Validate file type (image only)
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { message: "File must be an image." },
          { status: 400 }
        );
      }

      // Convert File to buffer
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Convert buffer to base64 data URL for Cloudinary
      const base64 = buffer.toString("base64");
      const dataURI = `data:${file.type};base64,${base64}`;

      // Upload to Cloudinary
      const folder = process.env.CLOUDINARY_FOLDER || "medqueue";
      let uploadResult: { secure_url: string; public_id: string };

      try {
        uploadResult = (await new Promise((resolve, reject) => {
          cloudinary.uploader.upload(
            dataURI,
            {
              folder: folder,
              resource_type: "image",
              overwrite: true,
            },
            (error, result) => {
              if (error) {
                console.error("Cloudinary upload error:", error);
                reject(error);
              } else if (!result) {
                reject(new Error("Cloudinary upload returned no result"));
              } else {
                resolve(result);
              }
            }
          );
        })) as { secure_url: string; public_id: string };
      } catch (cloudinaryError) {
        console.error("Cloudinary upload failed:", cloudinaryError);
        return NextResponse.json(
          { message: "Failed to upload image. Please try again." },
          { status: 500 }
        );
      }

      // Update user photoUrl in database
      const user = await User.findByIdAndUpdate(
        decoded.userId,
        { $set: { photoUrl: uploadResult.secure_url } },
        { new: true, runValidators: true }
      );

      if (!user) {
        return NextResponse.json(
          { message: "User not found." },
          { status: 404 }
        );
      }

      // If user is a doctor, also update the doctor's image in doctors collection
      if (user.role === "doctor") {
        try {
          const doctor = await Doctor.findDoctorByUserId(user._id.toString());
          if (doctor) {
            await Doctor.updateImage(
              doctor._id.toString(),
              uploadResult.secure_url
            );
            console.log(
              "Doctor image updated successfully:",
              uploadResult.secure_url
            );
          } else {
            console.log("Doctor not found for userId:", user._id.toString());
          }
        } catch (doctorUpdateError) {
          console.error("Failed to update doctor image:", doctorUpdateError);
          // Continue anyway - user photo is already updated
        }
      }

      return NextResponse.json({
        user: {
          _id: user._id.toString(),
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          photoUrl: user.photoUrl || null,
          phoneNumber: user.phoneNumber || null,
          dateOfBirth: user.dateOfBirth
            ? user.dateOfBirth.toISOString().split("T")[0]
            : null,
          gender: user.gender || null,
          address: user.address || null,
          isActive: user.isActive !== undefined ? user.isActive : true,
        },
      });
    } catch (jwtError) {
      console.error("JWT error in /api/profile/photo POST:", jwtError);
      return NextResponse.json({ message: "Invalid token." }, { status: 401 });
    }
  } catch (error) {
    console.error("Error in /api/profile/photo POST:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Server error.";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
