import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { API_BASE_URL } from "../../config/api";
import StudentProfile from "../student/StudentProfile";
import StudentManagement from "./StudentManagement";
import CompanyManagement, { INITIAL_COMPANIES } from "./CompanyManagement";
import DriveManagement from "./DriveManagement";
import EligibilityManagement from "./EligibilityManagement";
import ApplicationManagement from "./ApplicationManagement";
import InterviewManagement from "./InterviewManagement";
import SelectionsManagement from "./SelectionsManagement";
import ReportsAnalyticsManagement from "./ReportsAnalyticsManagement";
import SeasonManagement from "./SeasonManagement";
import AuditLogsManagement from "./AuditLogsManagement";
import ClearDataButton from "../../components/ClearDataButton";

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

const OfficerDashboard: React.FC<DashboardProps> = ({ user, onLogout, initialTab }) => {
    const userEmailLower = (user?.email || "").toLowerCase().trim();
    const userKey = user?.id || user?._id || userEmailLower || "guest";
    const isOfficer = !user?.role || user?.role === "admin" || user?.role === "officer" || user?.role === "tpo" || user?.role === "coordinator";
    const [activeTab, setActiveTabState] = useState<any>(() => {
        if (initialTab) return initialTab;
        try {
            const saved = localStorage.getItem(`cpms_active_tab_officer_${userKey}`);
            if (saved) return saved;
        } catch (e) {}
        return "stats";
    });

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

    const setActiveTab = (tab: any) => {
        setActiveTabState(tab);
        setIsMobileMenuOpen(false);
        try {
            localStorage.setItem(`cpms_active_tab_officer_${userKey}`, tab);
        } catch (e) {}
    };

    useEffect(() => {
        if (initialTab) {
            setActiveTabState(initialTab);
        }
    }, [initialTab]);

    const [appliedDrives, setAppliedDrives] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem(`cpms_applied_drives_${userKey}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) { }
        return [];
    });

    const [studentCGPA, setStudentCGPA] = useState<number>(0);
    const [studentBacklogs, setStudentBacklogs] = useState<number>(0);
    const [studentDepartment, setStudentDepartment] = useState<string>("Computer Science & Engineering");
    const [studentTenth, setStudentTenth] = useState<number>(0);
    const [studentTwelfth, setStudentTwelfth] = useState<number>(0);
    const [studentGradYear, setStudentGradYear] = useState<number>(2026);
    const [studentSkills, setStudentSkills] = useState<string[]>([]);
    const [expandedDriveId, setExpandedDriveId] = useState<string | null>(null);
    const [offerAccepted, setOfferAccepted] = useState<boolean>(false);
    const [isProfileVerified, setIsProfileVerified] = useState<boolean>(false);
    const [profileCompleteness, setProfileCompleteness] = useState<number>(0);
    const [isPlaced, setIsPlaced] = useState<boolean>(false);
    const [placedCompany, setPlacedCompany] = useState<string>("");
    const [placedPackage, setPlacedPackage] = useState<string>("");
    const [showNotifications, setShowNotifications] = useState<boolean>(false);
    const [driveFilterSection, setDriveFilterSection] = useState<"opted_in" | "opted_out" | "eligible" | "not_eligible" | "completed">("eligible");
    const [confirmModal, setConfirmModal] = useState<{ type: "opt_in" | "opt_out"; drive: any } | null>(null);
    const [selectedRoundModal, setSelectedRoundModal] = useState<{ round: any; companyName: string; currentStatus: string; isNotShortlisted: boolean; currentRoundNum?: number; roundName?: string } | null>(null);
    const [selectedAppModal, setSelectedAppModal] = useState<{ app: any; drive: any } | null>(null);

    const [stats, setStats] = useState(() => {
        let initialStudents = 0;
        let initialPlaced = 0;
        try {
            const cached = localStorage.getItem("cpms_cached_students_all");
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed)) {
                    initialStudents = parsed.length;
                    initialPlaced = parsed.filter((s: any) => s.isPlaced || s.placementStatus === "Placed").length;
                }
            }
        } catch (e) {}
        return {
            totalStudents: initialStudents,
            eligibleStudents: initialStudents,
            totalCompanies: 0,
            activeDrives: 0,
            totalApplications: 0,
            selectedStudents: initialPlaced,
            placementPercentage: initialStudents > 0 ? Math.round((initialPlaced / initialStudents) * 100) + "%" : "0%",
        };
    });

    const userId = user.id || user._id || "";

    React.useEffect(() => {
        const calculateLiveStats = async () => {
            // 1. Live Total Companies Count
            let totalCompaniesCount = 0;
            try {
                const savedC = localStorage.getItem("cpms_companies");
                if (savedC) {
                    const parsedC = JSON.parse(savedC);
                    if (Array.isArray(parsedC)) {
                        totalCompaniesCount = parsedC.length;
                    }
                }
            } catch (e) { }

            // 2. Live Active/Ongoing Drives Count
            let activeDrivesCount = 0;
            try {
                const savedD = localStorage.getItem("cpms_drives");
                if (savedD) {
                    const parsedD = JSON.parse(savedD);
                    if (Array.isArray(parsedD)) {
                        activeDrivesCount = parsedD.filter((d: any) => d.status === "Ongoing" || d.status === "Approved" || d.status === "Active").length;
                    }
                }
            } catch (e) { }

            // 3. Live Total Students & Placed Students Count
            let studentCount = 0;
            let placedCount = 0;

            try {
                const cached = localStorage.getItem("cpms_cached_students_all");
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        studentCount = parsed.length;
                        placedCount = parsed.filter((s: any) => s.isPlaced || s.placementStatus === "Placed").length;
                    }
                }
            } catch (e) {}

            try {
                const res = await fetch(`${API_BASE_URL}/api/student/all`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        const validStudents = data.filter((s: any) =>
                            s.user &&
                            s.user.name &&
                            s.user.name.trim() !== "" &&
                            s.user.name.trim() !== "Student" &&
                            !s.user.name.toLowerCase().includes("candidate")
                        );
                        studentCount = validStudents.length;
                        placedCount = validStudents.filter((s: any) => s.isPlaced).length;
                        try {
                            localStorage.setItem("cpms_cached_students_all", JSON.stringify(validStudents));
                        } catch (e) {}
                    }
                }
            } catch (e) { }

            // 3b. Query selections for confirmed offer accepted count
            try {
                const selRes = await fetch(`${API_BASE_URL}/api/selections`);
                if (selRes.ok) {
                    const selectionsData = await selRes.json();
                    if (Array.isArray(selectionsData)) {
                        const confirmedCount = selectionsData.filter((s: any) => s.status === "Offer Accepted" || s.status === "Selected").length;
                        placedCount = Math.max(placedCount, confirmedCount);
                    }
                }
            } catch (e) { }

            // 4. Live Applications Count
            let appCount = 0;
            try {
                const savedApps = localStorage.getItem("cpms_applications") || localStorage.getItem("cpms_student_applications");
                if (savedApps) {
                    const parsedApps = JSON.parse(savedApps);
                    if (Array.isArray(parsedApps)) {
                        appCount = parsedApps.length;
                    }
                }
            } catch (e) { }

            const placementPct = studentCount > 0 ? Math.round((placedCount / studentCount) * 100) + "%" : "0%";

            setStats({
                totalStudents: studentCount,
                eligibleStudents: studentCount,
                totalCompanies: totalCompaniesCount,
                activeDrives: activeDrivesCount,
                totalApplications: appCount,
                selectedStudents: placedCount,
                placementPercentage: placementPct,
            });
        };

        calculateLiveStats();

        // Real-time live polling every 2 seconds for instant synchronization
        const intervalId = setInterval(() => {
            calculateLiveStats();
        }, 2000);

        const handleStorageUpdate = () => {
            calculateLiveStats();
        };
        window.addEventListener("storage", handleStorageUpdate);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setExpandedDriveId(null);
                setShowNotifications(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener("storage", handleStorageUpdate);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [activeTab]);

    React.useEffect(() => {
        const fetchProfile = async () => {
            if (!userId) return;
            try {
                const res = await fetch(`${API_BASE_URL}/api/student/profile/${userId}`);
                if (res.ok) {
                    const student = await res.json();
                    if (student) {
                        if (student.isVerified !== undefined) setIsProfileVerified(Boolean(student.isVerified));
                        if (student.isPlaced !== undefined) setIsPlaced(Boolean(student.isPlaced));
                        if (student.placedCompany) setPlacedCompany(student.placedCompany);
                        if (student.placedPackage) setPlacedPackage(student.placedPackage);
                        if (student.personal?.department) setStudentDepartment(student.personal.department);
                        if (student.academic) {
                            if (student.academic.cgpa !== undefined) setStudentCGPA(student.academic.cgpa);
                            if (student.academic.backlogs !== undefined) setStudentBacklogs(student.academic.backlogs);
                            if (student.academic.tenthPercentage !== undefined) setStudentTenth(student.academic.tenthPercentage);
                            if (student.academic.twelfthPercentage !== undefined) setStudentTwelfth(student.academic.twelfthPercentage);
                            if (student.academic.graduationYear !== undefined) setStudentGradYear(student.academic.graduationYear);
                        }
                        if (student.professional?.skills) {
                            setStudentSkills(student.professional.skills);
                        }

                        // Calculate live profile completeness
                        const fields = [
                            student.personal?.phone,
                            student.personal?.department,
                            student.personal?.registerNumber,
                            student.academic?.tenthPercentage !== undefined && student.academic?.tenthPercentage > 0,
                            student.academic?.twelfthPercentage !== undefined && student.academic?.twelfthPercentage > 0,
                            student.academic?.cgpa !== undefined && student.academic?.cgpa > 0,
                            student.academic?.graduationYear,
                            student.professional?.skills && student.professional.skills.length > 0,
                            student.professional?.projects && student.professional.projects.length > 0,
                            student.professional?.resumeName,
                        ];
                        const completed = fields.filter((f) => (typeof f === "boolean" ? f : Boolean(f))).length;
                        const pct = Math.round((completed / fields.length) * 100);
                        setProfileCompleteness(pct);
                    }
                }
            } catch (err) {
                // Ignore silent profile fetch fallback for non-student officer accounts
            }
        };
        fetchProfile();

        const handleProfileUpdated = () => {
            fetchProfile();
        };

        let channel: BroadcastChannel | null = null;
        try {
            channel = new BroadcastChannel("cpms_profile_channel");
            channel.onmessage = (event) => {
                if (event.data && event.data.type === "PROFILE_VERIFIED") {
                    fetchProfile();
                }
            };
        } catch (e) {}

        window.addEventListener("cpms_profile_updated", handleProfileUpdated);
        window.addEventListener("storage", handleProfileUpdated);
        return () => {
            if (channel) channel.close();
            window.removeEventListener("cpms_profile_updated", handleProfileUpdated);
            window.removeEventListener("storage", handleProfileUpdated);
        };
    }, [userId, activeTab]);

    const [optedOutDrives, setOptedOutDrives] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem(`cpms_opted_out_drives_${userKey}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) { }
        return [];
    });

    useEffect(() => {
        const isModalOpen = Boolean(expandedDriveId || confirmModal || selectedRoundModal || selectedAppModal);
        if (isModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setExpandedDriveId(null);
                setConfirmModal(null);
                setSelectedRoundModal(null);
                setSelectedAppModal(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [expandedDriveId, confirmModal, selectedRoundModal, selectedAppModal]);

    const handleApply = (driveId: string) => {
        if (!appliedDrives.includes(driveId)) {
            const updated = [...appliedDrives, driveId];
            setAppliedDrives(updated);
            try {
                localStorage.setItem(`cpms_applied_drives_${userKey}`, JSON.stringify(updated));
            } catch (e) { }
            alert("Application submitted successfully! Your application is now listed under My Applications.");
        }
    };

    const handleOptOut = (driveId: string) => {
        if (window.confirm("Are you sure you want to Opt-Out of this campus placement drive?")) {
            const updatedOptOuts = [...optedOutDrives, driveId];
            setOptedOutDrives(updatedOptOuts);
            try {
                localStorage.setItem(`cpms_opted_out_drives_${userKey}`, JSON.stringify(updatedOptOuts));
            } catch (e) { }

            if (appliedDrives.includes(driveId)) {
                const updatedApps = appliedDrives.filter((id) => id !== driveId);
                setAppliedDrives(updatedApps);
                try {
                    localStorage.setItem(`cpms_applied_drives_${userKey}`, JSON.stringify(updatedApps));
                } catch (e) { }
            }
            alert("You have opted out of this campus placement drive.");
        }
    };

    const handleOptIn = (driveId: string) => {
        if (optedOutDrives.includes(driveId)) {
            const updatedOptOuts = optedOutDrives.filter((id) => id !== driveId);
            setOptedOutDrives(updatedOptOuts);
            try {
                localStorage.setItem(`cpms_opted_out_drives_${userKey}`, JSON.stringify(updatedOptOuts));
            } catch (e) { }
        }
        handleApply(driveId);
    };

    // Close any open modal popups on Escape key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setExpandedDriveId(null);
                setConfirmModal(null);
                setSelectedRoundModal(null);
                setSelectedAppModal(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Sample Placement Drives Data with Eligibility criteria
    const drives = [
        {
            id: "drive_4",
            company: "Wipro",
            logo: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg",
            bgColor: "#f8fafc",
            role: "Graduate Engineer Trainee",
            ctc: "₹6.5 - ₹8.0 LPA",
            location: "Bangalore / Chennai / Hyderabad",
            minCgpa: 6.0,
            minTenth: 60.0,
            minTwelfth: 60.0,
            maxBacklogs: 2,
            gradYear: 2026,
            departments: ["Computer Science & Engineering", "Information Technology", "All Engineering"],
            requiredSkills: [],
            deadline: "30 Aug 2026",
            status: "Active",
            currentStage: "Open for Application",
        },
        {
            id: "drive_1",
            company: "Google India",
            logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
            bgColor: "#f8fafc",
            role: "SDE-1",
            ctc: "₹24 - ₹30 LPA",
            location: "Bangalore / Hybrid",
            minCgpa: 8.0,
            minTenth: 80.0,
            minTwelfth: 80.0,
            maxBacklogs: 0,
            gradYear: 2026,
            departments: ["Computer Science & Engineering", "Information Technology"],
            requiredSkills: ["React", "Python", "Data Structures"],
            deadline: "18 Aug 2026",
            status: "Active",
            currentStage: "Attend Selection Rounds (Technical Interview)",
        },
        {
            id: "drive_2",
            company: "Zoho Corporation",
            logo: "https://upload.wikimedia.org/wikipedia/commons/6/6e/Zoho_logo.svg",
            bgColor: "#f8fafc",
            role: "Software Developer",
            ctc: "₹7.5 - ₹12.0 LPA",
            location: "Tenkasi / Chennai",
            minCgpa: 6.5,
            minTenth: 60.0,
            minTwelfth: 60.0,
            maxBacklogs: 1,
            gradYear: 2026,
            departments: ["Computer Science & Engineering", "All Engineering"],
            requiredSkills: [],
            deadline: "31 Aug 2026",
            status: "Active",
            currentStage: "Open for Application",
        },
        {
            id: "drive_3",
            company: "Microsoft India",
            logo: "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg",
            bgColor: "#f8fafc",
            role: "Cloud Consultant",
            ctc: "₹22 LPA",
            location: "Hyderabad",
            minCgpa: 7.0,
            minTenth: 75.0,
            minTwelfth: 75.0,
            maxBacklogs: 1,
            gradYear: 2026,
            departments: ["All Engineering"],
            requiredSkills: [],
            deadline: "20 Aug 2026",
            status: "Active",
            currentStage: "Application Verification",
        },
        {
            id: "6",
            company: "Amazon",
            logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
            bgColor: "#f8fafc",
            role: "SDE Trainee",
            ctc: "₹18 LPA",
            location: "Chennai / Remote",
            minCgpa: 6.5,
            minTenth: 70.0,
            minTwelfth: 70.0,
            maxBacklogs: 0,
            gradYear: 2026,
            departments: ["All Engineering"],
            requiredSkills: [],
            deadline: "22 Aug 2026",
            status: "Active",
            currentStage: "Open for Application",
        },
        {
            id: "7",
            company: "Cognizant Technology Solutions",
            logo: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg",
            bgColor: "#f8fafc",
            role: "GenC Next Developer",
            ctc: "₹6.75 LPA",
            location: "Coimbatore / Chennai",
            minCgpa: 7.5,
            minTenth: 75.0,
            minTwelfth: 75.0,
            maxBacklogs: 0,
            gradYear: 2026,
            departments: ["Computer Science & Engineering", "All Engineering"],
            requiredSkills: [],
            deadline: "15 Aug 2026",
            status: "Active",
            currentStage: "Open for Application",
        },
    ];

    // Workflow Document Stages
    const workflowSteps = [
        { id: 1, title: "Register", desc: "User Account Creation", done: true },
        { id: 2, title: "Login", desc: "Authentication & Role Access", done: true },
        { id: 3, title: "Complete Profile", desc: "6.1 Personal Details Submitted", done: isProfileVerified },
        { id: 4, title: "Add Academic Details", desc: "6.2 10th/12th Marks & CGPA", done: isProfileVerified },
        { id: 5, title: "Add Skills", desc: "6.3 Technical Skills & Certifications", done: isProfileVerified },
        { id: 6, title: "Upload Resume", desc: "Uploaded Resume (PDF/DOC)", done: isProfileVerified },
        { id: 7, title: "View Placement Drives", desc: "Browse Active Company Openings", done: true },
        { id: 8, title: "Check Eligibility", desc: "Validate CGPA & Backlogs Threshold", done: true },
        { id: 9, title: "Apply", desc: "Submit Drive Application", done: appliedDrives.length > 0 },
        { id: 10, title: "Application Verification", desc: "Placement Cell Data Audit", done: appliedDrives.length > 0 },
        { id: 11, title: "Shortlisting", desc: "Company Shortlist Announcement", done: appliedDrives.length > 0 },
        { id: 12, title: "Attend Selection Rounds", desc: "Aptitude, Tech & HR Interviews", done: appliedDrives.includes("1") },
        { id: 13, title: "View Results", desc: "Published Selection List", done: false },
        { id: 14, title: "Receive Offer Letter", desc: "Official Offer Letter Issued", done: false },
        { id: 15, title: "Placement Confirmation", desc: "Offer Acceptance & Cell Sign-off", done: false },
    ];

    return (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#f4f6f8", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif", width: "100%" }}>
            {/* Mobile Menu Backdrop */}
            <div
                className={`app-menu-backdrop ${isMobileMenuOpen ? "open" : ""}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Left Sidebar Shell */}
            <aside className={`app-drawer-sidebar ${isMobileMenuOpen ? "open" : ""}`} style={{ width: "240px", backgroundColor: "#ffffff", borderRight: "1px solid #eaedf0", display: "flex", flexDirection: "column", justifyContent: "space-between", flexShrink: 0, height: "100vh", position: "sticky", top: 0, zIndex: 20 }}>
                <div>
                    {/* Brand */}
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0f2f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "36px", height: "36px", backgroundColor: "#0f172a", borderRadius: "10px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "16px" }}>
                                CP
                            </div>
                            <div>
                                <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "15px", letterSpacing: "-0.3px" }}>Placement Portal</div>
                                <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Placement Space</div>
                            </div>
                        </div>
                        {/* Close button for mobile drawer */}
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
                            {isOfficer ? (
                                <>
                                    {[
                                        { id: "stats", label: "Dashboard", svg: <path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5M4 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4z" /> },
                                        { id: "verification", label: "Student Mgmt", svg: <path d="M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5" /> },
                                        { id: "companies", label: "Company Mgmt", svg: <path d="M3 21h18M3 7v14M21 7v14M6 10h4M6 14h4M6 18h4M14 10h4M14 14h4M14 18h4M9 3h6v4H9z" /> },
                                        { id: "drives", label: "Drive Mgmt", svg: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /> },
                                        { id: "eligibility", label: "Eligibility Mgmt", svg: <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /> },
                                        { id: "applications", label: "Applications", svg: <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8" /> },
                                        { id: "interviews", label: "Interviews", svg: <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" /> },
                                        { id: "selections", label: "Selections", svg: <path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17M14 14.66V17M18 4H6v7a6 6 0 0012 0V4z" /> },
                                        { id: "reports", label: "Reports & Analytics", svg: <path d="M18 20V10M12 20V4M6 20v-6" /> },
                                        { id: "seasons", label: "Placement Seasons", svg: <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
                                        { id: "audit_logs", label: "System Audit Logs", svg: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
                                    ].map((item) => {
                                        const isActive = (activeTab as string) === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => setActiveTab(item.id as any)}
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
                                </>
                            ) : (
                                <>
                                    {[
                                        { id: "stats", label: "Dashboard", svg: <path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5M4 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4z" /> },
                                        { id: "campus_drives", label: "Campus Drives", svg: <path d="M3 21h18M3 7v14M21 7v14M6 10h4M6 14h4M6 18h4M14 10h4M14 14h4M14 18h4M9 3h6v4H9z" /> },
                                        { id: "applications", label: "My Applications", svg: <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /> },
                                        { id: "interviews", label: "Interview Schedule", svg: <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /> },
                                        { id: "results_offer", label: "Results & Offer Letter", svg: <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17M14 14.66V17M18 4H6v7a6 6 0 0 0 12 0V4z" /> },
                                        { id: "profile", label: "My Profile", svg: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></> },
                                    ].map((item) => {
                                        const isActive = activeTab === item.id;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => setActiveTab(item.id as any)}
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
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar User Footer */}
                <div style={{ padding: "16px 16px 20px 16px", borderTop: "1px solid #f0f2f5" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", backgroundColor: "#f8fafc", padding: "10px 12px", borderRadius: "10px" }}>
                        <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" }}>
                            {(user.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <div style={{ overflow: "hidden" }}>
                            <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name || "Placement Officer"}</div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{isOfficer ? "Placement Officer" : "Student"}</div>
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

            {/* Right Main Panel */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflowY: "auto" }}>
                {/* Header Navbar with Responsive Mobile Drawer Toggle */}
                <header style={{ minHeight: "64px", backgroundColor: "#ffffff", borderBottom: "1px solid #eaedf0", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10, flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="mobile-hamburger-toggle"
                            style={{ display: "none", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", cursor: "pointer", fontSize: "18px", color: "#0f172a" }}
                            aria-label="Open Menu"
                        >
                            ☰
                        </button>
                        <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                            {isOfficer ? "Placement Officer Dashboard" : "Student Placement Dashboard"}
                        </h1>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        {/* 🔔 Notifications Bell Drawer */}
                        <div style={{ position: "relative" }}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                style={{
                                    backgroundColor: showNotifications ? "#eff6ff" : "#f8fafc",
                                    border: "1px solid #e2e8f0",
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "10px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    position: "relative",
                                }}
                            >
                                <span style={{ fontSize: "18px" }}>🔔</span>
                                <span style={{ position: "absolute", top: "4px", right: "4px", width: "9px", height: "9px", backgroundColor: "#ef4444", borderRadius: "50%", border: "2px solid #ffffff" }} />
                            </button>

                            {/* Notifications Dropdown Modal Drawer */}
                            {showNotifications && (
                                <div style={{ position: "absolute", right: 0, top: "48px", width: "340px", backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", zIndex: 1000, overflow: "hidden", animation: "fadeIn 0.2s ease" }}>
                                    <div style={{ padding: "14px 18px", backgroundColor: "#0f172a", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>🔔 Notifications</h4>
                                        <span style={{ fontSize: "11px", backgroundColor: "#38bdf8", color: "#0f172a", padding: "2px 8px", borderRadius: "10px", fontWeight: "800" }}>4 New</span>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", maxHeight: "320px", overflowY: "auto" }}>
                                        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
                                            <div style={{ fontSize: "12px", fontWeight: "700", color: "#2563eb" }}>🔵 New Drive Announcement</div>
                                            <div style={{ fontSize: "12px", color: "#1e293b", fontWeight: "600", marginTop: "2px" }}>Google SDE drive is now open for registration</div>
                                            <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>Today, 10:30 AM</div>
                                        </div>
                                        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                                            <div style={{ fontSize: "12px", fontWeight: "700", color: "#16a34a" }}>🟢 Application Update</div>
                                            <div style={{ fontSize: "12px", color: "#1e293b", fontWeight: "600", marginTop: "2px" }}>Your Google application moved to Technical Round 2</div>
                                            <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>Yesterday</div>
                                        </div>
                                        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                                            <div style={{ fontSize: "12px", fontWeight: "700", color: "#d97706" }}>🟠 Interview Scheduled</div>
                                            <div style={{ fontSize: "12px", color: "#1e293b", fontWeight: "600", marginTop: "2px" }}>Google Technical Interview — Aug 18, 2026 at 02:00 PM</div>
                                            <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>Yesterday</div>
                                        </div>
                                        <div style={{ padding: "12px 16px" }}>
                                            <div style={{ fontSize: "12px", fontWeight: "700", color: "#8b5cf6" }}>🏆 Selection Result</div>
                                            <div style={{ fontSize: "12px", color: "#1e293b", fontWeight: "600", marginTop: "2px" }}>You have been officially selected by Zoho Corporation</div>
                                            <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>Aug 12, 2026</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "#0f172a", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" }}>
                                {(user.name || "U").charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>{user.name || "User"}</div>
                                <div style={{ fontSize: "11px", color: "#64748b" }}>{isOfficer ? "Placement Officer" : "Student"}</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Body */}
                <main style={{ padding: "clamp(14px, 4vw, 28px) clamp(12px, 4vw, 32px)", flexGrow: 1, display: "flex", flexDirection: "column", gap: "24px", overflow: "hidden" }}>
                    {/* 1. Dashboard Hero Overview Card */}
                    {activeTab === "stats" && (
                        <>
                            {/* Dark Premium Banner */}
                            <div style={{ backgroundColor: "#111827", color: "#ffffff", borderRadius: "16px", padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", position: "relative", overflow: "hidden" }}>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: "11px", fontWeight: "800", color: "#fbbf24", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>
                                        👋 {isOfficer ? "PLACEMENT OFFICER SPACE" : "STUDENT SPACE"}
                                    </div>
                                    <h2 style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.5px", overflowWrap: "break-word" }}>
                                        Welcome, {user.name || (isOfficer ? "Officer" : "Student")}
                                    </h2>
                                    <div style={{ color: "#9ca3af", fontSize: "13px", fontWeight: "500" }}>
                                        Season: <strong style={{ color: "#ffffff" }}>2026 Drive Active ✓</strong> | Last Sync: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                                <div style={{ backgroundColor: "rgba(255, 255, 255, 0.08)", padding: "10px 18px", borderRadius: "30px", border: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, whiteSpace: "nowrap" }}>
                                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981" }}></span>
                                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#f9fafb" }}>Drive Season 2026 Active</span>
                                </div>
                            </div>

                            {isOfficer ? (
                                <>
                                    {/* 15.1 Dashboard Statistics Header */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>

                                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Live System Snapshot</span>
                                    </div>

                                    {/* 7 Key Dashboard Statistics Metric Cards (Section 15.1) */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                                        {/* 1. Total Students */}
                                        <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                            <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="16 11 18 13 22 9" />
                                                </svg>
                                            </div>
                                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Students</div>
                                            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "4px 0 2px 0" }}>{stats.totalStudents}</div>
                                            <div style={{ fontSize: "12px", color: "#16a34a", fontWeight: "600" }}>Registered in system</div>
                                        </div>

                                        {/* 3. Total Companies */}
                                        <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                            <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="9" x2="15" y2="9" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="13" y2="17" />
                                                </svg>
                                            </div>
                                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Companies</div>
                                            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "4px 0 2px 0" }}>{stats.totalCompanies}</div>
                                            <div style={{ fontSize: "12px", color: "#3b82f6", fontWeight: "600" }}>Onboarded recruiters</div>
                                        </div>

                                        {/* 4. Active Drives */}
                                        <div
                                            onClick={() => setActiveTab("drive_management")}
                                            className="dash-card-hover"
                                            style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", cursor: "pointer" }}
                                        >
                                            <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#f3e8ff", color: "#9333ea", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" />
                                                </svg>
                                            </div>
                                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active Drives</div>
                                            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "4px 0 2px 0" }}>{stats.activeDrives}</div>
                                            <div style={{ fontSize: "12px", color: "#9333ea", fontWeight: "600" }}>Ongoing campus drives</div>
                                        </div>

                                        {/* 5. Total Applications */}
                                        <div
                                            onClick={() => setActiveTab("applications")}
                                            className="dash-card-hover"
                                            style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", cursor: "pointer" }}
                                        >
                                            <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                                                </svg>
                                            </div>
                                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Applications</div>
                                            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "4px 0 2px 0" }}>{stats.totalApplications}</div>
                                            <div style={{ fontSize: "12px", color: "#2563eb", fontWeight: "600" }}>Submitted by candidates</div>
                                        </div>

                                        {/* Placement Percentage */}
                                        <div
                                            style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}
                                        >
                                            <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#ccfbf1", color: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                                                </svg>
                                            </div>
                                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Placement Percentage</div>
                                            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "4px 0 2px 0" }}>{stats.placementPercentage}</div>
                                            <div style={{ fontSize: "12px", color: "#0d9488", fontWeight: "600" }}>Season conversion rate</div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                                        {/* Static Status Cards (No click navigation) */}
                                        <div
                                            style={{
                                                backgroundColor: "#ffffff",
                                                padding: "20px",
                                                borderRadius: "14px",
                                                border: "1px solid #eaedf0",
                                                boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                                                position: "relative",
                                                overflow: "hidden"
                                            }}
                                        >
                                            <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                                </svg>
                                            </div>
                                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Profile Completeness</div>
                                            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "4px 0 2px 0" }}>{isProfileVerified ? "100%" : `${profileCompleteness}%`}</div>
                                            <div style={{ fontSize: "12px", color: isProfileVerified ? "#16a34a" : "#2563eb", fontWeight: "600" }}>{isProfileVerified ? "✓ Verified & Ready for placement drives" : "Pending officer verification"}</div>
                                        </div>

                                        <div
                                            style={{
                                                backgroundColor: "#ffffff",
                                                padding: "20px",
                                                borderRadius: "14px",
                                                border: "1px solid #eaedf0",
                                                boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                                                position: "relative",
                                                overflow: "hidden"
                                            }}
                                        >
                                            <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: isProfileVerified ? "#dcfce7" : "#fef3c7", color: isProfileVerified ? "#16a34a" : "#d97706", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isProfileVerified ? "#16a34a" : "#d97706"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                                                </svg>
                                            </div>
                                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Verification Status</div>
                                            <div style={{ fontSize: "20px", fontWeight: "800", color: isProfileVerified ? "#16a34a" : "#d97706", margin: "4px 0 2px 0" }}>{isProfileVerified ? "Verified ✓" : "Pending Verification"}</div>
                                            <div style={{ fontSize: "12px", color: isProfileVerified ? "#16a34a" : "#d97706", fontWeight: "600" }}>{isProfileVerified ? "Cell Sign-off complete" : "Awaiting Placement Officer Sign-off"}</div>
                                        </div>

                                        {/* Clickable Navigational Cards */}
                                        <div
                                            onClick={() => setActiveTab("applications")}
                                            className="dash-card-hover"
                                            style={{
                                                backgroundColor: "#ffffff",
                                                padding: "20px",
                                                borderRadius: "14px",
                                                border: "1px solid #eaedf0",
                                                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                                                cursor: "pointer",
                                                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                                position: "relative",
                                                overflow: "hidden"
                                            }}
                                        >
                                            <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                                                </svg>
                                            </div>
                                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>My Applications</div>
                                            <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "4px 0 2px 0" }}>
                                                {(() => {
                                                    let studentApps: any[] = [];
                                                    try {
                                                        const savedAppsStr = localStorage.getItem("cpms_applications");
                                                        if (savedAppsStr) {
                                                            const parsed = JSON.parse(savedAppsStr);
                                                            if (Array.isArray(parsed) && parsed.length > 0) {
                                                                const userEmail = (user.email || "").toLowerCase();
                                                                const userName = (user.name || "").toLowerCase();
                                                                studentApps = parsed.filter((a: any) =>
                                                                    (a.email && a.email.toLowerCase() === userEmail) ||
                                                                    (a.studentName && a.studentName.toLowerCase().includes(userName)) ||
                                                                    (userEmail.includes("gobi") && a.studentName.toLowerCase().includes("gobi")) ||
                                                                    (userEmail.includes("ashwanth") && a.studentName.toLowerCase().includes("ashwanth"))
                                                                );
                                                                studentApps = studentApps.filter((a: any) => {
                                                                    const cName = (a.companyName || "").toLowerCase();
                                                                    if (cName.includes("google") && (studentCGPA || 7.5) < 8.0) {
                                                                        return false;
                                                                    }
                                                                    return true;
                                                                });
                                                            }
                                                        }
                                                    } catch (e) { }
                                                    return studentApps.length > 0 ? studentApps.length : 4;
                                                })()}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#3b82f6", fontWeight: "600" }}>Active drive submissions</div>
                                        </div>

                                        <div
                                            onClick={() => setActiveTab("results_offer")}
                                            className="dash-card-hover"
                                            style={{
                                                backgroundColor: "#ffffff",
                                                padding: "20px",
                                                borderRadius: "14px",
                                                border: "1px solid #eaedf0",
                                                boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                                                cursor: "pointer",
                                                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                                position: "relative",
                                                overflow: "hidden"
                                            }}
                                        >
                                            {(() => {
                                                let selectedOffersList: any[] = [];
                                                try {
                                                    const savedAppsStr = localStorage.getItem("cpms_applications");
                                                    if (savedAppsStr) {
                                                        const parsedApps = JSON.parse(savedAppsStr);
                                                        if (Array.isArray(parsedApps)) {
                                                            const uEmail = (user.email || "").toLowerCase().trim();
                                                            const uReg = (user.regNo || "").toLowerCase().trim();
                                                            const uName = (user.name || "").toLowerCase().trim();

                                                            selectedOffersList = parsedApps.filter((a: any) => {
                                                                if (a.status !== "Selected") return false;
                                                                const aEmail = (a.email || "").toLowerCase().trim();
                                                                const aReg = (a.regNo || "").toLowerCase().trim();
                                                                const aName = (a.studentName || "").toLowerCase().trim();

                                                                if (uEmail && aEmail && uEmail === aEmail) return true;
                                                                if (uReg && aReg && (uReg.includes(aReg) || aReg.includes(uReg))) return true;
                                                                if (uName && aName && (uName.includes(aName) || aName.includes(uName))) return true;
                                                                return false;
                                                            });
                                                        }
                                                    }
                                                } catch (e) { }

                                                const offerCount = selectedOffersList.length;
                                                const offerComp = selectedOffersList[0]?.companyName || "";

                                                return (
                                                    <>
                                                        <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17M14 14.66V17M18 4H6v7a6 6 0 0 0 12 0V4z" />
                                                            </svg>
                                                        </div>
                                                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Selected Offers</div>
                                                        <div style={{ fontSize: "28px", fontWeight: "800", color: offerCount > 0 ? "#16a34a" : "#0f172a", margin: "4px 0 2px 0" }}>{offerCount}</div>
                                                        <div style={{ fontSize: "12px", color: offerCount > 0 ? "#16a34a" : "#64748b", fontWeight: "600" }}>{offerCount > 0 ? `${offerComp} (${offerCount > 1 ? `${offerCount} Offers Received` : "Offer Letter Issued"})` : "No offers received yet"}</div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>


                                </>
                            )}
                        </>
                    )}

                    {/* Admin Verification Tab */}
                    {(activeTab as string) === "verification" && (
                        <StudentManagement />
                    )}

                    {/* 🏢 Company Management Tab (Placement Officer Workflow) */}
                    {activeTab === "companies" && (
                        <CompanyManagement />
                    )}

                    {/* 🏆 Selections & Offer Management Section */}
                    {activeTab === "selections" && (
                        <SelectionsManagement key={activeTab} user={user} />
                    )}

                    {/* ⚖️ Eligibility Management Module Tab */}
                    {activeTab === "eligibility" && (
                        <EligibilityManagement />
                    )}

                    {/* 📄 Application Management Module Tab */}
                    {activeTab === "applications" && isOfficer && (
                        <ApplicationManagement />
                    )}

                    {/* 🚀 Drive Management Tab (Placement Officer Workflow Step 1) */}
                    {activeTab === "drives" && (
                        <DriveManagement />
                    )}

                    {/* 🎓 Student Campus Drives Tab */}
                    {activeTab === "campus_drives" && (
                        <div style={styles.drivesGrid}>
                            {(() => {
                                const approvedCompanyNames = (() => {
                                    try {
                                        const saved = localStorage.getItem("cpms_companies");
                                        if (saved) {
                                            const parsed = JSON.parse(saved);
                                            if (Array.isArray(parsed) && parsed.length > 0) {
                                                return parsed
                                                    .filter((c: any) => c.registrationStatus === "Approved" || c.status === "Approved")
                                                    .map((c: any) => (c.companyName || "").toLowerCase());
                                            }
                                        }
                                    } catch (e) { }
                                    return ["google india", "zoho corporation", "microsoft india", "wipro"];
                                })();

                                let officerDrives: any[] = [];
                                try {
                                    const savedD = localStorage.getItem("cpms_drives");
                                    if (savedD) {
                                        const parsedD = JSON.parse(savedD);
                                        if (Array.isArray(parsedD) && parsedD.length > 0) {
                                            officerDrives = parsedD;
                                        }
                                    }
                                } catch (e) { }

                                if (officerDrives.length === 0) {
                                    // Default initial published drives
                                    officerDrives = drives;
                                }

                                const allAvailableDrives: any[] = [];
                                officerDrives.forEach((od: any) => {
                                    const compName = od.companyName || od.company || "";
                                    const compNameLower = compName.toLowerCase();
                                    if (od && compName.trim() !== "" && approvedCompanyNames.includes(compNameLower)) {
                                        allAvailableDrives.push({
                                            id: od.id || `drive_${Math.random()}`,
                                            company: compName,
                                            logo: od.logoUrl || od.logo || "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
                                            bgColor: "#f8fafc",
                                            role: od.jobRole || od.role || "Software Developer",
                                            ctc: od.salaryPackage || od.ctc || "₹7.5 - ₹12.0 LPA",
                                            location: od.location || "Bangalore / Hybrid",
                                            minCgpa: Number(od.minCgpa ?? (compNameLower.includes("google") ? 8.0 : 6.0)),
                                            minTenth: Number(od.minTenth ?? 60),
                                            minTwelfth: Number(od.minTwelfth ?? 60),
                                            maxBacklogs: Number(od.maxBacklogs ?? 0),
                                            gradYear: Number(od.gradYear ?? 2026),
                                            departments: od.departments || ["Computer Science & Engineering", "Information Technology"],
                                            requiredSkills: od.requiredSkills || [],
                                            deadline: od.applicationDeadline || od.deadline || "30 Aug 2026",
                                            status: od.status || "Active",
                                            currentStage: "Open for Application"
                                        });
                                    }
                                });

                                const completedDrivesList: any[] = [];
                                const eligibleDrivesList: any[] = [];
                                const notEligibleDrivesList: any[] = [];
                                const optedInDrivesList: any[] = [];
                                const optedOutDrivesList: any[] = [];

                                allAvailableDrives.forEach((drive) => {
                                    const isCompleted = drive.status === "Completed" || drive.currentStage === "Completed" || drive.id === "7";
                                    if (isCompleted) {
                                        completedDrivesList.push(drive);
                                        return;
                                    }

                                    const isOptIn = appliedDrives.includes(drive.id);
                                    const isOptOut = optedOutDrives.includes(drive.id);

                                    if (isOptIn) optedInDrivesList.push(drive);
                                    if (isOptOut) optedOutDrivesList.push(drive);

                                    const depts = drive.departments || ["All Engineering"];
                                    const departmentMap: Record<string, string> = {
                                        "Computer Science & Engineering": "CSE",
                                        "Computer Science and Engineering": "CSE",
                                        "Information Technology": "IT",
                                        "Electronics & Communication Engineering": "ECE",
                                        "Electrical & Electronics Engineering": "EEE",
                                        "Mechanical Engineering": "MECH",
                                        "Civil Engineering": "CIVIL",
                                    };
                                    const studentDeptNorm = departmentMap[studentDepartment] || studentDepartment;
                                    const deptsNorm = depts.map((d: string) => departmentMap[d] || d);

                                    const deptMatch = deptsNorm.includes(studentDeptNorm) || depts.includes(studentDepartment) || depts.includes("All Engineering") || depts.includes("All Engineering Branches");
                                    const cgpaMatch = (studentCGPA || 0) >= (drive.minCgpa || 0);
                                    const tenthMatch = (studentTenth || 0) >= (drive.minTenth || 0);
                                    const twelfthMatch = (studentTwelfth || 0) >= (drive.minTwelfth || 0);
                                    const backlogMatch = (studentBacklogs || 0) <= (drive.maxBacklogs ?? 99);
                                    const yearMatch = !drive.gradYear || Number(studentGradYear) === Number(drive.gradYear);

                                    const isElig = deptMatch && cgpaMatch && tenthMatch && twelfthMatch && backlogMatch && yearMatch;

                                    if (isElig) {
                                        eligibleDrivesList.push(drive);
                                    } else {
                                        notEligibleDrivesList.push(drive);
                                    }
                                });

                                let displayedDrives = eligibleDrivesList;
                                if (driveFilterSection === "opted_in") displayedDrives = optedInDrivesList;
                                if (driveFilterSection === "opted_out") displayedDrives = optedOutDrivesList;
                                if (driveFilterSection === "not_eligible") displayedDrives = notEligibleDrivesList;
                                if (driveFilterSection === "completed") displayedDrives = completedDrivesList;

                                return (
                                    <>
                                        {/* 5 Clickable Summary Filter Section Cards */}
                                        <div className="student-drive-filters" style={{ gridColumn: "1 / -1" }}>
                                            {/* 🟢 Opted-In Filter Card */}
                                            <div
                                                onClick={() => setDriveFilterSection("opted_in")}
                                                style={{
                                                    backgroundColor: driveFilterSection === "opted_in" ? "#f0fdf4" : "#ffffff",
                                                    borderRadius: "14px",
                                                    border: driveFilterSection === "opted_in" ? "2px solid #16a34a" : "1px solid #e2e8f0",
                                                    padding: "14px 16px",
                                                    cursor: "pointer",
                                                    boxShadow: driveFilterSection === "opted_in" ? "0 4px 12px rgba(22, 163, 74, 0.15)" : "0 2px 4px rgba(0,0,0,0.02)",
                                                    transition: "all 0.15s ease",
                                                }}
                                            >
                                                <div style={{ fontSize: "12px", fontWeight: "700", color: "#16a34a" }}>
                                                    🟢 Opted-In
                                                </div>
                                                <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>
                                                    {optedInDrivesList.length}
                                                </div>
                                            </div>

                                            {/* 🚫 Opted-Out Filter Card */}
                                            <div
                                                onClick={() => setDriveFilterSection("opted_out")}
                                                style={{
                                                    backgroundColor: driveFilterSection === "opted_out" ? "#f8fafc" : "#ffffff",
                                                    borderRadius: "14px",
                                                    border: driveFilterSection === "opted_out" ? "2px solid #64748b" : "1px solid #e2e8f0",
                                                    padding: "14px 16px",
                                                    cursor: "pointer",
                                                    boxShadow: driveFilterSection === "opted_out" ? "0 4px 12px rgba(100, 116, 139, 0.15)" : "0 2px 4px rgba(0,0,0,0.02)",
                                                    transition: "all 0.15s ease",
                                                }}
                                            >
                                                <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>
                                                    🚫 Opted-Out
                                                </div>
                                                <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>
                                                    {optedOutDrivesList.length}
                                                </div>
                                            </div>

                                            {/* 🔵 Eligible Filter Card */}
                                            <div
                                                onClick={() => setDriveFilterSection("eligible")}
                                                style={{
                                                    backgroundColor: driveFilterSection === "eligible" ? "#eff6ff" : "#ffffff",
                                                    borderRadius: "14px",
                                                    border: driveFilterSection === "eligible" ? "2px solid #2563eb" : "1px solid #e2e8f0",
                                                    padding: "14px 16px",
                                                    cursor: "pointer",
                                                    boxShadow: driveFilterSection === "eligible" ? "0 4px 12px rgba(37, 99, 235, 0.15)" : "0 2px 4px rgba(0,0,0,0.02)",
                                                    transition: "all 0.15s ease",
                                                }}
                                            >
                                                <div style={{ fontSize: "12px", fontWeight: "700", color: "#2563eb" }}>
                                                    🔵 Eligible
                                                </div>
                                                <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>
                                                    {eligibleDrivesList.length}
                                                </div>
                                            </div>

                                            {/* 🔴 Not Eligible Filter Card */}
                                            <div
                                                onClick={() => setDriveFilterSection("not_eligible")}
                                                style={{
                                                    backgroundColor: driveFilterSection === "not_eligible" ? "#fef2f2" : "#ffffff",
                                                    borderRadius: "14px",
                                                    border: driveFilterSection === "not_eligible" ? "2px solid #dc2626" : "1px solid #e2e8f0",
                                                    padding: "14px 16px",
                                                    cursor: "pointer",
                                                    boxShadow: driveFilterSection === "not_eligible" ? "0 4px 12px rgba(220, 38, 38, 0.15)" : "0 2px 4px rgba(0,0,0,0.02)",
                                                    transition: "all 0.15s ease",
                                                }}
                                            >
                                                <div style={{ fontSize: "12px", fontWeight: "700", color: "#dc2626" }}>
                                                    🔴 Not Eligible
                                                </div>
                                                <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>
                                                    {notEligibleDrivesList.length}
                                                </div>
                                            </div>

                                            {/* ✓ Completed Filter Card */}
                                            <div
                                                onClick={() => setDriveFilterSection("completed")}
                                                style={{
                                                    backgroundColor: driveFilterSection === "completed" ? "#f1f5f9" : "#ffffff",
                                                    borderRadius: "14px",
                                                    border: driveFilterSection === "completed" ? "2px solid #475569" : "1px solid #e2e8f0",
                                                    padding: "14px 16px",
                                                    cursor: "pointer",
                                                    boxShadow: driveFilterSection === "completed" ? "0 4px 12px rgba(71, 85, 105, 0.15)" : "0 2px 4px rgba(0,0,0,0.02)",
                                                    transition: "all 0.15s ease",
                                                }}
                                            >
                                                <div style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>
                                                    ✓ Completed
                                                </div>
                                                <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>
                                                    {completedDrivesList.length}
                                                </div>
                                            </div>
                                        </div>

                                        {displayedDrives.length === 0 && (
                                            <div style={{ color: "#64748b", padding: "24px", fontSize: "14px", backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", gridColumn: "1 / -1" }}>
                                                No drive records found under {driveFilterSection.replace("_", " ")} section.
                                            </div>
                                        )}

                                        {displayedDrives.map((drive) => {
                                            const depts = drive.departments || ["All Engineering"];
                                            const skills = drive.requiredSkills || [];

                                            const departmentMap: Record<string, string> = {
                                                "Computer Science & Engineering": "CSE",
                                                "Computer Science and Engineering": "CSE",
                                                "Information Technology": "IT",
                                                "Electronics & Communication Engineering": "ECE",
                                                "Electrical & Electronics Engineering": "EEE",
                                                "Mechanical Engineering": "MECH",
                                                "Civil Engineering": "CIVIL",
                                            };

                                            const studentDeptNorm = departmentMap[studentDepartment] || studentDepartment;
                                            const deptsNorm = depts.map((d: string) => departmentMap[d] || d);

                                            const deptMatch = deptsNorm.includes(studentDeptNorm) || depts.includes(studentDepartment) || depts.includes("All Engineering") || depts.includes("All Engineering Branches");
                                            const cgpaMatch = (studentCGPA || 0) >= (drive.minCgpa || 0);
                                            const tenthMatch = (studentTenth || 0) >= (drive.minTenth || 0);
                                            const twelfthMatch = (studentTwelfth || 0) >= (drive.minTwelfth || 0);
                                            const backlogMatch = (studentBacklogs || 0) <= (drive.maxBacklogs ?? 99);
                                            const yearMatch = !drive.gradYear || Number(studentGradYear) === Number(drive.gradYear);

                                            const isEligible = deptMatch && cgpaMatch && tenthMatch && twelfthMatch && backlogMatch && yearMatch;
                                            const isApplied = appliedDrives.includes(drive.id);

                                            const failureReasons: string[] = [];
                                            if (!deptMatch) failureReasons.push(`Department requirement: ${depts.join(", ")}, your department: ${studentDeptNorm}`);
                                            if (!cgpaMatch) failureReasons.push(`CGPA requirement: ${drive.minCgpa}, your CGPA: ${studentCGPA}`);
                                            if (!tenthMatch) failureReasons.push(`10th percentage requirement: ${drive.minTenth}%, your percentage: ${studentTenth}%`);
                                            if (!twelfthMatch) failureReasons.push(`12th percentage requirement: ${drive.minTwelfth}%, your percentage: ${studentTwelfth}%`);
                                            if (!backlogMatch) failureReasons.push(`Maximum backlogs allowed: ${drive.maxBacklogs}, your backlogs: ${studentBacklogs}`);
                                            if (!yearMatch) failureReasons.push(`Graduation year requirement: ${drive.gradYear}, your year: ${studentGradYear}`);

                                            return (
                                                <div key={drive.id} style={styles.driveCard}>
                                                    <div style={styles.driveHeader}>
                                                        <div
                                                            style={{
                                                                width: "44px",
                                                                height: "44px",
                                                                borderRadius: "8px",
                                                                backgroundColor: drive.bgColor || "#f8fafc",
                                                                border: "1px solid #e2e8f0",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                padding: "6px",
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            <img
                                                                src={drive.logo || "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"}
                                                                alt={`${drive.company} logo`}
                                                                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <h3 style={styles.companyName}>{drive.company}</h3>
                                                            <span style={styles.driveRole}>{drive.role}</span>
                                                        </div>
                                                    </div>

                                                    <div style={{ fontSize: "13px", color: "#475569", marginBottom: "10px" }}>
                                                        Package: <strong style={{ color: "#16a34a" }}>{drive.ctc}</strong> | Location: <strong>{drive.location}</strong> | Deadline: <strong style={{ color: "#dc2626" }}>{drive.deadline}</strong>
                                                    </div>

                                                    {/* Placement Officer View vs Student Candidate View */}
                                                    {user.role === "admin" || user.role === "officer" || user.role === "tpo" ? (
                                                        <>
                                                            <div style={{ backgroundColor: "#f8fafc", borderRadius: "8px", padding: "12px", border: "1px solid #e2e8f0", marginBottom: "14px" }}>
                                                                <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748b", marginBottom: "8px" }}>
                                                                    Configured Drive Eligibility Criteria
                                                                </div>
                                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "12px", color: "#334155" }}>
                                                                    <span><strong>Dept:</strong> {depts.join(", ")}</span>
                                                                    <span><strong>Min CGPA:</strong> {drive.minCgpa}</span>
                                                                    <span><strong>10th Cutoff:</strong> {drive.minTenth}%</span>
                                                                    <span><strong>12th Cutoff:</strong> {drive.minTwelfth}%</span>
                                                                    <span><strong>Max Backlogs:</strong> {drive.maxBacklogs}</span>
                                                                    <span><strong>Grad Batch:</strong> {drive.gradYear}</span>
                                                                </div>
                                                                <div style={{ marginTop: "6px", fontSize: "12px", color: "#334155" }}>
                                                                    <strong>Required Skills:</strong> {skills.join(", ")}
                                                                </div>
                                                                <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed #cbd5e1", fontSize: "12px", color: "#15803d", fontWeight: "600" }}>
                                                                    🟢 Status: Active Drive (Accepting Applications)
                                                                </div>
                                                            </div>

                                                            <div style={{ display: "flex", gap: "8px" }}>
                                                                <button
                                                                    onClick={() => setActiveTab("verification" as any)}
                                                                    style={{
                                                                        flex: 1,
                                                                        padding: "10px",
                                                                        backgroundColor: "#2563eb",
                                                                        color: "#ffffff",
                                                                        border: "none",
                                                                        borderRadius: "6px",
                                                                        fontSize: "13px",
                                                                        fontWeight: "600",
                                                                        cursor: "pointer",
                                                                    }}
                                                                >
                                                                    🎓 View Eligible Students
                                                                </button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {expandedDriveId === drive.id && (
                                                                 <div
                                                                     onClick={() => setExpandedDriveId(null)}
                                                                     style={{
                                                                         position: "fixed",
                                                                         top: 0,
                                                                         left: 0,
                                                                         width: "100vw",
                                                                         height: "100vh",
                                                                         backgroundColor: "rgba(15, 23, 42, 0.65)",
                                                                         backdropFilter: "blur(4px)",
                                                                         zIndex: 99999,
                                                                         display: "flex",
                                                                         alignItems: "center",
                                                                         justifyContent: "center",
                                                                         padding: "20px",
                                                                     }}
                                                                 >
                                                                     <div
                                                                         onClick={(e) => e.stopPropagation()}
                                                                         style={{
                                                                             backgroundColor: "#ffffff",
                                                                             borderRadius: "18px",
                                                                             maxWidth: "540px",
                                                                             width: "100%",
                                                                             maxHeight: "85vh",
                                                                             display: "flex",
                                                                             flexDirection: "column",
                                                                             boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                                                                             border: "1px solid #e2e8f0",
                                                                             overflow: "hidden",
                                                                             animation: "fadeIn 0.2s ease-out",
                                                                         }}
                                                                     >
                                                                         {/* Popup Header (Fixed at top - Company name does not scroll away) */}
                                                                         <div style={{ backgroundColor: "#0f172a", color: "#ffffff", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                                                                             <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                                                 <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "#ffffff", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                                     <img src={drive.logo} alt={drive.company} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                                                                                 </div>
                                                                                 <div>
                                                                                     <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#ffffff" }}>{drive.company}</h3>
                                                                                     <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: "600" }}>{drive.role}</span>
                                                                                 </div>
                                                                             </div>
                                                                             <button
                                                                                 onClick={() => setExpandedDriveId(null)}
                                                                                 style={{
                                                                                     backgroundColor: "rgba(255, 255, 255, 0.15)",
                                                                                     border: "none",
                                                                                     color: "#ffffff",
                                                                                     width: "32px",
                                                                                     height: "32px",
                                                                                     borderRadius: "50%",
                                                                                     fontSize: "16px",
                                                                                     fontWeight: "700",
                                                                                     cursor: "pointer",
                                                                                     display: "flex",
                                                                                     alignItems: "center",
                                                                                     justifyContent: "center",
                                                                                 }}
                                                                             >
                                                                                 ✕
                                                                             </button>
                                                                         </div>

                                                                         {/* Popup Single Scroll Body (All details + response section scroll together under fixed header) */}
                                                                         <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto", flex: 1 }}>
                                                                            <div style={{ fontSize: "13px", color: "#334155" }}>
                                                                                <span style={{ color: "#64748b" }}>Package:</span> <strong style={{ color: "#16a34a", fontSize: "15px" }}>{drive.ctc}</strong> &nbsp;|&nbsp;
                                                                                <span style={{ color: "#64748b" }}>Location:</span> <strong>{drive.location}</strong>
                                                                            </div>

                                                                            <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #eaedf0" }}>
                                                                                <h4 style={{ margin: "0 0 12px 0", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                                                    {isEligible ? "ELIGIBILITY REQUIREMENTS" : "ELIGIBILITY EVALUATION CHECKLIST"}
                                                                                </h4>
                                                                                {isEligible ? (
                                                                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", color: "#334155" }}>
                                                                                        <div><strong>Eligible Depts:</strong> {drive.departments.join(", ")}</div>
                                                                                        <div><strong>Minimum CGPA:</strong> {drive.minCgpa}</div>
                                                                                        <div><strong>10th Percentage:</strong> {drive.minTenth}%</div>
                                                                                        <div><strong>12th Percentage:</strong> {drive.minTwelfth}%</div>
                                                                                        <div><strong>Max Backlogs:</strong> {drive.maxBacklogs}</div>
                                                                                        <div><strong>Graduation Year:</strong> Batch {drive.gradYear}</div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#334155" }}>
                                                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "4px", borderBottom: "1px dashed #e2e8f0" }}>
                                                                                            <span>Department</span>
                                                                                            <div style={{ textAlign: "right", fontSize: "12px" }}>
                                                                                                <div style={{ color: deptMatch ? "#16a34a" : "#dc2626" }}>
                                                                                                    Student: <strong>{studentDepartment}</strong> {deptMatch ? "✓" : "✕"}
                                                                                                </div>
                                                                                                <div style={{ color: "#64748b" }}>
                                                                                                    Required: <strong>{drive.departments.map((d: string) => d.replace("Computer Science & Engineering", "CSE").replace("Information Technology", "IT").replace("Electronics & Communication", "ECE").replace("Mechanical Engineering", "Mech")).join(", ")}</strong>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                                            <span>CGPA</span>
                                                                                            <strong style={{ color: cgpaMatch ? "#16a34a" : "#dc2626" }}>
                                                                                                {(studentCGPA || 0).toFixed(2)} / {(drive.minCgpa || 0).toFixed(2)} {cgpaMatch ? "✓" : "✕"}
                                                                                            </strong>
                                                                                        </div>
                                                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                                            <span>10th Percentage</span>
                                                                                            <strong style={{ color: tenthMatch ? "#16a34a" : "#dc2626" }}>
                                                                                                {studentTenth || 0}% / {drive.minTenth || 0}% {tenthMatch ? "✓" : "✕"}
                                                                                            </strong>
                                                                                        </div>
                                                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                                            <span>12th Percentage</span>
                                                                                            <strong style={{ color: twelfthMatch ? "#16a34a" : "#dc2626" }}>
                                                                                                {studentTwelfth || 0}% / {drive.minTwelfth || 0}% {twelfthMatch ? "✓" : "✕"}
                                                                                            </strong>
                                                                                        </div>
                                                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                                            <span>Backlogs</span>
                                                                                            <strong style={{ color: backlogMatch ? "#16a34a" : "#dc2626" }}>
                                                                                                {studentBacklogs || 0} / {drive.maxBacklogs ?? 0} {backlogMatch ? "✓" : "✕"}
                                                                                            </strong>
                                                                                        </div>
                                                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                                            <span>Graduation Year</span>
                                                                                            <strong style={{ color: yearMatch ? "#16a34a" : "#dc2626" }}>
                                                                                                {studentGradYear || 2026} / {drive.gradYear || 2026} {yearMatch ? "✓" : "✕"}
                                                                                            </strong>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                                {drive.requiredSkills && drive.requiredSkills.length > 0 && (
                                                                                    <div style={{ marginTop: "12px", fontSize: "13px", color: "#334155" }}>
                                                                                        <strong>Required Skills:</strong> {drive.requiredSkills.join(", ")}
                                                                                    </div>
                                                                                )}
                                                                                {/* Recruitment Rounds Schedule Section inside Modal */}
                                                                                <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #eaedf0", marginTop: "12px" }}>
                                                                                    <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                                                        📋 RECRUITMENT ROUNDS SCHEDULE
                                                                                    </h4>
                                                                                    {(() => {
                                                                                        const getCompanyRounds = (companyName: string) => {
                                                                                            try {
                                                                                                const savedDrives = localStorage.getItem("cpms_drives");
                                                                                                if (savedDrives) {
                                                                                                    const parsed = JSON.parse(savedDrives);
                                                                                                    if (Array.isArray(parsed)) {
                                                                                                        const matched = parsed.find((d: any) =>
                                                                                                            (d.companyName && d.companyName.toLowerCase().includes(companyName.toLowerCase())) ||
                                                                                                            (d.company && d.company.toLowerCase().includes(companyName.toLowerCase()))
                                                                                                        );
                                                                                                        if (matched && Array.isArray(matched.rounds) && matched.rounds.length > 0) {
                                                                                                            return matched.rounds;
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            } catch (e) { }

                                                                                            return Array.isArray(drive.rounds) && drive.rounds.length > 0 ? drive.rounds : [
                                                                                                { roundNumber: 1, roundName: "Round 1: Online Aptitude & Coding Test", mode: "Online", date: "24 Aug 2026", venueOrLink: "HackerRank Portal" },
                                                                                                { roundNumber: 2, roundName: "Round 2: Technical Interview", mode: "Online", date: "25 Aug 2026", venueOrLink: "Google Meet / Teams" },
                                                                                                { roundNumber: 3, roundName: "Round 3: HR & Management Round", mode: "Online", date: "26 Aug 2026", venueOrLink: "Google Meet / Teams" }
                                                                                            ];
                                                                                        };

                                                                                        const modalRounds = getCompanyRounds(drive.company || drive.companyName || "");

                                                                                        // Get application status for this drive
                                                                                        let sharedAppRec: any = null;
                                                                                        try {
                                                                                            const savedApps = localStorage.getItem("cpms_applications");
                                                                                            if (savedApps) {
                                                                                                const parsed = JSON.parse(savedApps);
                                                                                                if (Array.isArray(parsed)) {
                                                                                                    sharedAppRec = parsed.find((a: any) =>
                                                                                                        a.companyName.toLowerCase().includes((drive.company || drive.companyName || "").toLowerCase()) ||
                                                                                                        (drive.company || drive.companyName || "").toLowerCase().includes(a.companyName.toLowerCase())
                                                                                                    );
                                                                                                }
                                                                                            }
                                                                                        } catch (e) { }

                                                                                        const STAGE_LIST = ["Applied", "Under Review", "Shortlisted", "Assessment", "Technical Round", "HR Round", "Selected"];
                                                                                        const currentStageIdx = STAGE_LIST.indexOf(sharedAppRec?.status || "Under Review");
                                                                                        const isNotShortlisted = sharedAppRec?.status === "Not Shortlisted";

                                                                                        return (
                                                                                            <div style={{ overflowX: "auto" }}>
                                                                                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                                                                                                    <thead>
                                                                                                        <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                                                                                                            <th style={{ padding: "8px 10px", textAlign: "left", color: "#475569", fontWeight: "800" }}>Round</th>
                                                                                                            <th style={{ padding: "8px 10px", textAlign: "left", color: "#475569", fontWeight: "800" }}>Round Name</th>
                                                                                                            <th style={{ padding: "8px 10px", textAlign: "left", color: "#475569", fontWeight: "800" }}>Date</th>
                                                                                                            <th style={{ padding: "8px 10px", textAlign: "left", color: "#475569", fontWeight: "800" }}>Mode / Venue</th>
                                                                                                            <th style={{ padding: "8px 10px", textAlign: "center", color: "#475569", fontWeight: "800" }}>Status</th>
                                                                                                        </tr>
                                                                                                    </thead>
                                                                                                    <tbody>
                                                                                                        {modalRounds.map((rnd: any, i: number) => {
                                                                                                            const rndNum = rnd.roundNumber || i + 1;
                                                                                                            const isRejectedThisRound = isNotShortlisted && sharedAppRec?.currentRound === rndNum;
                                                                                                            const isLockedAfterRejection = isNotShortlisted && (sharedAppRec?.currentRound ? rndNum > sharedAppRec.currentRound : true);

                                                                                                            const isCompletedRound = !isNotShortlisted && currentStageIdx >= (i + 2);
                                                                                                            const isCurrentRound = !isNotShortlisted && currentStageIdx === (i + 2);

                                                                                                            const statusLabel = isRejectedThisRound
                                                                                                                ? "🔴 Not Shortlisted"
                                                                                                                : isLockedAfterRejection
                                                                                                                    ? "🔒 Not Available"
                                                                                                                    : isCurrentRound
                                                                                                                        ? "In Progress ⏳"
                                                                                                                        : isCompletedRound
                                                                                                                            ? "Cleared ✓"
                                                                                                                            : "🔒 Upcoming";

                                                                                                            const statusColor = isRejectedThisRound ? "#dc2626" : isCurrentRound ? "#2563eb" : isCompletedRound ? "#16a34a" : "#94a3b8";

                                                                                                            return (
                                                                                                                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: isRejectedThisRound ? "#fef2f2" : isCurrentRound ? "#eff6ff" : "#ffffff" }}>
                                                                                                                    <td style={{ padding: "8px 10px", fontWeight: "800", color: "#0f172a", whiteSpace: "nowrap" }}>
                                                                                                                        Round {rndNum}
                                                                                                                    </td>
                                                                                                                    <td style={{ padding: "8px 10px", fontWeight: "700", color: isRejectedThisRound ? "#991b1b" : "#334155", whiteSpace: "nowrap" }}>
                                                                                                                        {rnd.roundName}
                                                                                                                    </td>
                                                                                                                    <td style={{ padding: "8px 10px", color: "#64748b", whiteSpace: "nowrap" }}>
                                                                                                                        {rnd.date}
                                                                                                                    </td>
                                                                                                                    <td style={{ padding: "8px 10px", color: "#475569", fontWeight: "600", whiteSpace: "nowrap" }}>
                                                                                                                        {rnd.venueOrLink || rnd.mode}
                                                                                                                    </td>
                                                                                                                    <td style={{ padding: "8px 10px", textAlign: "center", fontWeight: "800", color: statusColor, fontSize: "11px", whiteSpace: "nowrap" }}>
                                                                                                                        {statusLabel}
                                                                                                                    </td>
                                                                                                                </tr>
                                                                                                            );
                                                                                                        })}
                                                                                                    </tbody>
                                                                                                </table>
                                                                                            </div>
                                                                                        );
                                                                                    })()}
                                                                                </div>
                                                                            </div>

                                                                            {/* Status Summary Banner */}
                                                                            <div style={{ padding: "12px 16px", borderRadius: "10px", backgroundColor: isEligible ? "#f0fdf4" : "#fef2f2", border: `1px solid ${isEligible ? "#bbf7d0" : "#fecaca"}`, fontSize: "13px", fontWeight: "600" }}>
                                                                                {isEligible ? (
                                                                                    <span style={{ color: "#16a34a" }}>✓ Fully Eligible to Apply for this Drive</span>
                                                                                ) : (
                                                                                    <div>
                                                                                        <span style={{ color: "#dc2626", fontWeight: "800" }}>🔴 NOT ELIGIBLE FOR THIS DRIVE</span>
                                                                                        {failureReasons.length > 0 && (
                                                                                            <div style={{ fontSize: "12px", fontWeight: "600", color: "#991b1b", marginTop: "4px" }}>
                                                                                                Reason: {failureReasons.join(" • ")}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                             {/* Response Action Section (Inside scroll body) */}
                                                                             <div style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #eaedf0", display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px" }}>
                                                                                 <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                                                                                     Your Response
                                                                                 </div>
                                                                                 {(() => {
                                                                                     const isAlreadyOptIn = appliedDrives.includes(drive.id);
                                                                                     const isAlreadyOptOut = optedOutDrives.includes(drive.id);

                                                                                if (isAlreadyOptIn || isAlreadyOptOut) {
                                                                                    return (
                                                                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                                                            <div style={{
                                                                                                padding: "10px 14px",
                                                                                                backgroundColor: isAlreadyOptIn ? "#f0fdf4" : "#fef2f2",
                                                                                                color: isAlreadyOptIn ? "#16a34a" : "#dc2626",
                                                                                                border: `1.5px solid ${isAlreadyOptIn ? "#16a34a" : "#dc2626"}`,
                                                                                                borderRadius: "8px",
                                                                                                fontWeight: "800",
                                                                                                fontSize: "13px",
                                                                                                textAlign: "center"
                                                                                            }}>
                                                                                                {isAlreadyOptIn ? "🟢 Opted-in (You have opted in for this drive)" : "🔴 You have Opted-Out of this Drive (Response Locked 🔒)"}
                                                                                            </div>
                                                                                            <button
                                                                                                onClick={() => setExpandedDriveId(null)}
                                                                                                style={{
                                                                                                    width: "100%",
                                                                                                    padding: "10px 18px",
                                                                                                    backgroundColor: "#0f172a",
                                                                                                    color: "#ffffff",
                                                                                                    border: "none",
                                                                                                    borderRadius: "8px",
                                                                                                    fontSize: "13px",
                                                                                                    fontWeight: "700",
                                                                                                    cursor: "pointer",
                                                                                                }}
                                                                                            >
                                                                                                Close Popup
                                                                                            </button>
                                                                                        </div>
                                                                                    );
                                                                                }

                                                                                if (isEligible) {
                                                                                    return (
                                                                                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                                                                            <button
                                                                                                onClick={() => setConfirmModal({ type: "opt_in", drive })}
                                                                                                style={{
                                                                                                    flex: 1,
                                                                                                    padding: "11px 16px",
                                                                                                    backgroundColor: "#16a34a",
                                                                                                    color: "#ffffff",
                                                                                                    border: "none",
                                                                                                    borderRadius: "8px",
                                                                                                    fontSize: "14px",
                                                                                                    fontWeight: "700",
                                                                                                    cursor: "pointer",
                                                                                                    boxShadow: "0 2px 4px rgba(22, 163, 74, 0.2)",
                                                                                                    display: "flex",
                                                                                                    alignItems: "center",
                                                                                                    justifyContent: "center",
                                                                                                    gap: "6px",
                                                                                                }}
                                                                                            >
                                                                                                Opt-In
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => setConfirmModal({ type: "opt_out", drive })}
                                                                                                style={{
                                                                                                    flex: 1,
                                                                                                    padding: "11px 16px",
                                                                                                    backgroundColor: "#dc2626",
                                                                                                    color: "#ffffff",
                                                                                                    border: "none",
                                                                                                    borderRadius: "8px",
                                                                                                    fontSize: "14px",
                                                                                                    fontWeight: "700",
                                                                                                    cursor: "pointer",
                                                                                                    boxShadow: "0 2px 4px rgba(220, 38, 38, 0.2)",
                                                                                                    display: "flex",
                                                                                                    alignItems: "center",
                                                                                                    justifyContent: "center",
                                                                                                    gap: "6px",
                                                                                                }}
                                                                                            >
                                                                                                Opt-Out
                                                                                            </button>
                                                                                        </div>
                                                                                    );
                                                                                }

                                                                                return (
                                                                                    <button
                                                                                        onClick={() => setExpandedDriveId(null)}
                                                                                        style={{
                                                                                            width: "100%",
                                                                                            padding: "10px 18px",
                                                                                            backgroundColor: "#0f172a",
                                                                                            color: "#ffffff",
                                                                                            border: "none",
                                                                                            borderRadius: "8px",
                                                                                            fontSize: "13px",
                                                                                            fontWeight: "700",
                                                                                            cursor: "pointer",
                                                                                        }}
                                                                                    >
                                                                                        Close Popup
                                                                                    </button>
                                                                                );
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                            {/* Card Face Action Button (Locked Permanently Once Response Submitted) */}
                                                            {(() => {
                                                                const isOptedOut = optedOutDrives.includes(drive.id);
                                                                const isOptedIn = isApplied;

                                                                if (isOptedIn) {
                                                                    return (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setExpandedDriveId(drive.id)}
                                                                            style={{
                                                                                width: "100%",
                                                                                padding: "10px",
                                                                                backgroundColor: "#f0fdf4",
                                                                                color: "#16a34a",
                                                                                border: "1.5px solid #16a34a",
                                                                                borderRadius: "8px",
                                                                                fontSize: "13px",
                                                                                fontWeight: "800",
                                                                                textAlign: "center",
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                justifyContent: "center",
                                                                                gap: "6px",
                                                                                cursor: "pointer",
                                                                                transition: "all 0.15s ease",
                                                                            }}
                                                                            title="Click to view drive requirements"
                                                                        >
                                                                            🟢 Opted-In
                                                                        </button>
                                                                    );
                                                                }

                                                                if (isOptedOut) {
                                                                    return (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setExpandedDriveId(drive.id)}
                                                                            style={{
                                                                                width: "100%",
                                                                                padding: "10px",
                                                                                backgroundColor: "#fef2f2",
                                                                                color: "#dc2626",
                                                                                border: "1.5px solid #dc2626",
                                                                                borderRadius: "8px",
                                                                                fontSize: "13px",
                                                                                fontWeight: "800",
                                                                                textAlign: "center",
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                justifyContent: "center",
                                                                                gap: "6px",
                                                                                cursor: "pointer",
                                                                                transition: "all 0.15s ease",
                                                                            }}
                                                                            title="Click to view drive requirements"
                                                                        >
                                                                            🔴 Opted-Out
                                                                        </button>
                                                                    );
                                                                }

                                                                if (isEligible) {
                                                                    return (
                                                                        <button
                                                                            onClick={() => setExpandedDriveId(drive.id)}
                                                                            style={{
                                                                                width: "100%",
                                                                                padding: "10px",
                                                                                backgroundColor: "#2563eb",
                                                                                color: "#ffffff",
                                                                                border: "none",
                                                                                borderRadius: "8px",
                                                                                fontSize: "13px",
                                                                                fontWeight: "700",
                                                                                cursor: "pointer",
                                                                                boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
                                                                                transition: "all 0.15s ease",
                                                                            }}
                                                                        >
                                                                            Apply for Drive
                                                                        </button>
                                                                    );
                                                                }

                                                                return (
                                                                    <button
                                                                        onClick={() => setExpandedDriveId(drive.id)}
                                                                        style={{
                                                                            width: "100%",
                                                                            padding: "10px 14px",
                                                                            backgroundColor: "#fef2f2",
                                                                            color: "#dc2626",
                                                                            border: "1.5px solid #fca5a5",
                                                                            borderRadius: "8px",
                                                                            fontSize: "13px",
                                                                            fontWeight: "700",
                                                                            cursor: "pointer",
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            justifyContent: "center",
                                                                            gap: "6px",
                                                                            boxShadow: "0 1px 3px rgba(220, 38, 38, 0.1)",
                                                                            transition: "all 0.15s ease",
                                                                        }}
                                                                        title="Click to view detailed eligibility evaluation criteria"
                                                                    >
                                                                        View Ineligible Criteria 🔍
                                                                    </button>
                                                                );
                                                            })()}
                                                        </>
                                                    )
                                                    }
                                                </div>
                                            );
                                        })}
                                    </>
                                );
                            })()}
                        </div>
                    )}

                    {/* Confirmation Modal for Opt-In / Opt-Out Choice */}
                    {confirmModal && (
                        <div
                            onClick={() => setConfirmModal(null)}
                            style={{
                                position: "fixed",
                                top: 0,
                                left: 0,
                                width: "100vw",
                                height: "100vh",
                                backgroundColor: "rgba(15, 23, 42, 0.75)",
                                backdropFilter: "blur(4px)",
                                zIndex: 100000,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "20px",
                            }}
                        >
                            <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    backgroundColor: "#ffffff",
                                    borderRadius: "16px",
                                    maxWidth: "440px",
                                    width: "100%",
                                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
                                    border: "1px solid #e2e8f0",
                                    padding: "24px",
                                    textAlign: "center",
                                }}
                            >
                                <div style={{ fontSize: "42px", marginBottom: "12px" }}>
                                    {confirmModal.type === "opt_in" ? "🟢" : "🔴"}
                                </div>
                                <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                                    {confirmModal.type === "opt_in" ? "Confirm Opt-In" : "Confirm Opt-Out"}
                                </h3>
                                <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#475569", lineHeight: "1.5" }}>
                                    {confirmModal.type === "opt_in"
                                        ? `Are you sure you want to participate in the ${confirmModal.drive.company} placement drive?`
                                        : `Are you sure you want to opt out of the ${confirmModal.drive.company} placement drive?`}
                                </p>

                                <div style={{ display: "flex", gap: "12px" }}>
                                    <button
                                        onClick={() => setConfirmModal(null)}
                                        style={{
                                            flex: 1,
                                            padding: "10px 16px",
                                            backgroundColor: "#ffffff",
                                            color: "#475569",
                                            border: "1px solid #cbd5e1",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "700",
                                            cursor: "pointer",
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            const driveId = confirmModal.drive.id;
                                            if (confirmModal.type === "opt_in") {
                                                if (!appliedDrives.includes(driveId)) {
                                                    const updatedApps = [...appliedDrives, driveId];
                                                    setAppliedDrives(updatedApps);
                                                    try {
                                                        localStorage.setItem(`cpms_applied_drives_${userKey}`, JSON.stringify(updatedApps));
                                                        // Also save into central cpms_applied_drives_global list for officer cross-reading
                                                        try {
                                                            const globalStr = localStorage.getItem("cpms_applied_drives_global");
                                                            let globalArr: any[] = [];
                                                            if (globalStr) {
                                                                try { globalArr = JSON.parse(globalStr); } catch (e) { }
                                                            }
                                                            if (!Array.isArray(globalArr)) globalArr = [];

                                                            const newRecord = {
                                                                userKey,
                                                                email: user.email || `${userKey}@gmail.com`,
                                                                name: user.name || "Ashwanth",
                                                                driveId: String(driveId),
                                                                companyName: confirmModal.drive.company || confirmModal.drive.companyName || "Drive",
                                                                optedInAt: new Date().toISOString()
                                                            };

                                                            const existingIdx = globalArr.findIndex((r: any) =>
                                                                r.userKey === userKey && String(r.driveId) === String(driveId)
                                                            );
                                                            if (existingIdx >= 0) {
                                                                globalArr[existingIdx] = newRecord;
                                                            } else {
                                                                globalArr.push(newRecord);
                                                            }
                                                            localStorage.setItem("cpms_applied_drives_global", JSON.stringify(globalArr));
                                                            window.dispatchEvent(new Event("storage"));
                                                        } catch (e) { }
                                                    } catch (e) { }
                                                }
                                                if (optedOutDrives.includes(driveId)) {
                                                    const updatedOptOuts = optedOutDrives.filter((id) => id !== driveId);
                                                    setOptedOutDrives(updatedOptOuts);
                                                    try {
                                                        localStorage.setItem(`cpms_opted_out_drives_${userKey}`, JSON.stringify(updatedOptOuts));
                                                    } catch (e) { }
                                                }

                                                // 🚀 Automatically add application record under "Under Review" in Placement Officer -> Applications
                                                try {
                                                    const savedAppsStr = localStorage.getItem("cpms_applications");
                                                    let appsArr: any[] = [];
                                                    if (savedAppsStr) {
                                                        try { appsArr = JSON.parse(savedAppsStr); } catch (e) { }
                                                    }
                                                    if (!Array.isArray(appsArr)) appsArr = [];

                                                    const compName = confirmModal.drive.company || confirmModal.drive.companyName || "Company Drive";
                                                    const jobRole = confirmModal.drive.role || confirmModal.drive.jobRole || "Graduate Engineer Trainee";
                                                    const sName = user.name || "Student Candidate";
                                                    const sEmail = user.email || `${userKey}@gmail.com`;

                                                    const existingIndex = appsArr.findIndex((a: any) =>
                                                        a.email?.toLowerCase() === sEmail.toLowerCase() &&
                                                        (a.companyName?.toLowerCase() === compName.toLowerCase() || compName.toLowerCase().includes((a.companyName || "").toLowerCase()))
                                                    );

                                                    const nowStr = new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

                                                    if (existingIndex >= 0) {
                                                        appsArr[existingIndex].status = "Under Review";
                                                    } else {
                                                        const newAppRecord = {
                                                            id: `app_${userKey}_${driveId}_${Date.now()}`,
                                                            studentName: sName,
                                                            regNo: user.regNo || "22CSR025",
                                                            department: user.department || studentDepartment || "Computer Science & Engineering",
                                                            email: sEmail,
                                                            phone: user.phone || "+91 98765 43210",
                                                            companyName: compName,
                                                            jobRole: jobRole,
                                                            appliedDate: nowStr,
                                                            status: "Under Review",
                                                            resumeName: `${sName.replace(/\s+/g, "_")}_ATS_Resume.pdf`,
                                                            cgpa: studentCGPA || 7.5,
                                                            minCgpa: 6.0,
                                                            tenth: studentTenth || 85,
                                                            minTenth: 60,
                                                            twelfth: studentTwelfth || 80,
                                                            minTwelfth: 60,
                                                            backlogs: studentBacklogs || 0,
                                                            maxBacklogs: 2,
                                                            gradYear: studentGradYear || 2026,
                                                            reqGradYear: 2026,
                                                            history: [
                                                                { date: nowStr, title: "Opt-In Application Submitted", desc: `Student opted-in for ${compName} ${jobRole} drive.` },
                                                                { date: nowStr, title: "Under Review", desc: "Placed into officer review queue for document & criteria verification." }
                                                            ]
                                                        };

                                                        appsArr.unshift(newAppRecord);
                                                    }

                                                    localStorage.setItem("cpms_applications", JSON.stringify(appsArr));
                                                } catch (err) {
                                                    console.error("Error creating student Opt-In application record:", err);
                                                }
                                            } else {
                                                if (!optedOutDrives.includes(driveId)) {
                                                    const updatedOptOuts = [...optedOutDrives, driveId];
                                                    setOptedOutDrives(updatedOptOuts);
                                                    try {
                                                        localStorage.setItem(`cpms_opted_out_drives_${userKey}`, JSON.stringify(updatedOptOuts));
                                                    } catch (e) { }
                                                }
                                                if (appliedDrives.includes(driveId)) {
                                                    const updatedApps = appliedDrives.filter((id) => id !== driveId);
                                                    setAppliedDrives(updatedApps);
                                                    try {
                                                        localStorage.setItem(`cpms_applied_drives_${userKey}`, JSON.stringify(updatedApps));
                                                    } catch (e) { }
                                                }
                                            }
                                            setConfirmModal(null);
                                            setExpandedDriveId(null);
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: "10px 16px",
                                            backgroundColor: confirmModal.type === "opt_in" ? "#16a34a" : "#dc2626",
                                            color: "#ffffff",
                                            border: "none",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "700",
                                            cursor: "pointer",
                                            boxShadow: confirmModal.type === "opt_in" ? "0 2px 4px rgba(22, 163, 74, 0.2)" : "0 2px 4px rgba(220, 38, 38, 0.2)",
                                        }}
                                    >
                                        {confirmModal.type === "opt_in" ? "Confirm Opt-In" : "Confirm Opt-Out"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. My Applications Pipeline for Student */}
                    {activeTab === "applications" && !isOfficer && (() => {
                        const getSharedApplicationRecord = (driveCompanyName: string) => {
                            try {
                                const savedApps = localStorage.getItem("cpms_applications");
                                if (savedApps) {
                                    const parsed = JSON.parse(savedApps);
                                    if (Array.isArray(parsed)) {
                                        return parsed.find((a: any) =>
                                            a.companyName.toLowerCase().includes(driveCompanyName.toLowerCase()) ||
                                            driveCompanyName.toLowerCase().includes(a.companyName.toLowerCase())
                                        );
                                    }
                                }
                            } catch (e) { }
                            return null;
                        };

                        const getSharedStatusBadge = (status: string) => {
                            switch (status) {
                                case "Applied":
                                    return { bg: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", label: "Applied" };
                                case "Under Review":
                                    return { bg: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", label: "🟡 Under Review" };
                                case "Shortlisted":
                                    return { bg: "#faf5ff", color: "#7e22ce", border: "1px solid #e9d5ff", label: "🟣 Shortlisted" };
                                case "Assessment":
                                    return { bg: "#ecfeff", color: "#0e7490", border: "1px solid #a5f3fc", label: "🔵 Assessment" };
                                case "Technical Round":
                                    return { bg: "#e0e7ff", color: "#4338ca", border: "1px solid #c7d2fe", label: "🔷 Technical Round" };
                                case "HR Round":
                                    return { bg: "#fffbe6", color: "#d97706", border: "1px solid #ffe58f", label: "🟠 HR Round" };
                                case "Selected":
                                    return { bg: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", label: "🟢 Selected" };
                                case "Rejected":
                                    return { bg: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", label: "🔴 Rejected" };
                                case "Not Shortlisted":
                                    return { bg: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", label: "⚫ Not Shortlisted" };
                                default:
                                    return { bg: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", label: `🟡 ${status}` };
                            }
                        };

                        const getStudentApplicationsList = () => {
                            let studentApps: any[] = [];
                            try {
                                const savedAppsStr = localStorage.getItem("cpms_applications");
                                if (savedAppsStr) {
                                    const parsed = JSON.parse(savedAppsStr);
                                    if (Array.isArray(parsed) && parsed.length > 0) {
                                        const userEmail = (user.email || "").toLowerCase();
                                        const userName = (user.name || "").toLowerCase();
                                        studentApps = parsed.filter((a: any) =>
                                            (a.email && a.email.toLowerCase() === userEmail) ||
                                            (a.studentName && a.studentName.toLowerCase().includes(userName)) ||
                                            (userEmail.includes("gobi") && a.studentName.toLowerCase().includes("gobi")) ||
                                            (userEmail.includes("ashwanth") && a.studentName.toLowerCase().includes("ashwanth"))
                                        );

                                        studentApps = studentApps.filter((a: any) => {
                                            const cName = (a.companyName || "").toLowerCase();
                                            if (cName.includes("google") && (studentCGPA || 7.5) < 8.0) {
                                                return false;
                                            }
                                            return true;
                                        });
                                    }
                                }
                            } catch (e) { }

                            if (studentApps.length > 0) {
                                return studentApps.map(app => ({
                                    id: app.id,
                                    companyName: app.companyName || "Wipro",
                                    jobRole: app.jobRole || "Graduate Engineer Trainee",
                                    ctc: "3.5 - 6.5 LPA",
                                    status: app.status || "Under Review",
                                    currentRound: app.currentRound,
                                    roundStatus: app.roundStatus,
                                    roundName: app.roundName
                                }));
                            }

                            if (appliedDrives.length > 0) {
                                const validAppliedDrives = appliedDrives.filter(id => {
                                    const drive = drives.find((d: any) => d.id === id || d._id === id);
                                    const compName = (drive?.company || (drive as any)?.companyName || "").toLowerCase();
                                    if (compName.includes("google") && (studentCGPA || 7.5) < 8.0) {
                                        return false;
                                    }
                                    return true;
                                });

                                return validAppliedDrives.map(id => {
                                    const drive = drives.find((d: any) => d.id === id || d._id === id);
                                    const compName = drive?.company || (drive as any)?.companyName || "Wipro";
                                    const sharedRec = getSharedApplicationRecord(compName);
                                    return {
                                        id: drive?.id || id,
                                        companyName: compName,
                                        jobRole: drive?.role || (drive as any)?.jobRole || "Graduate Engineer Trainee",
                                        ctc: drive?.ctc || "3.5 LPA",
                                        status: sharedRec ? sharedRec.status : "Under Review",
                                        currentRound: sharedRec?.currentRound,
                                        roundStatus: sharedRec?.roundStatus,
                                        roundName: sharedRec?.roundName
                                    };
                                });
                            }

                            const defaultDrive = drives[0];
                            const defaultComp = defaultDrive?.company || (defaultDrive as any)?.companyName || "Wipro";
                            const defaultSharedRec = getSharedApplicationRecord(defaultComp);
                            return [{
                                id: defaultDrive?.id || "drive_1",
                                companyName: defaultComp,
                                jobRole: defaultDrive?.role || (defaultDrive as any)?.jobRole || "Graduate Engineer Trainee",
                                ctc: defaultDrive?.ctc || "3.5 LPA",
                                status: defaultSharedRec ? defaultSharedRec.status : "Under Review",
                                currentRound: defaultSharedRec?.currentRound,
                                roundStatus: defaultSharedRec?.roundStatus,
                                roundName: defaultSharedRec?.roundName
                            }];
                        };

                        const studentAppsList = getStudentApplicationsList();

                        return (
                            <div style={styles.tableCard}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                    <div>
                                        <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#1e293b" }}>
                                            Drive Applications & Selection Stage
                                        </h3>
                                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                                            Supported Rounds: <strong>Aptitude | Technical | HR | Coding Test | Online Assessment | Managerial</strong>
                                        </span>
                                    </div>
                                </div>
                                {studentAppsList.length === 0 ? (
                                    <p style={{ color: "#64748b", margin: 0 }}>
                                        You have not applied to any recruitment drives yet. Browse open drives to apply!
                                    </p>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                        <table style={styles.table}>
                                            <thead>
                                                <tr style={styles.tableHeadRow}>
                                                    <th style={styles.th}>Company</th>
                                                    <th style={styles.th}>Role</th>
                                                    <th style={styles.th}>Package</th>
                                                    <th style={{ ...styles.th, textAlign: "center" }}>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {studentAppsList.map((app) => {
                                                    const compName = app.companyName;

                                                    const driveObj = drives.find((d: any) =>
                                                        (d.companyName && d.companyName.toLowerCase().includes(compName.toLowerCase())) ||
                                                        (d.company && d.company.toLowerCase().includes(compName.toLowerCase())) ||
                                                        compName.toLowerCase().includes((d.companyName || d.company || "").toLowerCase())
                                                    );

                                                    return (
                                                        <tr key={app.id} style={styles.tableRow}>
                                                            <td style={styles.td}>
                                                                <strong>{compName}</strong>
                                                            </td>
                                                            <td style={styles.td}>{app.jobRole}</td>
                                                            <td style={styles.td}>{app.ctc}</td>
                                                            <td style={{ ...styles.td, textAlign: "center" }}>
                                                                <button
                                                                    onClick={() => setSelectedAppModal({ app, drive: driveObj || app })}
                                                                    style={{
                                                                        padding: "6px 14px",
                                                                        backgroundColor: "#0f172a",
                                                                        color: "#ffffff",
                                                                        border: "none",
                                                                        borderRadius: "6px",
                                                                        fontSize: "12px",
                                                                        fontWeight: "700",
                                                                        cursor: "pointer"
                                                                    }}
                                                                >
                                                                    View
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Selected Recruitment Round Details Modal Popup */}
                    {selectedRoundModal && (
                        <div
                            onClick={() => setSelectedRoundModal(null)}
                            style={{
                                position: "fixed",
                                top: 0,
                                left: 0,
                                width: "100vw",
                                height: "100vh",
                                backgroundColor: "rgba(15, 23, 42, 0.7)",
                                backdropFilter: "blur(4px)",
                                zIndex: 100000,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "20px"
                            }}
                        >
                            <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    backgroundColor: "#ffffff",
                                    borderRadius: "16px",
                                    maxWidth: "480px",
                                    width: "100%",
                                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
                                    border: "1px solid #e2e8f0",
                                    overflow: "hidden",
                                    animation: "fadeIn 0.2s ease-out"
                                }}
                            >
                                <div style={{ backgroundColor: "#0f172a", color: "#ffffff", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>{selectedRoundModal.companyName}</h3>
                                        <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: "600" }}>Round Details</span>
                                    </div>
                                    <button
                                        onClick={() => setSelectedRoundModal(null)}
                                        style={{
                                            backgroundColor: "rgba(255, 255, 255, 0.15)",
                                            border: "none",
                                            color: "#ffffff",
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "50%",
                                            fontSize: "15px",
                                            fontWeight: "700",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
                                    <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #eaedf0" }}>
                                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Round Title</div>
                                        <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>
                                            {selectedRoundModal.round.roundName}
                                        </div>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                        <div style={{ backgroundColor: "#ffffff", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Date</div>
                                            <div style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{selectedRoundModal.round.date}</div>
                                        </div>
                                        <div style={{ backgroundColor: "#ffffff", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Mode / Venue</div>
                                            <div style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{selectedRoundModal.round.venueOrLink || selectedRoundModal.round.mode}</div>
                                        </div>
                                    </div>

                                    <div style={{
                                        padding: "14px",
                                        borderRadius: "10px",
                                        backgroundColor: selectedRoundModal.isNotShortlisted && selectedRoundModal.currentRoundNum === (selectedRoundModal.round.roundNumber || 1) ? "#fef2f2" : "#f0fdf4",
                                        border: `1px solid ${selectedRoundModal.isNotShortlisted && selectedRoundModal.currentRoundNum === (selectedRoundModal.round.roundNumber || 1) ? "#fecaca" : "#bbf7d0"}`
                                    }}>
                                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Status & Result</div>
                                        <div style={{ fontSize: "14px", fontWeight: "800", color: selectedRoundModal.isNotShortlisted && selectedRoundModal.currentRoundNum === (selectedRoundModal.round.roundNumber || 1) ? "#dc2626" : "#16a34a", marginTop: "2px" }}>
                                            {selectedRoundModal.isNotShortlisted && selectedRoundModal.currentRoundNum === (selectedRoundModal.round.roundNumber || 1)
                                                ? "🔴 Not Shortlisted"
                                                : selectedRoundModal.isNotShortlisted
                                                    ? "🔒 Not Available"
                                                    : "In Progress / Cleared"}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#475569", marginTop: "4px" }}>
                                            {selectedRoundModal.isNotShortlisted && selectedRoundModal.currentRoundNum === (selectedRoundModal.round.roundNumber || 1)
                                                ? "Application ended at this round."
                                                : selectedRoundModal.isNotShortlisted
                                                    ? "Round locked due to prior elimination."
                                                    : "Candidate actively progressing in placement evaluation pipeline."}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ padding: "16px 24px", backgroundColor: "#f8fafc", borderTop: "1px solid #eaedf0", textAlign: "right" }}>
                                    <button
                                        onClick={() => setSelectedRoundModal(null)}
                                        style={{ padding: "9px 20px", backgroundColor: "#0f172a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Dedicated Selected Application Details Modal Popup */}
                    {selectedAppModal && (
                        <div
                            onClick={() => setSelectedAppModal(null)}
                            style={{
                                position: "fixed",
                                top: 0,
                                left: 0,
                                width: "100vw",
                                height: "100vh",
                                backgroundColor: "rgba(15, 23, 42, 0.7)",
                                backdropFilter: "blur(4px)",
                                zIndex: 100000,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "20px"
                            }}
                        >
                            <div
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    backgroundColor: "#ffffff",
                                    borderRadius: "18px",
                                    maxWidth: "600px",
                                    width: "100%",
                                    maxHeight: "90vh",
                                    overflowY: "auto",
                                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
                                    border: "1px solid #e2e8f0",
                                    animation: "fadeIn 0.2s ease-out"
                                }}
                            >
                                <div style={{ backgroundColor: "#0f172a", color: "#ffffff", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#ffffff" }}>
                                            {selectedAppModal.app.companyName} — Application & Company Details
                                        </h3>
                                        <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: "600" }}>
                                            {selectedAppModal.app.jobRole}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setSelectedAppModal(null)}
                                        style={{
                                            backgroundColor: "rgba(255, 255, 255, 0.15)",
                                            border: "none",
                                            color: "#ffffff",
                                            width: "34px",
                                            height: "34px",
                                            borderRadius: "50%",
                                            fontSize: "16px",
                                            fontWeight: "700",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                                    {/* Company & Job Overview */}
                                    <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #eaedf0" }}>
                                        <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>
                                            JOB OVERVIEW & PACKAGE
                                        </h4>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                                            <div><strong>Company:</strong> {selectedAppModal.app.companyName}</div>
                                            <div><strong>Job Role:</strong> {selectedAppModal.app.jobRole}</div>
                                            <div><strong>Package (CTC):</strong> <strong style={{ color: "#16a34a" }}>{selectedAppModal.app.ctc}</strong></div>
                                            <div><strong>Current Status:</strong> <strong style={{ color: selectedAppModal.app.status === "Not Shortlisted" ? "#dc2626" : selectedAppModal.app.status === "Selected" ? "#16a34a" : "#2563eb" }}>{selectedAppModal.app.status === "Not Shortlisted" ? "Not Shortlisted" : selectedAppModal.app.status === "Selected" ? "Selected" : "In Progress"}</strong></div>
                                        </div>
                                    </div>

                                    {/* Eligibility Evaluation */}
                                    <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #eaedf0" }}>
                                        <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>
                                            ELIGIBILITY EVALUATION CHECKLIST
                                        </h4>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", color: "#334155" }}>
                                            <div><strong>Eligible Depts:</strong> CSE, IT, ECE</div>
                                            <div><strong>Minimum CGPA:</strong> 6.0 - 8.0</div>
                                            <div><strong>10th Percentage:</strong> 60%</div>
                                            <div><strong>12th Percentage:</strong> 60%</div>
                                            <div><strong>Max Backlogs:</strong> 2</div>
                                            <div><strong>Graduation Year:</strong> Batch 2026</div>
                                        </div>
                                    </div>

                                    {/* Round-by-Round Recruitment Schedule & Status */}
                                    <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #eaedf0" }}>
                                        <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>
                                            📋 RECRUITMENT ROUNDS & SCHEDULE
                                        </h4>
                                        {(() => {
                                            const getCompanyRounds = (companyName: string) => {
                                                try {
                                                    const savedDrives = localStorage.getItem("cpms_drives");
                                                    if (savedDrives) {
                                                        const parsed = JSON.parse(savedDrives);
                                                        if (Array.isArray(parsed)) {
                                                            const matched = parsed.find((d: any) =>
                                                                (d.companyName && d.companyName.toLowerCase().includes(companyName.toLowerCase())) ||
                                                                (d.company && d.company.toLowerCase().includes(companyName.toLowerCase()))
                                                            );
                                                            if (matched && Array.isArray(matched.rounds) && matched.rounds.length > 0) {
                                                                return matched.rounds;
                                                            }
                                                        }
                                                    }
                                                } catch (e) { }

                                                return [
                                                    { roundNumber: 1, roundName: "Round 1: Online Aptitude & Coding Test", mode: "Online", date: "24 Aug 2026", venueOrLink: "HackerRank Portal" },
                                                    { roundNumber: 2, roundName: "Round 2: Technical Interview", mode: "Online", date: "25 Aug 2026", venueOrLink: "Google Meet / Teams" },
                                                    { roundNumber: 3, roundName: "Round 3: HR & Management Round", mode: "Online", date: "26 Aug 2026", venueOrLink: "Google Meet / Teams" }
                                                ];
                                            };

                                            const modalRounds = getCompanyRounds(selectedAppModal.app.companyName);

                                            // 🎯 Look up latest saved application state from cpms_applications
                                            let currentAppStatus = selectedAppModal.app.status;
                                            let currentAppRound = selectedAppModal.app.currentRound;

                                            try {
                                                const savedAppsStr = localStorage.getItem("cpms_applications");
                                                if (savedAppsStr) {
                                                    const parsedApps = JSON.parse(savedAppsStr);
                                                    if (Array.isArray(parsedApps)) {
                                                        const matchedApp = parsedApps.find((a: any) =>
                                                            a.companyName &&
                                                            (a.companyName.toLowerCase().includes(selectedAppModal.app.companyName.toLowerCase()) ||
                                                                selectedAppModal.app.companyName.toLowerCase().includes(a.companyName.toLowerCase()))
                                                        );
                                                        if (matchedApp) {
                                                            currentAppStatus = matchedApp.status || currentAppStatus;
                                                            currentAppRound = matchedApp.currentRound || currentAppRound;
                                                        }
                                                    }
                                                }
                                            } catch (e) { }

                                            const STAGE_LIST = ["Applied", "Under Review", "Shortlisted", "Assessment", "Technical Round", "HR Round", "Selected"];
                                            const currentStageIdx = STAGE_LIST.indexOf(currentAppStatus || "Under Review");
                                            const isNotShortlisted = currentAppStatus === "Not Shortlisted";

                                            return (
                                                <div style={{ overflowX: "auto" }}>
                                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                                                        <thead>
                                                            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                                                                <th style={{ padding: "8px 10px", textAlign: "left", color: "#475569", fontWeight: "800" }}>Round</th>
                                                                <th style={{ padding: "8px 10px", textAlign: "left", color: "#475569", fontWeight: "800" }}>Round Name</th>
                                                                <th style={{ padding: "8px 10px", textAlign: "left", color: "#475569", fontWeight: "800" }}>Date</th>
                                                                <th style={{ padding: "8px 10px", textAlign: "left", color: "#475569", fontWeight: "800" }}>Mode / Venue</th>
                                                                <th style={{ padding: "8px 10px", textAlign: "center", color: "#475569", fontWeight: "800" }}>Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {modalRounds.map((rnd: any, i: number) => {
                                                                const rndNum = rnd.roundNumber || i + 1;
                                                                const isRejectedThisRound = isNotShortlisted && currentAppRound === rndNum;
                                                                const isLockedAfterRejection = isNotShortlisted && (currentAppRound ? rndNum > currentAppRound : true);

                                                                const activeRoundNum = currentAppRound || 1;
                                                                const isCompletedRound = !isLockedAfterRejection && !isRejectedThisRound && rndNum < activeRoundNum;
                                                                const isCurrentRound = !isLockedAfterRejection && !isRejectedThisRound && rndNum === activeRoundNum;

                                                                const statusLabel = isRejectedThisRound
                                                                    ? "🔴 Not Shortlisted"
                                                                    : isLockedAfterRejection
                                                                        ? "🔒 Not Available"
                                                                        : isCurrentRound
                                                                            ? "In Progress ⏳"
                                                                            : isCompletedRound
                                                                                ? "Cleared ✓"
                                                                                : "🔒 Upcoming";

                                                                const statusColor = isRejectedThisRound ? "#dc2626" : isCurrentRound ? "#2563eb" : isCompletedRound ? "#16a34a" : "#94a3b8";

                                                                return (
                                                                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: isRejectedThisRound ? "#fef2f2" : isCurrentRound ? "#eff6ff" : isCompletedRound ? "#f0fdf4" : "#ffffff" }}>
                                                                        <td style={{ padding: "10px 12px", fontWeight: "800", color: "#0f172a", whiteSpace: "nowrap" }}>
                                                                            Round {rndNum}
                                                                        </td>
                                                                        <td style={{ padding: "10px 12px", fontWeight: "700", color: isRejectedThisRound ? "#991b1b" : isCompletedRound ? "#15803d" : "#334155", whiteSpace: "nowrap" }}>
                                                                            {rnd.roundName}
                                                                        </td>
                                                                        <td style={{ padding: "10px 12px", color: "#64748b", whiteSpace: "nowrap" }}>
                                                                            {rnd.date}
                                                                        </td>
                                                                        <td style={{ padding: "10px 12px", color: "#475569", fontWeight: "600", whiteSpace: "nowrap" }}>
                                                                            {rnd.venueOrLink || rnd.mode}
                                                                        </td>
                                                                        <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: "800", color: statusColor, fontSize: "11px", whiteSpace: "nowrap" }}>
                                                                            {statusLabel}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                <div style={{ padding: "16px 24px", backgroundColor: "#f8fafc", borderTop: "1px solid #eaedf0", textAlign: "right" }}>
                                    <button
                                        onClick={() => setSelectedAppModal(null)}
                                        style={{ padding: "10px 22px", backgroundColor: "#0f172a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                                    >
                                        Close Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* 4. Interview Schedule & Management Section */}
                    {activeTab === "interviews" && (
                        isOfficer ? (
                            <InterviewManagement />
                        ) : (
                            <div style={styles.tableCard}>
                                <div style={{ marginBottom: "16px" }}>
                                    <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#0f172a" }}>
                                        📅 Active Interview Schedules & Venue Details
                                    </h3>
                                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                                        Official recruitment interview dates, evaluator panels, meeting links, and officer feedback.
                                    </span>
                                </div>
                                {(() => {
                                    let studentInterviews: any[] = [];
                                    try {
                                        const savedIntsStr = localStorage.getItem("cpms_interviews");
                                        if (savedIntsStr) {
                                            const parsed = JSON.parse(savedIntsStr);
                                            if (Array.isArray(parsed) && parsed.length > 0) {
                                                const userEmail = (user.email || "").toLowerCase().trim();
                                                const userName = (user.name || "").toLowerCase().trim();
                                                const userReg = (user.regNo || "").toLowerCase().trim();

                                                studentInterviews = parsed.filter((i: any) => {
                                                    const candEmail = (i.email || "").toLowerCase().trim();
                                                    const candName = (i.candidateName || "").toLowerCase().trim();
                                                    const candReg = (i.regNo || "").toLowerCase().trim();

                                                    if (userReg && candReg && (userReg.includes(candReg) || candReg.includes(userReg))) return true;
                                                    if (userEmail && candEmail && userEmail === candEmail) return true;
                                                    if (userName && candName && (userName.includes(candName) || candName.includes(userName))) return true;
                                                    if ((userEmail.includes("gobi") || userName.includes("gobi")) && candName.includes("gobi")) return true;
                                                    if ((userEmail.includes("ashwanth") || userName.includes("ashwanth")) && (candName.includes("ashwanth") || candReg.includes("22csr025"))) return true;
                                                    return false;
                                                });

                                                if (studentInterviews.length === 0) {
                                                    studentInterviews = parsed;
                                                }
                                            }
                                        }
                                    } catch (e) { }

                                    // Group studentInterviews by companyName
                                    const compMap: { [key: string]: any } = {};
                                    studentInterviews.forEach((item: any) => {
                                        const cKey = item.companyName;
                                        if (!compMap[cKey]) {
                                            compMap[cKey] = {
                                                company: item.companyName,
                                                role: item.jobRole,
                                                interviews: []
                                            };
                                        }
                                        compMap[cKey].interviews.push(item);
                                    });

                                    const groupedCompList = Object.values(compMap);

                                    if (groupedCompList.length === 0) {
                                        return (
                                            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #eaedf0", padding: "36px 24px", textAlign: "center" }}>
                                                <div style={{ fontSize: "32px", marginBottom: "8px" }}>📅</div>
                                                <h4 style={{ margin: "0 0 6px 0", color: "#0f172a", fontSize: "16px", fontWeight: "800" }}>No Interview Sessions Scheduled Yet</h4>
                                                <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#64748b" }}>
                                                    When the Placement Officer schedules an interview session or publishes drive results for your profile, it will automatically appear here.
                                                </p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "18px" }}>
                                            {groupedCompList.map((compGroup: any, idx: number) => {
                                                const pendingItem = compGroup.interviews.find((item: any) => item.result === "Pending" || item.status === "Scheduled");
                                                const activeItem = pendingItem || compGroup.interviews[compGroup.interviews.length - 1];

                                                // Check if application stage for this specific company is Selected
                                                let isCompanySelected = false;
                                                try {
                                                    const savedAppsStr = localStorage.getItem("cpms_applications");
                                                    if (savedAppsStr) {
                                                        const parsedApps = JSON.parse(savedAppsStr);
                                                        if (Array.isArray(parsedApps)) {
                                                            const compMatchApp = parsedApps.find((a: any) =>
                                                                a.companyName && (
                                                                    a.companyName.toLowerCase().includes(compGroup.company.toLowerCase()) ||
                                                                    compGroup.company.toLowerCase().includes(a.companyName.toLowerCase())
                                                                )
                                                            );
                                                            if (compMatchApp && compMatchApp.status === "Selected") {
                                                                isCompanySelected = true;
                                                            }
                                                        }
                                                    }
                                                } catch (e) { }

                                                return (
                                                    <div key={idx} style={{ border: `1px solid ${isCompanySelected ? "#86efac" : "#e2e8f0"}`, borderRadius: "14px", padding: "20px", backgroundColor: isCompanySelected ? "#f0fdf4" : "#ffffff", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.03)" }}>
                                                        <div>
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                                                                <div>
                                                                    <h4 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "#0f172a", fontWeight: "800" }}>{compGroup.company}</h4>
                                                                    <span style={{ fontSize: "13px", color: "#2563eb", fontWeight: "700" }}>{compGroup.role}</span>
                                                                </div>
                                                                <span style={{
                                                                    padding: "4px 10px",
                                                                    borderRadius: "12px",
                                                                    fontSize: "11px",
                                                                    fontWeight: "800",
                                                                    whiteSpace: "nowrap",
                                                                    backgroundColor: isCompanySelected ? "#dcfce7" : activeItem.result === "Passed" ? "#dcfce7" : activeItem.result === "Failed" ? "#fef2f2" : "#fffbeb",
                                                                    color: isCompanySelected ? "#15803d" : activeItem.result === "Passed" ? "#15803d" : activeItem.result === "Failed" ? "#b91c1c" : "#b45309",
                                                                    border: isCompanySelected ? "1px solid #86efac" : activeItem.result === "Passed" ? "1px solid #86efac" : activeItem.result === "Failed" ? "1px solid #fecaca" : "1px solid #fde68a"
                                                                }}>
                                                                    {isCompanySelected ? "Selected" : activeItem.result === "Passed" ? "Passed" : activeItem.result === "Failed" ? "Failed" : "Pending"}
                                                                </span>
                                                            </div>
                                                            {isCompanySelected && (
                                                                <div style={{ backgroundColor: "#15803d", color: "#ffffff", padding: "10px 14px", borderRadius: "10px", marginBottom: "12px", fontSize: "13px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
                                                                    🏆 Congratulations! You are Selected for {compGroup.company}!
                                                                </div>
                                                            )}
                                                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#334155", backgroundColor: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #eaedf0" }}>
                                                                <div>📍 <strong>Round:</strong> <span style={{ color: "#1d4ed8", fontWeight: "700" }}>{activeItem.round.toLowerCase().includes("round") ? activeItem.round : `${activeItem.round} Round`}</span></div>
                                                                <div>📅 <strong>Date & Time:</strong> {activeItem.date} | {activeItem.time}</div>
                                                                <div>👨‍💼 <strong>Interviewer Panel:</strong> {activeItem.interviewer || "TPO Technical Panel"}</div>
                                                                <div>🏢 <strong>Mode & Location:</strong> {activeItem.mode === "Online" ? `Online (${activeItem.venue || activeItem.meetingLink || "Google Meet"})` : `Offline (${activeItem.venue || "Campus Lab"})`}</div>
                                                                {activeItem.remarks && (
                                                                    <div style={{ marginTop: "4px", paddingTop: "6px", borderTop: "1px dashed #cbd5e1", fontSize: "11px", color: "#475569", fontStyle: "italic" }}>
                                                                        💬 <strong>Officer Remarks:</strong> "{activeItem.remarks}"
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {compGroup.interviews.length > 1 && (
                                                                <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "6px" }}>
                                                                    <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Previous Round History ({compGroup.interviews.length})</div>
                                                                    {compGroup.interviews.map((pastInt: any, pIdx: number) => (
                                                                        <div key={pIdx} style={{ fontSize: "12px", color: "#475569", display: "flex", justifyContent: "space-between", backgroundColor: "#f8fafc", padding: "6px 10px", borderRadius: "6px" }}>
                                                                            <span>{pastInt.round.toLowerCase().includes("round") ? pastInt.round : `${pastInt.round} Round`} ({pastInt.date})</span>
                                                                            <strong style={{ color: pastInt.result === "Passed" ? "#16a34a" : pastInt.result === "Failed" ? "#dc2626" : "#d97706" }}>
                                                                                {pastInt.result === "Passed" ? "Passed" : pastInt.result === "Failed" ? "Failed" : "Pending"}
                                                                            </strong>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", paddingTop: "12px", marginTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        )
                    )}

                    {/* 5. Results, Offer Letter & Placement Confirmation Section */}
                    {activeTab === "results_offer" && (
                        <SelectionsManagement key="results_offer" user={user} />
                    )}

                    {/* 6. Student Profile Management (6.1 - 6.3) */}
                    {activeTab === "profile" && (
                        <StudentProfile user={user} />
                    )}

                    {/* 7. Reports & Analytics Section */}
                    {activeTab === "reports" && (
                        <ReportsAnalyticsManagement />
                    )}

                    {/* 8. Placement Season Lifecycle Management */}
                    {activeTab === "seasons" && (
                        <SeasonManagement />
                    )}

                    {/* 9. Compliance Audit Trail & Security Logs */}
                    {activeTab === "audit_logs" && (
                        <AuditLogsManagement />
                    )}
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
                        <span>Dashboard</span>
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
                        onClick={() => setActiveTab("verification")}
                        className={`mobile-tab-item ${activeTab === "verification" ? "active" : ""}`}
                    >
                        <div className="tab-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5" /></svg>
                        </div>
                        <span>Students</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("applications")}
                        className={`mobile-tab-item ${activeTab === "applications" ? "active" : ""}`}
                    >
                        <div className="tab-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
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
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    page: {
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    },
    navBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 32px",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.02)",
    },
    navBrand: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    logoIcon: {
        fontSize: "28px",
    },
    brandTitle: {
        margin: 0,
        fontSize: "18px",
        fontWeight: "700",
        color: "#0f172a",
    },
    brandSubtitle: {
        fontSize: "12px",
        color: "#64748b",
    },
    userSection: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
    },
    userInfo: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
    },
    userName: {
        fontSize: "14px",
        fontWeight: "600",
        color: "#1e293b",
    },
    roleBadge: {
        fontSize: "10px",
        fontWeight: "700",
        backgroundColor: "#e0e7ff",
        color: "#3730a3",
        padding: "2px 6px",
        borderRadius: "4px",
        marginTop: "2px",
    },
    logoutBtn: {
        padding: "8px 14px",
        backgroundColor: "#f1f5f9",
        color: "#334155",
        border: "1px solid #cbd5e1",
        borderRadius: "6px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
    },
    mainContent: {
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "32px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
    },
    welcomeCard: {
        backgroundColor: "#2563eb",
        color: "#ffffff",
        padding: "24px 28px",
        borderRadius: "14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 10px 20px rgba(37, 99, 235, 0.15)",
    },
    welcomeTitle: {
        margin: "0 0 6px 0",
        fontSize: "22px",
        fontWeight: "700",
    },
    welcomeText: {
        margin: 0,
        fontSize: "14px",
        opacity: 0.9,
    },
    portalStatusBadge: {
        backgroundColor: "rgba(255, 255, 255, 0.18)",
        padding: "8px 14px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    statusDot: {
        width: "8px",
        height: "8px",
        backgroundColor: "#4ade80",
        borderRadius: "50%",
    },
    metricsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px",
    },
    metricCard: {
        backgroundColor: "#ffffff",
        padding: "20px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.03)",
    },
    metricIcon: {
        fontSize: "28px",
        backgroundColor: "#f1f5f9",
        padding: "10px",
        borderRadius: "10px",
    },
    metricValue: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#0f172a",
    },
    metricLabel: {
        fontSize: "12px",
        color: "#64748b",
    },
    tabBar: {
        display: "flex",
        gap: "10px",
        borderBottom: "1px solid #e2e8f0",
        paddingBottom: "12px",
        flexWrap: "nowrap",
        overflowX: "auto",
        whiteSpace: "nowrap",
    },
    tabBtn: {
        padding: "8px 14px",
        backgroundColor: "transparent",
        border: "none",
        fontSize: "13px",
        fontWeight: "600",
        color: "#64748b",
        cursor: "pointer",
        borderRadius: "6px",
        whiteSpace: "nowrap",
        flexShrink: 0,
    },
    activeTabBtn: {
        backgroundColor: "#ffffff",
        color: "#2563eb",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
        border: "1px solid #e2e8f0",
    },
    drivesGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
    },
    driveCard: {
        backgroundColor: "#ffffff",
        padding: "20px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "16px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.03)",
    },
    driveHeader: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    companyLogo: {
        fontSize: "32px",
    },
    companyName: {
        margin: "0 0 2px 0",
        fontSize: "16px",
        fontWeight: "700",
        color: "#0f172a",
    },
    driveRole: {
        fontSize: "13px",
        color: "#64748b",
    },
    driveDetails: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        fontSize: "13px",
        backgroundColor: "#f8fafc",
        padding: "12px",
        borderRadius: "8px",
    },
    detailRow: {
        display: "flex",
        justifyContent: "space-between",
    },
    detailLabel: {
        color: "#64748b",
        fontWeight: "500",
    },
    ctcHighlight: {
        color: "#16a34a",
        fontWeight: "700",
    },
    applyBtn: {
        width: "100%",
        padding: "10px",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        border: "none",
        borderRadius: "6px",
        fontWeight: "600",
        fontSize: "14px",
        cursor: "pointer",
    },
    appliedBtn: {
        backgroundColor: "#16a34a",
        cursor: "default",
    },
    ineligibleBtn: {
        backgroundColor: "#94a3b8",
        cursor: "not-allowed",
    },
    workflowCard: {
        backgroundColor: "#ffffff",
        padding: "24px",
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
    },
    stepperList: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxWidth: "600px",
        margin: "0 auto",
    },
    stepperItem: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        backgroundColor: "#f8fafc",
        padding: "12px 18px",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        position: "relative",
    },
    stepperNode: {
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        backgroundColor: "#cbd5e1",
        color: "#1e293b",
        fontWeight: "700",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "13px",
        flexShrink: 0,
    },
    stepperNodeDone: {
        backgroundColor: "#2563eb",
        color: "#ffffff",
    },
    stepperContent: {
        flexGrow: 1,
    },
    stepperTitle: {
        margin: "0 0 2px 0",
        fontSize: "14px",
        fontWeight: "600",
        color: "#0f172a",
    },
    stepperDesc: {
        margin: 0,
        fontSize: "12px",
        color: "#64748b",
    },
    stepperArrow: {
        color: "#94a3b8",
        fontWeight: "700",
        fontSize: "16px",
    },
    tableCard: {
        backgroundColor: "#ffffff",
        padding: "24px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
    },
    tableHeadRow: {
        backgroundColor: "#f8fafc",
        borderBottom: "1px solid #e2e8f0",
    },
    th: {
        padding: "12px",
        textAlign: "left",
        fontSize: "13px",
        color: "#64748b",
        fontWeight: "600",
    },
    tableRow: {
        borderBottom: "1px solid #f1f5f9",
    },
    td: {
        padding: "14px 12px",
        fontSize: "14px",
        color: "#1e293b",
    },
    stageBadge: {
        backgroundColor: "#e0e7ff",
        color: "#3730a3",
        fontSize: "12px",
        fontWeight: "600",
        padding: "4px 10px",
        borderRadius: "12px",
    },
    verifiedBadge: {
        backgroundColor: "#dcfce7",
        color: "#15803d",
        fontSize: "12px",
        fontWeight: "600",
        padding: "4px 10px",
        borderRadius: "12px",
    },
};

export default OfficerDashboard;
