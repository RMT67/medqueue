"use client"

import { createContext, useContext, type ReactNode, useState, useEffect } from "react"

export type UserRole = "patient" | "doctor" | "admin"

export interface User {
  _id: string
  email: string
  name: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string, role: UserRole) => Promise<boolean>
  register: (fullName: string, email: string, password: string, role?: UserRole) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore session on mount - verify token via /api/auth/me
  useEffect(() => {
    const token = localStorage.getItem("medqueue_token")
    const savedUser = localStorage.getItem("medqueue_user")

    if (token && savedUser) {
      try {
        // Verify token is still valid by calling /api/auth/me
        fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => {
            if (res.ok) {
              return res.json()
            }
            // Token invalid or expired
            throw new Error("Token invalid")
          })
          .then((data) => {
            // Update user state with verified user data
            setUser(data.user)
            // Update localStorage with fresh user data
            localStorage.setItem("medqueue_user", JSON.stringify(data.user))
          })
          .catch(() => {
            // Token invalid/expired - clear everything
            localStorage.removeItem("medqueue_token")
            localStorage.removeItem("medqueue_user")
            setUser(null)
          })
          .finally(() => {
            setIsLoading(false)
          })
      } catch (e) {
        // Error parsing or other issues - clear everything
        localStorage.removeItem("medqueue_token")
        localStorage.removeItem("medqueue_user")
        setUser(null)
        setIsLoading(false)
      }
    } else {
      // No token or user data - not authenticated
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Login failed")
      }

      const data = await response.json()
      const { token, user: userData } = data

      // Save to localStorage with fixed keys
      localStorage.setItem("medqueue_token", token)
      localStorage.setItem("medqueue_user", JSON.stringify(userData))
      
      // Update state
      setUser(userData)
      return true
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const register = async (fullName: string, email: string, password: string, role: UserRole = "patient"): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName, email, password, role }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Registration failed")
      }

      const data = await response.json()
      const { token, user: userData } = data

      // Save to localStorage with fixed keys
      localStorage.setItem("medqueue_token", token)
      localStorage.setItem("medqueue_user", JSON.stringify(userData))
      
      // Update state
      setUser(userData)
      return true
    } catch (error) {
      console.error("Registration error:", error)
      return false
    }
  }

  const logout = () => {
    // Remove from localStorage
    localStorage.removeItem("medqueue_token")
    localStorage.removeItem("medqueue_user")
    
    // Clear state
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      register, 
      logout, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}



