
import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  CheckCircle2,
  Landmark,
  IndianRupee,
  CalendarDays,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import api from "../api/axios";
import Loading from "../components/Loading";

const money = (value) =>
  value == null || !Number.isFinite(Number(value))
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(value));

function calculateEstimatedEmi(
  amount,
  annualRate,
  months
) {
  const principal = Number(amount);
  const tenure = Number(months);
  const annual = Number(annualRate);

  if (
    !Number.isFinite(principal) ||
    !Number.isFinite(tenure) ||
    !Number.isFinite(annual) ||
    principal <= 0 ||
    tenure <= 0 ||
    annual < 0
  ) {
    return null;
  }

  const monthlyRate = annual / 1200;

  if (monthlyRate === 0) {
    return principal / tenure;
  }

  const factor = Math.pow(
    1 + monthlyRate,
    tenure
  );

  const emi =
    (principal * monthlyRate * factor) /
    (factor - 1);

  return Number.isFinite(emi) ? emi : null;
}

function getErrorMessage(error) {
  const data = error.response?.data;

  if (typeof data === "string") return data;

  if (data?.errors && typeof data.errors === "object") {
    if (Array.isArray(data.errors)) {
      return data.errors
        .map(
          (item) =>
            item.defaultMessage ||
            item.message ||
            String(item)
        )
        .join(", ");
    }

    return Object.entries(data.errors)
      .map(([field, message]) => `${field}: ${message}`)
      .join(", ");
  }

  return (
    data?.message ||
    data?.error ||
    error.message ||
    "Unable to submit loan application."
  );
}

export default function ApplyLoan() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productId = searchParams.get("productId");

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    requestedAmount: "",
    tenureMonths: "",
    monthlyIncome: "",
    employmentType: "",
  });

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      setLoading(true);
      setError("");
      setProduct(null);

      if (!productId || !/^[1-9]\d*$/.test(productId)) {
        setError("Please select a valid loan product.");
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get(
          `/loan-products/${productId}`
        );

        if (!active) return;

        if (!data || !data.active) {
          throw new Error(
            "This loan product is currently unavailable."
          );
        }

        setProduct(data);

        setForm({
          requestedAmount: String(data.minAmount ?? ""),
          tenureMonths: String(
            data.minTenureMonths ?? ""
          ),
          monthlyIncome: "",
          employmentType: "",
        });
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [productId]);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  }

  const amount = Number(form.requestedAmount);
  const tenure = Number(form.tenureMonths);
  const income = Number(form.monthlyIncome);

  const amountValid =
    product &&
    form.requestedAmount !== "" &&
    Number.isFinite(amount) &&
    amount >= Number(product.minAmount) &&
    amount <= Number(product.maxAmount);

  const tenureValid =
    product &&
    form.tenureMonths !== "" &&
    Number.isInteger(tenure) &&
    tenure >= Number(product.minTenureMonths) &&
    tenure <= Number(product.maxTenureMonths);

  const estimatedEmi =
    amountValid && tenureValid
      ? calculateEstimatedEmi(
          amount,
          product.annualInterestRate,
          tenure
        )
      : null;

  const totalRepayment =
    estimatedEmi == null
      ? null
      : estimatedEmi * tenure;

  const totalInterest =
    totalRepayment == null
      ? null
      : Math.max(0, totalRepayment - amount);

  const emiIncomeRatio =
    estimatedEmi != null &&
    form.monthlyIncome !== "" &&
    Number.isFinite(income) &&
    income > 0
      ? (estimatedEmi / income) * 100
      : null;

  function validate() {
    if (!product) {
      return "Loan product not found.";
    }

    if (!product.active) {
      return "This loan product is inactive.";
    }

    if (!amountValid) {
      return `Loan amount must be between ${money(
        product.minAmount
      )} and ${money(product.maxAmount)}.`;
    }

    if (!tenureValid) {
      return `Tenure must be between ${
        product.minTenureMonths
      } and ${
        product.maxTenureMonths
      } months.`;
    }

    if (
      !form.monthlyIncome ||
      !Number.isFinite(income) ||
      income < 1
    ) {
      return "Monthly income must be at least ₹1.";
    }

    const employmentType =
      form.employmentType.trim();

    if (
      !employmentType ||
      employmentType.length > 100
    ) {
      return "Employment type must contain 1 to 100 characters.";
    }

    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) return;

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await api.post("/loan-applications", {
        loanProductId: Number(productId),
        requestedAmount: amount,
        tenureMonths: tenure,
        monthlyIncome: income,
        employmentType:
          form.employmentType.trim(),
      });

      navigate("/customer/applications", {
        replace: true,
        state: {
          success:
            "Your loan application was submitted successfully.",
        },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Loading />;

  if (!product) {
    return (
      <div className="card p-8">
        <h2 className="text-xl font-bold">
          Loan Product Unavailable
        </h2>

        <p className="mt-3 text-red-600">
          {error ||
            "Unable to load the selected loan product."}
        </p>

        <Link
          to="/customer/products"
          className="mt-5 inline-flex items-center gap-2 font-semibold text-blue-600"
        >
          <ArrowLeft size={17} />
          Back to Loan Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <div>
        <Link
          to="/customer/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
        >
          <ArrowLeft size={17} />
          Back to Loan Products
        </Link>

        <p className="mt-6 text-xs font-bold uppercase tracking-widest text-blue-600">
          Loan Application
        </p>

        <h1 className="page-title mt-2">
          Apply for {product.name}
        </h1>

        <p className="page-subtitle">
          Enter your loan requirements and review
          the estimated repayment before submitting.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <form
          onSubmit={handleSubmit}
          className="card space-y-6 p-6 lg:col-span-2"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <Landmark size={22} />
            </div>

            <div>
              <h2 className="section-title">
                Application Details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Complete all required fields.
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="error-message"
            >
              {error}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="requestedAmount"
                className="mb-2 block text-sm font-semibold"
              >
                Loan Amount (₹)
              </label>

              <input
                id="requestedAmount"
                type="number"
                className="field"
                min={product.minAmount}
                max={product.maxAmount}
                step="0.01"
                required
                disabled={submitting}
                value={form.requestedAmount}
                onChange={(event) =>
                  updateField(
                    "requestedAmount",
                    event.target.value
                  )
                }
              />

              <p className="mt-2 text-xs text-slate-500">
                {money(product.minAmount)} to{" "}
                {money(product.maxAmount)}
              </p>
            </div>

            <div>
              <label
                htmlFor="tenureMonths"
                className="mb-2 block text-sm font-semibold"
              >
                Loan Tenure (Months)
              </label>

              <input
                id="tenureMonths"
                type="number"
                className="field"
                min={product.minTenureMonths}
                max={product.maxTenureMonths}
                step="1"
                required
                disabled={submitting}
                value={form.tenureMonths}
                onChange={(event) =>
                  updateField(
                    "tenureMonths",
                    event.target.value
                  )
                }
              />

              <p className="mt-2 text-xs text-slate-500">
                {product.minTenureMonths} to{" "}
                {product.maxTenureMonths} months
              </p>
            </div>

            <div>
              <label
                htmlFor="monthlyIncome"
                className="mb-2 block text-sm font-semibold"
              >
                Monthly Income (₹)
              </label>

              <input
                id="monthlyIncome"
                type="number"
                className="field"
                min="1"
                step="0.01"
                placeholder="e.g. 50000"
                required
                disabled={submitting}
                value={form.monthlyIncome}
                onChange={(event) =>
                  updateField(
                    "monthlyIncome",
                    event.target.value
                  )
                }
              />
            </div>

            <div>
              <label
                htmlFor="employmentType"
                className="mb-2 block text-sm font-semibold"
              >
                Employment Type
              </label>

              <input
                id="employmentType"
                type="text"
                className="field"
                maxLength={100}
                placeholder="e.g. SALARIED"
                required
                disabled={submitting}
                value={form.employmentType}
                onChange={(event) =>
                  updateField(
                    "employmentType",
                    event.target.value
                  )
                }
              />

              <p className="mt-2 text-xs text-slate-500">
                Examples: SALARIED, SELF_EMPLOYED,
                BUSINESS
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0 text-blue-600"
              />

              <div>
                <p className="font-semibold text-blue-900">
                  Application Review
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-800">
                  Submitting an application does not
                  guarantee approval. Your request
                  will be reviewed according to the
                  loan management process.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !product.active}
            className="primary-btn flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Submitting Application..."
              : "Submit Loan Application"}

            {!submitting && (
              <ArrowRight size={18} />
            )}
          </button>
        </form>

        <aside className="space-y-5">
          <div className="card p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Landmark size={22} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  {product.name}
                </h2>
                <p className="text-xs text-slate-500">
                  {product.code}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {[
                [
                  "Interest Rate",
                  `${product.annualInterestRate}% p.a.`,
                ],
                [
                  "Requested Amount",
                  amountValid ? money(amount) : "—",
                ],
                [
                  "Loan Tenure",
                  tenureValid
                    ? `${tenure} months`
                    : "—",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-slate-500">
                    {label}
                  </span>

                  <span className="text-right font-semibold text-slate-900">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#101e38] p-6 text-white">
            <div className="flex items-center gap-2 text-blue-300">
              <Calculator size={19} />

              <span className="text-sm font-semibold">
                Monthly EMI Estimate
              </span>
            </div>

            <p className="mt-5 break-words text-3xl font-bold">
              {money(estimatedEmi)}
            </p>

            <p className="mt-2 text-sm text-slate-300">
              Approximate monthly installment
            </p>

            <div className="mt-6 space-y-4 border-t border-white/15 pt-5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-300">
                  Principal
                </span>
                <strong>
                  {amountValid ? money(amount) : "—"}
                </strong>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-300">
                  Estimated Interest
                </span>
                <strong>
                  {money(totalInterest)}
                </strong>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-300">
                  Total Repayment
                </span>
                <strong>
                  {money(totalRepayment)}
                </strong>
              </div>
            </div>

            {emiIncomeRatio !== null && (
              <div className="mt-5 rounded-xl bg-white/10 p-4">
                <p className="text-xs text-slate-300">
                  Estimated EMI / Monthly Income
                </p>

                <p className="mt-1 text-lg font-bold">
                  {emiIncomeRatio.toFixed(1)}%
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-300">
                  For information only; this is not
                  an eligibility or approval decision.
                </p>
              </div>
            )}

            <div className="mt-5 flex items-start gap-2 border-t border-white/15 pt-4 text-xs leading-5 text-slate-300">
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0"
              />

              <p>
                EMI uses an estimated monthly
                reducing-balance calculation. Final
                amounts are determined by the backend
                and may differ due to rounding.
              </p>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-slate-900">
              Loan Summary
            </h3>

            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <IndianRupee
                  size={19}
                  className="text-blue-600"
                />
                <p className="text-sm text-slate-600">
                  Amount within product limits
                </p>
              </div>

              <div className="flex items-center gap-3">
                <CalendarDays
                  size={19}
                  className="text-blue-600"
                />
                <p className="text-sm text-slate-600">
                  Flexible repayment tenure
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Wallet
                  size={19}
                  className="text-blue-600"
                />
                <p className="text-sm text-slate-600">
                  Monthly EMI preview
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
