import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Navbar.css";

const ROLE_LABEL = { student: "Student", instructor: "Instructor", admin: "Admin" };

// The main links for each role.
function linksFor(role) {
  if (role === "student") {
    return [
      { to: "/", label: "Home", end: true },
      { to: "/experiments", label: "Experiments" },
      { to: "/dashboard", label: "View Progress" },
    ];
  }
  if (role === "instructor") {
    return [
      { to: "/", label: "Home", end: true },
      { to: "/batches", label: "Batches" },
    ];
  }
  if (role === "admin") {
    return [
      { to: "/", label: "Home", end: true },
      { to: "/admin/batches", label: "Batches" },
      { to: "/admin/instructors", label: "Instructors" },
      { to: "/admin/students", label: "Students" },
    ];
  }
  return [];
}

function initialsOf(name) {
  const parts = (name || "?").trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

/** Close a popup on outside click or Escape. */
function useDismiss(open, ref, close) {
  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(e) {
      if (ref.current && !ref.current.contains(e.target)) close();
    }
    function onKeyDown(e) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, ref, close]);
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false); // profile menu
  const [linksOpen, setLinksOpen] = useState(false); // phone ☰ menu
  const menuRef = useRef(null);
  const headerRef = useRef(null);

  // Close both menus when the page changes.
  useEffect(() => {
    setMenuOpen(false);
    setLinksOpen(false);
  }, [location.pathname]);

  const closeMenu = useRef(() => setMenuOpen(false)).current;
  const closeLinks = useRef(() => setLinksOpen(false)).current;
  useDismiss(menuOpen, menuRef, closeMenu);
  useDismiss(linksOpen, headerRef, closeLinks);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/login");
  }

  const links = linksFor(user?.role);

  return (
    <header className="navbar" ref={headerRef}>
      <div className="navbar__inner">
        <NavLink to="/" className="navbar__brand" aria-label="ML Virtual Lab, home">
          <span className="navbar__mark" aria-hidden="true">ML</span>
          <span className="navbar__name">ML Virtual Lab</span>
          {user && user.role !== "student" && <span className="navbar__role">{ROLE_LABEL[user.role]}</span>}
        </NavLink>

        {user ? (
          <>
            <nav className={`navbar__links${linksOpen ? " navbar__links--open" : ""}`} id="main-links" aria-label="Main">
              {links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} className="navbar__link">
                  {l.label}
                </NavLink>
              ))}
            </nav>

            <div className="navbar__right">
              <div className="navbar__profile" ref={menuRef}>
                <button
                  type="button"
                  className="navbar__profile-btn"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label={`Profile menu for ${user.full_name}`}
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  <span className="navbar__avatar" aria-hidden="true">{initialsOf(user.full_name)}</span>
                  <span className="navbar__user">{user.full_name}</span>
                </button>
                {menuOpen && (
                  <div className="navbar__menu" role="menu">
                    <div className="navbar__menu-header">
                      <strong>{user.full_name}</strong>
                      <span>{ROLE_LABEL[user.role] || user.role}</span>
                    </div>
                    <NavLink to="/profile" className="navbar__menu-item" role="menuitem">
                      My Profile
                    </NavLink>
                    <button
                      type="button"
                      className="navbar__menu-item navbar__menu-item--button"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="navbar__toggle"
                aria-controls="main-links"
                aria-expanded={linksOpen}
                aria-label={linksOpen ? "Close menu" : "Open menu"}
                onClick={() => setLinksOpen((open) => !open)}
              >
                <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  {linksOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
                </svg>
              </button>
            </div>
          </>
        ) : (
          <NavLink to="/login" className="navbar__link">
            Log in
          </NavLink>
        )}
      </div>
    </header>
  );
}
