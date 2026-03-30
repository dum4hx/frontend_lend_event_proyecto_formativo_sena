import React, { useState, useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { getOrphanedAttributeValues } from "../../../../../services/materialService";
import { useToast } from "../../../../../contexts/ToastContext";
import { useLanguage } from "../../../../../contexts/useLanguage";
import { LoadingSpinner } from "../../../../../components/ui/LoadingSpinner";

interface OrphanedMaterial {
  materialTypeId: string;
  materialTypeName: string;
  attributeName: string;
  currentValue: string;
  allowedValues: string[];
  message: string;
}

/**
 * Audit component to display material types with orphaned or invalid attribute values.
 * Helps identify data quality issues after schema migrations.
 */
export const OrphanedAttributesAudit: React.FC = () => {
  const [orphanedMaterials, setOrphanedMaterials] = useState<OrphanedMaterial[]>([]);
  const [orphanedCount, setOrphanedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { showToast } = useToast();
  const { language } = useLanguage();
  const isEs = language === "es";

  const fetchOrphanedValues = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getOrphanedAttributeValues();
      setOrphanedMaterials(response.data?.orphanedMaterials || []);
      setOrphanedCount(response.data?.orphanedCount || 0);
      
      if ((response.data?.orphanedMaterials || []).length === 0) {
        showToast("success", isEs ? "No hay valores huérfanos" : "No orphaned values found");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error fetching orphaned values";
      setError(errorMessage);
      showToast("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrphanedValues();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-400">
          {isEs ? "Escaneando atributos huérfanos..." : "Scanning for orphaned attributes..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-900">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-semibold mb-2">
              {isEs ? "Error al cargar auditoría" : "Error loading audit"}
            </h3>
            <p className="text-sm">{error}</p>
            <button
              onClick={fetchOrphanedValues}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-2"
            >
              <RefreshCw size={16} />
              {isEs ? "Reintentar" : "Retry"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (orphanedMaterials.length === 0) {
    return (
      <div className="text-center py-12 bg-[#1a1a1a] rounded-lg border border-dashed border-[#333]">
        <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400 text-lg font-semibold">
          {isEs ? "Auditoría completa" : "Audit complete"}
        </p>
        <p className="text-gray-500 text-sm mt-2">
          {isEs
            ? "No se encontraron atributos huérfanos o valores faltantes"
            : "No orphaned or missing attribute values found"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertCircle className="text-yellow-500" size={28} />
            {isEs ? "Auditoría de Atributos" : "Attributes Audit"}
          </h2>
          <p className="text-gray-400 mt-1">
            {isEs
              ? "Materiales con valores de atributo huérfanos o inválidos"
              : "Materials with orphaned or invalid attribute values"}
          </p>
        </div>
        <button
          onClick={fetchOrphanedValues}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-black rounded-lg font-semibold hover:bg-[#FFC700] transition-all disabled:opacity-50"
        >
          <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          {isEs ? "Actualizar" : "Refresh"}
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
          <p className="text-gray-400 text-sm">{isEs ? "Total de problemas" : "Total Issues"}</p>
          <p className="text-3xl font-bold text-white mt-2">{orphanedCount}</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
          <p className="text-gray-400 text-sm">
            {isEs ? "Tipos únicos" : "Unique Material Types"}
          </p>
          <p className="text-3xl font-bold text-white mt-2">
            {new Set(orphanedMaterials.map((v) => v.materialTypeId)).size}
          </p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
          <p className="text-gray-400 text-sm">{isEs ? "Atributos únicos" : "Unique Attributes"}</p>
          <p className="text-3xl font-bold text-white mt-2">
            {new Set(orphanedMaterials.map((v) => v.attributeName)).size}
          </p>
        </div>
      </div>

      {/* Table of Orphaned Values */}
      <div className="overflow-x-auto border border-[#333] rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0f0f0f] border-b border-[#333]">
              <th className="px-6 py-3 text-left text-gray-400 font-semibold">
                {isEs ? "Tipo de Material" : "Material Type"}
              </th>
              <th className="px-6 py-3 text-left text-gray-400 font-semibold">
                {isEs ? "Atributo" : "Attribute"}
              </th>
              <th className="px-6 py-3 text-left text-gray-400 font-semibold">
                {isEs ? "Valor Actual" : "Current Value"}
              </th>
              <th className="px-6 py-3 text-left text-gray-400 font-semibold">
                {isEs ? "Valores Permitidos" : "Allowed Values"}
              </th>
              <th className="px-6 py-3 text-left text-gray-400 font-semibold">
                {isEs ? "Mensaje" : "Message"}
              </th>
              <th className="px-6 py-3 text-left text-gray-400 font-semibold">
                {isEs ? "Acciones" : "Actions"}
              </th>
            </tr>
          </thead>
          <tbody>
            {orphanedMaterials.map((item, idx) => (
              <tr
                key={idx}
                className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors"
              >
                <td className="px-6 py-4 text-white font-medium">
                  <div>
                    <p className="font-semibold">{item.materialTypeName}</p>
                    <p className="text-xs text-gray-500">{item.materialTypeId}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-300">{item.attributeName}</td>
                <td className="px-6 py-4 text-gray-400">
                  <code className="text-xs bg-[#111] px-2 py-1 rounded">
                    {item.currentValue || "(empty)"}
                  </code>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {item.allowedValues && item.allowedValues.length > 0 ? (
                      item.allowedValues.map((val, i) => (
                        <span key={i} className="inline-block px-2 py-1 bg-blue-500/20 border border-blue-500/40 text-blue-300 rounded text-xs">
                          {val}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-xs italic">{isEs ? "Ninguno" : "None"}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-block px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 rounded text-xs max-w-xs">
                    {item.message}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => {
                      showToast(
                        "info",
                        isEs
                          ? `Editar tipo: ${item.materialTypeName}`
                          : `Edit material type: ${item.materialTypeName}`,
                      );
                    }}
                    className="px-3 py-1 bg-[#FFD700] text-black text-xs rounded font-semibold hover:bg-[#FFC700] transition-all"
                  >
                    {isEs ? "Editar" : "Edit"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-blue-300 text-sm">
          {isEs
            ? "Esta auditoría identifica valores de atributo huérfanos u inválidos después de cambios de esquema. Revisa y actualiza los tipos de material como sea necesario."
            : "This audit identifies orphaned or invalid attribute values after schema changes. Review and update material types as needed."}
        </p>
      </div>
    </div>
  );
};
