import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "waiting" | "being-served" | "completed" | "online" | "not-started" | "active"
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = {
    waiting: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    "being-served": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    online: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "not-started": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  }

  const labels = {
    waiting: "Waiting",
    "being-served": "Being Served",
    completed: "Completed",
    online: "Online",
    "not-started": "Not Started",
    active: "Active",
  }

  return (
    <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", styles[status], className)}>
      {labels[status]}
    </span>
  )
}

