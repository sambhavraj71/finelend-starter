
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  CalendarDays,
  Wallet,
  CircleCheck,
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

function date(value) {
  if (!value) return "—";

  const parsed = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T00:00:00`
      : value
  );

  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function displayStatus(item) {
  if (item.paymentStatus === "PAID") return "PAID";

  const today = new Date();
  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  if (
    item.paymentStatus === "PENDING" &&
    item.dueDate &&
    item.dueDate < localToday
  ) {
    return "OVERDUE";
  }

  return item.paymentStatus || "UNKNOWN";
}

const badge = (status) =>
  ({
    PAID: "status-paid",
    PENDING: "status-pending",
    OVERDUE: "status-overdue",
    ACTIVE: "status-active",
    CLOSED: "status-closed",
  }[status] || "status-closed");

export default function LoanDetails() {
  const { id } = useParams();

  const [account, setAccount] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [filter, setFilter] = useState("ALL");
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(
    () => setRefreshKey((key) => key + 1),
    []
  );

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setErrors({});

      const urls = [
        `/loan-accounts/${id}`,
        `/loan-accounts/${id}/schedule`,
        `/loan-accounts/${id}/repayments`,
      ];

      const results = await Promise.allSettled(
        urls.map((url) =>
          api.get(url, { signal: controller.signal })
        )
      );

      if (controller.signal.aborted) return;

      const nextErrors = {};
      const setters = [
        setAccount,
        setSchedule,
        setHistory,
      ];
      const names = ["account", "schedule", "history"];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          setters[index](result.value.data);
        } else {
          setters[index](null);
          nextErrors[names[index]] =
            result.reason.response?.data?.message ||
            `Unable to load ${names[index]}.`;
        }
      });

      setErrors(nextErrors);
      setLoading(false);
    }

    load();

    return () => controller.abort();
  }, [id, refreshKey]);

  const installments = useMemo(
    () =>
      Array.isArray(schedule?.installments)
        ? schedule.installments
        : [],
    [schedule]
  );

  const visible = installments.filter(
    (item) =>
      filter === "ALL" || displayStatus(item) === filter
  );

  const paidCount = installments.filter(
    (item) => displayStatus(item) === "PAID"
  ).length;

  const progress = installments.length
    ? (paidCount / installments.length) * 100
    : 0;

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/customer/loans"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to My Loans
          </Link>

          <h1 className="page-title mt-3">
            Loan Details
          </h1>

          <p className="page-subtitle break-all">
            Account #{account?.accountNumber || id}
          </p>
        </div>

        <button
          type="button"
          className="secondary-btn"
          onClick={refresh}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {errors.account && (
        <div className="error-message" role="alert">
          {errors.account}
        </div>
      )}

      {account && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            [
              "Principal",
              money(account.principalAmount),
            ],
            [
              "Outstanding Principal",
              money(account.outstandingPrincipal),
            ],
            ["Monthly EMI", money(account.monthlyEmi)],
            ["Loan Status", account.status],
          ].map(([label, value]) => (
            <div className="card p-5" key={label}>
              <p className="text-sm text-slate-500">
                {label}
              </p>
              <p className="mt-3 break-words text-xl font-bold text-slate-900">
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
          <div>
            <h2 className="section-title">
              EMI Schedule
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {schedule
                ? `${schedule.tenureMonths} installments · ${schedule.annualInterestRate}% annual interest`
                : "Installment information"}
            </p>
          </div>
          <CalendarDays
            className="text-blue-600"
            size={23}
          />
        </div>

        {errors.schedule ? (
          <p className="p-6 text-amber-700">
            {errors.schedule}
          </p>
        ) : schedule ? (
          <>
            <div className="grid gap-4 border-b border-slate-100 p-5 sm:grid-cols-3 sm:p-6">
              {[
                [
                  "Regular EMI",
                  money(schedule.regularMonthlyEmi),
                ],
                [
                  "Total Scheduled Payment",
                  money(schedule.totalScheduledPayment),
                ],
                [
                  "Total Scheduled Interest",
                  money(schedule.totalScheduledInterest),
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-slate-500">
                    {label}
                  </p>
                  <p className="mt-1 font-bold text-slate-900">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-5 sm:p-6">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold">
                  {paidCount} of {installments.length}{" "}
                  installments paid
                </p>
                <span className="text-sm font-bold text-emerald-600">
                  {progress.toFixed(1)}%
                </span>
              </div>

              <div
                className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-label="Installments paid"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold">
                  Installments
                </h3>

                <select
                  className="field w-full sm:w-44"
                  aria-label="Filter installments"
                  value={filter}
                  onChange={(e) =>
                    setFilter(e.target.value)
                  }
                >
                  <option value="ALL">
                    All statuses
                  </option>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">
                    Pending
                  </option>
                  <option value="OVERDUE">
                    Overdue
                  </option>
                </select>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>EMI #</th>
                    <th>Due Date</th>
                    <th>EMI Amount</th>
                    <th>Principal</th>
                    <th>Interest</th>
                    <th>Closing Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {visible.map((item) => {
                    const status = displayStatus(item);

                    return (
                      <tr key={item.id}>
                        <td>
                          {item.installmentNumber}
                        </td>
                        <td>
                          {date(item.dueDate)}
                        </td>
                        <td>
                          {money(item.emiAmount)}
                        </td>
                        <td>
                          {money(item.principalComponent)}
                        </td>
                        <td>
                          {money(item.interestComponent)}
                        </td>
                        <td>
                          {money(item.closingBalance)}
                        </td>
                        <td>
                          <span
                            className={`status-badge ${badge(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {visible.length === 0 && (
                <p className="p-6 text-center text-slate-500">
                  No installments match the selected
                  filter.
                </p>
              )}
            </div>
          </>
        ) : null}
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
          <div>
            <h2 className="section-title">
              Repayment History
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {history
                ? `${history.totalPayments} payments · Total paid: ${money(
                    history.totalAmountPaid
                  )}`
                : "Recorded payments"}
            </p>
          </div>
          <CircleCheck
            size={23}
            className="text-emerald-600"
          />
        </div>

        {errors.history ? (
          <p className="p-6 text-amber-700">
            {errors.history}
          </p>
        ) : history?.payments?.length ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>EMI #</th>
                  <th>Paid On</th>
                  <th>Amount</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>Reference</th>
                </tr>
              </thead>

              <tbody>
                {history.payments.map((payment) => (
                  <tr key={payment.paymentId}>
                    <td>
                      {payment.installmentNumber}
                    </td>
                    <td>
                      {date(payment.paidAt)}
                    </td>
                    <td>
                      {money(payment.amount)}
                    </td>
                    <td>
                      {money(payment.principalPaid)}
                    </td>
                    <td>
                      {money(payment.interestPaid)}
                    </td>
                    <td>
                      {payment.referenceNumber || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : history ? (
          <div className="empty-state">
            <Wallet
              size={28}
              className="text-blue-500"
            />
            <p>No payments recorded yet.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
