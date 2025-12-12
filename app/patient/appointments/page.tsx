"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { Calendar, Clock, MapPin, Stethoscope, Star, CheckCircle2, XCircle, Hourglass, ArrowLeft, MessageSquare } from "lucide-react"
import Image from "next/image"
import { ProtectedRoute } from "@/components/protected-route"
import { FadeIn, StaggerChildren } from "@/components/animations"
import { ReviewDoctorModal } from "@/components/review-doctor-modal"

// Mock data
const APPOINTMENTS = [
  {
    id: "1",
    date: "Dec 5, 2024",
    time: "10:30 AM",
    doctor: "Dr. Sarah Johnson",
    specialization: "General Practitioner",
    clinic: "Central Health Clinic",
    status: "completed",
    rating: 4.8,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "2",
    date: "Nov 15, 2024",
    time: "02:00 PM",
    doctor: "Dr. Michael Chen",
    specialization: "Cardiologist",
    clinic: "Heart Care Medical Center",
    status: "completed",
    rating: 4.9,
    reviews: 203,
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "3",
    date: "Oct 28, 2024",
    time: "09:00 AM",
    doctor: "Dr. Priya Patel",
    specialization: "Pediatrician",
    clinic: "Kids Wellness Clinic",
    status: "completed",
    rating: 4.7,
    reviews: 128,
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "4",
    date: "Dec 10, 2024",
    time: "11:00 AM",
    doctor: "Dr. Sarah Johnson",
    specialization: "General Practitioner",
    clinic: "Central Health Clinic",
    status: "upcoming",
    rating: null,
    reviews: null,
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
]

export default function MyAppointmentsPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [filter, setFilter] = useState<"all" | "upcoming" | "completed" | "cancelled">("all")
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null)

  const filteredAppointments = APPOINTMENTS.filter((appointment) => {
    if (filter === "all") return true
    return appointment.status === filter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50/80 dark:bg-green-950/30 text-green-700 dark:text-green-300 rounded-xl text-xs font-semibold border border-green-200/50 dark:border-green-800/50 shadow-sm ring-1 ring-green-200/50">
            <CheckCircle2 className="w-4 h-4" />
            Completed
          </div>
        )
      case "upcoming":
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50/80 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-semibold border border-amber-200/50 dark:border-amber-800/50 shadow-sm ring-1 ring-amber-200/50">
            <Hourglass className="w-4 h-4" />
            Upcoming
          </div>
        )
      case "cancelled":
        return (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50/80 dark:bg-red-950/30 text-red-700 dark:text-red-300 rounded-xl text-xs font-semibold border border-red-200/50 dark:border-red-800/50 shadow-sm ring-1 ring-red-200/50">
            <XCircle className="w-4 h-4" />
            Cancelled
          </div>
        )
      default:
        return null
    }
  }

  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Navigation isAuthenticated={true} userRole="patient" userName={user?.name} onLogout={logout} />

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
            <FadeIn direction="up" delay={0}>
              <div className="flex flex-col gap-6">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/patient/dashboard")}
                  className="w-fit gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Button>
                <div className="space-y-3">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground flex items-center gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg ring-4 ring-primary/10">
                      <Calendar className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      My Appointments
                    </span>
                  </h1>
                  <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
                    View and manage your scheduled appointments
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          {/* Filter Tabs */}
          <FadeIn direction="up" delay={100}>
            <div className="mb-10">
              <div className="flex gap-3 bg-card/80 backdrop-blur-sm p-1.5 rounded-xl border border-border/50 shadow-lg inline-flex flex-wrap">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    filter === "all"
                      ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("upcoming")}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    filter === "upcoming"
                      ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setFilter("completed")}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    filter === "completed"
                      ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setFilter("cancelled")}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    filter === "cancelled"
                      ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  Cancelled
                </button>
              </div>
            </div>
          </FadeIn>

          {/* Appointments List */}
          {filteredAppointments.length > 0 ? (
            <StaggerChildren staggerDelay={50}>
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => (
                  <Card
                    key={appointment.id}
                    className="p-8 border border-border/50 hover:shadow-2xl transition-all duration-500 bg-card/95 backdrop-blur-sm hover:border-primary/30 group"
                  >
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                      {/* Date & Time */}
                      <div className="flex items-center gap-5 flex-shrink-0">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex flex-col items-center justify-center text-white shadow-xl ring-4 ring-primary/10">
                          <span className="text-xs font-semibold">
                            {appointment.date.split(" ")[0]}
                          </span>
                          <span className="text-3xl font-bold">
                            {appointment.date.split(" ")[1].replace(",", "")}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5 text-sm text-muted-foreground mb-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                              <Clock className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-semibold">{appointment.time}</span>
                          </div>
                          <div className="text-xs text-muted-foreground font-medium">{appointment.date}</div>
                        </div>
                      </div>

                      {/* Doctor Photo & Info */}
                      <div className="flex items-start gap-5 flex-1 min-w-0">
                        {/* Doctor Photo */}
                        <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-border/50 flex-shrink-0 shadow-lg ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all">
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
                              <div className="image-fallback hidden w-full h-full items-center justify-center bg-gradient-to-br from-primary to-primary/80 text-white font-bold text-2xl">
                                {appointment.doctor
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 text-white font-bold text-2xl">
                              {appointment.doctor
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Doctor Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                                {appointment.doctor}
                              </h3>
                              <p className="text-sm text-primary font-semibold mb-3">{appointment.specialization}</p>
                              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4 flex-shrink-0 text-primary" />
                                <span className="truncate font-medium">{appointment.clinic}</span>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {getStatusBadge(appointment.status)}
                            </div>
                          </div>

                          {/* Rating and Review Button for completed appointments */}
                          {appointment.status === "completed" && (
                            <div className="flex items-center justify-between gap-4">
                              {appointment.rating && (
                                <div className="flex items-center gap-1.5">
                                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                  <span className="text-base font-bold text-foreground">{appointment.rating}</span>
                                  {appointment.reviews && (
                                    <span className="text-sm text-muted-foreground">({appointment.reviews})</span>
                                  )}
                                </div>
                              )}
                              <Button
                                onClick={() => {
                                  setSelectedDoctor(appointment.doctor)
                                  setShowReviewModal(true)
                                }}
                                variant="outline"
                                className="flex-shrink-0 border-2 border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 font-semibold gap-2"
                              >
                                <MessageSquare className="w-4 h-4" />
                                Review Doctor
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </StaggerChildren>
          ) : (
            <FadeIn direction="up" delay={0}>
              <Card className="border border-border/50 p-12 lg:p-16 text-center shadow-xl bg-card/95 backdrop-blur-sm">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-6 shadow-lg ring-4 ring-primary/10">
                    <Calendar className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-3xl font-bold text-foreground mb-4">No appointments found</h3>
                  <p className="text-muted-foreground mb-8 leading-relaxed text-base">
                    {filter === "upcoming"
                      ? "You don't have any upcoming appointments. Book one now!"
                      : filter === "completed"
                      ? "You don't have any completed appointments yet."
                      : filter === "cancelled"
                      ? "You don't have any cancelled appointments."
                      : "You don't have any appointments yet."}
                  </p>
                  {filter === "upcoming" && (
                    <Button
                      onClick={() => router.push("/doctors")}
                      className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground gap-2 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                    >
                      <Stethoscope className="w-5 h-5" />
                      Find a Doctor
                    </Button>
                  )}
                </div>
              </Card>
            </FadeIn>
          )}

          {/* Review Doctor Modal */}
          {selectedDoctor && (
            <ReviewDoctorModal
              isOpen={showReviewModal}
              onClose={() => {
                setShowReviewModal(false)
                setSelectedDoctor(null)
              }}
              doctorName={selectedDoctor}
              onSubmit={(rating, feedback) => {
                console.log("Rating submitted for", selectedDoctor, ":", rating, feedback)
                // TODO: Implement API call to submit review
                setShowReviewModal(false)
                setSelectedDoctor(null)
              }}
            />
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}

