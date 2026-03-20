import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Settings from "../Settings";

const mocks = vi.hoisted(() => ({
  getOrganization: vi.fn(),
  updateOrganization: vi.fn(),
  hasAnyPermission: vi.fn(),
  showToast: vi.fn(),
  setTheme: vi.fn(),
}));

vi.mock("../../../../services/adminService", () => ({
  getOrganization: mocks.getOrganization,
  updateOrganization: mocks.updateOrganization,
}));

vi.mock("../../../../contexts/usePermissions", () => ({
  usePermissions: () => ({
    hasAnyPermission: mocks.hasAnyPermission,
  }),
}));

vi.mock("../../../../contexts/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-1", roleName: "owner" },
  }),
}));

vi.mock("../../../../contexts/ToastContext", () => ({
  useToast: () => ({
    showToast: mocks.showToast,
  }),
}));

vi.mock("../../../../contexts/useTheme", () => ({
  useTheme: () => ({
    theme: "dark",
    setTheme: mocks.setTheme,
  }),
}));

vi.mock("../../../../components/ui", () => ({
  ConfirmDialog: ({
    isOpen,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onClose,
  }: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <p>{title}</p>
        <p>{message}</p>
        <button onClick={onConfirm}>{confirmText}</button>
        <button onClick={onClose}>{cancelText}</button>
      </div>
    ) : null,
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();

  mocks.hasAnyPermission.mockReturnValue(true);
  mocks.getOrganization.mockResolvedValue({
    status: "success",
    data: {
      organization: {
        _id: "org-1",
        name: "LendEvent",
        legalName: "LendEvent SAS",
        email: "admin@lendevent.com",
        phone: "+573001234567",
        taxId: "900123456-7",
      },
    },
  });
  mocks.updateOrganization.mockResolvedValue({ status: "success", data: { ok: true } });
});

describe("Settings integration", () => {
  it("asks confirmation before switching modules with unsaved changes", async () => {
    const user = userEvent.setup();
    render(<Settings />);

    const orgNameInput = await screen.findByDisplayValue("LendEvent");
    await user.clear(orgNameInput);
    await user.type(orgNameInput, "LendEvent Updated");

    await user.click(screen.getByText("Notifications"));

    expect(await screen.findByText("Discard Unsaved Changes?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Stay here" }));
    expect(screen.getByText("Organization Information")).toBeInTheDocument();

    await user.click(screen.getByText("Notifications"));
    await user.click(await screen.findByRole("button", { name: "Discard and switch" }));

    expect(await screen.findByText("Notification Preferences")).toBeInTheDocument();
  });

  it("normalizes tax ID and phone inputs visually while typing", async () => {
    const user = userEvent.setup();
    render(<Settings />);

    const taxIdInput = await screen.findByDisplayValue("900123456-7");
    await user.clear(taxIdInput);
    await user.type(taxIdInput, "9001234567");
    expect((taxIdInput as HTMLInputElement).value).toBe("900123456-7");

    const phoneInput = screen.getByDisplayValue("+573001234567");
    await user.clear(phoneInput);
    await user.type(phoneInput, "3007654321");
    expect((phoneInput as HTMLInputElement).value).toBe("+573007654321");
  });

  it("blocks account save when email is invalid", async () => {
    const user = userEvent.setup();
    render(<Settings />);

    const emailInput = await screen.findByDisplayValue("admin@lendevent.com");
    await user.clear(emailInput);
    await user.type(emailInput, "invalid-email");
    await user.tab();

    const saveButton = screen.getByRole("button", { name: "Save Account" });
    expect(saveButton).toBeDisabled();

    await user.click(saveButton);

    await waitFor(() => {
      expect(mocks.updateOrganization).not.toHaveBeenCalled();
    });
  });
});
