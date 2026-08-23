import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// The old /rides page is retired in favor of role-based home screens, but old
// links/bookmarks should still land somewhere sensible rather than 404.
export default function RideRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.defaultRole === "driver" ? "/driver" : "/passenger"} replace />;
}
