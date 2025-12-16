"use client"

import Image from "next/image"
import { useState, useEffect, useMemo } from "react"
import { Clock, Hourglass, CheckCircle2, User, Star, Calendar, MapPin, Info, Lightbulb, FileText } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// AI Insights Component
function AIInsights({ bookingId }: { bookingId: string }) {
  const [insights, setInsights] = useState<{
    insights: string[]
    warnings: string[]
    smartSuggestion: {
      arrivalTime: string
      reason: string
    }
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Skip if bookingId is empty
    if (!bookingId) {
      setIsLoading(false)
      return
    }

    let isCancelled = false

    const fetchInsights = async () => {
      try {
        const token = localStorage.getItem("medqueue_token")
        if (!token) {
          if (!isCancelled) setIsLoading(false)
          return
        }

        const response = await fetch(`/api/patient/queue/${bookingId}/insights`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (isCancelled) return

        if (response.ok) {
          const data = await response.json()
          if (!isCancelled) {
            setInsights({
              insights: data.insights || [],
              warnings: data.warnings || [],
              smartSuggestion: data.smartSuggestion || {
                arrivalTime: "",
                reason: ""
              }
            })
          }
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("Error fetching insights:", error)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchInsights()

    // Cleanup function to cancel request if component unmounts or bookingId changes
    return () => {
      isCancelled = true
    }
  }, [bookingId])

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/20 rounded-xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md ring-2 ring-primary/20 flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">AI Insights</h4>
        </div>
        <p className="text-sm text-muted-foreground">Loading insights...</p>
      </div>
    )
  }

  if (!insights || insights.insights.length === 0) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/20 rounded-xl p-5 space-y-3 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md ring-2 ring-primary/20 flex-shrink-0">
          <Lightbulb className="w-5 h-5 text-white" />
        </div>
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">AI Insights</h4>
      </div>
      
      {insights.warnings.length > 0 && (
        <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50 rounded-lg mb-3">
          {insights.warnings.map((warning, index) => (
            <p key={index} className="text-xs text-amber-700 dark:text-amber-300 font-medium">
              ⚠️ {warning}
            </p>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {insights.insights.map((insight, index) => (
          <p key={index} className="text-sm text-foreground leading-relaxed">
            {insight}
          </p>
        ))}
      </div>

      {insights.smartSuggestion.reason && (
        <div className="pt-3 border-t border-primary/20">
          <p className="text-sm font-semibold text-primary">
            💡 Smart Suggestion: {insights.smartSuggestion.reason}
          </p>
        </div>
      )}
    </div>
  )
}

interface QueueCardProps {
  currentlyServing: string
  patientsAhead: number
  estimatedTime: number
  doctorName: string
  doctorSpecialization: string
  doctorClinic: string
  doctorRating: number
  doctorReviews: number
  doctorImage?: string
  status: "waiting" | "being-served" | "completed"
  appointmentDate?: string
  appointmentTime?: string
  timeRange?: string
  patientComplaint?: string
  bookingId?: string
  onMarkComplete?: () => void
  onCancel?: () => void
  onRate?: () => void
}

export function QueueCard({
  currentlyServing,
  patientsAhead,
  estimatedTime,
  doctorName,
  doctorSpecialization,
  doctorClinic,
  doctorRating,
  doctorReviews,
  doctorImage,
  status,
  appointmentDate = "Today, Dec 5, 2024",
  appointmentTime = "10:30",
  timeRange,
  patientComplaint,
  bookingId,
  onMarkComplete,
  onCancel,
  onRate,
}: QueueCardProps) {
  const toJakartaDate = (value?: string | Date | null) => {
    if (!value) return null
    const localString = new Date(value).toLocaleString("en-US", {
      timeZone: "Asia/Jakarta",
    })
    const parsed = new Date(localString)
    return isNaN(parsed.getTime()) ? null : parsed
  }

  const getJakartaYMD = (value: Date | null) => {
    if (!value) return null
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(value)
    const get = (type: string) => parts.find((p) => p.type === type)?.value || ""
    const year = Number(get("year"))
    const month = Number(get("month"))
    const day = Number(get("day"))
    return {
      year,
      month,
      day,
      key: `${year}-${month}-${day}`,
      asUTC: Date.UTC(year, month - 1, day),
    }
  }

  const formatDisplayDate = (value?: string | Date | null) => {
    const date = toJakartaDate(value)
    if (!date) return "-"

    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).formatToParts(date)

    const get = (type: string) => parts.find((p) => p.type === type)?.value || ""
    const weekday = get("weekday")
    const day = get("day")
    const month = get("month")
    const year = get("year")

    return `${weekday}, ${day} ${month} ${year}`
  }

  const formatDisplayTime = (value?: string | Date | null) => {
    const date = toJakartaDate(value)
    if (!date) return "-"

    return (
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(date) + " WIB"
    )
  }

  const normalizedBookingId = useMemo(() => {
    return (
      (bookingId as any)?._id?.toString?.() ||
      bookingId?.toString?.() ||
      (bookingId as any)?.id ||
      ""
    )
  }, [bookingId])

  const initials = doctorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  const formattedAppointmentDate = useMemo(
    () => formatDisplayDate(appointmentDate || appointmentTime),
    [appointmentDate, appointmentTime]
  )

  const formattedAvailableTime = useMemo(() => {
    if (timeRange) return timeRange
    if (appointmentTime) return formatDisplayTime(appointmentTime)
    if (appointmentDate) return formatDisplayTime(appointmentDate)
    return "-"
  }, [timeRange, appointmentTime, appointmentDate])

  const getPracticeStartTime = (baseDate: Date | null, range?: string | null) => {
    if (!baseDate) return null

    const parsedRange = (range || "").split("-")[0]?.trim()
    const [h, m] = (parsedRange || "").split(":").map((v) => Number(v))

    // Fallback: if timeRange missing, try appointmentTime; else midnight Jakarta
    const hours = Number.isInteger(h) ? h : baseDate.getHours()
    const minutes = Number.isInteger(m) ? m : baseDate.getMinutes()

    const target = new Date(baseDate.getTime())
    target.setHours(hours || 0, minutes || 0, 0, 0)
    return target
  }

  // Calculate estimated call time (realtime) with Jakarta timezone
  const [estimatedCallTime, setEstimatedCallTime] = useState<string>("")
  const [estimatedCallTimeFormatted, setEstimatedCallTimeFormatted] = useState<string>("")

  useEffect(() => {
    const calculateCallTime = () => {
      const bookingSource = appointmentDate || appointmentTime
      const bookingDate = toJakartaDate(bookingSource)
      const now = toJakartaDate(new Date())
      const practiceStart = getPracticeStartTime(bookingDate, timeRange) || bookingDate

      if (status === "completed") {
        setEstimatedCallTime("Completed")
        setEstimatedCallTimeFormatted("Appointment finished")
        return
      }

      if (status === "being-served") {
        setEstimatedCallTime("Now")
        setEstimatedCallTimeFormatted("Currently being served")
        return
      }

      if (!practiceStart || !now) {
        setEstimatedCallTime("-")
        setEstimatedCallTimeFormatted("Schedule not available")
        return
      }

      const targetDay = getJakartaYMD(practiceStart)
      const nowDay = getJakartaYMD(now)
      const dayDiff =
        targetDay && nowDay
          ? Math.round((targetDay.asUTC - nowDay.asUTC) / (1000 * 60 * 60 * 24))
          : 0

      if (dayDiff > 0) {
        const days = Math.round(dayDiff)
        if (days === 1) {
          setEstimatedCallTime("Tomorrow")
        } else {
          setEstimatedCallTime(`In ${days} days`)
        }
        setEstimatedCallTimeFormatted(`at ${formatDisplayTime(practiceStart)}`)
        return
      }

      const diffMs = practiceStart.getTime() - now.getTime()
      if (diffMs <= 0) {
        setEstimatedCallTime("Now")
        setEstimatedCallTimeFormatted(formatDisplayTime(practiceStart))
        return
      }

      const totalMinutes = Math.max(1, Math.round(diffMs / (1000 * 60)))
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      const label =
        hours > 0 ? `In ${hours}h ${minutes}m` : `In ${minutes}m`

      setEstimatedCallTime(label)
      setEstimatedCallTimeFormatted(`at ${formatDisplayTime(practiceStart)}`)
    }

    calculateCallTime()
    const interval = setInterval(calculateCallTime, 30000) // Update every 30 seconds for more realtime feel

    return () => clearInterval(interval)
  }, [patientsAhead, status, estimatedTime, appointmentTime, appointmentDate, timeRange])

  return (
    <Card className="border border-border/50 rounded-2xl p-8 shadow-2xl bg-card/95 backdrop-blur-md space-y-6 h-full flex flex-col ring-1 ring-primary/5">
      {/* Queue Number & Status */}
      <div className="text-center pb-6 border-b border-border/50">
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Queue Number</p>
        <p className="text-5xl lg:text-6xl font-bold text-primary font-mono mb-4 tracking-tight">
          {currentlyServing || "-"}
        </p>
        <div
          className={cn("inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-semibold border shadow-sm", {
            "bg-gray-50/80 dark:bg-gray-950/30 text-gray-700 dark:text-gray-300 border-gray-200/50 dark:border-gray-800/50 ring-1 ring-gray-200/50": status === "waiting",
            "bg-amber-50/80 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/50 ring-1 ring-amber-200/50": status === "being-served",
            "bg-green-50/80 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200/50 dark:border-green-800/50 ring-1 ring-green-200/50": status === "completed",
          })}
        >
          {status === "waiting" && <Hourglass className="w-4 h-4" />}
          {status === "being-served" && <User className="w-4 h-4" />}
          {status === "completed" && <CheckCircle2 className="w-4 h-4" />}
          <span>
            {status === "waiting" && "Waiting"}
            {status === "being-served" && "Being Served"}
            {status === "completed" && "Completed"}
          </span>
        </div>
      </div>

      {/* Queue Status - Compact */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card/80 rounded-xl p-4 text-center border border-border/50 shadow-sm backdrop-blur-sm">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Serving</p>
          <p className="font-bold text-xl text-foreground">{currentlyServing}</p>
        </div>
        <div className="bg-card/80 rounded-xl p-4 text-center border border-border/50 shadow-sm backdrop-blur-sm">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Ahead</p>
          <p className="font-bold text-xl text-foreground">{patientsAhead}</p>
        </div>
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 text-center border border-primary/20 shadow-md ring-1 ring-primary/10">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Call Time</p>
          <p className="font-bold text-xl text-primary">{estimatedCallTime}</p>
          {estimatedCallTime !== "Now" && estimatedCallTime !== "Completed" && (
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">{estimatedCallTimeFormatted}</p>
          )}
        </div>
      </div>

      {/* Appointment & Doctor Info Combined */}
      <div className="space-y-4 flex-grow">
        {/* Appointment Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-card/80 rounded-xl border border-border/50 shadow-sm backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20 flex-shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Date</p>
              <p className="text-sm font-semibold text-foreground">{formattedAppointmentDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-card/80 rounded-xl border border-border/50 shadow-sm backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20 flex-shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Available Time</p>
              <p className="text-sm font-semibold text-foreground">{formattedAvailableTime}</p>
            </div>
          </div>
        </div>

        {/* Patient Complaint */}
        {patientComplaint && (
          <div className="p-4 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 rounded-xl border border-primary/20 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20 flex-shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Patient Complaint</p>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{patientComplaint}</p>
              </div>
            </div>
          </div>
        )}

        {/* Doctor Info */}
        <div className="p-5 bg-card/80 rounded-xl border border-border/50 shadow-lg backdrop-blur-sm">
          <p className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Your Doctor</p>
          <div className="flex items-center gap-4">
            <div className="relative w-18 h-18 rounded-2xl overflow-hidden border-2 border-border/50 flex-shrink-0 shadow-lg ring-2 ring-primary/10" style={{ width: '4.5rem', height: '4.5rem' }}>
              {doctorImage ? (
                <>
                  <Image
                    src={doctorImage}
                    alt={doctorName}
                    fill
                    unoptimized
                    className="object-cover"
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
              <p className="font-bold text-lg mb-1">{doctorName}</p>
              <p className="text-sm text-muted-foreground mb-3 font-medium">{doctorSpecialization}</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground font-medium">{doctorClinic}</span>
                </span>
                <span className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-foreground">{doctorRating}</span>
                  <span className="text-muted-foreground">({doctorReviews} reviews)</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        {status === "waiting" && normalizedBookingId && (
          <AIInsights bookingId={normalizedBookingId} />
        )}

        {/* Reminder */}
        {status === "waiting" && (
          <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/50 rounded-xl p-4 flex items-start gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 ring-1 ring-blue-200/50">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium leading-relaxed">Please arrive 5 minutes before your turn. You'll receive a notification when it's your time.</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-auto pt-6 border-t border-border/50">
        {status === "completed" ? (
          onRate ? (
            <Button
              onClick={onRate}
              className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground gap-2 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
            >
              <Star className="w-5 h-5" />
              Rate Your Experience
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground text-center">
              Review will be available after payment is completed.
            </div>
          )
        ) : (
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={onCancel}
              className="px-4 h-12 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300 font-medium"
              title="Cancel appointment"
            >
              Cancel
            </Button>
            <Button
              onClick={onMarkComplete}
              className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:scale-105 relative overflow-hidden group"
            >
              <span className="relative z-10">Mark Complete</span>
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
