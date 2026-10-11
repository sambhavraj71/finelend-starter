
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LoanProducts from "./pages/LoanProducts";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import LoanApplications from "./pages/LoanApplications";
import MyLoans from "./pages/MyLoans";
import FinancialReports from "./pages/FinancialReports";
import NotFound from "./pages/NotFound";
import ApplyLoan from "./pages/ApplyLoan";
import LoanDetails from "./pages/LoanDetails";
import AdminLoanAccounts from "./pages/AdminLoanAccounts";
import AdminLoanProducts from "./pages/AdminLoanProducts";

function HomeRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <Navigate
      to={user.role === "ADMIN" ? "/admin" : "/customer"}
      replace
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
            <Route element={<Layout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/applications" element={<LoanApplications />} />
              <Route path="/admin/reports" element={<FinancialReports />} />
              <Route path="/admin/loan-accounts" element={<AdminLoanAccounts />} />
              <Route
                path="/admin/loan-products"
                element={<AdminLoanProducts />}
              />
            </Route>
          </Route>

          <Route element={<ProtectedRoute roles={["CUSTOMER"]} />}>
            <Route element={<Layout />}>
              <Route path="/customer" element={<CustomerDashboard />} />
              <Route path="/customer/applications" element={<LoanApplications />} />
              <Route path="/customer/loans" element={<MyLoans />} />
              <Route path="/customer/products" element={<LoanProducts />} />
              <Route path="/customer/apply" element={<ApplyLoan />} />
              <Route path="/customer/loans" element={<MyLoans />} />
<Route path="/customer/loans/:id" element={<LoanDetails />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
