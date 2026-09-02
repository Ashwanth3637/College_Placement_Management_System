import React, { useState } from "react";
import { API_BASE_URL } from "../config/api";

interface LoginProps {
    onLoginSuccess?: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("ashwanth@college.edu");
    const [password, setPassword] = useState("password123");
    const [role, setRole] = useState("student");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetSent, setResetSent] = useState(false);

    const demoAccounts = [
        { label: "Student Portal", role: "student", name: "Ashwanth S", email: "ashwanth@college.edu", pass: "password123", icon: "🎓" },
        { label: "Placement Officer", role: "officer", name: "Placement Officer", email: "officer@college.edu", pass: "password123", icon: "🏛️" },
        { label: "Super Admin", role: "admin", name: "Super Admin", email: "admin@college.edu", pass: "password123", icon: "👑" },
    ];

    const applyDemo = (acc: typeof demoAccounts[0]) => {
        setRole(acc.role);
        setEmail(acc.email);
        setPassword(acc.pass);
        setName(acc.name);
        setError(null);
        setSuccess(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (isRegister && !name.trim()) {
            setError("Please enter your full official name.");
            return;
        }

        if (!email || !password) {
            setError("Please fill in both institutional email and password.");
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
                throw new Error(data.message || "Authentication failed. Please check credentials.");
            }

            if (isRegister) {
                setSuccess("Account successfully created! Switching to sign in...");
                setTimeout(() => {
                    setIsRegister(false);
                    setSuccess(null);
                }, 1400);
            } else {
                if (data.token) {
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("user", JSON.stringify(data.user));
                }
                setSuccess(`Welcome, ${data.user?.name || "User"}! Directing to portal...`);
                setTimeout(() => {
                    if (onLoginSuccess) {
                        onLoginSuccess(data.user);
                    }
                }, 600);
            }
        } catch (err: any) {
            setError(err.message || "Failed to reach server. Please ensure backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetEmail) return;
        setResetSent(true);
        setTimeout(() => {
            setResetSent(false);
            setShowForgotPassword(false);
            setResetEmail("");
        }, 2500);
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "#0B3D91", fontFamily: "Inter, sans-serif" }}>
            {/* Left Hero Pane (Enterprise Branding) */}
            <div
                style={{
                    flex: "1 1 50%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "48px 56px",
                    background: "linear-gradient(135deg, #07255A 0%, #0B3D91 50%, #144BA6 100%)",
                    color: "#FFFFFF",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Decorative background grid pattern */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                        opacity: 0.6,
                        pointerEvents: "none",
                    }}
                />

                {/* Top Logo / Institutional Header */}
                <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                        style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "10px",
                            backgroundColor: "#FFFFFF",
                            color: "#0B3D91",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "22px",
                            fontWeight: 800,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                        }}
                    >
                        🎓
                    </div>
                    <div>
                        <div style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.3px" }}>
                            ENTERPRISE PLACEMENT PORTAL
                        </div>
                        <div style={{ fontSize: "12px", color: "#93C5FD", fontWeight: 500 }}>
                            Autonomous Placement & Corporate Relations Cell
                        </div>
                    </div>
                </div>

                {/* Center Content & Value Proposition */}
                <div style={{ position: "relative", zIndex: 2, maxWidth: "520px", margin: "40px 0" }}>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "6px 14px",
                            backgroundColor: "rgba(255, 255, 255, 0.12)",
                            backdropFilter: "blur(8px)",
                            borderRadius: "20px",
                            border: "1px solid rgba(255, 255, 255, 0.2)",
                            fontSize: "12.5px",
                            fontWeight: 600,
                            color: "#FDE68A",
                            marginBottom: "20px",
                        }}
                    >
                        <span>✨</span> Placement Season 2025–2026 Live
                    </div>

                    <h1
                        style={{
                            fontSize: "36px",
                            fontWeight: 800,
                            lineHeight: 1.2,
                            letterSpacing: "-0.5px",
                            marginBottom: "16px",
                            color: "#FFFFFF",
                        }}
                    >
                        Institutional Recruitment & Placement Platform
                    </h1>
                    <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#BFDBFE", marginBottom: "32px" }}>
                        Seamlessly connecting students, corporate recruiters, and academic departments with automated eligibility checking, interview scheduling, and verified accreditation reporting.
                    </p>

                    {/* Stats Highlights */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                        <div style={{ backgroundColor: "rgba(255, 255, 255, 0.08)", padding: "16px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
                            <div style={{ fontSize: "22px", fontWeight: 800, color: "#FFFFFF" }}>98.4%</div>
                            <div style={{ fontSize: "11.5px", color: "#93C5FD", marginTop: "2px" }}>Placement Rate</div>
                        </div>
                        <div style={{ backgroundColor: "rgba(255, 255, 255, 0.08)", padding: "16px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
                            <div style={{ fontSize: "22px", fontWeight: 800, color: "#FFFFFF" }}>₹44 LPA</div>
                            <div style={{ fontSize: "11.5px", color: "#93C5FD", marginTop: "2px" }}>Highest Package</div>
                        </div>
                        <div style={{ backgroundColor: "rgba(255, 255, 255, 0.08)", padding: "16px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
                            <div style={{ fontSize: "22px", fontWeight: 800, color: "#FFFFFF" }}>250+</div>
                            <div style={{ fontSize: "11.5px", color: "#93C5FD", marginTop: "2px" }}>Partner Companies</div>
                        </div>
                    </div>
                </div>

                {/* Bottom Compliance & Security Footer */}
                <div style={{ position: "relative", zIndex: 2, fontSize: "12px", color: "#93C5FD", display: "flex", gap: "20px" }}>
                    <span>🔒 256-Bit SSL Encrypted</span>
                    <span>•</span>
                    <span>WCAG 2.1 AA Compliant</span>
                    <span>•</span>
                    <span>RBAC ISO/IEC 27001</span>
                </div>
            </div>

            {/* Right Authentication Form Pane */}
            <div
                style={{
                    flex: "1 1 50%",
                    backgroundColor: "#F8FAFC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "36px",
                    overflowY: "auto",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        maxWidth: "460px",
                        backgroundColor: "#FFFFFF",
                        borderRadius: "16px",
                        padding: "36px 32px",
                        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)",
                        border: "1px solid #E2E8F0",
                    }}
                >
                    {/* Header */}
                    <div style={{ marginBottom: "20px" }}>
                        <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#1E5FCC", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                            Institutional Gateway
                        </div>
                        <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px" }}>
                            {isRegister ? "Create Portal Account" : "Sign In to Your Account"}
                        </h2>
                        <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#64748B" }}>
                            {isRegister
                                ? "Register with your verified institutional email ID"
                                : "Enter your credentials or click a demo profile below"}
                        </p>
                    </div>

                    {/* Quick Demo Persona Switcher */}
                    {!isRegister && (
                        <div style={{ marginBottom: "20px", padding: "12px", backgroundColor: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.04em" }}>
                                ⚡ Quick 1-Click Demo Profiles:
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                                {demoAccounts.map(acc => {
                                    const isCurrent = email === acc.email;
                                    return (
                                        <button
                                            key={acc.email}
                                            type="button"
                                            onClick={() => applyDemo(acc)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                padding: "6px 10px",
                                                borderRadius: "6px",
                                                border: "1px solid",
                                                borderColor: isCurrent ? "#1E5FCC" : "#CBD5E1",
                                                backgroundColor: isCurrent ? "#E6EEFC" : "#FFFFFF",
                                                color: isCurrent ? "#0B3D91" : "#334155",
                                                fontSize: "12px",
                                                fontWeight: isCurrent ? 700 : 500,
                                                cursor: "pointer",
                                                textAlign: "left",
                                                transition: "all 0.15s ease",
                                            }}
                                        >
                                            <span>{acc.icon}</span>
                                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {acc.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Feedback Alerts */}
                    {error && (
                        <div
                            style={{
                                padding: "10px 14px",
                                borderRadius: "8px",
                                backgroundColor: "#FEE2E2",
                                border: "1px solid #FCA5A5",
                                color: "#B91C1C",
                                fontSize: "13px",
                                marginBottom: "16px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div
                            style={{
                                padding: "10px 14px",
                                borderRadius: "8px",
                                backgroundColor: "#DCFCE7",
                                border: "1px solid #86EFAC",
                                color: "#15803D",
                                fontSize: "13px",
                                marginBottom: "16px",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <span>✅</span>
                            <span>{success}</span>
                        </div>
                    )}

                    {/* Sign-in Form */}
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {isRegister && (
                            <div>
                                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "5px" }}>
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Ashwanth S"
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #CBD5E1",
                                        fontSize: "13.5px",
                                        outline: "none",
                                    }}
                                />
                            </div>
                        )}

                        {/* Role Selector */}
                        <div>
                            <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "5px" }}>
                                Portal Role
                            </label>
                            <select
                                value={role}
                                onChange={e => setRole(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid #CBD5E1",
                                    fontSize: "13.5px",
                                    backgroundColor: "#FFFFFF",
                                    outline: "none",
                                    cursor: "pointer",
                                }}
                            >
                                <option value="student">🎓 Student (Job Seeker / Candidate)</option>
                                <option value="officer">🏛️ Placement Officer (Cell Administration)</option>
                                <option value="admin">👑 Super Admin (System & Institutional Governance)</option>
                            </select>
                        </div>

                        {/* Email Field */}
                        <div>
                            <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "5px" }}>
                                Institutional / Corporate Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="name@college.edu or name@company.com"
                                required
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid #CBD5E1",
                                    fontSize: "13.5px",
                                    outline: "none",
                                }}
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                                <label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                                    Password
                                </label>
                                {!isRegister && (
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(true)}
                                        style={{ background: "none", border: "none", color: "#1E5FCC", fontSize: "12px", fontWeight: 600, cursor: "pointer", padding: 0 }}
                                    >
                                        Forgot Password?
                                    </button>
                                )}
                            </div>
                            <div style={{ position: "relative" }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter your secure password"
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "10px 40px 10px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #CBD5E1",
                                        fontSize: "13.5px",
                                        outline: "none",
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: "absolute",
                                        right: "10px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none",
                                        border: "none",
                                        fontSize: "14px",
                                        color: "#64748B",
                                        cursor: "pointer",
                                    }}
                                >
                                    {showPassword ? "🙈" : "👁️"}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me */}
                        {!isRegister && (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "2px 0" }}>
                                <input
                                    type="checkbox"
                                    id="rememberMe"
                                    checked={rememberMe}
                                    onChange={e => setRememberMe(e.target.checked)}
                                    style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#0B3D91" }}
                                />
                                <label htmlFor="rememberMe" style={{ fontSize: "12.5px", color: "#475569", cursor: "pointer" }}>
                                    Remember session on this trusted device (30 days)
                                </label>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "8px",
                                border: "none",
                                backgroundColor: loading ? "#93C5FD" : "#0B3D91",
                                color: "#FFFFFF",
                                fontSize: "14px",
                                fontWeight: 700,
                                cursor: loading ? "not-allowed" : "pointer",
                                marginTop: "6px",
                                transition: "background-color 0.15s ease",
                                boxShadow: "0 2px 6px rgba(11, 61, 145, 0.3)",
                            }}
                        >
                            {loading
                                ? "Authenticating..."
                                : isRegister
                                ? "Register Account"
                                : "Sign In to Portal →"}
                        </button>
                    </form>

                    {/* SSO Divider & Button */}
                    {!isRegister && (
                        <div style={{ marginTop: "18px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                                <div style={{ flex: 1, height: "1px", backgroundColor: "#E2E8F0" }} />
                                <span style={{ fontSize: "11.5px", color: "#94A3B8", fontWeight: 600 }}>OR SINGLE SIGN-ON</span>
                                <div style={{ flex: 1, height: "1px", backgroundColor: "#E2E8F0" }} />
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    // Use demo quick login for institutional SSO
                                    applyDemo(demoAccounts[0]);
                                    setSuccess("Single Sign-On simulated: Authenticating Ashwanth S via Institution IdP...");
                                    setTimeout(() => {
                                        handleSubmit({ preventDefault: () => {} } as any);
                                    }, 800);
                                }}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    border: "1px solid #CBD5E1",
                                    backgroundColor: "#F8FAFC",
                                    color: "#334155",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                }}
                            >
                                <span>🏛️</span>
                                <span>Continue with Institution Microsoft / SAML SSO</span>
                            </button>
                        </div>
                    )}

                    {/* Toggle Mode */}
                    <div style={{ marginTop: "20px", textAlign: "center", fontSize: "13px", color: "#64748B" }}>
                        {isRegister ? (
                            <span>
                                Already registered?{" "}
                                <button
                                    type="button"
                                    onClick={() => { setIsRegister(false); setError(null); }}
                                    style={{ background: "none", border: "none", color: "#1E5FCC", fontWeight: 700, cursor: "pointer" }}
                                >
                                    Sign In here
                                </button>
                            </span>
                        ) : (
                            <span>
                                New candidate or recruiter?{" "}
                                <button
                                    type="button"
                                    onClick={() => { setIsRegister(true); setError(null); }}
                                    style={{ background: "none", border: "none", color: "#1E5FCC", fontWeight: 700, cursor: "pointer" }}
                                >
                                    Register account
                                </button>
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.6)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "16px",
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            maxWidth: "420px",
                            backgroundColor: "#FFFFFF",
                            borderRadius: "14px",
                            padding: "24px",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                        }}
                    >
                        <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
                            🔑 Reset Password
                        </h3>
                        <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748B" }}>
                            Enter your registered institutional email. We will dispatch an automated recovery link valid for 15 minutes.
                        </p>

                        {resetSent ? (
                            <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "#DCFCE7", color: "#15803D", fontSize: "13px", fontWeight: 600 }}>
                                ✅ Password reset instructions sent to {resetEmail || email}!
                            </div>
                        ) : (
                            <form onSubmit={handlePasswordReset}>
                                <input
                                    type="email"
                                    placeholder="Enter your registered email ID"
                                    value={resetEmail || email}
                                    onChange={e => setResetEmail(e.target.value)}
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #CBD5E1",
                                        fontSize: "13.5px",
                                        marginBottom: "16px",
                                        outline: "none",
                                    }}
                                />
                                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(false)}
                                        style={{
                                            padding: "8px 14px",
                                            borderRadius: "6px",
                                            border: "1px solid #CBD5E1",
                                            backgroundColor: "#FFFFFF",
                                            color: "#475569",
                                            fontSize: "13px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: "8px 16px",
                                            borderRadius: "6px",
                                            border: "none",
                                            backgroundColor: "#0B3D91",
                                            color: "#FFFFFF",
                                            fontSize: "13px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Send Reset Link
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
