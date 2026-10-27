import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import ResetPassword from "./ResetPassword.jsx";

vi.mock("../api/auth.js", () => ({ authApi: { resetPassword: vi.fn() } }));
import { authApi } from "../api/auth.js";

const open = (url) => render(<MemoryRouter initialEntries={[url]}><ResetPassword /></MemoryRouter>);

describe("ResetPassword", () => {
  it("asks for a new link when the address has no token", () => {
    open("/reset-password");
    expect(screen.getByText(/this reset link is not valid/i)).toBeInTheDocument();
  });

  it("refuses passwords that do not match", async () => {
    open("/reset-password?token=abc");
    await userEvent.type(screen.getByLabelText("New password"), "BrandNew123");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "Different123");
    await userEvent.click(screen.getByRole("button", { name: /set new password/i }));
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    expect(authApi.resetPassword).not.toHaveBeenCalled();
  });

  it("sends the token and the new password, then offers sign in", async () => {
    authApi.resetPassword.mockResolvedValue({});
    open("/reset-password?token=abc");
    await userEvent.type(screen.getByLabelText("New password"), "BrandNew123");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "BrandNew123");
    await userEvent.click(screen.getByRole("button", { name: /set new password/i }));
    expect(authApi.resetPassword).toHaveBeenCalledWith("abc", "BrandNew123");
    expect(await screen.findByText(/your password has been changed/i)).toBeInTheDocument();
  });

  it("shows the server's message when the link has expired", async () => {
    authApi.resetPassword.mockRejectedValue({ response: { status: 400, data: { detail: "This reset link is invalid or has expired." } } });
    open("/reset-password?token=old");
    await userEvent.type(screen.getByLabelText("New password"), "BrandNew123");
    await userEvent.type(screen.getByLabelText("Confirm new password"), "BrandNew123");
    await userEvent.click(screen.getByRole("button", { name: /set new password/i }));
    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument();
  });
});
