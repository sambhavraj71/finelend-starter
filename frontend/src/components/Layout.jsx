
import { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  FileText,
  Wallet,
  ChartColumnIncreasing,
  LogOut,
  Landmark,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  UserRound,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const adminLinks = [
  {
    label: "Dashboard",
    to: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Loan Products",
    to: "/admin/loan-products",
    icon: Landmark,
  },
  {
    label: "Loan Applications",
    to: "/admin/applications",
    icon: FileText,
  },
  {
    label: "Loan Accounts",
    to: "/admin/loan-accounts",
    icon: Wallet,
  },
  {
    label: "Financial Reports",
    to: "/admin/reports",
    icon: ChartColumnIncreasing,
  },
];

const customerLinks = [
  {
    label: "Dashboard",
    to: "/customer",
    icon: LayoutDashboard,
  },
  {
    label: "Loan Products",
    to: "/customer/products",
    icon: Landmark,
  },
  {
    label: "Loan Applications",
    to: "/customer/applications",
    icon: FileText,
  },
  {
    label: "My Loans",
    to: "/customer/loans",
    icon: Wallet,
  },
];

export default function Layout() {
  const { user, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user?.role === "ADMIN";
  const links = isAdmin ? adminLinks : customerLinks;

  const currentPage =
    [...links]
      .sort((a, b) => b.to.length - a.to.length)
      .find(
        (link) =>
          location.pathname === link.to ||
          location.pathname.startsWith(link.to + "/")
      )?.label || "Workspace";

  const displayName =
    user?.name || user?.email || "FinLend User";

  const initials = displayName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    function onEscape(event) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    window.addEventListener("keydown", onEscape);

    return () => {
      window.removeEventListener("keydown", onEscape);
    };
  }, [mobileOpen]);

  function handleLogout() {
    setMobileOpen(false);
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        id="finlend-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#101e38] text-white shadow-2xl transition-all duration-300 lg:translate-x-0 ${
          collapsed ? "lg:w-20" : "lg:w-68"
        } w-68 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-900/30">
              <Landmark size={23} />
            </div>

            <div
              className={`min-w-0 ${
                collapsed ? "lg:hidden" : ""
              }`}
            >
              <h1 className="text-xl font-bold tracking-tight">
                FinLend
              </h1>

              <p className="text-[11px] text-slate-400">
                Finance Management
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-7">
          <p
            className={`mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 ${
              collapsed ? "lg:hidden" : ""
            }`}
          >
            Workspace
          </p>

          <nav
            aria-label="Main navigation"
            className="space-y-1.5"
          >
            {links.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={
                  to === "/admin" ||
                  to === "/customer"
                }
                title={collapsed ? label : undefined}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `group flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                    collapsed
                      ? "lg:justify-center"
                      : ""
                  } ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-950/20"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Icon
                  size={20}
                  className="shrink-0"
                />

                <span
                  className={`min-w-0 flex-1 ${
                    collapsed ? "lg:hidden" : ""
                  }`}
                >
                  {label}
                </span>

                <ChevronRight
                  size={15}
                  className={`shrink-0 opacity-40 ${
                    collapsed ? "lg:hidden" : ""
                  }`}
                />
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="shrink-0 border-t border-white/10 p-3">
          <div
            className={`mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3 ${
              collapsed ? "lg:justify-center" : ""
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-200">
              {initials || <UserRound size={18} />}
            </div>

            <div
              className={`min-w-0 ${
                collapsed ? "lg:hidden" : ""
              }`}
            >
              <p className="truncate text-sm font-semibold">
                {displayName}
              </p>

              <p className="mt-0.5 text-xs text-blue-300">
                {isAdmin
                  ? "Administrator"
                  : "Customer"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-red-500/10 hover:text-red-300 ${
              collapsed ? "lg:justify-center" : ""
            }`}
          >
            <LogOut
              size={19}
              className="shrink-0"
            />

            <span
              className={
                collapsed ? "lg:hidden" : ""
              }
            >
              Logout
            </span>
          </button>
        </div>
      </aside>

      <div
        className={`min-h-screen transition-all duration-300 ${
          collapsed ? "lg:pl-20" : "lg:pl-68"
        }`}
      >
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              aria-controls="finlend-sidebar"
              className="rounded-xl p-2.5 text-slate-700 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <button
              type="button"
              onClick={() =>
                setCollapsed((prev) => !prev)
              }
              aria-label={
                collapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
              }
              className="hidden rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 lg:inline-flex"
            >
              {collapsed ? (
                <PanelLeftOpen size={21} />
              ) : (
                <PanelLeftClose size={21} />
              )}
            </button>

            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400">
                {isAdmin
                  ? "Admin Workspace"
                  : "Customer Workspace"}
              </p>

              <h2 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                {currentPage}
              </h2>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex">
              <ShieldCheck size={15} />
              {isAdmin ? "Admin" : "Customer"}
            </div>

            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700"
              title={displayName}
            >
              {initials || <UserRound size={18} />}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
