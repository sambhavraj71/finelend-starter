
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FileText,
  RefreshCw,
  CheckCircle2,
  XCircle,
  SearchCheck,
  Send,
  Plus,
  Search,
} from "lucide-react";
import api from "../api/axios";
import Loading from "../components/Loading";
import { useAuth } from "../context/AuthContext";

const money = (value) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN");
};

function getErrorMessage(error) {
  const data = error.response?.data;

  if (typeof data === "string") return data;
  if (data?.message) return data.message;

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
    data?.error ||
    error.message ||
    "Something went wrong."
  );
}

const statusClass = (status) => {
  switch (status) {
    case "APPROVED":
      return "status-approved";
    case "DISBURSED":
      return "status-disbursed";
    case "REJECTED":
      return "status-rejected";
    case "UNDER_REVIEW":
      return "status-under-review";
    case "PENDING":
      return "status-pending";
    default:
      return "status-closed";
  }
};

const actionLabels = {
  "start-review": "Start Review",
  approve: "Approve Application",
  reject: "Reject Application",
  disburse: "Disburse Loan",
};

export default function LoanApplications() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === "ADMIN";

  const [applications, setApplications] = useState([]);
  const [disbursedIds, setDisbursedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedApplication, setSelectedApplication] =
    useState(null);
  const [action, setAction] = useState("");
  const [remarks, setRemarks] = useState("");

  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [success, setSuccess] = useState(
    location.state?.success || ""
  );

  const loadApplications = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError("");

      try {
        if (isAdmin) {
          const [
            applicationsResponse,
            disbursementsResponse,
          ] = await Promise.all([
            api.get("/loan-applications/admin/all"),
            api.get("/admin/disbursements"),
          ]);

          if (
            !Array.isArray(applicationsResponse.data) ||
            !Array.isArray(disbursementsResponse.data)
          ) {
            throw new Error(
              "Invalid response received from backend."
            );
          }

          const alreadyDisbursed =
            disbursementsResponse.data
              .filter(
                (record) =>
                  record.loanApplicationId != null
              )
              .map((record) =>
                Number(record.loanApplicationId)
              );

          setDisbursedIds(alreadyDisbursed);
          setApplications(applicationsResponse.data);
        } else {
          const response = await api.get(
            "/loan-applications/my"
          );

          if (!Array.isArray(response.data)) {
            throw new Error(
              "Invalid applications response."
            );
          }

          setApplications(response.data);
          setDisbursedIds([]);
        }

        return true;
      } catch (err) {
        setError(getErrorMessage(err));
        return false;
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [isAdmin]
  );

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    if (location.state?.success) {
      setSuccess(location.state.success);
    }
  }, [location.state]);

  function openAction(application, actionType) {
    if (actionLoading) return;

    setSelectedApplication(application);
    setAction(actionType);
    setRemarks("");
    setModalError("");
    setError("");
    setSuccess("");
  }

  function closeAction() {
    if (actionLoading) return;

    setSelectedApplication(null);
    setAction("");
    setRemarks("");
    setModalError("");
  }

  async function submitAction(event) {
    event.preventDefault();

    if (
      !isAdmin ||
      !selectedApplication ||
      !action ||
      actionLoading
    ) {
      return;
    }

    const id = Number(selectedApplication.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      setModalError("Invalid loan application ID.");
      return;
    }

    if (action !== "disburse" && !remarks.trim()) {
      setModalError("Decision remarks are required.");
      return;
    }

    if (remarks.trim().length > 1000) {
      setModalError(
        "Remarks cannot exceed 1000 characters."
      );
      return;
    }

    setActionLoading(true);
    setModalError("");
    setError("");

    try {
      if (action === "disburse") {
        const response = await api.get(
          "/admin/disbursements"
        );

        if (!Array.isArray(response.data)) {
          throw new Error(
            "Unable to verify existing disbursements."
          );
        }

        const alreadyDisbursed = response.data.some(
          (record) =>
            Number(record.loanApplicationId) === id
        );

        if (alreadyDisbursed) {
          setDisbursedIds((current) =>
            current.includes(id)
              ? current
              : [...current, id]
          );

          throw new Error(
            "This application has already been disbursed."
          );
        }

        await api.post("/admin/disbursements", {
          loanApplicationId: id,
        });

        setDisbursedIds((current) =>
          current.includes(id)
            ? current
            : [...current, id]
        );

        setSuccess(
          `Loan for application #${id} was disbursed successfully.`
        );
      } else {
        const validActions = [
          "start-review",
          "approve",
          "reject",
        ];

        if (!validActions.includes(action)) {
          throw new Error(
            "Invalid loan review action."
          );
        }

        await api.patch(
          `/admin/loan-applications/${id}/${action}`,
          {
            remarks: remarks.trim(),
          }
        );

        setSuccess(
          `Application #${id}: ${actionLabels[action]} completed successfully.`
        );
      }

      setSelectedApplication(null);
      setAction("");
      setRemarks("");

      await loadApplications({ silent: true });
    } catch (err) {
      setModalError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  }

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((app) => {
      const status = disbursedIds.includes(
        Number(app.id)
      )
        ? "DISBURSED"
        : String(app.status || "").toUpperCase();

      const matchesStatus =
        statusFilter === "ALL" ||
        status === statusFilter;

      const matchesSearch =
        !query ||
        [
          app.id,
          app.loanProductName,
          app.customerId,
        ].some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(query)
        );

      return matchesStatus && matchesSearch;
    });
  }, [
    applications,
    disbursedIds,
    search,
    statusFilter,
  ]);

  const statusOptions = [
    "ALL",
    "PENDING",
    "UNDER_REVIEW",
    "APPROVED",
    "REJECTED",
    "DISBURSED",
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
            Loan Management
          </p>

          <h1 className="page-title mt-2">
            {isAdmin
              ? "All Loan Applications"
              : "My Loan Applications"}
          </h1>

          <p className="page-subtitle">
            {isAdmin
              ? "Review, approve, reject and disburse customer loans."
              : "Track your loan applications and their current status."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {!isAdmin && (
            <Link
              to="/customer/products"
              className="primary-btn inline-flex items-center gap-2"
            >
              <Plus size={17} />
              Apply for Loan
            </Link>
          )}

          <button
            type="button"
            onClick={() => loadApplications()}
            disabled={loading || actionLoading}
            className="secondary-btn"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
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

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <label className="relative min-w-0 flex-1 sm:min-w-64">
          <Search
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            className="field pl-10"
            placeholder="Search application, product or customer"
            aria-label="Search loan applications"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </label>

        <select
          className="field w-full sm:w-48"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          aria-label="Filter application status"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status === "ALL"
                ? "All Statuses"
                : status.replaceAll("_", " ")}
            </option>
          ))}
        </select>

        <span className="text-xs text-slate-500">
          {filteredApplications.length} results
        </span>
      </div>

      {loading ? (
        <Loading />
      ) : applications.length === 0 ? (
        <div className="card empty-state">
          <FileText
            size={36}
            className="text-slate-400"
          />

          <h2 className="text-lg font-bold">
            No Applications Found
          </h2>

          <p className="text-sm text-slate-500">
            {isAdmin
              ? "Customer loan applications will appear here."
              : "You have not submitted any loan applications yet."}
          </p>

          {!isAdmin && (
            <Link
              to="/customer/products"
              className="font-semibold text-blue-600"
            >
              Explore Loan Products →
            </Link>
          )}
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="card empty-state">
          No applications match your search or filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((app) => {
            const actualStatus = String(
              app.status || ""
            ).toUpperCase();

            const isDisbursed = disbursedIds.includes(
              Number(app.id)
            );

            const displayStatus = isDisbursed
              ? "DISBURSED"
              : actualStatus;

            const canReview =
              actualStatus === "PENDING" &&
              !isDisbursed;

            const canDecide =
              actualStatus === "UNDER_REVIEW" &&
              !isDisbursed;

            const canDisburse =
              actualStatus === "APPROVED" &&
              !isDisbursed;

            return (
              <article
                key={app.id}
                className="card overflow-hidden p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-blue-600">
                      APPLICATION #{app.id}
                    </p>

                    <h2 className="mt-2 text-xl font-bold text-slate-900">
                      {app.loanProductName ||
                        "Loan Product"}
                    </h2>

                    {isAdmin && (
                      <p className="mt-1 text-sm text-slate-500">
                        Customer ID: {app.customerId}
                      </p>
                    )}
                  </div>

                  <span
                    className={`status-badge ${statusClass(
                      displayStatus
                    )}`}
                  >
                    {displayStatus.replaceAll("_", " ") ||
                      "UNKNOWN"}
                  </span>
                </div>

                <div className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    [
                      "Requested Amount",
                      money(app.requestedAmount),
                    ],
                    [
                      "Loan Tenure",
                      `${app.tenureMonths ?? "—"} months`,
                    ],
                    [
                      "Annual Interest",
                      `${app.annualInterestRate ?? "—"}% p.a.`,
                    ],
                    [
                      "Estimated EMI",
                      money(app.estimatedEmi),
                    ],
                    [
                      "Monthly Income",
                      money(app.monthlyIncome),
                    ],
                    [
                      "Employment Type",
                      app.employmentType || "—",
                    ],
                    [
                      "Applied On",
                      formatDate(app.createdAt),
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

                {isAdmin && (
                  <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                    {canReview && (
                      <button
                        type="button"
                        onClick={() =>
                          openAction(app, "start-review")
                        }
                        disabled={actionLoading}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        <SearchCheck size={17} />
                        Start Review
                      </button>
                    )}

                    {canDecide && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            openAction(app, "approve")
                          }
                          disabled={actionLoading}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          <CheckCircle2 size={17} />
                          Approve
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openAction(app, "reject")
                          }
                          disabled={actionLoading}
                          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          <XCircle size={17} />
                          Reject
                        </button>
                      </>
                    )}

                    {canDisburse && (
                      <button
                        type="button"
                        onClick={() =>
                          openAction(app, "disburse")
                        }
                        disabled={actionLoading}
                        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        <Send size={17} />
                        Disburse Loan
                      </button>
                    )}

                    {isDisbursed && (
                      <span className="inline-flex items-center gap-2 rounded-xl bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700">
                        <CheckCircle2 size={17} />
                        Already Disbursed
                      </span>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={submitAction}
            role="dialog"
            aria-modal="true"
            aria-labelledby="loan-action-title"
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-7 shadow-xl"
          >
            <h2
              id="loan-action-title"
              className="text-xl font-bold"
            >
              {actionLabels[action] || "Loan Action"}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Application #{selectedApplication.id} —{" "}
              {selectedApplication.loanProductName}
            </p>

            {modalError && (
              <div
                role="alert"
                className="error-message mt-4"
              >
                {modalError}
              </div>
            )}

            {action === "disburse" ? (
              <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                You are about to disburse this approved
                application. This creates financial records.
                Confirm only once.
              </div>
            ) : (
              <div className="mt-5">
                <label
                  htmlFor="decisionRemarks"
                  className="mb-2 block text-sm font-medium"
                >
                  Decision Remarks
                </label>

                <textarea
                  id="decisionRemarks"
                  className="field min-h-28 w-full"
                  maxLength={1000}
                  required
                  disabled={actionLoading}
                  value={remarks}
                  onChange={(event) =>
                    setRemarks(event.target.value)
                  }
                  placeholder="Enter remarks for this decision"
                />

                <p className="mt-2 text-xs text-slate-500">
                  {remarks.length}/1000 characters
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeAction}
                disabled={actionLoading}
                className="secondary-btn"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  actionLoading ||
                  (action !== "disburse" &&
                    !remarks.trim())
                }
                className="primary-btn disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading
                  ? "Processing..."
                  : "Confirm"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
