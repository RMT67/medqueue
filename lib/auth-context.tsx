"use client";

import {
  createContext,
  useContext,
  type ReactNode,
  useState,
  useEffect,
} from "react";

export type UserRole = "patient" | "doctor" | "admin";

export interface User {
  _id: string;
  email: string;
  name: string;
  role: UserRole;
  photoUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  register: (
    fullName: string,
    email: string,
    password: string,
    role?: UserRole
  ) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to refresh user data from API
  const refreshUserData = async () => {
    const token = localStorage.getItem("medqueue_token");
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const userData = {
          ...data.user,
          name: data.user.name || "",
        };
        setUser(userData);
        localStorage.setItem("medqueue_user", JSON.stringify(userData));
      } else {
        // Token invalid or expired
        localStorage.removeItem("medqueue_token");
        localStorage.removeItem("medqueue_user");
        setUser(null);
      }
    } catch (e) {
      console.error("Error refreshing user data:", e);
    }
  };

  // Restore session on mount - verify token via /api/auth/me
  useEffect(() => {
    setIsLoading(true);
    const token = localStorage.getItem("medqueue_token");
    const savedUser = localStorage.getItem("medqueue_user");

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
              return res.json();
            }
            // Token invalid or expired
            throw new Error("Token invalid");
          })
          .then((data) => {
            // Ensure name = fullName for consistency (API returns name from fullName)
            const userData = {
              ...data.user,
              name: data.user.name || "",
            };
            // Update user state with verified user data
            setUser(userData);
            // Update localStorage with fresh user data (ensure name is set)
            localStorage.setItem("medqueue_user", JSON.stringify(userData));
          })
          .catch(() => {
            // Token invalid/expired - clear everything
            localStorage.removeItem("medqueue_token");
            localStorage.removeItem("medqueue_user");
            setUser(null);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } catch (e) {
        // Error parsing or other issues - clear everything
        localStorage.removeItem("medqueue_token");
        localStorage.removeItem("medqueue_user");
        setUser(null);
        setIsLoading(false);
      }
    } else {
      // No token or user data - not authenticated
      setIsLoading(false);
    }

    // Listen for storage events (from other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "medqueue_user" && e.newValue) {
        try {
          const userData = JSON.parse(e.newValue);
          setUser(userData);
        } catch (e) {
          console.error("Error parsing storage event:", e);
        }
      }
    };

    // Listen for custom event (triggered by window.dispatchEvent in same window)
    const handleCustomStorage = () => {
      const savedUser = localStorage.getItem("medqueue_user");
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          // Also refresh from API to get latest data
          refreshUserData();
        } catch (e) {
          console.error("Error parsing localStorage:", e);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("medqueue_user_updated", handleCustomStorage);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("medqueue_user_updated", handleCustomStorage);
    };
  }, []);

  const login = async (
    email: string,
    password: string,
    role: UserRole
  ): Promise<boolean> => {
    // #region agent log
    fetch("http://127.0.0.1:7242/ingest/cf3da9b3-e361-40d2-9804-0e59c14855ca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "auth-context.tsx:94",
        message: "login function entry",
        data: { email, role },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "A",
      }),
    }).catch(() => {});
    // #endregion
    try {
      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/cf3da9b3-e361-40d2-9804-0e59c14855ca",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "auth-context.tsx:100",
            message: "before fetch call",
            data: { url: "/api/auth/login" },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "B",
          }),
        }
      ).catch(() => {});
      // #endregion
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
      });

      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/cf3da9b3-e361-40d2-9804-0e59c14855ca",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "auth-context.tsx:108",
            message: "after fetch response",
            data: {
              ok: response.ok,
              status: response.status,
              statusText: response.statusText,
              contentType: response.headers.get("content-type"),
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "C",
          }),
        }
      ).catch(() => {});
      // #endregion

      if (!response.ok) {
        // #region agent log
        fetch(
          "http://127.0.0.1:7242/ingest/cf3da9b3-e361-40d2-9804-0e59c14855ca",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "auth-context.tsx:110",
              message: "response not ok, before json parse",
              data: { status: response.status },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run1",
              hypothesisId: "A",
            }),
          }
        ).catch(() => {});
        // #endregion
        let data;
        try {
          const text = await response.text();
          // #region agent log
          fetch(
            "http://127.0.0.1:7242/ingest/cf3da9b3-e361-40d2-9804-0e59c14855ca",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                location: "auth-context.tsx:114",
                message: "response text received",
                data: {
                  textLength: text.length,
                  textPreview: text.substring(0, 200),
                },
                timestamp: Date.now(),
                sessionId: "debug-session",
                runId: "run1",
                hypothesisId: "A",
              }),
            }
          ).catch(() => {});
          // #endregion
          data = JSON.parse(text);
          // #region agent log
          fetch(
            "http://127.0.0.1:7242/ingest/cf3da9b3-e361-40d2-9804-0e59c14855ca",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                location: "auth-context.tsx:116",
                message: "json parsed successfully",
                data: { hasMessage: !!data.message, message: data.message },
                timestamp: Date.now(),
                sessionId: "debug-session",
                runId: "run1",
                hypothesisId: "A",
              }),
            }
          ).catch(() => {});
          // #endregion
        } catch (parseError) {
          // #region agent log
          fetch(
            "http://127.0.0.1:7242/ingest/cf3da9b3-e361-40d2-9804-0e59c14855ca",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                location: "auth-context.tsx:119",
                message: "json parse failed",
                data: {
                  error:
                    parseError instanceof Error
                      ? parseError.message
                      : String(parseError),
                },
                timestamp: Date.now(),
                sessionId: "debug-session",
                runId: "run1",
                hypothesisId: "A",
              }),
            }
          ).catch(() => {});
          // #endregion
          throw new Error(`Login failed with status ${response.status}`);
        }
        throw new Error(data.message || "Login failed");
      }

      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/cf3da9b3-e361-40d2-9804-0e59c14855ca",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "auth-context.tsx:125",
            message: "response ok, before json parse",
            data: { status: response.status },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "D",
          }),
        }
      ).catch(() => {});
      // #endregion
      const data = await response.json();
      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/cf3da9b3-e361-40d2-9804-0e59c14855ca",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "auth-context.tsx:127",
            message: "json parsed successfully",
            data: { hasToken: !!data.token, hasUser: !!data.user },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "D",
          }),
        }
      ).catch(() => {});
      // #endregion
      const { token, user: userData } = data;

      // Ensure name is set (API returns name from fullName)
      const normalizedUser = {
        ...userData,
        name: userData.name || "",
      };

      // Save to localStorage with fixed keys
      localStorage.setItem("medqueue_token", token);
      localStorage.setItem("medqueue_user", JSON.stringify(normalizedUser));

      // Update state
      setUser(normalizedUser);
      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/cf3da9b3-e361-40d2-9804-0e59c14855ca",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "auth-context.tsx:135",
            message: "login success",
            data: { userId: normalizedUser._id },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "E",
          }),
        }
      ).catch(() => {});
      // #endregion
      return true;
    } catch (error) {
      // #region agent log
      fetch(
        "http://127.0.0.1:7242/ingest/cf3da9b3-e361-40d2-9804-0e59c14855ca",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "auth-context.tsx:138",
            message: "login error caught",
            data: {
              errorMessage:
                error instanceof Error ? error.message : String(error),
              errorStack: error instanceof Error ? error.stack : undefined,
            },
            timestamp: Date.now(),
            sessionId: "debug-session",
            runId: "run1",
            hypothesisId: "E",
          }),
        }
      ).catch(() => {});
      // #endregion
      console.error("Login error:", error);
      return false;
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    role: UserRole = "patient"
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName, email, password, role }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Registration failed");
      }

      const data = await response.json();
      const { token, user: userData } = data;

      // Ensure name is set (API returns name from fullName)
      const normalizedUser = {
        ...userData,
        name: userData.name || "",
      };

      // Save to localStorage with fixed keys
      localStorage.setItem("medqueue_token", token);
      localStorage.setItem("medqueue_user", JSON.stringify(normalizedUser));

      // Update state
      setUser(normalizedUser);
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  };

  const logout = () => {
    // Remove from localStorage
    localStorage.removeItem("medqueue_token");
    localStorage.removeItem("medqueue_user");

    // Clear state
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
