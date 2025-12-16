"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { useAuth } from "@/lib/auth-context";
import { AdminHeader, AdminTabs } from "@/components/adminDashboard";
import { ScheduleTab } from "./ScheduleTab";
import { DoctorWithSchedule } from "@/types/scheduleTypes";
import { DoctorScheduleType } from "@/types/doctorScheduleType";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Save, X, Calendar as CalendarIcon, List } from "lucide-react";
import Swal from "sweetalert2";

// ==================== TYPES ====================
interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  clinic: string;
  image?: string;
}

// ScheduleFormData based on DoctorScheduleType, adapted for form handling
type ScheduleFormData = Omit<
  DoctorScheduleType,
  "_id" | "doctorId" | "firstCallTime"
> & {
  doctorId: string; // String for form handling (converted to ObjectId on backend)
  firstCallTime: string; // Non-nullable string for form
};

// ==================== MAIN COMPONENT ====================
export default function SchedulePage() {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

  // State management
  const [schedules, setSchedules] = useState<DoctorWithSchedule[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ScheduleFormData>({
    doctorId: "",
    dayOfWeek: [
      {
        hari: "Monday",
        available: false,
        startTime: "09:00",
        endTime: "17:00",
      },
      {
        hari: "Tuesday",
        available: false,
        startTime: "09:00",
        endTime: "17:00",
      },
      {
        hari: "Wednesday",
        available: false,
        startTime: "09:00",
        endTime: "17:00",
      },
      {
        hari: "Thursday",
        available: false,
        startTime: "09:00",
        endTime: "17:00",
      },
      {
        hari: "Friday",
        available: false,
        startTime: "09:00",
        endTime: "17:00",
      },
      {
        hari: "Saturday",
        available: false,
        startTime: "09:00",
        endTime: "17:00",
      },
      {
        hari: "Sunday",
        available: false,
        startTime: "09:00",
        endTime: "17:00",
      },
    ],
    isAvailable: true,
    firstCallTime: "",
    isOnTime: true,
    delayMinutes: 0,
    maxPatients: 20,
  });

  // ==================== EFFECTS ====================
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchSchedules();
      fetchDoctors();
    }
  }, [user]);

  // ==================== API CALLS ====================
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/schedules");

      if (!response.ok) {
        throw new Error("Failed to fetch schedules");
      }

      const data = await response.json();
      setSchedules(data);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load schedules",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await fetch("/api/doctor?limit=100");
      if (!response.ok) throw new Error("Failed to fetch doctors");

      const data = await response.json();
      setDoctors(data.doctors || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  const handleCreate = async () => {
    if (!formData.doctorId) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Please select a doctor",
      });
      return;
    }

    const activeDays = formData.dayOfWeek.filter((day) => day.available);
    if (activeDays.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Please select at least one day",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Prepare payload with doctorId as string (backend will convert to ObjectId)
      const payload = {
        ...formData,
        doctorId: formData.doctorId, // Send as string, backend handles ObjectId conversion
      };

      const response = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create schedule");
      }

      // Close form and show loading state
      resetForm();
      setLoading(true);

      // Refresh schedules list to include new schedule with doctor info
      await fetchSchedules();

      // Show success message after data is refreshed
      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Schedule created successfully",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error creating schedule:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to create schedule",
      });
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/schedules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: editingId, ...formData }),
      });

      if (!response.ok) {
        throw new Error("Failed to update schedule");
      }

      // Close form and show loading state
      resetForm();
      setLoading(true);

      // Refresh schedules list to get updated data with doctor info
      await fetchSchedules();

      // Show success message after data is refreshed
      await Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Schedule updated successfully",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error updating schedule:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update schedule",
      });
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the schedule",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/schedules?id=${scheduleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete schedule");
      }

      // Optimistic UI update
      setSchedules((prev) => prev.filter((s) => s._id !== scheduleId));

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Schedule has been deleted",
        timer: 2000,
      });
    } catch (error) {
      console.error("Error deleting schedule:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete schedule",
      });
      fetchSchedules(); // Revert optimistic update
    }
  };

  // ==================== FORM HANDLERS ====================
  const handleEdit = (schedule: DoctorWithSchedule) => {
    setEditingId(schedule._id);
    setFormData({
      doctorId: schedule.doctorId,
      dayOfWeek: schedule.dayOfWeek.map((day) => ({
        hari: day.hari,
        available: day.available,
        startTime: day.startTime,
        endTime: day.endTime,
      })),
      isAvailable: schedule.isAvailable,
      firstCallTime: "",
      isOnTime: schedule.isOnTime,
      delayMinutes: schedule.delayMinutes,
      maxPatients: schedule.maxPatients,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      doctorId: "",
      dayOfWeek: [
        {
          hari: "Monday",
          available: false,
          startTime: "09:00",
          endTime: "17:00",
        },
        {
          hari: "Tuesday",
          available: false,
          startTime: "09:00",
          endTime: "17:00",
        },
        {
          hari: "Wednesday",
          available: false,
          startTime: "09:00",
          endTime: "17:00",
        },
        {
          hari: "Thursday",
          available: false,
          startTime: "09:00",
          endTime: "17:00",
        },
        {
          hari: "Friday",
          available: false,
          startTime: "09:00",
          endTime: "17:00",
        },
        {
          hari: "Saturday",
          available: false,
          startTime: "09:00",
          endTime: "17:00",
        },
        {
          hari: "Sunday",
          available: false,
          startTime: "09:00",
          endTime: "17:00",
        },
      ],
      isAvailable: true,
      firstCallTime: "",
      isOnTime: true,
      delayMinutes: 0,
      maxPatients: 20,
    });
  };

  const updateDaySchedule = (
    index: number,
    field: keyof ScheduleFormData["dayOfWeek"][number],
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      dayOfWeek: prev.dayOfWeek.map((day, i) =>
        i === index ? { ...day, [field]: value } : day
      ),
    }));
  };

  // ==================== LOADING & AUTH CHECK ====================
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

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation
        isAuthenticated={true}
        userRole="admin"
        userName={user.name}
        onLogout={logout}
      />

      <AdminHeader
        title='Doctor <span class="text-primary">Schedules</span>'
        subtitle="Manage doctor schedules and availability"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <AdminTabs />

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Button
              onClick={() => setViewMode("calendar")}
              variant={viewMode === "calendar" ? "default" : "outline"}
              size="sm"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Calendar View
            </Button>
            <Button
              onClick={() => setViewMode("list")}
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
            >
              <List className="w-4 h-4 mr-2" />
              List View
            </Button>
          </div>

          <Button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-linear-to-r from-primary to-accent hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Schedule
          </Button>
        </div>

        {/* Form Section */}
        {showForm && (
          <Card className="p-6 mb-6 border-2 border-primary/20 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">
                {editingId ? "Edit Schedule" : "Create New Schedule"}
              </h3>
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid gap-6">
              {/* Doctor Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Doctor <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.doctorId}
                  onChange={(e) =>
                    setFormData({ ...formData, doctorId: e.target.value })
                  }
                  disabled={!!editingId}
                  className="w-full px-4 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.name} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              {/* Days of Week */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Days of Week <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {formData.dayOfWeek.map((day, index) => (
                    <div
                      key={day.hari}
                      className="flex items-center gap-4 p-4 border-2 rounded-lg bg-muted/30"
                    >
                      <input
                        type="checkbox"
                        checked={day.available}
                        onChange={(e) =>
                          updateDaySchedule(
                            index,
                            "available",
                            e.target.checked
                          )
                        }
                        className="w-5 h-5"
                      />
                      <span className="font-medium w-24">{day.hari}</span>
                      {day.available && (
                        <>
                          <Input
                            type="time"
                            value={day.startTime}
                            onChange={(e) =>
                              updateDaySchedule(
                                index,
                                "startTime",
                                e.target.value
                              )
                            }
                            className="w-32"
                          />
                          <span>to</span>
                          <Input
                            type="time"
                            value={day.endTime}
                            onChange={(e) =>
                              updateDaySchedule(
                                index,
                                "endTime",
                                e.target.value
                              )
                            }
                            className="w-32"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Settings Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Max Patients <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.maxPatients}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxPatients: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Delay Minutes
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.delayMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        delayMinutes: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    First Call Time
                  </label>
                  <Input
                    type="time"
                    value={formData.firstCallTime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        firstCallTime: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isAvailable: e.target.checked,
                        })
                      }
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium">Available</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isOnTime}
                      onChange={(e) =>
                        setFormData({ ...formData, isOnTime: e.target.checked })
                      }
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium">On Time</span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingId ? handleUpdate : handleCreate}
                  disabled={submitting}
                  className="bg-linear-to-r from-primary to-accent"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingId ? "Update" : "Create"} Schedule
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Content Views */}
        <ScheduleTab
          schedules={schedules}
          viewMode={viewMode}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}
