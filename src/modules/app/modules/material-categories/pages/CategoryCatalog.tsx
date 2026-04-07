import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { useCategories } from "../hooks";
import { CategoryList, CategoryDetailModal } from "../components";
import { AdminPagination } from "../../../components";
import { ExcelExportImport } from "../../../../../components/export/ExcelExportImport";
import { useToast } from "../../../../../contexts/ToastContext";
import { useLanguage } from "../../../../../contexts/useLanguage";
import { usePermissions } from "../../../../../contexts/usePermissions";
import { useActionPermission } from "../../../../../hooks/useActionPermission";
import Unauthorized from "../../../../../pages/Unauthorized";
import type { MaterialCategory } from "../../../../../types/api";

const CATALOG_STORAGE_KEY = "materialCategories.catalog.v1";

function readStoredCatalogState(): { searchTerm: string; page: number } {
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) {
      return { searchTerm: "", page: 1 };
    }

    const parsed = JSON.parse(raw) as { searchTerm?: string; page?: number };
    return {
      searchTerm: typeof parsed.searchTerm === "string" ? parsed.searchTerm : "",
      page: typeof parsed.page === "number" && parsed.page > 0 ? parsed.page : 1,
    };
  } catch {
    return { searchTerm: "", page: 1 };
  }
}

export const CategoryCatalog: React.FC = () => {
  const navigate = useNavigate();
  const { categories, loading, error, removeCategory, addCategory, refetch } = useCategories();
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const isEs = language === "es";
  const { hasPermission } = usePermissions();
  const { guard, isAllowed } = useActionPermission(isEs ? "es" : "en");
  const [searchTerm, setSearchTerm] = useState(() => readStoredCatalogState().searchTerm);
  const [page, setPage] = useState(() => readStoredCatalogState().page);
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | null>(null);
  const pageSize = 10;
  const searchInputId = "material-categories-search";

  useEffect(() => {
    const payload = { searchTerm, page };
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(payload));
  }, [searchTerm, page]);

  const filteredCategories = useMemo(
    () => categories.filter((cat) => cat.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [categories, searchTerm],
  );

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / pageSize));

  // Ensure current page is within total pages range
  const currentPage = Math.min(page, totalPages);
  const pagedCategories = filteredCategories.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleEdit = (category: MaterialCategory) => {
    navigate("create", { state: { category } });
  };

  const handleDelete = (category: MaterialCategory) => {
    showToast(
      "warning",
      t("materialCategories.toast.deleteConfirmMessage", { name: category.name }),
      t("materialCategories.toast.deleteConfirmTitle"),
      {
        duration: Infinity,
        action: {
          label: t("materialCategories.toast.deleteConfirmBtn"),
          onClick: async () => {
            try {
              await removeCategory(category._id);
              showToast(
                "success",
                t("materialCategories.toast.deleteSuccess"),
                t("common.success"),
              );
            } catch (error) {
              const err = error as Error;
              showToast(
                "error",
                err.message || t("materialCategories.toast.deleteError"),
                t("common.error"),
              );
            }
          },
        },
      },
    );
  };

  const handleImportCategories = async (data: Record<string, unknown>[]) => {
    try {
      let successCount = 0;
      let failedCount = 0;
      for (const item of data) {
        try {
          const name = typeof item.name === "string" ? item.name.trim() : "";
          const description = typeof item.description === "string" ? item.description.trim() : "";

          if (!name) {
            failedCount++;
            continue;
          }

          await addCategory({
            name,
            description,
          });
          successCount++;
        } catch {
          failedCount++;
        }
      }

      if (successCount > 0 && failedCount === 0) {
        showToast(
          "success",
          t("materialCategories.toast.importSuccessMsg", {
            success: String(successCount),
            total: String(data.length),
          }),
          t("materialCategories.toast.importComplete"),
        );
        return;
      }

      if (successCount > 0 && failedCount > 0) {
        showToast(
          "warning",
          t("materialCategories.toast.importPartialMsg", {
            success: String(successCount),
            total: String(data.length),
            failed: String(failedCount),
          }),
          t("materialCategories.toast.importPartial"),
        );
        return;
      }

      showToast(
        "error",
        t("materialCategories.toast.importNoValid"),
        t("materialCategories.toast.importFailed"),
      );
    } catch (error) {
      const err = error as Error;
      showToast(
        "error",
        err.message || t("materialCategories.toast.importError"),
        t("materialCategories.toast.importFailed"),
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] p-8">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="mb-8 space-y-3">
            <div className="h-9 w-72 rounded bg-[#262626]" />
            <div className="h-4 w-80 rounded bg-[#222]" />
          </div>
          <div className="mb-6 h-14 rounded-lg bg-[#1a1a1a] border border-[#333]" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="h-28 rounded-lg bg-[#1a1a1a] border border-[#333]" />
            <div className="h-28 rounded-lg bg-[#1a1a1a] border border-[#333]" />
          </div>
          <div className="rounded-lg bg-[#1a1a1a] border border-[#333] p-6 space-y-3">
            <div className="h-12 rounded bg-[#232323]" />
            <div className="h-12 rounded bg-[#232323]" />
            <div className="h-12 rounded bg-[#232323]" />
            <div className="h-12 rounded bg-[#232323]" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] p-8 flex items-center justify-center">
        <div className="bg-[#1a1a1a] border border-red-900/70 rounded-xl p-6 max-w-lg w-full">
          <h2 className="text-xl font-semibold text-red-300 mb-2">
            {t("materialCategories.errorLoadTitle")}
          </h2>
          <p className="text-sm text-red-200/80 mb-4">{error}</p>
          <button
            onClick={() => void refetch()}
            className="px-4 py-2 rounded-lg border border-[#B88A00] text-[#FFD700] hover:bg-[#FFD700]/10 transition-colors"
          >
            {t("materialCategories.retry")}
          </button>
        </div>
      </div>
    );
  }

  if (!hasPermission("materials:read")) return <Unauthorized />;

  return (
    <div className="min-h-screen bg-[#121212] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div data-help-id="material-categories-title" className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t("materialCategories.title")}</h1>
          <p className="text-gray-400">{t("materialCategories.description")}</p>
        </div>

        {/* Actions Bar */}
        <div
          data-help-id="material-categories-actions"
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="flex-1 relative">
            <label htmlFor={searchInputId} className="sr-only">
              {t("materialCategories.searchLabel")}
            </label>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              id={searchInputId}
              type="text"
              placeholder={t("materialCategories.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700]"
            />
          </div>
          <div className="flex gap-2">
            <ExcelExportImport
              data={filteredCategories as unknown as Record<string, unknown>[]}
              filename="material-categories"
              onImport={handleImportCategories}
              importDisabled={!isAllowed("materials:create")}
              onImportDenied={guard("materials:create", () => {})}
              showLabels={true}
            />
            <button
              onClick={guard("materials:create", () => navigate("create"))}
              aria-disabled={!isAllowed("materials:create")}
              className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-colors whitespace-nowrap border border-[#B88A00] text-[#FFD700] hover:bg-[#FFD700]/10 ${!isAllowed("materials:create") ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Plus size={20} />
              {t("materialCategories.newCategory")}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div
          data-help-id="material-categories-stats"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
        >
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">{t("materialCategories.totalCategories")}</p>
            <p className="text-3xl font-bold text-white">{categories.length}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">{t("materialCategories.searchResults")}</p>
            <p className="text-3xl font-bold text-white">{filteredCategories.length}</p>
          </div>
        </div>

        {/* Category List */}
        <div
          data-help-id="material-categories-list"
          className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6"
        >
          {filteredCategories.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-lg text-white mb-2">{t("materialCategories.noResults")}</p>
              <p className="text-sm text-gray-400 mb-6">
                {searchTerm
                  ? t("materialCategories.noResultsSearchHint")
                  : t("materialCategories.noResultsEmptyHint")}
              </p>
              {!searchTerm && (
                <button
                  onClick={guard("materials:create", () => navigate("create"))}
                  aria-disabled={!isAllowed("materials:create")}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#B88A00] text-[#FFD700] hover:bg-[#FFD700]/10 transition-colors ${!isAllowed("materials:create") ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Plus size={18} />
                  {t("materialCategories.createCategory")}
                </button>
              )}
            </div>
          ) : (
            <>
              <CategoryList
                categories={pagedCategories}
                onView={setSelectedCategory}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
              <div data-help-id="material-categories-pagination">
                <AdminPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredCategories.length}
                  pageSize={pageSize}
                  itemLabel={t("materialCategories.paginationLabel")}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </div>

        {/* Detail Modal */}
        {selectedCategory && (
          <CategoryDetailModal
            category={selectedCategory}
            onClose={() => setSelectedCategory(null)}
          />
        )}
      </div>
    </div>
  );
};
