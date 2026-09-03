import "./ForgotPassword.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        setError("");
        setMessage("");

        if (!email.toLowerCase().endsWith("@skit.ac.in")) {
            setError("Please use your SKIT college email.");
            return;
        }

        setMessage(
            `If an account exists for ${email}, password reset instructions will be sent.`
        );
    };
    return (
        <div className="forgot-password-page">
            <div className="forgot-password-card">

                <img
                    src="/src/assets/skit-logo.jpg"
                    alt="SKIT Jaipur"
                    className="forgot-password-logo"
                />

                <h1>Forgot Password</h1>

                <p className="forgot-password-subtitle">
                    Enter your college email to reset your password.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">College Email</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Enter your college email"
                            value={email}
                            pattern="^[a-zA-Z0-9._%+-]+@skit\.ac\.in$"
                            title="Please use your SKIT college email"
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="reset-button">
                        Send Reset Link
                    </button>
                </form>

                {error && (
                    <p className="forgot-password-error">
                        {error}
                    </p>
                )}

                {message && (
                    <p className="forgot-password-message">
                        {message}
                    </p>
                )}
                <button
                    type="button"
                    className="back-to-login"
                    onClick={() => navigate("/login")}
                >
                    Back to Login
                </button>

            </div>
        </div>
    );
}

export default ForgotPassword;