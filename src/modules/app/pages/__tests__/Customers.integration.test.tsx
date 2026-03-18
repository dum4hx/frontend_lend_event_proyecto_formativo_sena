import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Customers from "../Customers";
import type {
  CreateCustomerPayload,
  Customer,
  CustomerStatus,
  DocumentTypeInfo,
  UpdateCustomerPayload,
} from "../../../../types/api";

const mocks = vi.hoisted(() => ({
  getCustomers: vi.fn(),
  getDocumentTypes: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  blacklistCustomer: vi.fn(),
  activateCustomer: vi.fn(),
  deactivateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
  showConfirm: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("../../../../services/customerService", () => ({
  getCustomers: mocks.getCustomers,
  getDocumentTypes: mocks.getDocumentTypes,
  createCustomer: mocks.createCustomer,
  updateCustomer: mocks.updateCustomer,
  blacklistCustomer: mocks.blacklistCustomer,
  activateCustomer: mocks.activateCustomer,
  deactivateCustomer: mocks.deactivateCustomer,
  deleteCustomer: mocks.deleteCustomer,
}));

vi.mock("../../../../hooks/useConfirmModal", () => ({
  useConfirmModal: () => ({
    showConfirm: mocks.showConfirm,
    ConfirmModal: () => null,
  }),
}));

vi.mock("../../../../hooks/useAlertModal", () => ({
  useAlertModal: () => ({
    showError: mocks.showError,
    AlertModal: () => null,
  }),
}));

vi.mock("use-debounce", () => ({
  useDebounce: <T,>(value: T) => [value],
}));

vi.mock("swr", () => ({
  default: (key: string | null) => {
    if (!key) return { data: undefined, isLoading: false };

    if (key === "https://api-colombia.com/api/v1/Department") {
      return {
        data: [{ id: 1, name: "Antioquia" }],
        isLoading: false,
      };
    }

    if (key === "https://api-colombia.com/api/v1/Department/1/cities") {
      return {
        data: [{ id: 10, name: "Medellin", departmentId: 1, postalCode: "050001" }],
        isLoading: false,
      };
    }

    return { data: undefined, isLoading: false };
  },
}));

const documentTypes: DocumentTypeInfo[] = [
  { value: "cc", displayName: "Colombian National ID", description: "National ID" },
  { value: "passport", displayName: "Passport", description: "Passport" },
];

function customerFactory(overrides?: Partial<Customer>): Customer {
  return {
    _id: "customer-1",
    name: {
      firstName: "Jane",
      firstSurname: "Doe",
      secondName: "",
      secondSurname: "",
    },
    email: "jane@example.com",
    phone: "+573001112233",
    documentType: "cc",
    documentNumber: "12345678",
    status: "active" as CustomerStatus,
    ...overrides,
  };
}

function mockInitialData(customers: Customer[]) {
  mocks.getDocumentTypes.mockResolvedValue({
    status: "success",
    data: { documentTypes },
  });

  mocks.getCustomers.mockResolvedValue({
    status: "success",
    data: {
      customers,
      total: customers.length,
      page: 1,
      totalPages: 1,
    },
  });
}

async function fillRequiredCustomerFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByTitle("First Name"), "John");
  await user.type(screen.getByTitle("Last Name"), "Smith");
  await user.type(screen.getByTitle("Email"), "john@example.com");
  await user.type(screen.getByPlaceholderText("3001234567"), "3001234567");
  await user.type(screen.getByTitle("Document Number"), "11223344");
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.showConfirm.mockResolvedValue(true);
  mocks.createCustomer.mockResolvedValue({ status: "success", data: { customer: customerFactory() } });
  mocks.updateCustomer.mockResolvedValue({ status: "success", data: { customer: customerFactory() } });
  mocks.deleteCustomer.mockResolvedValue({ status: "success", data: null });
});

describe("Customers integration", () => {
  it("creates customer without address when address section is hidden", async () => {
    const user = userEvent.setup();
    mockInitialData([]);

    render(<Customers />);

    await user.click(await screen.findByRole("button", { name: "New Customer" }));
    await fillRequiredCustomerFields(user);

    await user.click(screen.getByRole("button", { name: "Create Customer" }));

    await waitFor(() => expect(mocks.createCustomer).toHaveBeenCalledTimes(1));

    const payload = mocks.createCustomer.mock.calls[0][0] as CreateCustomerPayload;
    expect(payload.address).toBeUndefined();
    expect(payload.phone).toBe("+573001234567");
  });

  it("enables address section in create flow and blocks submit when required address fields are missing", async () => {
    const user = userEvent.setup();
    mockInitialData([]);

    render(<Customers />);

    await user.click(await screen.findByRole("button", { name: "New Customer" }));
    await fillRequiredCustomerFields(user);
    await user.click(screen.getByRole("button", { name: "Add Address" }));

    expect(screen.getByTitle("Street Type")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search department...")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Select a department first")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Create Customer" }));

    await waitFor(() => {
      expect(screen.getByText("Street type is required")).toBeInTheDocument();
    });

    expect(mocks.createCustomer).not.toHaveBeenCalled();
  });

  it("updates customer without address when address section remains hidden", async () => {
    const user = userEvent.setup();
    mockInitialData([customerFactory()]);

    render(<Customers />);

    await user.click(await screen.findByRole("button", { name: "Edit customer" }));

    const firstNameInput = screen.getByTitle("First Name");
    await user.clear(firstNameInput);
    await user.type(firstNameInput, "Janet");

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(mocks.updateCustomer).toHaveBeenCalledTimes(1));

    const payload = mocks.updateCustomer.mock.calls[0][1] as UpdateCustomerPayload;
    expect(payload.address).toBeUndefined();
    expect(payload.name?.firstName).toBe("Janet");
  });

  it("updates customer with address payload when customer already has a valid address", async () => {
    const user = userEvent.setup();
    mockInitialData([
      customerFactory({
        address: {
          street: "Calle 15 # 93B-47A",
          city: "Medellin",
          state: "Antioquia",
          country: "Colombia",
          postalCode: "050001",
        },
      }),
    ]);

    render(<Customers />);

    await user.click(await screen.findByRole("button", { name: "Edit customer" }));

    const firstNameInput = screen.getByTitle("First Name");
    await user.clear(firstNameInput);
    await user.type(firstNameInput, "Janet");

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(mocks.updateCustomer).toHaveBeenCalledTimes(1));

    const payload = mocks.updateCustomer.mock.calls[0][1] as UpdateCustomerPayload;
    expect(payload.address).toMatchObject({
      street: "Calle 15 # 93B-47A",
      city: "Medellin",
      state: "Antioquia",
      country: "Colombia",
      postalCode: "050001",
    });
    expect(payload.name?.firstName).toBe("Janet");
  });

  it("deletes customer only after strong danger confirmation", async () => {
    const user = userEvent.setup();
    const existing = customerFactory({ _id: "customer-delete", name: { firstName: "Mike", firstSurname: "Stone" } as Customer["name"] });
    mockInitialData([existing]);

    render(<Customers />);

    await user.click(await screen.findByRole("button", { name: "Delete customer" }));

    await waitFor(() => expect(mocks.showConfirm).toHaveBeenCalledTimes(1));

    const confirmArgs = mocks.showConfirm.mock.calls[0][0] as {
      title: string;
      message: string;
      confirmText: string;
      variant: string;
    };

    expect(confirmArgs.title).toContain("Delete Mike Stone?");
    expect(confirmArgs.variant).toBe("danger");
    expect(confirmArgs.confirmText).toBe("Delete permanently");

    await waitFor(() => expect(mocks.deleteCustomer).toHaveBeenCalledWith("customer-delete"));
  });

  it("shows modal-scoped error when create fails", async () => {
    const user = userEvent.setup();
    mockInitialData([]);
    mocks.createCustomer.mockRejectedValueOnce(new Error("Create failed"));

    render(<Customers />);

    await user.click(await screen.findByRole("button", { name: "New Customer" }));
    await fillRequiredCustomerFields(user);
    await user.click(screen.getByRole("button", { name: "Create Customer" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to create customer")).toBeInTheDocument();
    });

    expect(screen.queryByText("Error loading customers")).not.toBeInTheDocument();
  });

  it("shows modal-scoped error when update fails", async () => {
    const user = userEvent.setup();
    mockInitialData([customerFactory()]);
    mocks.updateCustomer.mockRejectedValueOnce(new Error("Update failed"));

    render(<Customers />);

    await user.click(await screen.findByRole("button", { name: "Edit customer" }));
    const firstNameInput = screen.getByTitle("First Name");
    await user.clear(firstNameInput);
    await user.type(firstNameInput, "Janet");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to update customer")).toBeInTheDocument();
    });

    const globalError = screen.queryByText("Error loading customers");
    expect(globalError).not.toBeInTheDocument();
  });

  it("sends debounced search value to customer listing API", async () => {
    const user = userEvent.setup();
    mockInitialData([customerFactory()]);

    render(<Customers />);

    const searchInput = await screen.findByPlaceholderText("Search by name, email, or document...");
    await user.type(searchInput, "stone");

    await waitFor(() => {
      const lastCallArgs = mocks.getCustomers.mock.calls.at(-1)?.[0] as { search?: string };
      expect(lastCallArgs.search).toBe("stone");
    });
  });

  it("renders destructive delete action in table row", async () => {
    mockInitialData([customerFactory()]);

    render(<Customers />);

    const deleteButton = await screen.findByRole("button", { name: "Delete customer" });
    expect(deleteButton).toBeInTheDocument();

    const row = deleteButton.closest("tr");
    expect(row).not.toBeNull();
    if (!row) return;

    expect(within(row).getByRole("button", { name: "Delete customer" })).toBeInTheDocument();
  });
});
