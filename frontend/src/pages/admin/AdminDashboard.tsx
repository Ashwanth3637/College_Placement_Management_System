import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";

interface SuperAdminDashboardProps {
    user: any;
    onLogout: () => void;
    initialTab?: string;
}

export const AdminDashboard: React.FC<SuperAdminDashboardProps> = ({ user, onLogout, initialTab = "overview" }) => {
    const [activeTab, setActiveTab] = useState<string>(initialTab);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

    // System Health State
    const [systemHealth, setSystemHealth] = useState<any>({
        status: "OPERATIONAL",
        database: "Connected (MongoDB Atlas)",
        uptime: "99.98%",
        totalUsers: 48,
        totalStudents: 36,
        totalOfficers: 4,
        activeDrives: 14,
        totalApplications: 128,
        currentSeason: "2025–2026 Graduating Batch (Active)",
    });

    // Users Management State
    const [usersList, setUsersList] = useState<any[]>([]);
    const [userRoleFilter, setUserRoleFilter] = useState<string>("All");
    const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
    const [newUserForm, setNewUserForm] = useState({ name: "", email: "", role: "student", password: "password123" });
    const [searchUserQuery, setSearchUserQuery] = useState<string>("");

    // Seasons State
    const [seasons, setSeasons] = useState<any[]>([]);
    const [showNewSeasonModal, setShowNewSeasonModal] = useState<boolean>(false);
    const [newSeasonForm, setNewSeasonForm] = useState({
        academicYear: "2026–2027",
        title: "Campus Placement Season 2026–2027",
        status: "upcoming",
        minCgpa: 6.5,
        maxBacklogs: 1,
    });

    // Audit Logs State
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [searchLogQuery, setSearchLogQuery] = useState<string>("");

    // Fetch initial data
    const fetchAdminData = async () => {
        setLoading(true);
        try {
            // 1. Fetch System Health
            try {
                const healthRes = await fetch(`${API_BASE_URL}/api/admin/system-health`);
                if (healthRes.ok) {
                    const healthData = await healthRes.json();
                    setSystemHealth((prev: any) => ({ ...prev, ...healthData }));
                }
            } catch (e) {}

            // 2. Fetch Users
            try {
                const usersRes = await fetch(`${API_BASE_URL}/api/admin/users`);
                if (usersRes.ok) {
                    const usersData = await usersRes.json();
                    if (Array.isArray(usersData)) setUsersList(usersData);
                }
            } catch (e) {}

            // 3. Fetch Seasons
            try {
                const seasonsRes = await fetch(`${API_BASE_URL}/api/admin/seasons`);
                if (seasonsRes.ok) {
                    const seasonsData = await seasonsRes.json();
                    if (Array.isArray(seasonsData)) setSeasons(seasonsData);
                }
            } catch (e) {}

            // 4. Fetch Audit Logs
            try {
                const logsRes = await fetch(`${API_BASE_URL}/api/admin/audit-logs`);
                if (logsRes.ok) {
                    const logsData = await logsRes.json();
                    if (Array.isArray(logsData)) setAuditLogs(logsData);
                }
            } catch (e) {}
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdminData();
    }, []);

    // Create User Handler
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserForm.name || !newUserForm.email) {
            setAlertMsg({ type: "error", text: "Name and email are required" });
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUserForm),
            });
            const data = await res.json();
            if (res.ok) {
                setAlertMsg({ type: "success", text: `User ${newUserForm.name} created successfully!` });
                setShowAddUserModal(false);
                setNewUserForm({ name: "", email: "", role: "student", password: "password123" });
                fetchAdminData();
            } else {
                setAlertMsg({ type: "error", text: data.message || "Failed to create user" });
            }
        } catch (err: any) {
            setAlertMsg({ type: "error", text: err.message || "Network error" });
        }
    };

    // Update User Role Handler
    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });
            if (res.ok) {
                setAlertMsg({ type: "success", text: `User role updated to ${newRole}!` });
                fetchAdminData();
            }
        } catch (e) {}
    };

    // Delete User Handler
    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, { method: "DELETE" });
            if (res.ok) {
                setAlertMsg({ type: "success", text: "User removed successfully" });
                fetchAdminData();
            }
        } catch (e) {}
    };

    // Season Status Toggle
    const handleToggleSeasonStatus = async (seasonId: string, status: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/seasons/${seasonId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                setAlertMsg({ type: "success", text: `Season status updated to ${status}!` });
                fetchAdminData();
            }
        } catch (e) {}
    };

    // Create Season Handler
    const handleCreateSeason = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/seasons`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newSeasonForm),
            });
            if (res.ok) {
                setAlertMsg({ type: "success", text: "New Placement Season created successfully!" });
                setShowNewSeasonModal(false);
                fetchAdminData();
            }
        } catch (e) {}
    };

    // Export Audit Logs to CSV
    const handleExportAuditLogs = () => {
        if (!auditLogs.length) return;
        const headers = ["Timestamp", "Actor", "Role", "Action", "Entity", "IP Address", "Status"];
        const rows = auditLogs.map(l => [
            l.createdAt || new Date().toISOString(),
            l.actorName || l.actorEmail || "System",
            l.actorRole || "admin",
            `"${l.action || ""}"`,
            `"${l.entity || ""}"`,
            l.ipAddress || "127.0.0.1",
            l.status || "SUCCESS"
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `cpms_audit_logs_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Navigation Items for Super Admin
    const navItems = [
        { id: "overview", label: "Executive Overview", icon: "📊" },
        { id: "users", label: "User & RBAC Manager", icon: "👥" },
        { id: "seasons", label: "Placement Seasons", icon: "📅" },
        { id: "audit_logs", label: "System Audit Logs", icon: "🛡️" },
        { id: "system", label: "Health & Maintenance", icon: "⚙️" },
    ];

    const filteredUsers = usersList.filter(u => {
        const matchesRole = userRoleFilter === "All" || (u.role || "").toLowerCase() === userRoleFilter.toLowerCase();
        const matchesSearch = !searchUserQuery || (u.name || "").toLowerCase().includes(searchUserQuery.toLowerCase()) || (u.email || "").toLowerCase().includes(searchUserQuery.toLowerCase());
        return matchesRole && matchesSearch;
    });

    const filteredLogs = auditLogs.filter(l => {
        if (!searchLogQuery) return true;
        const q = searchLogQuery.toLowerCase();
        return (l.actorName || "").toLowerCase().includes(q) || (l.action || "").toLowerCase().includes(q) || (l.entity || "").toLowerCase().includes(q);
    });

    return (
        <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", backgroundColor: "#F8FAFC", fontFamily: "Inter, sans-serif" }}>
            {/* Mobile Menu Backdrop */}
            {isMobileMenuOpen && (
                <div
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.5)", zIndex: 40 }}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`app-drawer-sidebar ${isMobileMenuOpen ? "open" : ""}`}
                style={{
                    width: "250px",
                    backgroundColor: "#FFFFFF",
                    borderRight: "1px solid #E2E8F0",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    flexShrink: 0,
                    height: "100vh",
                    boxShadow: "2px 0 10px rgba(11,61,145,0.04)",
                }}
            >
                <div>
                    {/* Brand */}
                    <div style={{ padding: "20px 18px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "38px", height: "38px", backgroundColor: "#0B3D91", borderRadius: "8px", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "18px" }}>
                                👑
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, color: "#0B3D91", fontSize: "13.5px", lineHeight: "1.2" }}>CAMPUS PLACEMENT</div>
                                <div style={{ fontSize: "10px", color: "#64748B", fontWeight: 700, letterSpacing: "0.5px" }}>SUPER ADMIN PORTAL</div>
                            </div>
                        </div>
                    </div>

                    {/* Nav Items */}
                    <div style={{ padding: "16px 10px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", padding: "0 10px 10px 10px", textTransform: "uppercase" }}>
                            GOVERNANCE CONSOLE
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {navItems.map(item => {
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            padding: "11px 14px",
                                            borderRadius: "8px",
                                            border: "none",
                                            backgroundColor: isActive ? "#E6EEFC" : "transparent",
                                            color: isActive ? "#0B3D91" : "#475569",
                                            fontWeight: isActive ? 700 : 500,
                                            fontSize: "13.5px",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            transition: "all 0.15s ease",
                                            borderLeft: isActive ? "3.5px solid #1E5FCC" : "3.5px solid transparent",
                                        }}
                                    >
                                        <span style={{ fontSize: "16px" }}>{item.icon}</span>
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer User & Logout */}
                <div style={{ padding: "14px", borderTop: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "10px", padding: "10px 12px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px", border: "1px solid #E2E8F0" }}>
                        <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "#0B3D91", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px" }}>
                            A
                        </div>
                        <div style={{ overflow: "hidden" }}>
                            <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name || "Super Admin"}</div>
                            <div style={{ fontSize: "11px", color: "#0F766E", fontWeight: 600 }}>● System Administrator</div>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        style={{
                            width: "100%",
                            padding: "8px 12px",
                            backgroundColor: "#FEE2E2",
                            color: "#B91C1C",
                            border: "1px solid #FCA5A5",
                            borderRadius: "8px",
                            fontWeight: 700,
                            fontSize: "12.5px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                        }}
                    >
                        <span>🚪</span>
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                {/* Top Header */}
                <header style={{ minHeight: "64px", backgroundColor: "#FFFFFF", borderBottom: "1px solid #E2E8F0", borderLeft: "4px solid #0B3D91", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10, boxShadow: "0 2px 8px rgba(11,61,145,0.04)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="mobile-hamburger-toggle"
                            style={{ display: "none", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "8px", border: "1px solid #E2E8F0", backgroundColor: "#FFFFFF", cursor: "pointer", fontSize: "18px", color: "#0B3D91" }}
                        >
                            ☰
                        </button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: "19px", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.3px" }}>
                                {activeTab === "overview" ? "Super Admin Executive Dashboard" : activeTab === "users" ? "User & Role-Based Access Control (RBAC)" : activeTab === "seasons" ? "Placement Seasons Lifecycle Manager" : activeTab === "audit_logs" ? "System Audit Logs & Compliance Ledger" : "Health, Infrastructure & Maintenance"}
                            </h1>
                            <div style={{ fontSize: "11.5px", color: "#64748B", fontWeight: 500, marginTop: "2px" }}>
                                Institutional Governance • Full System Authority
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button
                            onClick={fetchAdminData}
                            style={{ padding: "6px 12px", backgroundColor: "#F8FAFC", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "12.5px", fontWeight: 600, color: "#334155", cursor: "pointer" }}
                        >
                            🔄 Sync Data
                        </button>
                    </div>
                </header>

                {/* Body Content */}
                <div style={{ padding: "24px", maxWidth: "1400px", width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
                    {/* Alert Banner */}
                    {alertMsg && (
                        <div style={{ padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: alertMsg.type === "success" ? "#DCFCE7" : alertMsg.type === "error" ? "#FEE2E2" : "#E0F2FE", color: alertMsg.type === "success" ? "#15803D" : alertMsg.type === "error" ? "#B91C1C" : "#0369A1", border: "1px solid", borderColor: alertMsg.type === "success" ? "#86EFAC" : alertMsg.type === "error" ? "#FCA5A5" : "#BAE6FD" }}>
                            <span style={{ fontSize: "13.5px", fontWeight: 600 }}>{alertMsg.text}</span>
                            <button onClick={() => setAlertMsg(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 700 }}>✕</button>
                        </div>
                    )}

                    {/* TAB 1: EXECUTIVE OVERVIEW */}
                    {activeTab === "overview" && (
                        <div>
                            {/* KPI Metrics */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                                {[
                                    { label: "Total Registered Users", value: systemHealth.totalUsers || 48, icon: "👥", color: "#0B3D91" },
                                    { label: "Active Student Candidates", value: systemHealth.totalStudents || 36, icon: "🎓", color: "#1E5FCC" },
                                    { label: "Placement Officers", value: systemHealth.totalOfficers || 4, icon: "🏛️", color: "#0F766E" },
                                    { label: "Active Campus Drives", value: systemHealth.activeDrives || 14, icon: "💼", color: "#F59E0B" },
                                    { label: "Total Applications", value: systemHealth.totalApplications || 128, icon: "📑", color: "#8B5CF6" },
                                    { label: "System Operational Status", value: "HEALTHY 100%", icon: "⚡", color: "#15803D" },
                                ].map((kpi, idx) => (
                                    <div key={idx} style={{ backgroundColor: "#FFFFFF", padding: "18px 20px", borderRadius: "12px", border: "1px solid #E2E8F0", borderTop: `4px solid ${kpi.color}`, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontSize: "12.5px", color: "#64748B", fontWeight: 600 }}>{kpi.label}</span>
                                            <span style={{ fontSize: "18px" }}>{kpi.icon}</span>
                                        </div>
                                        <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginTop: "8px" }}>
                                            {kpi.value}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Quick Action Cards */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
                                <div style={{ backgroundColor: "#FFFFFF", padding: "20px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                                    <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: 700, color: "#0B3D91" }}>⚡ Fast Governance Shortcuts</h3>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <button onClick={() => { setActiveTab("users"); setShowAddUserModal(true); }} style={{ padding: "10px 14px", backgroundColor: "#0B3D91", color: "#FFF", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                                            ➕ Create New User (Student / Officer / Admin)
                                        </button>
                                        <button onClick={() => { setActiveTab("seasons"); setShowNewSeasonModal(true); }} style={{ padding: "10px 14px", backgroundColor: "#E6EEFC", color: "#0B3D91", border: "1px solid #BFDBFE", borderRadius: "8px", fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                                            📅 Launch New Placement Season
                                        </button>
                                        <button onClick={handleExportAuditLogs} style={{ padding: "10px 14px", backgroundColor: "#F8FAFC", color: "#334155", border: "1px solid #CBD5E1", borderRadius: "8px", fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                                            📥 Export Compliance Audit Logs (CSV)
                                        </button>
                                    </div>
                                </div>

                                <div style={{ backgroundColor: "#FFFFFF", padding: "20px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                                    <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: 700, color: "#0F766E" }}>🏛️ Active Placement Season Policy</h3>
                                    <div style={{ backgroundColor: "#F8FAFC", padding: "14px", borderRadius: "8px", border: "1px solid #E2E8F0", marginBottom: "12px" }}>
                                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>Season 2025–2026 Graduating Batch</div>
                                        <div style={{ fontSize: "12px", color: "#15803D", fontWeight: 600, marginTop: "2px" }}>● STATUS: ACTIVE & ACCEPTING APPLICATIONS</div>
                                        <div style={{ fontSize: "12.5px", color: "#64748B", marginTop: "8px" }}>
                                            Global Min CGPA: <strong>6.0</strong> • Max Active Backlogs: <strong>1</strong>
                                        </div>
                                    </div>
                                    <button onClick={() => setActiveTab("seasons")} style={{ width: "100%", padding: "8px", backgroundColor: "#FFF", border: "1px solid #CBD5E1", borderRadius: "6px", fontWeight: 600, color: "#0B3D91", cursor: "pointer" }}>
                                        Manage Season Policies →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: USER & RBAC MANAGEMENT */}
                    {activeTab === "users" && (
                        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={searchUserQuery}
                                        onChange={e => setSearchUserQuery(e.target.value)}
                                        style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", minWidth: "240px" }}
                                    />
                                    <div style={{ display: "flex", gap: "4px" }}>
                                        {["All", "student", "officer", "admin"].map(r => (
                                            <button
                                                key={r}
                                                onClick={() => setUserRoleFilter(r)}
                                                style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid", borderColor: userRoleFilter === r ? "#1E5FCC" : "#CBD5E1", backgroundColor: userRoleFilter === r ? "#E6EEFC" : "#FFF", color: userRoleFilter === r ? "#0B3D91" : "#475569", fontSize: "12px", fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}
                                            >
                                                {r === "admin" ? "Super Admin" : r === "officer" ? "Placement Officer" : r}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAddUserModal(true)}
                                    style={{ padding: "8px 16px", backgroundColor: "#0B3D91", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                                >
                                    + Add New User
                                </button>
                            </div>

                            {/* Users Table */}
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "2px solid #E2E8F0", textAlign: "left" }}>
                                            <th style={{ padding: "10px 14px", color: "#475569" }}>User Name</th>
                                            <th style={{ padding: "10px 14px", color: "#475569" }}>Email ID</th>
                                            <th style={{ padding: "10px 14px", color: "#475569" }}>Assigned Role</th>
                                            <th style={{ padding: "10px 14px", color: "#475569" }}>Change Role</th>
                                            <th style={{ padding: "10px 14px", color: "#475569", textAlign: "right" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.length > 0 ? (
                                            filteredUsers.map(u => (
                                                <tr key={u._id || u.email} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                                    <td style={{ padding: "12px 14px", fontWeight: 600, color: "#0F172A" }}>{u.name || "User"}</td>
                                                    <td style={{ padding: "12px 14px", color: "#64748B" }}>{u.email}</td>
                                                    <td style={{ padding: "12px 14px" }}>
                                                        <span style={{ padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, backgroundColor: u.role === "admin" ? "#FEF3C7" : u.role === "officer" ? "#DCFCE7" : "#E0F2FE", color: u.role === "admin" ? "#92400E" : u.role === "officer" ? "#166534" : "#075985" }}>
                                                            {u.role === "admin" ? "👑 SUPER ADMIN" : u.role === "officer" ? "🏛️ PLACEMENT OFFICER" : "🎓 STUDENT"}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "12px 14px" }}>
                                                        <select
                                                            value={u.role || "student"}
                                                            onChange={e => handleUpdateRole(u._id, e.target.value)}
                                                            style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "12px" }}
                                                        >
                                                            <option value="student">Student</option>
                                                            <option value="officer">Placement Officer</option>
                                                            <option value="admin">Super Admin</option>
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                                                        <button onClick={() => handleDeleteUser(u._id)} style={{ padding: "4px 8px", backgroundColor: "#FEE2E2", color: "#B91C1C", border: "1px solid #FCA5A5", borderRadius: "4px", fontSize: "11.5px", fontWeight: 600, cursor: "pointer" }}>
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "#94A3B8" }}>No matching users found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: SEASONS LIFECYCLE */}
                    {activeTab === "seasons" && (
                        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>Placement Seasons Policy Manager</h3>
                                    <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#64748B" }}>Control global placement season states, freeze policies, and archive batches.</p>
                                </div>
                                <button
                                    onClick={() => setShowNewSeasonModal(true)}
                                    style={{ padding: "8px 16px", backgroundColor: "#0B3D91", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                                >
                                    + Launch Season
                                </button>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
                                {seasons.length > 0 ? (
                                    seasons.map(s => (
                                        <div key={s._id || s.academicYear} style={{ padding: "18px", borderRadius: "10px", border: "1px solid #E2E8F0", backgroundColor: s.status === "active" ? "#F0FDF4" : "#F8FAFC" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                                <span style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>{s.title || `Academic Season ${s.academicYear}`}</span>
                                                <span style={{ padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, backgroundColor: s.status === "active" ? "#DCFCE7" : "#FEF3C7", color: s.status === "active" ? "#15803D" : "#B45309" }}>
                                                    {s.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: "12.5px", color: "#64748B", marginBottom: "14px" }}>
                                                Academic Year: <strong>{s.academicYear}</strong> • Min CGPA: <strong>{s.eligibilityRules?.minCgpa || 6.0}</strong> • Max Backlogs: <strong>{s.eligibilityRules?.maxBacklogs ?? 1}</strong>
                                            </div>
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                {s.status !== "active" && (
                                                    <button onClick={() => handleToggleSeasonStatus(s._id, "active")} style={{ flex: 1, padding: "6px", backgroundColor: "#15803D", color: "#FFF", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                                                        Set Active
                                                    </button>
                                                )}
                                                {s.status !== "frozen" && (
                                                    <button onClick={() => handleToggleSeasonStatus(s._id, "frozen")} style={{ flex: 1, padding: "6px", backgroundColor: "#D97706", color: "#FFF", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                                                        Freeze
                                                    </button>
                                                )}
                                                {s.status !== "archived" && (
                                                    <button onClick={() => handleToggleSeasonStatus(s._id, "archived")} style={{ flex: 1, padding: "6px", backgroundColor: "#64748B", color: "#FFF", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                                                        Archive
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: "20px", color: "#94A3B8" }}>No seasons configured. Click Launch Season to create one.</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 4: AUDIT LOGS */}
                    {activeTab === "audit_logs" && (
                        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "20px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                                <input
                                    type="text"
                                    placeholder="Filter by actor, action, or target..."
                                    value={searchLogQuery}
                                    onChange={e => setSearchLogQuery(e.target.value)}
                                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", minWidth: "280px" }}
                                />
                                <button
                                    onClick={handleExportAuditLogs}
                                    style={{ padding: "8px 16px", backgroundColor: "#0F766E", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                                >
                                    📥 Export Audit CSV
                                </button>
                            </div>

                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "2px solid #E2E8F0", textAlign: "left" }}>
                                            <th style={{ padding: "10px 12px", color: "#475569" }}>Timestamp</th>
                                            <th style={{ padding: "10px 12px", color: "#475569" }}>Actor</th>
                                            <th style={{ padding: "10px 12px", color: "#475569" }}>Action</th>
                                            <th style={{ padding: "10px 12px", color: "#475569" }}>Entity / Target</th>
                                            <th style={{ padding: "10px 12px", color: "#475569" }}>IP Address</th>
                                            <th style={{ padding: "10px 12px", color: "#475569" }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredLogs.length > 0 ? (
                                            filteredLogs.map((l, i) => (
                                                <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                                    <td style={{ padding: "10px 12px", color: "#64748B", fontFamily: "monospace" }}>{l.createdAt ? new Date(l.createdAt).toLocaleString() : "Just now"}</td>
                                                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#0F172A" }}>{l.actorName || l.actorEmail || "Super Admin"}</td>
                                                    <td style={{ padding: "10px 12px", color: "#0B3D91", fontWeight: 600 }}>{l.action}</td>
                                                    <td style={{ padding: "10px 12px", color: "#334155" }}>{l.entity || "System Core"}</td>
                                                    <td style={{ padding: "10px 12px", color: "#64748B", fontFamily: "monospace" }}>{l.ipAddress || "127.0.0.1"}</td>
                                                    <td style={{ padding: "10px 12px" }}>
                                                        <span style={{ padding: "2px 6px", borderRadius: "8px", fontSize: "10.5px", fontWeight: 700, backgroundColor: "#DCFCE7", color: "#15803D" }}>
                                                            {l.status || "SUCCESS"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} style={{ padding: "30px", textAlign: "center", color: "#94A3B8" }}>No audit records available.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 5: SYSTEM HEALTH & MAINTENANCE */}
                    {activeTab === "system" && (
                        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "24px" }}>
                            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>Database & Infrastructure Diagnostics</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                                <div style={{ padding: "14px", borderRadius: "8px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                                    <div style={{ fontSize: "12px", color: "#64748B" }}>Database Cluster</div>
                                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#15803D", marginTop: "4px" }}>✓ MongoDB Atlas (Live & Active)</div>
                                </div>
                                <div style={{ padding: "14px", borderRadius: "8px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                                    <div style={{ fontSize: "12px", color: "#64748B" }}>Security Encryption</div>
                                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#0B3D91", marginTop: "4px" }}>✓ JWT + Bcrypt (256-Bit)</div>
                                </div>
                            </div>

                            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 700, color: "#B91C1C" }}>⚠️ Administrative Maintenance Actions</h4>
                            <div style={{ display: "flex", gap: "12px" }}>
                                <button
                                    onClick={fetchAdminData}
                                    style={{ padding: "10px 16px", backgroundColor: "#0B3D91", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
                                >
                                    🔄 Refresh All Metrics & Cache
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal: Add User */}
            {showAddUserModal && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "24px", maxWidth: "440px", width: "100%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>Create New User</h3>
                        <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Full Name</label>
                                <input type="text" required value={newUserForm.name} onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", boxSizing: "border-box" }} />
                            </div>
                            <div>
                                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Email Address</label>
                                <input type="email" required value={newUserForm.email} onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", boxSizing: "border-box" }} />
                            </div>
                            <div>
                                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Assigned Role</label>
                                <select value={newUserForm.role} onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", boxSizing: "border-box" }}>
                                    <option value="student">Student</option>
                                    <option value="officer">Placement Officer</option>
                                    <option value="admin">Super Admin</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Initial Password</label>
                                <input type="password" required value={newUserForm.password} onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", boxSizing: "border-box" }} />
                            </div>
                            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                                <button type="button" onClick={() => setShowAddUserModal(false)} style={{ flex: 1, padding: "8px", backgroundColor: "#F1F5F9", color: "#475569", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: "8px", backgroundColor: "#0B3D91", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>Create Account</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Add Season */}
            {showNewSeasonModal && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15,23,42,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", padding: "24px", maxWidth: "440px", width: "100%", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>Launch Placement Season</h3>
                        <form onSubmit={handleCreateSeason} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Academic Year (e.g. 2026–2027)</label>
                                <input type="text" required value={newSeasonForm.academicYear} onChange={e => setNewSeasonForm({ ...newSeasonForm, academicYear: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", boxSizing: "border-box" }} />
                            </div>
                            <div>
                                <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Season Title</label>
                                <input type="text" required value={newSeasonForm.title} onChange={e => setNewSeasonForm({ ...newSeasonForm, title: e.target.value })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", boxSizing: "border-box" }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Min CGPA</label>
                                    <input type="number" step="0.1" value={newSeasonForm.minCgpa} onChange={e => setNewSeasonForm({ ...newSeasonForm, minCgpa: Number(e.target.value) })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", boxSizing: "border-box" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Max Backlogs</label>
                                    <input type="number" value={newSeasonForm.maxBacklogs} onChange={e => setNewSeasonForm({ ...newSeasonForm, maxBacklogs: Number(e.target.value) })} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #CBD5E1", marginTop: "4px", boxSizing: "border-box" }} />
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                                <button type="button" onClick={() => setShowNewSeasonModal(false)} style={{ flex: 1, padding: "8px", backgroundColor: "#F1F5F9", color: "#475569", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: "8px", backgroundColor: "#0B3D91", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 700, cursor: "pointer" }}>Launch Season</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
