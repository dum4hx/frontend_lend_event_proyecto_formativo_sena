import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CategoryForm } from "../CategoryForm";

const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
}));

vi.mock("../../../../../../contexts/ToastContext", () => ({
  useToast: () => ({
    showToast: mocks.showToast,
  }),
}));

describe("CategoryForm integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps submit disabled until category name is valid", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<CategoryForm onSubmit={onSubmit} onCancel={() => undefined} />);

    const submitButton = screen.getByRole("button", { name: "Create Category" });
    expect(submitButton).toBeDisabled();

    expect(screen.queryByText("Category name is required")).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits valid category payload", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<CategoryForm onSubmit={onSubmit} onCancel={() => undefined} />);

    await user.type(screen.getByPlaceholderText("e.g., Chairs, Tables, Lighting..."), "Audio");
    await user.type(screen.getByPlaceholderText("Brief description of this category..."), "Audio gear");
    await user.click(screen.getByRole("button", { name: "Create Category" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Audio",
      description: "Audio gear",
    });
  });

  it("marks form invalid when description exceeds 500 characters", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<CategoryForm onSubmit={onSubmit} onCancel={() => undefined} />);

    const nameInput = screen.getByPlaceholderText("e.g., Chairs, Tables, Lighting...");
    fireEvent.change(nameInput, { target: { value: "Audio" } });

    const longDescription = "a".repeat(501);
    const descriptionInput = screen.getByPlaceholderText(
      "Brief description of this category...",
    ) as HTMLTextAreaElement;
    fireEvent.change(descriptionInput, { target: { value: longDescription } });

    fireEvent.blur(descriptionInput);

    expect(descriptionInput.value.length).toBe(501);
    expect(screen.getByText("Description must not exceed 500 characters")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Category" })).toBeDisabled();
  });
});
