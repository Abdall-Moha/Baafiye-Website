import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api, resendVerificationCode } from "../api.js";
import { useAuth } from "./AuthContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { saveLogin } = useAuth();

  // What the user typed
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Message sent by another page (example: "Email verified!")
  const infoMessage = location.state?.message || "";

  // Where to go after login: the page the user wanted, or the home page
  const goTo = location.state?.from?.pathname || "/";

  // Saves what the user types
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Runs when the user presses Login
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Call the backend
    const { ok, data } = await api("/auth/login", {
      method: "POST",
      body: { email: form.email.trim(), password: form.password },
    });

    // Login worked: save the user and leave this page
    if (ok) {
      saveLogin(data.token, data.user);
      navigate(goTo, { replace: true });
      return;
    }

    // Email not verified yet: send a new code and open the verify page
    if (data.requiresVerification) {
      await resendVerificationCode(data.email);
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
      return;
    }

    // Any other problem: show the message from the backend
    setError(data.message || "Login failed. Please try again.");
    setLoading(false);
  }

  return (
    <AuthLayout
      title="Welcome back"
      intro="Log in to access your Baafiye account."
      onSubmit={handleSubmit}
    >
      {infoMessage && <FormMessage type="success">{infoMessage}</FormMessage>}
      {error && <FormMessage>{error}</FormMessage>}

      <label>
        Email
        <input
          required
          type="email"
          name="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@example.com"
          className="input"
        />
      </label>
      <label>
        Password
        <input
          required
          type="password"
          name="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          placeholder="Enter your password"
          className="input"
        />
      </label>

      {/* Forgot password link, on the right */}
      <div className="-mt-2 text-right">
        <Link
          to="/forgot-password"
          className="text-sm font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
        >
          Forgot password?
        </Link>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="action disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
      <p className="text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-bold text-indigo-700 hover:text-indigo-900 transition-colors">
          Register
        </Link>
      </p>
    </AuthLayout>
  );
}

// The card used by ALL the auth pages
export function AuthLayout({ title, intro, children, onSubmit }) {
  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:py-16 bg-slate-50">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[.16em] text-indigo-700">
          Baafiye account
        </p>
        <h1 className="display-font mt-3 text-3xl text-slate-950">{title}</h1>
        <p className="mt-3 leading-6 text-slate-600">{intro}</p>
        <form
          onSubmit={onSubmit}
          className="mt-7 grid gap-5 [&_label]:grid [&_label]:gap-2 [&_label]:text-sm [&_label]:font-semibold"
        >
          {children}
        </form>
      </div>
    </section>
  );
}

// Red box for errors, green box for success messages
export function FormMessage({ type = "error", children }) {
  const colors =
    type === "success"
      ? "border-green-200 bg-green-50 text-green-800"
      : "border-red-200 bg-red-50 text-red-700";

  return (
    <p
      role={type === "success" ? "status" : "alert"}
      className={`rounded-lg border px-4 py-3 text-sm font-medium ${colors}`}
    >
      {children}
    </p>
  );
}