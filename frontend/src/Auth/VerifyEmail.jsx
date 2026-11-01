import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout, FormMessage } from "./Login.jsx";
import { api, resendVerificationCode } from "../api.js";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // The email comes from the link: /verify-email?email=you@example.com
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Seconds the user must wait before asking for another code
  const [cooldown, setCooldown] = useState(0);

  // Counts the cooldown down, one second at a time
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  // Only numbers are allowed in the code box
  function handleCodeChange(e) {
    setCode(e.target.value.replace(/\D/g, ""));
  }

  // Runs when the user presses Verify
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (code.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setLoading(true);

    // Call the backend
    const { ok, data } = await api("/auth/verify", {
      method: "POST",
      body: { email: email.trim(), code },
    });

    // Verified: go to the login page with a success message
    if (ok) {
      navigate("/login", {
        state: { message: "Email verified! You can log in now." },
      });
      return;
    }

    // Wrong code: also show how many tries are left
    let message = data.message || "Verification failed. Please try again.";

    if (data.attemptsLeft !== undefined) {
      message += ` (${data.attemptsLeft} tries left)`;
    }

    setError(message);
    setLoading(false);
  }

  // Runs when the user presses "Resend code"
  async function handleResend() {
    if (!email.trim()) {
      setError("Please enter your email first");
      return;
    }

    setError("");
    setInfo("");
    setResending(true);

    // Call the backend
    const { ok, status, data } = await resendVerificationCode(email.trim());

    if (ok) {
      setInfo(data.message || "A new code has been sent to your email.");
      setCooldown(60);
    } else {
      setError(data.message || "Could not send a new code.");

      // Too soon: the backend tells us how many seconds to wait
      if (status === 429 && data.secondsLeft) {
        setCooldown(data.secondsLeft);
      }
    }

    setResending(false);
  }

  return (
    <AuthLayout
      title="Verify your email"
      intro="Enter the 6-digit code we sent to your email. It expires in 10 minutes."
      onSubmit={handleSubmit}
    >
      {info && <FormMessage type="success">{info}</FormMessage>}
      {error && <FormMessage>{error}</FormMessage>}

      <label className="flex flex-col gap-2">
  <span className="text-sm font-medium text-gray-700">Email</span>

  <input
    disabled
    required
    type="email"
    autoComplete="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="you@example.com"
    className="input cursor-not-allowed bg-gray-100 text-gray-500 border-gray-300 opacity-70"
  />
</label>
      <label>
        Verification Code
        <input
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={handleCodeChange}
          placeholder="123456"
          className="input text-center text-xl tracking-[.4em]"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="action disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Verifying..." : "Verify Email"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Didn&apos;t get the code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className="font-bold text-indigo-700 hover:text-indigo-900 transition-colors disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
        </button>
      </p>
      <p className="text-center text-sm text-slate-600">
        <Link to="/login" className="font-bold text-indigo-700 hover:text-indigo-900 transition-colors">
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}