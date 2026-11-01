import { useState } from "react";
import {
  HiPhone,
  HiMail,
  HiLocationMarker,
  HiClock,
  HiCheckCircle,
} from "react-icons/hi";
import { api } from "../api.js";
import { FormMessage } from "../Auth/Login.jsx";

// ---- CHANGE THESE to your real contact details ----
const contactInfo = [
  {
    icon: HiPhone,
    label: "Phone",
    value: "+252 61 000 0000",
    href: "tel:+252610000000",
  },
  {
    icon: HiMail,
    label: "Email",
    value: "baafiye.so@gmail.com",
    href: "mailto:baafiye.so@gmail.com",
  },
  {
    icon: HiLocationMarker,
    label: "Location",
    value: "Mogadishu, Somalia",
  },
  {
    icon: HiClock,
    label: "Working hours",
    value: "Saturday - Thursday, 8:00 AM - 6:00 PM",
  },
];

// Phone format: 7 to 20 characters (numbers, +, spaces, brackets, dash)
const phonePattern = /^[0-9+\s()-]{7,20}$/;

// Empty form (used at the start and after a message is sent)
const emptyForm = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
  website: "", // hidden trap field for robots (must stay empty)
};

export default function Contact() {
  // What the user typed
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // Saves what the user types
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Runs when the user presses Send Message
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Check the form before calling the backend
    const phone = form.phone.trim();

    if (form.name.trim().length < 2) {
      setError("Please enter your name");
      return;
    }

    if (phone && !phonePattern.test(phone)) {
      setError("Please enter a valid phone number");
      return;
    }

    if (form.subject.trim().length < 3) {
      setError("Subject must be at least 3 characters");
      return;
    }

    if (form.message.trim().length < 10) {
      setError("Message must be at least 10 characters");
      return;
    }

    setLoading(true);

    // Call the backend
    const { ok, data } = await api("/contact", {
      method: "POST",
      body: {
        name: form.name.trim(),
        email: form.email.trim(),
        phone,
        subject: form.subject.trim(),
        message: form.message.trim(),
        website: form.website,
      },
    });

    // Sent: clear the form and show the success card
    if (ok) {
      setForm(emptyForm);
      setSent(true);
    } else {
      // Show the message from the backend (example: "Too many messages")
      setError(data.message || "Could not send your message. Please try again.");
    }

    setLoading(false);
  }

  return (
    <section className="page-shell py-12 sm:py-16">
      {/* Title */}
      <div className="fade-up mx-auto max-w-2xl text-center">
        <p className="text-sm font-bold uppercase tracking-[.16em] text-indigo-700">
          Contact us
        </p>
        <h1 className="display-font mt-2 text-4xl text-slate-950 sm:text-5xl">
          We would love to hear from you
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          Have a question, a problem with a post, or an idea to make Baafiye
          better? Send us a message and we will reply as soon as we can.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-[2fr_3fr]">
        {/* LEFT: information */}
        <aside
          className="fade-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 p-7 text-white shadow-lg sm:p-9"
          style={{ animationDelay: "80ms" }}
        >
          {/* Soft decoration circles */}
          <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 size-48 rounded-full bg-indigo-400/20" />

          <div className="relative">
            <h2 className="display-font text-2xl">Contact information</h2>
            <p className="mt-2 text-sm leading-6 text-indigo-100">
              Reach us in the way that is easiest for you.
            </p>

            <ul className="mt-8 grid gap-6">
              {contactInfo.map((item) => {
                const Icon = item.icon;

                // The text part (the same for links and normal items)
                const content = (
                  <>
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 text-white transition-colors duration-200 group-hover:bg-white group-hover:text-indigo-700">
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold uppercase tracking-wider text-indigo-200">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block break-words text-sm font-semibold sm:text-base">
                        {item.value}
                      </span>
                    </span>
                  </>
                );

                return (
                  <li key={item.label}>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="group flex items-center gap-4"
                      >
                        {content}
                      </a>
                    ) : (
                      <div className="group flex items-center gap-4">
                        {content}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <p className="mt-10 border-t border-white/15 pt-6 text-xs leading-5 text-indigo-200">
              Found someone&apos;s item? Post it on the Post Item page so the
              owner can find it faster.
            </p>
          </div>
        </aside>

        {/* RIGHT: form */}
        <div
          className="fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-8"
          style={{ animationDelay: "160ms" }}
        >
          {/* Message sent: success card */}
          {sent ? (
            <div className="fade-up flex h-full flex-col items-center justify-center py-10 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <HiCheckCircle className="size-8" />
              </span>
              <h2 className="display-font mt-5 text-3xl text-slate-950">
                Message sent!
              </h2>
              <p className="mt-3 max-w-sm leading-7 text-slate-600">
                Thank you for contacting us. We will reply to your email as
                soon as possible.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-6 rounded-lg border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-indigo-300 hover:bg-slate-50"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-5">
              <div>
                <h2 className="display-font text-2xl text-slate-950">
                  Send us a message
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Fields marked with * are required.
                </p>
              </div>

              {error && <FormMessage>{error}</FormMessage>}

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Name *"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={60}
                  autoComplete="name"
                  placeholder="Your full name"
                  required
                />
                <Field
                  label="Email *"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  maxLength={100}
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Phone (optional)"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  placeholder="+252 61 000 0000"
                />
                <Field
                  label="Subject *"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  maxLength={100}
                  placeholder="What is this about?"
                  required
                />
              </div>

              <label className="grid gap-2 text-sm font-semibold">
                Message *
                <textarea
                  required
                  name="message"
                  rows={6}
                  maxLength={2000}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Write your message here..."
                  className="w-full resize-y rounded-lg border border-slate-300 px-3 py-3 font-normal outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
                />
                <span className="text-right text-xs font-normal text-slate-400">
                  {form.message.length} / 2000
                </span>
              </label>

              {/* Hidden trap for robots: people never see or fill this */}
              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label>
                  Website
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={handleChange}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="min-h-12 w-full rounded-lg bg-indigo-700 px-5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-800 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-600/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// One input box with a label
function Field({ label, ...inputProps }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <input
        {...inputProps}
        className="h-11 w-full rounded-lg border border-slate-300 px-3 font-normal outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
      />
    </label>
  );
}