"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Navigation } from "@/components/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { User, Mail, Phone, Camera, Save, ArrowLeft, Upload } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { apiFetch } from "@/lib/api"

interface ProfileUser {
  _id: string
  fullName: string
  email: string
  role: "patient" | "doctor" | "admin"
  photoUrl: string | null
  phoneNumber: string | null
}

export default function EditProfilePage() {
  const router = useRouter()
  const { user: authUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
  })
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true)
        const data = await apiFetch<{ user: ProfileUser }>("/api/profile")
        setFormData({
          fullName: data.user.fullName,
          phoneNumber: data.user.phoneNumber || "",
        })
        setProfileImage(data.user.photoUrl)
        setError(null)
      } catch (err) {
        console.error("Error fetching profile:", err)
        setError(err instanceof Error ? err.message : "Failed to load profile")
      } finally {
        setIsLoading(false)
      }
    }

    if (authUser) {
      fetchProfile()
    }
  }, [authUser])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size should be less than 2MB")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const token = localStorage.getItem("medqueue_token")
      if (!token) {
        throw new Error("Not authenticated")
      }

      const formData = new FormData()
      formData.append("photo", file)

      const response = await fetch("/api/profile/photo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Upload failed")
      }

      const data = await response.json()
      
      // Update preview
      setProfileImage(data.photoUrl)

      // Update localStorage medqueue_user
      const savedUser = localStorage.getItem("medqueue_user")
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser)
          const updatedUser = {
            ...userData,
            name: data.user.fullName, // Ensure name = fullName
            fullName: data.user.fullName,
            photoUrl: data.user.photoUrl,
            phoneNumber: data.user.phoneNumber,
          }
          localStorage.setItem("medqueue_user", JSON.stringify(updatedUser))
          
          // Trigger custom event to update auth context
          window.dispatchEvent(new Event("medqueue_user_updated"))
        } catch (e) {
          console.error("Error updating localStorage:", e)
        }
      }

      setSuccessMessage("Photo uploaded successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Failed to upload photo")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const data = await apiFetch<{ user: ProfileUser }>("/api/profile", {
        method: "PATCH",
        body: {
          fullName: formData.fullName.trim(),
          phoneNumber: formData.phoneNumber.trim() || null,
        },
      })

      // Update localStorage medqueue_user
      const savedUser = localStorage.getItem("medqueue_user")
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser)
          const updatedUser = {
            ...userData,
            name: data.user.fullName, // Ensure name = fullName
            fullName: data.user.fullName,
            photoUrl: data.user.photoUrl,
            phoneNumber: data.user.phoneNumber,
          }
          localStorage.setItem("medqueue_user", JSON.stringify(updatedUser))
          
          // Trigger custom event to update auth context
          window.dispatchEvent(new Event("medqueue_user_updated"))
        } catch (e) {
          console.error("Error updating localStorage:", e)
        }
      }

      setSuccessMessage("Profile updated successfully!")
      setTimeout(() => {
        router.push("/profile")
      }, 1500)
    } catch (err) {
      console.error("Update error:", err)
      setError(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const initials = formData.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Navigation />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="mb-4 border-2 hover:bg-muted transition-colors gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Edit Profile</h1>
                <p className="text-muted-foreground text-base">Update your personal information</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="p-4 mb-6 bg-red-50 dark:bg-red-950/50 border-2 border-red-200 dark:border-red-800">
              <p className="text-red-700 dark:text-red-300 font-semibold">{error}</p>
            </Card>
          )}

          {/* Success Message */}
          {successMessage && (
            <Card className="p-4 mb-6 bg-green-50 dark:bg-green-950/50 border-2 border-green-200 dark:border-green-800">
              <p className="text-green-700 dark:text-green-300 font-semibold">{successMessage}</p>
            </Card>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Photo Section */}
            <Card className="p-6 lg:p-8 border-2 shadow-lg">
              <h2 className="text-xl font-bold text-foreground mb-6">Profile Photo</h2>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent overflow-hidden shadow-lg">
                    {profileImage ? (
                      <Image
                        src={profileImage}
                        alt="Profile"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-4xl">
                        {initials}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a profile photo. JPG, PNG or GIF. Max size 2MB.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="border-2 hover:bg-muted transition-colors gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Choose Photo
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Personal Information */}
            <Card className="p-6 lg:p-8 border-2 shadow-lg">
              <h2 className="text-xl font-bold text-foreground mb-6">Personal Information</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Full Name
                  </label>
                  <Input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="h-12 border-2 focus:border-primary transition-colors"
                    required
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={authUser?.email || ""}
                    className="h-12 border-2 bg-muted cursor-not-allowed"
                    disabled
                    readOnly
                  />
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="h-12 border-2 focus:border-primary transition-colors"
                    disabled={isSaving}
                  />
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1 h-12 border-2 hover:bg-muted transition-colors"
                disabled={isSaving || isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving || isUploading}
                className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  )
}

