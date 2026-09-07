import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";
import {
    CreditCard,
    Eye,
    Edit3,
    Power,
    Trash2,
    BarChart3,
    RefreshCw,
    Search,
    Plus,
    Building2,
    Users,
    BarChart2,
    LifeBuoy,
    LayoutDashboard,
    CheckCircle2,
    X,
    Copy,
    ArrowRight,
    Calendar,
    Phone,
    Mail,
    Check
} from "lucide-react";

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
    createdDate?: string;
    currentPlan: "Trial" | "Basic" | "Premium" | "Pro" | "Custom";
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
    name: "Trial" | "Basic" | "Premium" | "Pro" | "Custom";
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
    planName: "Trial" | "Basic" | "Premium" | "Pro" | "Custom";
    startDate: string;
    expiryDate: string;
    amount: number;
    status: "Active" | "Expiring Soon" | "Expired" | "Pending Verification";
    paymentMode?: "GPay" | "UPI" | "Bank Transfer" | "Cash" | "Free/Trial" | "Other";
    paymentTransactionId?: string;
    paymentDate?: string;
    paymentNotes?: string;
    activatedBy?: string;
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

export interface PlatformPaymentSettings {
    platformName: string;
    supportEmail: string;
    supportPhone: string;
    maintenanceMode: boolean;
    allowCollegeSelfRegistration: boolean;
    defaultTrialDays: number;
    maxFileUploadMb: number;
    upiId: string;
    gpayNumber: string;
    gpayName: string;
    beneficiaryName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
    qrCodeUrl?: string;
    paymentInstructions: string;
}

export const AdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onLogout, initialTab = "overview" }) => {
    const [activeTab, setActiveTab] = useState<string>(initialTab);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

    // 1. Colleges State (MongoDB)
    const [colleges, setColleges] = useState<CollegeRecord[]>([]);
    const [selectedCollegeForView, setSelectedCollegeForView] = useState<CollegeRecord | null>(null);
    const [selectedCollegeForEdit, setSelectedCollegeForEdit] = useState<CollegeRecord | null>(null);
    const [collegeToDelete, setCollegeToDelete] = useState<{ id: string; name: string } | null>(null);
    const [userToDelete, setUserToDelete] = useState<UserRecord | null>(null);
    const [showAddCollegeModal, setShowAddCollegeModal] = useState<boolean>(false);
    const [collegeSearchQuery, setCollegeSearchQuery] = useState<string>("");
    const [collegeStatusFilter, setCollegeStatusFilter] = useState<string>("All");

    const [collegeForm, setCollegeForm] = useState<any>({
        name: "",
        code: "",
        email: "",
        phone: "",
        officerName: "",
        officerEmail: "",
        officerPassword: "password123",
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

    // 2. Users State (MongoDB)
    const [usersList, setUsersList] = useState<UserRecord[]>([]);
    const [userRoleFilter, setUserRoleFilter] = useState<string>("All");
    const [userSearchQuery, setUserSearchQuery] = useState<string>("");
    const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
    const [userForm, setUserForm] = useState<any>({
        name: "",
        email: "",
        password: "password123",
        role: "officer",
        department: "Placement Cell",
        college: "Kongu Engineering College"
    });

    // 3. Plans State
    const [plans] = useState<PlanRecord[]>([
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

    // 4. Subscriptions & Plan Activation State (MongoDB)
    const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
    const [selectedSubForView, setSelectedSubForView] = useState<SubscriptionRecord | null>(null);
    const [showActivatePlanModal, setShowActivatePlanModal] = useState<boolean>(false);
    const [activationForm, setActivationForm] = useState<any>({
        collegeId: "",
        planName: "Basic",
        durationDays: 90,
        amount: 7999,
        paymentMode: "GPay",
        paymentTransactionId: "",
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentNotes: "",
        studentsLimit: 500,
        recruitersLimit: 25,
        drivesLimit: 15
    });

    // 5. Support Tickets State
    const [supportTickets, setSupportTickets] = useState<SupportTicketRecord[]>([]);
    const [selectedTicketForView, setSelectedTicketForView] = useState<SupportTicketRecord | null>(null);
    const [ticketReplyText, setTicketReplyText] = useState<string>("");

    // 6. Placement Seasons State
    const [seasons, setSeasons] = useState<any[]>([]);
    const [showAddSeasonModal, setShowAddSeasonModal] = useState<boolean>(false);
    const [seasonForm, setSeasonForm] = useState<any>({
        name: "Placement Season 2026-2027",
        code: "PS-2026-27",
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: "active"
    });

    // 7. Audit Logs State
    const [auditLogs, setAuditLogs] = useState<any[]>([]);

    // 8. Payment & Global Settings State (MongoDB)
    const [paymentSettings, setPaymentSettings] = useState<PlatformPaymentSettings>({
        platformName: "Campus Placement Management System",
        supportEmail: "support@placementportal.io",
        supportPhone: "+91 98427 12345",
        maintenanceMode: false,
        allowCollegeSelfRegistration: true,
        defaultTrialDays: 14,
        maxFileUploadMb: 15,
        upiId: "placement.billing@okaxis",
        gpayNumber: "+91 98427 55443",
        gpayName: "CPMS Placement Portal Governance",
        beneficiaryName: "Campus Placement Management Solutions",
        bankName: "HDFC Bank",
        accountNumber: "50100458921478",
        ifscCode: "HDFC0001234",
        branch: "Anna Nagar, Chennai",
        qrCodeUrl: "",
        paymentInstructions: "Make payment via Google Pay (GPay) / UPI to the above UPI ID or mobile number. Enter the UTR / Transaction ID in your subscription request for instant verification and plan activation."
    });

    const showNotification = (text: string, type: "success" | "error" | "info" = "success") => {
        setStatusMessage({ text, type });
        setTimeout(() => setStatusMessage(null), 4500);
    };

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
                            role: u.role === "student" ? "Student" : (u.role === "admin" || u.role === "officer" ? "Placement Officer" : (u.role === "recruiter" ? "Recruiter" : "Coordinator")),
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

            // 4. Fetch Payment Settings
            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/payment-settings`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.settings) {
                        setPaymentSettings(data.settings);
                    }
                }
            } catch (e) {}

            // 5. Fetch Seasons
            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/seasons`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.seasons)) {
                        setSeasons(data.seasons);
                    }
                }
            } catch (e) {}

            // 6. Fetch Support Tickets
            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/support-tickets`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.tickets)) {
                        setSupportTickets(data.tickets.map((t: any) => ({ ...t, id: t._id || t.id })));
                    }
                }
            } catch (e) {}

            // 7. Fetch Audit Logs
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
                setShowActivatePlanModal(false);
                setShowAddUserModal(false);
                setShowAddSeasonModal(false);
                setSelectedSubForView(null);
                setSelectedTicketForView(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // 1. College Handlers
    const handleSaveCollege = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!collegeForm.name || !collegeForm.email || !collegeForm.code) {
            showNotification("Please fill in College Name, Code, and Official Email.", "error");
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
                    showNotification(`College "${collegeForm.name}" updated successfully.`);
                    setSelectedCollegeForEdit(null);
                    fetchAllAdminData();
                } else {
                    const d = await res.json();
                    showNotification(d.message || "Failed to update college.", "error");
                }
            } else {
                const res = await fetch(`${API_BASE_URL}/api/admin/colleges`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(collegeForm),
                });
                const d = await res.json();
                if (res.ok) {
                    showNotification(`Institution "${collegeForm.name}" onboarded with Placement Officer credentials!`);
                    setShowAddCollegeModal(false);
                    setCollegeForm({
                        name: "",
                        code: "",
                        email: "",
                        phone: "",
                        officerName: "",
                        officerEmail: "",
                        officerPassword: "password123",
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
                    fetchAllAdminData();
                } else {
                    showNotification(d.message || "Failed to onboard college.", "error");
                }
            }
        } catch (err: any) {
            showNotification("Error saving college: " + err.message, "error");
        }
    };

    const handleToggleCollegeStatus = async (colId: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/colleges/${colId}/toggle-status`, {
                method: "PATCH",
            });
            if (res.ok) {
                showNotification("College status toggled successfully.");
                fetchAllAdminData();
            }
        } catch (e) {}
    };

    const handleDeleteCollege = async (colId: string, colName: string) => {
        setColleges(prev => prev.filter(c => c.id !== colId && (c as any)._id !== colId));
        setSubscriptions(prev => prev.filter(s => s.collegeId !== colId));
        if (selectedCollegeForView && (selectedCollegeForView.id === colId || (selectedCollegeForView as any)._id === colId)) {
            setSelectedCollegeForView(null);
        }

        try {
            const saved = localStorage.getItem("cpms_colleges");
            if (saved) {
                const arr = JSON.parse(saved);
                if (Array.isArray(arr)) {
                    localStorage.setItem("cpms_colleges", JSON.stringify(arr.filter((c: any) => c.id !== colId && c._id !== colId)));
                }
            }
        } catch (e) {}

        try {
            await fetch(`${API_BASE_URL}/api/admin/colleges/${colId}`, {
                method: "DELETE"
            });
        } catch (e: any) {}

        showNotification(`College "${colName}" removed successfully.`);
        window.dispatchEvent(new Event("storage"));
    };

    const handleDeleteUser = async (u: UserRecord) => {
        if (!u) return;
        setUsersList(prev => prev.filter(item => item.id !== u.id && (item as any)._id !== u.id));
        try {
            await fetch(`${API_BASE_URL}/api/users/${u.id}`, { method: "DELETE" });
        } catch (e) {}
        showNotification(`User "${u.name}" deleted successfully.`);
    };

    // 2. Plan Activation Handler
    const handleActivatePlanSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activationForm.collegeId) {
            showNotification("Please select a college to activate plan for.", "error");
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/subscriptions/activate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(activationForm)
            });
            const data = await res.json();
            if (res.ok) {
                showNotification(data.message || `Plan ${activationForm.planName} successfully activated!`);
                setShowActivatePlanModal(false);
                fetchAllAdminData();
            } else {
                showNotification(data.message || "Failed to activate plan.", "error");
            }
        } catch (err: any) {
            showNotification("Error activating plan: " + err.message, "error");
        }
    };

    const openActivateModalForCollege = (college: any, targetTier?: "Trial" | "Basic" | "Premium" | "Pro" | "Custom") => {
        const tier = targetTier || college.currentPlan || "Basic";
        const planDefaults: Record<string, { days: number; amount: number; students: number; recruiters: number; drives: any }> = {
            Trial: { days: 14, amount: 0, students: 100, recruiters: 5, drives: 2 },
            Basic: { days: 90, amount: 7999, students: 500, recruiters: 25, drives: 15 },
            Premium: { days: 180, amount: 14999, students: 2000, recruiters: 100, drives: 50 },
            Pro: { days: 365, amount: 24999, students: 5000, recruiters: 250, drives: "Unlimited" },
            Custom: { days: 90, amount: 9999, students: 1000, recruiters: 50, drives: 30 }
        };
        const def = planDefaults[tier] || planDefaults["Basic"];

        setActivationForm({
            collegeId: college.id || college._id || college.collegeId || "",
            planName: tier,
            durationDays: def.days,
            amount: def.amount,
            paymentMode: tier === "Trial" ? "Free/Trial" : "GPay",
            paymentTransactionId: tier === "Trial" ? "TRIAL-FREE" : `GPAY-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
            paymentDate: new Date().toISOString().slice(0, 10),
            paymentNotes: `Plan ${tier} activated for ${college.name || college.collegeName || "Institution"}`,
            studentsLimit: def.students,
            recruitersLimit: def.recruiters,
            drivesLimit: def.drives
        });
        setShowActivatePlanModal(true);
    };

    const openActivateModalForTier = (tierName: "Trial" | "Basic" | "Premium" | "Pro" | "Custom") => {
        const planDefaults: Record<string, { days: number; amount: number; students: number; recruiters: number; drives: any }> = {
            Trial: { days: 14, amount: 0, students: 100, recruiters: 5, drives: 2 },
            Basic: { days: 90, amount: 7999, students: 500, recruiters: 25, drives: 15 },
            Premium: { days: 180, amount: 14999, students: 2000, recruiters: 100, drives: 50 },
            Pro: { days: 365, amount: 24999, students: 5000, recruiters: 250, drives: "Unlimited" },
            Custom: { days: 90, amount: 9999, students: 1000, recruiters: 50, drives: 30 }
        };
        const def = planDefaults[tierName] || planDefaults["Basic"];
        const firstCollegeId = colleges.length > 0 ? colleges[0].id : "";
        const collegeName = colleges.length > 0 ? colleges[0].name : "Institution";

        setActivationForm({
            collegeId: firstCollegeId,
            planName: tierName,
            durationDays: def.days,
            amount: def.amount,
            paymentMode: tierName === "Trial" ? "Free/Trial" : "GPay",
            paymentTransactionId: tierName === "Trial" ? "TRIAL-FREE" : `GPAY-${Math.floor(100000000000 + Math.random() * 900000000000)}`,
            paymentDate: new Date().toISOString().slice(0, 10),
            paymentNotes: `${tierName} Plan selected & activated for ${collegeName}`,
            studentsLimit: def.students,
            recruitersLimit: def.recruiters,
            drivesLimit: def.drives
        });
        setShowActivatePlanModal(true);
    };

    const generateRandomTxnId = (mode: string) => {
        const prefix = mode === "GPay" ? "GPAY" : (mode === "UPI" ? "UPI" : (mode === "Bank Transfer" ? "NEFT" : "TXN"));
        const num = Math.floor(100000000000 + Math.random() * 900000000000);
        setActivationForm((prev: any) => ({
            ...prev,
            paymentTransactionId: `${prefix}-${num}`
        }));
        showNotification("Generated new Transaction UTR ID!");
    };

    // 3. Payment Settings Handler
    const handleSavePaymentSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/payment-settings`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(paymentSettings)
            });
            const d = await res.json();
            if (res.ok) {
                showNotification("Platform Payment & GPay Settings updated successfully in MongoDB!");
            } else {
                showNotification(d.message || "Failed to update payment settings.", "error");
            }
        } catch (err: any) {
            showNotification("Error saving payment settings: " + err.message, "error");
        }
    };

    // 4. User Create Handler
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userForm)
            });
            const d = await res.json();
            if (res.ok) {
                showNotification(`User "${userForm.name}" created successfully.`);
                setShowAddUserModal(false);
                setUserForm({ name: "", email: "", password: "password123", role: "officer", department: "Placement Cell", college: "Kongu Engineering College" });
                fetchAllAdminData();
            } else {
                showNotification(d.message || "Failed to create user.", "error");
            }
        } catch (err: any) {
            showNotification("Error creating user: " + err.message, "error");
        }
    };

    // 5. Support Reply Handler
    const handleReplyTicket = async (ticketId: string) => {
        if (!ticketReplyText.trim()) {
            showNotification("Please enter a reply message.", "error");
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/support-tickets/${ticketId}/reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ response: ticketReplyText }),
            });
            if (res.ok) {
                showNotification("Ticket resolved and reply sent.");
                setSelectedTicketForView(null);
                setTicketReplyText("");
                fetchAllAdminData();
            }
        } catch (e) {}
    };

    // 6. Season Create Handler
    const handleCreateSeason = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/seasons`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(seasonForm)
            });
            const d = await res.json();
            if (res.ok) {
                showNotification(`Placement Season "${seasonForm.name}" created!`);
                setShowAddSeasonModal(false);
                fetchAllAdminData();
            } else {
                showNotification(d.message || "Failed to create season.", "error");
            }
        } catch (err: any) {
            showNotification("Error: " + err.message, "error");
        }
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
    const totalARR = subscriptions.reduce((acc, s) => acc + (s.amount || 0), 0);
    const openTicketsCount = supportTickets.filter(t => t.status === "Open").length;

    const navItems = [
        {
            id: "overview",
            label: "Overview",
            badge: null,
            svg: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                </svg>
            )
        },
        {
            id: "colleges",
            label: "College Management",
            badge: totalCollegesCount,
            svg: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18M3 7v14M21 7v14M6 10h4M6 14h4M6 18h4M14 10h4M14 14h4M14 18h4M9 3h6v4H9z" />
                </svg>
            )
        },
        {
            id: "subscriptions",
            label: "Plans & Subscriptions",
            badge: totalActiveSubs,
            svg: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
            )
        },
        {
            id: "users",
            label: "User Governance",
            badge: totalUsersCount,
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
            id: "reports",
            label: "Analytics & Reports",
            badge: null,
            svg: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
            )
        },
        {
            id: "support",
            label: "Helpdesk & Support",
            badge: openTicketsCount > 0 ? `${openTicketsCount} Open` : null,
            svg: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            )
        }
    ];

    return (
        <div style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden", backgroundColor: "#F8FAFC", fontFamily: "'Inter', -apple-system, sans-serif" }}>
            
            {/* Mobile Menu Backdrop */}
            {isMobileMenuOpen && (
                <div
                    onClick={() => setIsMobileMenuOpen(false)}
                    style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 1040 }}
                />
            )}

            {/* Notification Toast */}
            {statusMessage && (
                <div style={{
                    position: "fixed",
                    top: "20px",
                    right: "20px",
                    zIndex: 9999,
                    backgroundColor: statusMessage.type === "error" ? "#FEF2F2" : (statusMessage.type === "info" ? "#EFF6FF" : "#F0FDF4"),
                    color: statusMessage.type === "error" ? "#DC2626" : (statusMessage.type === "info" ? "#1E40AF" : "#15803D"),
                    border: `1px solid ${statusMessage.type === "error" ? "#FECACA" : (statusMessage.type === "info" ? "#BFDBFE" : "#86EFAC")}`,
                    padding: "10px 18px",
                    borderRadius: "10px",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    fontSize: "13px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                }}>
                    <span>{statusMessage.text}</span>
                </div>
            )}

            {/* Left Super Admin Sidebar Drawer */}
            <aside
                className={`app-drawer-sidebar ${isMobileMenuOpen ? "open" : ""}`}
                style={{
                    width: "270px",
                    backgroundColor: "#FFFFFF",
                    borderRight: "1px solid #E2E8F0",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "20px 14px",
                    boxSizing: "border-box",
                    flexShrink: 0,
                    zIndex: 1050,
                    overflowY: "auto"
                }}
            >
                <div>
                    {/* Brand Logo & Title */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6px 18px 6px", borderBottom: "1px solid #E2E8F0", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "38px", height: "38px", borderRadius: "10px", backgroundColor: "#0B3D91", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", boxShadow: "0 4px 12px rgba(11,61,145,0.25)" }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <div>
                                <div style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.2px" }}>SUPER ADMIN</div>
                                <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600 }}>Multi-College SaaS Portal</div>
                            </div>
                        </div>

                        {/* Mobile Drawer Close Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="mobile-drawer-close"
                            style={{ background: "none", border: "none", fontSize: "18px", color: "#64748B", cursor: "pointer", padding: "4px" }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Section Header */}
                    <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", padding: "0 8px 6px 8px", textTransform: "uppercase" }}>
                        PLATFORM GOVERNANCE
                    </div>

                    {/* Navigation Links */}
                    <nav style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        {navItems.map((item) => {
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
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "10px",
                                        border: isActive ? "1px solid #BFDBFE" : "1px solid transparent",
                                        backgroundColor: isActive ? "#EFF6FF" : "transparent",
                                        color: isActive ? "#0B3D91" : "#475569",
                                        fontWeight: isActive ? 700 : 500,
                                        fontSize: "13px",
                                        cursor: "pointer",
                                        transition: "all 0.15s ease",
                                        textAlign: "left"
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) e.currentTarget.style.backgroundColor = "#F1F5F9";
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <span style={{ color: isActive ? "#0B3D91" : "#64748B", display: "flex", alignItems: "center" }}>
                                            {item.svg}
                                        </span>
                                        <span>{item.label}</span>
                                    </div>
                                    {item.badge && (
                                        <span style={{
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            padding: "2px 7px",
                                            borderRadius: "10px",
                                            backgroundColor: isActive ? "#DBEAFE" : "#E2E8F0",
                                            color: isActive ? "#1D4ED8" : "#475569"
                                        }}>
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom User Profile Card */}
                <div style={{ paddingTop: "14px", borderTop: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px", borderRadius: "10px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", marginBottom: "10px" }}>
                        <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "#0B3D91", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "13px", flexShrink: 0 }}>
                            SA
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>Super Admin</div>
                            <div style={{ fontSize: "11px", color: "#059669", fontWeight: 600 }}>● Root Authority</div>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        style={{
                            width: "100%",
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
                
                {/* Top Header Bar */}
                <div style={{ padding: "clamp(10px, 2.5vw, 18px) clamp(12px, 3vw, 24px) 0 clamp(12px, 3vw, 24px)", boxSizing: "border-box", width: "100%" }}>
                    <header
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            backgroundColor: "#FFFFFF",
                            padding: "12px 18px",
                            borderRadius: "12px",
                            border: "1px solid #E2E8F0",
                            borderLeft: "4px solid #0B3D91",
                            gap: "10px",
                            boxShadow: "0 2px 6px rgba(11,61,145,0.03)",
                            boxSizing: "border-box",
                            width: "100%"
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="mobile-hamburger-toggle"
                                style={{ display: "none", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", cursor: "pointer", fontSize: "18px", color: "#0B3D91", flexShrink: 0 }}
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
                                <div style={{ fontSize: "11.5px", color: "#64748B", fontWeight: 500, marginTop: "2px" }}>
                                    Institutional Governance • Plan Activation • GPay Billing
                                </div>
                            </div>
                        </div>
                    </header>
                </div>

                {/* Main Content Area */}
                <main style={{ flex: 1, padding: "clamp(12px, 2.5vw, 20px) clamp(12px, 3vw, 24px)", boxSizing: "border-box", width: "100%", maxWidth: "100%" }}>
                    
                    {/* ========================================================================= */}
                    {/* 1. DASHBOARD OVERVIEW */}
                    {/* ========================================================================= */}
                    {activeTab === "overview" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                            {/* Executive Welcome Hero Banner */}
                            <div style={{
                                background: "linear-gradient(135deg, #07255A 0%, #0B3D91 50%, #1E5FCC 100%)",
                                borderRadius: "16px",
                                padding: "22px 24px",
                                color: "#ffffff",
                                boxShadow: "0 10px 25px -5px rgba(11, 61, 145, 0.25)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: "14px"
                            }}>
                                <div>
                                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: "16px", fontSize: "11.5px", fontWeight: 700, color: "#E0F2FE", marginBottom: "8px" }}>
                                        <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#38BDF8" }}></span>
                                        SaaS Platform Multi-College Management • Live Database
                                    </div>
                                    <h2 style={{ fontSize: "clamp(18px, 3.5vw, 22px)", fontWeight: 800, margin: "0 0 6px 0", color: "#FFFFFF", letterSpacing: "-0.3px" }}>
                                        Welcome, Super Admin!
                                    </h2>
                                    <p style={{ fontSize: "13px", color: "#BFDBFE", margin: 0, lineHeight: 1.5 }}>
                                        Overseeing <strong>{totalCollegesCount} partner institutions</strong>, <strong>{totalUsersCount} cross-tenant users</strong>, and <strong>{totalActiveSubs} active plan subscriptions</strong>.
                                    </p>
                                </div>
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    <button
                                        onClick={() => { setShowAddCollegeModal(true); setCollegeForm({ name: "", code: "", email: "", phone: "", officerName: "", officerEmail: "", officerPassword: "password123", status: "Active", currentPlan: "Basic" }); }}
                                        style={{ backgroundColor: "#FFFFFF", color: "#0B3D91", border: "none", borderRadius: "8px", padding: "9px 16px", fontWeight: 700, fontSize: "12.5px", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", display: "inline-flex", alignItems: "center", gap: "5px" }}
                                    >
                                        <span>+ Add College</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (colleges.length > 0) openActivateModalForCollege(colleges[0]);
                                            else { setShowAddCollegeModal(true); setCollegeForm({}); }
                                        }}
                                        style={{ backgroundColor: "#059669", color: "#FFFFFF", border: "none", borderRadius: "8px", padding: "9px 16px", fontWeight: 700, fontSize: "12.5px", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", display: "inline-flex", alignItems: "center", gap: "5px" }}
                                    >
                                        <span>Pay / Activate Plan</span>
                                    </button>
                                </div>
                            </div>

                            {/* 4 Platform-Level KPI Cards */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))", gap: "14px" }}>
                                {[
                                    {
                                        label: "Total Colleges",
                                        value: totalCollegesCount,
                                        sub: `${activeCollegesCount} Active • ${inactiveCollegesCount} Inactive`,
                                        color: "#0B3D91",
                                        bg: "#EFF6FF",
                                        onClick: () => setActiveTab("colleges"),
                                    },
                                    {
                                        label: "Active Colleges",
                                        value: activeCollegesCount,
                                        sub: "Live tenant colleges",
                                        color: "#059669",
                                        bg: "#DCFCE7",
                                        onClick: () => { setCollegeStatusFilter("Active"); setActiveTab("colleges"); },
                                    },
                                    {
                                        label: "Total Users",
                                        value: totalUsersCount,
                                        sub: "Officers, Students, Recruiters",
                                        color: "#7C3AED",
                                        bg: "#F3E8FF",
                                        onClick: () => setActiveTab("users"),
                                    },
                                    {
                                        label: "Subscription Revenue",
                                        value: `₹${(totalARR / 1000).toFixed(1)}k`,
                                        sub: `${totalActiveSubs} Active Subscriptions`,
                                        color: "#DC2626",
                                        bg: "#FEE2E2",
                                        onClick: () => setActiveTab("subscriptions"),
                                    }
                                ].map((kpi, idx) => (
                                    <div
                                        key={idx}
                                        onClick={kpi.onClick}
                                        style={{
                                            backgroundColor: "#FFFFFF",
                                            padding: "16px",
                                            borderRadius: "12px",
                                            border: "1px solid #E2E8F0",
                                            borderTop: `4px solid ${kpi.color}`,
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                            cursor: "pointer",
                                            transition: "all 0.15s ease"
                                        }}
                                    >
                                        <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>{kpi.label}</div>
                                        <div style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A", marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <span>{kpi.value}</span>
                                            <span style={{ fontSize: "11px", color: kpi.color, fontWeight: 700 }}>Manage →</span>
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>{kpi.sub}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Dual Overview Containers */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: "16px" }}>
                                
                                {/* Recent Colleges Card */}
                                <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0", padding: "18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                                            <div style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A" }}>
                                                Registered Institutions
                                            </div>
                                            <button onClick={() => setActiveTab("colleges")} style={{ padding: "4px 10px", backgroundColor: "#F1F5F9", color: "#334155", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}>
                                                View all ({colleges.length})
                                            </button>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            {colleges.length === 0 ? (
                                                <div style={{ padding: "20px", textAlign: "center", color: "#94A3B8", fontSize: "12.5px" }}>No colleges registered yet.</div>
                                            ) : (
                                                colleges.slice(0, 4).map((col) => (
                                                    <div key={col.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: "8px", border: "1px solid #F1F5F9", backgroundColor: "#F8FAFC" }}>
                                                        <div>
                                                            <div style={{ fontWeight: 800, color: "#0F172A", fontSize: "13px" }}>{col.name}</div>
                                                            <div style={{ fontSize: "11px", color: "#64748B" }}>Code: {col.code} • Plan: <strong style={{ color: "#0B3D91" }}>{col.currentPlan}</strong></div>
                                                        </div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                            <span style={{ fontSize: "11px", fontWeight: 700, color: col.status === "Active" ? "#059669" : "#DC2626", padding: "3px 8px", borderRadius: "10px", backgroundColor: col.status === "Active" ? "#DCFCE7" : "#FEE2E2" }}>
                                                                {col.status}
                                                            </span>
                                                            <button
                                                                onClick={() => openActivateModalForCollege(col)}
                                                                style={{ padding: "4px 8px", backgroundColor: "#059669", color: "#FFFFFF", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                                                title="Pay or Activate Subscription Plan"
                                                            >
                                                                <CreditCard size={12} />
                                                                <span>Pay / Plan</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Active Subscriptions & GPay Payment Summary */}
                                <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0", padding: "18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                                            <div style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A" }}>
                                                Payment & Active Subscriptions
                                            </div>
                                            <button onClick={() => setActiveTab("subscriptions")} style={{ padding: "4px 10px", backgroundColor: "#F1F5F9", color: "#334155", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "11.5px", fontWeight: 700, cursor: "pointer" }}>
                                                Manage
                                            </button>
                                        </div>

                                        {/* Current GPay Config Snippet */}
                                        <div style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: "10px", padding: "12px", marginBottom: "12px" }}>
                                            <div style={{ fontSize: "11px", fontWeight: 800, color: "#1D4ED8", textTransform: "uppercase" }}>Configured GPay / UPI ID:</div>
                                            <div style={{ fontSize: "13px", fontWeight: 800, color: "#0F172A", marginTop: "2px" }}>{paymentSettings.upiId} ({paymentSettings.gpayNumber})</div>
                                            <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>Beneficiary: {paymentSettings.beneficiaryName}</div>
                                        </div>

                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            {subscriptions.slice(0, 3).map((sub) => (
                                                <div key={sub.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", borderRadius: "8px", border: "1px solid #F1F5F9" }}>
                                                    <div>
                                                        <div style={{ fontWeight: 700, color: "#0F172A", fontSize: "12.5px" }}>{sub.collegeName}</div>
                                                        <div style={{ fontSize: "11px", color: "#64748B" }}>{sub.planName} Tier • Mode: <strong>{sub.paymentMode || "UPI"}</strong></div>
                                                    </div>
                                                    <div style={{ textAlign: "right" }}>
                                                        <div style={{ fontWeight: 800, color: "#059669", fontSize: "13px" }}>₹{(sub.amount || 0).toLocaleString()}</div>
                                                        <div style={{ fontSize: "10.5px", color: "#64748B" }}>Exp: {sub.expiryDate || "N/A"}</div>
                                                    </div>
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
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                                <div>
                                    <h2 style={{ margin: "0 0 3px 0", fontSize: "19px", fontWeight: 800, color: "#0F172A" }}>Institutional College Directory</h2>
                                    <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>Onboard partner colleges, provision placement officers, and activate subscriptions.</p>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                    <button
                                        onClick={() => {
                                            setCollegeForm({ name: "", code: "", email: "", phone: "", officerName: "", officerEmail: "", officerPassword: "password123", status: "Active", currentPlan: "Basic" });
                                            setShowAddCollegeModal(true);
                                        }}
                                        style={{ padding: "8px 16px", backgroundColor: "#0B3D91", color: "#FFFFFF", border: "none", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                    >
                                        <span>+ Add College</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (colleges.length > 0) openActivateModalForCollege(colleges[0]);
                                            else { setShowAddCollegeModal(true); setCollegeForm({}); }
                                        }}
                                        style={{ padding: "8px 16px", backgroundColor: "#059669", color: "#FFFFFF", border: "none", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                    >
                                        <span>Pay / Activate Plan</span>
                                    </button>
                                </div>
                            </div>

                            {/* Search & Filter Bar */}
                            <div style={{ backgroundColor: "#FFFFFF", padding: "12px 16px", borderRadius: "12px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "220px" }}>
                                    <Search size={14} color="#64748B" />
                                    <input
                                        type="text"
                                        placeholder="Search by college name, code, email, or city..."
                                        value={collegeSearchQuery}
                                        onChange={(e) => setCollegeSearchQuery(e.target.value)}
                                        style={{ width: "100%", padding: "7px 10px", border: "1px solid #CBD5E1", borderRadius: "7px", fontSize: "12.5px", outline: "none" }}
                                    />
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    {["All", "Active", "Inactive"].map((st) => (
                                        <button
                                            key={st}
                                            onClick={() => setCollegeStatusFilter(st)}
                                            style={{
                                                padding: "5px 12px",
                                                borderRadius: "16px",
                                                border: "1px solid",
                                                borderColor: collegeStatusFilter === st ? "#0B3D91" : "#CBD5E1",
                                                backgroundColor: collegeStatusFilter === st ? "#EFF6FF" : "#FFFFFF",
                                                color: collegeStatusFilter === st ? "#0B3D91" : "#64748B",
                                                fontWeight: collegeStatusFilter === st ? 700 : 500,
                                                fontSize: "11.5px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            {st}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Colleges Table */}
                            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                                <div className="responsive-table-wrapper" style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", minWidth: "720px", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
                                        <thead>
                                            <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                <th style={{ padding: "12px 14px", fontWeight: 700 }}>College</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 700 }}>Contact Info</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 700 }}>Location</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 700 }}>Active Plan</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 700 }}>Status</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 700, textAlign: "right" }}>Actions</th>
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
                                                            <td style={{ padding: "12px 14px" }}>
                                                                <div style={{ fontWeight: 800, color: "#0F172A" }}>{col.name}</div>
                                                                <div style={{ fontSize: "11px", color: "#64748B" }}>Code: {col.code} • Est. {col.establishedYear}</div>
                                                            </td>
                                                            <td style={{ padding: "12px 14px" }}>
                                                                <div style={{ fontWeight: 600, color: "#0B3D91" }}>{col.email}</div>
                                                                <div style={{ fontSize: "11px", color: "#64748B" }}>{col.phone || col.contactPerson}</div>
                                                            </td>
                                                            <td style={{ padding: "12px 14px", color: "#334155" }}>
                                                                {col.city || "Tamil Nadu"}, {col.state || "India"}
                                                            </td>
                                                            <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                                                                <button
                                                                    onClick={() => openActivateModalForCollege(col)}
                                                                    style={{
                                                                        padding: "3px 9px",
                                                                        borderRadius: "6px",
                                                                        fontSize: "11px",
                                                                        fontWeight: 700,
                                                                        backgroundColor: col.currentPlan === "Pro" ? "#F3E8FF" : (col.currentPlan === "Premium" ? "#EEF2FF" : "#DCFCE7"),
                                                                        color: col.currentPlan === "Pro" ? "#7C3AED" : (col.currentPlan === "Premium" ? "#0B3D91" : "#059669"),
                                                                        border: "1px solid #CBD5E1",
                                                                        cursor: "pointer",
                                                                        display: "inline-flex",
                                                                        alignItems: "center",
                                                                        gap: "4px"
                                                                    }}
                                                                    title="Click to upgrade or activate plan"
                                                                >
                                                                    <span>{col.currentPlan}</span>
                                                                </button>
                                                            </td>
                                                            <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                                                                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", backgroundColor: isActive ? "#DCFCE7" : "#FEE2E2", color: isActive ? "#059669" : "#DC2626", border: `1px solid ${isActive ? "#86EFAC" : "#FCA5A5"}`, padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700 }}>
                                                                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: isActive ? "#10B981" : "#DC2626" }}></span>
                                                                    <span>{col.status}</span>
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: "12px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                                                                <div style={{ display: "inline-flex", gap: "5px" }}>
                                                                    <button
                                                                        onClick={() => openActivateModalForCollege(col)}
                                                                        className="btn-action-pay"
                                                                        title="Pay / Activate Plan"
                                                                    >
                                                                        <CreditCard size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setSelectedCollegeForView(col)}
                                                                        className="btn-action-view"
                                                                        title="View College Details"
                                                                    >
                                                                        <Eye size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setSelectedCollegeForEdit(col); setCollegeForm(col); }}
                                                                        className="btn-action-edit"
                                                                        title="Edit College Information"
                                                                    >
                                                                        <Edit3 size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleToggleCollegeStatus(col.id)}
                                                                        className={isActive ? "btn-action-delete" : "btn-action-power"}
                                                                        title={isActive ? "Deactivate College" : "Activate College"}
                                                                    >
                                                                        <Power size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setCollegeToDelete({ id: col.id, name: col.name })}
                                                                        className="btn-action-delete"
                                                                        title="Delete College"
                                                                    >
                                                                        <Trash2 size={14} />
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
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* 3. SUBSCRIPTION & PLANS MODULE */}
                    {/* ========================================================================= */}
                    {activeTab === "subscriptions" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                                <div>
                                    <h2 style={{ margin: "0 0 3px 0", fontSize: "19px", fontWeight: 800, color: "#0F172A" }}>SaaS Subscriptions & Plan Activation</h2>
                                    <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>Super Admin plan activations, pricing tiers, and GPay / UPI transaction verification.</p>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                    <button
                                        onClick={() => {
                                            setCollegeForm({ name: "", code: "", email: "", phone: "", officerName: "", officerEmail: "", officerPassword: "password123", status: "Active", currentPlan: "Basic" });
                                            setShowAddCollegeModal(true);
                                        }}
                                        style={{ padding: "8px 16px", backgroundColor: "#0B3D91", color: "#FFFFFF", border: "none", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                    >
                                        <span>+ Add College</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (colleges.length > 0) openActivateModalForCollege(colleges[0]);
                                            else showNotification("Please onboard a college first.", "info");
                                        }}
                                        style={{ padding: "8px 16px", backgroundColor: "#059669", color: "#FFFFFF", border: "none", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                    >
                                        <span>Pay / Activate Plan</span>
                                    </button>
                                </div>
                            </div>

                            {/* Plan Tiers Grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "14px" }}>
                                {plans.map((p) => (
                                    <div key={p.id} style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "18px", display: "flex", flexDirection: "column", justifyContent: "space-between", borderTop: `4px solid ${p.accentColor}` }}>
                                        <div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#0F172A" }}>{p.name}</h3>
                                                <span style={{ fontSize: "11px", fontWeight: 700, color: p.accentColor, backgroundColor: "#F8FAFC", padding: "2px 7px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>{p.duration}</span>
                                            </div>
                                            <div style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A", marginTop: "10px" }}>
                                                {p.price === 0 ? "Free" : `₹${p.price.toLocaleString()}`}
                                                <span style={{ fontSize: "11.5px", color: "#64748B", fontWeight: 500 }}> / season</span>
                                            </div>
                                            <p style={{ fontSize: "11.5px", color: "#64748B", margin: "6px 0 12px 0", lineHeight: 1.4 }}>{p.suitableFor}</p>
                                            
                                            <div style={{ fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "6px", textTransform: "uppercase" }}>Quota Capacity:</div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "3px", fontSize: "11.5px", color: "#334155", marginBottom: "14px" }}>
                                                <div>• Max Students: <strong>{p.maxStudents.toLocaleString()}</strong></div>
                                                <div>• Max Recruiters: <strong>{p.maxRecruiters}</strong></div>
                                                <div>• Placement Drives: <strong>{p.maxDrives}</strong></div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => openActivateModalForTier(p.name)}
                                            style={{
                                                width: "100%",
                                                padding: "9px 12px",
                                                backgroundColor: p.name === "Trial" ? "#0F172A" : (p.name === "Basic" ? "#059669" : (p.name === "Premium" ? "#4F46E5" : "#7C3AED")),
                                                color: "#FFFFFF",
                                                border: "none",
                                                borderRadius: "8px",
                                                fontSize: "12px",
                                                fontWeight: 700,
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "6px",
                                                boxShadow: "0 2px 4px rgba(0,0,0,0.06)"
                                            }}
                                        >
                                            <span>{p.name === "Trial" ? "Activate Trial" : `Pay & Activate (${p.price === 0 ? "Free" : "₹" + p.price.toLocaleString()})`}</span>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Subscribed Colleges Table with Payment Details */}
                            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                                <div style={{ padding: "14px 18px", borderBottom: "1px solid #E2E8F0", fontWeight: 800, fontSize: "14px", color: "#0F172A", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span>Active Institutional Subscriptions & Payment Records</span>
                                    <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 500 }}>Total: {subscriptions.length} records</span>
                                </div>
                                <div className="responsive-table-wrapper" style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", minWidth: "760px", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
                                        <thead>
                                            <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569", fontSize: "11px", textTransform: "uppercase" }}>
                                                <th style={{ padding: "12px 14px", fontWeight: 700 }}>College</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 700 }}>Active Tier</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 700 }}>Payment Mode</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 700 }}>Transaction ID / UTR</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 700 }}>Amount</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 700 }}>Status</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {subscriptions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#64748B" }}>
                                                        No active subscriptions recorded yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                subscriptions.map((sub) => {
                                                    const matchedCollege = colleges.find(c => c.id === sub.collegeId || c.name === sub.collegeName);
                                                    return (
                                                        <tr key={sub.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                                            <td style={{ padding: "12px 14px", fontWeight: 800, color: "#0F172A" }}>
                                                                <div>{sub.collegeName}</div>
                                                                <div style={{ fontSize: "10.5px", color: "#64748B", fontWeight: 400 }}>Exp: {sub.expiryDate || "N/A"}</div>
                                                            </td>
                                                            <td style={{ padding: "12px 14px" }}>
                                                                <button
                                                                    onClick={() => {
                                                                        if (matchedCollege) openActivateModalForCollege(matchedCollege, sub.planName);
                                                                        else openActivateModalForCollege({ id: sub.collegeId, name: sub.collegeName, currentPlan: sub.planName }, sub.planName);
                                                                    }}
                                                                    style={{ background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: "6px", padding: "3px 8px", cursor: "pointer", color: "#0B3D91", fontWeight: 800, fontSize: "11.5px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                                                    title="Click to change or activate plan tier"
                                                                >
                                                                    <span>{sub.planName}</span>
                                                                </button>
                                                            </td>
                                                            <td style={{ padding: "12px 14px" }}>
                                                                <span style={{ backgroundColor: "#F1F5F9", padding: "2px 7px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, color: "#334155" }}>
                                                                    {sub.paymentMode || "UPI / GPay"}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: "11.5px", color: "#0F172A" }}>
                                                                {sub.paymentTransactionId || "TXN-DIRECT"}
                                                            </td>
                                                            <td style={{ padding: "12px 14px", fontWeight: 800, color: "#059669" }}>₹{(sub.amount || 0).toLocaleString()}</td>
                                                            <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                                                                <span style={{
                                                                    backgroundColor: sub.status === "Active" ? "#DCFCE7" : (sub.status === "Expiring Soon" ? "#FEF3C7" : "#FEE2E2"),
                                                                    color: sub.status === "Active" ? "#059669" : (sub.status === "Expiring Soon" ? "#D97706" : "#DC2626"),
                                                                    border: `1px solid ${sub.status === "Active" ? "#86EFAC" : (sub.status === "Expiring Soon" ? "#FDE68A" : "#FCA5A5")}`,
                                                                    padding: "3px 8px",
                                                                    borderRadius: "12px",
                                                                    fontSize: "11px",
                                                                    fontWeight: 700
                                                                }}>
                                                                    {sub.status}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: "12px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                                                                <div style={{ display: "inline-flex", gap: "5px" }}>
                                                                    <button
                                                                        onClick={() => {
                                                                            if (matchedCollege) openActivateModalForCollege(matchedCollege, sub.planName);
                                                                            else openActivateModalForCollege({ id: sub.collegeId, name: sub.collegeName, currentPlan: sub.planName }, sub.planName);
                                                                        }}
                                                                        className="btn-action-pay"
                                                                        title="Pay / Activate Plan"
                                                                    >
                                                                        <CreditCard size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setSelectedSubForView(sub)}
                                                                        className="btn-action-view"
                                                                        title="View Quota Usage"
                                                                    >
                                                                        <BarChart3 size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            if (matchedCollege) openActivateModalForCollege(matchedCollege);
                                                                            else {
                                                                                setActivationForm({
                                                                                    collegeId: sub.collegeId || "",
                                                                                    planName: sub.planName || "Basic",
                                                                                    durationDays: 365,
                                                                                    amount: sub.amount || 7999,
                                                                                    paymentMode: "GPay",
                                                                                    paymentTransactionId: `RENEW-${Date.now().toString().slice(-6)}`,
                                                                                    paymentDate: new Date().toISOString().slice(0, 10),
                                                                                    paymentNotes: `Renewed plan for ${sub.collegeName}`
                                                                                });
                                                                                setShowActivatePlanModal(true);
                                                                            }
                                                                        }}
                                                                        className="btn-action-power"
                                                                        title="Renew Subscription Plan"
                                                                    >
                                                                        <RefreshCw size={14} />
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
                        </div>
                    )}


                    {/* ========================================================================= */}
                    {/* 5. USER MANAGEMENT MODULE */}
                    {/* ========================================================================= */}
                    {activeTab === "users" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                                <div>
                                    <h2 style={{ margin: "0 0 3px 0", fontSize: "19px", fontWeight: 800, color: "#0F172A" }}>Cross-Tenant User Governance</h2>
                                    <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>Oversee placement officers, candidates, recruiters, and platform administrators.</p>
                                </div>
                                <button
                                    onClick={() => setShowAddUserModal(true)}
                                    style={{ padding: "8px 16px", backgroundColor: "#0B3D91", color: "#FFFFFF", border: "none", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                >
                                    <Plus size={14} />
                                    <span>Add User</span>
                                </button>
                            </div>

                            {/* Search & Filter Bar */}
                            <div style={{ backgroundColor: "#FFFFFF", padding: "12px 16px", borderRadius: "12px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "220px" }}>
                                    <Search size={14} color="#64748B" />
                                    <input
                                        type="text"
                                        placeholder="Search by user name, email, or college..."
                                        value={userSearchQuery}
                                        onChange={(e) => setUserSearchQuery(e.target.value)}
                                        style={{ width: "100%", padding: "7px 10px", border: "1px solid #CBD5E1", borderRadius: "7px", fontSize: "12.5px", outline: "none" }}
                                    />
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    {["All", "Placement Officer", "Student", "Recruiter"].map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setUserRoleFilter(r)}
                                            style={{
                                                padding: "5px 12px",
                                                borderRadius: "16px",
                                                border: "1px solid",
                                                borderColor: userRoleFilter === r ? "#0B3D91" : "#CBD5E1",
                                                backgroundColor: userRoleFilter === r ? "#EFF6FF" : "#FFFFFF",
                                                color: userRoleFilter === r ? "#0B3D91" : "#64748B",
                                                fontWeight: userRoleFilter === r ? 700 : 500,
                                                fontSize: "11.5px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Users Table */}
                            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                                <div className="responsive-table-wrapper" style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", minWidth: "700px", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
                                        <thead>
                                            <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569", fontSize: "11px", textTransform: "uppercase" }}>
                                                <th style={{ padding: "12px 14px", fontWeight: 700 }}>User Name</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 700 }}>Email Address</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 700 }}>Role</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 700 }}>Associated College</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 700 }}>Status</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#64748B" }}>
                                                        No users found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredUsers.map((u) => (
                                                    <tr key={u.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                                        <td style={{ padding: "12px 14px", fontWeight: 800, color: "#0F172A" }}>{u.name}</td>
                                                        <td style={{ padding: "12px 14px", color: "#0B3D91" }}>{u.email}</td>
                                                        <td style={{ padding: "12px 14px" }}>
                                                            <span style={{ backgroundColor: "#EFF6FF", color: "#0B3D91", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700 }}>
                                                                {u.role}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: "12px 14px", color: "#475569" }}>{u.college}</td>
                                                        <td style={{ padding: "12px 14px" }}>
                                                            <span style={{ color: u.status === "Active" ? "#059669" : "#DC2626", fontWeight: 700 }}>● {u.status}</span>
                                                        </td>
                                                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                                                            <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                                                                <button
                                                                    onClick={() => {
                                                                        const updated = usersList.map(item => item.id === u.id ? { ...item, status: item.status === "Active" ? "Inactive" : "Active" } as UserRecord : item);
                                                                        setUsersList(updated);
                                                                    }}
                                                                    className={u.status === "Active" ? "btn-action-delete" : "btn-action-power"}
                                                                    title={u.status === "Active" ? "Deactivate User" : "Activate User"}
                                                                >
                                                                    <Power size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => setUserToDelete(u)}
                                                                    className="btn-action-delete"
                                                                    title="Delete User"
                                                                >
                                                                    <Trash2 size={14} />
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
                        </div>
                    )}


                    {/* ========================================================================= */}
                    {/* 8. SYSTEM REPORTS MODULE */}
                    {/* ========================================================================= */}
                    {activeTab === "reports" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                            <div>
                                <h2 style={{ margin: "0 0 3px 0", fontSize: "19px", fontWeight: 800, color: "#0F172A" }}>Cross-College Intelligence & Analytics</h2>
                                <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>Aggregate metrics, institutional placement growth, and corporate hiring trends.</p>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: "14px" }}>
                                {[
                                    { title: "Total Registered Students", val: "3,805", sub: "+18% from last academic year", color: "#0B3D91" },
                                    { title: "Active Placement Drives", val: "91", sub: "Across all partner colleges", color: "#059669" },
                                    { title: "Platform Placement Rate", val: "84.2%", sub: "2,975 Offers secured", color: "#7C3AED" },
                                    { title: "Average Package (CTC)", val: "₹7.8 LPA", sub: "Highest: ₹32.0 LPA", color: "#D97706" }
                                ].map((rep, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            backgroundColor: "#FFFFFF",
                                            padding: "18px",
                                            borderRadius: "12px",
                                            border: "1px solid #E2E8F0",
                                            borderTop: `4px solid ${rep.color}`,
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                                            cursor: "pointer",
                                            transition: "all 0.18s ease-in-out"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = "translateY(-3px)";
                                            e.currentTarget.style.boxShadow = "0 8px 18px rgba(0,0,0,0.08)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
                                        }}
                                    >
                                        <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>{rep.title}</div>
                                        <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", margin: "6px 0 2px 0" }}>{rep.val}</div>
                                        <div style={{ fontSize: "11px", color: "#059669", fontWeight: 600 }}>{rep.sub}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* ========================================================================= */}
                    {/* 10. SUPPORT / HELPDESK MODULE */}
                    {/* ========================================================================= */}
                    {activeTab === "support" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <h2 style={{ margin: "0 0 3px 0", fontSize: "19px", fontWeight: 800, color: "#0F172A" }}>Institutional Support & Helpdesk Tickets</h2>
                                <p style={{ margin: 0, fontSize: "12px", color: "#64748B" }}>Respond to placement officers and college administrative inquiries.</p>
                            </div>

                            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                                <div className="responsive-table-wrapper" style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", minWidth: "700px", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
                                        <thead>
                                            <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569", fontSize: "11px", textTransform: "uppercase" }}>
                                                <th style={{ padding: "12px 14px", fontWeight: 700 }}>Ticket ID</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 700 }}>College</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 700 }}>Subject</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 700 }}>Priority</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 700 }}>Status</th>
                                                <th style={{ padding: "12px 14px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {supportTickets.length === 0 ? (
                                                <tr><td colSpan={6} style={{ padding: "28px", textAlign: "center", color: "#64748B" }}>No support tickets active.</td></tr>
                                            ) : (
                                                supportTickets.map((tck) => (
                                                    <tr key={tck.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                                        <td style={{ padding: "12px 14px", fontFamily: "monospace", fontWeight: 800, color: "#0B3D91" }}>{tck.ticketId}</td>
                                                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0F172A" }}>{tck.collegeName}</td>
                                                        <td style={{ padding: "12px 14px", color: "#334155" }}>{tck.subject}</td>
                                                        <td style={{ padding: "12px 14px" }}>
                                                            <span style={{ backgroundColor: tck.priority === "High" ? "#FEE2E2" : "#EEF2FF", color: tck.priority === "High" ? "#DC2626" : "#0B3D91", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700 }}>
                                                                {tck.priority}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: "12px 14px" }}>
                                                            <span style={{ backgroundColor: tck.status === "Resolved" ? "#DCFCE7" : "#F1F5F9", color: tck.status === "Resolved" ? "#059669" : "#475569", padding: "3px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700 }}>
                                                                {tck.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                                                            <button
                                                                onClick={() => setSelectedTicketForView(tck)}
                                                                style={{ padding: "4px 10px", backgroundColor: "#EEF2FF", color: "#0B3D91", border: "1px solid #C7D2FE", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                                                            >
                                                                Reply →
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* ========================================================================= */}
            {/* MODAL 1: VIEW COLLEGE PROFILE & DATABASE STATS */}
            {/* ========================================================================= */}
            {selectedCollegeForView && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "16px" }}>
                    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #E2E8F0", paddingBottom: "14px", marginBottom: "16px" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0F172A" }}>{selectedCollegeForView.name}</h3>
                                <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>Code: <strong>{selectedCollegeForView.code}</strong> • Est. {selectedCollegeForView.establishedYear}</div>
                            </div>
                            <button
                                onClick={() => setSelectedCollegeForView(null)}
                                style={{ background: "none", border: "none", fontSize: "18px", color: "#64748B", cursor: "pointer" }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", fontSize: "12.5px", color: "#334155", marginBottom: "20px" }}>
                            <div><strong>Official Email:</strong> {selectedCollegeForView.email}</div>
                            <div><strong>Phone:</strong> {selectedCollegeForView.phone || "N/A"}</div>
                            <div><strong>TPO Contact:</strong> {selectedCollegeForView.contactPerson || "N/A"}</div>
                            <div><strong>TPO Email:</strong> {selectedCollegeForView.contactEmail || "N/A"}</div>
                            <div><strong>Location:</strong> {selectedCollegeForView.city}, {selectedCollegeForView.state}</div>
                            <div><strong>Active Plan:</strong> <span style={{ backgroundColor: "#EEF2FF", color: "#0B3D91", padding: "2px 8px", borderRadius: "4px", fontWeight: 700 }}>{selectedCollegeForView.currentPlan}</span></div>
                        </div>

                        <div style={{ backgroundColor: "#F8FAFC", borderRadius: "10px", padding: "14px", border: "1px solid #E2E8F0", marginBottom: "18px" }}>
                            <div style={{ fontSize: "12px", fontWeight: 800, color: "#0F172A", marginBottom: "8px" }}>Campus Placement Database Metrics</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", textAlign: "center" }}>
                                <div style={{ backgroundColor: "#FFFFFF", padding: "10px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                                    <div style={{ fontSize: "10.5px", color: "#64748B" }}>Total Students</div>
                                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#0B3D91", marginTop: "2px" }}>{selectedCollegeForView.totalStudents || 0}</div>
                                </div>
                                <div style={{ backgroundColor: "#FFFFFF", padding: "10px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                                    <div style={{ fontSize: "10.5px", color: "#64748B" }}>Active Drives</div>
                                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#059669", marginTop: "2px" }}>{selectedCollegeForView.activeDrives || 0}</div>
                                </div>
                                <div style={{ backgroundColor: "#FFFFFF", padding: "10px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                                    <div style={{ fontSize: "10.5px", color: "#64748B" }}>Placed Students</div>
                                    <div style={{ fontSize: "16px", fontWeight: 800, color: "#7C3AED", marginTop: "2px" }}>{selectedCollegeForView.totalPlaced || 0}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                            <button
                                onClick={() => {
                                    const col = selectedCollegeForView;
                                    setSelectedCollegeForView(null);
                                    openActivateModalForCollege(col);
                                }}
                                style={{ padding: "8px 16px", backgroundColor: "#059669", color: "#FFFFFF", border: "none", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
                            >
                                Activate / Upgrade Plan
                            </button>
                            <button
                                onClick={() => setSelectedCollegeForView(null)}
                                style={{ padding: "8px 16px", backgroundColor: "#F1F5F9", color: "#334155", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 2: ONBOARD / EDIT COLLEGE MODAL */}
            {/* ========================================================================= */}
            {(showAddCollegeModal || selectedCollegeForEdit) && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "16px" }}>
                    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", maxWidth: "620px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "14px", marginBottom: "16px" }}>
                            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#0F172A" }}>
                                {selectedCollegeForEdit ? "Edit College Information" : "Onboard New College Institution"}
                            </h3>
                            <button
                                onClick={() => { setShowAddCollegeModal(false); setSelectedCollegeForEdit(null); }}
                                style={{ background: "none", border: "none", fontSize: "18px", color: "#64748B", cursor: "pointer" }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveCollege} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>College Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={collegeForm.name || ""}
                                    onChange={(e) => setCollegeForm({ ...collegeForm, name: e.target.value })}
                                    placeholder="e.g. Kongu Engineering College"
                                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #CBD5E1", borderRadius: "7px", fontSize: "12.5px" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>College Code *</label>
                                <input
                                    type="text"
                                    required
                                    value={collegeForm.code || ""}
                                    onChange={(e) => setCollegeForm({ ...collegeForm, code: e.target.value })}
                                    placeholder="e.g. KEC-738"
                                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #CBD5E1", borderRadius: "7px", fontSize: "12.5px" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>Official Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={collegeForm.email || ""}
                                    onChange={(e) => setCollegeForm({ ...collegeForm, email: e.target.value })}
                                    placeholder="e.g. placement@kongu.edu"
                                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #CBD5E1", borderRadius: "7px", fontSize: "12.5px" }}
                                />
                            </div>

                            {!selectedCollegeForEdit && (
                                <>
                                    <div style={{ gridColumn: "1 / -1", backgroundColor: "#EFF6FF", padding: "10px", borderRadius: "8px", border: "1px solid #BFDBFE", fontSize: "11.5px", color: "#1E40AF" }}>
                                        <strong>Placement Officer Account:</strong> Will automatically be created with the credentials below so the officer can log in directly!
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>Placement Officer Name</label>
                                        <input
                                            type="text"
                                            value={collegeForm.officerName || ""}
                                            onChange={(e) => setCollegeForm({ ...collegeForm, officerName: e.target.value })}
                                            placeholder="e.g. Dr. K. Senthil Kumar"
                                            style={{ width: "100%", padding: "8px 10px", border: "1px solid #CBD5E1", borderRadius: "7px", fontSize: "12.5px" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>Officer Login Email</label>
                                        <input
                                            type="email"
                                            value={collegeForm.officerEmail || ""}
                                            onChange={(e) => setCollegeForm({ ...collegeForm, officerEmail: e.target.value })}
                                            placeholder="e.g. tpo@kongu.edu"
                                            style={{ width: "100%", padding: "8px 10px", border: "1px solid #CBD5E1", borderRadius: "7px", fontSize: "12.5px" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>Officer Password</label>
                                        <input
                                            type="text"
                                            value={collegeForm.officerPassword || "password123"}
                                            onChange={(e) => setCollegeForm({ ...collegeForm, officerPassword: e.target.value })}
                                            style={{ width: "100%", padding: "8px 10px", border: "1px solid #CBD5E1", borderRadius: "7px", fontSize: "12.5px" }}
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>City</label>
                                <input
                                    type="text"
                                    value={collegeForm.city || ""}
                                    onChange={(e) => setCollegeForm({ ...collegeForm, city: e.target.value })}
                                    placeholder="e.g. Perundurai"
                                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #CBD5E1", borderRadius: "7px", fontSize: "12.5px" }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>Assigned Subscription Plan</label>
                                <select
                                    value={collegeForm.currentPlan || "Basic"}
                                    onChange={(e: any) => setCollegeForm({ ...collegeForm, currentPlan: e.target.value })}
                                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #CBD5E1", borderRadius: "7px", fontSize: "12.5px" }}
                                >
                                    <option value="Trial">Trial (14 Days - Free)</option>
                                    <option value="Basic">Basic (&lt; 500 Students - ₹7,999)</option>
                                    <option value="Premium">Premium (&lt; 2,000 Students - ₹14,999)</option>
                                    <option value="Pro">Pro (&lt; 5,000 Students - ₹24,999)</option>
                                    <option value="Custom">Custom Enterprise</option>
                                </select>
                            </div>

                            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                                <button
                                    type="button"
                                    onClick={() => { setShowAddCollegeModal(false); setSelectedCollegeForEdit(null); }}
                                    style={{ padding: "8px 16px", backgroundColor: "#F1F5F9", color: "#334155", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: "8px 18px", backgroundColor: "#0B3D91", color: "#FFFFFF", border: "none", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
                                >
                                    {selectedCollegeForEdit ? "Update College" : "Complete Onboarding"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 3: ACTIVATE / UPGRADE PLAN MODAL (Super Admin Plan & GPay Verification) */}
            {/* ========================================================================= */}
            {showActivatePlanModal && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "16px" }}>
                    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "18px", maxWidth: "680px", width: "100%", maxHeight: "92vh", overflowY: "auto", padding: "24px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", border: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #E2E8F0", paddingBottom: "14px", marginBottom: "16px" }}>
                            <div>
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#ECFDF5", color: "#059669", padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, marginBottom: "4px" }}>
                                    <span>Official Payment & Plan Portal</span>
                                </div>
                                <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 800, color: "#0F172A" }}>
                                    Activate & Record College Subscription
                                </h3>
                                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                                    Select institution, verify GPay / UPI transfer, and instantly allocate quotas.
                                </div>
                            </div>
                            <button onClick={() => setShowActivatePlanModal(false)} style={{ background: "#F1F5F9", border: "none", borderRadius: "8px", width: "32px", height: "32px", fontSize: "16px", color: "#64748B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                        </div>

                        <form onSubmit={handleActivatePlanSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            
                            {/* 1. College Selection */}
                            <div style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#1E293B", marginBottom: "6px" }}>
                                    Target Institution / College *
                                </label>
                                <select
                                    value={activationForm.collegeId}
                                    onChange={(e) => {
                                        const col = colleges.find(c => c.id === e.target.value);
                                        setActivationForm({
                                            ...activationForm,
                                            collegeId: e.target.value,
                                            paymentNotes: `Plan ${activationForm.planName} activated for ${col ? col.name : 'College'}`
                                        });
                                    }}
                                    required
                                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", fontWeight: 600, color: "#0F172A", backgroundColor: "#FFFFFF" }}
                                >
                                    <option value="">-- Choose an Onboarded College --</option>
                                    {colleges.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.code}) - Current: {c.currentPlan} [{c.status}]
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 2. Interactive Plan Tier Selector */}
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, color: "#1E293B", marginBottom: "8px" }}>
                                    Select Subscription Tier
                                </label>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "8px" }}>
                                    {[
                                        { name: "Trial", label: "Trial", price: "Free", days: 14, amt: 0, s: 100, r: 5, d: 2, color: "#64748B" },
                                        { name: "Basic", label: "Basic", price: "₹7,999", days: 90, amt: 7999, s: 500, r: 25, d: 15, color: "#059669" },
                                        { name: "Premium", label: "Premium", price: "₹14,999", days: 180, amt: 14999, s: 2000, r: 100, d: 50, color: "#4F46E5" },
                                        { name: "Pro", label: "Pro", price: "₹24,999", days: 365, amt: 24999, s: 5000, r: 250, d: "Unlimited", color: "#7C3AED" },
                                        { name: "Custom", label: "Custom", price: "₹9,999", days: 90, amt: 9999, s: 1000, r: 50, d: 30, color: "#0B3D91" }
                                    ].map((tier) => {
                                        const isSelected = activationForm.planName === tier.name;
                                        return (
                                            <button
                                                key={tier.name}
                                                type="button"
                                                onClick={() => {
                                                    setActivationForm({
                                                        ...activationForm,
                                                        planName: tier.name as any,
                                                        amount: tier.amt,
                                                        durationDays: tier.days,
                                                        paymentMode: tier.name === "Trial" ? "Free/Trial" : (activationForm.paymentMode === "Free/Trial" ? "GPay" : activationForm.paymentMode),
                                                        studentsLimit: tier.s,
                                                        recruitersLimit: tier.r,
                                                        drivesLimit: tier.d,
                                                        paymentNotes: `Plan ${tier.name} activated by Super Admin`
                                                    });
                                                }}
                                                style={{
                                                    padding: "10px 8px",
                                                    borderRadius: "10px",
                                                    border: isSelected ? `2px solid ${tier.color}` : "1px solid #E2E8F0",
                                                    backgroundColor: isSelected ? `${tier.color}10` : "#FFFFFF",
                                                    cursor: "pointer",
                                                    textAlign: "center",
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: "2px",
                                                    transition: "all 0.15s ease"
                                                }}
                                            >
                                                <div style={{ fontSize: "12px", fontWeight: 800, color: isSelected ? tier.color : "#1E293B" }}>{tier.label}</div>
                                                <div style={{ fontSize: "11px", fontWeight: 700, color: isSelected ? tier.color : "#64748B" }}>{tier.price}</div>
                                                <div style={{ fontSize: "9.5px", color: "#94A3B8" }}>{tier.days} Days</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 3. Live Google Pay (GPay) & UPI Billing Assistant Card */}
                            {activationForm.amount > 0 && (
                                <div style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC", borderRadius: "12px", padding: "14px", display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
                                    <div style={{ backgroundColor: "#FFFFFF", padding: "6px", borderRadius: "8px", border: "1px solid #CBD5E1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=upi://pay?pa=${encodeURIComponent(paymentSettings.upiId || 'placement.billing@okaxis')}%26pn=${encodeURIComponent(paymentSettings.beneficiaryName || 'Campus Placement System')}%26am=${activationForm.amount}%26cu=INR`}
                                            alt="UPI QR Code"
                                            style={{ width: "96px", height: "96px", borderRadius: "4px" }}
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column", gap: "5px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <span style={{ fontSize: "12px", fontWeight: 800, color: "#166534" }}>Pay via GPay / UPI:</span>
                                            <span style={{ fontSize: "12px", fontWeight: 800, color: "#0F172A", backgroundColor: "#DCFCE7", padding: "2px 6px", borderRadius: "4px" }}>
                                                ₹{activationForm.amount.toLocaleString()}
                                            </span>
                                        </div>
                                        
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11.5px", color: "#334155", backgroundColor: "#FFFFFF", padding: "4px 8px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                                            <span>UPI ID: <strong>{paymentSettings.upiId || "placement.billing@okaxis"}</strong></span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(paymentSettings.upiId || "placement.billing@okaxis");
                                                    showNotification("UPI ID copied!");
                                                }}
                                                style={{ border: "none", background: "#EEF2FF", color: "#4F46E5", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
                                            >
                                                Copy
                                            </button>
                                        </div>

                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11.5px", color: "#334155", backgroundColor: "#FFFFFF", padding: "4px 8px", borderRadius: "6px", border: "1px solid #E2E8F0" }}>
                                            <span>GPay No: <strong>{paymentSettings.gpayNumber || "+91 98427 55443"}</strong></span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(paymentSettings.gpayNumber || "+91 98427 55443");
                                                    showNotification("GPay number copied!");
                                                }}
                                                style={{ border: "none", background: "#EEF2FF", color: "#4F46E5", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
                                            >
                                                Copy
                                            </button>
                                        </div>

                                        <div style={{ fontSize: "10.5px", color: "#64748B" }}>
                                            Beneficiary: <strong>{paymentSettings.beneficiaryName || "Campus Placement Solutions"}</strong>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 4. Payment & Transaction Details */}
                            <div style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#0F172A" }}>
                                        Payment Mode & UTR Verification
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => generateRandomTxnId(activationForm.paymentMode)}
                                        style={{ fontSize: "11px", fontWeight: 700, color: "#0B3D91", background: "#EEF2FF", border: "1px solid #C7D2FE", padding: "3px 8px", borderRadius: "6px", cursor: "pointer" }}
                                    >
                                        Generate Demo UTR
                                    </button>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>Payment Mode</label>
                                        <select
                                            value={activationForm.paymentMode}
                                            onChange={(e) => setActivationForm({ ...activationForm, paymentMode: e.target.value })}
                                            style={{ width: "100%", padding: "7px 10px", border: "1px solid #CBD5E1", borderRadius: "7px", fontSize: "12px" }}
                                        >
                                            <option value="GPay">Google Pay (GPay)</option>
                                            <option value="UPI">PhonePe / Paytm / UPI</option>
                                            <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                                            <option value="Cash">Cash / Cheque</option>
                                            <option value="Free/Trial">Free Trial / Waiver</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>Amount Paid (₹)</label>
                                        <input
                                            type="number"
                                            value={activationForm.amount}
                                            onChange={(e) => setActivationForm({ ...activationForm, amount: Number(e.target.value) })}
                                            style={{ width: "100%", padding: "7px 10px", border: "1px solid #CBD5E1", borderRadius: "7px", fontSize: "12px", fontWeight: 700, color: "#059669" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>Transaction ID / UTR *</label>
                                        <input
                                            type="text"
                                            required
                                            value={activationForm.paymentTransactionId}
                                            onChange={(e) => setActivationForm({ ...activationForm, paymentTransactionId: e.target.value })}
                                            placeholder="e.g. GPAY-58291048291"
                                            style={{ width: "100%", padding: "7px 10px", border: "1px solid #CBD5E1", borderRadius: "7px", fontSize: "12px", fontFamily: "monospace" }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>Payment Date</label>
                                        <input
                                            type="date"
                                            value={activationForm.paymentDate}
                                            onChange={(e) => setActivationForm({ ...activationForm, paymentDate: e.target.value })}
                                            style={{ width: "100%", padding: "7px 10px", border: "1px solid #CBD5E1", borderRadius: "7px", fontSize: "12px" }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 5. Quota Allocations */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>Duration (Days)</label>
                                    <input
                                        type="number"
                                        value={activationForm.durationDays}
                                        onChange={(e) => setActivationForm({ ...activationForm, durationDays: Number(e.target.value) })}
                                        style={{ width: "100%", padding: "7px 9px", border: "1px solid #CBD5E1", borderRadius: "7px", fontSize: "12px" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>Max Students</label>
                                    <input
                                        type="number"
                                        value={activationForm.studentsLimit}
                                        onChange={(e) => setActivationForm({ ...activationForm, studentsLimit: Number(e.target.value) })}
                                        style={{ width: "100%", padding: "7px 9px", border: "1px solid #CBD5E1", borderRadius: "7px", fontSize: "12px" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>Max Recruiters</label>
                                    <input
                                        type="number"
                                        value={activationForm.recruitersLimit}
                                        onChange={(e) => setActivationForm({ ...activationForm, recruitersLimit: Number(e.target.value) })}
                                        style={{ width: "100%", padding: "7px 9px", border: "1px solid #CBD5E1", borderRadius: "7px", fontSize: "12px" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>Placement Drives</label>
                                    <input
                                        type="text"
                                        value={activationForm.drivesLimit}
                                        onChange={(e) => setActivationForm({ ...activationForm, drivesLimit: e.target.value })}
                                        style={{ width: "100%", padding: "7px 9px", border: "1px solid #CBD5E1", borderRadius: "7px", fontSize: "12px" }}
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px", borderTop: "1px solid #F1F5F9", paddingTop: "14px" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowActivatePlanModal(false)}
                                    style={{ padding: "9px 18px", backgroundColor: "#F1F5F9", color: "#334155", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: "9px 24px", backgroundColor: "#059669", color: "#FFFFFF", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 2px 4px rgba(5,150,105,0.3)" }}
                                >
                                    <span>Confirm Payment & Activate Plan</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 4: VIEW SUBSCRIPTION USAGE MATRIX */}
            {/* ========================================================================= */}
            {selectedSubForView && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "16px" }}>
                    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", maxWidth: "520px", width: "100%", padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "12px", marginBottom: "16px" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#0F172A" }}>{selectedSubForView.collegeName}</h3>
                                <div style={{ fontSize: "11.5px", color: "#64748B" }}>Plan: <strong>{selectedSubForView.planName}</strong> • Expires: {selectedSubForView.expiryDate || "N/A"}</div>
                            </div>
                            <button onClick={() => setSelectedSubForView(null)} style={{ background: "none", border: "none", fontSize: "18px", color: "#64748B", cursor: "pointer" }}>✕</button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                                    <span>Students Enrolled Quota</span>
                                    <span>{selectedSubForView.usage?.studentsUsed || 0} / {selectedSubForView.usage?.studentsLimit || 500}</span>
                                </div>
                                <div style={{ width: "100%", height: "8px", backgroundColor: "#E2E8F0", borderRadius: "4px", overflow: "hidden" }}>
                                    <div style={{ width: `${Math.min(100, ((selectedSubForView.usage?.studentsUsed || 0) / (selectedSubForView.usage?.studentsLimit || 500)) * 100)}%`, height: "100%", backgroundColor: "#0B3D91" }}></div>
                                </div>
                            </div>

                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, marginBottom: "4px" }}>
                                    <span>Recruiters Connected</span>
                                    <span>{selectedSubForView.usage?.recruitersUsed || 0} / {selectedSubForView.usage?.recruitersLimit || 25}</span>
                                </div>
                                <div style={{ width: "100%", height: "8px", backgroundColor: "#E2E8F0", borderRadius: "4px", overflow: "hidden" }}>
                                    <div style={{ width: `${Math.min(100, ((selectedSubForView.usage?.recruitersUsed || 0) / (selectedSubForView.usage?.recruitersLimit || 25)) * 100)}%`, height: "100%", backgroundColor: "#059669" }}></div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button onClick={() => setSelectedSubForView(null)} style={{ padding: "7px 16px", backgroundColor: "#F1F5F9", color: "#334155", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 5: ADD USER MODAL */}
            {/* ========================================================================= */}
            {showAddUserModal && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "16px" }}>
                    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", maxWidth: "480px", width: "100%", padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "12px", marginBottom: "16px" }}>
                            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#0F172A" }}>Add Platform User</h3>
                            <button onClick={() => setShowAddUserModal(false)} style={{ background: "none", border: "none", fontSize: "18px", color: "#64748B", cursor: "pointer" }}>✕</button>
                        </div>

                        <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={userForm.name}
                                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                                    placeholder="e.g. Anand Kumar"
                                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #CBD5E1", borderRadius: "7px", fontSize: "12.5px" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>Email Address *</label>
                                <input
                                    type="email"
                                    required
                                    value={userForm.email}
                                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                    placeholder="e.g. anand@college.edu"
                                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #CBD5E1", borderRadius: "7px", fontSize: "12.5px" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "3px" }}>Role</label>
                                <select
                                    value={userForm.role}
                                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #CBD5E1", borderRadius: "7px", fontSize: "12.5px" }}
                                >
                                    <option value="officer">Placement Officer</option>
                                    <option value="student">Student</option>
                                    <option value="recruiter">Corporate Recruiter</option>
                                </select>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                                <button type="button" onClick={() => setShowAddUserModal(false)} style={{ padding: "7px 14px", backgroundColor: "#F1F5F9", color: "#334155", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                                <button type="submit" style={{ padding: "7px 18px", backgroundColor: "#0B3D91", color: "#FFFFFF", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Create User</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 6: SUPPORT TICKET REPLY DRAWER */}
            {/* ========================================================================= */}
            {selectedTicketForView && (
                <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "16px" }}>
                    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", maxWidth: "560px", width: "100%", padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "12px", marginBottom: "14px" }}>
                            <div>
                                <div style={{ fontSize: "11px", fontWeight: 700, color: "#0B3D91" }}>{selectedTicketForView.ticketId} • {selectedTicketForView.collegeName}</div>
                                <h3 style={{ margin: "2px 0 0 0", fontSize: "16px", fontWeight: 800, color: "#0F172A" }}>{selectedTicketForView.subject}</h3>
                            </div>
                            <button onClick={() => setSelectedTicketForView(null)} style={{ background: "none", border: "none", fontSize: "18px", color: "#64748B", cursor: "pointer" }}>✕</button>
                        </div>

                        <div style={{ backgroundColor: "#F8FAFC", borderRadius: "8px", padding: "12px", border: "1px solid #E2E8F0", fontSize: "12.5px", color: "#334155", marginBottom: "14px", lineHeight: 1.4 }}>
                            {selectedTicketForView.message}
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", fontSize: "11.5px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Admin Response</label>
                            <textarea
                                rows={3}
                                value={ticketReplyText}
                                onChange={(e) => setTicketReplyText(e.target.value)}
                                placeholder="Type support resolution here..."
                                style={{ width: "100%", padding: "8px 10px", border: "1px solid #CBD5E1", borderRadius: "7px", fontSize: "12.5px", boxSizing: "border-box" }}
                            />
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                            <button onClick={() => setSelectedTicketForView(null)} style={{ padding: "7px 14px", backgroundColor: "#F1F5F9", color: "#334155", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                            <button onClick={() => handleReplyTicket(selectedTicketForView.id)} style={{ padding: "7px 18px", backgroundColor: "#0B3D91", color: "#FFFFFF", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Send & Resolve</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal for College Deletion */}
            {collegeToDelete && (
                <div onClick={() => setCollegeToDelete(null)} style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.75)",
                    backdropFilter: "blur(4px)",
                    zIndex: 10001,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px"
                }}>
                    <div onClick={(e) => e.stopPropagation()} style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "18px",
                        padding: "28px",
                        maxWidth: "450px",
                        width: "100%",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        border: "1px solid #e2e8f0"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                            <div style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}>
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                                    Delete College Record?
                                </h3>
                                <span style={{ fontSize: "12px", color: "#64748b" }}>
                                    Permanent Deletion
                                </span>
                            </div>
                        </div>
                        <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#334155", lineHeight: "1.6" }}>
                            Are you sure you want to delete <strong>{collegeToDelete.name}</strong> and its subscription records? This college will be permanently removed.
                        </p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <button
                                type="button"
                                onClick={() => setCollegeToDelete(null)}
                                style={{
                                    padding: "10px 18px",
                                    backgroundColor: "#f1f5f9",
                                    color: "#334155",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "10px",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const target = collegeToDelete;
                                    setCollegeToDelete(null);
                                    handleDeleteCollege(target.id, target.name);
                                }}
                                style={{
                                    padding: "10px 18px",
                                    backgroundColor: "#dc2626",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "10px",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    boxShadow: "0 2px 4px rgba(220, 38, 38, 0.25)"
                                }}
                            >
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal for User Deletion */}
            {userToDelete && (
                <div onClick={() => setUserToDelete(null)} style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.75)",
                    backdropFilter: "blur(4px)",
                    zIndex: 10001,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px"
                }}>
                    <div onClick={(e) => e.stopPropagation()} style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "18px",
                        padding: "28px",
                        maxWidth: "450px",
                        width: "100%",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        border: "1px solid #e2e8f0"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                            <div style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}>
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                                    Delete User?
                                </h3>
                                <span style={{ fontSize: "12px", color: "#64748b" }}>
                                    Permanent Deletion
                                </span>
                            </div>
                        </div>
                        <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#334155", lineHeight: "1.6" }}>
                            Are you sure you want to delete user <strong>{userToDelete.name}</strong> ({userToDelete.email})? This user account will be permanently deleted.
                        </p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <button
                                type="button"
                                onClick={() => setUserToDelete(null)}
                                style={{
                                    padding: "10px 18px",
                                    backgroundColor: "#f1f5f9",
                                    color: "#334155",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "10px",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const target = userToDelete;
                                    setUserToDelete(null);
                                    handleDeleteUser(target);
                                }}
                                style={{
                                    padding: "10px 18px",
                                    backgroundColor: "#dc2626",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "10px",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    boxShadow: "0 2px 4px rgba(220, 38, 38, 0.25)"
                                }}
                            >
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
