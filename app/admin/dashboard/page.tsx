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

  const getTodayDayName = (): string => {
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const today = new Date();
    return days[today.getDay()];
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Get today's day name in Indonesian
      const todayDay = getTodayDayName();

      // Fetch schedules filtered by today's day from API
      const schedulesResponse = await fetch(
        `/api/schedules?day=${encodeURIComponent(todayDay)}`
      );

      if (schedulesResponse.ok) {
        const todaySchedules = await schedulesResponse.json();

        // Ensure data is array
        const schedulesArray = Array.isArray(todaySchedules)
          ? todaySchedules
          : [];

        setSchedules(schedulesArray);

        // Get doctor IDs who have schedules today
        const doctorIdsWithScheduleToday = schedulesArray.map(
          (schedule: DoctorWithSchedule) => schedule.doctorId
        );

        if (doctorIdsWithScheduleToday.length > 0) {
          // Fetch only doctors who have schedules today
          const doctorsResponse = await fetch(
            `/api/doctor?doctorIds=${doctorIdsWithScheduleToday.join(",")}`
          );

          if (doctorsResponse.ok) {
            const doctorsData = await doctorsResponse.json();
            const doctorsArray = Array.isArray(doctorsData.doctors)
              ? doctorsData.doctors
              : [];

            setDoctors(doctorsArray);

            // Calculate stats from active doctors with schedules
            const totalPatients = doctorsArray.reduce(
              (sum: number, d: DoctorAdmin) => sum + (d.todayPatients || 0),
              0
            );
            const completedVisits = doctorsArray.reduce(
              (sum: number, d: DoctorAdmin) => sum + (d.completedToday || 0),
              0
            );
            const avgWait =
              doctorsArray.length > 0
                ? Math.round(
                    doctorsArray.reduce(
                      (sum: number, d: DoctorAdmin) =>
                        sum + (d.avgWaitTime || 0),
                      0
                    ) / doctorsArray.length
                  )
                : 0;

            setStats({
              totalPatients,
              avgWaitTime: `${avgWait} min`,
              activeDoctors: doctorsArray.length,
              completedVisits,
            });
          }
        } else {
          // No schedules for today
          setDoctors([]);
          setSchedules([]);
          setStats({
            totalPatients: 0,
            avgWaitTime: "0 min",
            activeDoctors: 0,
            completedVisits: 0,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
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
