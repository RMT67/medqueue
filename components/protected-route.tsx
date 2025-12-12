"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  allowedRoles?: ("patient" | "doctor" | "admin")[]
}

/**
 * Protected Route Component
 * 
 * Redirects to login if user is not authenticated.
 * Optionally checks for specific roles.
 * 
 * @example
 * // Protect route for any authenticated user
 * <ProtectedRoute>
 *   <MyComponent />
 * </ProtectedRoute>
 * 
 * @example
 * // Protect route for specific roles
 * <ProtectedRoute allowedRoles={["patient"]}>
 *   <PatientDashboard />
 * </ProtectedRoute>
 */
export function ProtectedRoute({ 
  children, 
  redirectTo = "/login/patient",
  allowedRoles 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      // Not authenticated
      if (!isAuthenticated) {
        router.push(redirectTo)
        return
      }

      // Check role if specified
      if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Redirect based on role
        if (user.role === "doctor") {
          router.push("/doctor/dashboard")
        } else if (user.role === "admin") {
          router.push("/admin/dashboard")
        } else {
          router.push("/my-queue")
        }
        return
      }
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, redirectTo, router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Not authenticated - will redirect, show nothing
  if (!isAuthenticated) {
    return null
  }

  // Role check failed - will redirect, show nothing
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null
  }

  // Authenticated and role check passed (if any)
  return <>{children}</>
}


