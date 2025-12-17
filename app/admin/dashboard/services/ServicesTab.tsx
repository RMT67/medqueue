"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Clock,
} from "lucide-react";
import { Service } from "@/types/serviceTypes";
import { ServiceFormModal } from "./ServiceFormModal";
import Swal from "sweetalert2";

interface ServicesTabProps {
  services: Service[];
  onRefresh: () => void;
}

export function ServicesTab({ services, onRefresh }: ServicesTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const categories = [
    "Consultation",
    "Laboratory",
    "Radiology",
    "Procedure",
    "Emergency",
    "Other",
  ];

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || service.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && service.isActive) ||
      (statusFilter === "inactive" && !service.isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDelete = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      const response = await fetch(`/api/service?id=${serviceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onRefresh();
      } else {
        Swal.fire("Error", "Failed to delete service", "error");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      Swal.fire("Error", "Failed to delete service", "error");
    }
  };

  const handleToggleStatus = async (
    serviceId: string,
    currentStatus: boolean
  ) => {
    const action = currentStatus ? "deactivate" : "activate";

    try {
      const response = await fetch(
        `/api/service?id=${serviceId}&action=${action}`,
        {
          method: "PATCH",
        }
      );

      if (response.ok) {
        onRefresh();
      } else {
        Swal.fire("Error", "Failed to update service status", "error");
      }
    } catch (error) {
      console.error("Error updating service status:", error);
      Swal.fire("Error", "Failed to update service status", "error");
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleSaveSuccess = () => {
    handleCloseModal();
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
            Services Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Total:{" "}
            <span className="font-semibold text-foreground">
              {filteredServices.length}
            </span>{" "}
            services
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-primary to-accent text-white rounded-lg hover:from-primary/90 hover:to-accent/90 transition-all shadow-lg hover:shadow-xl font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Service
        </button>
      </div>

      {/* Filters */}
      <Card className="p-6 border-2 shadow-xl bg-card/80 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none bg-background"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-background"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </Card>

      {/* Services Table */}
      {filteredServices.length === 0 ? (
        <Card className="p-12 text-center border-2 shadow-xl bg-card/80 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              No Services Found
            </h3>
            <p className="text-muted-foreground max-w-md">
              {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search or filters to find services."
                : "No services available. Click 'Add Service' to create a new service."}
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
                    Code
                  </th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                    Service Name
                  </th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                    Category
                  </th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                    Price
                  </th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                    Duration
                  </th>
                  <th className="text-left p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-center p-4 font-semibold text-sm text-foreground uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service) => (
                  <tr
                    key={service._id.toString()}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4">
                      <span className="font-mono font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                        {service.code}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-foreground mb-1">
                          {service.name}
                        </p>
                        {service.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {service.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
                        {service.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-foreground">
                          {service.currency}{" "}
                          {service.price.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">
                          {service.duration} min
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${
                          service.isActive
                            ? "bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                            : "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                        }`}
                      >
                        {service.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(service)}
                          className="p-2 hover:bg-primary/10 rounded-lg transition-all border border-transparent hover:border-primary/20"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-primary" />
                        </button>
                        <button
                          onClick={() =>
                            handleToggleStatus(
                              service._id.toString(),
                              service.isActive
                            )
                          }
                          className={`p-2 rounded-lg transition-all border ${
                            service.isActive
                              ? "hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-950/50"
                              : "hover:bg-muted hover:border-border"
                          }`}
                          title={service.isActive ? "Deactivate" : "Activate"}
                        >
                          {service.isActive ? (
                            <ToggleRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(service._id.toString())}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-all border border-transparent hover:border-red-200 dark:hover:border-red-800"
                          title="Delete"
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
      )}

      {/* Service Form Modal */}
      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSaveSuccess}
        service={editingService}
      />
    </div>
  );
}
