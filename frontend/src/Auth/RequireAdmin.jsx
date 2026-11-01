import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

// Wrap the admin pages with this.
// - Not logged in  -> goes to the login page (and comes back after login)
// - Logged in, but not an admin -> goes to the home page
// (The backend checks the admin role again on every request, so this is
// only to keep normal users out of the admin screens.)
export default function RequireAdmin({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}