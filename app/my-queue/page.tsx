"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { QueueCard } from "@/components/queue-card"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/protected-route"
import { Star, Clock, Calendar, ArrowRight, User, Mail, Phone, ListOrdered, Receipt, Pill, CreditCard } from "lucide-react"
import { ReviewDoctorModal } from "@/components/review-doctor-modal"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"

// Type-safe helper untuk handle name/fullName mismatch
type UserWithOptionalFullName = {
  name?: string
  fullName?: string
  email?: string
  role?: string
  photoUrl?: string | null
}

function getDisplayName(user: UserWithOptionalFullName | null): string {
  if (!user) return "User"
  return user.name ?? user.fullName ?? "User"
}

export default function MyQueuePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [timeRemaining, setTimeRemaining] = useState(847)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [queueStatus, setQueueStatus] = useState<"waiting" | "being-served" | "completed">("waiting")

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60

  const handleMarkComplete = () => {
    setQueueStatus("completed")
    setShowRatingModal(true)
  }

  const displayName = getDisplayName(user as UserWithOptionalFullName | null)
  const userEmail = user?.email ?? "patient@example.com"
  const userRole = user?.role ?? "patient"

  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Navigation />

        {/* Hero Header */}
        <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-12 lg:py-16 border-b border-border/50 overflow-hidden">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='%23000000' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='60' height='60' fill='url(%23grid)'/%3E%3C/svg%3E")`,
              }}
            />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg ring-4 ring-primary/10">
                  <ListOrdered className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  My Queue
                </span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl">Track your appointment status and queue position in real-time</p>
            </div>
          </div>
        </section>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          {/* Countdown Timer */}
          <div className="mb-8">
            <Card className="p-8 lg:p-10 border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/5 shadow-2xl backdrop-blur-md ring-1 ring-primary/10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="flex-1 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Time Until Your Turn</p>
                  <p className="text-6xl lg:text-7xl font-bold text-primary font-mono mb-4 tracking-tight">
                    {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">You'll receive a notification 5 minutes before your turn</p>
                </div>
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl flex-shrink-0 ring-4 ring-primary/20">
                  <Clock className="w-12 h-12 text-white drop-shadow-lg" />
                </div>
              </div>
            </Card>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Queue Card - 2/3 width */}
            <div className="w-full lg:w-2/3 lg:min-w-0">
              <QueueCard
                currentlyServing="A-022"
                patientsAhead={1}
                estimatedTime={15}
                doctorName="Dr. Sarah Johnson"
                doctorSpecialization="General Practitioner"
                doctorClinic="Central Health Clinic"
                doctorRating={4.8}
                doctorReviews={156}
                doctorImage="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                status={queueStatus}
                appointmentDate="Today, Dec 5, 2024"
                appointmentTime="10:30"
                timeRange="09:00 - 12:00"
                patientComplaint="Experiencing persistent headaches for the past week, especially in the morning. Also feeling fatigued."
                onMarkComplete={handleMarkComplete}
                onCancel={() => {}}
                onRate={() => setShowRatingModal(true)}
              />
            </div>

            {/* Sidebar - 1/3 width */}
            <div className="w-full lg:w-1/3 lg:min-w-0 flex flex-col gap-6">
              {/* Patient Profile */}
              <Card className="p-6 border border-border/50 shadow-xl bg-card/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg ring-2 ring-primary/10">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Patient Profile</h3>
                </div>
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold text-2xl shadow-xl ring-4 ring-primary/10">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-lg truncate mb-1">{displayName}</p>
                      <p className="text-sm text-muted-foreground capitalize font-medium">{userRole}</p>
                    </div>
                  </div>
                  <div className="pt-5 border-t border-border/50 space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/20">
                        <Mail className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-muted-foreground truncate font-medium">{userEmail}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/20">
                        <Phone className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-muted-foreground font-medium">+62 812-3456-7890</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Invoice & Receipt */}
              <Card className="p-6 border border-border/50 shadow-xl bg-card/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-foreground mb-1">Invoice & Receipt</h3>
                  <p className="text-xs text-muted-foreground font-medium">Payment required</p>
                </div>
                <div className="space-y-5">
                  {/* Invoice Info */}
                  <div className="p-5 bg-card/90 rounded-xl border border-border/50 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Invoice Number</p>
                        <p className="text-sm font-bold text-foreground">INV-2024-001234</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Date</p>
                        <p className="text-sm font-semibold text-foreground">Dec 5, 2024</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Consultation Fee</span>
                        <span className="text-sm font-semibold text-foreground">Rp 150.000</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Medication</span>
                        <span className="text-sm font-semibold text-foreground">Rp 75.000</span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <span className="text-sm font-bold text-foreground">Total</span>
                        <span className="text-xl font-bold text-primary">Rp 225.000</span>
                      </div>
                    </div>
                  </div>

                  {/* Medication Receipt */}
                  <div>
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                        <Pill className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Medication Receipt</p>
                    </div>
                    <div className="p-4 bg-accent/10 rounded-xl border border-accent/30 shadow-sm">
                      <p className="text-sm font-semibold text-foreground mb-1.5">Paracetamol 500mg</p>
                      <p className="text-xs text-muted-foreground mb-2">2x daily for 3 days • Qty: 1 box</p>
                      <p className="text-sm font-bold text-accent">Rp 75.000</p>
                    </div>
                  </div>

                  {/* Payment Button */}
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white gap-2 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                  >
                    <CreditCard className="w-5 h-5" />
                    Process Payment
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Rating Modal */}
          <ReviewDoctorModal
            isOpen={showRatingModal}
            onClose={() => setShowRatingModal(false)}
            doctorName="Dr. Sarah Johnson"
            onSubmit={(rating, feedback) => {
              console.log("Rating submitted:", rating, feedback)
              // TODO: Implement API call to submit review
            }}
          />

          {/* Appointment History */}
          <div className="mt-12 lg:mt-16">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">Past Appointments</h2>
                  <p className="text-sm text-muted-foreground">View your previous healthcare visits</p>
                </div>
                <Button
                  onClick={() => router.push("/patient/appointments")}
                  variant="outline"
                  className="border-2 border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 w-full sm:w-auto h-11 font-medium shadow-sm hover:shadow-md"
                >
                  <Calendar className="w-4 h-4" />
                  View All
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[
                {
                  date: "Dec 1, 2024",
                  doctor: "Dr. Sarah Johnson",
                  specialization: "General Practitioner",
                  clinic: "Central Health Clinic",
                  rating: 4.8,
                  reviews: 156,
                  image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
                },
                {
                  date: "Nov 15, 2024",
                  doctor: "Dr. Michael Chen",
                  specialization: "Cardiologist",
                  clinic: "Heart Care Medical Center",
                  rating: 4.9,
                  reviews: 203,
                  image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
                },
                {
                  date: "Oct 28, 2024",
                  doctor: "Dr. Priya Patel",
                  specialization: "Pediatrician",
                  clinic: "Kids Wellness Clinic",
                  rating: 4.7,
                  reviews: 128,
                  image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                },
            ].map((appointment, i) => {
              const initials = appointment.doctor
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()

              return (
                <Card key={i} className="p-6 border border-border/50 hover:shadow-2xl transition-all duration-500 bg-card/95 backdrop-blur-sm hover:border-primary/30 group">
                  <div className="space-y-5">
                    {/* Doctor Photo & Info */}
                    <div className="flex items-center gap-4">
                      <div className="relative w-18 h-18 rounded-2xl overflow-hidden border-2 border-border/50 flex-shrink-0 shadow-lg ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all" style={{ width: '4.5rem', height: '4.5rem' }}>
                        {appointment.image ? (
                          <>
                            <Image
                              src={appointment.image}
                              alt={appointment.doctor}
                              fill
                              unoptimized
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent) {
                                  const fallback = parent.querySelector('.image-fallback') as HTMLElement
                                  if (fallback) fallback.style.display = 'flex'
                                }
                              }}
                            />
                            <div className="image-fallback hidden w-full h-full items-center justify-center bg-gradient-to-br from-primary to-primary/80 text-white font-bold text-xl">
                              {initials}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 text-white font-bold text-xl">
                            {initials}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-lg mb-1 group-hover:text-primary transition-colors duration-300">{appointment.doctor}</p>
                        <p className="text-sm text-primary font-semibold mb-1">{appointment.specialization}</p>
                        <p className="text-sm text-muted-foreground truncate font-medium">{appointment.clinic}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-5 border-t border-border/50">
                      <p className="text-sm font-semibold text-muted-foreground">{appointment.date}</p>
                      <div className="flex items-center gap-1.5">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-base font-bold text-foreground">{appointment.rating}</span>
                        <span className="text-sm text-muted-foreground">({appointment.reviews})</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
              </div>
            </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
