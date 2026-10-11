
import { useEffect, useState } from "react";
import {
  Wallet,
  CreditCard,
  CalendarDays,
  IndianRupee,
  ArrowRight,
  Landmark,
  FileText,
  CheckCircle2,
  RefreshCw,
  Clock3,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import StatCard from "../components/StatCard";
import Loading from "../components/Loading";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));

const count = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value ?? 0));

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T00:00:00`
      : value
  );

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function CustomerDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setRefreshing(true);
      setError("");

      try {
        const response = await api.get(
          "/customer/dashboard/summary"
        );

        if (active) {
          setData(response.data);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load dashboard."
          );
        }
      } finally {
        if (active) {
          setRefreshing(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  function refresh() {
    setReloadKey((key) => key + 1);
  }

  if (!data && refreshing) return <Loading />;

  if (!data && error) {
    return (
      <div className="card p-6">
        <p className="error-message">{error}</p>
        <button
          type="button"
          onClick={refresh}
          className="primary-btn mt-4"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return <Loading />;

  const stats = [
    {
      title: "Total Borrowed",
      value: money(data.totalBorrowed),
      icon: IndianRupee,
      color: "blue",
      subtitle: "Total loan amount received",
    },
    {
      title: "Outstanding Principal",
      value: money(data.totalOutstandingPrincipal),
      icon: Wallet,
      color: "amber",
      subtitle: "Principal remaining",
    },
    {
      title: "EMI Paid",
      value: money(data.totalEmiPaid),
      icon: CreditCard,
      color: "green",
      subtitle: "Total installments paid",
    },
    {
      title: "Remaining EMIs",
      value: count(data.remainingInstallments),
      icon: CalendarDays,
      color: "purple",
      subtitle: "Unpaid installments",
    },
  ];

  const borrowed = Number(data.totalBorrowed ?? 0);
  const outstanding = Number(
    data.totalOutstandingPrincipal ?? 0
  );

  const principalPaid = Number(
    data.totalPrincipalPaid ?? 0
  );

  const repaymentProgress =
    borrowed > 0
      ? Math.min(
          100,
          Math.max(0, (principalPaid / borrowed) * 100)
        )
      : 0;

  const upcomingEmis = Array.isArray(data.upcomingEmis)
    ? data.upcomingEmis
    : [];

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
            Customer Overview
          </p>

          <h1 className="page-title mt-2">
            My Dashboard
          </h1>

          <p className="page-subtitle">
            Track your loans, repayments and upcoming
            installments.
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="secondary-btn"
        >
          <RefreshCw
            size={17}
            className={refreshing ? "animate-spin" : ""}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div role="alert" className="error-message">
          {error} Showing the last successfully loaded data.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card overflow-hidden lg:col-span-2">
          <div className="bg-[#101e38] p-6 text-white sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-blue-200">
                  Loan Repayment Overview
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  {money(outstanding)}
                </h2>

                <p className="mt-1 text-xs text-slate-300">
                  Outstanding principal
                </p>
              </div>

              <div className="rounded-xl bg-white/10 p-3">
                <Wallet size={23} />
              </div>
            </div>

            <div className="mt-7">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-slate-300">
                  Principal Repaid
                </span>
                <span className="font-bold">
                  {repaymentProgress.toFixed(1)}%
                </span>
              </div>

              <div
                role="progressbar"
                aria-label="Principal repayment progress"
                aria-valuenow={Math.round(repaymentProgress)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-3 overflow-hidden rounded-full bg-white/15"
              >
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                  style={{
                    width: `${repaymentProgress}%`,
                  }}
                />
              </div>

              <div className="mt-4 flex flex-wrap justify-between gap-3 text-xs text-slate-300">
                <span>
                  Paid: {money(principalPaid)}
                </span>
                <span>
                  Borrowed: {money(borrowed)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-3">
            {[
              {
                label: "Active Loans",
                value: count(data.activeLoans),
                icon: Wallet,
              },
              {
                label: "Closed Loans",
                value: count(data.closedLoans),
                icon: CheckCircle2,
              },
              {
                label: "Applications",
                value: count(data.totalApplications),
                icon: FileText,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl bg-slate-50 p-4"
              >
                <Icon
                  size={20}
                  className="text-blue-600"
                />
                <p className="mt-3 text-xl font-bold text-slate-900">
                  {value}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="section-title">
            Repayment Breakdown
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Amounts recorded across your loans
          </p>

          <div className="mt-6 space-y-5">
            {[
              {
                label: "Principal Paid",
                value: money(data.totalPrincipalPaid),
                icon: CheckCircle2,
                color: "text-emerald-600",
              },
              {
                label: "Interest Paid",
                value: money(data.totalInterestPaid),
                icon: IndianRupee,
                color: "text-blue-600",
              },
              {
                label: "Remaining Principal",
                value: money(outstanding),
                icon: Clock3,
                color: "text-amber-600",
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={19}
                    className={color}
                  />
                  <span className="text-sm text-slate-500">
                    {label}
                  </span>
                </div>

                <span className="text-right text-sm font-bold text-slate-900">
                  {value}
                </span>
              </div>
            ))}
          </div>

          <Link
            to="/customer/loans"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
          >
            View my loans
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="section-title">
                Upcoming EMIs
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Your upcoming loan installments
              </p>
            </div>

            <CalendarDays
              size={22}
              className="text-blue-600"
            />
          </div>

          {upcomingEmis.length ? (
            <div className="space-y-3">
              {upcomingEmis.map((emi) => (
                <div
                  key={emi.installmentId}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                      <CalendarDays size={20} />
                    </div>

                    <div>
                      <p className="font-semibold text-slate-900">
                        Installment #{emi.installmentNumber}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {emi.accountNumber}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Due: {formatDate(emi.dueDate)}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="font-bold text-slate-900">
                      {money(emi.emiAmount)}
                    </p>

                    <span
                      className={`status-badge mt-2 ${
                        emi.paymentStatus === "OVERDUE"
                          ? "status-overdue"
                          : "status-pending"
                      }`}
                    >
                      {String(
                        emi.paymentStatus || "PENDING"
                      ).replaceAll("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <CheckCircle2
                size={32}
                className="text-emerald-500"
              />
              <p className="font-semibold text-slate-700">
                No upcoming EMIs
              </p>
              <p className="text-sm">
                There are no upcoming installments
                to display.
              </p>
            </div>
          )}

          <Link
            to="/customer/loans"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            View loan details
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="card p-6">
          <h2 className="section-title">
            Quick Actions
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Manage your loan journey
          </p>

          <div className="mt-6 space-y-3">
            {[
              {
                label: "Explore Loan Products",
                to: "/customer/products",
                icon: Landmark,
              },
              {
                label: "My Applications",
                to: "/customer/applications",
                icon: FileText,
              },
              {
                label: "My Loan Accounts",
                to: "/customer/loans",
                icon: Wallet,
              },
            ].map(({ label, to, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/50"
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={19}
                    className="text-blue-600"
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    {label}
                  </span>
                </div>

                <ArrowRight
                  size={16}
                  className="shrink-0 text-slate-400"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
