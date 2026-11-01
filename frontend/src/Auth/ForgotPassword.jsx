import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout, FormMessage } from "./Login.jsx";
import { api } from "../api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // The message from the backend after the email was requested
  const [sentMessage, setSentMessage] = useState("");

  // Runs when the user presses Send Reset Link
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Call the backend
    const { ok, data } = await api("/auth/forgot-password", {
      method: "POST",
      body: { email: email.trim() },
    });

    if (ok) {
      setSentMessage(
        data.message ||
          "If an account with this email exists, a password reset link has been sent."
      );
    } else {
      setError(data.message || "Something went wrong. Please try again.");
    }

    setLoading(false);
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      intro="Enter your email and we will send you a link to choose a new password."
      onSubmit={handleSubmit}
    >
      {sentMessage ? (
        <>
          <FormMessage type="success">{sentMessage}</FormMessage>
          <p className="text-sm leading-6 text-slate-600">
            Open the email and press the button inside. The link works for 15
            minutes and only once. Check your spam folder if you don&apos;t see
            it.
          </p>
          <button
            type="button"
            onClick={() => setSentMessage("")}
            className="text-sm font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
          >
            Use a different email
          </button>
        </>
      ) : (
        <>
          {error && <FormMessage>{error}</FormMessage>}

          <label>
            Email
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="action disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </>
      )}

      <p className="text-center text-sm text-slate-600">
        Remembered it?{" "}
        <Link to="/login" className="font-bold text-indigo-700 hover:text-indigo-900 transition-colors">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}