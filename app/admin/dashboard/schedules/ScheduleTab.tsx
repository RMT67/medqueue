import { Card } from "@/components/ui/card";
import { Stethoscope, Edit2, Clock, DollarSign } from "lucide-react";
import { Service } from "@/types/serviceTypes";

interface ScheduleTabProps {
  services: Service[];
}

export function ScheduleTab({ services }: ScheduleTabProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-md">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
          Medical Services
        </h2>
      </div>

      {services.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No services available</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card
              key={service._id}
              className="p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all"
            >
              <div className="flex justify-between items-start mb-4 pb-4 border-b-2 border-border">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-1 text-xs font-bold bg-primary/10 text-primary rounded-md">
                      {service.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-1">
                    {service.name}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    {service.code}
                  </p>
                </div>
                <button
                  className="p-2 hover:bg-primary/10 rounded-lg transition-all border border-transparent hover:border-primary/20 hover:scale-105"
                  title="Edit Service"
                >
                  <Edit2 className="w-4 h-4 text-primary" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {service.description}
                </p>

                <div className="flex items-center gap-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">
                      {service.duration} min
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-bold text-green-600">
                      {formatPrice(service.price)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
