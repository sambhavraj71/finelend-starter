
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import api from "../api/axios";
import Loading from "../components/Loading";

const money = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(n ?? 0);

export default function FinancialReports() {
  const [summary, setSummary] = useState(null);
  const [disbursements, setDisbursements] = useState([]);
  const [collections, setCollections] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([
      api.get("/admin/reports/financial-summary"),
      api.get("/admin/reports/monthly-disbursements"),
      api.get("/admin/reports/monthly-collections"),
      api.get("/admin/reports/overdue-emis"),
    ])
      .then(([s, d, c, o]) => {
        if (!active) return;
        setSummary(s.data);
        setDisbursements(d.data);
        setCollections(c.data);
        setOverdue(o.data);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Failed to load reports.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  if (loading) return <Loading />;
  if (error) return <div className="card p-6 text-red-600">{error}</div>;

  const chartData = [...collections].reverse().map((item) => ({
    month: item.month,
    collected: Number(item.totalCollected),
    principal: Number(item.principalCollected),
    interest: Number(item.interestCollected),
  }));

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-semibold text-blue-600">ANALYTICS</p>
        <h1 className="mt-1 text-3xl font-bold">Financial Reports</h1>
        <p className="mt-2 text-slate-500">Disbursements, collections and overdue loans.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Total Disbursed", money(summary?.totalDisbursed)],
          ["Total Collected", money(summary?.totalCollected)],
          ["Principal Collected", money(summary?.totalPrincipalCollected)],
          ["Interest Collected", money(summary?.totalInterestCollected)],
          ["Outstanding Principal", money(summary?.totalOutstandingPrincipal)],
          ["Collections / Disbursements", `${summary?.collectionPercentage ?? 0}%`],
        ].map(([label, value]) => (
          <div key={label} className="card p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="mb-6 text-lg font-bold">Monthly EMI Collections</h2>
        {chartData.length ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => money(value)} />
                <Bar dataKey="principal" name="Principal" fill="#2563eb" stackId="a" />
                <Bar dataKey="interest" name="Interest" fill="#f59e0b" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-slate-500">No collection records available.</p>
        )}
      </div>

      <div className="card overflow-x-auto p-6">
        <h2 className="mb-5 text-lg font-bold">Monthly Disbursements</h2>
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead className="border-b text-slate-500">
            <tr>
              <th className="pb-3">Month</th>
              <th className="pb-3">Loans</th>
              <th className="pb-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {disbursements.map((item) => (
              <tr key={item.month} className="border-b border-slate-100">
                <td className="py-4">{item.month}</td>
                <td>{item.totalLoans}</td>
                <td className="text-right font-semibold">{money(item.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!disbursements.length && <p className="py-5 text-slate-500">No disbursements found.</p>}
      </div>

      <div className="card overflow-x-auto p-6">
        <h2 className="mb-5 text-lg font-bold">Overdue EMI Report</h2>
        {!overdue.length ? (
          <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
            No overdue EMIs found.
          </p>
        ) : (
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="border-b text-slate-500">
              <tr>
                <th className="pb-3">Account</th>
                <th className="pb-3">Installment</th>
                <th className="pb-3">Due Date</th>
                <th className="pb-3">Days Overdue</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {overdue.map((emi) => (
                <tr key={`${emi.loanAccountId}-${emi.installmentNumber}`} className="border-b border-slate-100">
                  <td className="py-4">{emi.accountNumber}</td>
                  <td>#{emi.installmentNumber}</td>
                  <td>{emi.dueDate}</td>
                  <td>{emi.daysOverdue}</td>
                  <td className="text-right">{money(emi.emiAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
