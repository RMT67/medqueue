"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { QueueCard } from "@/components/queue-card"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Star, Clock, Calendar, ArrowRight, User, Mail, Phone, ListOrdered, Receipt, Pill, CreditCard } from "lucide-react"
import { ReviewDoctorModal } from "@/components/review-doctor-modal"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"

interface QueueData {
  bookingId: string
  bookingNumber: string
  queueNumber: string
  queueStatus: "waiting" | "being-served" | "completed"
  currentlyServing: string
  patientsAhead: number
  estimatedTime: number
  estimatedCallTime: string
  estimatedCallTimeFormatted: string
  estimatedCallTimeTimestamp: string
  appointmentDate: string
  appointmentTime: string
  appointmentDateFormatted: string
  timeRange: string
  patientComplaint: string
  doctor: {
    doctorId: string
    name: string
    specialization: string
    clinic: string
    rating: number
    totalReviews: number
    image: string
  }
}

interface InvoiceData {
  invoiceId: string
  invoiceNumber: string
  formattedDate: string
  status: string
  items: Array<{
    type: string
    name: string
    quantity: number
    unitPrice: number
    total: number
  }>
  subtotal: number
  total: number
  medicationReceipt: {
    medicines: Array<{
      name: string
      dosage: string
      quantity: number
      price: number
    }>
  } | null
}

interface PastAppointment {
  bookingId: string
  date: string
  formattedDate: string
  doctor: {
    name: string
    specialization: string
    clinic: string
    rating: number
    totalReviews: number
    image: string
  }
}

export default function MyQueuePage() {
  const router = useRouter()
  const { user, logout, isLoading } = useAuth()
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [queueData, setQueueData] = useState<QueueData | null>(null)
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null)
  const [pastAppointments, setPastAppointments] = useState<PastAppointment[]>([])
  const [isLoadingQueue, setIsLoadingQueue] = useState(true)
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "patient")) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // ✅ Fetch queue data
  useEffect(() => {
    const fetchQueueData = async () => {
      try {
        const token = localStorage.getItem("medqueue_token")
        if (!token) {
          setIsLoadingQueue(false)
          return
        }

        const response = await fetch("/api/patient/queue/active", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setQueueData(data)

          // ✅ Fetch invoice if booking exists
          if (data.bookingId) {
            const invoiceResponse = await fetch(`/api/patient/invoices?bookingId=${data.bookingId}&status=pending`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            if (invoiceResponse.ok) {
              const invoice = await invoiceResponse.json()
              setInvoiceData(invoice)
            }
          }
        } else if (response.status === 404) {
          // No active queue
          setQueueData(null)
        }
      } catch (error) {
        console.error("Error fetching queue data:", error)
      } finally {
        setIsLoadingQueue(false)
      }
    }

    if (user && user.role === "patient") {
      fetchQueueData()
      // Poll every 30 seconds for updates
      const interval = setInterval(fetchQueueData, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  // ✅ Fetch past appointments
  useEffect(() => {
    const fetchPastAppointments = async () => {
      try {
        const token = localStorage.getItem("medqueue_token")
        if (!token) return

        const response = await fetch("/api/patient/appointments?status=completed&limit=3", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setPastAppointments(data.appointments || [])
        }
      } catch (error) {
        console.error("Error fetching past appointments:", error)
      }
    }

    if (user && user.role === "patient") {
      fetchPastAppointments()
    }
  }, [user])

  // ✅ Dynamic countdown timer based on estimatedCallTimeTimestamp
  useEffect(() => {
    if (!queueData?.estimatedCallTimeTimestamp) {
      setTimeRemaining(0)
      return
    }

    const updateTimer = () => {
      const now = new Date()
      const callTime = new Date(queueData.estimatedCallTimeTimestamp)
      const diff = Math.max(0, Math.floor((callTime.getTime() - now.getTime()) / 1000))
      setTimeRemaining(diff)
    }

    updateTimer()
    const timer = setInterval(updateTimer, 1000)

    return () => clearInterval(timer)
  }, [queueData?.estimatedCallTimeTimestamp])

  if (isLoading || isLoadingQueue) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60

  const handleMarkComplete = async () => {
    if (!queueData) return

    try {
      const token = localStorage.getItem("medqueue_token")
      if (!token) return

      const response = await fetch(`/api/patient/queue/${queueData.bookingId}/complete`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        setShowRatingModal(true)
        setSelectedDoctor(queueData.doctor.name)
        // Refresh queue data
        const queueResponse = await fetch("/api/patient/queue/active", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (queueResponse.ok) {
          const data = await queueResponse.json()
          setQueueData(data)
        }
      }
    } catch (error) {
      console.error("Error completing appointment:", error)
    }
  }

  const handleCancel = async () => {
    if (!queueData) return

    if (!confirm("Are you sure you want to cancel this appointment?")) {
      return
    }

    try {
      const token = localStorage.getItem("medqueue_token")
      if (!token) return

      const response = await fetch(`/api/patient/queue/${queueData.bookingId}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cancelReason: "Cancelled by patient"
        }),
      })

      if (response.ok) {
        router.push("/patient/appointments")
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation isAuthenticated={true} userRole="patient" userName={user.name} onLogout={logout} />

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
        {queueData && (
          <div className="mb-8">
            <Card className="p-8 lg:p-10 border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/5 shadow-2xl backdrop-blur-md ring-1 ring-primary/10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div className="flex-1 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Time Until Your Turn</p>
                  <p className="text-6xl lg:text-7xl font-bold text-primary font-mono mb-4 tracking-tight">
                    {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                  </p>
                  <p className="text-sm text-muted-foreground font-medium">
                    {queueData.estimatedCallTimeFormatted || "You'll receive a notification 5 minutes before your turn"}
                  </p>
                </div>
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl flex-shrink-0 ring-4 ring-primary/20">
                  <Clock className="w-12 h-12 text-white drop-shadow-lg" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {!queueData && (
          <div className="mb-8">
            <Card className="p-8 lg:p-10 border border-border/50 text-center shadow-xl bg-card/95 backdrop-blur-sm">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-6 shadow-lg ring-4 ring-primary/10">
                  <ListOrdered className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-4">No Active Queue</h3>
                <p className="text-muted-foreground mb-8">You don't have any active appointments in queue.</p>
                <Button
                  onClick={() => router.push("/doctors")}
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground gap-2 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                >
                  Book an Appointment
                </Button>
              </div>
            </Card>
          </div>
        )}

        {queueData && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Queue Card - 2/3 width */}
            <div className="w-full lg:w-2/3 lg:min-w-0">
              <QueueCard
                currentlyServing={queueData.currentlyServing}
                patientsAhead={queueData.patientsAhead}
                estimatedTime={queueData.estimatedTime}
                doctorName={queueData.doctor.name}
                doctorSpecialization={queueData.doctor.specialization}
                doctorClinic={queueData.doctor.clinic}
                doctorRating={queueData.doctor.rating}
                doctorReviews={queueData.doctor.totalReviews}
                doctorImage={queueData.doctor.image}
                status={queueData.queueStatus}
                appointmentDate={queueData.appointmentDateFormatted}
                appointmentTime={queueData.appointmentTime}
                timeRange={queueData.timeRange}
                patientComplaint={queueData.patientComplaint}
                bookingId={queueData.bookingId}
                onMarkComplete={handleMarkComplete}
                onCancel={handleCancel}
                onRate={() => {
                  setSelectedDoctor(queueData.doctor.name)
                  setShowRatingModal(true)
                }}
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
                    {user?.name?.charAt(0).toUpperCase() || "P"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground text-lg truncate mb-1">{user?.name || "Patient"}</p>
                    <p className="text-sm text-muted-foreground capitalize font-medium">{user?.role || "Patient"}</p>
                  </div>
                </div>
                <div className="pt-5 border-t border-border/50 space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/20">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground truncate font-medium">{user?.email || "patient@example.com"}</span>
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
            {invoiceData && (
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
                        <p className="text-sm font-bold text-foreground">{invoiceData.invoiceNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Date</p>
                        <p className="text-sm font-semibold text-foreground">{invoiceData.formattedDate}</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border/50 space-y-2.5">
                      {invoiceData.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{item.name}</span>
                          <span className="text-sm font-semibold text-foreground">
                            Rp {item.total.toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <span className="text-sm font-bold text-foreground">Total</span>
                        <span className="text-xl font-bold text-primary">
                          Rp {invoiceData.total.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Medication Receipt */}
                  {invoiceData.medicationReceipt && invoiceData.medicationReceipt.medicines.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                          <Pill className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Medication Receipt</p>
                      </div>
                      {invoiceData.medicationReceipt.medicines.map((medicine, index) => (
                        <div key={index} className="p-4 bg-accent/10 rounded-xl border border-accent/30 shadow-sm mb-3">
                          <p className="text-sm font-semibold text-foreground mb-1.5">{medicine.name}</p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {medicine.dosage} • Qty: {medicine.quantity}
                          </p>
                          <p className="text-sm font-bold text-accent">
                            Rp {medicine.price.toLocaleString("id-ID")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Payment Button */}
                  <Button
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white gap-2 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                  >
                    <CreditCard className="w-5 h-5" />
                    Process Payment
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
        )}

        {/* Rating Modal */}
        {selectedDoctor && queueData && (
          <ReviewDoctorModal
            isOpen={showRatingModal}
            onClose={() => {
              setShowRatingModal(false)
              setSelectedDoctor(null)
            }}
            doctorName={selectedDoctor}
            onSubmit={async (rating, feedback) => {
              try {
                const token = localStorage.getItem("medqueue_token")
                if (!token) return

                const response = await fetch("/api/patient/reviews", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    bookingId: queueData.bookingId,
                    doctorId: queueData.doctor.doctorId,
                    rating: rating,
                    comment: feedback || "",
                  }),
                })

                if (response.ok) {
                  setShowRatingModal(false)
                  setSelectedDoctor(null)
                  // Refresh queue data
                  const queueResponse = await fetch("/api/patient/queue/active", {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  })
                  if (queueResponse.ok) {
                    const data = await queueResponse.json()
                    setQueueData(data)
                  }
                } else {
                  const error = await response.json()
                  alert(error.error || "Failed to submit review")
                }
              } catch (error) {
                console.error("Error submitting review:", error)
                alert("Failed to submit review")
              }
            }}
          />
        )}

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
              {pastAppointments.length > 0 ? (
                pastAppointments.map((appointment) => {
                  const initials = appointment.doctor.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()

                  return (
                    <Card key={appointment.bookingId} className="p-6 border border-border/50 hover:shadow-2xl transition-all duration-500 bg-card/95 backdrop-blur-sm hover:border-primary/30 group">
                      <div className="space-y-5">
                        {/* Doctor Photo & Info */}
                        <div className="flex items-center gap-4">
                          <div className="relative w-18 h-18 rounded-2xl overflow-hidden border-2 border-border/50 flex-shrink-0 shadow-lg ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all" style={{ width: '4.5rem', height: '4.5rem' }}>
                            {appointment.doctor.image ? (
                              <>
                                <Image
                                  src={appointment.doctor.image}
                                  alt={appointment.doctor.name}
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
                            <p className="font-bold text-foreground text-lg mb-1 group-hover:text-primary transition-colors duration-300">{appointment.doctor.name}</p>
                            <p className="text-sm text-primary font-semibold mb-1">{appointment.doctor.specialization}</p>
                            <p className="text-sm text-muted-foreground truncate font-medium">{appointment.doctor.clinic}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-5 border-t border-border/50">
                          <p className="text-sm font-semibold text-muted-foreground">{appointment.formattedDate}</p>
                          {appointment.doctor.rating > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                              <span className="text-base font-bold text-foreground">{appointment.doctor.rating.toFixed(1)}</span>
                              {appointment.doctor.totalReviews > 0 && (
                                <span className="text-sm text-muted-foreground">({appointment.doctor.totalReviews})</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })
              ) : (
                <div className="col-span-3 text-center py-8 text-muted-foreground">
                  No past appointments found
                </div>
              )}
            </div>
          </div>
      </main>
    </div>
  )
}
