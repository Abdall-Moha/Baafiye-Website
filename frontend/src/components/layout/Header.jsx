import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  HiMenu,
  HiX,
  HiPlus,
  HiLogin,
  HiShieldCheck,
} from "react-icons/hi";

const navItems = [
  { name: "Home", path: "/" },
  { name: "Items", path: "/items" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  const closeMenu = () => {
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link
            to="/"
            onClick={closeMenu}
            className="flex items-center gap-2.5"
          >
            <span className="grid size-9 place-items-center rounded-lg bg-indigo-700 text-white">
              <HiShieldCheck className="size-5" />
            </span>

            <span className="text-xl font-bold tracking-tight text-gray-900">
              Baafiye
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition ${
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
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/post-item"
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-800"
            >
              <HiPlus className="size-4" />
              Post Item
            </Link>

            <Link
              to="/login"
              className="rounded-md px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:text-indigo-700"
            >
              Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md p-2 text-gray-700 transition hover:bg-gray-100 lg:hidden"
            aria-label="Open menu"
          >
            <HiMenu className="size-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden">

          {/* Background Overlay */}
          <div
            onClick={closeMenu}
            className="fixed inset-0 z-40 bg-black/30"
          />

          {/* Left Drawer */}
          <aside
            className="
              fixed
              left-0
              top-0
              z-50
              h-screen
              w-72
              max-w-[85%]
              bg-white
              shadow-2xl
              overflow-y-auto
            "
          >
            {/* Drawer Header */}
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-5">
              <Link
                to="/"
                onClick={closeMenu}
                className="flex items-center gap-2.5"
              >
                <span className="grid size-9 place-items-center rounded-lg bg-indigo-700 text-white">
                  <HiShieldCheck className="size-5" />
                </span>

                <span className="text-xl font-bold text-gray-900">
                  Baafiye
                </span>
              </Link>

              <button
                type="button"
                onClick={closeMenu}
                className="rounded-md p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close menu"
              >
                <HiX className="size-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1 p-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `rounded-lg px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-700 hover:bg-gray-50 hover:text-indigo-700"
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}

              {/* Divider */}
              <div className="my-3 border-t border-gray-200" />

              {/* Post Item */}
              <Link
                to="/post-item"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-lg bg-indigo-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-800"
              >
                <HiPlus className="size-5" />
                Post Item
              </Link>

              {/* Login */}
              <Link
                to="/login"
                onClick={closeMenu}
                className="mt-1 flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-indigo-700"
              >
                <HiLogin className="size-5" />
                Login
              </Link>
            </nav>
          </aside>
        </div>
      )}
    </header>
  );
}