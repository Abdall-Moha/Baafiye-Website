import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AuthLayout, FormMessage } from "./Login.jsx";
import { api } from "../api.js";

export default function ResetPassword() {
  // The token comes from the email link: /reset-password/<token>
  const { token } = useParams();

  // What the user typed
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Saves what the user types
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Runs when the user presses Reset Password
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Check the form before calling the backend
    if (form.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    // Call the backend
    const { ok, data } = await api("/auth/reset-password", {
      method: "POST",
      body: { token, newPassword: form.newPassword },
    });

    if (ok) {
      setDone(true);
    } else {
      setError(data.message || "Could not reset your password. Please try again.");
    }

    setLoading(false);
  }

  return (
    <AuthLayout
      title="Choose a new password"
      intro="Enter a new password for your Baafiye account."
      onSubmit={handleSubmit}
    >
      {done ? (
        <>
          <FormMessage type="success">
            Your password has been changed. You can now log in with it.
          </FormMessage>
          <Link to="/login" className="action block text-center">
            Go to Login
          </Link>
        </>
      ) : (
        <>
          {error && <FormMessage>{error}</FormMessage>}

          <label>
            New Password
            <input
              required
              type="password"
              name="newPassword"
              autoComplete="new-password"
              minLength={6}
              maxLength={64}
              value={form.newPassword}
              onChange={handleChange}
              placeholder="Create a new password"
              className="input"
            />
          </label>
          <label>
            Confirm New Password
            <input
              required
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              maxLength={64}
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repeat your new password"
              className="input"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="action disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving..." : "Reset Password"}
          </button>
          <p className="text-center text-sm text-slate-600">
            Link expired?{" "}
            <Link to="/forgot-password" className="font-bold text-indigo-700 hover:text-indigo-900 transition-colors">
              Request a new one
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}