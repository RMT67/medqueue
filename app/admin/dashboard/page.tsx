"use client";

import { useEffect, useState, useCallback } from "react";
// import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/lib/auth-context";
import { AdminHeader, AdminTabs } from "@/components/adminDashboard";
import { DoctorAdmin } from "@/types/docterTypes";
import { DoctorWithSchedule } from "@/types/scheduleTypes";
import { OverviewTab } from "./OverviewTab";
// import Swal from "sweetalert2";
import { ScaleIn } from "@/components/animations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalPatients: number;
  avgWaitTime: string;
  activeDoctors: number;
  completedVisits: number;
}

export default function AdminDashboard() {
  // const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    avgWaitTime: "0 min",
    activeDoctors: 0,
    completedVisits: 0,
  });
  const [doctors, setDoctors] = useState<DoctorAdmin[]>([]);
  const [schedules, setSchedules] = useState<DoctorWithSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   if (!isLoading && (!user || user.role !== "admin")) {
  //     Swal.fire({
  //       icon: "error",
  //       title: "Oops...",
  //       text: "You're not authorized!",
  //     }).then((res) => {
  //       if (res.isConfirmed) {
  //         router.push("/login/patient");
  //       }
  //     });
  //   }
  // }, [user, isLoading, router]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all dashboard data from overview API
      const response = await fetch("/api/admin/overview");

      if (response.ok) {
        const data = await response.json();

        // Set stats, doctors, and schedules from the API response
        setStats(data.stats);
        setDoctors(data.doctors || []);
        setSchedules(data.schedules || []);
      } else {
        // Reset to default values if request fails
        setStats({
          totalPatients: 0,
          avgWaitTime: "0 min",
          activeDoctors: 0,
          completedVisits: 0,
        });
        setDoctors([]);
        setSchedules([]);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Reset to default values on error
      setStats({
        totalPatients: 0,
        avgWaitTime: "0 min",
        activeDoctors: 0,
        completedVisits: 0,
      });
      setDoctors([]);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  // if (isLoading || loading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
  //         <p className="mt-4 text-muted-foreground">Loading...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // if (!user) {
  //   return null;
  // }

  if (isLoading && loading) {
    return (
      // loading spinner
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <ScaleIn>
          <div className="w-16 h-16 border-4 border-t-4 border-primary border-t-transparent rounded-full animate-spin" />
        </ScaleIn>
      </div>
    );
  }

  if (!user && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 100 0 L 0 0 0 100' fill='none' stroke='%23000000' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <ScaleIn delay={0}>
          <Card className="relative max-w-md w-full p-8 lg:p-10 border-2 shadow-2xl bg-card/80 backdrop-blur-sm text-center space-y-6">
            {/* Icon */}
            <div className="w-20 h-20 bg-linear-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-10 h-10 text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                Authentication Required
              </h2>
              <p className="text-muted-foreground text-sm lg:text-base">
                You must be logged in to access the admin dashboard.
              </p>
            </div>

            {/* Login Button */}
            <Button
              onClick={() => (window.location.href = "/login/admin")}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all font-medium text-base"
            >
              Go to Admin Login
            </Button>
          </Card>
        </ScaleIn>
      </div>
    );
  }

  if (user && user.role !== "admin" && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 100 0 L 0 0 0 100' fill='none' stroke='%23000000' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <ScaleIn delay={0}>
          <Card className="relative max-w-md w-full p-8 lg:p-10 border-2 shadow-2xl bg-card/80 backdrop-blur-sm text-center space-y-6">
            {/* Icon */}
            <div className="w-20 h-20 bg-linear-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-10 h-10 text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                Access Denied
              </h2>
              <p className="text-muted-foreground text-sm lg:text-base">
                You do not have permission to access the admin dashboard.
              </p>
              <p className="text-sm text-muted-foreground/80 mt-2">
                Current role: <span className="font-semibold">{user.role}</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => (window.location.href = "/")}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all font-medium text-base"
              >
                Go to Home Page
              </Button>
              <Button
                onClick={logout}
                variant="outline"
                className="w-full h-12 border-2 hover:bg-muted hover:border-primary/30 transition-all font-medium"
              >
                Logout
              </Button>
            </div>
          </Card>
        </ScaleIn>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation
        isAuthenticated={true}
        userRole="admin"
        userName={user?.name}
        onLogout={logout}
      />

      <AdminHeader
        title='Admin <span class="text-primary">Dashboard</span>'
        subtitle="Manage clinics, doctors, and patient support"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <AdminTabs />

        <OverviewTab stats={stats} doctors={doctors} schedules={schedules} />
      </main>
    </div>
  );
}
