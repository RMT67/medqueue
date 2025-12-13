"use client";

import { useRouter, usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";
import {
  Users,
  Activity,
  Calendar,
  ClipboardList,
  Package,
} from "lucide-react";

export function AdminTabs() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="mb-6 lg:mb-8">
      <Card className="p-2 border-2 shadow-lg bg-card/80 backdrop-blur-sm">
        <div className="flex gap-2 overflow-x-auto">
          {(
            [
              {
                key: "overview",
                label: "Overview",
                path: "/admin/dashboard",
                icon: Activity,
              },
              {
                key: "doctors",
                label: "Doctors",
                path: "/admin/dashboard/doctors",
                icon: Users,
              },
              {
                key: "schedule",
                label: "Schedule",
                path: "/admin/dashboard/schedules",
                icon: Calendar,
              },
              {
                key: "services",
                label: "List Service",
                path: "/admin/dashboard/services",
                icon: ClipboardList,
              },
              {
                key: "items",
                label: "List Item",
                path: "/admin/dashboard/item",
                icon: Package,
              },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = pathname === tab.path;
            return (
              <button
                key={tab.key}
                onClick={() => router.push(tab.path)}
                className={`px-5 py-3 rounded-lg font-semibold transition-all whitespace-nowrap capitalize flex items-center gap-2 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
