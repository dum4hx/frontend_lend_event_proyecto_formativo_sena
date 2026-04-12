import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ApiError } from "../../../../../lib/api";
import { LoanDetailModal } from "../LoanDetailModal";
import type { UnifiedLoanView } from "../types";

const mocks = vi.hoisted(() => ({
  getLoanDetailGrouped: vi.fn(),
  getLoanMaterials: vi.fn(),
  getInspections: vi.fn(),
  getInvoices: vi.fn(),
}));

vi.mock("../../../../../services/loanService", () => ({
  getLoanDetailGrouped: mocks.getLoanDetailGrouped,
  getLoanMaterials: mocks.getLoanMaterials,
}));

vi.mock("../../../../../services/inspectionService", () => ({
  getInspections: mocks.getInspections,
}));

vi.mock("../../../../../services/invoiceService", () => ({
  getInvoices: mocks.getInvoices,
}));

vi.mock("../../../../components/InvoiceDetailModal", () => ({
  default: () => null,
}));

vi.mock("use-debounce", () => ({
  useDebounce: <T,>(value: T) => [value],
}));

vi.mock("../../../../../contexts/useLanguage", () => ({
  useLanguage: () => ({
    language: "en",
    t: (key: string, params?: Record<string, string | number>) => {
      const dictionary: Record<string, string> = {
        "common.close": "Close",
        "common.loading": "Loading",
        "loans.detail.title": "Loan Detail",
        "loans.detail.subtitle": "Full details and workflow status",
        "loans.detail.loanCode": "Loan Code",
        "loans.detail.customer": "Customer",
        "loans.detail.startDate": "Start Date",
        "loans.detail.endDate": "End Date",
        "loans.detail.requestCreatedAt": "Request Created",
        "loans.detail.createdBy": "Created By",
        "loans.detail.approvedAt": "Approved At",
        "loans.detail.approvedBy": "Approved By",
        "loans.detail.loanCreatedAt": "Loan Created",
        "loans.detail.checkedOutAt": "Checked Out At",
        "loans.detail.checkedOutBy": "Checked Out By",
        "loans.detail.preparedAt": "Preparation Date",
        "loans.detail.preparedBy": "Prepared By",
        "loans.detail.inspectionDone": "Inspection Done",
        "loans.detail.inspectionDate": "Inspection Date",
        "loans.detail.items": "Items",
        "loans.detail.notes": "Notes",
        "loans.detail.notSet": "Not set",
        "loans.detail.loanFinancials": "Loan Financial Summary",
        "loans.detail.totalAmount": "Total Amount",
        "loans.detail.depositAmount": "Deposit Amount",
        "loans.detail.depositStatus": "Deposit Status",
        "loans.detail.damageFees": "Damage Fees",
        "loans.detail.lateFees": "Late Fees",
        "loans.detail.assignedMaterials": "Assigned Materials",
        "loans.detail.materials.searchLabel": "Search",
        "loans.detail.materials.searchPlaceholder": "Search by serial, barcode, instance name, or material type",
        "loans.detail.materials.statusLabel": "Status",
        "loans.detail.materials.statusAll": "All statuses",
        "loans.detail.materials.typeLabel": "Material type",
        "loans.detail.materials.typeAll": "All material types",
        "loans.detail.materials.limitLabel": "Rows per page",
        "loans.detail.materials.totalResults": "{count} material(s)",
        "loans.detail.materials.loading": "Loading materials...",
        "loans.detail.materials.updating": "Updating results...",
        "loans.detail.materials.emptyTitle": "No matching materials",
        "loans.detail.materials.emptyDescription": "Try another search or adjust filters.",
        "loans.detail.materials.error400": "Invalid filter combination. Review your search and try again.",
        "loans.detail.materials.error403": "You do not have permission to view materials for this loan.",
        "loans.detail.materials.error404": "The loan materials could not be found.",
        "loans.detail.materials.errorNetwork": "Network error while loading materials.",
        "loans.detail.materials.errorGeneric": "Could not load loan materials.",
        "loans.detail.materials.retry": "Retry",
        "loans.detail.materials.condition.good": "Good",
        "loans.detail.materials.condition.damaged": "Damaged",
        "loans.detail.materials.condition.lost": "Lost",
        "loans.detail.materials.condition.notSet": "Not set",
        "loans.detail.materials.table.serial": "Serial",
        "loans.detail.materials.table.barcode": "Barcode",
        "loans.detail.materials.table.name": "Name",
        "loans.detail.materials.table.type": "Type",
        "loans.detail.materials.table.status": "Status",
        "loans.detail.materials.table.conditionAtCheckout": "Condition at checkout",
        "loans.detail.materials.table.conditionAtReturn": "Condition at return",
        "loans.detail.materials.table.notes": "Notes",
        "loans.detail.workflow": "Workflow Progress",
        "loans.detail.currentStatus": "Current Status",
      };

      const template = dictionary[key] ?? key;
      if (!params) return template;

      return Object.entries(params).reduce((acc, [name, value]) => {
        return acc.replaceAll(`{${name}}`, String(value));
      }, template);
    },
  }),
}));

vi.mock("../../../../../contexts/useEntityDetail", () => ({
  useEntityDetail: () => ({
    openEntityDetail: vi.fn(),
    closeEntityDetail: vi.fn(),
    isDetailOpen: false,
    active: null,
  }),
}));

function buildView(): UnifiedLoanView {
  return {
    request: {
      _id: "request-1",
      code: "REQ-001",
      customerId: {
        _id: "customer-1",
        email: "customer@example.com",
        name: {
          firstName: "Jane",
          secondName: "",
          firstSurname: "Doe",
          secondSurname: "",
        },
      },
      items: [],
      startDate: "2026-04-01T08:00:00.000Z",
      endDate: "2026-04-03T08:00:00.000Z",
      status: "approved",
      notes: "Test notes",
      totalAmount: 120000,
      depositAmount: 50000,
      createdAt: "2026-03-31T08:00:00.000Z",
    },
    loan: {
      _id: "loan-1",
      code: "LOAN-001",
      customerId: "customer-1",
      status: "active",
      startDate: "2026-04-01T08:00:00.000Z",
      endDate: "2026-04-03T08:00:00.000Z",
      deposit: {
        amount: 50000,
        status: "held",
        transactions: [],
      },
    },
    status: "active",
    statusLabel: "Active",
    customerName: "Jane Doe",
    itemCount: 1,
    displayItems: ["Tripod x1"],
  } as unknown as UnifiedLoanView;
}

function mockLoanDetailGrouped() {
  mocks.getLoanDetailGrouped.mockResolvedValue({
    status: "success",
    data: {
      loan: {
        _id: "loan-1",
        customerId: {
          _id: "customer-1",
          name: { firstName: "Jane", firstSurname: "Doe", secondName: "", secondSurname: "" },
          email: "customer@example.com",
        },
        status: "active",
        startDate: "2026-04-01T08:00:00.000Z",
        endDate: "2026-04-03T08:00:00.000Z",
        deposit: { amount: 50000, status: "held", transactions: [] },
        traceabilityEvents: [
          {
            eventType: "return_received",
            occurredAt: "2026-04-12T12:00:00.000Z",
            performedByName: "Warehouse User",
            performedByEmail: "warehouse@example.com",
            notes: "Items checked on arrival",
          },
          {
            eventType: "checkout",
            occurredAt: "2026-04-10T09:30:00.000Z",
            performedByEmail: "operator@example.com",
          },
        ],
        materialInstancesByType: {
          "material-type-1": {
            instances: [
              {
                materialInstanceId: {
                  _id: "instance-1",
                  serialNumber: "SN-100",
                  barcode: "BC-100",
                  status: "loaned",
                  modelId: "model-1",
                  name: "Camera body",
                },
                materialTypeId: "material-type-1",
                materialType: { _id: "material-type-1", name: "Camera" },
                conditionAtCheckout: "good",
              },
            ],
          },
        },
      },
    },
  });
}

function renderModal() {
  return render(
    <MemoryRouter initialEntries={["/app/loans"]}>
      <LoanDetailModal open onClose={vi.fn()} view={buildView()} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();

  mockLoanDetailGrouped();
  mocks.getInspections.mockResolvedValue({ status: "success", data: { inspections: [] } });
  mocks.getInvoices.mockResolvedValue({
    status: "success",
    data: { invoices: [], page: 1, total: 0, totalPages: 1 },
  });

  mocks.getLoanMaterials.mockResolvedValue({
    status: "success",
    data: {
      loan: { _id: "loan-1", code: "LOAN-001", status: "active" },
      materials: [
        {
          materialInstanceId: {
            _id: "instance-1",
            serialNumber: "SN-100",
            barcode: "BC-100",
            status: "loaned",
            modelId: "model-1",
            name: "Camera body",
          },
          materialTypeId: "material-type-1",
          materialType: {
            _id: "material-type-1",
            name: "Camera",
          },
          conditionAtCheckout: "good",
          conditionAtReturn: "good",
          notes: "Delivered in sealed case",
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    },
  });
});

describe("LoanDetailModal materials integration", () => {
  it("renders loan materials list successfully", async () => {
    renderModal();

    expect(await screen.findByText("SN-100")).toBeInTheDocument();
    expect(screen.getByText("Camera body")).toBeInTheDocument();
    expect(screen.getByText("1 material(s)")).toBeInTheDocument();
  });

  it("renders inspection number and inspection date for returned loans", async () => {
    const view = buildView();
    view.status = "returned";
    if (view.loan) {
      view.loan.status = "returned";
    }

    mocks.getInspections.mockResolvedValue({
      status: "success",
      data: {
        inspections: [
          {
            _id: "inspection-1",
            organizationId: "org-1",
            inspectionNumber: "INSP-2026-001",
            loanId: {
              _id: "loan-1",
              code: "LOAN-001",
              customerId: "customer-1",
              startDate: "2026-04-01T08:00:00.000Z",
              endDate: "2026-04-03T08:00:00.000Z",
            },
            inspectedBy: {
              email: "inspector@example.com",
              profile: { firstName: "Inspector" },
              role: { _id: "role-1", name: "Operator" },
            },
            items: [],
            status: "completed",
            createdAt: "2026-04-10T15:30:00.000Z",
          },
        ],
      },
    });

    render(
      <MemoryRouter initialEntries={["/app/loans"]}>
        <LoanDetailModal open onClose={vi.fn()} view={view} />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Inspection Done")).toBeInTheDocument();
    expect(screen.getByText("INSP-2026-001")).toBeInTheDocument();
    expect(screen.getByText("Inspection Date")).toBeInTheDocument();
    expect(screen.getAllByText("2026", { exact: false }).length).toBeGreaterThan(0);
  });

  it("sends search to server", async () => {
    renderModal();

    await waitFor(() => expect(mocks.getLoanMaterials).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText("Search"), {
      target: { value: "SN-555" },
    });

    await waitFor(() => {
      expect(mocks.getLoanMaterials).toHaveBeenLastCalledWith(
        "loan-1",
        expect.objectContaining({ search: "SN-555" }),
        expect.any(AbortSignal),
      );
    });
  });

  it("applies material type filter", async () => {
    const user = userEvent.setup();
    renderModal();

    await waitFor(() => expect(mocks.getLoanMaterials).toHaveBeenCalled());

    await user.selectOptions(screen.getByLabelText("Material type"), "material-type-1");

    await waitFor(() => {
      expect(mocks.getLoanMaterials).toHaveBeenLastCalledWith(
        "loan-1",
        expect.objectContaining({ materialTypeId: "material-type-1" }),
        expect.any(AbortSignal),
      );
    });
  });

  it("changes page using server pagination", async () => {
    const user = userEvent.setup();

    mocks.getLoanMaterials.mockImplementation((_loanId: string, params?: { page?: number }) => {
      const page = params?.page ?? 1;
      return Promise.resolve({
        status: "success",
        data: {
          loan: { _id: "loan-1", code: "LOAN-001", status: "active" },
          materials: [
            {
              materialInstanceId: {
                _id: `instance-${page}`,
                serialNumber: `SN-10${page}`,
                barcode: `BC-10${page}`,
                status: "loaned",
                modelId: "model-1",
                name: "Camera body",
              },
              materialTypeId: "material-type-1",
              materialType: { _id: "material-type-1", name: "Camera" },
            },
          ],
          total: 2,
          page,
          totalPages: 2,
        },
      });
    });

    renderModal();

    await waitFor(() => {
      expect(mocks.getLoanMaterials).toHaveBeenCalledWith(
        "loan-1",
        expect.objectContaining({ page: 1 }),
        expect.any(AbortSignal),
      );
    });
    await user.click(screen.getByLabelText("Next page"));

    await waitFor(() => {
      expect(mocks.getLoanMaterials).toHaveBeenLastCalledWith(
        "loan-1",
        expect.objectContaining({ page: 2 }),
        expect.any(AbortSignal),
      );
    });
  });

  it("shows empty state when backend returns no materials", async () => {
    mocks.getLoanMaterials.mockResolvedValue({
      status: "success",
      data: {
        loan: { _id: "loan-1", code: "LOAN-001", status: "active" },
        materials: [],
        total: 0,
        page: 1,
        totalPages: 1,
      },
    });

    renderModal();

    expect(await screen.findByText("No matching materials")).toBeInTheDocument();
  });

  it("renders traceability timeline events in ascending order", async () => {
    renderModal();

    expect(await screen.findByText("Retiro / entrega al cliente")).toBeInTheDocument();
    expect(screen.getAllByText("Devolución recibida").length).toBeGreaterThan(0);
    expect(screen.getByText("operator@example.com")).toBeInTheDocument();
    expect(screen.getByText("warehouse@example.com")).toBeInTheDocument();
    expect(screen.getByText("Items checked on arrival")).toBeInTheDocument();
    expect(screen.getByTestId("traceability-kpi-total-events")).toHaveTextContent("2");

    const labels = screen
      .getAllByTestId("material-traceability-label")
      .map((element) => element.textContent);

    expect(labels.slice(0, 2)).toEqual([
      "Retiro / entrega al cliente",
      "Devolución recibida",
    ]);
  });

  it("shows error state for backend errors", async () => {
    mocks.getLoanMaterials.mockRejectedValue(
      new ApiError("Not found", 404, "NOT_FOUND", undefined),
    );

    renderModal();

    expect(await screen.findByText("The loan materials could not be found.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
