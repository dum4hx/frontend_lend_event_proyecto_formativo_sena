import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { useCategories } from "../hooks";
import { CategoryList, CategoryDetailModal } from "../components";
import { AdminPagination } from "../../../components";
import { ExcelExportImport } from "../../../../../components/export/ExcelExportImport";
import { useToast } from "../../../../../contexts/ToastContext";
import type { MaterialCategory } from "../../../../../types/api";

export const CategoryCatalog: React.FC = () => {
  const navigate = useNavigate();
  const { categories, loading, error, removeCategory, addCategory } = useCategories();
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | null>(null);
  const pageSize = 10;

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()),
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
      `Do you want to delete "${category.name}"? This action cannot be undone.`,
      "Confirm Deletion",
      {
        duration: Infinity,
        action: {
          label: "Confirm",
          onClick: async () => {
            try {
              await removeCategory(category._id);
              showToast("success", "Category deleted successfully", "Success");
            } catch (error) {
              const err = error as Error;
              showToast("error", err.message || "Failed to delete category", "Error");
            }
          },
        },
      },
    );
  };

  const handleImportCategories = async (data: Record<string, unknown>[]) => {
    try {
      let successCount = 0;
      for (const item of data) {
        try {
          await addCategory({
            name: item.name as string,
            description: item.description as string,
          });
          successCount++;
        } catch (itemError) {
          console.error("Error importing item:", item, itemError);
        }
      }
      showToast("success", `Imported ${successCount}/${data.length} categories`, "Import Complete");
    } catch (error) {
      const err = error as Error;
      showToast("error", err.message || "Error importing categories", "Import Failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading categories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Material Categories</h1>
          <p className="text-gray-400">Manage your material category catalog</p>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search categories..."
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
              showLabels={true}
            />
            <button
              onClick={() => navigate("create")}
              className="flex items-center gap-2 px-6 py-3 font-semibold rounded-lg transition-colors whitespace-nowrap gold-action-btn"
            >
              <Plus size={20} />
              New Category
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">Total Categories</p>
            <p className="text-3xl font-bold text-white">{categories.length}</p>
          </div>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-1">Search Results</p>
            <p className="text-3xl font-bold text-white">{filteredCategories.length}</p>
          </div>
        </div>

        {/* Category List */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
          <CategoryList
            categories={pagedCategories}
            onView={setSelectedCategory}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredCategories.length}
            pageSize={pageSize}
            itemLabel="categories"
            onPageChange={setPage}
          />
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
