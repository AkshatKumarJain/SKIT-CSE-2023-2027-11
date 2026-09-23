import { Navigate } from "react-router-dom";

function ProtectedRoute({ role, allowedRole, children }) {
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (role !== allowedRole) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }

  return children;
}

export default ProtectedRoute;