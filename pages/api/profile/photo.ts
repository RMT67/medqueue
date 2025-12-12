import type { NextApiRequest, NextApiResponse } from "next"
import multer from "multer"
import { v2 as cloudinary } from "cloudinary"
import { IncomingMessage } from "http"
import jwt from "jsonwebtoken"
import connectDB from "@/lib/db"
import User from "@/db/models/User"

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in environment variables")
}

// Configure Cloudinary
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || "medqueue/profiles"

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error("Cloudinary environment variables are not set")
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
})

// Configure Multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed"))
    }
  },
})

// Helper to verify JWT token
function verifyToken(authHeader: string | null): { userId: string; role: string } {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized")
  }

  const token = authHeader.substring(7)
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
  
  return decoded
}

// Helper to run multer middleware
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: (err?: unknown) => void) {
  return new Promise((resolve, reject) => {
    fn((err) => {
      if (err) return reject(err)
      resolve(undefined)
    })
  })
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  // Check Cloudinary config
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return res.status(500).json({
      message: "Cloudinary configuration is missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.",
    })
  }

  // Verify authentication
  const authHeader = req.headers.authorization
  let userId: string

  try {
    const decoded = verifyToken(authHeader || null)
    userId = decoded.userId
  } catch {
    return res.status(401).json({ message: "Unauthorized. Invalid or missing token." })
  }

  try {
    await connectDB()

    // Run multer middleware
    await runMiddleware(req, res, (err) => {
      upload.single("photo")(req as unknown as IncomingMessage & { file?: Express.Multer.File }, res, err)
    })

    const file = (req as unknown as { file?: Express.Multer.File }).file

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    // Upload to Cloudinary using upload_stream
    const uploadPromise = new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: CLOUDINARY_FOLDER,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else if (result) {
            resolve({ secure_url: result.secure_url })
          } else {
            reject(new Error("Upload failed"))
          }
        }
      )

      uploadStream.end(file.buffer)
    })

    const { secure_url } = await uploadPromise

    // Update user photoUrl
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { photoUrl: secure_url } },
      { new: true }
    )

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    return res.status(200).json({
      photoUrl: secure_url,
      user: {
        _id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl || null,
        phoneNumber: user.phoneNumber || null,
      },
    })
  } catch (error) {
    console.error("Error in /api/profile/photo:", error)
    
    if (error instanceof Error && error.message === "Unauthorized") {
      return res.status(401).json({ message: "Unauthorized" })
    }
    
    if (error instanceof Error && error.message.includes("Only image files")) {
      return res.status(400).json({ message: error.message })
    }

    return res.status(500).json({ message: "Server error" })
  }
}

