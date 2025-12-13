"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AdminHeader, AdminTabs } from "@/components/adminDashboard";
import { Doctor } from "@/types/docterTypes";
import Image from "next/image";

export default function UpdateDoctorPage() {
  const router = useRouter();
  const params = useParams();
  const doctorId = params?._id as string;
  const { user, logout, isLoading: authLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    specialization: "",
    clinic: "",
    image: "",
    consultationFee: "" as string | number,
    isActive: true,
  });

  // Fetch doctor data
  useEffect(() => {
    const fetchDoctor = async () => {
      if (!doctorId) return;

      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/doctor/${doctorId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch doctor data");
        }

        const data = await response.json();
        const doctor: Doctor = data.doctor;

        setFormData({
          name: doctor.name || "",
          specialization: doctor.specialization || "",
          clinic: doctor.clinic || "",
          image: doctor.image || "",
          consultationFee: doctor.consultationFee || "",
          isActive: doctor.isActive ?? true,
        });
      } catch (error) {
        console.error("Error fetching doctor:", error);
        setError("Failed to load doctor data");
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.role === "admin") {
      fetchDoctor();
    }
  }, [doctorId, user]);

  // Auth check
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      isActive: e.target.checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/doctor/${doctorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: doctorId,
          ...formData,
          consultationFee: Number(formData.consultationFee),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update doctor");
      }

      //   const data = await response.json();
      setSuccessMessage("Doctor updated successfully!");

      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push("/admin/dashboard/doctors");
      }, 1500);
    } catch (error) {
      console.error("Error updating doctor:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update doctor"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation
        isAuthenticated={true}
        userRole="admin"
        userName={user?.name || "Admin"}
        onLogout={logout}
      />

      <AdminHeader
        title='Update <span class="text-primary">Doctor</span>'
        subtitle="Edit doctor information and settings"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <AdminTabs />

        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/dashboard/doctors")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Doctors
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </Card>
        )}

        {/* Success Message */}
        {successMessage && (
          <Card className="p-4 mb-6 bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
            <p className="text-green-600 dark:text-green-400">
              {successMessage}
            </p>
          </Card>
        )}

        {/* Update Form */}
        <Card className="p-6 lg:p-8 border-2 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Dr. John Doe"
                  className="h-11 border-2 focus:border-primary"
                  required
                />
              </div>

              {/* Specialization */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Specialization <span className="text-red-500">*</span>
                </label>
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  className="w-full h-11 px-4 bg-input border-2 border-border rounded-lg text-foreground focus:border-primary transition-colors"
                  required
                >
                  <option value="">Select specialization</option>
                  <option value="General Practitioner">
                    General Practitioner
                  </option>
                  <option value="Cardiologist">Cardiologist</option>
                  <option value="Dermatologist">Dermatologist</option>
                  <option value="Pediatrician">Pediatrician</option>
                  <option value="Neurologist">Neurologist</option>
                  <option value="Orthopedist">Orthopedist</option>
                  <option value="Psychiatrist">Psychiatrist</option>
                  <option value="Ophthalmologist">Ophthalmologist</option>
                </select>
              </div>

              {/* Clinic */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Clinic <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="clinic"
                  value={formData.clinic}
                  onChange={handleInputChange}
                  placeholder="Clinic name"
                  className="h-11 border-2 focus:border-primary"
                  required
                />
              </div>

              {/* Consultation Fee */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Consultation Fee <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  name="consultationFee"
                  value={formData.consultationFee}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  className="h-11 border-2 focus:border-primary"
                  required
                />
              </div>

              {/* Image URL */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Image URL
                </label>
                <Input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  className="h-11 border-2 focus:border-primary"
                />
              </div>

              {/* Active Status */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleCheckboxChange}
                    className="w-5 h-5 text-primary bg-input border-2 border-border rounded focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm font-semibold text-foreground">
                    Active Status (Doctor available for appointments)
                  </span>
                </label>
              </div>
            </div>

            {/* Image Preview */}
            {formData.image && (
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Image Preview
                </label>
                <Image
                  src={formData.image}
                  alt="Doctor preview"
                  className="w-32 h-32 rounded-lg object-cover border-2 border-border"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/150?text=No+Image";
                  }}
                  width={128}
                  height={128}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/dashboard/doctors")}
                className="flex-1 h-12 border-2 hover:bg-muted transition-colors"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Doctor
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
}
