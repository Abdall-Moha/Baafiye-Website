import { Link } from "react-router-dom";

export default function Login() {
  return (
    <AuthLayout
      title="Welcome back"
      intro="Log in to access your Baafiye account."
    >
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
        Password
        <input
          required
          type="password"
          placeholder="Enter your password"
          className="input"
        />
      </label>
      <button className="action">Login</button>
      <p className="text-center text-sm text-slate-600">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-bold text-indigo-700 hover:text-indigo-900 transition-colors">
          Register
        </Link>
      </p>
    </AuthLayout>
  );
}

export function AuthLayout({ title, intro, children }) {
  return (
    <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:py-16 bg-slate-50">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[.16em] text-indigo-700">
          Baafiye account
        </p>
        <h1 className="display-font mt-3 text-3xl text-slate-950">{title}</h1>
        <p className="mt-3 leading-6 text-slate-600">{intro}</p>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="mt-7 grid gap-5 [&_label]:grid [&_label]:gap-2 [&_label]:text-sm [&_label]:font-semibold"
        >
          {children}
        </form>
      </div>
    </section>
  );
}
