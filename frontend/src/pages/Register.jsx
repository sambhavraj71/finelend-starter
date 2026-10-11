
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Landmark } from "lucide-react";
import api from "../api/axios";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/register", form);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please verify the details."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-5">
      <div className="card w-full max-w-md p-8 md:p-10">
        <div className="mb-8 flex items-center gap-3 text-blue-600">
          <Landmark size={30} />
          <span className="text-2xl font-bold">FinLend</span>
        </div>

        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-2 text-sm text-slate-500">
          Register as a customer to start managing your loans.
        </p>

        {error && (
          <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          {[
            { label: "Full Name", key: "name", type: "text" },
            { label: "Email", key: "email", type: "email" },
            { label: "Password", key: "password", type: "password" },
          ].map((field) => (
            <div key={field.key}>
              <label className="mb-2 block text-sm font-medium">
                {field.label}
              </label>
              <input
                className="field"
                type={field.type}
                required
                minLength={field.key === "password" ? 8 : undefined}
                value={form[field.key]}
                onChange={(e) =>
                  setForm({ ...form, [field.key]: e.target.value })
                }
              />
            </div>
          ))}

          <button className="primary-btn w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-blue-600">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
