import { Card } from "@/components/ui/card";
import { Calendar, Edit2 } from "lucide-react";
import { DoctorAdmin } from "@/types/docterTypes";

interface ScheduleTabProps {
  doctors: DoctorAdmin[];
}

export function ScheduleTab({ doctors }: ScheduleTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-md">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
          Doctor Schedules
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {doctors.map((doctor) => (
          <Card
            key={doctor._id.toString()}
            className="p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all"
          >
            <div className="flex justify-between items-start mb-5 pb-5 border-b-2 border-border">
              <div>
                <h3 className="font-bold text-foreground text-xl mb-1">
                  {doctor.name}
                </h3>
                <p className="text-sm text-muted-foreground font-medium">
                  {doctor.specialization}
                </p>
              </div>
              <button
                className="p-2 hover:bg-primary/10 rounded-lg transition-all border border-transparent hover:border-primary/20 hover:scale-105"
                title="Edit Schedule"
              >
                <Edit2 className="w-5 h-5 text-primary" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-linear-to-br from-primary/5 to-accent/5 rounded-xl border-2 border-primary/20">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Monday - Friday
                </p>
                <p className="text-sm font-bold text-foreground">
                  09:00 - 17:00
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  1 hour lunch break at 12:00
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-xl border-2 border-border">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                  Saturday
                </p>
                <p className="text-sm font-bold text-foreground">
                  09:00 - 13:00
                </p>
              </div>
              <div className="p-4 bg-muted/50 rounded-xl border-2 border-border">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
                  Sunday
                </p>
                <p className="text-sm font-bold text-muted-foreground">
                  Closed
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
