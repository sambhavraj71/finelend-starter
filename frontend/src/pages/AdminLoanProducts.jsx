
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  RefreshCw,
  Search,
  Landmark,
  CheckCircle2,
  X,
  Power,
  AlertTriangle,
} from "lucide-react";
import api from "../api/axios";
import Loading from "../components/Loading";

const emptyForm = {
  code: "",
  name: "",
  description: "",
  minAmount: "",
  maxAmount: "",
  annualInterestRate: "",
  minTenureMonths: "",
  maxTenureMonths: "",
};

const money = (value) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(Number(value));

function errorMessage(error) {
  const data = error.response?.data;

  if (typeof data === "string") return data;

  if (data?.message) return data.message;

  if (data?.errors) {
    if (Array.isArray(data.errors)) {
      return data.errors
        .map((item) => item.defaultMessage || item.message)
        .join(", ");
    }

    if (typeof data.errors === "object") {
      return Object.entries(data.errors)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
    }
  }

  return data?.error || error.message || "Request failed.";
}

export default function AdminLoanProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingId, setChangingId] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get(
        "/loan-products/admin/all"
      );

      if (!Array.isArray(data)) {
        throw new Error("Invalid loan products response.");
      }

      setProducts(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch = [
        product.code,
        product.name,
        product.description,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      );

      const matchesStatus =
        filter === "ALL" ||
        (filter === "ACTIVE" && product.active) ||
        (filter === "INACTIVE" && !product.active);

      return matchesSearch && matchesStatus;
    });
  }, [products, search, filter]);

  const activeCount = products.filter(
    (product) => product.active
  ).length;

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setModalError("");
    setModalOpen(true);
  }

  function openEdit(product) {
    setEditing(product);
    setForm({
      code: product.code ?? "",
      name: product.name ?? "",
      description: product.description ?? "",
      minAmount: String(product.minAmount ?? ""),
      maxAmount: String(product.maxAmount ?? ""),
      annualInterestRate: String(
        product.annualInterestRate ?? ""
      ),
      minTenureMonths: String(
        product.minTenureMonths ?? ""
      ),
      maxTenureMonths: String(
        product.maxTenureMonths ?? ""
      ),
    });
    setModalError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setModalError("");
  }

  function updateField(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
    setModalError("");
  }

  function validateForm() {
    if (!form.code.trim() || !form.name.trim()) {
      return "Product code and name are required.";
    }

    const minAmount = Number(form.minAmount);
    const maxAmount = Number(form.maxAmount);
    const interest = Number(form.annualInterestRate);
    const minTenure = Number(form.minTenureMonths);
    const maxTenure = Number(form.maxTenureMonths);

    const requiredNumbers = [
      form.minAmount,
      form.maxAmount,
      form.annualInterestRate,
      form.minTenureMonths,
      form.maxTenureMonths,
    ];

    if (requiredNumbers.some((value) => value === "")) {
      return "Complete all numeric fields.";
    }

    if (
      ![
        minAmount,
        maxAmount,
        interest,
        minTenure,
        maxTenure,
      ].every(Number.isFinite)
    ) {
      return "Enter valid numeric values.";
    }

    if (minAmount <= 0 || maxAmount < minAmount) {
      return "Maximum amount must be at least the minimum amount.";
    }

    if (interest < 0 || interest > 100) {
      return "Interest rate must be between 0 and 100.";
    }

    if (
      !Number.isInteger(minTenure) ||
      !Number.isInteger(maxTenure) ||
      minTenure < 1 ||
      maxTenure < minTenure
    ) {
      return "Enter a valid tenure range in whole months.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    const validationError = validateForm();

    if (validationError) {
      setModalError(validationError);
      return;
    }

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      minAmount: Number(form.minAmount),
      maxAmount: Number(form.maxAmount),
      annualInterestRate: Number(form.annualInterestRate),
      minTenureMonths: Number(form.minTenureMonths),
      maxTenureMonths: Number(form.maxTenureMonths),
    };

    setSaving(true);
    setModalError("");
    setSuccess("");

    try {
      if (editing) {
        await api.put(`/loan-products/${editing.id}`, payload);
        setSuccess("Loan product updated successfully.");
      } else {
        await api.post("/loan-products", payload);
        setSuccess("New loan product created successfully.");
      }

      setModalOpen(false);
      setEditing(null);
      await loadProducts();
    } catch (err) {
      setModalError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(product) {
    if (changingId !== null) return;

    const nextActive = !product.active;
    const action = nextActive ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${product.name}"?`
    );

    if (!confirmed) return;

    setChangingId(product.id);
    setError("");
    setSuccess("");

    try {
      await api.patch(
        `/loan-products/${product.id}/status`,
        { active: nextActive }
      );

      setSuccess(
        `${product.name} ${nextActive ? "activated" : "deactivated"} successfully.`
      );

      await loadProducts();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setChangingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
            Admin Portal
          </p>
          <h1 className="page-title mt-2">
            Manage Loan Products
          </h1>
          <p className="page-subtitle">
            Create, edit and manage loan products offered to customers.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadProducts}
            disabled={loading}
            className="secondary-btn"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="primary-btn inline-flex items-center gap-2"
          >
            <Plus size={18} />
            Create Product
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="success-message">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Total Products", products.length],
          ["Active Products", activeCount],
          ["Inactive Products", products.length - activeCount],
        ].map(([label, value]) => (
          <div key={label} className="card p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="card flex flex-wrap gap-3 p-4">
        <label className="relative min-w-0 flex-1 sm:min-w-64">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            className="field pl-10"
            type="search"
            placeholder="Search name or product code"
            aria-label="Search products"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <select
          className="field w-full sm:w-44"
          aria-label="Filter product status"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="ALL">All Products</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <section className="card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <Landmark size={21} className="text-blue-600" />
          <h2 className="section-title">
            Loan Product Catalog
          </h2>
          <span className="ml-auto text-xs text-slate-500">
            {visibleProducts.length} results
          </span>
        </div>

        {loading ? (
          <Loading />
        ) : visibleProducts.length === 0 ? (
          <div className="empty-state">
            No loan products found.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Loan Amount</th>
                  <th>Interest</th>
                  <th>Tenure</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <p className="font-semibold">
                        {product.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {product.code}
                      </p>
                    </td>

                    <td>
                      {money(product.minAmount)}
                      <span className="mx-1">–</span>
                      {money(product.maxAmount)}
                    </td>

                    <td>{product.annualInterestRate}% p.a.</td>

                    <td>
                      {product.minTenureMonths}–
                      {product.maxTenureMonths} months
                    </td>

                    <td>
                      <span
                        className={`status-badge ${
                          product.active
                            ? "status-active"
                            : "status-closed"
                        }`}
                      >
                        {product.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>

                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(product)}
                          disabled={changingId !== null}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 disabled:opacity-50"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleStatus(product)}
                          disabled={changingId !== null}
                          className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
                            product.active
                              ? "bg-red-50 text-red-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          <Power size={14} />
                          {changingId === product.id
                            ? "Updating..."
                            : product.active
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSubmit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              <h2
                id="product-modal-title"
                className="text-xl font-bold"
              >
                {editing ? "Edit Loan Product" : "Create Loan Product"}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close form"
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Enter product details and configure loan limits.
            </p>

            {modalError && (
              <div role="alert" className="error-message mt-4">
                <AlertTriangle size={17} />
                {modalError}
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                ["code", "Product Code", "text"],
                ["name", "Product Name", "text"],
                ["minAmount", "Minimum Amount (₹)", "number"],
                ["maxAmount", "Maximum Amount (₹)", "number"],
                [
                  "annualInterestRate",
                  "Annual Interest Rate (%)",
                  "number",
                ],
                [
                  "minTenureMonths",
                  "Minimum Tenure (Months)",
                  "number",
                ],
                [
                  "maxTenureMonths",
                  "Maximum Tenure (Months)",
                  "number",
                ],
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label
                    htmlFor={key}
                    className="mb-2 block text-sm font-semibold"
                  >
                    {label}
                  </label>
                  <input
                    id={key}
                    type={type}
                    required
                    className="field"
                    value={form[key]}
                    disabled={saving}
                    step={
                      type === "number"
                        ? key.includes("Tenure")
                          ? "1"
                          : "0.01"
                        : undefined
                    }
                    onChange={(event) =>
                      updateField(key, event.target.value)
                    }
                  />
                </div>
              ))}

              <div className="sm:col-span-2">
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-semibold"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  className="field min-h-24 w-full"
                  value={form.description}
                  disabled={saving}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                className="secondary-btn"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-btn disabled:opacity-50"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editing
                    ? "Save Changes"
                    : "Create Product"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
