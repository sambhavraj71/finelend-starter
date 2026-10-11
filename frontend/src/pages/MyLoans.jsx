
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Landmark,
  RefreshCw,
  Search,
  Wallet,
  CircleCheck,
  IndianRupee,
} from "lucide-react";
import api from "../api/axios";
import Loading from "../components/Loading";

const money = (value) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(Number(value));

const statusClass = (status) =>
  status === "ACTIVE" ? "status-active" : "status-closed";

export default function MyLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");

  const loadLoans = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/loan-accounts/my", {
        signal,
      });

      if (!Array.isArray(data)) {
        throw new Error("Invalid loan accounts response.");
      }

      setLoans(data);
    } catch (err) {
      if (
        err.code !== "ERR_CANCELED" &&
        err.name !== "CanceledError"
      ) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load loans."
        );
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadLoans(controller.signal);
    return () => controller.abort();
  }, [loadLoans]);

  const visible = useMemo(
    () =>
      loans.filter((loan) => {
        const matchesQuery = String(
          loan.accountNumber || ""
        )
          .toLowerCase()
          .includes(query.trim().toLowerCase());

        return (
          matchesQuery &&
          (filter === "ALL" ||
            String(loan.status).toUpperCase() === filter)
        );
      }),
    [loans, query, filter]
  );

  const activeCount = loans.filter(
    (loan) => loan.status === "ACTIVE"
  ).length;

  const totalOutstanding = loans.reduce(
    (sum, loan) =>
      sum + Number(loan.outstandingPrincipal || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
            Customer Portal
          </p>
          <h1 className="page-title mt-2">My Loans</h1>
          <p className="page-subtitle">
            Track loan balances, monthly EMIs and repayment
            progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadLoans()}
          disabled={loading}
          className="secondary-btn"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="error-message">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Loan Accounts",
            value: loans.length,
            icon: Landmark,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Active Loans",
            value: activeCount,
            icon: CircleCheck,
            color: "text-emerald-600 bg-emerald-50",
          },
          {
            label: "Outstanding Principal",
            value: money(totalOutstanding),
            icon: IndianRupee,
            color: "text-amber-600 bg-amber-50",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            className="card flex items-center gap-4 p-5"
            key={label}
          >
            <div className={`rounded-xl p-3 ${color}`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-500">
                {label}
              </p>
              <p className="mt-1 break-words text-xl font-bold">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <label className="relative min-w-0 flex-1 sm:min-w-64">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            className="field pl-10"
            placeholder="Search account number"
            aria-label="Search loan accounts"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <select
          className="field w-full sm:w-44"
          aria-label="Filter loan status"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
        </select>

        <span className="text-xs text-slate-500">
          {visible.length} results
        </span>
      </div>

      {loading && loans.length === 0 ? (
        <Loading />
      ) : loans.length === 0 && !error ? (
        <div className="card empty-state">
          <Wallet
            size={34}
            className="text-blue-500"
          />
          <p className="font-semibold">
            No loan accounts yet
          </p>
          <Link
            className="font-semibold text-blue-600"
            to="/customer/products"
          >
            Explore Loan Products →
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="card empty-state">
          No loans match your search or filter.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {visible.map((loan) => {
            const principal = Number(
              loan.principalAmount || 0
            );
            const outstanding = Number(
              loan.outstandingPrincipal || 0
            );

            const progress =
              principal > 0
                ? Math.min(
                    100,
                    Math.max(
                      0,
                      ((principal - outstanding) /
                        principal) *
                        100
                    )
                  )
                : 0;

            return (
              <article
                key={loan.id}
                className="card overflow-hidden p-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <Landmark size={24} />
                  </div>
                  <span
                    className={`status-badge ${statusClass(
                      loan.status
                    )}`}
                  >
                    {String(
                      loan.status || "UNKNOWN"
                    ).replaceAll("_", " ")}
                  </span>
                </div>

                <p className="mt-5 text-xs text-slate-500">
                  Loan Account
                </p>
                <h2 className="mt-1 break-all text-lg font-bold text-slate-900">
                  {loan.accountNumber}
                </h2>

                <div className="mt-5 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span>Principal repaid</span>
                  <strong className="text-slate-800">
                    {progress.toFixed(1)}%
                  </strong>
                </div>

                <div
                  className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-label="Principal repayment progress"
                  aria-valuenow={Math.round(progress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-5 border-t border-slate-100 pt-5">
                  {[
                    [
                      "Principal",
                      money(loan.principalAmount),
                    ],
                    [
                      "Outstanding",
                      money(loan.outstandingPrincipal),
                    ],
                    [
                      "Monthly EMI",
                      money(loan.monthlyEmi),
                    ],
                    [
                      "Interest / Tenure",
                      `${loan.annualInterestRate ?? "—"}% / ${
                        loan.tenureMonths ?? "—"
                      } months`,
                    ],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-slate-500">
                        {label}
                      </p>
                      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <Link
                  to={`/customer/loans/${loan.id}`}
                  className="primary-btn mt-6 flex w-full items-center justify-center gap-2"
                >
                  View Loan Details
                  <ArrowRight size={17} />
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
