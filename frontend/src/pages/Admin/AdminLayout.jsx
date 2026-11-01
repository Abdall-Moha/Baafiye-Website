import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  HiViewGrid,
  HiClock,
  HiCollection,
  HiUsers,
  HiTag,
  HiMail,
  HiGlobeAlt,
  HiMenu,
  HiX,
} from "react-icons/hi";
import { FiLogOut } from "react-icons/fi";
import { api } from "../../api.js";
import { useAuth } from "../../Auth/AuthContext.jsx";

// The logo is in the public folder (the space in the name is written as %20)
const LOGO = "/Baafiye%20Logo.png";

// The menu of the dashboard (badge = a number shown next to the name)
const menuItems = [
  { name: "Overview", path: "/admin/dashboard", icon: HiViewGrid },
  { name: "Pending approvals", path: "/admin/pending", icon: HiClock, badge: "pending" },
  { name: "All items", path: "/admin/items", icon: HiCollection },
  { name: "Users", path: "/admin/users", icon: HiUsers },
  { name: "Categories", path: "/admin/categories", icon: HiTag },
  { name: "Messages", path: "/admin/messages", icon: HiMail },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Is the mobile menu open?
  const [open, setOpen] = useState(false);

  // The dashboard numbers (the pages can read them and refresh them)
  const [stats, setStats] = useState(null);

  // Gets the numbers from the backend
  const refreshStats = useCallback(async () => {
    const { ok, status, data } = await api("/admin/stats", { auth: true });

    if (ok) {
      setStats(data.stats);
      return;
    }

    // The user is not an admin any more: send him out
    if (status === 403) {
      logout();
      navigate("/", { replace: true });
    }
  }, [logout, navigate]);

  // Get the numbers when the dashboard opens
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // Close the mobile menu when the page changes
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // While the mobile menu is open: the page behind does not scroll, Esc closes it
  useEffect(() => {
    if (!open) return;

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKey(e) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = oldOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  // Logs out and goes to the home page
  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  // The title shown at the top (from the menu)
  const currentItem = menuItems.find((item) =>
    location.pathname.startsWith(item.path)
  );
  const title = currentItem ? currentItem.name : "Dashboard";

  // The number of posts waiting for approval
  const pendingCount = stats ? stats.items.pending : 0;

  // The menu + bottom buttons (used by the big sidebar AND the mobile menu)
  const sidebar = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-5">
        <Link to="/admin/dashboard" className="group flex items-center gap-2.5">
          <img
            src={LOGO}
            alt="Baafiye logo"
            className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <span className="leading-tight">
            <span className="block text-lg font-extrabold tracking-tight text-slate-900">
              Baafiye
            </span>
            <span className="block text-[11px] font-bold uppercase tracking-[.14em] text-indigo-600">
              Admin
            </span>
          </span>
        </Link>

        {/* Close button (mobile menu only) */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Close menu"
        >
          <HiX className="size-6" />
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[.14em] text-slate-400">
          Manage
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const count = item.badge === "pending" ? pendingCount : 0;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`size-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600"
                    }`}
                  />
                  <span className="flex-1 truncate">{item.name}</span>

                  {/* Number badge (example: 3 posts waiting) */}
                  {count > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        isActive
                          ? "bg-white/25 text-white"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom: who is logged in + visit site + logout */}
      <div className="shrink-0 space-y-2 border-t border-slate-100 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-indigo-600 font-bold uppercase text-white">
            {user?.name?.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {user?.name}
            </p>
            <p className="truncate text-xs text-slate-500">Administrator</p>
          </div>
        </div>

        {/* Opens the public website in a new tab */}
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
        >
          <HiGlobeAlt className="size-5 shrink-0 text-slate-400 transition-colors group-hover:text-indigo-600" />
          Visit public site
        </a>

        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors duration-200 hover:bg-red-50"
        >
          <FiLogOut className="size-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Big screens: fixed sidebar on the left */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:block">
        {sidebar}
      </aside>

      {/* Small screens: sidebar slides in from the left */}
      <div
        className={`fixed inset-0 z-[60] transition-[visibility] duration-300 lg:hidden ${
          open ? "visible" : "invisible"
        }`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-72 max-w-[85%] bg-white shadow-2xl transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {sidebar}
        </aside>
      </div>

      {/* Right side: top bar + the page */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-full p-2 text-slate-700 transition-colors hover:bg-slate-100 hover:text-indigo-700 lg:hidden"
              aria-label="Open menu"
            >
              <HiMenu className="size-6" />
            </button>
            <h1 className="display-font truncate text-xl text-slate-950 sm:text-2xl">
              {title}
            </h1>
          </div>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 sm:inline-flex"
          >
            <HiGlobeAlt className="size-4" />
            View site
          </a>
        </header>

        {/* The page (Overview, Users, ...) */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet context={{ stats, refreshStats }} />
        </main>
      </div>
    </div>
  );
}