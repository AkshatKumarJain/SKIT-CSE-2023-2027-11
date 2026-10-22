
import { useState } from "react";
import "./Login.css";
import { loginUser } from "../../services/authService";
import { getUserRole } from "../../services/auth";
import { Navigate, useNavigate } from "react-router-dom";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const role = getUserRole();

    if (role === "student") {
        return <Navigate to="/student/dashboard" replace />;
    }

    if (role === "teacher") {
        return <Navigate to="/teacher/dashboard" replace />;
    }

    if (role === "admin") {
        return <Navigate to="/admin/dashboard" replace />;
    }

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
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            Password
                        </label>

                        <div className="password-input-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowPassword((previous) => !previous)
                                }
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                                aria-pressed={showPassword}
                            >
                                {showPassword ? (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M3 3l18 18" />
                                        <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                                        <path d="M9.88 5.09A10.94 10.94 0 0 1 12 4.9c5 0 9.27 3.11 10.5 7.1a11.8 11.8 0 0 1-4.16 5.1" />
                                        <path d="M6.61 6.61A11.8 11.8 0 0 0 1.5 12c.67 2.16 2.15 4.02 4.17 5.29A10.94 10.94 0 0 0 12 19.1c1.16 0 2.27-.18 3.31-.5" />
                                    </svg>
                                ) : (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
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
                        <p className="login-error" role="alert">
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
