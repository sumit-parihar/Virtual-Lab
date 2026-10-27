const STATE = {
  active: { label: "Active", cls: "badge--green" },
  invited: { label: "Invited", cls: "badge--yellow" },
  deactivated: { label: "Deactivated", cls: "badge--gray" },
};

const INVITATION = {
  sent: "Email sent",
  failed: "Email failed",
  console: "Email is off (password printed in the server console)",
};

// Account state of a student or instructor, plus the result of the invitation email while they have not signed in yet.
export function AccountStatus({ user }) {
  const state = STATE[user.account_state] || STATE.active;
  const showInvitation = user.account_state === "invited" || user.invitation === "failed";
  return (
    <div className="admin-status">
      <span className={`badge ${state.cls}`}>{state.label}</span>
      {showInvitation && (
        <span className={`admin-status__note${user.invitation === "failed" ? " admin-status__note--bad" : ""}`}>
          {INVITATION[user.invitation] || "Invitation not sent yet"}
        </span>
      )}
    </div>
  );
}
