import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, Edit2, Trash2 } from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  clinic: string;
  status: string;
  todayPatients: number;
  currentQueue: number;
  currentlyServing: string | null;
  avgWaitTime: number;
  completedToday: number;
  image: string;
  timeStatus: "onTime" | number;
}

interface DoctorsTabProps {
  doctors: Doctor[];
  onAddDoctor: () => void;
}

export function DoctorsTab({ doctors, onAddDoctor }: DoctorsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-md">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
            Manage Doctors
          </h2>
        </div>
        <Button
          onClick={onAddDoctor}
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all h-11"
        >
          <Plus className="w-5 h-5" />
          Add Doctor
        </Button>
      </div>

      <Card className="p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm overflow-x-auto">
        <div className="min-w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-primary/20 bg-linear-to-r from-primary/5 to-accent/5">
                <th className="text-left py-4 px-4 font-bold text-foreground uppercase tracking-wide text-xs">
                  Name
                </th>
                <th className="text-left py-4 px-4 font-bold text-foreground uppercase tracking-wide text-xs">
                  Specialization
                </th>
                <th className="text-left py-4 px-4 font-bold text-foreground uppercase tracking-wide text-xs">
                  Clinic
                </th>
                <th className="text-left py-4 px-4 font-bold text-foreground uppercase tracking-wide text-xs">
                  Status
                </th>
                <th className="text-left py-4 px-4 font-bold text-foreground uppercase tracking-wide text-xs">
                  Today&apos;s Patients
                </th>
                <th className="text-left py-4 px-4 font-bold text-foreground uppercase tracking-wide text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr
                  key={doctor.id}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <p className="font-bold text-foreground">{doctor.name}</p>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground font-medium">
                    {doctor.specialization}
                  </td>
                  <td className="py-4 px-4 text-muted-foreground font-medium">
                    {doctor.clinic}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${
                        doctor.status === "online"
                          ? "bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300 border-green-200 dark:border-green-800"
                          : "bg-gray-50 text-gray-700 dark:bg-gray-950/50 dark:text-gray-300 border-gray-200 dark:border-gray-800"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          doctor.status === "online"
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
                      />
                      {doctor.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-bold text-foreground">
                      {doctor.todayPatients}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-2">
                      <button
                        className="p-2 hover:bg-primary/10 rounded-lg transition-all border border-transparent hover:border-primary/20"
                        title="Edit Doctor"
                      >
                        <Edit2 className="w-4 h-4 text-primary" />
                      </button>
                      <button
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all border border-transparent hover:border-red-200 dark:hover:border-red-800"
                        title="Delete Doctor"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
