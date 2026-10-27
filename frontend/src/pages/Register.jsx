import { Link } from "react-router-dom";
import { AuthLayout } from "./Login.jsx";

export default function Register() {
  return (
    <AuthLayout
      title="Create your account"
      intro="Join Baafiye and help your community return what matters."
    >
      <label>
        Full Name
        <input required placeholder="Your full name" className="input" />
      </label>
      <label>
        Email
        <input
          required
          type="email"
          placeholder="you@example.com"
          className="input"
        />
      </label>
      <label>
        Phone Number
        <input required type="tel" placeholder="+252 ..." className="input" />
      </label>
      <label>
        Password
        <input
          required
          type="password"
          placeholder="Create a password"
          className="input"
        />
      </label>
      <label>
        Confirm Password
        <input
          required
          type="password"
          placeholder="Repeat your password"
          className="input"
        />
      </label>
      <button className="action">Create Account</button>
      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="font-bold text-indigo-700 hover:text-indigo-900 transition-colors">
          Login
        </Link>
      </p>
    </AuthLayout>
  );
}
