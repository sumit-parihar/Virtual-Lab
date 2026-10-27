import { render, screen } from "@testing-library/react";
import { AccountStatus } from "./AccountBadges.jsx";

describe("AccountStatus", () => {
  it("shows Active with no email note", () => {
    render(<AccountStatus user={{ account_state: "active", invitation: "sent" }} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.queryByText(/email sent/i)).not.toBeInTheDocument();
  });

  it("shows the invitation result while the user has not signed in", () => {
    render(<AccountStatus user={{ account_state: "invited", invitation: "failed" }} />);
    expect(screen.getByText("Invited")).toBeInTheDocument();
    expect(screen.getByText("Email failed")).toBeInTheDocument();
  });

  it("says when the email is switched off", () => {
    render(<AccountStatus user={{ account_state: "invited", invitation: "console" }} />);
    expect(screen.getByText(/email is off/i)).toBeInTheDocument();
  });

  it("shows Deactivated", () => {
    render(<AccountStatus user={{ account_state: "deactivated", invitation: null }} />);
    expect(screen.getByText("Deactivated")).toBeInTheDocument();
  });
});
