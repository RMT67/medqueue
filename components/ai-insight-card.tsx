import { Lightbulb } from "lucide-react"
import { Card } from "@/components/ui/card"

interface AIInsightCardProps {
  title: string
  insights: string[]
  recommendation?: string
}

export function AIInsightCard({ title, insights, recommendation }: AIInsightCardProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border-2 border-primary/20 rounded-2xl p-6 lg:p-8 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
          <Lightbulb className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
      </div>

      <ul className="space-y-3 mb-6">
        {insights.map((insight, i) => (
          <li key={i} className="text-sm lg:text-base text-foreground flex items-start gap-3">
            <span className="text-primary font-bold text-lg mt-0.5">•</span>
            <span>{insight}</span>
          </li>
        ))}
      </ul>

      {recommendation && (
        <div className="pt-4 border-t-2 border-primary/20">
          <p className="text-base font-semibold text-primary">{recommendation}</p>
        </div>
      )}
    </Card>
  )
}

