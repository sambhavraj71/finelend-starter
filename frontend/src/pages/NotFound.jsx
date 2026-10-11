
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f7fb] p-6 text-center">
      <h1 className="text-7xl font-bold text-blue-600">404</h1>
      <p className="mt-4 text-xl font-semibold">Page not found</p>
      <p className="mt-2 text-slate-500">
        The page you requested does not exist.
      </p>
      <Link to="/" className="primary-btn mt-7">
        Go to Dashboard
      </Link>
    </div>
  );
}
