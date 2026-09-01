import React, { useState } from "react";
import { API_BASE_URL } from "../config/api";

interface LoginProps {
    onLoginSuccess?: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("student");
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleRoleChange = (selectedRole: string) => {
        setRole(selectedRole);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (isRegister && !name.trim()) {
            setError("Please enter your full name.");
            return;
        }

        if (!email || !password) {
            setError("Please fill in both email and password.");
            return;
        }

        setLoading(true);

        const endpoint = isRegister
            ? `${API_BASE_URL}/api/auth/register`
            : `${API_BASE_URL}/api/auth/login`;

        const payload = isRegister
            ? { name, email, password, role }
            : { email, password, role };

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "An error occurred. Please try again.");
            }

            if (isRegister) {
                setSuccess("Account created successfully! Switching to sign in...");
                setTimeout(() => {
                    setIsRegister(false);
                    setSuccess(null);
                }, 1500);
            } else {
                // Store JWT token and user info
                if (data.token) {
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("user", JSON.stringify(data.user));
                }
                setSuccess(`Welcome back, ${data.user?.name || "User"}! Logging you in...`);
                setTimeout(() => {
                    if (onLoginSuccess) {
                        onLoginSuccess(data.user);
                    }
                }, 800);
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please check your backend server.");
        } finally {
            setLoading(false);
        }
    };

    const toggleRegisterMode = () => {
        setIsRegister(!isRegister);
        setError(null);
        setSuccess(null);
    };

    return (
        <div style={styles.container} className="login-container">
            <div style={styles.card} className="login-card">
                {/* Header / Brand */}
                <div style={styles.header}>
                    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", backgroundColor: "#eff6ff", color: "#2563eb", borderRadius: "12px", marginBottom: "12px" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                        </svg>
                    </div>
                    <h2 style={styles.title}>
                        {isRegister ? "Create Account" : "Campus Placement Portal"}
                    </h2>
                    <p style={styles.subtitle}>
                        {isRegister
                            ? "Sign up to access your placement dashboard"
                            : "Sign in to access your placement dashboard"}
                    </p>
                </div>

                {/* Role Selector Tabs */}
                <div style={styles.roleTabs}>
                    {[
                        { id: "student", label: "Student" },
                        { id: "recruiter", label: "Recruiter" },
                        { id: "coordinator", label: "Coordinator" },
                        { id: "admin", label: "Admin" },
                    ].map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => handleRoleChange(item.id)}
                            style={{
                                ...styles.roleTab,
                                ...(role === item.id ? styles.activeRoleTab : {}),
                            }}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Error / Success Alerts */}
                {error && <div style={styles.errorAlert}>{error}</div>}
                {success && <div style={styles.successAlert}>{success}</div>}

                {/* Form */}
                <form onSubmit={handleSubmit} style={styles.form}>
                    {/* Full Name Field (Registration only) */}
                    {isRegister && (
                        <div style={styles.inputGroup}>
                            <label style={styles.label} htmlFor="name">
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                style={styles.input}
                            />
                        </div>
                    )}

                    {/* Email Field */}
                    <div style={styles.inputGroup}>
                        <label style={styles.label} htmlFor="email">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="name@college.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={styles.input}
                        />
                    </div>

                    {/* Password Field */}
                    <div style={styles.inputGroup}>
                        <div style={styles.labelRow}>
                            <label style={styles.label} htmlFor="password">
                                Password
                            </label>
                            {!isRegister && (
                                <a href="#forgot" style={styles.forgotLink}>
                                    Forgot password?
                                </a>
                            )}
                        </div>
                        <div style={styles.passwordWrapper}>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={styles.input}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={styles.showPassBtn}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button type="submit" disabled={loading} style={styles.submitBtn}>
                        {loading
                            ? isRegister
                                ? "Registering..."
                                : "Signing in..."
                            : isRegister
                                ? `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`
                                : `Sign in as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                    </button>
                </form>

                {/* Footer Link */}
                <div style={styles.footer}>
                    <span>
                        {isRegister
                            ? "Already have an account? "
                            : "Don't have an account yet? "}
                    </span>
                    <button
                        type="button"
                        onClick={toggleRegisterMode}
                        style={{
                            ...styles.registerLink,
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            font: "inherit",
                        }}
                    >
                        {isRegister ? "Sign In" : "Create an Account"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Custom Human-Crafted Styles
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        padding: "20px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        border: "1.5px solid #94a3b8",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.07)",
        padding: "36px 32px",
        width: "100%",
        maxWidth: "440px",
        boxSizing: "border-box",
    },
    header: {
        textAlign: "center",
        marginBottom: "24px",
    },
    logoBadge: {
        fontSize: "36px",
        marginBottom: "8px",
    },
    title: {
        margin: "0 0 6px 0",
        fontSize: "22px",
        fontWeight: "700",
        color: "#1e293b",
    },
    subtitle: {
        margin: 0,
        fontSize: "14px",
        color: "#64748b",
    },
    roleTabs: {
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "6px",
        backgroundColor: "#f1f5f9",
        padding: "4px",
        borderRadius: "8px",
        marginBottom: "24px",
    },
    roleTab: {
        padding: "8px 4px",
        border: "none",
        borderRadius: "6px",
        backgroundColor: "transparent",
        color: "#64748b",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    activeRoleTab: {
        backgroundColor: "#2563eb",
        color: "#ffffff",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    },
    errorAlert: {
        backgroundColor: "#fef2f2",
        color: "#dc2626",
        padding: "10px 14px",
        borderRadius: "6px",
        fontSize: "13px",
        marginBottom: "18px",
        borderLeft: "4px solid #ef4444",
    },
    successAlert: {
        backgroundColor: "#f0fdf4",
        color: "#166534",
        padding: "10px 14px",
        borderRadius: "6px",
        fontSize: "13px",
        marginBottom: "18px",
        borderLeft: "4px solid #22c55e",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "18px",
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    labelRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    label: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#334155",
    },
    forgotLink: {
        fontSize: "12px",
        color: "#2563eb",
        textDecoration: "none",
    },
    input: {
        width: "100%",
        padding: "10px 14px",
        borderRadius: "6px",
        border: "1px solid #cbd5e1",
        backgroundColor: "#ffffff",
        fontSize: "14px",
        color: "#0f172a",
        boxSizing: "border-box",
        outline: "none",
    },
    passwordWrapper: {
        position: "relative",
        display: "flex",
        alignItems: "center",
        width: "100%",
    },
    showPassBtn: {
        position: "absolute",
        right: "10px",
        background: "none",
        border: "none",
        color: "#64748b",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer",
    },
    submitBtn: {
        marginTop: "8px",
        padding: "12px",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        border: "none",
        borderRadius: "6px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "background-color 0.2s ease",
    },
    footer: {
        marginTop: "24px",
        textAlign: "center",
        fontSize: "13px",
        color: "#64748b",
    },
    registerLink: {
        color: "#2563eb",
        fontWeight: "600",
        textDecoration: "none",
    },
};

export default Login;
