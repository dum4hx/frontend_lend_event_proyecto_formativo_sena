import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useMaterialInstances } from "../hooks";
import { useMaterialTypes } from "../../material-types/hooks";
import { MaterialInstanceForm } from "../components";
import { useToast } from "../../../../../contexts/ToastContext";
import type { CreateMaterialInstancePayload } from "../../../../../types/api";

export const CreateMaterialInstance: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addInstance } = useMaterialInstances();
  const { materialTypes, loading: typesLoading } = useMaterialTypes();
  const { showToast } = useToast();

  const editingInstance = location.state?.instance;
  const isEditing = !!editingInstance;

  const handleSubmit = async (data: CreateMaterialInstancePayload) => {
    try {
      if (isEditing) {
        // Note: For instances, the API only allows status updates via PATCH /instances/:id/status
        // Full updates are not supported, so we only allow creating new instances
        showToast(
          "warning",
          "Editing instances is not fully supported. Please delete and create a new one.",
        );
        return;
      } else {
        await addInstance(data);
        showToast("success", "Material instance created successfully!");
      }
      navigate("/app/material-instances");
    } catch (error: any) {
      showToast("error", error.message || "Error saving material instance");
      throw error;
    }
  };

  if (typesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading material types...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate("/app/material-instances")}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Material Instances
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isEditing ? "Edit Material Instance" : "Create New Material Instance"}
          </h1>
          <p className="text-gray-400">
            {isEditing
              ? "Update the material instance information below"
              : "Add a new physical item to your inventory"}
          </p>
        </div>

        {/* Form */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
          <MaterialInstanceForm
            materialTypes={materialTypes}
            onSubmit={handleSubmit}
            onCancel={() => navigate("/app/material-instances")}
            initialData={editingInstance}
            isEditing={isEditing}
          />
        </div>
      </div>
    </div>
  );
};
