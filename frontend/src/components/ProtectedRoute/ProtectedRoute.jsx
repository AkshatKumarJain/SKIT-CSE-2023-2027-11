import { Navigate } from "react-router-dom";
import { getUserRole } from "../../services/auth";

function ProtectedRoute({ allowedRole, children }) {
    const role = getUserRole();

    if (!role) {
        return <Navigate to="/login" replace />;
    }

    if (role !== allowedRole) {
        return <Navigate to={`/${role}/dashboard`} replace />;
    }

    return children;
}

export default ProtectedRoute;