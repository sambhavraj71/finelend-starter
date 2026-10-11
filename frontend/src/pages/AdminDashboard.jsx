
import { useCallback, useEffect, useState } from "react";

import {
  Users,
  FileText,
  Wallet,
  IndianRupee,
  CircleCheck,
  Clock,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  ClipboardList,
  CreditCard,
  ChartColumnIncreasing,
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

function ProgressRow({
  label,
  value,
  total,
  color = "bg-blue-500",
}) {
  const safeValue = Number(value ?? 0);
  const safeTotal = Number(total ?? 0);

  const percentage =
    safeTotal > 0
      ? Math.min(
          100,
          Math.max(0, (safeValue / safeTotal) * 100)
        )
      : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-600">
          {label}
        </span>

        <div className="text-right">
          <span className="text-sm font-bold text-slate-900">
            {count(safeValue)}
          </span>
          <span className="ml-2 text-xs text-slate-400">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>

      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2.5 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setRefreshing(true);
      setError("");

      try {
        const response = await api.get(
          "/admin/dashboard/summary"
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

  if (!data && refreshing) {
    return <Loading />;
  }

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
      title: "Total Customers",
      value: count(data.totalCustomers),
      icon: Users,
      color: "blue",
      subtitle: "Registered customers",
    },
    {
      title: "Loan Applications",
      value: count(data.totalLoanApplications),
      icon: FileText,
      color: "purple",
      subtitle: "All submitted applications",
    },
    {
      title: "Active Loans",
      value: count(data.activeLoanAccounts),
      icon: Wallet,
      color: "cyan",
      subtitle: "Currently active accounts",
    },
    {
      title: "Total Disbursed",
      value: money(data.totalDisbursed),
      icon: IndianRupee,
      color: "green",
      subtitle: "Total loan amount released",
    },
    {
      title: "EMI Collected",
      value: money(data.totalCollected),
      icon: CircleCheck,
      color: "green",
      subtitle: "Repayments received",
    },
    {
      title: "Outstanding Principal",
      value: money(data.totalOutstandingPrincipal),
      icon: Clock,
      color: "amber",
      subtitle: "Principal yet to be recovered",
    },
  ];

  const applicationTotal = Number(
    data.totalLoanApplications ?? 0
  );

  const emiTotal = Number(data.totalEmiInstallments ?? 0);

  const applicationStatuses = [
    {
      label: "Pending",
      value: data.pendingApplications,
      color: "bg-amber-400",
    },
    {
      label: "Under Review",
      value: data.underReviewApplications,
      color: "bg-blue-500",
    },
    {
      label: "Approved",
      value: data.approvedApplications,
      color: "bg-emerald-500",
    },
    {
      label: "Rejected",
      value: data.rejectedApplications,
      color: "bg-rose-500",
    },
  ];

  const emiStatuses = [
    {
      label: "Paid",
      value: data.paidEmiInstallments,
      color: "bg-emerald-500",
    },
    {
      label: "Pending",
      value: data.pendingEmiInstallments,
      color: "bg-amber-400",
    },
    {
      label: "Overdue",
      value: data.overdueEmiInstallments,
      color: "bg-rose-500",
    },
  ];

  const collectionRate =
    emiTotal > 0
      ? (Number(data.paidEmiInstallments ?? 0) /
          emiTotal) *
        100
      : 0;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
            Admin Overview
          </p>

          <h1 className="page-title mt-2">
            Financial Dashboard
          </h1>

          <p className="page-subtitle">
            Monitor lending activity, repayments and
            portfolio performance.
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="card p-6 xl:col-span-2">
          <div className="mb-7 flex items-center justify-between gap-3">
            <div>
              <h2 className="section-title">
                Application Status
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Distribution of loan applications
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <ClipboardList size={21} />
            </div>
          </div>

          <div className="space-y-6">
            {applicationStatuses.map((status) => (
              <ProgressRow
                key={status.label}
                {...status}
                total={applicationTotal}
              />
            ))}
          </div>

          <Link
            to="/admin/applications"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            Manage applications
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="card p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="section-title">
              Portfolio Overview
            </h2>
            <TrendingUp
              size={21}
              className="text-blue-600"
            />
          </div>

          <div className="rounded-2xl bg-[#101e38] p-5 text-white">
            <p className="text-xs font-medium text-slate-300">
              Outstanding Principal
            </p>

            <p className="mt-3 break-words text-2xl font-extrabold">
              {money(data.totalOutstandingPrincipal)}
            </p>

            <div className="mt-5 border-t border-white/15 pt-4">
              <p className="text-xs text-slate-300">
                Total Disbursed
              </p>
              <p className="mt-1 text-lg font-semibold">
                {money(data.totalDisbursed)}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl bg-emerald-50 p-4">
            <div>
              <p className="text-xs text-emerald-700">
                EMI Collected
              </p>
              <p className="mt-1 font-bold text-emerald-900">
                {money(data.totalCollected)}
              </p>
            </div>

            <CircleCheck
              size={25}
              className="text-emerald-600"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="section-title">
                EMI Overview
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Installment payment status
              </p>
            </div>

            <CreditCard
              size={22}
              className="text-blue-600"
            />
          </div>

          <div className="mb-6 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">
              Paid Installment Rate
            </p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {collectionRate.toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Based on installment count, not amount
            </p>
          </div>

          <div className="space-y-5">
            {emiStatuses.map((status) => (
              <ProgressRow
                key={status.label}
                {...status}
                total={emiTotal}
              />
            ))}
          </div>

          <p className="mt-5 text-xs text-slate-400">
            Total scheduled installments: {count(emiTotal)}
          </p>

          <Link
            to="/admin/reports"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            View financial reports
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="card p-6">
          <h2 className="section-title">Quick Actions</h2>
          <p className="mt-1 text-xs text-slate-400">
            Common administration tasks
          </p>

          <div className="mt-6 space-y-3">
            {[
              {
                label: "Review Loan Applications",
                description: "Approve or reject requests",
                to: "/admin/applications",
                icon: FileText,
              },
              {
                label: "Manage Loan Accounts",
                description: "View schedules and repayments",
                to: "/admin/loan-accounts",
                icon: Wallet,
              },
              {
                label: "Financial Reports",
                description: "Review collections and overdue EMIs",
                to: "/admin/reports",
                icon: ChartColumnIncreasing,
              },
            ].map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/50"
                >
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <Icon size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {action.label}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {action.description}
                    </p>
                  </div>

                  <ArrowRight
                    size={17}
                    className="shrink-0 text-slate-400"
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
