
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Landmark,
  Percent,
  CalendarDays,
  ArrowRight,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Wallet,
  CheckCircle2,
} from "lucide-react";
import api from "../api/axios";
import Loading from "../components/Loading";

const money = (value) =>
  value == null
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(Number(value));

export default function LoanProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("DEFAULT");
  const [amountFilter, setAmountFilter] = useState("ALL");

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/loan-products");

      if (!Array.isArray(data)) {
        throw new Error("Invalid loan products response.");
      }

      setProducts(
        data.filter((product) => product.active !== false)
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load loan products."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const matchesSearch = [
        product.name,
        product.code,
        product.description,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      );

      const maxAmount = Number(product.maxAmount || 0);

      const matchesAmount =
        amountFilter === "ALL" ||
        (amountFilter === "100000" && maxAmount >= 100000) ||
        (amountFilter === "500000" && maxAmount >= 500000) ||
        (amountFilter === "1000000" && maxAmount >= 1000000);

      return matchesSearch && matchesAmount;
    });

    if (sort === "RATE_LOW") {
      filtered.sort(
        (a, b) =>
          Number(a.annualInterestRate) -
          Number(b.annualInterestRate)
      );
    }

    if (sort === "RATE_HIGH") {
      filtered.sort(
        (a, b) =>
          Number(b.annualInterestRate) -
          Number(a.annualInterestRate)
      );
    }

    if (sort === "AMOUNT_HIGH") {
      filtered.sort(
        (a, b) =>
          Number(b.maxAmount) - Number(a.maxAmount)
      );
    }

    return filtered;
  }, [products, search, sort, amountFilter]);

  const lowestRate = products.length
    ? Math.min(
        ...products.map((product) =>
          Number(product.annualInterestRate)
        )
      )
    : null;

  const highestAmount = products.length
    ? Math.max(
        ...products.map((product) =>
          Number(product.maxAmount)
        )
      )
    : null;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
            FinLend Loans
          </p>

          <h1 className="page-title mt-2">
            Explore Loan Products
          </h1>

          <p className="page-subtitle">
            Compare loan amounts, interest rates and
            repayment periods.
          </p>
        </div>

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
      </div>

      {error && (
        <div role="alert" className="error-message">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Available Products",
            value: products.length,
            icon: Landmark,
            color: "bg-blue-50 text-blue-600",
          },
          {
            label: "Interest Rates From",
            value:
              lowestRate == null
                ? "—"
                : `${lowestRate}% p.a.`,
            icon: Percent,
            color: "bg-emerald-50 text-emerald-600",
          },
          {
            label: "Maximum Loan Offered",
            value: money(highestAmount),
            icon: Wallet,
            color: "bg-violet-50 text-violet-600",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="card flex items-center gap-4 p-5"
          >
            <div className={`rounded-xl p-3 ${color}`}>
              <Icon size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">
                {label}
              </p>
              <p className="mt-1 break-words text-xl font-bold text-slate-900">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="card space-y-4 p-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal
            size={18}
            className="text-blue-600"
          />
          <h2 className="font-bold">
            Find Your Loan
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              className="field pl-10"
              placeholder="Search loan products"
              aria-label="Search loan products"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </label>

          <select
            className="field"
            value={amountFilter}
            onChange={(event) =>
              setAmountFilter(event.target.value)
            }
            aria-label="Filter loan amount"
          >
            <option value="ALL">Any Loan Amount</option>
            <option value="100000">
              Supports ₹1 Lakh
            </option>
            <option value="500000">
              Supports ₹5 Lakh
            </option>
            <option value="1000000">
              Supports ₹10 Lakh
            </option>
          </select>

          <select
            className="field"
            value={sort}
            onChange={(event) =>
              setSort(event.target.value)
            }
            aria-label="Sort loan products"
          >
            <option value="DEFAULT">
              Default Order
            </option>
            <option value="RATE_LOW">
              Interest: Low to High
            </option>
            <option value="RATE_HIGH">
              Interest: High to Low
            </option>
            <option value="AMOUNT_HIGH">
              Maximum Amount: High to Low
            </option>
          </select>
        </div>

        <p className="text-xs text-slate-500">
          Showing {filteredProducts.length} of{" "}
          {products.length} available products
        </p>
      </div>

      {loading ? (
        <Loading />
      ) : products.length === 0 ? (
        <div className="card empty-state">
          <Landmark
            size={34}
            className="text-blue-500"
          />
          <h2 className="font-semibold">
            No Active Loan Products
          </h2>
          <p className="text-sm text-slate-500">
            Please check again later.
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card empty-state">
          <Search
            size={30}
            className="text-slate-400"
          />
          <p>No products match your filters.</p>

          <button
            type="button"
            className="font-semibold text-blue-600"
            onClick={() => {
              setSearch("");
              setSort("DEFAULT");
              setAmountFilter("ALL");
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="card flex flex-col overflow-hidden p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                  <Landmark size={24} />
                </div>

                <span className="status-badge status-active">
                  <CheckCircle2 size={13} />
                  Available
                </span>
              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-blue-600">
                {product.code}
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-900">
                {product.name}
              </h2>

              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                {product.description ||
                  "Flexible financing options for your needs."}
              </p>

              <div className="mt-6 rounded-xl bg-blue-50 p-4">
                <p className="text-xs text-blue-700">
                  Annual Interest Rate
                </p>
                <p className="mt-1 text-2xl font-bold text-blue-800">
                  {product.annualInterestRate}%
                  <span className="ml-1 text-sm font-medium">
                    p.a.
                  </span>
                </p>
              </div>

              <div className="mt-6 space-y-5 border-t border-slate-100 pt-5">
                <div>
                  <p className="text-xs text-slate-500">
                    Loan Amount Range
                  </p>
                  <p className="mt-1 font-bold text-slate-900">
                    {money(product.minAmount)} –{" "}
                    {money(product.maxAmount)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Percent
                    size={19}
                    className="text-blue-600"
                  />
                  <div>
                    <p className="text-xs text-slate-500">
                      Interest
                    </p>
                    <p className="font-semibold">
                      {product.annualInterestRate}%
                      per annum
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CalendarDays
                    size={19}
                    className="text-blue-600"
                  />
                  <div>
                    <p className="text-xs text-slate-500">
                      Repayment Tenure
                    </p>
                    <p className="font-semibold">
                      {product.minTenureMonths} –{" "}
                      {product.maxTenureMonths} months
                    </p>
                  </div>
                </div>
              </div>

              <Link
                to={`/customer/apply?productId=${product.id}`}
                className="primary-btn mt-7 flex w-full items-center justify-center gap-2"
              >
                Apply for This Loan
                <ArrowRight size={17} />
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
