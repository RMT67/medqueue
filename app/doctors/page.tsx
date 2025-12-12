"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { DoctorCard } from "@/components/doctor-card"
import { DoctorCardGrid } from "@/components/doctor-card-grid"
import { Search, Filter, Stethoscope, Users, Star, X, TrendingUp, UserSearch, List, Grid3x3 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { FadeIn, StaggerChildren } from "@/components/animations"

// Mock data
const DOCTORS = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    specialization: "General Practitioner",
    clinic: "Central Health Clinic",
    schedule: "08:00 - 12:00",
    rating: 4.8,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "2",
    name: "Dr. Michael Chen",
    specialization: "Cardiologist",
    clinic: "Heart Care Medical Center",
    schedule: "09:00 - 15:00",
    rating: 4.9,
    reviews: 203,
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "3",
    name: "Dr. Priya Patel",
    specialization: "Pediatrician",
    clinic: "Kids Wellness Clinic",
    schedule: "10:00 - 14:00",
    rating: 4.7,
    reviews: 128,
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "4",
    name: "Dr. James Wilson",
    specialization: "Dermatologist",
    clinic: "Skin Care Specialists",
    schedule: "11:00 - 16:00",
    rating: 4.6,
    reviews: 89,
    image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "5",
    name: "Dr. Emma Rodriguez",
    specialization: "Orthopedist",
    clinic: "Bone & Joint Center",
    schedule: "08:00 - 13:00",
    rating: 4.8,
    reviews: 142,
    image: "https://images.unsplash.com/photo-1607990281513-1c032ebab258?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "6",
    name: "Dr. Ahmed Hassan",
    specialization: "Neurologist",
    clinic: "Brain Health Institute",
    schedule: "12:00 - 17:00",
    rating: 4.9,
    reviews: 175,
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
]

const SPECIALIZATIONS = [
  "All Specializations",
  "General Practitioner",
  "Cardiologist",
  "Pediatrician",
  "Dermatologist",
  "Orthopedist",
  "Neurologist",
]

export default function DoctorsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [specialization, setSpecialization] = useState("All Specializations")
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid")

  const filteredDoctors = DOCTORS.filter((doctor) => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(search.toLowerCase()) ||
      doctor.clinic.toLowerCase().includes(search.toLowerCase())
    const matchesSpecialization = specialization === "All Specializations" || doctor.specialization === specialization

    return matchesSearch && matchesSpecialization
  })

  const hasActiveFilters = search !== "" || specialization !== "All Specializations"

  const clearFilters = () => {
    setSearch("")
    setSpecialization("All Specializations")
  }

  return (
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
          <FadeIn direction="up" delay={0}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground flex items-center gap-4">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg ring-4 ring-primary/10">
                    <UserSearch className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Find Your <span className="text-primary">Doctor</span>
                  </span>
                </h1>
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
                  Browse our network of qualified healthcare professionals
                </p>
              </div>

            {/* Quick Stats Cards */}
            <div className="flex gap-4 flex-shrink-0">
              <Card className="px-5 py-4 bg-card/90 backdrop-blur-md border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/10">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-foreground">{DOCTORS.length}+</div>
                    <div className="text-xs text-muted-foreground font-medium">Doctors</div>
                  </div>
                </div>
              </Card>
              <Card className="px-5 py-4 bg-card/90 backdrop-blur-md border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-900/20 flex items-center justify-center ring-2 ring-yellow-200/50 dark:ring-yellow-800/30">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-foreground">4.8</div>
                    <div className="text-xs text-muted-foreground font-medium">Avg Rating</div>
                  </div>
                </div>
              </Card>
            </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        {/* Search & Filter Bar */}
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
                  placeholder="Search by doctor name, clinic, or specialization..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 h-12 text-base border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl transition-all"
                />
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant={showFilters || specialization !== "All Specializations" ? "default" : "outline"}
                  size="lg"
                  className="gap-2 px-6 h-12 whitespace-nowrap font-semibold shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <Filter className="w-5 h-5" />
                  <span className="hidden sm:inline">Filters</span>
                  {(showFilters || specialization !== "All Specializations") && (
                    <span className="ml-1 px-2 py-0.5 bg-primary-foreground/20 rounded-full text-xs font-bold">
                      {specialization !== "All Specializations" ? "1" : "0"}
                    </span>
                  )}
                </Button>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    size="lg"
                    className="gap-2 px-4 h-12 whitespace-nowrap border-2 border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all duration-300 font-medium"
                  >
                    <X className="w-5 h-5" />
                    <span className="hidden sm:inline">Clear</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="mt-6 pt-6 border-t border-border/50 flex flex-wrap gap-3">
                {search && (
                  <div className="flex items-center gap-2.5 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-semibold border border-primary/20 shadow-sm">
                    <Search className="w-4 h-4 flex-shrink-0" />
                    <span>"{search}"</span>
                    <button
                      onClick={() => setSearch("")}
                      className="hover:bg-primary/20 rounded-lg p-1 transition-colors flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {specialization !== "All Specializations" && (
                  <div className="flex items-center gap-2.5 px-4 py-2 bg-accent/10 text-accent rounded-xl text-sm font-semibold border border-accent/20 shadow-sm">
                    <Stethoscope className="w-4 h-4 flex-shrink-0" />
                    <span>{specialization}</span>
                    <button
                      onClick={() => setSpecialization("All Specializations")}
                      className="hover:bg-accent/20 rounded-lg p-1 transition-colors flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </Card>
          </div>
        </FadeIn>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="mb-8">
            <Card className="p-6 lg:hidden border border-border/50 shadow-xl bg-card/95 backdrop-blur-sm">
              <div className="space-y-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-foreground text-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                      <Filter className="w-4 h-4 text-primary" />
                    </div>
                    Filters
                  </h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    Specialization
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {SPECIALIZATIONS.map((spec) => (
                      <button
                        key={spec}
                        onClick={() => {
                          setSpecialization(spec)
                          setShowFilters(false)
                        }}
                        className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border-2 ${
                          specialization === spec
                            ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground border-primary shadow-md"
                            : "bg-card hover:bg-muted text-foreground border-border/50 hover:border-primary/30"
                        }`}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-6 lg:gap-8 items-start">
          {/* Desktop Filters */}
          <div className="hidden lg:block lg:col-span-1">
            <Card className="border border-border/50 p-6 sticky top-24 shadow-xl bg-card/95 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-foreground text-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                    <Filter className="w-4 h-4 text-primary" />
                  </div>
                  Filters
                </h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-primary hover:underline font-semibold transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wider flex items-center gap-2.5">
                  <Stethoscope className="w-4 h-4" />
                  Specialization
                </h4>
                <div className="space-y-2.5">
                  {SPECIALIZATIONS.map((spec) => (
                    <button
                      key={spec}
                      onClick={() => setSpecialization(spec)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border-2 ${
                        specialization === spec
                          ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground border-primary shadow-md"
                          : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border/50 hover:border-primary/30"
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Doctor Grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  {filteredDoctors.length} {filteredDoctors.length === 1 ? "Doctor" : "Doctors"} Found
                </h2>
                {hasActiveFilters ? (
                  <p className="text-sm text-muted-foreground flex items-center gap-2.5 font-medium">
                    <TrendingUp className="w-4 h-4" />
                    Based on your search criteria
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground font-medium">All available doctors in our network</p>
                )}
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm p-1.5 rounded-xl border border-border/50 shadow-sm">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 rounded-lg transition-all duration-300 ${
                    viewMode === "list"
                      ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                  title="List View"
                >
                  <List className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 rounded-lg transition-all duration-300 ${
                    viewMode === "grid"
                      ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                  title="Grid View"
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {filteredDoctors.length > 0 ? (
              viewMode === "list" ? (
                <StaggerChildren staggerDelay={50}>
                  <div className="space-y-4">
                    {filteredDoctors.map((doctor) => (
                      <DoctorCard
                        key={doctor.id}
                        {...doctor}
                        onBook={() => {
                          router.push(`/booking/${doctor.id}`)
                        }}
                      />
                    ))}
                  </div>
                </StaggerChildren>
              ) : (
                <StaggerChildren staggerDelay={50}>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredDoctors.map((doctor) => (
                      <DoctorCardGrid
                        key={doctor.id}
                        {...doctor}
                        onBook={() => {
                          router.push(`/booking/${doctor.id}`)
                        }}
                      />
                    ))}
                  </div>
                </StaggerChildren>
              )
            ) : (
              <FadeIn direction="up" delay={0}>
              <Card className="border border-border/50 p-12 lg:p-16 text-center shadow-xl bg-card/95 backdrop-blur-sm">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-6 shadow-lg ring-4 ring-primary/10">
                    <Search className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-3xl font-bold text-foreground mb-4">No doctors found</h3>
                  <p className="text-muted-foreground mb-8 leading-relaxed text-base">
                    We couldn't find any doctors matching your criteria. Try adjusting your filters or search terms to see more results.
                  </p>
                  <Button 
                    onClick={clearFilters} 
                    size="lg" 
                    className="gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                  >
                    <X className="w-5 h-5" />
                    Clear All Filters
                  </Button>
                </div>
              </Card>
              </FadeIn>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

