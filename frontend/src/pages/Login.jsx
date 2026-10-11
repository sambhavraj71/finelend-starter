
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Landmark, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to={user.role === "ADMIN" ? "/admin" : "/customer"} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login(form.email, form.password);
      navigate(result.role === "ADMIN" ? "/admin" : "/customer", {
        replace: true,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-[#101e38] p-14 text-white lg:flex">
        <div className="flex items-center gap-3">
          <Landmark size={32} className="text-blue-400" />
          <span className="text-2xl font-bold">FinLend</span>
        </div>

        <div className="max-w-lg">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-blue-200">
            <ShieldCheck size={17} /> Secure Loan Management
          </div>
          <h1 className="text-5xl font-bold leading-tight">
            Finance management,
            <span className="text-blue-400"> made simpler.</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            Manage loans, repayments, applications and financial insights
            in one connected workspace.
          </p>
        </div>

        <p className="text-sm text-slate-400">FinLend · Loan Management Platform</p>
      </section>

      <section className="flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <span className="text-2xl font-bold text-blue-600">FinLend</span>
          </div>

          <h2 className="text-3xl font-bold">Welcome back</h2>
          <p className="mt-2 text-slate-500">
            Sign in to access your FinLend workspace.
          </p>

          {error && (
            <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">Email address</label>
              <input
                type="email"
                className="field"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Password</label>
              <input
                type="password"
                className="field"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button disabled={loading} className="primary-btn flex w-full items-center justify-center gap-2">
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            New to FinLend?{" "}
            <Link to="/register" className="font-semibold text-blue-600">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
