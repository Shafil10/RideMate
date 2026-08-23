import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, hydrated } = useAuth();
  const location = useLocation();

  if (!hydrated) return null; // splash screen is covering this moment anyway
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}
