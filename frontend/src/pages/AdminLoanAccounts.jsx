
import { useEffect, useMemo, useState } from "react";
import {
  Landmark, RefreshCw, Eye, CreditCard,
  CheckCircle2, Search,
} from "lucide-react";
import api from "../api/axios";
import Loading from "../components/Loading";

const money = (value) =>
  value == null ? "—" : new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (value) =>
  value ? new Date(value).toLocaleString("en-IN") : "—";

function getError(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Something went wrong."
  );
}

export default function AdminLoanAccounts() {
  const [disbursements, setDisbursements] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadDisbursements() {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/admin/disbursements");
      if (!Array.isArray(data)) {
        throw new Error("Invalid disbursement response.");
      }
      setDisbursements(data);
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDisbursements();
  }, []);

  async function viewAccount(record) {
    if (!record.loanAccountId) {
      setError("Loan Account ID is missing.");
      return;
    }

    setSelected(record);
    setSchedule(null);
    setHistory(null);
    setDetailsLoading(true);
    setError("");
    setSuccess("");

    try {
      const [scheduleResponse, historyResponse] =
        await Promise.all([
          api.get(
            `/admin/loan-accounts/${record.loanAccountId}/schedule`
          ),
          api.get(
            `/admin/loan-accounts/${record.loanAccountId}/repayments`
          ),
        ]);

      setSchedule(scheduleResponse.data);
      setHistory(historyResponse.data);
    } catch (err) {
      setError(getError(err));
    } finally {
      setDetailsLoading(false);
    }
  }

  const pendingInstallments = (schedule?.installments || [])
    .filter((item) => item.paymentStatus === "PENDING")
    .sort((a, b) => a.installmentNumber - b.installmentNumber);

  const nextEmi = pendingInstallments[0];

  async function recordPayment() {
    if (!selected || !schedule || !nextEmi || paying) {
      return;
    }

    const amount = Number(nextEmi.emiAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Invalid EMI amount.");
      return;
    }

    const confirmed = window.confirm(
      `Record EMI #${nextEmi.installmentNumber} payment of ${money(
        amount
      )} for account ${selected.accountNumber}?`
    );

    if (!confirmed) return;

    setPaying(true);
    setError("");
    setSuccess("");

    try {
      await api.post(
        `/admin/loan-accounts/${selected.loanAccountId}/repayments`,
        {
          installmentNumber: nextEmi.installmentNumber,
          amount,
        }
      );

      setSuccess(
        `EMI #${nextEmi.installmentNumber} recorded successfully.`
      );

      const [scheduleResponse, historyResponse] =
        await Promise.all([
          api.get(
            `/admin/loan-accounts/${selected.loanAccountId}/schedule`
          ),
          api.get(
            `/admin/loan-accounts/${selected.loanAccountId}/repayments`
          ),
        ]);

      setSchedule(scheduleResponse.data);
      setHistory(historyResponse.data);
    } catch (err) {
      setError(getError(err));
    } finally {
      setPaying(false);
    }
  }

  const filteredDisbursements = useMemo(() => {
    const query = search.trim().toLowerCase();

    return disbursements.filter((record) =>
      [
        record.accountNumber,
        record.loanApplicationId,
        record.referenceNumber,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      )
    );
  }, [disbursements, search]);

  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
          Admin Portal
        </p>
        <h1 className="page-title mt-2">Loan Accounts</h1>
        <p className="page-subtitle">
          View disbursed loans, EMI schedules and repayments.
        </p>
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

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <label className="relative min-w-0 flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            className="field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search account, application or reference"
            aria-label="Search loan accounts"
          />
        </label>
        <span className="text-xs text-slate-500">
          {filteredDisbursements.length} records
        </span>
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6">
          <h2 className="section-title">
            Disbursed Loans
          </h2>
          <button
            type="button"
            onClick={loadDisbursements}
            disabled={loading}
            className="secondary-btn"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {loading ? (
          <Loading />
        ) : disbursements.length === 0 ? (
          <div className="empty-state">
            No disbursement records found.
          </div>
        ) : filteredDisbursements.length === 0 ? (
          <div className="empty-state">
            No matching loan accounts.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Account Number</th>
                  <th>Application ID</th>
                  <th>Amount</th>
                  <th>Reference</th>
                  <th>Disbursed At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDisbursements.map((record) => (
                  <tr key={record.id}>
                    <td className="font-semibold">
                      {record.accountNumber}
                    </td>
                    <td>#{record.loanApplicationId}</td>
                    <td>{money(record.amount)}</td>
                    <td>{record.referenceNumber}</td>
                    <td>{formatDate(record.disbursedAt)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => viewAccount(record)}
                        disabled={detailsLoading || paying}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-700 disabled:opacity-50"
                      >
                        <Eye size={16} />
                        View Account
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <section className="card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3">
              <Landmark
                className="text-blue-600"
                size={24}
              />
            </div>
            <div>
              <h2 className="break-all text-xl font-bold">
                {selected.accountNumber}
              </h2>
              <p className="text-sm text-slate-500">
                Loan Account ID: {selected.loanAccountId}
              </p>
            </div>
          </div>

          {detailsLoading ? (
            <Loading />
          ) : schedule && history ? (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  [
                    "Principal",
                    money(schedule.principalAmount),
                  ],
                  [
                    "Outstanding",
                    money(history.outstandingPrincipal),
                  ],
                  [
                    "Total Paid",
                    money(history.totalAmountPaid),
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl bg-slate-50 p-4"
                  >
                    <p className="text-sm text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 break-words text-lg font-bold">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <h3 className="section-title">
                  EMI Schedule
                </h3>
                <div className="table-container mt-4">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>EMI #</th>
                        <th>Due Date</th>
                        <th>EMI Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(schedule.installments || []).map(
                        (item) => (
                          <tr key={item.id}>
                            <td>
                              {item.installmentNumber}
                            </td>
                            <td>{item.dueDate}</td>
                            <td>{money(item.emiAmount)}</td>
                            <td>
                              <span
                                className={`status-badge ${
                                  item.paymentStatus === "PAID"
                                    ? "status-paid"
                                    : "status-pending"
                                }`}
                              >
                                {item.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-8 rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-2">
                  <CreditCard
                    size={20}
                    className="text-blue-600"
                  />
                  <h3 className="section-title">
                    Record Next EMI
                  </h3>
                </div>

                {nextEmi ? (
                  <>
                    <p className="mt-3 text-sm text-slate-500">
                      EMI #{nextEmi.installmentNumber} —{" "}
                      {money(nextEmi.emiAmount)}
                    </p>
                    <button
                      type="button"
                      onClick={recordPayment}
                      disabled={paying}
                      className="primary-btn mt-4 disabled:opacity-50"
                    >
                      {paying
                        ? "Processing..."
                        : "Record EMI Payment"}
                    </button>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    No pending EMI found.
                  </p>
                )}
              </div>

              <div className="mt-8">
                <h3 className="section-title">
                  Repayment History
                </h3>

                {history.payments?.length ? (
                  <div className="table-container mt-4">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>EMI #</th>
                          <th>Amount</th>
                          <th>Reference</th>
                          <th>Paid At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.payments.map(
                          (payment) => (
                            <tr key={payment.paymentId}>
                              <td>
                                {payment.installmentNumber}
                              </td>
                              <td>
                                {money(payment.amount)}
                              </td>
                              <td>
                                {payment.referenceNumber}
                              </td>
                              <td>
                                {formatDate(payment.paidAt)}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3 text-slate-500">
                    No payments recorded.
                  </p>
                )}
              </div>
            </>
          ) : null}
        </section>
      )}
    </div>
  );
}
