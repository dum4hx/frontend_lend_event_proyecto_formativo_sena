import { useState } from "react";
import { Plus, Eye, Search, Loader2, AlertCircle } from "lucide-react";
import { useApiQuery } from "../../../../hooks/useApiQuery";
import { useLanguage } from "../../../../contexts/useLanguage";
import { PageHeader } from "../../../../components/ui";
import { getPackages } from "../../../../services/materialService";
import type { Package } from "../../../../types/api";
import CreatePackageModal from "./CreatePackageModal";
import PackageDetailModal from "./PackageDetailModal";

export default function MaterialPlans() {
  const { language } = useLanguage();
  const isEs = language === "es";
  const { data, isLoading, error, refetch } = useApiQuery(() => getPackages(), {
    context: "MaterialPlans",
  });
  const packages = data?.data?.packages ?? [];

  const [searchTerm, setSearchTerm] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [viewPkg, setViewPkg] = useState<Package | null>(null);

  const filtered = packages.filter((pkg) =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#FFD700]" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <AlertCircle className="text-red-400" size={32} />
        <p className="text-red-400 text-sm">{error.message}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-[#1a1a1a] border border-[#333] text-gray-300 rounded-lg hover:border-[#FFD700] text-sm transition"
        >
          {isEs ? "Reintentar" : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div data-help-id="plans-title">
        <PageHeader
          title={isEs ? "Planes de Material" : "Material Plans"}
          subtitle={
            isEs
              ? "Crea y gestiona planes para paquetes de materiales"
              : "Create and manage rental plans for material bundles"
          }
          actions={
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-[8px] font-semibold transition-all gold-action-btn"
            >
              <Plus size={20} />
              {isEs ? "Agregar Plan" : "Add Plan"}
            </button>
          }
        />
      </div>

      {/* Search */}
      <div data-help-id="plans-search" className="flex-1 max-w-sm relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
          size={20}
        />
        <input
          type="text"
          placeholder={isEs ? "Buscar planes..." : "Search plans..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-[8px] text-white placeholder-gray-600 focus:outline-none focus:border-[#FFD700] transition-all"
        />
      </div>

      {/* Plans Grid */}
      <div data-help-id="plans-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filtered.map((pkg) => (
          <div
            key={pkg._id}
            data-help-id="plans-card"
            className="bg-[#1a1a1a] border border-[#333] rounded-[12px] p-6 hover:border-[#FFD700] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="text-lg font-bold text-white truncate">{pkg.name}</h3>
                {pkg.description && (
                  <p className="text-gray-500 text-xs mt-1 line-clamp-2">{pkg.description}</p>
                )}
              </div>
              <button
                onClick={() => setViewPkg(pkg)}
                className="p-2 hover:bg-[#121212] rounded-[6px] text-gray-400 hover:text-[#FFD700] transition-all shrink-0"
                title="View details"
              >
                <Eye size={18} />
              </button>
            </div>

            {/* Details */}
            <div className="space-y-3 border-t border-[#333] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">
                  {isEs ? "Precio / Día" : "Price / Day"}
                </span>
                <span className="text-[#FFD700] font-bold text-lg">
                  {pkg.pricePerDay != null
                    ? `$${pkg.pricePerDay.toFixed(2)}`
                    : isEs
                      ? "Auto"
                      : "Auto"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">
                  {isEs ? "Tipos de Material" : "Material Types"}
                </span>
                <span className="bg-[#FFD700]/20 text-[#FFD700] px-3 py-1 rounded-full text-sm font-semibold">
                  {pkg.items.length}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">{isEs ? "No se encontraron planes" : "No plans found"}</p>
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreatePackageModal onClose={() => setShowCreate(false)} onSaved={() => void refetch()} />
      )}
      {editingPkg && (
        <CreatePackageModal
          initialPackage={editingPkg}
          onClose={() => setEditingPkg(null)}
          onSaved={() => {
            setEditingPkg(null);
            void refetch();
          }}
        />
      )}
      {viewPkg && (
        <PackageDetailModal
          pkg={viewPkg}
          onClose={() => setViewPkg(null)}
          onEdit={(pkg) => {
            setViewPkg(null);
            setEditingPkg(pkg);
          }}
        />
      )}
    </div>
  );
}
