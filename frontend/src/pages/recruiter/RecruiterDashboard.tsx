import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import RecruiterCompanyProfile from "./RecruiterCompanyProfile";
import RecruiterPlacementDrives from "./RecruiterPlacementDrives";
import RecruiterCandidates from "./RecruiterCandidates";
import { RecruiterApplications } from "./RecruiterApplications";
import RecruiterInterviews from "./RecruiterInterviews";
import RecruiterSelections from "./RecruiterSelections";
import { getRecruiterActivities, type RecruiterActivityItem, formatRelativeTime } from "../../utils/recruiterActivityUtils";
import ClearDataButton from "../../components/ClearDataButton";

export interface RecruiterDashboardProps {
    user?: any;
    onLogout?: () => void;
    initialTab?: string;
}

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({
    user = { name: "Arya", email: "arvind.k@amazon.com", company: "Amazon Development Center" },
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

    // Top Notification Bell State
    const [showNotifications, setShowNotifications] = useState<boolean>(false);
    const [unreadCount, setUnreadCount] = useState<number>(3);

    // Formatted User Name (e.g. "Arya")
    const rawName = user?.name || "Arya";
    const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const companyName = user?.company || "Amazon Development Center";
    const companyNameShort = companyName.split(" ")[0] || "Amazon";

    // Dynamic Database Stats State
    const [dbStats, setDbStats] = useState({
        eligibleCandidates: 0,
        activeDrives: 0,
        totalApplications: 0,
        shortlisted: 0,
        interviews: 0,
        selected: 0,
        offersReleased: 0
    });

    // Upcoming Interviews State
    const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([]);

    // Fetch Dynamic Stats & Upcoming Interviews from MongoDB APIs
    const fetchDashboardStats = async () => {
        try {
            // 1. Fetch Applications for company
            const appRes = await fetch(`http://localhost:5001/api/applications?company=${encodeURIComponent(companyNameShort)}`);
            let totalApps = 0;
            let shortlistedCount = 0;
            let interviewsCount = 0;
            let selectedCount = 0;
            let offersCount = 0;
            const scheduledInterviews: any[] = [];

            if (appRes.ok) {
                const apiApps = await appRes.json();
                if (Array.isArray(apiApps)) {
                    totalApps = apiApps.length;
                    shortlistedCount = apiApps.filter((a: any) => 
                        a.status === "Shortlisted" || a.status === "Interview Scheduled" || a.status === "Selected" || a.status === "Placed"
                    ).length;
                    const withInterviews = apiApps.filter((a: any) => 
                        (a.interviewSchedule && a.interviewSchedule.date) || a.status === "Interview Scheduled"
                    );
                    interviewsCount = withInterviews.length;
                    selectedCount = apiApps.filter((a: any) => a.status === "Selected" || a.status === "Placed").length;
                    offersCount = selectedCount;

                    withInterviews.forEach((a: any) => {
                        scheduledInterviews.push({
                            id: a._id || a.id || `int_${Date.now()}`,
                            candidateName: a.studentName || a.studentEmail || "Candidate",
                            registerNo: a.registerNo || a.rollNo || "22CSR001",
                            role: a.jobRole || a.driveRole || "Software Engineer",
                            date: a.interviewSchedule?.date || "Upcoming",
                            time: a.interviewSchedule?.time || "10:00 AM IST",
                            round: a.interviewSchedule?.round || a.round || "Round 1: Technical",
                            status: "Upcoming"
                        });
                    });
                }
            }

            // Also check interviews endpoint
            try {
                const intRes = await fetch("http://localhost:5001/api/interviews");
                if (intRes.ok) {
                    const ints = await intRes.json();
                    if (Array.isArray(ints)) {
                        interviewsCount = Math.max(interviewsCount, ints.length);
                        ints.forEach((item: any) => {
                            if (!scheduledInterviews.some(si => si.candidateName === item.candidateName)) {
                                scheduledInterviews.push({
                                    id: item._id || item.id,
                                    candidateName: item.candidateName || "Candidate",
                                    registerNo: item.registerNo || "22CSR001",
                                    role: item.role || item.jobRole || "Engineer",
                                    date: item.date || "Upcoming",
                                    time: item.time || "10:00 AM IST",
                                    round: item.round || "Technical Interview",
                                    status: item.status || "Upcoming"
                                });
                            }
                        });
                    }
                }
            } catch (e) {}

            setUpcomingInterviews(scheduledInterviews);

            // 2. Fetch Placement Drives for company
            let activeDrivesCount = 0;
            try {
                const driveRes = await fetch(`http://localhost:5001/api/placement-drives?company=${encodeURIComponent(companyNameShort)}`);
                if (driveRes.ok) {
                    const apiDrives = await driveRes.json();
                    if (Array.isArray(apiDrives)) {
                        activeDrivesCount = apiDrives.filter((d: any) => d.status === "Approved" || d.status === "Active").length;
                    }
                }
            } catch (e) {
                const savedDrives = localStorage.getItem("cpms_placement_drives");
                if (savedDrives) {
                    const parsed = JSON.parse(savedDrives);
                    if (Array.isArray(parsed)) {
                        activeDrivesCount = parsed.filter((d: any) => d.status === "Approved" || d.status === "Active").length;
                    }
                }
            }

            // 3. Fetch Candidates / Students matching drive criteria
            let eligibleCount = 0;
            try {
                const studentRes = await fetch("http://localhost:5001/api/student/all");
                if (studentRes.ok) {
                    const students = await studentRes.json();
                    if (Array.isArray(students)) {
                        eligibleCount = students.filter((s: any) => (s.cgpa || 8.0) >= 7.5).length;
                    }
                }
            } catch (e) {}

            setDbStats({
                eligibleCandidates: eligibleCount,
                activeDrives: activeDrivesCount,
                totalApplications: totalApps,
                shortlisted: shortlistedCount,
                interviews: interviewsCount,
                selected: selectedCount,
                offersReleased: offersCount
            });
        } catch (err) {
            console.error("Error fetching dynamic recruiter stats:", err);
        }
    };

    useEffect(() => {
        const nextTab = initialTab || (isCompanyProfile ? "company_profile" : (isPlacementDrives ? "drives" : (params?.tab || "stats")));
        if (nextTab) {
            setActiveTab(nextTab);
        }
    }, [initialTab, isCompanyProfile, isPlacementDrives, params?.tab]);

    useEffect(() => {
        fetchDashboardStats();
        const handleSync = () => {
            setActivities(getRecruiterActivities());
            fetchDashboardStats();
        };
        window.addEventListener("storage", handleSync);
        window.addEventListener("focus", handleSync);
        window.addEventListener("cpms_applications_updated", handleSync);
        window.addEventListener("cpms_interviews_updated", handleSync);
        window.addEventListener("cpms_selections_updated", handleSync);
        const interval = setInterval(handleSync, 3000);

        return () => {
            window.removeEventListener("storage", handleSync);
            window.removeEventListener("focus", handleSync);
            window.removeEventListener("cpms_applications_updated", handleSync);
            window.removeEventListener("cpms_interviews_updated", handleSync);
            window.removeEventListener("cpms_selections_updated", handleSync);
            clearInterval(interval);
        };
    }, []);

    // Notifications List Data
    const notificationsList = [
        {
            id: "notif_1",
            title: "Placement Drive Approved",
            message: "Software Developer drive has been approved by Officer.",
            time: "10m ago",
            tabTarget: "drives",
            read: false
        },
        {
            id: "notif_2",
            title: "New Application Received",
            message: "Ashwanth S applied for Cloud Engineer placement drive.",
            time: "1h ago",
            tabTarget: "applications",
            read: false
        },
        {
            id: "notif_3",
            title: "Interview Scheduled",
            message: "Round 2 Technical Interview scheduled for Rahul Kumar.",
            time: "2h ago",
            tabTarget: "interviews",
            read: false
        }
    ];

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
        setShowNotifications(false);
    };

    return (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#f4f6f8", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif", width: "100%", maxWidth: "100vw" }}>
            <style>{`
                @media (max-width: 1024px) {
                    .recruiter-sidebar-drawer {
                        position: fixed !important;
                        left: -260px;
                        top: 0;
                        bottom: 0;
                        z-index: 9999;
                        transition: left 0.25s ease-in-out;
                    }
                    .recruiter-sidebar-drawer.open {
                        left: 0 !important;
                    }
                    .recruiter-mobile-header {
                        display: flex !important;
                    }
                    .mobile-bottom-nav {
                        display: flex !important;
                    }
                }

                @media (min-width: 1025px) {
                    .recruiter-mobile-header,
                    .mobile-bottom-nav,
                    .recruiter-menu-backdrop {
                        display: none !important;
                    }
                    .recruiter-hamburger-btn {
                        display: none !important;
                    }
                }

                @media (max-width: 768px) {
                    .recruiter-progress-label {
                        display: flex !important;
                        flex-wrap: nowrap !important;
                        min-width: 0 !important;
                    }
                }
            `}</style>

            {/* Mobile Menu Backdrop */}
            {isMobileMenuOpen && (
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
            )}

            {/* Left Sidebar Shell */}
            <aside className={`app-drawer-sidebar recruiter-sidebar-drawer ${isMobileMenuOpen ? "open" : ""}`} style={{ width: "240px", backgroundColor: "#ffffff", borderRight: "1px solid #eaedf0", display: "flex", flexDirection: "column", justifyContent: "space-between", flexShrink: 0, minHeight: "100vh", position: "sticky", top: 0, height: "100vh" }}>
                <div>
                    {/* Brand Header */}
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0f2f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "36px", height: "36px", backgroundColor: "#0f172a", borderRadius: "10px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "16px" }}>
                                CP
                            </div>
                            <div>
                                <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "15px", letterSpacing: "-0.3px" }}>Placement Portal</div>
                                <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>PLACEMENT SPACE</div>
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
                            {displayName.charAt(0)}
                        </div>
                        <div style={{ overflow: "hidden" }}>
                            <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
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
                {/* Top Desktop Bar with Notification Bell Icon & Mobile Hamburger */}
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
                            Recruiter Portal — Placement Management
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {/* 🗑️ Universal Clear System Data Button */}
                        <ClearDataButton />

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
                                    <span style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a" }}>Recruitment Notifications</span>
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#2563eb", backgroundColor: "#eff6ff", padding: "2px 8px", borderRadius: "10px" }}>3 New</span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    {notificationsList.map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => handleTabSelect(n.tabTarget)}
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
                <div className="recruiter-mobile-header" style={{ padding: "14px 20px", backgroundColor: "#ffffff", borderBottom: "1px solid #eaedf0", alignItems: "center", justifyContent: "space-between" }}>
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
                    {activeTab === "stats" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                            {/* Premium Recruiter Dark Hero Banner */}
                            <div
                                style={{
                                    backgroundColor: "#0f172a",
                                    borderRadius: "20px",
                                    padding: "28px 28px",
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
                                    <div style={{ fontSize: "11px", fontWeight: "800", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                                        👋 RECRUITER SPACE
                                    </div>
                                    <h2 style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.5px", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif", overflowWrap: "break-word" }}>
                                        Welcome back, {displayName} 👋
                                    </h2>
                                    <div style={{ color: "#9ca3af", fontSize: "13px", fontWeight: "500" }}>
                                        <strong style={{ color: "#ffffff", fontWeight: "700" }}>{companyName}</strong> · Recruitment Season <strong>2026</strong>
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
                                    Recruitment Active
                                </div>
                            </div>

                            {/* 5 Dynamic KPI Cards Grid with Trend Metrics & Click Navigation */}
                            <div className="responsive-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                                {/* Eligible Candidates */}
                                <div
                                    onClick={() => setActiveTab("candidates")}
                                    style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "20px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", cursor: "pointer", transition: "transform 0.15s ease" }}
                                >
                                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                    </div>
                                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>ELIGIBLE CANDIDATES</div>
                                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "4px 0 2px 0" }}>{dbStats.eligibleCandidates}</div>
                                    <div style={{ fontSize: "12px", color: "#16a34a", fontWeight: "600" }}>Candidates matching criteria</div>
                                    <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: "700", marginTop: "6px" }}>↑ 1 this week</div>
                                </div>

                                {/* Active Drives */}
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
                                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#2563eb", margin: "4px 0 2px 0" }}>{dbStats.activeDrives}</div>
                                    <div style={{ fontSize: "12px", color: "#3b82f6", fontWeight: "600" }}>Currently running drives</div>
                                    <div style={{ fontSize: "11px", color: "#2563eb", fontWeight: "700", marginTop: "6px" }}>↑ Active status</div>
                                </div>

                                {/* Total Applications */}
                                <div
                                    onClick={() => setActiveTab("applications")}
                                    style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "20px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", cursor: "pointer", transition: "transform 0.15s ease" }}
                                >
                                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#f3e8ff", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M9 12l2 2 4-4" />
                                        </svg>
                                    </div>
                                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>TOTAL APPLICATIONS</div>
                                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "4px 0 2px 0" }}>{dbStats.totalApplications}</div>
                                    <div style={{ fontSize: "12px", color: "#9333ea", fontWeight: "600" }}>Applications received</div>
                                    <div style={{ fontSize: "11px", color: "#9333ea", fontWeight: "700", marginTop: "6px" }}>↑ 2 this week</div>
                                </div>

                                {/* Shortlisted */}
                                <div
                                    onClick={() => setActiveTab("applications")}
                                    style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "20px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", cursor: "pointer", transition: "transform 0.15s ease" }}
                                >
                                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#fff7ed", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                        </svg>
                                    </div>
                                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>SHORTLISTED</div>
                                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#ea580c", margin: "4px 0 2px 0" }}>{dbStats.shortlisted}</div>
                                    <div style={{ fontSize: "12px", color: "#ea580c", fontWeight: "600" }}>Candidates shortlisted</div>
                                    <div style={{ fontSize: "11px", color: "#ea580c", fontWeight: "700", marginTop: "6px" }}>40% conversion</div>
                                </div>

                                {/* Scheduled Interview Rounds (Exact Wording Fix) */}
                                <div
                                    onClick={() => setActiveTab("interviews")}
                                    style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "20px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", cursor: "pointer", transition: "transform 0.15s ease" }}
                                >
                                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        </svg>
                                    </div>
                                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>INTERVIEWS</div>
                                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#16a34a", margin: "4px 0 2px 0" }}>{dbStats.interviews}</div>
                                    <div style={{ fontSize: "12px", color: "#16a34a", fontWeight: "600" }}>Scheduled interview rounds</div>
                                    <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: "700", marginTop: "6px" }}>3 upcoming</div>
                                </div>
                            </div>

                            {/* ⚡ RECRUITER QUICK ACTIONS PANEL */}
                            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                                <div style={{ marginBottom: "16px" }}>
                                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>⚡ Quick Actions</h3>
                                    <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>Perform common recruitment management tasks with one click</p>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px" }}>
                                    <button
                                        onClick={() => setActiveTab("drives")}
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
                                        Create Placement Drive
                                    </button>

                                    <button
                                        onClick={() => setActiveTab("candidates")}
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
                                        <span style={{ fontSize: "16px" }}>👥</span>
                                        View Candidates
                                    </button>

                                    <button
                                        onClick={() => setActiveTab("applications")}
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
                                        <span style={{ fontSize: "16px" }}>📄</span>
                                        View Applications
                                    </button>

                                    <button
                                        onClick={() => setActiveTab("interviews")}
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
                                        <span style={{ fontSize: "16px" }}>🗓️</span>
                                        Schedule Interview
                                    </button>
                                </div>
                            </div>

                            {/* 📅 UPCOMING INTERVIEWS TABLE SECTION */}
                            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>📅 Upcoming Interviews</h3>
                                        <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>Scheduled technical & HR interview sessions for {companyName}</p>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab("interviews")}
                                        style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
                                    >
                                        View All Interviews →
                                    </button>
                                </div>

                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", whiteSpace: "nowrap" }}>
                                        <thead>
                                            <tr style={{ borderBottom: "1px solid #eaedf0", color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
                                                <th style={{ padding: "10px 12px" }}>Candidate</th>
                                                <th style={{ padding: "10px 12px" }}>Role</th>
                                                <th style={{ padding: "10px 12px" }}>Date</th>
                                                <th style={{ padding: "10px 12px" }}>Time</th>
                                                <th style={{ padding: "10px 12px" }}>Round</th>
                                                <th style={{ padding: "10px 12px" }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {upcomingInterviews.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} style={{ padding: "36px 16px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                                                        No upcoming interviews scheduled yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                upcomingInterviews.map((item, idx) => (
                                                    <tr key={item.id} style={{ borderBottom: idx !== upcomingInterviews.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                                                        <td style={{ padding: "12px", fontWeight: "700", color: "#0f172a", fontSize: "13px" }}>
                                                            {item.candidateName} <span style={{ fontFamily: "monospace", color: "#64748b", fontWeight: "500", fontSize: "12px" }}>({item.registerNo})</span>
                                                        </td>
                                                        <td style={{ padding: "12px", color: "#334155", fontSize: "13px", fontWeight: "600" }}>{item.role}</td>
                                                        <td style={{ padding: "12px", color: "#475569", fontSize: "13px", fontWeight: "600" }}>{item.date}</td>
                                                        <td style={{ padding: "12px", color: "#475569", fontSize: "13px", fontWeight: "600" }}>{item.time}</td>
                                                        <td style={{ padding: "12px", color: "#2563eb", fontSize: "13px", fontWeight: "700" }}>{item.round}</td>
                                                        <td style={{ padding: "12px" }}>
                                                            <span style={{ backgroundColor: "#faf5ff", color: "#7e22ce", border: "1px solid #e9d5ff", padding: "4px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>
                                                                🟣 {item.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* 2-COLUMN BOTTOM GRID: RECRUITMENT PROGRESS FUNNEL & RECENT ACTIVITIES STREAM */}
                            <div className="recruiter-bottom-grid">
                                {/* Left Column: Recruitment Progress (Hiring Funnel) */}
                                <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", minWidth: 0, overflow: "hidden" }}>
                                    <div style={{ marginBottom: "18px" }}>
                                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>Recruitment Progress</h3>
                                        <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>Live hiring conversion funnel across recruitment stages</p>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", minWidth: 0, gap: "8px" }}>
                                                <span style={{ fontSize: "12px", fontWeight: "700", color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>Applications Received</span>
                                                <span style={{ fontSize: "12px", fontWeight: "700", color: "#2563eb", flexShrink: 0 }}>{dbStats.totalApplications}</span>
                                            </div>
                                            <div style={{ width: "100%", height: "8px", backgroundColor: "#eff6ff", borderRadius: "4px", overflow: "hidden" }}>
                                                <div style={{ width: "100%", height: "100%", backgroundColor: "#2563eb", borderRadius: "4px" }} />
                                            </div>
                                        </div>

                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", minWidth: 0, gap: "8px" }}>
                                                <span style={{ fontSize: "12px", fontWeight: "700", color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>Shortlisted Candidates</span>
                                                <span style={{ fontSize: "12px", fontWeight: "700", color: "#ea580c", flexShrink: 0 }}>{dbStats.shortlisted}</span>
                                            </div>
                                            <div style={{ width: "100%", height: "8px", backgroundColor: "#fff7ed", borderRadius: "4px", overflow: "hidden" }}>
                                                <div style={{ width: `${(dbStats.shortlisted / dbStats.totalApplications) * 100}%`, height: "100%", backgroundColor: "#ea580c", borderRadius: "4px" }} />
                                            </div>
                                        </div>

                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", minWidth: 0, gap: "8px" }}>
                                                <span style={{ fontSize: "12px", fontWeight: "700", color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>Interview Rounds</span>
                                                <span style={{ fontSize: "12px", fontWeight: "700", color: "#7e22ce", flexShrink: 0 }}>{dbStats.interviews}</span>
                                            </div>
                                            <div style={{ width: "100%", height: "8px", backgroundColor: "#faf5ff", borderRadius: "4px", overflow: "hidden" }}>
                                                <div style={{ width: "90%", height: "100%", backgroundColor: "#9333ea", borderRadius: "4px" }} />
                                            </div>
                                        </div>

                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", minWidth: 0, gap: "8px" }}>
                                                <span style={{ fontSize: "12px", fontWeight: "700", color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>Final Candidates Selected</span>
                                                <span style={{ fontSize: "12px", fontWeight: "700", color: "#16a34a", flexShrink: 0 }}>{dbStats.selected}</span>
                                            </div>
                                            <div style={{ width: "100%", height: "8px", backgroundColor: "#f0fdf4", borderRadius: "4px", overflow: "hidden" }}>
                                                <div style={{ width: `${(dbStats.selected / dbStats.totalApplications) * 100}%`, height: "100%", backgroundColor: "#16a34a", borderRadius: "4px" }} />
                                            </div>
                                        </div>

                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", minWidth: 0, gap: "8px" }}>
                                                <span style={{ fontSize: "12px", fontWeight: "700", color: "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>Offers Released</span>
                                                <span style={{ fontSize: "12px", fontWeight: "700", color: "#2563eb", flexShrink: 0 }}>{dbStats.offersReleased}</span>
                                            </div>
                                            <div style={{ width: "100%", height: "8px", backgroundColor: "#eff6ff", borderRadius: "4px", overflow: "hidden" }}>
                                                <div style={{ width: `${(dbStats.offersReleased / dbStats.totalApplications) * 100}%`, height: "100%", backgroundColor: "#2563eb", borderRadius: "4px" }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Recent Activities Stream */}
                                <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "24px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>Recent Activities</h3>
                                            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>Live status updates and drive approvals for {companyName}</p>
                                        </div>
                                        <button
                                            onClick={() => setActivities(getRecruiterActivities())}
                                            style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}
                                        >
                                            View All →
                                        </button>
                                    </div>

                                    {activities.length === 0 ? (
                                        <div style={{ padding: "24px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                                            No recent activity updates yet.
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                            {activities.slice(0, 4).map((act) => {
                                                let badgeBg = "#eff6ff";
                                                let badgeColor = "#2563eb";
                                                let badgeBorder = "1px solid #bfdbfe";
                                                let icon = "🔵";
                                                let badgeText = "Submitted";

                                                if (act.type === "PLACEMENT_DRIVE_APPROVED") {
                                                    badgeBg = "#f0fdf4"; badgeColor = "#16a34a"; badgeBorder = "1px solid #bbf7d0"; icon = "🟢"; badgeText = "Approved";
                                                } else if (act.type === "PLACEMENT_DRIVE_REJECTED") {
                                                    badgeBg = "#fef2f2"; badgeColor = "#dc2626"; badgeBorder = "1px solid #fca5a5"; icon = "🔴"; badgeText = "Rejected";
                                                } else if (act.type === "APPLICATION_RECEIVED") {
                                                    badgeBg = "#f0f9ff"; badgeColor = "#0284c7"; badgeBorder = "1px solid #bae6fd"; icon = "📩"; badgeText = "Application";
                                                } else if (act.type === "CANDIDATE_SHORTLISTED") {
                                                    badgeBg = "#fff7ed"; badgeColor = "#ea580c"; badgeBorder = "1px solid #fed7aa"; icon = "⭐"; badgeText = "Shortlisted";
                                                } else if (act.type === "INTERVIEW_SCHEDULED") {
                                                    badgeBg = "#faf5ff"; badgeColor = "#7e22ce"; badgeBorder = "1px solid #e9d5ff"; icon = "🗓️"; badgeText = "Scheduled";
                                                } else if (act.type === "CANDIDATE_SELECTED") {
                                                    badgeBg = "#f0fdf4"; badgeColor = "#16a34a"; badgeBorder = "1px solid #bbf7d0"; icon = "🏆"; badgeText = "Selected";
                                                }

                                                return (
                                                    <div
                                                        key={act.id}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "flex-start",
                                                            justifyContent: "space-between",
                                                            gap: "14px",
                                                            padding: "12px 14px",
                                                            backgroundColor: "#f8fafc",
                                                            borderRadius: "12px",
                                                            border: "1px solid #f1f5f9"
                                                        }}
                                                    >
                                                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                                                            <div style={{
                                                                width: "32px",
                                                                height: "32px",
                                                                borderRadius: "50%",
                                                                backgroundColor: badgeBg,
                                                                border: badgeBorder,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: "14px",
                                                                flexShrink: 0
                                                            }}>
                                                                {icon}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a" }}>
                                                                    {act.title}
                                                                </div>
                                                                <div style={{ fontSize: "12px", color: "#334155", marginTop: "2px", lineHeight: "1.3" }}>
                                                                    {act.message}
                                                                </div>
                                                                <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "600", marginTop: "3px" }}>
                                                                    {formatRelativeTime(act.createdAt)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <span style={{
                                                            backgroundColor: badgeBg,
                                                            color: badgeColor,
                                                            border: badgeBorder,
                                                            padding: "2px 8px",
                                                            borderRadius: "10px",
                                                            fontSize: "10px",
                                                            fontWeight: "700",
                                                            whiteSpace: "nowrap"
                                                        }}>
                                                            {badgeText}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
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

                    {activeTab === "applications" && (
                        <RecruiterApplications user={user} />
                    )}

                    {activeTab === "interviews" && (
                        <RecruiterInterviews user={user} />
                    )}

                    {activeTab === "selections" && (
                        <RecruiterSelections user={user} />
                    )}

                    {activeTab !== "stats" && activeTab !== "company_profile" && activeTab !== "drives" && activeTab !== "candidates" && activeTab !== "applications" && activeTab !== "interviews" && activeTab !== "selections" && (
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
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.71 1.26-1.5 1.76-2.31M15 6l3 3M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                    </div>
                    <span>Drives</span>
                </button>
                <button
                    onClick={() => setActiveTab("applications")}
                    className={`mobile-tab-item ${activeTab === "applications" ? "active" : ""}`}
                >
                    <div className="tab-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
                    </div>
                    <span>Apps</span>
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

export default RecruiterDashboard;
