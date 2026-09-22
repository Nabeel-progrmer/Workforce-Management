import { Navigate } from "react-router-dom";

import { useAuth } from "../App";
import Loader from "./Loader";

const ProtectedRoute = ({ children }) => {
  const {
    user,
    loading
  } = useAuth();

  if (loading) {
    return <Loader text="Loading your workspace..." />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;