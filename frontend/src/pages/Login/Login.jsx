import { useState } from "react";
import "./Login.css";
import { loginUser } from "../../services/authService";
import { getUserRole } from "../../services/auth";
import { useNavigate } from "react-router-dom";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");

        if (!email.toLowerCase().endsWith("@skit.ac.in")) {
            setError("Please use your SKIT college email.");
            return;
        }

        setLoading(true);

        try {
            await loginUser(email, password);

            const role = getUserRole();

            console.log("Login successful. Role:", role);

            if (!role) {
                setError("User role not found.");
                return;
            }

            if (role === "student") {
                navigate("/student/dashboard");
            } else if (role === "teacher") {
                navigate("/teacher/dashboard");
            } else if (role === "admin") {
                navigate("/admin/dashboard");
            } else {
                setError("Invalid user role.");
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">

                <img
                    src="/src/assets/skit-logo.jpg"
                    alt="SKIT Jaipur"
                    className="login-logo"
                />

                <h1>Project Allocation & Tracking Portal</h1>

                <p className="login-subtitle">
                    Login to your account
                </p>

                <form onSubmit={handleLogin}>

                    <div className="form-group">
                        <label htmlFor="email">
                            College Email
                        </label>

                        <input
                            type="email"
                            id="email"
                            placeholder="Enter your college email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            pattern="^[a-zA-Z0-9._%+\-]+@skit\.ac\.in$"
                            title="Please use your SKIT college email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            Password
                        </label>

                        <input
                            type="password"
                            id="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </div>

                    <div className="forgot-password">
                        <button
                            type="button"
                            onClick={() => navigate("/forgot-password")}
                        >
                            Forgot Password?
                        </button>
                    </div>

                    {error && (
                        <p className="login-error">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                </form>

            </div>
        </div>
    );
}

export default Login;