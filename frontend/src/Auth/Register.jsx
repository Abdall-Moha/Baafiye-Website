import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout, FormMessage } from "./Login.jsx";
import { api, resendVerificationCode } from "../api.js";

// Phone format: 9 to 20 characters (numbers, +, spaces, brackets, dash)
const phonePattern = /^[0-9+\s()-]{9,20}$/;

export default function Register() {
  const navigate = useNavigate();

  // What the user typed
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Saves what the user types
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Runs when the user presses Create Account
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Check the form before calling the backend
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (name.length < 3) {
      setError("Name must be at least 3 characters");
      return;
    }

    if (!phonePattern.test(phone)) {
      setError("Please enter a valid phone number");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    // Call the backend
    const { ok, data } = await api("/auth/register", {
      method: "POST",
      body: { name, email, phone, password: form.password },
    });

    // Account created: the code was emailed, open the verify page
    if (ok) {
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
      return;
    }

    // Email registered before but never verified: send a new code
    if (data.requiresVerification) {
      await resendVerificationCode(data.email);
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
      return;
    }

    // Any other problem: show the message from the backend
    setError(data.message || "Registration failed. Please try again.");
    setLoading(false);
  }

  return (
    <AuthLayout
      title="Create your account"
      intro="Join Baafiye and help your community return what matters."
      onSubmit={handleSubmit}
    >
      {error && <FormMessage>{error}</FormMessage>}

      <label>
        Full Name
        <input
          required
          name="name"
          autoComplete="name"
          maxLength={60}
          value={form.name}
          onChange={handleChange}
          placeholder="Your full name"
          className="input"
        />
      </label>
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
        Phone Number
        <input
          required
          type="tel"
          name="phone"
          autoComplete="tel"
          value={form.phone}
          onChange={handleChange}
          placeholder="+252 ..."
          className="input"
        />
      </label>
      <label>
        Password
        <input
          required
          type="password"
          name="password"
          autoComplete="new-password"
          minLength={6}
          maxLength={64}
          value={form.password}
          onChange={handleChange}
          placeholder="Create a password"
          className="input"
        />
      </label>
      <label>
        Confirm Password
        <input
          required
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          maxLength={64}
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="Repeat your password"
          className="input"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="action disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Create Account"}
      </button>
      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="font-bold text-indigo-700 hover:text-indigo-900 transition-colors">
          Login
        </Link>
      </p>
    </AuthLayout>
  );
}