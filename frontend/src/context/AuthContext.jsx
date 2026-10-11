
import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const payload = token.split(".")[1];
    const normalized = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    return JSON.parse(atob(normalized));
  } catch {
    return {};
  }
}

function normalizeRole(role) {
  if (!role) return null;

  const value = Array.isArray(role) ? role[0] : role;

  if (typeof value === "object") {
    return normalizeRole(value.authority || value.role);
  }

  return String(value).replace(/^ROLE_/, "").toUpperCase();
}

function readStoredUser() {
  try {
    const value = sessionStorage.getItem("finlend_user");
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  async function login(email, password) {
    const response = await api.post("/auth/login", {
      email,
      password,
    });

    const data = response.data;

    const token =
      data.token ||
      data.accessToken ||
      data.jwt ||
      data.jwtToken ||
      data.data?.token;

    if (!token) {
      throw new Error("Login response mein JWT token nahi mila.");
    }

    const claims = parseJwt(token);

    const role = normalizeRole(
      data.role ||
      data.user?.role ||
      data.data?.role ||
      claims.role ||
      claims.roles ||
      claims.authorities
    );

    if (!role) {
      throw new Error(
        "Login successful hai, lekin role nahi mila. Login response mapping check karo."
      );
    }

    const authenticatedUser = {
      email: data.email || data.user?.email || claims.sub || email,
      name: data.name || data.user?.name || email.split("@")[0],
      role,
    };

    sessionStorage.setItem("finlend_token", token);
    sessionStorage.setItem(
      "finlend_user",
      JSON.stringify(authenticatedUser)
    );

    setUser(authenticatedUser);

    return authenticatedUser;
  }

  function logout() {
    sessionStorage.removeItem("finlend_token");
    sessionStorage.removeItem("finlend_user");
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, login, logout, isAuthenticated: !!user }),
    [user]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
