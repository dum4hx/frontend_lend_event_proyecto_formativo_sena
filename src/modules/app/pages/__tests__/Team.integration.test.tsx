import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Team from "../Team";
import type { Role } from "../../../../types/api";

const mocks = vi.hoisted(() => ({
  getUsers: vi.fn(),
  inviteUser: vi.fn(),
  updateUser: vi.fn(),
  updateUserRole: vi.fn(),
  deactivateUser: vi.fn(),
  reactivateUser: vi.fn(),
  getRoles: vi.fn(),
  showConfirm: vi.fn(),
}));

vi.mock("../../../../services/adminService", () => ({
  getUsers: mocks.getUsers,
  inviteUser: mocks.inviteUser,
  updateUser: mocks.updateUser,
  updateUserRole: mocks.updateUserRole,
  deactivateUser: mocks.deactivateUser,
  reactivateUser: mocks.reactivateUser,
}));

vi.mock("../../../../services/roleService", () => ({
  getRoles: mocks.getRoles,
}));

vi.mock("../../../../hooks/useConfirmModal", () => ({
  useConfirmModal: () => ({
    showConfirm: mocks.showConfirm,
    ConfirmModal: () => null,
  }),
}));

const roles: Role[] = [
  {
    _id: "role-owner",
    name: "owner",
    permissions: ["*"] ,
    isReadOnly: true,
    type: "SYSTEM",
  },
  {
    _id: "role-admin",
    name: "admin",
    permissions: ["users:read", "users:update"],
    isReadOnly: false,
    type: "CUSTOM",
  },
  {
    _id: "role-viewer",
    name: "viewer",
    permissions: ["users:read"],
    isReadOnly: false,
    type: "CUSTOM",
  },
];

function usersResponse() {
  return {
    status: "success",
    data: {
      users: [
        {
          _id: "u-active",
          email: "active@example.com",
          profile: { firstName: "Active", lastName: "User" },
          roleName: "viewer",
          status: "active",
        },
        {
          _id: "u-inactive",
          email: "inactive@example.com",
          profile: { firstName: "Inactive", lastName: "Member" },
          roleName: "admin",
          status: "inactive",
        },
      ],
      total: 2,
      page: 1,
      totalPages: 1,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();

  mocks.getUsers.mockResolvedValue(usersResponse());
  mocks.getRoles.mockResolvedValue({
    status: "success",
    data: { items: roles, total: roles.length, page: 1, limit: 10 },
  });

  mocks.inviteUser.mockResolvedValue({ status: "success", data: { user: { id: "u-new" } } });
  mocks.updateUser.mockResolvedValue({ status: "success", data: { user: { id: "u-active" } } });
  mocks.updateUserRole.mockResolvedValue({ status: "success", data: { user: { id: "u-active" } } });
  mocks.deactivateUser.mockResolvedValue({ status: "success", data: null });
  mocks.reactivateUser.mockResolvedValue({ status: "success", data: null });
  mocks.showConfirm.mockResolvedValue(true);
});

describe("Team integration", () => {
  it("invites a member with normalized payload and +57 phone prefix", async () => {
    const user = userEvent.setup();
    render(<Team />);

    await user.click(await screen.findByRole("button", { name: "Invite Member" }));

    await user.type(screen.getByPlaceholderText("Juan"), "Camilo");
    await user.type(screen.getByPlaceholderText("Smith"), "Rojas");
    await user.type(screen.getByPlaceholderText("email@example.com"), "camilo@example.com");
    await user.type(screen.getByPlaceholderText("3001234567"), "3001234567");

    await user.selectOptions(screen.getByRole("combobox", { name: "Role" }), "role-admin");
    await user.click(screen.getByRole("button", { name: "Invite User" }));

    await waitFor(() => expect(mocks.inviteUser).toHaveBeenCalledTimes(1));

    expect(mocks.inviteUser).toHaveBeenCalledWith({
      email: "camilo@example.com",
      phone: "+573001234567",
      name: {
        firstName: "Camilo",
        firstSurname: "Rojas",
      },
      roleId: "role-admin",
    });
  });

  it("edits a member and updates both profile and role", async () => {
    const user = userEvent.setup();
    render(<Team />);

    const editButtons = await screen.findAllByRole("button", { name: "Edit member" });
    await user.click(editButtons[0]);

    const firstNameInput = screen.getByDisplayValue("Active");
    const lastNameInput = screen.getByDisplayValue("User");

    await user.clear(firstNameInput);
    await user.type(firstNameInput, "Adriana");
    await user.clear(lastNameInput);
    await user.type(lastNameInput, "Lopez");

    await user.selectOptions(screen.getByRole("combobox", { name: "Role" }), "role-admin");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledTimes(1));
    expect(mocks.updateUser).toHaveBeenCalledWith("u-active", {
      name: {
        firstName: "Adriana",
        firstSurname: "Lopez",
      },
    });

    expect(mocks.updateUserRole).toHaveBeenCalledWith("u-active", { roleId: "role-admin" });
  });

  it("deactivates an active member after warning confirmation", async () => {
    const user = userEvent.setup();
    render(<Team />);

    await user.click(await screen.findByRole("button", { name: "Deactivate member" }));

    await waitFor(() => expect(mocks.showConfirm).toHaveBeenCalledTimes(1));
    const confirmArgs = mocks.showConfirm.mock.calls[0][0] as {
      title: string;
      confirmText: string;
      variant: string;
    };

    expect(confirmArgs.title).toContain("Deactivate Active User?");
    expect(confirmArgs.confirmText).toBe("Deactivate");
    expect(confirmArgs.variant).toBe("warning");

    await waitFor(() => expect(mocks.deactivateUser).toHaveBeenCalledWith("u-active"));
  });

  it("reactivates an inactive member after info confirmation", async () => {
    const user = userEvent.setup();
    render(<Team />);

    await user.click(await screen.findByRole("button", { name: "Reactivate member" }));

    await waitFor(() => expect(mocks.showConfirm).toHaveBeenCalledTimes(1));
    const confirmArgs = mocks.showConfirm.mock.calls[0][0] as {
      title: string;
      confirmText: string;
      variant: string;
    };

    expect(confirmArgs.title).toContain("Reactivate Inactive Member?");
    expect(confirmArgs.confirmText).toBe("Reactivate");
    expect(confirmArgs.variant).toBe("info");

    await waitFor(() => expect(mocks.reactivateUser).toHaveBeenCalledWith("u-inactive"));
  });
});
