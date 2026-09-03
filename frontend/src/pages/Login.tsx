import React, { useState } from "react";
import { API_BASE_URL } from "../config/api";

interface LoginProps {
  onLoginSuccess?: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
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
    {
      label: "Student Portal",
      role: "student",
      name: "Ashwanth S",
      email: "ashwanth@college.edu",
      pass: "password123",
      svg: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      )
    },
    {
      label: "Placement Officer",
      role: "officer",
      name: "Placement Officer",
      email: "officer@college.edu",
      pass: "password123",
      svg: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      )
    },
    {
      label: "Super Admin",
      role: "admin",
      name: "Super Admin",
      email: "admin@college.edu",
      pass: "password123",
      svg: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    },
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
        if (data.user?.role === "student") {
          try {
            const channel = new BroadcastChannel("cpms_profile_channel");
            channel.postMessage({ type: "STUDENT_LOGGED_IN", user: data.user });
            channel.close();
          } catch (e) {}
          window.dispatchEvent(new Event("cpms_profile_updated"));
          window.dispatchEvent(new Event("storage"));
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
    <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "#071E4A", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      
      {/* ========================================================================= */}
      {/* LEFT HERO PANE WITH MODERN ILLUSTRATION IMAGE & ENTERPRISE BRANDING */}
      {/* ========================================================================= */}
      <div
        style={{
          flex: "1 1 54%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "clamp(28px, 4vw, 44px) clamp(32px, 5vw, 56px)",
          background: "linear-gradient(145deg, #051937 0%, #002B66 40%, #0B3D91 75%, #124EA8 100%)",
          color: "#FFFFFF",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle Decorative Ambient Background Glows */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            left: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(0,0,0,0) 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            right: "-80px",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, rgba(0,0,0,0) 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Top Institutional Header */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              backgroundColor: "#FFFFFF",
              color: "#0B3D91",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0B3D91" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "17px", fontWeight: 800, letterSpacing: "-0.2px", color: "#FFFFFF" }}>
              ENTERPRISE PLACEMENT PORTAL
            </div>
            <div style={{ fontSize: "12px", color: "#93C5FD", fontWeight: 500 }}>
              Autonomous Placement & Corporate Relations Cell
            </div>
          </div>
        </div>

        {/* Center Content & Modern Campus Recruitment Image */}
        <div style={{ position: "relative", zIndex: 2, margin: "24px 0" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "5px 14px",
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              fontSize: "12px",
              fontWeight: 700,
              color: "#FDE68A",
              marginBottom: "16px",
            }}
          >
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#FBBF24" }}></span>
            Campus Placement Portal • Live
          </div>

          <h1
            style={{
              fontSize: "clamp(26px, 3.2vw, 36px)",
              fontWeight: 800,
              lineHeight: 1.25,
              letterSpacing: "-0.5px",
              marginBottom: "12px",
              color: "#FFFFFF",
            }}
          >
            Institutional Recruitment & Placement Platform
          </h1>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#BFDBFE", marginBottom: "22px", maxWidth: "560px" }}>
            Connecting candidate talents, corporate recruiters, and academic departments with automated eligibility checking, interview pipeline triage, and real-time accreditation reporting.
          </p>

          {/* Modern Premium Hero Image Container */}
          <div
            style={{
              position: "relative",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1.5px solid rgba(255, 255, 255, 0.22)",
              boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.45)",
              marginBottom: "24px",
              maxWidth: "580px",
              backgroundColor: "rgba(15, 23, 42, 0.4)",
            }}
          >
            <img
              src="/campus_placement_hero.jpg"
              alt="Campus Placement Day Illustration"
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "220px",
                objectFit: "cover",
                display: "block",
                transition: "transform 0.4s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(5, 25, 55, 0.75) 0%, transparent 40%)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                left: "14px",
                fontSize: "12px",
                fontWeight: 700,
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                textShadow: "0 2px 4px rgba(0,0,0,0.6)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>100% Automated Campus Hiring Workflow</span>
            </div>
          </div>

          {/* KPI Glassmorphism Stats Highlights */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", maxWidth: "580px" }}>
            <div style={{ backgroundColor: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(6px)", padding: "14px 16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.16)" }}>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF" }}>98.4%</div>
              <div style={{ fontSize: "11px", color: "#93C5FD", marginTop: "2px", fontWeight: 600 }}>Placement Rate</div>
            </div>
            <div style={{ backgroundColor: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(6px)", padding: "14px 16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.16)" }}>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF" }}>₹44 LPA</div>
              <div style={{ fontSize: "11px", color: "#93C5FD", marginTop: "2px", fontWeight: 600 }}>Highest Package</div>
            </div>
            <div style={{ backgroundColor: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(6px)", padding: "14px 16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.16)" }}>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF" }}>250+</div>
              <div style={{ fontSize: "11px", color: "#93C5FD", marginTop: "2px", fontWeight: 600 }}>Partner Corporates</div>
            </div>
          </div>
        </div>

        {/* Bottom Compliance & Security Footer */}
        <div style={{ position: "relative", zIndex: 2, fontSize: "11.5px", color: "#93C5FD", display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            256-Bit SSL Encrypted
          </span>
          <span>•</span>
          <span>WCAG 2.1 AA Compliant</span>
          <span>•</span>
          <span>RBAC ISO/IEC 27001</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT AUTHENTICATION CARD PANE */}
      {/* ========================================================================= */}
      <div
        style={{
          flex: "1 1 46%",
          backgroundColor: "#F8FAFC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(24px, 4vw, 40px)",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "460px",
            backgroundColor: "#FFFFFF",
            borderRadius: "18px",
            padding: "36px 32px",
            boxShadow: "0 12px 36px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
            border: "1px solid #E2E8F0",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: "22px" }}>
            <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#4F46E5", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
              INSTITUTIONAL GATEWAY
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

          {/* Quick 1-Click Demo Profiles (Clean Buttons with Vector SVGs) */}
          {!isRegister && (
            <div style={{ marginBottom: "22px", padding: "12px", backgroundColor: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.04em" }}>
                QUICK 1-CLICK DEMO PROFILES:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
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
                        gap: "8px",
                        padding: "7px 10px",
                        borderRadius: "8px",
                        border: "1px solid",
                        borderColor: isCurrent ? "#4F46E5" : "#CBD5E1",
                        backgroundColor: isCurrent ? "#EEF2FF" : "#FFFFFF",
                        color: isCurrent ? "#4338CA" : "#334155",
                        fontSize: "12px",
                        fontWeight: isCurrent ? 700 : 600,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ color: isCurrent ? "#4F46E5" : "#64748B", display: "flex", alignItems: "center" }}>
                        {acc.svg}
                      </span>
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {acc.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Alerts */}
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              <span>{success}</span>
            </div>
          )}

          {/* Sign-in Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {isRegister && (
              <div>
                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                  Full Official Name *
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
                    boxSizing: "border-box"
                  }}
                />
              </div>
            )}

            {/* Role Selector */}
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
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
                  boxSizing: "border-box"
                }}
              >
                <option value="student">Student (Job Seeker / Candidate)</option>
                <option value="officer">Placement Officer (Cell Administration)</option>
                <option value="admin">Super Admin (Institutional Governance)</option>
              </select>
            </div>

            {/* Email Field */}
            <div>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
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
                  boxSizing: "border-box"
                }}
              />
            </div>

            {/* Password Field */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#334155" }}>
                  Password
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    style={{ background: "none", border: "none", color: "#4F46E5", fontSize: "12px", fontWeight: 700, cursor: "pointer", padding: 0 }}
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
                    boxSizing: "border-box"
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
                    color: "#64748B",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
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
                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#4F46E5" }}
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
                boxShadow: "0 4px 12px rgba(11, 61, 145, 0.25)",
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
                <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 700, letterSpacing: "0.04em" }}>OR SINGLE SIGN-ON</span>
                <div style={{ flex: 1, height: "1px", backgroundColor: "#E2E8F0" }} />
              </div>

              <button
                type="button"
                onClick={() => {
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
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
                  style={{ background: "none", border: "none", color: "#4F46E5", fontWeight: 700, cursor: "pointer" }}
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
                  style={{ background: "none", border: "none", color: "#4F46E5", fontWeight: 700, cursor: "pointer" }}
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
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
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
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 800, color: "#0F172A" }}>
              Reset Password
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748B" }}>
              Enter your registered institutional email. We will dispatch an automated recovery link valid for 15 minutes.
            </p>

            {resetSent ? (
              <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "#DCFCE7", color: "#15803D", fontSize: "13px", fontWeight: 700 }}>
                Password reset instructions sent to {resetEmail || email}!
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
                    boxSizing: "border-box"
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
                      fontWeight: 700,
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
                      fontWeight: 700,
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
