import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import ForgotPassword from "./ForgotPassword.jsx";

vi.mock("../api/auth.js", () => ({ authApi: { forgotPassword: vi.fn() } }));
import { authApi } from "../api/auth.js";

describe("ForgotPassword", () => {
  it("shows the same neutral message after the request", async () => {
    authApi.forgotPassword.mockResolvedValue({});
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    await userEvent.type(screen.getByLabelText(/email/i), "anyone@college.edu");
    await userEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    expect(authApi.forgotPassword).toHaveBeenCalledWith("anyone@college.edu");
    expect(await screen.findByText(/if this email belongs to an account/i)).toBeInTheDocument();
  });

  it("shows an error when the request fails", async () => {
    authApi.forgotPassword.mockRejectedValue({ response: { status: 429, data: { detail: "Too many requests." } } });
    render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
    await userEvent.type(screen.getByLabelText(/email/i), "anyone@college.edu");
    await userEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    expect(await screen.findByText("Too many requests.")).toBeInTheDocument();
  });
});
