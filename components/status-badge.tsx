import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "waiting" | "being-served" | "completed" | "online" | "not-started" | "active" | "cancelled" | "confirmed" | "in-progress"
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
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "in-progress": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  }

  const labels = {
    waiting: "Waiting",
    "being-served": "Being Served",
    completed: "Completed",
    online: "Online",
    "not-started": "Not Started",
    active: "Active",
    cancelled: "Cancelled",
    confirmed: "Confirmed",
    "in-progress": "In Progress",
  }

  return (
    <span className={cn("px-3 py-1 rounded-full text-xs font-semibold", styles[status], className)}>
      {labels[status]}
    </span>
  )
}

