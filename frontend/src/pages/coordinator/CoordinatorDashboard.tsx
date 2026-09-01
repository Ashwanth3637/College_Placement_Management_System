import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";
import { useParams } from "react-router-dom";
import CoordinatorEvents from "./CoordinatorEvents";
import CoordinatorAttendance from "./CoordinatorAttendance";
import CoordinatorInterviews from "./CoordinatorInterviews";
import CoordinatorAnnouncements from "./CoordinatorAnnouncements";
import CoordinatorStudents from "./CoordinatorStudents";
import ClearDataButton from "../../components/ClearDataButton";

export interface CoordinatorDashboardProps {
    user?: any;
    onLogout?: () => void;
    initialTab?: string;
}

export const CoordinatorDashboard: React.FC<CoordinatorDashboardProps> = ({
    user = { name: "Prof. Rajesh Sharma", email: "coordinator@college.edu", department: "Computer Science & Engineering" },
    onLogout,
    initialTab = "dashboard"
}) => {
    const params = useParams();
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
    const computedTab = initialTab || params?.tab || "dashboard";

    const userKey = user?.id || user?._id || user?.email || "coordinator";
    const [activeTab, setActiveTabState] = useState<string>(() => {
        try {
            const saved = localStorage.getItem(`cpms_active_tab_coordinator_${userKey}`);
            if (saved) return saved;
        } catch (e) {}
        return computedTab;
    });

    const setActiveTab = (tab: string) => {
        setActiveTabState(tab);
        try {
            localStorage.setItem(`cpms_active_tab_coordinator_${userKey}`, tab);
        } catch (e) {}
    };

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const [shouldAutoOpenCreateEventModal, setShouldAutoOpenCreateEventModal] = useState<boolean>(false);

    // Live Metrics States
    const [eventsList, setEventsList] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem("cpms_coordinator_events");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) {}
        return [];
    });
    const [interviewsCount, setInterviewsCount] = useState<number>(0);
    const [studentsCount, setStudentsCount] = useState<number>(0);

    useEffect(() => {
        const loadLiveCounts = async () => {
            try {
                const saved = localStorage.getItem("cpms_coordinator_events");
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed)) setEventsList(parsed);
                } else {
                    setEventsList([]);
                }
            } catch (e) {}

            try {
                const savedInts = localStorage.getItem("cpms_coordinator_interviews_records");
                if (savedInts) {
                    const parsed = JSON.parse(savedInts);
                    if (Array.isArray(parsed)) setInterviewsCount(parsed.length);
                } else {
                    setInterviewsCount(0);
                }
            } catch (e) {}

            try {
                const res = await fetch(`${API_BASE_URL}/api/student/all`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) setStudentsCount(data.length);
                }
            } catch (e) {}
        };
        loadLiveCounts();
    }, [activeTab]);

    // Notifications State
    const [showNotifications, setShowNotifications] = useState<boolean>(false);
    const [unreadCount, setUnreadCount] = useState<number>(0);

    // ESC Key Navigation Handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" || e.code === "Escape") {
                if (showNotifications) {
                    setShowNotifications(false);
                } else if (isMobileMenuOpen) {
                    setIsMobileMenuOpen(false);
                } else if (shouldAutoOpenCreateEventModal) {
                    setShouldAutoOpenCreateEventModal(false);
                } else if (activeTab !== "dashboard") {
                    setActiveTab("dashboard");
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showNotifications, isMobileMenuOpen, shouldAutoOpenCreateEventModal, activeTab]);

    const coordinatorName = user?.name || "Prof. Rajesh Sharma";
    const coordinatorDept = user?.department || "Placement Operational Cell";

    const navItems = [
        {
            id: "dashboard",
            label: "Dashboard",
            svg: (
                <path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5M4 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4z" />
            )
        },
        {
            id: "events",
            label: "Events",
            svg: (
                <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
            )
        },
        {
            id: "attendance",
            label: "Attendance",
            svg: (
                <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            )
        },
        {
            id: "interviews",
            label: "Interviews",
            svg: (
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            )
        },
        {
            id: "announcements",
            label: "Announcements",
            svg: (
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
            )
        },
        {
            id: "students",
            label: "Student Directory",
            svg: (
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            )
        }
    ];

    const notificationsList = [
        {
            id: "cn_1",
            title: "Pending Attendance Verification",
            message: "Amazon SDE Assessment Lab 3 attendance requires verification.",
            time: "15m ago",
            targetTab: "attendance"
        },
        {
            id: "cn_2",
            title: "Venue Confirmation",
            message: "Auditorium Hall B assigned for Google Pre-Placement Talk.",
            time: "1h ago",
            targetTab: "events"
        },
        {
            id: "cn_3",
            title: "Interview Schedule Updated",
            message: "Rahul Kumar Round 2 interview moved to 10:00 AM.",
            time: "2h ago",
            targetTab: "interviews"
        }
    ];

    const handleTabSelect = (tabId: string) => {
        setActiveTab(tabId);
        setIsMobileMenuOpen(false);
        setShowNotifications(false);
    };

    return (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#f4f6f8", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif", width: "100%" }}>
            <style>{`
                @media (max-width: 1024px) {
                    .coordinator-sidebar-drawer {
                        position: fixed !important;
                        left: -260px;
                        top: 0;
                        bottom: 0;
                        z-index: 9999;
                        transition: left 0.25s ease-in-out;
                    }
                    .coordinator-sidebar-drawer.open {
                        left: 0 !important;
                    }
                    .coordinator-mobile-header {
                        display: flex !important;
                    }
                    .mobile-bottom-nav {
                        display: flex !important;
                    }
                }

                @media (min-width: 1025px) {
                    .coordinator-mobile-header,
                    .mobile-bottom-nav,
                    .coordinator-menu-backdrop {
                        display: none !important;
                    }
                    .coordinator-hamburger-btn {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Mobile Menu Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="coordinator-menu-backdrop"
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.5)",
                        zIndex: 9998
                    }}
                />
            )}

            {/* Left Sidebar Shell */}
            <aside className={`app-drawer-sidebar coordinator-sidebar-drawer ${isMobileMenuOpen ? "open" : ""}`} style={{ width: "240px", backgroundColor: "#ffffff", borderRight: "1px solid #eaedf0", display: "flex", flexDirection: "column", justifyContent: "space-between", flexShrink: 0, minHeight: "100vh", position: "sticky", top: 0, height: "100vh" }}>
                <div>
                    {/* Brand Header */}
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0f2f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "36px", height: "36px", backgroundColor: "#0f172a", borderRadius: "10px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "16px" }}>
                                CP
                            </div>
                            <div>
                                <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "15px", letterSpacing: "-0.3px" }}>Placement Portal</div>
                                <div style={{ fontSize: "10px", color: "#2563eb", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>COORDINATOR SPACE</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="mobile-drawer-close"
                            style={{ display: "none", background: "none", border: "none", fontSize: "20px", color: "#64748b", cursor: "pointer", padding: "4px" }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Navigation Menu */}
                    <div style={{ padding: "16px 12px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", letterSpacing: "1px", padding: "0 12px 14px 12px", textTransform: "uppercase" }}>MAIN SPACE</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {navItems.map((item) => {
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleTabSelect(item.id)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "14px",
                                            padding: "12px 18px",
                                            borderRadius: "16px",
                                            border: isActive ? "2px solid #0052cc" : "2px solid transparent",
                                            backgroundColor: isActive ? "#f4f6f8" : "transparent",
                                            color: isActive ? "#0f172a" : "#64748b",
                                            fontWeight: isActive ? "700" : "400",
                                            fontSize: "15px",
                                            fontFamily: "Inter, -apple-system, sans-serif",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            transition: "all 0.15s ease-in-out",
                                            outline: "none",
                                        }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isActive ? "#0f172a" : "#64748b"} strokeWidth={isActive ? "2.4" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
                                            {item.svg}
                                        </svg>
                                        <span style={{ fontWeight: isActive ? "700" : "400", color: isActive ? "#0f172a" : "#64748b" }}>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Sidebar User Footer */}
                <div style={{ padding: "16px 16px 20px 16px", borderTop: "1px solid #f0f2f5" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", backgroundColor: "#f8fafc", padding: "10px 12px", borderRadius: "10px" }}>
                        <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" }}>
                            {coordinatorName.charAt(0)}
                        </div>
                        <div style={{ overflow: "hidden" }}>
                            <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{coordinatorName}</div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>Coordinator</div>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        style={{
                            width: "100%",
                            padding: "9px 14px",
                            backgroundColor: "#fff",
                            color: "#ef4444",
                            border: "1px solid #fee2e2",
                            borderRadius: "8px",
                            fontWeight: "700",
                            fontSize: "13px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px"
                        }}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Application Area Shell */}
            <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
                {/* Top Header Bar with Mobile Hamburger Toggle */}
                <div style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #eaedf0", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="mobile-hamburger-toggle"
                            style={{ display: "none", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", cursor: "pointer", fontSize: "18px", color: "#0f172a" }}
                            aria-label="Open Menu"
                        >
                            ☰
                        </button>
                        <div style={{ fontSize: "14px", color: "#0f172a", fontWeight: "700" }}>
                            Coordinator Portal — Placement Management
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ position: "relative" }}>
                        <button
                            type="button"
                            onClick={() => {
                                setShowNotifications(prev => !prev);
                                setUnreadCount(0);
                            }}
                            style={{
                                background: "#f8fafc",
                                border: "1px solid #cbd5e1",
                                width: "38px",
                                height: "38px",
                                borderRadius: "10px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                position: "relative"
                            }}
                        >
                            <span style={{ fontSize: "18px" }}>🔔</span>
                            {unreadCount > 0 && (
                                <span style={{
                                    position: "absolute",
                                    top: "-4px",
                                    right: "-4px",
                                    backgroundColor: "#dc2626",
                                    color: "#ffffff",
                                    fontSize: "10px",
                                    fontWeight: "800",
                                    width: "18px",
                                    height: "18px",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    border: "2px solid #ffffff"
                                }}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Interactive Notification Bell Dropdown Popup */}
                        {showNotifications && (
                            <div
                                style={{
                                    position: "absolute",
                                    right: 0,
                                    top: "46px",
                                    width: "320px",
                                    backgroundColor: "#ffffff",
                                    borderRadius: "14px",
                                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)",
                                    border: "1px solid #eaedf0",
                                    zIndex: 100,
                                    overflow: "hidden"
                                }}
                            >
                                <div style={{ padding: "12px 16px", backgroundColor: "#f8fafc", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a" }}>Operational Alerts</span>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#2563eb", backgroundColor: "#eff6ff", padding: "2px 8px", borderRadius: "10px" }}>3 New</span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    {notificationsList.map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => handleTabSelect(n.targetTab)}
                                            style={{
                                                padding: "12px 16px",
                                                borderBottom: "1px solid #f1f5f9",
                                                cursor: "pointer",
                                                transition: "background-color 0.15s ease"
                                            }}
                                        >
                                            <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>{n.title}</div>
                                            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{n.message}</div>
                                            <div style={{ fontSize: "10px", color: "#2563eb", fontWeight: "700", marginTop: "4px" }}>{n.time} • Click to view →</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

                {/* Mobile Top Navigation Header */}
                <div className="coordinator-mobile-header" style={{ padding: "14px 20px", backgroundColor: "#ffffff", borderBottom: "1px solid #eaedf0", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                        </button>
                        <span style={{ fontWeight: "800", fontSize: "16px", color: "#0f172a" }}>Placement Portal</span>
                    </div>
                </div>

                {/* Main Scrollable Viewport */}
                <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "clamp(14px, 4vw, 28px) clamp(12px, 4vw, 32px)" }}>
                    {activeTab === "dashboard" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                            {/* Premium Coordinator Hero Banner */}
                            <div
                                style={{
                                    backgroundColor: "#0f172a",
                                    borderRadius: "20px",
                                    padding: "24px 28px",
                                    color: "#ffffff",
                                    position: "relative",
                                    overflow: "hidden",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "16px",
                                    boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.15)"
                                }}
                            >
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: "11px", fontWeight: "800", color: "#38bdf8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                                        📋 COORDINATOR DASHBOARD
                                    </div>
                                    <h2 style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.5px", overflowWrap: "break-word" }}>
                                        Welcome back, {coordinatorName} 👋
                                    </h2>
                                    <div style={{ color: "#9ca3af", fontSize: "13px", fontWeight: "500" }}>
                                        Department: <strong style={{ color: "#ffffff", fontWeight: "700" }}>{coordinatorDept}</strong> | Recruitment Season: <strong style={{ color: "#ffffff" }}>2026</strong>
                                    </div>
                                </div>
                                <div style={{
                                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                                    color: "#f9fafb",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    borderRadius: "30px",
                                    padding: "10px 18px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    flexShrink: 0,
                                    whiteSpace: "nowrap"
                                }}>
                                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                                    Operations Active
                                </div>
                            </div>

                            {/* 5 Top Operational KPI Cards */}
                            <div className="responsive-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "16px" }}>
                                {/* Total Students */}
                                <div
                                    onClick={() => setActiveTab("students")}
                                    style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "20px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", cursor: "pointer" }}
                                >
                                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                    </div>
                                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>TOTAL STUDENTS</div>
                                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "4px 0 2px 0" }}>{studentsCount}</div>
                                    <div style={{ fontSize: "12px", color: "#2563eb", fontWeight: "600" }}>Registered placement candidates</div>
                                </div>

                                {/* Upcoming Events */}
                                <div
                                    onClick={() => setActiveTab("events")}
                                    style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "20px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", cursor: "pointer" }}
                                >
                                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#f3e8ff", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                    </div>
                                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>UPCOMING EVENTS</div>
                                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#9333ea", margin: "4px 0 2px 0" }}>{eventsList.length}</div>
                                    <div style={{ fontSize: "12px", color: "#9333ea", fontWeight: "600" }}>Drives & pre-placement talks</div>
                                </div>

                                {/* Today's Events */}
                                <div
                                    onClick={() => setActiveTab("events")}
                                    style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "20px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", cursor: "pointer" }}
                                >
                                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                    </div>
                                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>TODAY'S EVENTS</div>
                                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#16a34a", margin: "4px 0 2px 0" }}>{eventsList.filter(e => (e.date || "").toLowerCase().includes("today") || (e.status || "").toLowerCase().includes("in progress")).length}</div>
                                    <div style={{ fontSize: "12px", color: "#16a34a", fontWeight: "600" }}>Active today on campus</div>
                                </div>

                                {/* Pending Attendance */}
                                <div
                                    onClick={() => setActiveTab("attendance")}
                                    style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "20px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", cursor: "pointer" }}
                                >
                                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#fff7ed", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                                        </svg>
                                    </div>
                                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>PENDING ATTENDANCE</div>
                                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#ea580c", margin: "4px 0 2px 0" }}>{eventsList.filter(e => (e.status || "").toLowerCase().includes("pending")).length}</div>
                                    <div style={{ fontSize: "12px", color: "#ea580c", fontWeight: "600" }}>Requires proctor verification</div>
                                </div>

                                {/* Upcoming Interviews */}
                                <div
                                    onClick={() => setActiveTab("interviews")}
                                    style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "20px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", cursor: "pointer" }}
                                >
                                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#e0f2fe", color: "#0284c7", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        </svg>
                                    </div>
                                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>UPCOMING INTERVIEWS</div>
                                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#0284c7", margin: "4px 0 2px 0" }}>{interviewsCount}</div>
                                    <div style={{ fontSize: "12px", color: "#0284c7", fontWeight: "600" }}>Scheduled interview sessions</div>
                                </div>
                            </div>

                            {/* ⚡ QUICK ACTIONS PANEL */}
                            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                                <div style={{ marginBottom: "16px" }}>
                                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>⚡ Quick Actions</h3>
                                    <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>Operational tools for event management, attendance logging, and student notifications</p>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px" }}>
                                    <button
                                        onClick={() => {
                                            setShouldAutoOpenCreateEventModal(true);
                                            setActiveTab("events");
                                        }}
                                        style={{
                                            padding: "14px 18px",
                                            backgroundColor: "#eff6ff",
                                            color: "#2563eb",
                                            border: "1px solid #bfdbfe",
                                            borderRadius: "12px",
                                            fontSize: "13px",
                                            fontWeight: "700",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            transition: "all 0.15s ease"
                                        }}
                                    >
                                        <span style={{ fontSize: "16px" }}>➕</span>
                                        Create Event
                                    </button>

                                    <button
                                        onClick={() => setActiveTab("attendance")}
                                        style={{
                                            padding: "14px 18px",
                                            backgroundColor: "#fff7ed",
                                            color: "#ea580c",
                                            border: "1px solid #fed7aa",
                                            borderRadius: "12px",
                                            fontSize: "13px",
                                            fontWeight: "700",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            transition: "all 0.15s ease"
                                        }}
                                    >
                                        <span style={{ fontSize: "16px" }}>☑️</span>
                                        Mark Attendance
                                    </button>

                                    <button
                                        onClick={() => setActiveTab("interviews")}
                                        style={{
                                            padding: "14px 18px",
                                            backgroundColor: "#faf5ff",
                                            color: "#9333ea",
                                            border: "1px solid #e9d5ff",
                                            borderRadius: "12px",
                                            fontSize: "13px",
                                            fontWeight: "700",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            transition: "all 0.15s ease"
                                        }}
                                    >
                                        <span style={{ fontSize: "16px" }}>🗓️</span>
                                        View Interviews
                                    </button>

                                    <button
                                        onClick={() => setActiveTab("announcements")}
                                        style={{
                                            padding: "14px 18px",
                                            backgroundColor: "#f0fdf4",
                                            color: "#16a34a",
                                            border: "1px solid #bbf7d0",
                                            borderRadius: "12px",
                                            fontSize: "13px",
                                            fontWeight: "700",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            transition: "all 0.15s ease"
                                        }}
                                    >
                                        <span style={{ fontSize: "16px" }}>📢</span>
                                        Send Announcement
                                    </button>
                                </div>
                            </div>

                            {/* 📍 TODAY'S COORDINATION TABLE */}
                            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>📍 Today's Coordination</h3>
                                        <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>Live campus drives and proctoring assignments scheduled for today</p>
                                    </div>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#16a34a", backgroundColor: "#f0fdf4", padding: "4px 10px", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                                        🟢 2 Active Today
                                    </span>
                                </div>

                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", whiteSpace: "nowrap" }}>
                                        <thead>
                                            <tr style={{ borderBottom: "1px solid #eaedf0", color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
                                                <th style={{ padding: "10px 12px" }}>Event / Interview</th>
                                                <th style={{ padding: "10px 12px" }}>Time</th>
                                                <th style={{ padding: "10px 12px" }}>Location</th>
                                                <th style={{ padding: "10px 12px" }}>Assigned Responsibility</th>
                                                <th style={{ padding: "10px 12px" }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                <td style={{ padding: "12px", fontWeight: "700", color: "#0f172a", fontSize: "13px" }}>
                                                    Amazon SDE-1 Technical Assessment
                                                </td>
                                                <td style={{ padding: "12px", color: "#475569", fontSize: "13px", fontWeight: "600" }}>09:30 AM IST</td>
                                                <td style={{ padding: "12px", color: "#334155", fontSize: "13px", fontWeight: "600" }}>Lab 3 — Computer Center</td>
                                                <td style={{ padding: "12px", color: "#2563eb", fontSize: "13px", fontWeight: "700" }}>Lab Proctoring & Verification</td>
                                                <td style={{ padding: "12px" }}>
                                                    <span style={{ backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "4px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>
                                                        🔵 In Progress
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: "12px", fontWeight: "700", color: "#0f172a", fontSize: "13px" }}>
                                                    Google Cloud Engineer Briefing
                                                </td>
                                                <td style={{ padding: "12px", color: "#475569", fontSize: "13px", fontWeight: "600" }}>02:00 PM IST</td>
                                                <td style={{ padding: "12px", color: "#334155", fontSize: "13px", fontWeight: "600" }}>Auditorium Hall B</td>
                                                <td style={{ padding: "12px", color: "#2563eb", fontSize: "13px", fontWeight: "700" }}>Student Seating & Attendance</td>
                                                <td style={{ padding: "12px" }}>
                                                    <span style={{ backgroundColor: "#faf5ff", color: "#7e22ce", border: "1px solid #e9d5ff", padding: "4px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>
                                                        🟣 Upcoming
                                                    </span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* 2-COLUMN BOTTOM GRID: UPCOMING EVENTS & RECENT ACTIVITIES */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
                                {/* Left Column: Upcoming Events Summary */}
                                <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>📅 Upcoming Events</h3>
                                            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>Placement drives, PPTs, and assessments scheduled this week</p>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab("events")}
                                            style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}
                                        >
                                            View All →
                                        </button>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        {eventsList.length === 0 ? (
                                            <div style={{ textAlign: "center", padding: "24px 16px", color: "#64748b", fontSize: "13px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
                                                No upcoming events scheduled. Click <strong style={{ color: "#2563eb", cursor: "pointer" }} onClick={() => { setShouldAutoOpenCreateEventModal(true); setActiveTab("events"); }}>+ Create Event</strong> to schedule campus drives & talks.
                                            </div>
                                        ) : (
                                            eventsList.slice(0, 3).map((evt, idx) => (
                                                <div key={evt.id || idx} style={{ padding: "12px 14px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <div>
                                                        <div style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a" }}>{evt.name}</div>
                                                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{evt.date} • {evt.time} • {evt.venue}</div>
                                                        <div style={{ fontSize: "11px", color: "#2563eb", fontWeight: "700", marginTop: "3px" }}>👥 {evt.registeredStudents || 0} Candidates Registered</div>
                                                    </div>
                                                    <span style={{ backgroundColor: evt.status === "Pending Verification" ? "#fff7ed" : "#eff6ff", color: evt.status === "Pending Verification" ? "#ea580c" : "#2563eb", border: "1px solid #fed7aa", padding: "3px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "700" }}>
                                                        {evt.status}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Right Column: Recent Operational Activity */}
                                <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>🔔 Recent Activity</h3>
                                            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>Operational updates, attendance logs & communications</p>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <div style={{ padding: "10px 12px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #f1f5f9", fontSize: "12px", color: "#334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span>☑️ <strong>Attendance Log Verified</strong> for Amazon Round 1</span>
                                            <span style={{ fontSize: "10px", color: "#64748b" }}>15m ago</span>
                                        </div>
                                        <div style={{ padding: "10px 12px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #f1f5f9", fontSize: "12px", color: "#334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span>📍 <strong>Venue Lab 3 Assigned</strong> for SDE Technical Test</span>
                                            <span style={{ fontSize: "10px", color: "#64748b" }}>1h ago</span>
                                        </div>
                                        <div style={{ padding: "10px 12px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #f1f5f9", fontSize: "12px", color: "#334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span>📢 <strong>Announcement Broadcasted</strong> to 2026 CSE Batch</span>
                                            <span style={{ fontSize: "10px", color: "#64748b" }}>3h ago</span>
                                        </div>
                                        <div style={{ padding: "10px 12px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #f1f5f9", fontSize: "12px", color: "#334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span>🗓️ <strong>Interview Schedule Confirmed</strong> for Cloud Role</span>
                                            <span style={{ fontSize: "10px", color: "#64748b" }}>5h ago</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "events" && (
                        <CoordinatorEvents
                            user={user}
                            autoOpenCreateModal={shouldAutoOpenCreateEventModal}
                            onModalClose={() => setShouldAutoOpenCreateEventModal(false)}
                            onBackToDashboard={() => setActiveTab("dashboard")}
                        />
                    )}

                    {activeTab === "attendance" && (
                        <CoordinatorAttendance
                            user={user}
                            onBackToDashboard={() => setActiveTab("dashboard")}
                        />
                    )}

                    {activeTab === "interviews" && (
                        <CoordinatorInterviews
                            user={user}
                            onBackToDashboard={() => setActiveTab("dashboard")}
                        />
                    )}

                    {activeTab === "announcements" && (
                        <CoordinatorAnnouncements
                            user={user}
                            onBackToDashboard={() => setActiveTab("dashboard")}
                        />
                    )}

                    {activeTab === "students" && (
                        <CoordinatorStudents
                            user={user}
                            onBackToDashboard={() => setActiveTab("dashboard")}
                        />
                    )}

                    {activeTab !== "dashboard" && activeTab !== "events" && activeTab !== "attendance" && activeTab !== "interviews" && activeTab !== "announcements" && activeTab !== "students" && (
                        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "28px", border: "1px solid #eaedf0" }}>
                            <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                                {navItems.find(i => i.id === activeTab)?.label}
                            </h2>
                            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                                Coordinator operational view for {activeTab}. This module view will be configured in subsequent steps.
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Mobile App Bottom Navigation Bar Dock */}
            <nav className="mobile-bottom-nav">
                <button
                    onClick={() => setActiveTab("dashboard")}
                    className={`mobile-tab-item ${activeTab === "dashboard" ? "active" : ""}`}
                >
                    <div className="tab-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5M4 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4z" /></svg>
                    </div>
                    <span>Home</span>
                </button>
                <button
                    onClick={() => setActiveTab("students")}
                    className={`mobile-tab-item ${activeTab === "students" ? "active" : ""}`}
                >
                    <div className="tab-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5" /></svg>
                    </div>
                    <span>Students</span>
                </button>
                <button
                    onClick={() => setActiveTab("attendance")}
                    className={`mobile-tab-item ${activeTab === "attendance" ? "active" : ""}`}
                >
                    <div className="tab-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
                    </div>
                    <span>Attendance</span>
                </button>
                <button
                    onClick={() => setActiveTab("events")}
                    className={`mobile-tab-item ${activeTab === "events" ? "active" : ""}`}
                >
                    <div className="tab-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>
                    </div>
                    <span>Events</span>
                </button>
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="mobile-tab-item"
                >
                    <div className="tab-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                    </div>
                    <span>Menu ☰</span>
                </button>
            </nav>
        </div>
    );
};

export default CoordinatorDashboard;
