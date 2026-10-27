import { Link } from "react-router-dom";
import {
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineGlobe,
  HiOutlineHeart,
} from "react-icons/hi";

const navigationLinks = [
  { to: "/", label: "Home" },
  { to: "/items", label: "Items" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const serviceLinks = [
  { to: "/post-item", label: "Post Found Item" },
  { to: "/items", label: "Browse Items" },
];

const socialLinks = [
  { href: "#", icon: HiOutlineGlobe, label: "Website" },
  // Add more if needed (Twitter, Facebook, etc.) – keeping it minimal
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 py-12">
          {/* Brand */}
          <div>
            <Link to="/" className="text-xl font-extrabold text-indigo-600">
              Baafiye
            </Link>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-xs">
              A community space for returning what matters and helping neighbours
              reconnect with lost belongings.
            </p>
            <div className="mt-4 flex items-center gap-3">
              {socialLinks.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  className="text-gray-400 hover:text-indigo-600 transition"
                  aria-label={label}
                >
                  <Icon className="text-lg" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              {navigationLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-gray-600 hover:text-indigo-600 transition"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Service */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Service
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              {serviceLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-gray-600 hover:text-indigo-600 transition"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Contact
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <HiOutlineMail className="text-indigo-500 mt-0.5" />
                <a href="mailto:hello@baafiye.org" className="hover:text-indigo-600 transition">
                  hello@baafiye.org
                </a>
              </li>
              <li className="flex items-start gap-3">
                <HiOutlinePhone className="text-indigo-500 mt-0.5" />
                <a href="tel:+252610000000" className="hover:text-indigo-600 transition">
                  +252 61 000 0000
                </a>
              </li>
              <li className="flex items-start gap-3">
                <HiOutlineLocationMarker className="text-indigo-500 mt-0.5" />
                <span>Mogadishu, Somalia</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 py-5 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} Baafiye. Built for Helpful communities.
          </p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Made with <HiOutlineHeart className="text-red-400" /> in Somalia
          </p>
        </div>
      </div>
    </footer>
  );
}