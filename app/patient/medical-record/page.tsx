"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { FileText, Calendar, Stethoscope, Pill, Activity, Search, Filter, ArrowLeft, MapPin } from "lucide-react"
import Image from "next/image"
import { ProtectedRoute } from "@/components/protected-route"
import { FadeIn, StaggerChildren } from "@/components/animations"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"

// Mock data
const MEDICAL_RECORDS = [
  {
    id: "1",
    date: "Dec 5, 2024",
    type: "Consultation",
    doctor: "Dr. Sarah Johnson",
    specialization: "General Practitioner",
    clinic: "Central Health Clinic",
    diagnosis: "Headache and Fatigue",
    prescription: "Paracetamol 500mg - 2x daily for 3 days",
    notes: "Patient experiencing persistent headaches for the past week, especially in the morning. Also feeling fatigued. Recommended rest and follow-up if symptoms persist.",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    attachments: ["Lab_Results_Dec5.pdf"],
  },
  {
    id: "2",
    date: "Nov 15, 2024",
    type: "Check-up",
    doctor: "Dr. Michael Chen",
    specialization: "Cardiologist",
    clinic: "Heart Care Medical Center",
    diagnosis: "Routine Cardiovascular Check",
    prescription: "No medication needed",
    notes: "Regular check-up. Blood pressure and heart rate are within normal range. Continue healthy lifestyle and exercise.",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
    attachments: ["ECG_Report_Nov15.pdf"],
  },
  {
    id: "3",
    date: "Oct 28, 2024",
    type: "Consultation",
    doctor: "Dr. Priya Patel",
    specialization: "Pediatrician",
    clinic: "Kids Wellness Clinic",
    diagnosis: "Seasonal Allergy",
    prescription: "Cetirizine 10mg - 1x daily for 7 days",
    notes: "Patient showing symptoms of seasonal allergies. Prescribed antihistamine and advised to avoid allergens.",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    attachments: [],
  },
]

const RECORD_TYPES = ["All", "Consultation", "Check-up", "Lab Results", "Prescription"]

export default function MedicalRecordPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("All")
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null)

  const filteredRecords = MEDICAL_RECORDS.filter((record) => {
    const matchesSearch =
      record.doctor.toLowerCase().includes(search.toLowerCase()) ||
      record.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
      record.type.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === "All" || record.type === filterType
    return matchesSearch && matchesType
  })

  const toggleExpand = (id: string) => {
    setExpandedRecord(expandedRecord === id ? null : id)
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
                      <FileText className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Medical Record
                    </span>
                  </h1>
                  <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
                    Access your complete health history and records
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          {/* Search and Filter */}
          <FadeIn direction="up" delay={100}>
            <div className="mb-10">
              <Card className="p-6 border border-border/50 shadow-xl bg-card/95 backdrop-blur-sm">
                <div className="flex gap-4 flex-col lg:flex-row items-stretch">
                  <div className="relative flex-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none">
                      <Search className="w-5 h-5" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Search by doctor, diagnosis, or type..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-12 pr-4 h-12 text-base border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                    />
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <div className="flex gap-2 bg-card/80 backdrop-blur-sm p-1.5 rounded-xl border border-border/50 shadow-sm">
                      {RECORD_TYPES.map((type) => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                            filterType === type
                              ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </FadeIn>

          {/* Medical Records List */}
          {filteredRecords.length > 0 ? (
            <StaggerChildren staggerDelay={50}>
              <div className="space-y-4">
                {filteredRecords.map((record) => {
                  const initials = record.doctor
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()

                  return (
                    <Card
                      key={record.id}
                      className="border border-border/50 hover:shadow-2xl transition-all duration-500 bg-card/95 backdrop-blur-sm hover:border-primary/30 group"
                    >
                      <div className="p-8">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-8">
                          {/* Doctor Photo & Info */}
                          <div className="flex items-center gap-5 flex-1 min-w-0">
                            {/* Doctor Photo */}
                            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-border/50 flex-shrink-0 shadow-lg ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all">
                              {record.image ? (
                                <>
                                  <Image
                                    src={record.image}
                                    alt={record.doctor}
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
                                    {initials}
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/80 text-white font-bold text-2xl">
                                  {initials}
                                </div>
                              )}
                            </div>

                            {/* Doctor Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-3 flex-wrap">
                                <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                                  {record.doctor}
                                </h3>
                                <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-semibold border border-primary/20 shadow-sm">
                                  {record.date}
                                </span>
                              </div>
                              <p className="text-sm text-primary font-semibold mb-3">{record.specialization}</p>
                              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4 flex-shrink-0 text-primary" />
                                <span className="truncate font-medium">{record.clinic}</span>
                              </div>
                            </div>
                          </div>

                          {/* Type Badge & Button */}
                          <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="px-5 py-2.5 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20 shadow-sm">
                              <div className="flex items-center gap-2.5">
                                <FileText className="w-4 h-4 text-primary" />
                                <span className="text-sm font-semibold text-foreground">{record.type}</span>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => toggleExpand(record.id)}
                              className={`border-2 transition-all duration-300 font-semibold ${
                                expandedRecord === record.id
                                  ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground border-primary hover:from-primary/90 hover:to-primary shadow-lg"
                                  : "hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-md"
                              }`}
                            >
                              {expandedRecord === record.id ? "Hide Details" : "View Details"}
                            </Button>
                          </div>
                        </div>

                        {/* Diagnosis */}
                        <div className="mb-6 p-5 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 rounded-xl border border-primary/20 shadow-sm">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                              <Activity className="w-5 h-5 text-primary" />
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Diagnosis
                            </span>
                          </div>
                          <p className="text-lg font-bold text-foreground">{record.diagnosis}</p>
                        </div>

                      {/* Expanded Details */}
                      {expandedRecord === record.id && (
                        <div className="mt-8 pt-8 border-t border-border/50 space-y-6 animate-in fade-in slide-in-from-top-2">
                          {/* Prescription */}
                          {record.prescription && (
                            <div className="p-5 bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl border border-accent/30 shadow-sm">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center ring-1 ring-accent/30">
                                  <Pill className="w-5 h-5 text-accent" />
                                </div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  Prescription
                                </span>
                              </div>
                              <p className="text-base font-semibold text-foreground leading-relaxed">
                                {record.prescription}
                              </p>
                            </div>
                          )}

                          {/* Notes */}
                          {record.notes && (
                            <div className="p-5 bg-card/80 rounded-xl border border-border/50 shadow-sm backdrop-blur-sm">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center ring-1 ring-secondary/30">
                                  <FileText className="w-5 h-5 text-secondary" />
                                </div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  Notes
                                </span>
                              </div>
                              <p className="text-sm text-foreground leading-relaxed">
                                {record.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                  )
                })}
              </div>
            </StaggerChildren>
          ) : (
            <FadeIn direction="up" delay={0}>
              <Card className="border border-border/50 p-12 lg:p-16 text-center shadow-xl bg-card/95 backdrop-blur-sm">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-6 shadow-lg ring-4 ring-primary/10">
                    <FileText className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-3xl font-bold text-foreground mb-4">No records found</h3>
                  <p className="text-muted-foreground mb-8 leading-relaxed text-base">
                    {search || filterType !== "All"
                      ? "No medical records match your search criteria. Try adjusting your filters."
                      : "You don't have any medical records yet. Your records will appear here after your appointments."}
                  </p>
                  {search && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch("")
                        setFilterType("All")
                      }}
                      className="border-2 border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 font-semibold shadow-sm hover:shadow-md"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </Card>
            </FadeIn>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}

