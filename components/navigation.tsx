"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { LogOut, Menu, X, Stethoscope, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

interface NavigationProps {
  isAuthenticated?: boolean
  userRole?: "patient" | "doctor" | "admin"
  userName?: string
  onLogout?: () => void
}

export function Navigation({ isAuthenticated, userRole, userName, onLogout }: NavigationProps) {
  const router = useRouter()
  const { logout: authLogout, user: authUser } = useAuth()

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      authLogout()
      router.push("/")
    }
  }
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => pathname === path

  const publicLinks = [
    { href: "/", label: "Home" },
    { href: "/doctors", label: "Find Doctor" },
  ]

  const patientLinks = [
    { href: "/doctors", label: "Find Doctor" },
    { href: "/my-queue", label: "My Queue" },
  ]

  const doctorLinks = [{ href: "/doctor/dashboard", label: "Dashboard" }]

  const adminLinks = [{ href: "/admin/dashboard", label: "Admin" }]

  const getLinks = () => {
    if (!isAuthenticated && !authUser) return publicLinks
    const role = userRole || authUser?.role
    if (role === "patient") return patientLinks
    if (role === "doctor") return doctorLinks
    if (role === "admin") return adminLinks
    return []
  }

  const links = getLinks()
  const displayName = userName || authUser?.name || "User"

  return (
    <nav className="sticky top-0 z-50 w-full bg-card/80 backdrop-blur-md border-b border-border/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
              <Stethoscope className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg text-foreground leading-tight">MedQueue.ai</span>
              <span className="text-[10px] text-muted-foreground leading-tight">Healthcare Solutions</span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg",
                  isActive(link.href)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* User Section - Desktop */}
          {(isAuthenticated || authUser) && (
            <div className="hidden md:flex items-center gap-3 ml-6 pl-6 border-l border-border">
              <Button
                asChild
                variant="ghost"
                className="gap-3 px-3 py-1.5 h-auto hover:bg-muted/50"
                title="Edit Profile"
              >
                <Link href="/profile/edit" className="flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-primary-foreground shadow-md group-hover:scale-105 transition-transform">
                    {displayName?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground leading-tight">{displayName}</p>
                    <p className="text-xs text-muted-foreground capitalize leading-tight">{userRole || authUser?.role}</p>
                  </div>
                </Link>
              </Button>
              {(isAuthenticated || authUser) && (
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Logout</span>
                </Button>
              )}
            </div>
          )}

          {/* Login Button - Desktop (Public) */}
          {!isAuthenticated && !authUser && (
            <div className="hidden md:flex items-center gap-3 ml-6">
              <Link href="/login/patient">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Sign In
                </Button>
              </Link>
              <Link href="/doctors">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive(link.href)
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  {link.label}
                </Link>
              ))}

              {(isAuthenticated || authUser) && (
                <>
                  <div className="border-t border-border my-2 pt-4">
                    <div className="flex items-center gap-3 px-4 py-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-primary-foreground">
                        {displayName?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{displayName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{userRole || authUser?.role}</p>
                      </div>
                    </div>
                    <Link
                      href="/profile/edit"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full mt-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Edit Profile
                    </Link>
                    {(isAuthenticated || authUser) && (
                      <button
                        onClick={() => {
                          handleLogout()
                          setMobileMenuOpen(false)
                        }}
                        className="w-full mt-2 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    )}
                  </div>
                </>
              )}

              {!isAuthenticated && !authUser && (
                <div className="border-t border-border mt-2 pt-4 flex flex-col gap-2">
                  <Link
                    href="/login/patient"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-sm font-medium text-center text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/doctors"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-sm font-medium text-center bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

