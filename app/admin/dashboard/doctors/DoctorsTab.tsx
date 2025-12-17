import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, Edit2, Trash2, Stethoscope, MapPin } from "lucide-react";
import { DoctorAdmin } from "@/types/docterTypes";
import Link from "next/link";
import Image from "next/image";

interface DoctorsTabProps {
  doctors: DoctorAdmin[];
  onDeleteDoctor: (doctorId: string) => void;
}

// Get initials from name
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function DoctorsTab({ doctors, onDeleteDoctor }: DoctorsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-md">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
              Manage Doctors
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Total: <span className="font-semibold text-foreground">{doctors.length}</span> doctors
            </p>
          </div>
        </div>
        <Link href="/admin/dashboard/doctors/addDoctor">
          <Button className="gap-2 bg-linear-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all h-12 font-medium">
            <Plus className="w-5 h-5" />
            Add Doctor
          </Button>
        </Link>
      </div>

      {doctors.length === 0 ? (
        <Card className="p-12 text-center border-2 shadow-xl bg-card/80 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              No Doctors Found
            </h3>
            <p className="text-muted-foreground max-w-md">
              No doctors available. Click "Add Doctor" to create a new doctor profile.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="border-2 shadow-xl bg-card/80 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b-2 border-border sticky top-0">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                    Doctor
                  </th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                    Specialization
                  </th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                    Clinic
                  </th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                    Today&apos;s Patients
                  </th>
                  <th className="text-center p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor) => {
                  const initials = getInitials(doctor.name);
                  return (
                    <tr
                      key={doctor._id.toString()}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-primary/20 shrink-0 shadow-sm">
                            {doctor.image ? (
                              <>
                                <Image
                                  src={doctor.image}
                                  alt={doctor.name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    const parent = target.parentElement;
                                    if (parent) {
                                      const fallback = parent.querySelector(
                                        ".image-fallback"
                                      ) as HTMLElement;
                                      if (fallback) fallback.style.display = "flex";
                                    }
                                  }}
                                />
                                <div className="image-fallback hidden w-full h-full absolute inset-0 items-center justify-center bg-linear-to-br from-primary to-accent text-white font-bold text-sm">
                                  {initials}
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary to-accent text-white font-bold text-sm">
                                {initials}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {doctor.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm font-medium text-foreground">
                            {doctor.specialization}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground">
                            {doctor.clinic}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${
                            doctor.status === "online" || doctor.status === "Available"
                              ? "bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                              : "bg-gray-50 dark:bg-gray-950/50 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              doctor.status === "online" || doctor.status === "Available"
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }`}
                          />
                          {doctor.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">
                            {doctor.todayPatients || 0}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/admin/dashboard/doctors/${doctor._id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20"
                              title="Edit Doctor"
                              asChild
                            >
                              <span>
                                <Edit2 className="w-4 h-4" />
                              </span>
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteDoctor(doctor._id.toString())}
                            className="hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 dark:hover:text-red-400 border border-transparent hover:border-red-200 dark:hover:border-red-800"
                            title="Delete Doctor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
