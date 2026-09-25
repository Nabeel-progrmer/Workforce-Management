import React, { createContext, useContext, useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import api from "./api";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import CEO from "./pages/CEO";
import Manager from "./pages/Manager";
import Worker from "./pages/Worker";

import WorkersPage from "./pages/WorkersPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import ShiftsPage from "./pages/ShiftsPage";
import AttendancePage from "./pages/AttendancePage";
import TasksPage from "./pages/TasksPage";
import LeavesPage from "./pages/LeavesPage";
import PayrollPage from "./pages/PayrollPage";
import ProfilePage from "./pages/ProfilePage";

import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/Protectedroute";
import RoleGuard from "./components/RoleGuard";

const AuthContext = createContext(null);
const ThemeContext = createContext(null);

export const useAuth = () => useContext(AuthContext);
export const useTheme = () => useContext(ThemeContext);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token) {
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {}
      }
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      } catch (err) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (e) {}
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const role = (user?.role || "worker").toLowerCase();

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Protected Dashboard Routes with Strict RBAC Isolation */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Routes>
                    <Route
                      index
                      element={
                        role === "ceo" ? (
                          <CEO />
                        ) : role === "manager" ? (
                          <Manager />
                        ) : (
                          <Worker />
                        )
                      }
                    />
                    <Route
                      path="workers"
                      element={
                        <RoleGuard allowedRoles={["ceo", "manager"]}>
                          <WorkersPage />
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="departments"
                      element={
                        <RoleGuard allowedRoles={["ceo", "manager"]}>
                          <DepartmentsPage />
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="shifts"
                      element={
                        <RoleGuard allowedRoles={["ceo", "manager"]}>
                          <ShiftsPage />
                        </RoleGuard>
                      }
                    />
                    <Route path="attendance" element={<AttendancePage />} />
                    <Route path="tasks" element={<TasksPage />} />
                    <Route path="leaves" element={<LeavesPage />} />
                    <Route path="payroll" element={<PayrollPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </AuthContext.Provider>
    </ThemeContext.Provider>
  );
}
