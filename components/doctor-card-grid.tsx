"use client"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Star, Calendar, MapPin, Clock, ArrowRight, Award, CheckCircle2 } from "lucide-react"

interface DoctorCardGridProps {
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

export function DoctorCardGrid({
  id,
  name,
  specialization,
  clinic,
  schedule,
  rating,
  reviews,
  image,
  onBook,
}: DoctorCardGridProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <Card className="group relative overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl bg-card/95 backdrop-blur-sm h-full flex flex-col">
      {/* Gradient Background on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Doctor Photo - Focus */}
      <Link href={`/booking/${id}`} className="relative w-full h-64 bg-gradient-to-br from-primary via-primary/80 to-accent overflow-hidden block">
          {image ? (
            <>
              <Image
                src={image}
                alt={name}
                fill
                unoptimized
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  // Fallback jika gambar gagal load
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    const fallback = parent.querySelector('.image-fallback') as HTMLElement
                    if (fallback) fallback.style.display = 'flex'
                  }
                }}
              />
              <div className="image-fallback hidden w-full h-full items-center justify-center text-white font-bold text-6xl">
                {initials}
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold text-6xl">
              {initials}
            </div>
          )}
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          
          {/* Verified Badge */}
          <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center border-4 border-card shadow-xl ring-2 ring-green-200/50">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>

          {/* Top Rated Badge */}
          {rating >= 4.8 && (
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50/90 dark:bg-yellow-900/50 rounded-xl backdrop-blur-sm border border-yellow-200/50 dark:border-yellow-800/50 shadow-lg">
              <Award className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">Top Rated</span>
            </div>
          )}

          {/* Rating Badge */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-4 py-2 bg-white/95 dark:bg-black/95 rounded-xl backdrop-blur-sm border border-white/20 shadow-lg">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-bold text-foreground">{rating}</span>
            <span className="text-xs text-muted-foreground font-medium">({reviews})</span>
          </div>
      </Link>

      {/* Doctor Info */}
      <div className="relative p-6 flex-1 flex flex-col">
        {/* Name & Specialization */}
        <Link href={`/booking/${id}`} className="mb-5 block">
          <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
            {name}
          </h3>
          <p className="text-sm font-semibold text-primary">{specialization}</p>
        </Link>

          {/* Details */}
          <div className="space-y-3 mb-6 flex-1">
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
          className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground gap-2 group-hover:shadow-xl transition-all duration-300 cursor-pointer relative z-10 font-semibold h-12 overflow-hidden"
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
    </Card>
  )
}

