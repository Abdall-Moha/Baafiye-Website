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
  { name: "Messages", path: "/admin/messages", icon: HiMail, badge: "messages" },
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

  // The numbers shown next to the menu names
  const pendingCount = stats ? stats.items.pending : 0;
  const messageCount = stats ? stats.unreadMessages || 0 : 0;

  // The menu + bottom buttons (used by the big sidebar AND the mobile menu)
  const sidebar = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5">
        <Link to="/admin/dashboard" className="group flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-white p-1 shadow-sm transition-transform duration-300 group-hover:scale-105">
            <img
              src={LOGO}
              alt="Baafiye logo"
              className="h-full w-full object-contain"
            />
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-extrabold tracking-tight text-white">
              Baafiye
            </span>
            <span className="block text-[11px] font-bold uppercase tracking-[.14em] text-sky-300">
              Admin
            </span>
          </span>
        </Link>

        {/* Close button (mobile menu only) */}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full p-2 text-blue-200 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <HiX className="size-6" />
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[.14em] text-blue-300/70">
          Manage
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;
          let count = 0;
          if (item.badge === "pending") count = pendingCount;
          if (item.badge === "messages") count = messageCount;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-900/40"
                    : "text-blue-100/80 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`size-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? "text-white" : "text-blue-300/80 group-hover:text-white"
                    }`}
                  />
                  <span className="flex-1 truncate">{item.name}</span>

                  {/* Number badge (example: 3 posts waiting) */}
                  {count > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        isActive
                          ? "bg-white/25 text-white"
                          : "bg-amber-400 text-amber-950"
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

      {/* Bottom: who is logged in + logout */}
      <div className="shrink-0 space-y-2 border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-500 font-bold uppercase text-white">
            {user?.name?.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">
              {user?.name}
            </p>
            <p className="truncate text-xs text-blue-200">Administrator</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-300 transition-colors duration-200 hover:bg-red-500/15 hover:text-red-200"
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-blue-950 lg:block">
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
          className={`absolute left-0 top-0 h-full w-72 max-w-[85%] bg-blue-950 shadow-2xl transition-transform duration-300 ease-out ${
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
              className="rounded-full p-2 text-slate-700 transition-colors hover:bg-slate-100 hover:text-blue-700 lg:hidden"
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
            aria-label="View the public site"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 p-2.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 sm:px-4 sm:py-2"
          >
            <HiGlobeAlt className="size-5 sm:size-4" />
            <span className="hidden sm:inline">View site</span>
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