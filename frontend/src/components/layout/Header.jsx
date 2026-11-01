
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  HiMenu,
  HiX,
  HiPlus,
  HiLogin,
  HiUser,
  HiViewGrid,
} from "react-icons/hi";
import { FiLogOut } from "react-icons/fi";
import { useAuth } from "../../Auth/AuthContext.jsx";

// The logo is in the public folder
const LOGO = "/Baafiye%20Logo.png";

const navItems = [
  { name: "Home", path: "/" },
  { name: "Items", path: "/items" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  // The logged-in user (null if nobody is logged in)
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin";

  const closeMenu = () => {
    setOpen(false);
  };

  // Logs out and goes to the home page
  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/");
  };

  // Adds a shadow to the header after the page is scrolled a little
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md transition-shadow duration-300 ${
          scrolled
            ? "border-gray-200 shadow-md"
            : "border-gray-100 shadow-none"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">

            {/* Logo */}
            <Link
              to="/"
              onClick={closeMenu}
              className="group flex shrink-0 items-center"
            >
              <img
                src={LOGO}
                alt="Baafiye logo"
                className="h-35 w-35 mt-3 rounded-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden items-center gap-2 lg:flex">
              <Link
                to="/post-item"
                className="group inline-flex items-center gap-1.5 rounded-full bg-indigo-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-800 hover:shadow-md active:translate-y-0"
              >
                <HiPlus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
                Post Item
              </Link>

              {/* Not logged in: Login button */}
              {!user && (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <HiLogin className="size-4" />
                  Login
                </Link>
              )}

              {/* Logged in as admin: Dashboard link */}
              {user && isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-100 hover:shadow-sm"
                >
                  <HiViewGrid className="size-4" />
                  Dashboard
                </Link>
              )}

              {/* Logged in as normal user: button with his name */}
              {user && !isAdmin && (
                <Link
                  to="/profile"
                  className="inline-flex max-w-44 items-center gap-2 rounded-full border border-gray-200 py-1 pl-1 pr-3.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-indigo-700 text-xs font-bold uppercase text-white">
                    {user.name?.charAt(0)}
                  </span>
                  <span className="truncate">{user.name}</span>
                </Link>
              )}

              {/* Logout (only when logged in) */}
              {user && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="grid size-9 place-items-center rounded-full text-gray-500 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                  aria-label="Logout"
                  title="Logout"
                >
                  <FiLogOut className="size-[18px]" />
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-full p-2 text-gray-700 transition-colors duration-200 hover:bg-gray-100 hover:text-indigo-700 lg:hidden"
              aria-label="Open menu"
            >
              <HiMenu className="size-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-[60] transition-[visibility] duration-300 lg:hidden ${
          open ? "visible" : "invisible"
        }`}
        aria-hidden={!open}
      >
        {/* Background Overlay */}
        <div
          onClick={closeMenu}
          className={`absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Left Drawer */}
        <aside
          className={`absolute left-0 top-0 flex h-full w-72 max-w-[85%] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 px-5">
            <Link
              to="/"
              onClick={closeMenu}
              className="flex items-center"
            >
              <img
                src={LOGO}
                alt="Baafiye logo"
                className="h-25 w-25 rounded-full object-cover"
              />
            </Link>

            <button
              type="button"
              onClick={closeMenu}
              className="rounded-full p-2 text-gray-500 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900"
              aria-label="Close menu"
            >
              <HiX className="size-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Who is logged in */}
            {user && (
              <div className="mb-4 flex items-center gap-3 rounded-2xl bg-indigo-50 p-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-indigo-700 text-lg font-bold uppercase text-white">
                  {user.name?.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {user.email}
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-700 hover:translate-x-1 hover:bg-gray-50 hover:text-indigo-700"
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </nav>

            {/* Divider */}
            <div className="my-4 border-t border-gray-100" />

            <div className="flex flex-col gap-2">
              {/* Post Item */}
              <Link
                to="/post-item"
                onClick={closeMenu}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-800 hover:shadow-md"
              >
                <HiPlus className="size-5" />
                Post Item
              </Link>

              {/* Not logged in: Login */}
              {!user && (
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <HiLogin className="size-5" />
                  Login
                </Link>
              )}

              {/* Admin: Dashboard */}
              {user && isAdmin && (
                <Link
                  to="/admin/dashboard"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 transition-all duration-200 hover:bg-indigo-100"
                >
                  <HiViewGrid className="size-5" />
                  Dashboard
                </Link>
              )}

              {/* Normal user: his profile */}
              {user && !isAdmin && (
                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <HiUser className="size-5" />
                  My Profile
                </Link>
              )}
            </div>
          </div>

          {/* Logout (bottom of the drawer) */}
          {user && (
            <div className="shrink-0 border-t border-gray-100 p-4">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition-colors duration-200 hover:bg-red-50"
              >
                <FiLogOut className="size-[18px]" />
                Logout
              </button>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
