"use client"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Star, Calendar, MapPin, Clock, ArrowRight, Award, CheckCircle2 } from "lucide-react"

interface DoctorCardProps {
  id: string
  name: string
  specialization: string
  clinic: string
  schedule: string
  rating: number
  reviews: number
  image?: string
  onBook?: () => void
}

export function DoctorCard({
  id,
  name,
  specialization,
  clinic,
  schedule,
  rating,
  reviews,
  image,
  onBook,
}: DoctorCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <Card className="group relative overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl bg-card/95 backdrop-blur-sm">
      {/* Gradient Background on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative p-8">
        <div className="flex gap-6 items-start">
          {/* Doctor Avatar */}
          <Link href={`/booking/${id}`} className="relative flex-shrink-0">
            <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent overflow-hidden shadow-xl ring-4 ring-primary/10 group-hover:ring-primary/20 group-hover:scale-105 transition-all duration-500">
              {image ? (
                <Image
                  src={image}
                  alt={name}
                  width={160}
                  height={160}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-5xl">
                  {initials}
                </div>
              )}
            </div>
            {/* Verified Badge */}
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center border-4 border-card shadow-xl ring-2 ring-green-200/50">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
          </Link>

          {/* Doctor Info */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Header */}
            <Link href={`/booking/${id}`} className="flex items-start justify-between mb-5 gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                    {name}
                  </h3>
                  {rating >= 4.8 && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl flex-shrink-0 border border-yellow-200/50 dark:border-yellow-800/50 shadow-sm">
                      <Award className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">Top Rated</span>
                    </div>
                  )}
                </div>
                <p className="text-sm font-semibold text-primary">{specialization}</p>
              </div>
              {/* Rating */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xl font-bold text-foreground">{rating}</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">({reviews} reviews)</span>
              </div>
            </Link>

            {/* Details */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                </div>
                <span className="truncate font-medium">{clinic}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center ring-1 ring-accent/20">
                  <Clock className="w-4 h-4 text-accent flex-shrink-0" />
                </div>
                <span className="font-medium">{schedule}</span>
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (onBook) {
                  onBook()
                } else {
                  window.location.href = `/booking/${id}`
                }
              }}
              className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground gap-2 group-hover:shadow-xl transition-all duration-300 mt-auto cursor-pointer relative z-10 font-semibold h-12 overflow-hidden"
              style={{ pointerEvents: 'auto' }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5" />
                Book Appointment
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

