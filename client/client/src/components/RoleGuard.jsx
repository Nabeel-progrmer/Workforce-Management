import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../App";

export default function RoleGuard({ allowedRoles, children }) {
  const { user } = useAuth();
  const userRole = (user?.role || "worker").toLowerCase();

  const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

  if (!normalizedAllowed.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
