import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/auth.js";
import { errorMessage } from "../utils/errors.js";
import "./Profile.css";

const ROLE_LABEL = { student: "Student", instructor: "Instructor", admin: "Admin" };

const batchLabel = (b) => `${b.name} (${b.academic_year})`;

// Read-only account details for every role, with a link to change the password.
export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    authApi
      .profile()
      .then(setProfile)
      .catch((err) => setError(errorMessage(err, "Could not load your profile. Please try again.")));
  }, []);

  if (error) return <div className="profile"><div className="alert alert--error">{error}</div></div>;
  if (!profile) return <div className="page-loading">Loading profile…</div>;

  const rows = [
    ["Name", profile.full_name],
    ["Email", profile.email],
    ...(profile.role === "student"
      ? [
          ["Roll No. / URN", profile.roll_number || "—"],
          ["Batch", profile.batch ? batchLabel(profile.batch) : "Not assigned yet"],
        ]
      : []),
    ["Role", ROLE_LABEL[profile.role] || profile.role],
    ...(profile.role === "instructor"
      ? [["Batches you teach", profile.batches.length ? profile.batches.map(batchLabel).join(", ") : "None assigned yet"]]
      : []),
  ];

  return (
    <div className="profile">
      <h1 className="profile__title">My Profile</h1>
      <dl className="profile__card">
        {rows.map(([label, value]) => (
          <div key={label} className="profile__row">
            <dt className="profile__label">{label}</dt>
            <dd className="profile__value">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="profile__actions">
        <Link to="/change-password" className="btn btn--ghost">Change password</Link>
      </p>
    </div>
  );
}
