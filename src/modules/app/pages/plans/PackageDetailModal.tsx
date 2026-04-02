import { X } from "lucide-react";
import { useLanguage } from "../../../../contexts/useLanguage";
import type { Package } from "../../../../types/api";

interface PackageDetailModalProps {
  pkg: Package;
  onClose: () => void;
  onEdit: (pkg: Package) => void;
}

export default function PackageDetailModal({ pkg, onClose, onEdit }: PackageDetailModalProps) {
  const { language } = useLanguage();
  const isEs = language === "es";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] border border-[#333] rounded-xl max-w-md w-full">
        <div className="border-b border-[#333] p-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{pkg.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1a1a1a] transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {pkg.description && <p className="text-gray-400 text-sm">{pkg.description}</p>}

          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">{isEs ? "Precio / Día" : "Price / Day"}</span>
            <span className="text-[#FFD700] font-bold">
              {pkg.pricePerDay != null
                ? `$${pkg.pricePerDay.toFixed(2)}`
                : isEs
                  ? "Suma de materiales"
                  : "Sum of materials"}
            </span>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
              {isEs ? "Tipos de Material" : "Material Types"}
            </p>
            {pkg.items.length > 0 ? (
              <ul className="space-y-2">
                {pkg.items.map((m, i) => {
                  const mt = m.materialTypeId as unknown;
                  const mtRec =
                    mt && typeof mt === "object" ? (mt as Record<string, unknown>) : null;
                  const label =
                    typeof mt === "string"
                      ? mt
                      : mtRec
                        ? typeof mtRec.name === "string"
                          ? (mtRec.name as string)
                          : typeof mtRec._id === "string"
                            ? (mtRec._id as string)
                            : JSON.stringify(mtRec)
                        : String(mt);

                  const key =
                    typeof mt === "string"
                      ? mt
                      : mtRec && typeof mtRec._id === "string"
                        ? (mtRec._id as string)
                        : String(i);

                  return (
                    <li
                      key={key}
                      className="flex items-center justify-between bg-[#1a1a1a] rounded-lg px-3 py-2 text-sm"
                    >
                      <span className="text-gray-300 font-mono text-xs truncate flex-1 mr-2">
                        {label}
                      </span>
                      <span className="bg-[#FFD700]/20 text-[#FFD700] px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap">
                        × {m.quantity}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-600 text-sm">
                {isEs ? "Sin materiales asignados." : "No materials assigned."}
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-[#333] flex justify-end">
            <button
              type="button"
              onClick={() => onEdit(pkg)}
              data-help-id="plans-open-edit"
              className="px-4 py-2 text-sm font-semibold rounded-lg transition gold-action-btn"
            >
              {isEs ? "Editar" : "Edit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
