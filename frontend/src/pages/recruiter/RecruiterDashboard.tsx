import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import RecruiterCompanyProfile from "./RecruiterCompanyProfile";
import RecruiterPlacementDrives from "./RecruiterPlacementDrives";
import RecruiterCandidates from "./RecruiterCandidates";
import { getRecruiterActivities, type RecruiterActivityItem, formatRelativeTime } from "../../utils/recruiterActivityUtils";

export interface RecruiterDashboardProps {
    user?: any;
    onLogout?: () => void;
    initialTab?: string;
}

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({
    user = { name: "Arvind Kumar", email: "arvind.k@amazon.com", company: "Amazon Development Center" },
    onLogout,
    initialTab
}) => {
    const params = useParams();
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
    const isCompanyProfile = currentPath.includes("company-profile") || params?.tab === "company-profile";
    const isPlacementDrives = currentPath.includes("placement-drives") || params?.tab === "placement-drives" || params?.tab === "drives";
    const computedTab = initialTab || (isCompanyProfile ? "company_profile" : (isPlacementDrives ? "drives" : (params?.tab || "stats")));

    const userKey = user?.id || user?._id || user?.email || "recruiter";
    const [activeTab, setActiveTabState] = useState<string>(() => {
        try {
            const saved = localStorage.getItem(`cpms_active_tab_recruiter_${userKey}`);
            if (saved) return saved;
        } catch (e) {}
        return computedTab;
    });

    const setActiveTab = (tab: string) => {
        setActiveTabState(tab);
        try {
            localStorage.setItem(`cpms_active_tab_recruiter_${userKey}`, tab);
        } catch (e) {}
    };
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const [activities, setActivities] = useState<RecruiterActivityItem[]>(getRecruiterActivities);

    useEffect(() => {
        const nextTab = initialTab || (isCompanyProfile ? "company_profile" : (isPlacementDrives ? "drives" : (params?.tab || "stats")));
        if (nextTab) {
            setActiveTab(nextTab);
        }
    }, [initialTab, isCompanyProfile, isPlacementDrives, params?.tab]);

    useEffect(() => {
        const handleSync = () => {
            setActivities(getRecruiterActivities());
        };
        window.addEventListener("storage", handleSync);
        window.addEventListener("focus", handleSync);
        const interval = setInterval(handleSync, 2500);

        return () => {
            window.removeEventListener("storage", handleSync);
            window.removeEventListener("focus", handleSync);
            clearInterval(interval);
        };
    }, []);

    const recruiterName = user?.name || "Arvind Kumar";
    const companyName = user?.company || "Amazon Development Center";

    // Recruiter Navigation Sidebar Items
    const navItems = [
        {
            id: "stats",
            label: "Dashboard",
            svg: (
                <path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5M4 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4z" />
            )
        },
        {
            id: "company_profile",
            label: "Company Profile",
            svg: (
                <path d="M3 21h18M3 7v14M21 7v14M6 10h4M6 14h4M6 18h4M14 10h4M14 14h4M14 18h4M9 3h6v4H9z" />
            )
        },
        {
            id: "drives",
            label: "Placement Drives",
            svg: (
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.71 1.26-1.5 1.76-2.31M15 6l3 3M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            )
        },
        {
            id: "candidates",
            label: "Candidates",
            svg: (
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            )
        },
        {
            id: "applications",
            label: "Applications",
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
            id: "selections",
            label: "Selections",
            svg: (
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17M14 14.66V17M18 4H6v7a6 6 0 0 0 12 0V4z" />
            )
        },
    ];

    const handleTabSelect = (tabId: string) => {
        setActiveTab(tabId);
        setIsMobileMenuOpen(false);
    };

    return (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#f4f6f8", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif", width: "100%" }}>
            <style>{`
                @media (max-width: 1024px) {
                    .recruiter-sidebar-drawer {
                        position: fixed !important;
                        top: 0 !important;
                        left: ${isMobileMenuOpen ? "0" : "-260px"} !important;
                        z-index: 9999 !important;
                        transition: left 0.3s ease-in-out !important;
                        box-shadow: 4px 0 16px rgba(0,0,0,0.15) !important;
                    }
                    .recruiter-menu-backdrop {
                        display: ${isMobileMenuOpen ? "block" : "none"} !important;
                    }
                    .recruiter-hamburger-btn {
                        display: flex !important;
                    }
                }
                @media (min-width: 1025px) {
                    .recruiter-menu-backdrop {
                        display: none !important;
                    }
                    .recruiter-hamburger-btn {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Mobile Menu Backdrop */}
            <div
                className="recruiter-menu-backdrop"
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

            {/* Left Sidebar Shell */}
            <aside className="recruiter-sidebar-drawer" style={{ width: "240px", backgroundColor: "#ffffff", borderRight: "1px solid #eaedf0", display: "flex", flexDirection: "column", justifyContent: "space-between", flexShrink: 0, minHeight: "100vh", position: "sticky", top: 0, height: "100vh" }}>
                <div>
                    {/* Brand Header */}
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0f2f5", display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "36px", height: "36px", backgroundColor: "#0f172a", borderRadius: "10px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "16px" }}>
                            CP
                        </div>
                        <div>
                            <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "15px", letterSpacing: "-0.3px" }}>Placement Portal</div>
                            <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>PLACEMENT SPACE</div>
                        </div>
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
                            {recruiterName.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ overflow: "hidden" }}>
                            <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{recruiterName}</div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>Recruiter</div>
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
                            gap: "8px",
                            transition: "all 0.15s ease-in-out"
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Workspace */}
            <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowY: "auto" }}>
                {/* Top Header Bar */}
                <header style={{ height: "64px", backgroundColor: "#ffffff", borderBottom: "1px solid #eaedf0", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button
                            type="button"
                            className="recruiter-hamburger-btn"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            style={{
                                border: "1px solid #cbd5e1",
                                backgroundColor: "#f8fafc",
                                borderRadius: "8px",
                                padding: "6px 10px",
                                fontSize: "16px",
                                cursor: "pointer"
                            }}
                            title="Toggle Menu"
                        >
                            🍔
                        </button>
                        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                            Recruiter Dashboard
                        </h1>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <button
                            style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "50%",
                                backgroundColor: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                fontSize: "16px"
                            }}
                            title="Notifications"
                        >
                            🔔
                        </button>
                        <div style={{ width: "38px", height: "38px", borderRadius: "50%", backgroundColor: "#0f172a", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" }}>
                            {recruiterName.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Main Body */}
                <div style={{ padding: "24px", flex: 1 }} className="responsive-padding-mobile">
                    {activeTab === "stats" && (
                        <div>
                            {/* Hero Section (Matching Officer Dashboard Banner Height, Width & Styles) */}
                            <div
                                className="responsive-flex-wrap"
                                style={{
                                    backgroundColor: "#0f172a",
                                    color: "#ffffff",
                                    borderRadius: "16px",
                                    padding: "28px 32px",
                                    marginBottom: "28px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.15)"
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: "11px", fontWeight: "800", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                                        👋 RECRUITER SPACE
                                    </div>
                                    <h2 style={{ margin: "0 0 8px 0", fontSize: "26px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.5px", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}>
                                        Welcome, {recruiterName}
                                    </h2>
                                    <div style={{ color: "#9ca3af", fontSize: "13px", fontWeight: "500" }}>
                                        Company: <strong style={{ color: "#ffffff", fontWeight: "700" }}>{companyName} ✓</strong> | Recruitment Season: <strong style={{ color: "#ffffff" }}>2026</strong>
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
                                    gap: "10px"
                                }}>
                                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                                    Recruitment Active
                                </div>
                            </div>

                            {/* 5 Recruiter KPI Cards Grid (Matching Officer Dashboard Card Height, Width & Icon Badge Box) */}
                            <div className="responsive-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
                                <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "20px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                    </div>
                                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>ELIGIBLE CANDIDATES</div>
                                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "4px 0 2px 0" }}>2</div>
                                    <div style={{ fontSize: "12px", color: "#16a34a", fontWeight: "600" }}>Candidates matching drive</div>
                                </div>

                                <div
                                    onClick={() => setActiveTab("drives")}
                                    style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "20px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", cursor: "pointer", transition: "transform 0.15s ease" }}
                                >
                                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <line x1="9" y1="9" x2="15" y2="9" />
                                            <line x1="9" y1="13" x2="15" y2="13" />
                                        </svg>
                                    </div>
                                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>ACTIVE DRIVES</div>
                                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#2563eb", margin: "4px 0 2px 0" }}>1</div>
                                    <div style={{ fontSize: "12px", color: "#3b82f6", fontWeight: "600" }}>Currently running drives</div>
                                </div>

                                <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "20px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#f3e8ff", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M9 12l2 2 4-4" />
                                        </svg>
                                    </div>
                                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>TOTAL APPLICATIONS</div>
                                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "4px 0 2px 0" }}>1</div>
                                    <div style={{ fontSize: "12px", color: "#9333ea", fontWeight: "600" }}>Applications received</div>
                                </div>

                                <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "20px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#fff7ed", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                        </svg>
                                    </div>
                                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>SHORTLISTED</div>
                                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#ea580c", margin: "4px 0 2px 0" }}>1</div>
                                    <div style={{ fontSize: "12px", color: "#ea580c", fontWeight: "600" }}>Candidates shortlisted</div>
                                </div>

                                <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "20px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        </svg>
                                    </div>
                                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>INTERVIEWS</div>
                                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#16a34a", margin: "4px 0 2px 0" }}>1</div>
                                    <div style={{ fontSize: "12px", color: "#16a34a", fontWeight: "600" }}>Scheduled interviews</div>
                                </div>
                            </div>

                            {/* 🔔 DYNAMIC RECENT ACTIVITIES SECTION */}
                            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>Recent Activities</h3>
                                        <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: "#64748b" }}>Live status updates and drive approvals for {companyName}</p>
                                    </div>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#2563eb", backgroundColor: "#eff6ff", padding: "4px 10px", borderRadius: "12px", border: "1px solid #bfdbfe" }}>
                                        🔔 Live Activity Stream
                                    </span>
                                </div>

                                {activities.length === 0 ? (
                                    <div style={{ padding: "24px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                                        No recent activity updates yet.
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        {activities.map((act) => {
                                            const isApproved = act.type === "PLACEMENT_DRIVE_APPROVED";
                                            const isRejected = act.type === "PLACEMENT_DRIVE_REJECTED";

                                            const badgeBg = isApproved ? "#f0fdf4" : (isRejected ? "#fef2f2" : "#eff6ff");
                                            const badgeColor = isApproved ? "#16a34a" : (isRejected ? "#dc2626" : "#2563eb");
                                            const badgeBorder = isApproved ? "1px solid #bbf7d0" : (isRejected ? "1px solid #fca5a5" : "1px solid #bfdbfe");
                                            const icon = isApproved ? "🟢" : (isRejected ? "🔴" : "🔵");

                                            return (
                                                <div
                                                    key={act.id}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "flex-start",
                                                        justifyContent: "space-between",
                                                        gap: "14px",
                                                        padding: "14px 16px",
                                                        backgroundColor: "#f8fafc",
                                                        borderRadius: "12px",
                                                        border: "1px solid #f1f5f9"
                                                    }}
                                                >
                                                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                                                        <div style={{
                                                            width: "36px",
                                                            height: "36px",
                                                            borderRadius: "50%",
                                                            backgroundColor: badgeBg,
                                                            border: badgeBorder,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontSize: "16px",
                                                            flexShrink: 0
                                                        }}>
                                                            {icon}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>
                                                                {act.title}
                                                            </div>
                                                            <div style={{ fontSize: "13px", color: "#334155", marginTop: "3px", lineHeight: "1.4" }}>
                                                                {act.message}
                                                            </div>
                                                            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", marginTop: "4px" }}>
                                                                {act.company || companyName} • {formatRelativeTime(act.createdAt)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <span style={{
                                                        backgroundColor: badgeBg,
                                                        color: badgeColor,
                                                        border: badgeBorder,
                                                        padding: "3px 10px",
                                                        borderRadius: "12px",
                                                        fontSize: "11px",
                                                        fontWeight: "700",
                                                        whiteSpace: "nowrap"
                                                    }}>
                                                        {isApproved ? "Approved" : (isRejected ? "Rejected" : "Submitted")}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "company_profile" && (
                        <RecruiterCompanyProfile />
                    )}

                    {activeTab === "drives" && (
                        <RecruiterPlacementDrives user={user} />
                    )}

                    {activeTab === "candidates" && (
                        <RecruiterCandidates user={user} />
                    )}

                    {activeTab !== "stats" && activeTab !== "company_profile" && activeTab !== "drives" && activeTab !== "candidates" && (
                        <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "28px", border: "1px solid #eaedf0" }}>
                            <h2 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                                {navItems.find(i => i.id === activeTab)?.label}
                            </h2>
                            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                                Recruiter operational management view for {activeTab}.
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Mobile App Bottom Navigation Bar Dock */}
            <nav className="mobile-bottom-nav">
                <button
                    onClick={() => setActiveTab("stats")}
                    className={`mobile-tab-item ${activeTab === "stats" ? "active" : ""}`}
                >
                    <div className="tab-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5M4 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4z" /></svg>
                    </div>
                    <span>Home</span>
                </button>
                <button
                    onClick={() => setActiveTab("company_profile")}
                    className={`mobile-tab-item ${activeTab === "company_profile" ? "active" : ""}`}
                >
                    <div className="tab-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 7v14M21 7v14M6 10h4M6 14h4M6 18h4M14 10h4M14 14h4M14 18h4M9 3h6v4H9z" /></svg>
                    </div>
                    <span>Company</span>
                </button>
                <button
                    onClick={() => setActiveTab("drives")}
                    className={`mobile-tab-item ${activeTab === "drives" ? "active" : ""}`}
                >
                    <div className="tab-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                    </div>
                    <span>Drives</span>
                </button>
                <button
                    onClick={() => setActiveTab("candidates")}
                    className={`mobile-tab-item ${activeTab === "candidates" ? "active" : ""}`}
                >
                    <div className="tab-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    </div>
                    <span>Candidates</span>
                </button>
            </nav>
        </div>
    );
};

export default RecruiterDashboard;
