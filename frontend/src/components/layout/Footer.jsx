
import { Link } from "react-router-dom";
import {
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineHeart,
} from "react-icons/hi";

// The logo is in the public folder
const LOGO = "/Baafiye%20Logo.png";

const navigationLinks = [
  { to: "/", label: "Home" },
  { to: "/items", label: "Items" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const serviceLinks = [
  { to: "/post-item", label: "Post Found Item" },
  { to: "/items", label: "Browse Items" },
  { to: "/profile", label: "My Profile" },
];

// Social media links
const socialLinks = [];

// Contact details
const contactItems = [
  {
    icon: HiOutlineMail,
    text: "baafiye.so@gmail.com",
    href: "mailto:baafiye.so@gmail.com",
  },
  {
    icon: HiOutlinePhone,
    text: "+252 61 000 0000",
    href: "tel:+252610000000",
  },
  {
    icon: HiOutlineLocationMarker,
    text: "Mogadishu, Somalia",
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Main footer grid */}
        <div className="grid grid-cols-1 gap-10 py-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr] lg:gap-12">

          {/* Brand */}
          <div className="flex flex-col items-start">
            <Link
              to="/"
              className="group inline-flex items-center"
            >
              <img
                src={LOGO}
                alt="Baafiye logo"
                className="h-28 w-28 rounded-full object-cover transition-transform duration-300 group-hover:scale-105 sm:h-32 sm:w-32 mt-[-30px]"
              />
            </Link>

            <p className="mt-[-30px] max-w-xs text-sm leading-relaxed text-gray-600">
              A community space for returning what matters and helping
              neighbours reconnect with lost belongings.
            </p>

            {socialLinks.length > 0 && (
              <div className="mt-5 flex items-center gap-2">
                {socialLinks.map(({ href, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="grid size-9 place-items-center rounded-full border border-gray-200 text-gray-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    <Icon className="text-base" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900">
              Navigation
            </h4>

            <ul className="mt-4 space-y-2.5 text-sm">
              {navigationLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="inline-block text-gray-600 transition-all duration-200 hover:translate-x-1 hover:text-indigo-700"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Service */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900">
              Service
            </h4>

            <ul className="mt-4 space-y-2.5 text-sm">
              {serviceLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="inline-block text-gray-600 transition-all duration-200 hover:translate-x-1 hover:text-indigo-700"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900">
              Contact
            </h4>

            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              {contactItems.map(({ icon: Icon, text, href }) => (
                <li key={text} className="group flex items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600 transition-colors duration-200 group-hover:bg-indigo-700 group-hover:text-white">
                    <Icon className="size-4" />
                  </span>

                  {href ? (
                    <a
                      href={href}
                      className="min-w-0 break-words transition-colors duration-200 hover:text-indigo-700"
                    >
                      {text}
                    </a>
                  ) : (
                    <span>{text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-2 border-t border-gray-200 py-5 text-center text-xs text-gray-500 sm:flex-row sm:text-left">
          <p>
            &copy; {new Date().getFullYear()} Baafiye. Built for helpful
            communities.
          </p>

          <p className="flex items-center gap-1">
            Made with <HiOutlineHeart className="text-red-400" /> in Somalia
          </p>
        </div>
      </div>
    </footer>
  );
}
