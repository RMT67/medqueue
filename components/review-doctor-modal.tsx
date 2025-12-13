"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"

interface ReviewDoctorModalProps {
  isOpen: boolean
  onClose: () => void
  doctorName: string
  onSubmit?: (rating: number, feedback?: string) => void
}

export function ReviewDoctorModal({
  isOpen,
  onClose,
  doctorName,
  onSubmit,
}: ReviewDoctorModalProps) {
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState("")

  if (!isOpen) return null

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit?.(rating, feedback)
      setRating(0)
      setFeedback("")
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <Card className="w-full max-w-md p-8 lg:p-10 border border-border/50 shadow-2xl space-y-8 bg-card/98 backdrop-blur-xl ring-1 ring-primary/10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent mb-2 shadow-2xl ring-4 ring-primary/20">
            <Star className="w-10 h-10 text-white fill-white drop-shadow-lg" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">Rate Your Visit</h2>
          <p className="text-muted-foreground text-sm">How was your experience with {doctorName}?</p>
        </div>

        {/* Star Rating */}
        <div className="flex justify-center gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`text-6xl hover:scale-125 transition-all duration-300 cursor-pointer drop-shadow-lg ${
                star <= rating
                  ? "text-yellow-400 hover:text-yellow-500"
                  : "text-yellow-200 hover:text-yellow-300"
              }`}
              title={`Rate ${star} stars`}
            >
              ★
            </button>
          ))}
        </div>

        {/* Review Text */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-foreground">Your Feedback (Optional)</label>
          <textarea
            placeholder="Share your experience..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full px-4 py-3 bg-input border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            rows={4}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 h-12 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-300 font-medium"
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Review
          </Button>
        </div>
      </Card>
    </div>
  )
}


