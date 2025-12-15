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
} from "lucide-react";
import { Service } from "@/types/serviceTypes";
import { ServiceFormModal } from "./ServiceFormModal";

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
        alert("Failed to delete service");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Failed to delete service");
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
        alert("Failed to update service status");
      }
    } catch (error) {
      console.error("Error updating service status:", error);
      alert("Failed to update service status");
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
          <h2 className="text-2xl font-bold text-foreground">
            Services Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Total: {filteredServices.length} services
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
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
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </Card>

      {/* Services Table */}
      {filteredServices.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No services found</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm">Code</th>
                  <th className="text-left p-4 font-semibold text-sm">
                    Service Name
                  </th>
                  <th className="text-left p-4 font-semibold text-sm">
                    Category
                  </th>
                  <th className="text-left p-4 font-semibold text-sm">Price</th>
                  <th className="text-left p-4 font-semibold text-sm">
                    Duration
                  </th>
                  <th className="text-left p-4 font-semibold text-sm">
                    Status
                  </th>
                  <th className="text-center p-4 font-semibold text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((service) => (
                  <tr
                    key={service._id}
                    className="border-b hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4 text-sm font-medium">{service.code}</td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {service.description}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                        {service.category}
                      </span>
                    </td>
                    <td className="p-4 font-medium">
                      {service.currency} {service.price.toLocaleString()}
                    </td>
                    <td className="p-4 text-sm">{service.duration} min</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          service.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {service.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(service)}
                          className="p-2 hover:bg-primary/10 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-primary" />
                        </button>
                        <button
                          onClick={() =>
                            handleToggleStatus(service._id, service.isActive)
                          }
                          className="p-2 hover:bg-muted rounded-lg transition-all"
                          title={service.isActive ? "Deactivate" : "Activate"}
                        >
                          {service.isActive ? (
                            <ToggleRight className="w-4 h-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(service._id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
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
