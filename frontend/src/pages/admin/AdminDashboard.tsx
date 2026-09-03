import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";

interface SuperAdminDashboardProps {
    user: any;
    onLogout: () => void;
    initialTab?: string;
}

export interface CollegeRecord {
    id: string;
    name: string;
    code: string;
    email: string;
    phone: string;
    contactPerson: string;
    contactEmail: string;
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    website: string;
    establishedYear: number;
    logo?: string;
    status: "Active" | "Inactive";
    createdDate: string;
    currentPlan: "Trial" | "Basic" | "Premium" | "Pro";
    totalStudents: number;
    activeDrives: number;
    totalPlaced: number;
}

export interface UserRecord {
    id: string;
    name: string;
    email: string;
    role: "Placement Officer" | "Student" | "Recruiter" | "Coordinator";
    college: string;
    status: "Active" | "Inactive";
    createdDate: string;
}

export interface PlanRecord {
    id: string;
    name: "Trial" | "Basic" | "Premium" | "Pro";
    duration: string;
    price: number;
    suitableFor: string;
    maxStudents: number;
    maxRecruiters: number;
    maxDrives: number | "Unlimited";
    features: string[];
    status: "Active" | "Inactive";
    accentColor: string;
}

export interface SubscriptionRecord {
    id: string;
    collegeId: string;
    collegeName: string;
    planName: "Trial" | "Basic" | "Premium" | "Pro";
    startDate: string;
    expiryDate: string;
    amount: number;
    status: "Active" | "Expiring Soon" | "Expired";
    usage: {
        studentsUsed: number;
        studentsLimit: number;
        recruitersUsed: number;
        recruitersLimit: number;
        drivesUsed: number;
        drivesLimit: number | "Unlimited";
    };
}

export interface SupportTicketRecord {
    id: string;
    ticketId: string;
    collegeName: string;
    subject: string;
    priority: "Low" | "Medium" | "High";
    status: "Open" | "In Progress" | "Resolved";
    createdAt: string;
    createdBy: string;
    message: string;
    response?: string;
}

export const AdminDashboard: React.FC<SuperAdminDashboardProps> = ({ user, onLogout, initialTab = "overview" }) => {
    const [activeTab, setActiveTab] = useState<string>(initialTab);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    // 1. Colleges State (100% MongoDB)
    const [colleges, setColleges] = useState<CollegeRecord[]>([]);
    const [selectedCollegeForView, setSelectedCollegeForView] = useState<CollegeRecord | null>(null);
    const [selectedCollegeForEdit, setSelectedCollegeForEdit] = useState<CollegeRecord | null>(null);
    const [showAddCollegeModal, setShowAddCollegeModal] = useState<boolean>(false);
    const [collegeSearchQuery, setCollegeSearchQuery] = useState<string>("");
    const [collegeStatusFilter, setCollegeStatusFilter] = useState<string>("All");

    const [collegeForm, setCollegeForm] = useState<Partial<CollegeRecord>>({
        name: "",
        code: "",
        email: "",
        phone: "",
        contactPerson: "",
        contactEmail: "",
        address: "",
        city: "",
        state: "Tamil Nadu",
        country: "India",
        pincode: "",
        website: "",
        establishedYear: 2000,
        status: "Active",
        currentPlan: "Basic"
    });

    // 2. Users State (100% MongoDB)
    const [usersList, setUsersList] = useState<UserRecord[]>([]);
    const [userRoleFilter, setUserRoleFilter] = useState<string>("All");
    const [userSearchQuery, setUserSearchQuery] = useState<string>("");

    // 3. Plans State
    const [plans, setPlans] = useState<PlanRecord[]>([
        {
            id: "plan_trial",
            name: "Trial",
            duration: "14 Days",
            price: 0,
            suitableFor: "New Colleges Exploring Platform Features",
            maxStudents: 100,
            maxRecruiters: 5,
            maxDrives: 2,
            features: ["Basic Student Profiles", "Up to 2 Active Placement Drives", "Self-Service Student Verification", "Standard Email Notifications"],
            status: "Active",
            accentColor: "#64748B"
        },
        {
            id: "plan_basic",
            name: "Basic",
            duration: "3 Months",
            price: 7999,
            suitableFor: "Small Institutions & Polytechnic (< 500 Students)",
            maxStudents: 500,
            maxRecruiters: 25,
            maxDrives: 15,
            features: ["Full Student Profile Management", "15 Placement Drives per Season", "Automated Student Eligibility Checks", "Resume & Round Tracking", "Standard Accreditation Export"],
            status: "Active",
            accentColor: "#059669"
        },
        {
            id: "plan_premium",
            name: "Premium",
            duration: "6 Months",
            price: 14999,
            suitableFor: "Medium Colleges & Autonomous (< 2,000 Students)",
            maxStudents: 2000,
            maxRecruiters: 100,
            maxDrives: 50,
            features: ["Everything in Basic", "Advanced Real-time Analytics & Pipeline", "Automated Multi-Round Evaluation Matrix", "Custom Branding & Header Logo", "Priority Support & Backups"],
            status: "Active",
            accentColor: "#4F46E5"
        },
        {
            id: "plan_pro",
            name: "Pro",
            duration: "1 Year",
            price: 24999,
            suitableFor: "Large Universities & Deemed Campuses (< 5,000 Students)",
            maxStudents: 5000,
            maxRecruiters: 250,
            maxDrives: "Unlimited",
            features: ["Everything in Premium", "Unlimited Placement Drives & Recruiters", "Bulk Interview Scheduling Matrix", "Advanced NAAC / NIRF Exports", "Dedicated Account Manager"],
            status: "Active",
            accentColor: "#7C3AED"
        }
    ]);

    // 4. Subscriptions State (100% MongoDB)
    const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
    const [selectedSubForView, setSelectedSubForView] = useState<SubscriptionRecord | null>(null);

    // 5. Support Tickets State (100% MongoDB)
    const [supportTickets, setSupportTickets] = useState<SupportTicketRecord[]>([]);
    const [selectedTicketForView, setSelectedTicketForView] = useState<SupportTicketRecord | null>(null);
    const [ticketReplyText, setTicketReplyText] = useState<string>("");

    // 6. Audit Logs State (100% MongoDB)
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    // 7. System Settings State
    const [systemSettings, setSystemSettings] = useState({
        platformName: "Campus Placement SaaS Platform",
        supportEmail: "support@placementportal.io",
        maintenanceMode: false,
        allowCollegeSelfRegistration: true,
        defaultTrialDays: 14,
        enforceMultiFactorAuth: false,
        maxFileUploadMb: 15
    });

    // Fetch All Admin Data from Real Database
    const fetchAllAdminData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Colleges
            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/colleges`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.colleges)) {
                        setColleges(data.colleges.map((c: any) => ({ ...c, id: c._id || c.id })));
                    }
                }
            } catch (e) {}

            // 2. Fetch Users
            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/users`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.users)) {
                        setUsersList(data.users.map((u: any) => ({
                            id: u._id || u.id,
                            name: u.name,
                            email: u.email,
                            role: u.role === "student" ? "Student" : (u.role === "admin" ? "Placement Officer" : (u.role === "recruiter" ? "Recruiter" : "Coordinator")),
                            college: u.college || "Institution Partner",
                            status: u.status || "Active",
                            createdDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Recent"
                        })));
                    }
                }
            } catch (e) {}

            // 3. Fetch Subscriptions
            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/subscriptions`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.subscriptions)) {
                        setSubscriptions(data.subscriptions.map((s: any) => ({ ...s, id: s._id || s.id })));
                    }
                }
            } catch (e) {}

            // 4. Fetch Support Tickets
            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/support-tickets`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.tickets)) {
                        setSupportTickets(data.tickets.map((t: any) => ({ ...t, id: t._id || t.id })));
                    }
                }
            } catch (e) {}

            // 5. Fetch Audit Logs
            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/audit-logs`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.logs)) {
                        setAuditLogs(data.logs.map((l: any) => ({
                            id: l._id || l.id,
                            action: l.action,
                            details: l.details,
                            actor: l.actorName || "System Admin",
                            timestamp: l.createdAt ? new Date(l.createdAt).toLocaleString() : "Recent",
                            ip: l.ipAddress || "127.0.0.1"
                        })));
                    }
                }
            } catch (e) {}

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllAdminData();
    }, []);

    // Close Modals on Escape Key Press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setSelectedCollegeForView(null);
                setSelectedCollegeForEdit(null);
                setShowAddCollegeModal(false);
                setSelectedSubForView(null);
                setSelectedTicketForView(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleSaveCollege = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!collegeForm.name || !collegeForm.email || !collegeForm.code) {
            alert("Please fill in College Name, Code, and Official Email.");
            return;
        }

        try {
            if (selectedCollegeForEdit) {
                const res = await fetch(`${API_BASE_URL}/api/admin/colleges/${selectedCollegeForEdit.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(collegeForm),
                });
                if (res.ok) {
                    alert("College details updated successfully in database.");
                    setSelectedCollegeForEdit(null);
                    fetchAllAdminData();
                }
            } else {
                const res = await fetch(`${API_BASE_URL}/api/admin/colleges`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(collegeForm),
                });
                if (res.ok) {
                    alert(`Institution "${collegeForm.name}" onboarded into MongoDB database.`);
                    setShowAddCollegeModal(false);
                    fetchAllAdminData();
                } else {
                    const d = await res.json();
                    alert(d.message || "Failed to onboard college.");
                }
            }
        } catch (err: any) {
            alert("Error saving college: " + err.message);
        }
    };

    const handleToggleCollegeStatus = async (colId: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/colleges/${colId}/toggle-status`, {
                method: "PATCH",
            });
            if (res.ok) {
                fetchAllAdminData();
            }
        } catch (e) {}
    };

    const handleReplyTicket = async (ticketId: string) => {
        if (!ticketReplyText.trim()) {
            alert("Please enter a reply message.");
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/support-tickets/${ticketId}/reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ response: ticketReplyText }),
            });
            if (res.ok) {
                alert("Ticket resolved and reply recorded in database.");
                setSelectedTicketForView(null);
                setTicketReplyText("");
                fetchAllAdminData();
            }
        } catch (e) {}
    };

    // Filtered Collections
    const filteredColleges = colleges.filter(c => {
        const matchesStatus = collegeStatusFilter === "All" || c.status === collegeStatusFilter;
        const matchesSearch = !collegeSearchQuery ||
            c.name.toLowerCase().includes(collegeSearchQuery.toLowerCase()) ||
            c.code.toLowerCase().includes(collegeSearchQuery.toLowerCase()) ||
            c.city.toLowerCase().includes(collegeSearchQuery.toLowerCase()) ||
            c.email.toLowerCase().includes(collegeSearchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const filteredUsers = usersList.filter(u => {
        const matchesRole = userRoleFilter === "All" || u.role === userRoleFilter;
        const matchesSearch = !userSearchQuery ||
            u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
            u.college.toLowerCase().includes(userSearchQuery.toLowerCase());
        return matchesRole && matchesSearch;
    });

    // KPI Aggregations
    const totalCollegesCount = colleges.length;
    const activeCollegesCount = colleges.filter(c => c.status === "Active").length;
    const inactiveCollegesCount = totalCollegesCount - activeCollegesCount;
    const totalUsersCount = usersList.length;
    const totalActiveSubs = subscriptions.filter(s => s.status === "Active").length;
    const totalARR = subscriptions.reduce((acc, s) => acc + s.amount, 0);
    const openTicketsCount = supportTickets.filter(t => t.status === "Open").length;

    return (
        <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", backgroundColor: "#F8FAFC", fontFamily: "'Inter', -apple-system, sans-serif" }}>
            
            {/* Mobile Menu Backdrop */}
            {isMobileMenuOpen && (
                <div
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 1040 }}
                />
            )}

            {/* Left Super Admin Sidebar Matching Student Module */}
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
                    {/* Brand Logo & Title */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0 8px 24px 8px", borderBottom: "1px solid #E2E8F0", marginBottom: "20px" }}>
                        <div style={{ width: "38px", height: "38px", borderRadius: "10px", backgroundColor: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(79,70,229,0.25)" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.2px" }}>SUPER ADMIN</div>
                            <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>SaaS Platform Console</div>
                        </div>
                    </div>

                    {/* Section Header */}
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", padding: "0 10px 8px 10px", textTransform: "uppercase" }}>
                        PLATFORM GOVERNANCE
                    </div>

                    {/* Navigation Links with Professional Vector SVG Icons */}
                    <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {[
                            {
                                id: "overview",
                                label: "Dashboard",
                                svg: (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                        <polyline points="9 22 9 12 15 12 15 22" />
                                    </svg>
                                )
                            },
                            {
                                id: "colleges",
                                label: "College Management",
                                svg: (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 21h18M3 7v14M21 7v14M6 10h4M6 14h4M6 18h4M14 10h4M14 14h4M14 18h4M9 3h6v4H9z" />
                                    </svg>
                                )
                            },
                            {
                                id: "users",
                                label: "User Management",
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
                                id: "subscriptions",
                                label: "Subscription & Plans",
                                svg: (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                        <line x1="1" y1="10" x2="23" y2="10" />
                                    </svg>
                                )
                            },
                            {
                                id: "settings",
                                label: "System Settings",
                                svg: (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                    </svg>
                                )
                            },
                            {
                                id: "reports",
                                label: "System Reports",
                                svg: (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="20" x2="18" y2="10" />
                                        <line x1="12" y1="20" x2="12" y2="4" />
                                        <line x1="6" y1="20" x2="6" y2="14" />
                                    </svg>
                                )
                            },
                            {
                                id: "audit",
                                label: "Audit Logs",
                                svg: (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                        <polyline points="10 9 9 9 8 9" />
                                    </svg>
                                )
                            },
                            {
                                id: "support",
                                label: "Support / Helpdesk",
                                badge: openTicketsCount > 0 ? openTicketsCount : undefined,
                                svg: (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                                    </svg>
                                )
                            },
                        ].map((item) => {
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        border: "none",
                                        backgroundColor: isActive ? "#EEF2FF" : "transparent",
                                        color: isActive ? "#4338CA" : "#475569",
                                        fontWeight: isActive ? 700 : 500,
                                        fontSize: "13.5px",
                                        fontFamily: "'Inter', -apple-system, sans-serif",
                                        cursor: "pointer",
                                        transition: "all 0.15s ease",
                                        textAlign: "left",
                                        width: "100%",
                                        outline: "none",
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
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <span style={{ display: "flex", alignItems: "center", color: isActive ? "#4F46E5" : "#64748B" }}>
                                            {item.svg}
                                        </span>
                                        <span style={{ color: isActive ? "#4338CA" : "#475569", fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
                                    </div>
                                    {item.badge && (
                                        <span style={{ backgroundColor: "#DC2626", color: "#FFFFFF", fontSize: "10px", fontWeight: 800, padding: "2px 6px", borderRadius: "10px" }}>
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Profile & Sign Out Matching Student Module */}
                <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", backgroundColor: "#F8FAFC", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                        <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontWeight: 800, fontSize: "13px" }}>
                            SA
                        </div>
                        <div style={{ overflow: "hidden" }}>
                            <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>Super Admin</div>
                            <div style={{ fontSize: "11px", color: "#64748B", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>admin@placementportal.io</div>
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

            {/* Right Main Body Content Matching Student Module */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflowY: "auto", overflowX: "hidden", maxWidth: "100vw", boxSizing: "border-box" }}>
                
                {/* Top Header Bar */}
                <div style={{ padding: "clamp(12px, 3vw, 20px) clamp(12px, 3vw, 28px) 0 clamp(12px, 3vw, 28px)", boxSizing: "border-box", width: "100%" }}>
                    <header
                        className="officer-top-header"
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
                                style={{ display: "none", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", cursor: "pointer", fontSize: "18px", color: "#4F46E5", flexShrink: 0 }}
                                aria-label="Open Menu"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="3" y1="12" x2="21" y2="12" />
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <line x1="3" y1="18" x2="21" y2="18" />
                                </svg>
                            </button>
                            <div style={{ minWidth: 0, overflow: "hidden" }}>
                                <h1 style={{ margin: 0, fontSize: "clamp(15px, 2.5vw, 19px)", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    Super Admin Control Center
                                </h1>
                                <div className="officer-subtitle" style={{ fontSize: "11.5px", color: "#64748B", fontWeight: 500, marginTop: "2px" }}>
                                    Multi-Tenant Campus Placement SaaS Platform • Global Administration
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#DCFCE7", border: "1px solid #86EFAC", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, color: "#15803D" }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#16A34A" }}></span>
                                <span>All Systems Operational</span>
                            </div>
                        </div>
                    </header>
                </div>

                {/* Main Content Area */}
                <main style={{ flex: 1, padding: "clamp(14px, 3vw, 24px) clamp(12px, 3vw, 28px)", boxSizing: "border-box", width: "100%", maxWidth: "100%" }}>
                    
                    {/* ========================================================================= */}
                    {/* 1. DASHBOARD OVERVIEW (Platform-Level KPIs & Dual Cards) */}
                    {/* ========================================================================= */}
                    {activeTab === "overview" && (
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
                                        SaaS Platform Multi-College Management • Live Production
                                    </div>
                                    <h1 style={{ fontSize: "clamp(18px, 4vw, 23px)", fontWeight: 800, margin: "0 0 6px 0", color: "#FFFFFF", letterSpacing: "-0.3px" }}>
                                        Welcome, Super Admin!
                                    </h1>
                                    <p style={{ fontSize: "13px", color: "#C7D2FE", margin: 0, lineHeight: 1.5 }}>
                                        Managing <strong>{totalCollegesCount} registered colleges</strong> and <strong>{totalUsersCount} platform users</strong> across all active tenant institutions.
                                    </p>
                                </div>
                                <div>
                                    <button
                                        onClick={() => { setShowAddCollegeModal(true); setCollegeForm({}); }}
                                        style={{ backgroundColor: "#FFFFFF", color: "#4338CA", border: "none", borderRadius: "8px", padding: "9px 16px", fontWeight: 700, fontSize: "12.5px", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                    >
                                        + Onboard New College
                                    </button>
                                </div>
                            </div>

                            {/* Top 4 Platform-Level KPI Cards in Grid */}
                            <div className="officer-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "16px" }}>
                                {[
                                    {
                                        label: "Total Colleges",
                                        value: totalCollegesCount,
                                        sub: `${activeCollegesCount} Active • ${inactiveCollegesCount} Inactive`,
                                        color: "#4F46E5",
                                        bg: "#EEF2FF",
                                        onClick: () => setActiveTab("colleges"),
                                        svg: (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 21h18M3 7v14M21 7v14M6 10h4M6 14h4M6 18h4M14 10h4M14 14h4M14 18h4M9 3h6v4H9z" />
                                            </svg>
                                        )
                                    },
                                    {
                                        label: "Active Colleges",
                                        value: activeCollegesCount,
                                        sub: "Live tenant colleges",
                                        color: "#059669",
                                        bg: "#DCFCE7",
                                        onClick: () => { setCollegeStatusFilter("Active"); setActiveTab("colleges"); },
                                        svg: (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 14 14" />
                                            </svg>
                                        )
                                    },
                                    {
                                        label: "Total Users (Cross-College)",
                                        value: totalUsersCount,
                                        sub: "Officers, Students, Recruiters",
                                        color: "#7C3AED",
                                        bg: "#F3E8FF",
                                        onClick: () => setActiveTab("users"),
                                        svg: (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                <circle cx="9" cy="7" r="4" />
                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                            </svg>
                                        )
                                    },
                                    {
                                        label: "Subscription ARR Revenue",
                                        value: `₹${(totalARR / 1000).toFixed(1)}k`,
                                        sub: `${totalActiveSubs} Active Subscriptions`,
                                        color: "#DC2626",
                                        bg: "#FEE2E2",
                                        onClick: () => setActiveTab("subscriptions"),
                                        svg: (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                                <line x1="1" y1="10" x2="23" y2="10" />
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
                                            e.currentTarget.style.borderTop = `4px solid ${kpi.color}`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
                                            e.currentTarget.style.borderTop = `4px solid ${kpi.color}`;
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

                            {/* Dual Section Container Matching Student Module */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: "20px" }}>
                                
                                {/* LEFT CARD: Recent College Registrations */}
                                <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", fontWeight: 800, color: "#0F172A" }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M3 21h18M3 7v14M21 7v14M6 10h4M6 14h4M6 18h4M14 10h4M14 14h4M14 18h4M9 3h6v4H9z" />
                                                    </svg>
                                                    Recent College Registrations
                                                </div>
                                                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                                                    Latest client institutions onboarded
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setActiveTab("colleges")}
                                                style={{ padding: "5px 12px", backgroundColor: "#FFFFFF", color: "#334155", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                                            >
                                                View all
                                            </button>
                                        </div>
                                        <div style={{ height: "1px", backgroundColor: "#F1F5F9", marginBottom: "14px" }}></div>
                                        
                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                            {colleges.slice(0, 3).map((col, idx) => (
                                                <div key={idx} style={{ backgroundColor: "#FFFFFF", borderRadius: "10px", border: "1.5px solid #E2E8F0", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                        <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#EEF2FF", border: "1px solid #C7D2FE", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#4F46E5", fontSize: "13px" }}>
                                                            {col.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 800, fontSize: "13.5px", color: "#0F172A" }}>{col.name}</div>
                                                            <div style={{ fontSize: "11.5px", color: "#64748B" }}>{col.code} • {col.city}, {col.state}</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedCollegeForView(col)}
                                                        style={{ padding: "5px 10px", backgroundColor: "#F8FAFC", color: "#4F46E5", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                                                    >
                                                        Details →
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT CARD: Recent Platform Activity */}
                                <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", fontWeight: 800, color: "#0F172A" }}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                        <polyline points="14 2 14 8 20 8" />
                                                        <line x1="16" y1="13" x2="8" y2="13" />
                                                        <line x1="16" y1="17" x2="8" y2="17" />
                                                    </svg>
                                                    Recent Platform Activity
                                                </div>
                                                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                                                    Live cross-tenant actions & audit trail
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setActiveTab("audit")}
                                                style={{ padding: "5px 12px", backgroundColor: "#FFFFFF", color: "#334155", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                                            >
                                                View logs
                                            </button>
                                        </div>
                                        <div style={{ height: "1px", backgroundColor: "#F1F5F9", marginBottom: "14px" }}></div>

                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                            {auditLogs.slice(0, 3).map((log, idx) => (
                                                <div key={idx} style={{ backgroundColor: "#FFFFFF", borderRadius: "10px", border: "1.5px solid #E2E8F0", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: "13px", color: "#0F172A" }}>{log.action}</div>
                                                        <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                                                            {log.details}
                                                        </div>
                                                    </div>
                                                    <span style={{ fontSize: "10.5px", color: "#94A3B8", whiteSpace: "nowrap" }}>{log.timestamp}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* 2. COLLEGE MANAGEMENT MODULE */}
                    {/* ========================================================================= */}
                    {activeTab === "colleges" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                                <div>
                                    <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: 800, color: "#0F172A" }}>Institutional College Directory</h2>
                                    <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B" }}>Manage subscribed colleges, contact info, active plans, and platform data access.</p>
                                </div>
                                <button
                                    onClick={() => { setShowAddCollegeModal(true); setCollegeForm({}); }}
                                    style={{ padding: "9px 18px", backgroundColor: "#4F46E5", color: "#FFFFFF", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                                >
                                    <span>+ Add New College</span>
                                </button>
                            </div>

                            {/* Search & Filter Card */}
                            <div style={{ backgroundColor: "#FFFFFF", padding: "14px 18px", borderRadius: "12px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "260px" }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search by college name, code, city, or email..."
                                        value={collegeSearchQuery}
                                        onChange={(e) => setCollegeSearchQuery(e.target.value)}
                                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", outline: "none" }}
                                    />
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    {["All", "Active", "Inactive"].map((st) => (
                                        <button
                                            key={st}
                                            onClick={() => setCollegeStatusFilter(st)}
                                            style={{
                                                padding: "6px 14px",
                                                borderRadius: "6px",
                                                border: "1px solid",
                                                borderColor: collegeStatusFilter === st ? "#4F46E5" : "#CBD5E1",
                                                backgroundColor: collegeStatusFilter === st ? "#EEF2FF" : "#FFFFFF",
                                                color: collegeStatusFilter === st ? "#4338CA" : "#64748B",
                                                fontWeight: collegeStatusFilter === st ? 700 : 500,
                                                fontSize: "12px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Colleges Table */}
                            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569", fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>College</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Contact Info</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Location</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Plan</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Status</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredColleges.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#64748B" }}>
                                                    No colleges found matching criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredColleges.map((col) => {
                                                const isActive = col.status === "Active";
                                                return (
                                                    <tr key={col.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                                        <td style={{ padding: "14px 16px" }}>
                                                            <div style={{ fontWeight: 800, color: "#0F172A" }}>{col.name}</div>
                                                            <div style={{ fontSize: "11.5px", color: "#64748B" }}>Code: {col.code} • Est. {col.establishedYear}</div>
                                                        </td>
                                                        <td style={{ padding: "14px 16px" }}>
                                                            <div style={{ fontWeight: 600, color: "#4338CA" }}>{col.email}</div>
                                                            <div style={{ fontSize: "11px", color: "#64748B" }}>{col.phone}</div>
                                                        </td>
                                                        <td style={{ padding: "14px 16px", color: "#334155" }}>
                                                            {col.city}, {col.state}
                                                        </td>
                                                        <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                                                            <span style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", backgroundColor: col.currentPlan === "Pro" ? "#F3E8FF" : (col.currentPlan === "Premium" ? "#EEF2FF" : "#DCFCE7"), color: col.currentPlan === "Pro" ? "#7C3AED" : (col.currentPlan === "Premium" ? "#4338CA" : "#059669"), border: `1px solid ${col.currentPlan === "Pro" ? "#DDD6FE" : (col.currentPlan === "Premium" ? "#C7D2FE" : "#86EFAC")}`, padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700 }}>
                                                                {col.currentPlan}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", backgroundColor: isActive ? "#DCFCE7" : "#FEE2E2", color: isActive ? "#059669" : "#DC2626", border: `1px solid ${isActive ? "#86EFAC" : "#FCA5A5"}`, padding: "4px 10px", borderRadius: "14px", fontSize: "11px", fontWeight: 700 }}>
                                                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: isActive ? "#10B981" : "#DC2626", flexShrink: 0 }}></span>
                                                                <span>{col.status}</span>
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                                                            <div style={{ display: "inline-flex", gap: "6px" }}>
                                                                <button
                                                                    onClick={() => setSelectedCollegeForView(col)}
                                                                    title="View Details & Platform Stats"
                                                                    style={{ padding: "5px 10px", backgroundColor: "#EEF2FF", color: "#4338CA", border: "1px solid #C7D2FE", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
                                                                >
                                                                    View
                                                                </button>
                                                                <button
                                                                    onClick={() => { setSelectedCollegeForEdit(col); setCollegeForm(col); }}
                                                                    title="Edit College Information"
                                                                    style={{ padding: "5px 10px", backgroundColor: "#F8FAFC", color: "#334155", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleToggleCollegeStatus(col.id)}
                                                                    style={{ padding: "5px 10px", backgroundColor: isActive ? "#FEF2F2" : "#F0FDF4", color: isActive ? "#DC2626" : "#059669", border: `1px solid ${isActive ? "#FECACA" : "#86EFAC"}`, borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
                                                                >
                                                                    {isActive ? "Deactivate" : "Activate"}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* 3. USER MANAGEMENT MODULE */}
                    {/* ========================================================================= */}
                    {activeTab === "users" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: 800, color: "#0F172A" }}>Cross-Tenant User Governance & RBAC</h2>
                                <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B" }}>Global oversight of placement officers, student candidates, and corporate recruiters.</p>
                            </div>

                            {/* Search & Role Filter Bar */}
                            <div style={{ backgroundColor: "#FFFFFF", padding: "14px 18px", borderRadius: "12px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "260px" }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search user name, email, or affiliated college..."
                                        value={userSearchQuery}
                                        onChange={(e) => setUserSearchQuery(e.target.value)}
                                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", outline: "none" }}
                                    />
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    {["All", "Placement Officer", "Student", "Recruiter", "Coordinator"].map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setUserRoleFilter(r)}
                                            style={{
                                                padding: "6px 12px",
                                                borderRadius: "6px",
                                                border: "1px solid",
                                                borderColor: userRoleFilter === r ? "#4F46E5" : "#CBD5E1",
                                                backgroundColor: userRoleFilter === r ? "#EEF2FF" : "#FFFFFF",
                                                color: userRoleFilter === r ? "#4338CA" : "#64748B",
                                                fontWeight: userRoleFilter === r ? 700 : 500,
                                                fontSize: "12px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Users Table */}
                            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569", fontSize: "11.5px", textTransform: "uppercase" }}>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Name</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Email</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Affiliated Institution</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Role</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Status</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Registered</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#64748B" }}>
                                                    No users found matching query.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsers.map((u) => (
                                                <tr key={u.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                                    <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0F172A" }}>{u.name}</td>
                                                    <td style={{ padding: "14px 16px", color: "#4338CA", fontWeight: 600 }}>{u.email}</td>
                                                    <td style={{ padding: "14px 16px", color: "#334155" }}>{u.college}</td>
                                                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                                                        <span style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", backgroundColor: u.role === "Placement Officer" ? "#EEF2FF" : (u.role === "Recruiter" ? "#F3E8FF" : "#F1F5F9"), color: u.role === "Placement Officer" ? "#4338CA" : (u.role === "Recruiter" ? "#7C3AED" : "#334155"), border: "1px solid #CBD5E1", padding: "4px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700 }}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", backgroundColor: u.status === "Active" ? "#DCFCE7" : "#FEE2E2", color: u.status === "Active" ? "#059669" : "#DC2626", border: `1px solid ${u.status === "Active" ? "#86EFAC" : "#FCA5A5"}`, padding: "4px 10px", borderRadius: "14px", fontSize: "11px", fontWeight: 700 }}>
                                                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: u.status === "Active" ? "#10B981" : "#DC2626", flexShrink: 0 }}></span>
                                                            <span>{u.status}</span>
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "14px 16px", color: "#64748B", fontSize: "12px", whiteSpace: "nowrap" }}>{u.createdDate}</td>
                                                    <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                                                        <div style={{ display: "inline-flex", gap: "6px" }}>
                                                            <button
                                                                onClick={() => {
                                                                    const updated = usersList.map(item => item.id === u.id ? { ...item, status: item.status === "Active" ? "Inactive" : "Active" } as UserRecord : item);
                                                                    setUsersList(updated);
                                                                    localStorage.setItem("cpms_admin_users", JSON.stringify(updated));
                                                                }}
                                                                style={{ padding: "4px 8px", backgroundColor: "#F8FAFC", color: u.status === "Active" ? "#DC2626" : "#059669", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                                                            >
                                                                {u.status === "Active" ? "Deactivate" : "Activate"}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* 4. SUBSCRIPTION & PLANS MODULE */}
                    {/* ========================================================================= */}
                    {activeTab === "subscriptions" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: 800, color: "#0F172A" }}>SaaS Subscriptions & Pricing Plans</h2>
                                <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B" }}>Manage college tier packages, usage capacity limits, and billing cycles.</p>
                            </div>

                            {/* Plan Tiers Grid Matching Modern Cards */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: "16px" }}>
                                {plans.map((p) => (
                                    <div key={p.id} style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between", borderTop: `4px solid ${p.accentColor}` }}>
                                        <div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0F172A" }}>{p.name}</h3>
                                                <span style={{ fontSize: "11px", fontWeight: 700, color: p.accentColor, backgroundColor: "#F8FAFC", padding: "3px 8px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>{p.duration}</span>
                                            </div>
                                            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginTop: "12px" }}>
                                                {p.price === 0 ? "Free" : `₹${p.price.toLocaleString()}`}
                                                <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 500 }}> / season</span>
                                            </div>
                                            <p style={{ fontSize: "12px", color: "#64748B", margin: "8px 0 16px 0", lineHeight: 1.4 }}>{p.suitableFor}</p>
                                            
                                            <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569", marginBottom: "8px", textTransform: "uppercase" }}>Quota Capacity:</div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "#334155", marginBottom: "14px" }}>
                                                <div>• Max Students: <strong>{p.maxStudents.toLocaleString()}</strong></div>
                                                <div>• Max Recruiters: <strong>{p.maxRecruiters}</strong></div>
                                                <div>• Placement Drives: <strong>{p.maxDrives}</strong></div>
                                            </div>

                                            <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#475569", marginBottom: "8px", textTransform: "uppercase" }}>Included Features:</div>
                                            <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "12px", color: "#64748B", lineHeight: 1.6 }}>
                                                {p.features.map((f, i) => (
                                                    <li key={i}>{f}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Subscribed Colleges Table */}
                            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                                <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", fontWeight: 800, fontSize: "15px", color: "#0F172A" }}>
                                    Active Institutional Subscriptions & Usage
                                </div>
                                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569", fontSize: "11.5px", textTransform: "uppercase" }}>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>College</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Active Tier</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Start Date</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Expiry Date</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Amount</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Status</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subscriptions.map((sub) => (
                                            <tr key={sub.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                                <td style={{ padding: "14px 16px", fontWeight: 800, color: "#0F172A" }}>{sub.collegeName}</td>
                                                <td style={{ padding: "14px 16px" }}>
                                                    <strong style={{ color: "#4338CA" }}>{sub.planName}</strong>
                                                </td>
                                                <td style={{ padding: "14px 16px", color: "#64748B" }}>{sub.startDate}</td>
                                                <td style={{ padding: "14px 16px", color: "#64748B" }}>{sub.expiryDate}</td>
                                                <td style={{ padding: "14px 16px", fontWeight: 800, color: "#059669" }}>₹{sub.amount.toLocaleString()}</td>
                                                <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                                                    <span style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        whiteSpace: "nowrap",
                                                        backgroundColor: sub.status === "Active" ? "#DCFCE7" : (sub.status === "Expiring Soon" ? "#FEF3C7" : "#FEE2E2"),
                                                        color: sub.status === "Active" ? "#059669" : (sub.status === "Expiring Soon" ? "#D97706" : "#DC2626"),
                                                        border: `1px solid ${sub.status === "Active" ? "#86EFAC" : (sub.status === "Expiring Soon" ? "#FDE68A" : "#FCA5A5")}`,
                                                        padding: "4px 10px",
                                                        borderRadius: "14px",
                                                        fontSize: "11px",
                                                        fontWeight: 700
                                                    }}>
                                                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: sub.status === "Active" ? "#10B981" : (sub.status === "Expiring Soon" ? "#F59E0B" : "#DC2626"), flexShrink: 0 }}></span>
                                                        <span>{sub.status}</span>
                                                    </span>
                                                </td>
                                                <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                                                    <div style={{ display: "inline-flex", gap: "6px" }}>
                                                        <button
                                                            onClick={() => setSelectedSubForView(sub)}
                                                            style={{ padding: "5px 10px", backgroundColor: "#EEF2FF", color: "#4338CA", border: "1px solid #C7D2FE", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
                                                        >
                                                            View Usage
                                                        </button>
                                                        <button
                                                            onClick={() => alert(`Renewed subscription for ${sub.collegeName} for +1 year!`)}
                                                            style={{ padding: "5px 10px", backgroundColor: "#F0FDF4", color: "#059669", border: "1px solid #86EFAC", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
                                                        >
                                                            Renew
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* 5. SYSTEM SETTINGS MODULE */}
                    {/* ========================================================================= */}
                    {activeTab === "settings" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: 800, color: "#0F172A" }}>Global SaaS Platform Configuration</h2>
                                <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B" }}>Control platform policies, self-registration gates, and infrastructure settings.</p>
                            </div>

                            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0", padding: "24px" }}>
                                <form onSubmit={(e) => { e.preventDefault(); alert("System settings updated globally!"); }} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Platform Brand Name</label>
                                        <input
                                            type="text"
                                            value={systemSettings.platformName}
                                            onChange={(e) => setSystemSettings({ ...systemSettings, platformName: e.target.value })}
                                            style={{ width: "100%", padding: "10px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Global Support Email</label>
                                        <input
                                            type="email"
                                            value={systemSettings.supportEmail}
                                            onChange={(e) => setSystemSettings({ ...systemSettings, supportEmail: e.target.value })}
                                            style={{ width: "100%", padding: "10px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Default Trial Period (Days)</label>
                                        <input
                                            type="number"
                                            value={systemSettings.defaultTrialDays}
                                            onChange={(e) => setSystemSettings({ ...systemSettings, defaultTrialDays: Number(e.target.value) })}
                                            style={{ width: "100%", padding: "10px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Max Resume Upload Size (MB)</label>
                                        <input
                                            type="number"
                                            value={systemSettings.maxFileUploadMb}
                                            onChange={(e) => setSystemSettings({ ...systemSettings, maxFileUploadMb: Number(e.target.value) })}
                                            style={{ width: "100%", padding: "10px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px" }}
                                        />
                                    </div>
                                    
                                    <div style={{ gridColumn: "1 / -1", borderTop: "1px solid #E2E8F0", paddingTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                                        <button
                                            type="submit"
                                            style={{ padding: "10px 24px", backgroundColor: "#4F46E5", color: "#FFFFFF", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                                        >
                                            Save System Settings
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* 6. SYSTEM REPORTS MODULE */}
                    {/* ========================================================================= */}
                    {activeTab === "reports" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: 800, color: "#0F172A" }}>Cross-College Intelligence & Analytics</h2>
                                <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B" }}>Aggregate metrics, institutional placement growth, and corporate hiring trends.</p>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                                {[
                                    { title: "Total Students Registered", val: "3,805", sub: "+18% from last academic year", color: "#4F46E5" },
                                    { title: "Campus Placement Drives", val: "91", sub: "Across 4 partner institutions", color: "#059669" },
                                    { title: "Overall Placement Rate", val: "84.2%", sub: "2,975 Offers secured", color: "#7C3AED" },
                                    { title: "Average Package (CTC)", val: "₹7.8 LPA", sub: "Highest: ₹32.0 LPA", color: "#D97706" }
                                ].map((rep, idx) => (
                                    <div key={idx} style={{ backgroundColor: "#FFFFFF", padding: "20px", borderRadius: "12px", border: "1px solid #E2E8F0", borderTop: `4px solid ${rep.color}` }}>
                                        <div style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>{rep.title}</div>
                                        <div style={{ fontSize: "26px", fontWeight: 800, color: "#0F172A", margin: "8px 0 4px 0" }}>{rep.val}</div>
                                        <div style={{ fontSize: "12px", color: "#059669", fontWeight: 600 }}>{rep.sub}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* 7. AUDIT LOGS MODULE */}
                    {/* ========================================================================= */}
                    {activeTab === "audit" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: 800, color: "#0F172A" }}>Immutable Security & Audit Trail</h2>
                                <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B" }}>Detailed log history of administrative events, plan changes, and user permission updates.</p>
                            </div>

                            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569", fontSize: "11.5px", textTransform: "uppercase" }}>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Timestamp</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Action</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Details</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Actor</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>IP Address</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {auditLogs.map((log) => (
                                            <tr key={log.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                                <td style={{ padding: "14px 16px", color: "#64748B", fontSize: "12px", whiteSpace: "nowrap" }}>{log.timestamp}</td>
                                                <td style={{ padding: "14px 16px", fontWeight: 700, color: "#4338CA" }}>{log.action}</td>
                                                <td style={{ padding: "14px 16px", color: "#334155" }}>{log.details}</td>
                                                <td style={{ padding: "14px 16px", fontWeight: 600, color: "#0F172A" }}>{log.actor}</td>
                                                <td style={{ padding: "14px 16px", fontFamily: "monospace", color: "#64748B" }}>{log.ip}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* 8. SUPPORT / HELPDESK MODULE */}
                    {/* ========================================================================= */}
                    {activeTab === "support" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div>
                                <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: 800, color: "#0F172A" }}>Institutional Support & Helpdesk Tickets</h2>
                                <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B" }}>Respond to placement officers and college administrative inquiries.</p>
                            </div>

                            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569", fontSize: "11.5px", textTransform: "uppercase" }}>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Ticket ID</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>College</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Subject</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Requester</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Priority</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700 }}>Status</th>
                                            <th style={{ padding: "14px 16px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {supportTickets.map((tck) => (
                                            <tr key={tck.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                                <td style={{ padding: "14px 16px", fontFamily: "monospace", fontWeight: 800, color: "#4338CA" }}>{tck.ticketId}</td>
                                                <td style={{ padding: "14px 16px", fontWeight: 700, color: "#0F172A" }}>{tck.collegeName}</td>
                                                <td style={{ padding: "14px 16px", color: "#334155", maxWidth: "280px" }}>{tck.subject}</td>
                                                <td style={{ padding: "14px 16px", color: "#64748B", fontSize: "12px" }}>{tck.createdBy}</td>
                                                <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                                                    <span style={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap", backgroundColor: tck.priority === "High" ? "#FEE2E2" : (tck.priority === "Medium" ? "#FEF3C7" : "#EEF2FF"), color: tck.priority === "High" ? "#DC2626" : (tck.priority === "Medium" ? "#D97706" : "#4338CA"), padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 700 }}>
                                                        {tck.priority}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", backgroundColor: tck.status === "Resolved" ? "#DCFCE7" : (tck.status === "In Progress" ? "#FEF3C7" : "#F1F5F9"), color: tck.status === "Resolved" ? "#059669" : (tck.status === "In Progress" ? "#D97706" : "#475569"), border: `1px solid ${tck.status === "Resolved" ? "#86EFAC" : (tck.status === "In Progress" ? "#FDE68A" : "#E2E8F0")}`, padding: "4px 10px", borderRadius: "14px", fontSize: "11px", fontWeight: 700 }}>
                                                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: tck.status === "Resolved" ? "#10B981" : (tck.status === "In Progress" ? "#F59E0B" : "#64748B"), flexShrink: 0 }}></span>
                                                        <span>{tck.status}</span>
                                                    </span>
                                                </td>
                                                <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                                                    <button
                                                        onClick={() => setSelectedTicketForView(tck)}
                                                        style={{ padding: "5px 12px", backgroundColor: "#EEF2FF", color: "#4338CA", border: "1px solid #C7D2FE", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}
                                                    >
                                                        Reply →
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* ========================================================================= */}
            {/* MODAL 1: VIEW COLLEGE PROFILE & DATABASE STATS (Press ESC to Close) */}
            {/* ========================================================================= */}
            {selectedCollegeForView && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
                    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", maxWidth: "680px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #E2E8F0", paddingBottom: "16px", marginBottom: "20px" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0F172A" }}>{selectedCollegeForView.name}</h3>
                                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>Code: <strong>{selectedCollegeForView.code}</strong> • Est. {selectedCollegeForView.establishedYear}</div>
                            </div>
                            <button
                                onClick={() => setSelectedCollegeForView(null)}
                                style={{ background: "none", border: "none", fontSize: "20px", color: "#64748B", cursor: "pointer" }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "13px", color: "#334155", marginBottom: "24px" }}>
                            <div><strong>Official Email:</strong> {selectedCollegeForView.email}</div>
                            <div><strong>Phone:</strong> {selectedCollegeForView.phone}</div>
                            <div><strong>TPO Contact:</strong> {selectedCollegeForView.contactPerson}</div>
                            <div><strong>TPO Email:</strong> {selectedCollegeForView.contactEmail}</div>
                            <div><strong>Location:</strong> {selectedCollegeForView.address}, {selectedCollegeForView.city}, {selectedCollegeForView.state} - {selectedCollegeForView.pincode}</div>
                            <div><strong>Website:</strong> <a href={selectedCollegeForView.website} target="_blank" rel="noreferrer" style={{ color: "#4338CA" }}>{selectedCollegeForView.website}</a></div>
                            <div><strong>Current Plan:</strong> <span style={{ backgroundColor: "#EEF2FF", color: "#4338CA", padding: "2px 8px", borderRadius: "4px", fontWeight: 700 }}>{selectedCollegeForView.currentPlan}</span></div>
                            <div><strong>Status:</strong> <span style={{ color: selectedCollegeForView.status === "Active" ? "#059669" : "#DC2626", fontWeight: 700 }}>● {selectedCollegeForView.status}</span></div>
                        </div>

                        <div style={{ backgroundColor: "#F8FAFC", borderRadius: "12px", padding: "16px", border: "1px solid #E2E8F0", marginBottom: "20px" }}>
                            <div style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A", marginBottom: "10px" }}>Live Campus Placement Database Metrics</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", textAlign: "center" }}>
                                <div style={{ backgroundColor: "#FFFFFF", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                                    <div style={{ fontSize: "11px", color: "#64748B" }}>Total Students</div>
                                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#4F46E5", marginTop: "4px" }}>{selectedCollegeForView.totalStudents}</div>
                                </div>
                                <div style={{ backgroundColor: "#FFFFFF", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                                    <div style={{ fontSize: "11px", color: "#64748B" }}>Active Drives</div>
                                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#059669", marginTop: "4px" }}>{selectedCollegeForView.activeDrives}</div>
                                </div>
                                <div style={{ backgroundColor: "#FFFFFF", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                                    <div style={{ fontSize: "11px", color: "#64748B" }}>Placed Students</div>
                                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#7C3AED", marginTop: "4px" }}>{selectedCollegeForView.totalPlaced}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                                onClick={() => setSelectedCollegeForView(null)}
                                style={{ padding: "8px 20px", backgroundColor: "#F1F5F9", color: "#334155", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                            >
                                Close (Esc)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 2: ONBOARD / EDIT COLLEGE MODAL (Press ESC to Close) */}
            {/* ========================================================================= */}
            {(showAddCollegeModal || selectedCollegeForEdit) && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
                    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", maxWidth: "640px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "16px", marginBottom: "20px" }}>
                            <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 800, color: "#0F172A" }}>
                                {selectedCollegeForEdit ? "Edit College Information" : "Onboard New College Institution"}
                            </h3>
                            <button
                                onClick={() => { setShowAddCollegeModal(false); setSelectedCollegeForEdit(null); }}
                                style={{ background: "none", border: "none", fontSize: "20px", color: "#64748B", cursor: "pointer" }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveCollege} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>College Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={collegeForm.name || ""}
                                    onChange={(e) => setCollegeForm({ ...collegeForm, name: e.target.value })}
                                    placeholder="e.g. Kongu Engineering College"
                                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>College Code *</label>
                                <input
                                    type="text"
                                    required
                                    value={collegeForm.code || ""}
                                    onChange={(e) => setCollegeForm({ ...collegeForm, code: e.target.value })}
                                    placeholder="e.g. KEC-738"
                                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Official Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={collegeForm.email || ""}
                                    onChange={(e) => setCollegeForm({ ...collegeForm, email: e.target.value })}
                                    placeholder="e.g. placement@kongu.edu"
                                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Phone Number</label>
                                <input
                                    type="text"
                                    value={collegeForm.phone || ""}
                                    onChange={(e) => setCollegeForm({ ...collegeForm, phone: e.target.value })}
                                    placeholder="+91 98427 12345"
                                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Contact Person (TPO Name)</label>
                                <input
                                    type="text"
                                    value={collegeForm.contactPerson || ""}
                                    onChange={(e) => setCollegeForm({ ...collegeForm, contactPerson: e.target.value })}
                                    placeholder="e.g. Dr. K. Senthil Kumar"
                                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Contact Email (TPO)</label>
                                <input
                                    type="email"
                                    value={collegeForm.contactEmail || ""}
                                    onChange={(e) => setCollegeForm({ ...collegeForm, contactEmail: e.target.value })}
                                    placeholder="e.g. tpo@kongu.edu"
                                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>City</label>
                                <input
                                    type="text"
                                    value={collegeForm.city || ""}
                                    onChange={(e) => setCollegeForm({ ...collegeForm, city: e.target.value })}
                                    placeholder="e.g. Perundurai"
                                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>State</label>
                                <input
                                    type="text"
                                    value={collegeForm.state || "Tamil Nadu"}
                                    onChange={(e) => setCollegeForm({ ...collegeForm, state: e.target.value })}
                                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Established Year</label>
                                <input
                                    type="number"
                                    value={collegeForm.establishedYear || 2000}
                                    onChange={(e) => setCollegeForm({ ...collegeForm, establishedYear: Number(e.target.value) })}
                                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Assigned Subscription Plan</label>
                                <select
                                    value={collegeForm.currentPlan || "Basic"}
                                    onChange={(e: any) => setCollegeForm({ ...collegeForm, currentPlan: e.target.value })}
                                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px" }}
                                >
                                    <option value="Trial">Trial (14 Days)</option>
                                    <option value="Basic">Basic (&lt; 500 Students)</option>
                                    <option value="Premium">Premium (&lt; 2,000 Students)</option>
                                    <option value="Pro">Pro (&lt; 5,000 Students)</option>
                                </select>
                            </div>

                            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button
                                    type="button"
                                    onClick={() => { setShowAddCollegeModal(false); setSelectedCollegeForEdit(null); }}
                                    style={{ padding: "9px 18px", backgroundColor: "#F1F5F9", color: "#334155", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                                >
                                    Cancel (Esc)
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: "9px 20px", backgroundColor: "#4F46E5", color: "#FFFFFF", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                                >
                                    {selectedCollegeForEdit ? "Update College" : "Complete Onboarding"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 3: VIEW SUBSCRIPTION USAGE MATRIX */}
            {/* ========================================================================= */}
            {selectedSubForView && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
                    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", maxWidth: "560px", width: "100%", padding: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "14px", marginBottom: "18px" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0F172A" }}>{selectedSubForView.collegeName}</h3>
                                <div style={{ fontSize: "12px", color: "#64748B" }}>Plan: <strong>{selectedSubForView.planName}</strong> • Expires on {selectedSubForView.expiryDate}</div>
                            </div>
                            <button onClick={() => setSelectedSubForView(null)} style={{ background: "none", border: "none", fontSize: "20px", color: "#64748B", cursor: "pointer" }}>✕</button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", fontWeight: 700, marginBottom: "4px" }}>
                                    <span>Students Enrolled Quota</span>
                                    <span>{selectedSubForView.usage.studentsUsed} / {selectedSubForView.usage.studentsLimit}</span>
                                </div>
                                <div style={{ width: "100%", height: "8px", backgroundColor: "#E2E8F0", borderRadius: "4px", overflow: "hidden" }}>
                                    <div style={{ width: `${Math.min(100, (selectedSubForView.usage.studentsUsed / selectedSubForView.usage.studentsLimit) * 100)}%`, height: "100%", backgroundColor: "#4F46E5" }}></div>
                                </div>
                            </div>

                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", fontWeight: 700, marginBottom: "4px" }}>
                                    <span>Recruiters Connected</span>
                                    <span>{selectedSubForView.usage.recruitersUsed} / {selectedSubForView.usage.recruitersLimit}</span>
                                </div>
                                <div style={{ width: "100%", height: "8px", backgroundColor: "#E2E8F0", borderRadius: "4px", overflow: "hidden" }}>
                                    <div style={{ width: `${Math.min(100, (selectedSubForView.usage.recruitersUsed / selectedSubForView.usage.recruitersLimit) * 100)}%`, height: "100%", backgroundColor: "#059669" }}></div>
                                </div>
                            </div>

                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", fontWeight: 700, marginBottom: "4px" }}>
                                    <span>Placement Drives Conducted</span>
                                    <span>{selectedSubForView.usage.drivesUsed} / {selectedSubForView.usage.drivesLimit}</span>
                                </div>
                                <div style={{ width: "100%", height: "8px", backgroundColor: "#E2E8F0", borderRadius: "4px", overflow: "hidden" }}>
                                    <div style={{ width: "65%", height: "100%", backgroundColor: "#7C3AED" }}></div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button onClick={() => setSelectedSubForView(null)} style={{ padding: "8px 18px", backgroundColor: "#F1F5F9", color: "#334155", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                                Close (Esc)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 4: SUPPORT TICKET REPLY DRAWER */}
            {/* ========================================================================= */}
            {selectedTicketForView && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
                    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", maxWidth: "600px", width: "100%", padding: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "14px", marginBottom: "16px" }}>
                            <div>
                                <div style={{ fontSize: "11px", fontWeight: 700, color: "#4338CA" }}>{selectedTicketForView.ticketId} • {selectedTicketForView.collegeName}</div>
                                <h3 style={{ margin: "2px 0 0 0", fontSize: "17px", fontWeight: 800, color: "#0F172A" }}>{selectedTicketForView.subject}</h3>
                            </div>
                            <button onClick={() => setSelectedTicketForView(null)} style={{ background: "none", border: "none", fontSize: "20px", color: "#64748B", cursor: "pointer" }}>✕</button>
                        </div>

                        <div style={{ backgroundColor: "#F8FAFC", borderRadius: "10px", padding: "14px", border: "1px solid #E2E8F0", fontSize: "13px", color: "#334155", marginBottom: "16px", lineHeight: 1.5 }}>
                            <div style={{ fontSize: "11px", color: "#64748B", marginBottom: "4px" }}>Submitted by {selectedTicketForView.createdBy} on {selectedTicketForView.createdAt}:</div>
                            {selectedTicketForView.message}
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", fontSize: "12.5px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Official Admin Resolution / Reply</label>
                            <textarea
                                rows={4}
                                value={ticketReplyText}
                                onChange={(e) => setTicketReplyText(e.target.value)}
                                placeholder="Type support response or resolution notes here..."
                                style={{ width: "100%", padding: "10px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                            />
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button onClick={() => setSelectedTicketForView(null)} style={{ padding: "8px 18px", backgroundColor: "#F1F5F9", color: "#334155", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
                                Cancel (Esc)
                            </button>
                            <button
                                onClick={() => handleReplyTicket(selectedTicketForView.id)}
                                style={{ padding: "8px 20px", backgroundColor: "#4F46E5", color: "#FFFFFF", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                            >
                                Send Response & Resolve
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
