"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { Clock, Calendar, FileText, Stethoscope, ArrowRight, Sparkles, TrendingUp, Activity, Receipt, CreditCard, Pill, AlertCircle, User, Star } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { FadeIn } from "@/components/animations"
import { DoctorCardGrid } from "@/components/doctor-card-grid"

export default function PatientDashboardPage() {
  const router = useRouter()
  const { user, logout } = useAuth()

  const menuCards = [
    {
      id: "queue",
      title: "My Queue",
      description: "Track your appointments and queue position in real-time",
      icon: Clock,
      href: "/my-queue",
      color: "primary",
      gradient: "from-primary to-primary/80",
      bgGradient: "from-primary/10 to-primary/5",
      available: true,
    },
    {
      id: "appointment",
      title: "My Appointment",
      description: "View and manage your scheduled appointments",
      icon: Calendar,
      href: "/patient/appointments",
      color: "primary",
      gradient: "from-primary to-primary/80",
      bgGradient: "from-primary/10 to-primary/5",
      available: true,
    },
    {
      id: "record",
      title: "Medical Record",
      description: "Access your complete health history and records",
      icon: FileText,
      href: "/patient/medical-record",
      color: "primary",
      gradient: "from-primary to-primary/80",
      bgGradient: "from-primary/10 to-primary/5",
      available: true,
    },
  ]

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
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground flex items-center gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                      <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Dashboard
                    </span>
                  </h1>
                  <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
                    Welcome back, <span className="font-semibold text-foreground">{user?.name}</span>! Manage your healthcare journey from here.
                  </p>
                </div>
                
                {/* Quick Stats */}
                <div className="flex gap-4 flex-shrink-0">
                  <Card className="px-5 py-4 bg-card/90 backdrop-blur-md border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/10">
                        <Activity className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-foreground">Active</div>
                        <div className="text-xs text-muted-foreground font-medium">Queue</div>
                      </div>
                    </div>
                  </Card>
                  <Card className="px-5 py-4 bg-card/90 backdrop-blur-md border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center ring-2 ring-accent/10">
                        <TrendingUp className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-foreground">Health</div>
                        <div className="text-xs text-muted-foreground font-medium">Status</div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <FadeIn direction="up" delay={100}>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {menuCards.map((card, index) => {
                const Icon = card.icon
                const isPrimary = card.id === "queue"
                return (
                  <FadeIn key={card.id} direction="up" delay={index * 100}>
                    <Card className={`group relative overflow-hidden border transition-all duration-500 hover:shadow-2xl h-full flex flex-col ${
                      !card.available ? "opacity-75" : ""
                    } ${
                      isPrimary 
                        ? "border-primary/30 bg-gradient-to-br from-primary/5 via-card to-primary/5 shadow-xl hover:border-primary/50 hover:shadow-2xl ring-1 ring-primary/10" 
                        : "border-border/50 bg-card/95 backdrop-blur-sm hover:border-primary/30 hover:shadow-xl"
                    }`}>
                      {/* Subtle gradient overlay on hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                      
                      {/* Shine effect on hover */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                      <div className={`relative flex-1 flex flex-col ${isPrimary ? "p-8" : "p-6"}`}>
                        {/* Icon */}
                        <div className={`rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ring-4 ring-white/10 ${
                          isPrimary ? "w-20 h-20" : "w-16 h-16"
                        }`}>
                          <Icon className={`text-white drop-shadow-sm ${isPrimary ? "w-10 h-10" : "w-8 h-8"}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-3">
                          <h3 className={`font-bold text-foreground group-hover:text-primary transition-colors duration-300 ${
                            isPrimary ? "text-2xl" : "text-xl"
                          }`}>
                            {card.title}
                          </h3>
                          <p className={`text-muted-foreground leading-relaxed ${
                            isPrimary ? "text-base" : "text-sm"
                          }`}>
                            {card.description}
                          </p>
                        </div>

                        {/* Action Button */}
                        {card.available ? (
                          <Link href={card.href} className="mt-6">
                            <Button 
                              className={`w-full bg-gradient-to-r ${card.gradient} hover:opacity-95 text-white gap-2 group-hover:shadow-xl transition-all duration-300 font-semibold relative overflow-hidden ${
                                isPrimary ? "h-12 text-base shadow-lg" : "h-11 shadow-md"
                              }`}
                            >
                              <span className="relative z-10 flex items-center justify-center gap-2">
                                {card.id === "queue" ? "View Queue" : 
                                 card.id === "appointment" ? "View Appointments" :
                                 card.id === "record" ? "View Records" : "Open"}
                                <ArrowRight className={`group-hover:translate-x-1 transition-transform duration-300 ${
                                  isPrimary ? "w-5 h-5" : "w-4 h-4"
                                }`} />
                              </span>
                              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            </Button>
                          </Link>
                        ) : (
                          <Button 
                            className="w-full bg-muted text-muted-foreground cursor-not-allowed mt-6" 
                            disabled
                          >
                            Coming Soon
                          </Button>
                        )}
                      </div>
                    </Card>
                  </FadeIn>
                )
              })}
            </div>
          </FadeIn>

          {/* Pending Payment Section */}
          <FadeIn direction="up" delay={400}>
            <div className="mt-12 lg:mt-16">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg ring-4 ring-amber-100 dark:ring-amber-900/30">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Pending Payment</h2>
                  <p className="text-sm text-muted-foreground mt-1">Invoice and receipt that require payment</p>
                </div>
              </div>

              <Card className="p-8 border border-amber-200/50 dark:border-amber-800/50 shadow-2xl bg-gradient-to-br from-amber-50/40 via-card to-amber-50/20 dark:from-amber-950/30 dark:via-card dark:to-amber-950/10 backdrop-blur-md ring-1 ring-amber-100/50 dark:ring-amber-900/20">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Invoice Info */}
                  <div className="flex-1 space-y-5">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-foreground mb-1">Invoice & Receipt</h3>
                      <p className="text-xs text-muted-foreground font-medium">Payment required</p>
                    </div>

                    <div className="p-5 bg-card/90 rounded-xl border border-border/50 shadow-lg backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Invoice Number</p>
                          <p className="text-sm font-bold text-foreground">INV-2024-001234</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Due Date</p>
                          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Dec 7, 2024</p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Consultation Fee</span>
                          <span className="text-sm font-semibold text-foreground">Rp 150.000</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Medication</span>
                          <span className="text-sm font-semibold text-foreground">Rp 75.000</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="text-sm font-bold text-foreground">Total Amount</span>
                          <span className="text-xl font-bold text-amber-600 dark:text-amber-400">Rp 225.000</span>
                        </div>
                      </div>
                    </div>

                    {/* Medication Receipt */}
                    <div>
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
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
                  </div>

                  {/* Action Section */}
                  <div className="lg:w-96 flex flex-col justify-between gap-6">
                    <div className="space-y-5">
                      {/* Doctor Information */}
                      <div className="p-5 bg-card/90 rounded-xl border border-border/50 shadow-lg backdrop-blur-sm">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-border/50 flex-shrink-0 shadow-md ring-2 ring-primary/10">
                            <img
                              src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                              alt="Dr. Sarah Johnson"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent) {
                                  const fallback = parent.querySelector('.doctor-fallback') as HTMLElement
                                  if (fallback) fallback.style.display = 'flex'
                                }
                              }}
                            />
                            <div className="doctor-fallback hidden w-full h-full items-center justify-center bg-gradient-to-br from-primary to-primary/80 text-white font-bold text-base">
                              SJ
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground text-base truncate mb-0.5">Dr. Sarah Johnson</p>
                            <p className="text-xs text-muted-foreground truncate mb-2">General Practitioner</p>
                            <div className="flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs font-bold text-foreground">4.8</span>
                              <span className="text-xs text-muted-foreground">(156 reviews)</span>
                            </div>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-border/50">
                          <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Clinic</p>
                          <p className="text-sm font-medium text-foreground">Central Health Clinic</p>
                        </div>
                      </div>

                      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/50 rounded-xl shadow-sm">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-800 dark:text-amber-200 font-medium leading-relaxed">
                            Payment is due in 2 days. Please complete payment to avoid service interruption.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Button
                        onClick={() => router.push("/my-queue")}
                        className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white gap-2 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                      >
                        <CreditCard className="w-5 h-5" />
                        Process Payment
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/my-queue")}
                        className="w-full h-11 border-2 border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all duration-300 font-medium"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </FadeIn>

          {/* Recommended Doctors Section */}
          <FadeIn direction="up" delay={500}>
            <div className="mt-12 lg:mt-16">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">Recommended Doctors</h2>
                  <p className="text-sm text-muted-foreground">Top-rated healthcare professionals for you</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.push("/doctors")}
                  className="border-2 border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 font-medium shadow-sm hover:shadow-md"
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <DoctorCardGrid
                  id="1"
                  name="Dr. Sarah Johnson"
                  specialization="General Practitioner"
                  clinic="Central Health Clinic"
                  schedule="08:00 - 12:00"
                  rating={4.8}
                  reviews={156}
                  image="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                />
                <DoctorCardGrid
                  id="2"
                  name="Dr. Michael Chen"
                  specialization="Cardiologist"
                  clinic="Heart Care Medical Center"
                  schedule="09:00 - 15:00"
                  rating={4.9}
                  reviews={203}
                  image="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                />
                <DoctorCardGrid
                  id="3"
                  name="Dr. Priya Patel"
                  specialization="Pediatrician"
                  clinic="Kids Wellness Clinic"
                  schedule="10:00 - 14:00"
                  rating={4.7}
                  reviews={128}
                  image="https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                />
                <DoctorCardGrid
                  id="4"
                  name="Dr. James Wilson"
                  specialization="Dermatologist"
                  clinic="Skin Care Specialists"
                  schedule="11:00 - 16:00"
                  rating={4.6}
                  reviews={89}
                  image="https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                />
              </div>
            </div>
          </FadeIn>
        </main>
      </div>
    </ProtectedRoute>
  )
}

