import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CategoryCatalog } from "../CategoryCatalog";
import type { MaterialCategory } from "../../../../../../types/api";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  showToast: vi.fn(),
  removeCategory: vi.fn(),
  addCategory: vi.fn(),
  refetch: vi.fn(),
  useCategories: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("../../hooks", () => ({
  useCategories: () => mocks.useCategories(),
}));

vi.mock("../../../../../../contexts/ToastContext", () => ({
  useToast: () => ({
    showToast: mocks.showToast,
  }),
}));

vi.mock("../../components", () => ({
  CategoryList: ({ categories }: { categories: MaterialCategory[] }) => (
    <div data-testid="category-list">Rows: {categories.length}</div>
  ),
  CategoryDetailModal: () => null,
}));

vi.mock("../../../../components", () => ({
  AdminPagination: () => <div data-testid="pagination" />,
}));

vi.mock("../../../../../../components/export/ExcelExportImport", () => ({
  ExcelExportImport: ({
    onImport,
  }: {
    onImport: (rows: Record<string, unknown>[]) => Promise<void>;
  }) => (
    <button
      type="button"
      onClick={() =>
        void onImport([
          { name: "Audio", description: "Sound equipment" },
          { name: "", description: "Invalid row" },
        ])
      }
    >
      Import Categories
    </button>
  ),
}));

function categoryFactory(overrides?: Partial<MaterialCategory>): MaterialCategory {
  return {
    _id: "category-1",
    code: "CAT-001",
    organizationId: "org-1",
    name: "Lighting",
    description: "Stage lights",
    attributes: [],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();

  mocks.addCategory.mockResolvedValue(categoryFactory({ _id: "new-category" }));
  mocks.removeCategory.mockResolvedValue(undefined);
  mocks.refetch.mockResolvedValue(undefined);

  mocks.useCategories.mockReturnValue({
    categories: [categoryFactory()],
    loading: false,
    error: null,
    removeCategory: mocks.removeCategory,
    addCategory: mocks.addCategory,
    refetch: mocks.refetch,
  });
});

describe("CategoryCatalog integration", () => {
  it("shows retry UI on error and calls refetch", async () => {
    const user = userEvent.setup();

    mocks.useCategories.mockReturnValue({
      categories: [],
      loading: false,
      error: "Network down",
      removeCategory: mocks.removeCategory,
      addCategory: mocks.addCategory,
      refetch: mocks.refetch,
    });

    render(<CategoryCatalog />);

    expect(screen.getByText("Unable to load categories")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(mocks.refetch).toHaveBeenCalledTimes(1);
  });

  it("shows empty-state CTA and navigates to create", async () => {
    const user = userEvent.setup();

    mocks.useCategories.mockReturnValue({
      categories: [],
      loading: false,
      error: null,
      removeCategory: mocks.removeCategory,
      addCategory: mocks.addCategory,
      refetch: mocks.refetch,
    });

    render(<CategoryCatalog />);

    expect(screen.getByText("No categories found")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create Category" }));

    expect(mocks.navigate).toHaveBeenCalledWith("create");
  });

  it("shows partial import warning when at least one row fails", async () => {
    const user = userEvent.setup();

    render(<CategoryCatalog />);

    await user.click(screen.getByRole("button", { name: "Import Categories" }));

    await waitFor(() => {
      expect(mocks.showToast).toHaveBeenCalledWith(
        "warning",
        expect.stringContaining("Imported 1/2"),
        "Import Partial",
      );
    });
  });

  it("restores search term from localStorage", () => {
    localStorage.setItem(
      "materialCategories.catalog.v1",
      JSON.stringify({ searchTerm: "light", page: 1 }),
    );

    render(<CategoryCatalog />);

    const searchInput = screen.getByPlaceholderText("Search categories...") as HTMLInputElement;
    expect(searchInput.value).toBe("light");
  });
});
