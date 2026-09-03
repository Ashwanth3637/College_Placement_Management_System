import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";
import StudentManagement from "./StudentManagement";
import DriveManagement from "./DriveManagement";
import ApplicationManagement from "./ApplicationManagement";
import InterviewManagement from "./InterviewManagement";
import SelectionsManagement from "./SelectionsManagement";
import ReportsAnalyticsManagement from "./ReportsAnalyticsManagement";

interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: string;
  regNo?: string;
  department?: string;
  phone?: string;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
  initialTab?: string;
}

export const OfficerDashboard: React.FC<DashboardProps> = ({ user, onLogout, initialTab = "stats" }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Live Database States
  const [drivesList, setDrivesList] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [applicationsList, setApplicationsList] = useState<any[]>([]);
  const [selectionsList, setSelectionsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchAllOfficerData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Drives
      try {
        const res = await fetch(`${API_BASE_URL}/api/company/drives`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setDrivesList(data);
        }
      } catch (e) {}

      // 2. Fetch Students
      try {
        const res = await fetch(`${API_BASE_URL}/api/student/all`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setStudentsList(data);
        }
      } catch (e) {}

      // 3. Fetch Applications
      try {
        const res = await fetch(`${API_BASE_URL}/api/applications`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setApplicationsList(data);
        }
      } catch (e) {}

      // 4. Fetch Selections
      try {
        const res = await fetch(`${API_BASE_URL}/api/selections`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setSelectionsList(data);
        }
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOfficerData();
    const interval = setInterval(fetchAllOfficerData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Aggregated KPIs
  const totalActiveDrives = drivesList.filter(d => (d.status || "").toLowerCase() === "active").length;
  const totalStudents = studentsList.length;
  const totalApplications = applicationsList.length;
  const totalSelected = selectionsList.filter(s => (s.status || "").toLowerCase().includes("select") || (s.status || "").toLowerCase().includes("placed")).length;

  const upcomingDrives = drivesList.filter(d => (d.status || "").toLowerCase() === "active" || (d.status || "").toLowerCase() === "upcoming" || !d.status).slice(0, 4);
  const recentApplications = applicationsList.slice(0, 4);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", backgroundColor: "#F8FAFC", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 1040 }}
        />
      )}

      {/* Left Sidebar Navigation Matching Student Module Design */}
      <aside
        className={`app-drawer-sidebar ${isMobileMenuOpen ? "open" : ""}`}
        style={{
          width: "260px",
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid #E2E8F0",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "24px 16px",
          boxSizing: "border-box",
          flexShrink: 0,
          zIndex: 1050
        }}
      >
        <div>
          {/* Brand Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0 8px 24px 8px", borderBottom: "1px solid #E2E8F0", marginBottom: "20px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", backgroundColor: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(79,70,229,0.25)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "14.5px", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.2px" }}>PLACEMENT CELL</div>
              <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>Officer Portal</div>
            </div>
          </div>

          <div style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", padding: "0 10px 8px 10px", textTransform: "uppercase" }}>
            PORTAL NAVIGATION
          </div>

          {/* 7 Streamlined Nav Items with Crisp Vector SVG Icons */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {[
              {
                id: "stats",
                label: "Dashboard",
                svg: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                )
              },
              {
                id: "drives",
                label: "Drive Management",
                svg: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                )
              },
              {
                id: "verification",
                label: "Student Candidates",
                svg: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                )
              },
              {
                id: "applications",
                label: "Application Pipeline",
                svg: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                )
              },
              {
                id: "interviews",
                label: "Interview Schedules",
                svg: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                )
              },
              {
                id: "selections",
                label: "Offers & Selections",
                svg: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17M14 14.66V17M18 4H6v7a6 6 0 0 0 12 0V4z" />
                  </svg>
                )
              },
              {
                id: "reports",
                label: "Reports & Analytics",
                svg: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                )
              },
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "none",
                    backgroundColor: isActive ? "#EEF2FF" : "transparent",
                    color: isActive ? "#4338CA" : "#475569",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "13.5px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                    borderLeft: isActive ? "3.5px solid #4F46E5" : "3.5px solid transparent"
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "#F5F3FF";
                    if (!isActive) e.currentTarget.style.color = "#4338CA";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                    if (!isActive) e.currentTarget.style.color = "#475569";
                  }}
                >
                  <span style={{ color: isActive ? "#4F46E5" : "#64748B", display: "flex", alignItems: "center" }}>
                    {item.svg}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Pill & Sign Out */}
        <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", backgroundColor: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontWeight: 800, fontSize: "13px" }}>
              PO
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {user.name || "Placement Officer"}
              </div>
              <div style={{ fontSize: "11px", color: "#64748B", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                {user.email || "officer@college.edu"}
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              padding: "9px 12px",
              backgroundColor: "#FEF2F2",
              color: "#DC2626",
              border: "1px solid #FECACA",
              borderRadius: "8px",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Right Main Body Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflowY: "auto", overflowX: "hidden", maxWidth: "100vw", boxSizing: "border-box" }}>
        
        {/* Top Header */}
        <div style={{ padding: "clamp(12px, 3vw, 20px) clamp(12px, 3vw, 28px) 0 clamp(12px, 3vw, 28px)", boxSizing: "border-box", width: "100%" }}>
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              padding: "12px 20px",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              borderLeft: "4px solid #4F46E5",
              gap: "10px",
              boxShadow: "0 2px 6px rgba(79,70,229,0.03)",
              boxSizing: "border-box",
              width: "100%"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="mobile-hamburger-toggle"
                style={{ display: "none", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", cursor: "pointer", fontSize: "18px", color: "#4F46E5" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              <div>
                <h1 style={{ margin: 0, fontSize: "clamp(15px, 2.5vw, 19px)", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px" }}>
                  Placement Officer Management Console
                </h1>
                <div style={{ fontSize: "11.5px", color: "#64748B", fontWeight: 500, marginTop: "2px" }}>
                  All Placement Seasons • Campus Recruitment Lifecycle & Analytics
                </div>
              </div>
            </div>

            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#DCFCE7", border: "1px solid #86EFAC", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, color: "#15803D" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#16A34A" }}></span>
              <span>Live System Connected</span>
            </div>
          </header>
        </div>

        {/* Content Body */}
        <main style={{ flex: 1, padding: "clamp(14px, 3vw, 24px) clamp(12px, 3vw, 28px)", boxSizing: "border-box", width: "100%", maxWidth: "100%" }}>
          
          {/* ========================================================================= */}
          {/* TAB 1: EXECUTIVE DASHBOARD (Student Module Layout & Cards) */}
          {/* ========================================================================= */}
          {activeTab === "stats" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Executive Welcome Hero Banner */}
              <div style={{
                background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)",
                borderRadius: "16px",
                padding: "22px 26px",
                color: "#ffffff",
                boxShadow: "0 10px 25px -5px rgba(67, 56, 202, 0.3)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "14px"
              }}>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: "16px", fontSize: "11px", fontWeight: 700, color: "#E0E7FF", marginBottom: "8px" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#818CF8" }}></span>
                    Campus Placement Portal • Multi-Season Recruitment Console
                  </div>
                  <h1 style={{ fontSize: "clamp(18px, 4vw, 23px)", fontWeight: 800, margin: "0 0 6px 0", color: "#FFFFFF", letterSpacing: "-0.3px" }}>
                    Welcome, {user.name || "Placement Officer"}!
                  </h1>
                  <p style={{ fontSize: "13px", color: "#C7D2FE", margin: 0, lineHeight: 1.5 }}>
                    Overseeing <strong>{totalActiveDrives} active drives</strong> and <strong>{totalStudents} enrolled candidates</strong> across all active placement seasons.
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => setActiveTab("drives")}
                    style={{ backgroundColor: "#FFFFFF", color: "#4338CA", border: "none", borderRadius: "8px", padding: "9px 16px", fontWeight: 700, fontSize: "12.5px", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  >
                    + Create & Publish Drive
                  </button>
                </div>
              </div>

              {/* 4 Metric KPI Cards in 4-Column Grid matching Student Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "16px" }}>
                {[
                  {
                    label: "Active Placement Drives",
                    value: totalActiveDrives,
                    sub: "Published on portal",
                    color: "#4F46E5",
                    bg: "#EEF2FF",
                    onClick: () => setActiveTab("drives"),
                    svg: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                    )
                  },
                  {
                    label: "Registered Candidates",
                    value: totalStudents,
                    sub: "Verified student profiles",
                    color: "#059669",
                    bg: "#DCFCE7",
                    onClick: () => setActiveTab("verification"),
                    svg: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                    )
                  },
                  {
                    label: "Applications In Pipeline",
                    value: totalApplications,
                    sub: "Under review & rounds",
                    color: "#7C3AED",
                    bg: "#F3E8FF",
                    onClick: () => setActiveTab("applications"),
                    svg: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    )
                  },
                  {
                    label: "Offers & Selections",
                    value: totalSelected,
                    sub: `${totalStudents > 0 ? Math.round((totalSelected / totalStudents) * 100) : 0}% Placement Rate`,
                    color: "#16A34A",
                    bg: "#DCFCE7",
                    onClick: () => setActiveTab("selections"),
                    svg: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17M14 14.66V17M18 4H6v7a6 6 0 0 0 12 0V4z" />
                      </svg>
                    )
                  }
                ].map((kpi, idx) => (
                  <div
                    key={idx}
                    onClick={kpi.onClick}
                    style={{
                      backgroundColor: "#FFFFFF",
                      padding: "16px 18px",
                      borderRadius: "12px",
                      border: "1px solid #E2E8F0",
                      borderTop: `4px solid ${kpi.color}`,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                      cursor: "pointer",
                      transition: "all 0.18s ease-in-out"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-3px)";
                      e.currentTarget.style.boxShadow = "0 8px 18px rgba(79,70,229,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>{kpi.label}</span>
                      <span style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {kpi.svg}
                      </span>
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A", marginTop: "6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>{kpi.value}</span>
                      <span style={{ fontSize: "11.5px", color: kpi.color, fontWeight: 700 }}>View →</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>{kpi.sub}</div>
                  </div>
                ))}
              </div>

              {/* Dual-Card Container (Left: Upcoming Placement Drives, Right: Recent Applications Pipeline) */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: "20px" }}>
                
                {/* LEFT CARD: Upcoming Placement Drives */}
                <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", fontWeight: 800, color: "#0F172A" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          Upcoming Drives
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                          Campus recruitment schedule & active hiring pipeline
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("drives")}
                        style={{ padding: "5px 12px", backgroundColor: "#FFFFFF", color: "#334155", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                      >
                        View all
                      </button>
                    </div>
                    <div style={{ height: "1px", backgroundColor: "#F1F5F9", marginBottom: "14px" }}></div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {upcomingDrives.length === 0 ? (
                        <div style={{ padding: "20px", textAlign: "center", color: "#94A3B8", fontSize: "12.5px" }}>
                          No upcoming placement drives scheduled.
                        </div>
                      ) : (
                        upcomingDrives.map((d, idx) => {
                          const dateObj = d.deadline ? new Date(d.deadline) : new Date();
                          const dayNum = isNaN(dateObj.getDate()) ? "15" : String(dateObj.getDate());
                          const monthStr = isNaN(dateObj.getMonth()) ? "SEPT" : dateObj.toLocaleString("en-US", { month: "short" }).toUpperCase();

                          return (
                            <div
                              key={idx}
                              onClick={() => setActiveTab("drives")}
                              style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: "10px",
                                border: "1.5px solid #E2E8F0",
                                padding: "12px 14px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "10px",
                                cursor: "pointer",
                                transition: "all 0.15s ease"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "#CBD5E1";
                                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "#E2E8F0";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{
                                  width: "42px",
                                  height: "42px",
                                  borderRadius: "8px",
                                  backgroundColor: "#EEF2FF",
                                  border: "1px solid #C7D2FE",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0
                                }}>
                                  <div style={{ fontSize: "14px", fontWeight: 900, color: "#4338CA", lineHeight: 1 }}>{dayNum}</div>
                                  <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#6366F1", marginTop: "2px" }}>{monthStr}</div>
                                </div>

                                <div>
                                  <div style={{ fontWeight: 800, fontSize: "13.5px", color: "#0F172A" }}>{d.company}</div>
                                  <div style={{ fontSize: "11.5px", color: "#64748B" }}>
                                    {d.role || d.jobTitle || "Software Engineer"} • <strong style={{ color: "#4F46E5" }}>{d.ctc || d.packageCtc || "₹12.0 LPA"}</strong>
                                  </div>
                                </div>
                              </div>

                              <span style={{ fontSize: "11px", color: "#059669", fontWeight: 700, backgroundColor: "#DCFCE7", padding: "4px 8px", borderRadius: "6px", border: "1px solid #86EFAC", whiteSpace: "nowrap" }}>
                                Active Drive
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT CARD: Recent Applications Pipeline */}
                <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", fontWeight: 800, color: "#0F172A" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          Recent Applications Pipeline
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                          Live submissions by candidate applicants
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("applications")}
                        style={{ padding: "5px 12px", backgroundColor: "#FFFFFF", color: "#334155", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                      >
                        View pipeline
                      </button>
                    </div>
                    <div style={{ height: "1px", backgroundColor: "#F1F5F9", marginBottom: "14px" }}></div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {recentApplications.length === 0 ? (
                        <div style={{ padding: "20px", textAlign: "center", color: "#94A3B8", fontSize: "12.5px" }}>
                          No recent candidate applications submitted yet.
                        </div>
                      ) : (
                        recentApplications.map((app, idx) => (
                          <div key={idx} style={{ backgroundColor: "#FFFFFF", borderRadius: "10px", border: "1.5px solid #E2E8F0", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: "13px", color: "#0F172A" }}>{app.studentName || app.studentEmail}</div>
                              <div style={{ fontSize: "11px", color: "#64748B" }}>Applying for <strong>{app.companyName}</strong> ({app.jobRole || "SDE"})</div>
                            </div>
                            <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#4F46E5", backgroundColor: "#EEF2FF", padding: "3px 8px", borderRadius: "6px" }}>
                              {app.status || "Applied"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: DRIVE MANAGEMENT (Multi-Step Wizard) */}
          {activeTab === "drives" && <DriveManagement />}

          {/* TAB 3: STUDENT CANDIDATES */}
          {activeTab === "verification" && <StudentManagement />}

          {/* TAB 4: APPLICATION PIPELINE */}
          {activeTab === "applications" && <ApplicationManagement />}

          {/* TAB 5: INTERVIEW SCHEDULES */}
          {activeTab === "interviews" && <InterviewManagement />}

          {/* TAB 6: OFFERS & SELECTIONS */}
          {activeTab === "selections" && <SelectionsManagement user={user} />}

          {/* TAB 7: REPORTS & ANALYTICS */}
          {activeTab === "reports" && <ReportsAnalyticsManagement />}

        </main>
      </div>

    </div>
  );
};

export default OfficerDashboard;
