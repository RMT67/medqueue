"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Navigation } from "@/components/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { User, Mail, Phone, Edit, ArrowLeft, Calendar, UserCircle, MapPin } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { apiFetch } from "@/lib/api"
import Link from "next/link"
import { ProfileUser } from "@/types/userTypes"

export default function ProfilePage() {
  const router = useRouter()
  const { user: authUser } = useAuth()
  const [profile, setProfile] = useState<ProfileUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true)
        const data = await apiFetch<{ user: ProfileUser }>("/api/profile")
        setProfile(data.user)
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

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <Navigation />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Card className="p-6 border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50">
              <p className="text-red-700 dark:text-red-300 font-semibold">{error}</p>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!profile) {
    return null
  }

  const initials = profile.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "Not set"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    } catch {
      return "Invalid date"
    }
  }

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
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground">My Profile</h1>
                <p className="text-muted-foreground text-base">View your profile information</p>
              </div>
            </div>
          </div>

          {/* Profile Photo Section */}
          <Card className="p-6 lg:p-8 border-2 shadow-lg mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent overflow-hidden shadow-lg">
                  {profile.photoUrl ? (
                    <Image
                      src={profile.photoUrl}
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
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold text-foreground mb-2">{profile.fullName}</h2>
                <p className="text-muted-foreground capitalize mb-4">{profile.role}</p>
                <Link href="/profile/edit">
                  <Button className="gap-2">
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Personal Information */}
          <Card className="p-6 lg:p-8 border-2 shadow-lg">
            <h2 className="text-xl font-bold text-foreground mb-6">Personal Information</h2>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Full Name</p>
                  <p className="text-lg font-semibold text-foreground">{profile.fullName}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Email Address</p>
                  <p className="text-lg font-semibold text-foreground">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Phone Number</p>
                  <p className="text-lg font-semibold text-foreground">
                    {profile.phoneNumber || <span className="text-muted-foreground italic">Not set</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Date of Birth</p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatDate(profile.dateOfBirth)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <UserCircle className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Gender</p>
                  <p className="text-lg font-semibold text-foreground capitalize">
                    {profile.gender || <span className="text-muted-foreground italic">Not set</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-muted-foreground mb-1">Address</p>
                  <p className="text-lg font-semibold text-foreground">
                    {profile.address || <span className="text-muted-foreground italic">Not set</span>}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}
