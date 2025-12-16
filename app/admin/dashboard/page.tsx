"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/lib/auth-context";
import { AdminHeader, AdminTabs } from "@/components/adminDashboard";
import { DoctorAdmin } from "@/types/docterTypes";
import { DoctorWithSchedule } from "@/types/scheduleTypes";
import { OverviewTab } from "./OverviewTab";

interface DashboardStats {
  totalPatients: number;
  avgWaitTime: string;
  activeDoctors: number;
  completedVisits: number;
}

export default function AdminDashboard() {
  const router = useRouter();
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

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

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

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation
        isAuthenticated={true}
        userRole="admin"
        userName={user.name}
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
