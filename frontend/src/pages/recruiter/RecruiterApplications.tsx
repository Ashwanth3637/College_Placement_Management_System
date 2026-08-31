import React, { useState, useEffect } from "react";
import { formatCleanRoundName, getPureRoundTitle } from "../../utils/roundUtils";

export interface RecruiterApplicationItem {
    id: string;
    registerNumber: string;
    studentName: string;
    email: string;
    branch: string;
    cgpa: number;
    gradYear: number;
    companyName: string;
    jobRole: string;
    appliedDrive: string;
    appliedDate: string;
    applicationStatus: "Applied" | "Shortlisted" | "Interview Scheduled" | "Interview Completed" | "Selected" | "Not Shortlisted" | "Rejected";
    currentRound: number;
    roundStatus?: string;
    roundName?: string;
    remarks?: string;
    rejectionReason?: string;
    history?: Array<{ date: string; title: string; desc: string; status: string; roundNumber?: number }>;
    interviewSchedule?: {
        date?: string;
        time?: string;
        location?: string;
        mode?: string;
        interviewer?: string;
        meetingLink?: string;
        status?: string;
    };
}

interface RecruiterApplicationsProps {
    user?: {
        name?: string;
        email?: string;
        role?: string;
        company?: string;
    };
    onViewApplication?: (app: RecruiterApplicationItem) => void;
}

type SortField = "studentName" | "cgpa" | "gradYear" | "appliedDate" | "applicationStatus" | "currentRound";
type SortOrder = "asc" | "desc";

export const RecruiterApplications: React.FC<RecruiterApplicationsProps> = ({ user, onViewApplication }) => {
    const recruiterCompany = user?.company || "Amazon Development Center";
    const companyNameShort = recruiterCompany.split(" ")[0] || "Amazon";

    // Filter States
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [driveFilter, setDriveFilter] = useState<string>("All Drives");
    const [branchFilter, setBranchFilter] = useState<string>("All Branches");
    const [gradYearFilter, setGradYearFilter] = useState<string>("All Years");
    const [statusFilter, setStatusFilter] = useState<string>("All Statuses");
    const [roundFilter, setRoundFilter] = useState<string>("All Rounds");

    // Sorting & Pagination States
    const [sortField, setSortField] = useState<SortField>("appliedDate");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 5;

    const [applications, setApplications] = useState<RecruiterApplicationItem[]>([]);
    const [drivesList, setDrivesList] = useState<string[]>([
        "Software Developer",
        "Sales Development",
        "Cloud Engineer"
    ]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [selectedApplication, setSelectedApplication] = useState<RecruiterApplicationItem | null>(null);

    // Modal Sub-Views (Rejection Prompt & ATS Resume Viewer & Round Evaluation)
    const [showRejectPrompt, setShowRejectPrompt] = useState<boolean>(false);
    const [rejectReason, setRejectReason] = useState<string>("Technical assessment score below threshold");
    const [rejectNote, setRejectNote] = useState<string>("");
    const [showResumeViewer, setShowResumeViewer] = useState<boolean>(false);

    // Multi-Round Evaluation Modal State
    const [showRoundEvalModal, setShowRoundEvalModal] = useState<boolean>(false);
    const [evalDecision, setEvalDecision] = useState<"PASS" | "FAIL">("PASS");
    const [evalScore, setEvalScore] = useState<string>("88/100");
    const [evalRemarks, setEvalRemarks] = useState<string>("Candidate demonstrated strong core technical & problem-solving competence.");

    // Applications loaded exclusively from live database & registered applications
    const initialApplications: RecruiterApplicationItem[] = [];

    // Load Applications from MongoDB API
    const fetchApplicationsData = async () => {
        setIsLoading(true);
        let list: RecruiterApplicationItem[] = [];

        try {
            const res = await fetch(`http://localhost:5001/api/applications?company=${encodeURIComponent(companyNameShort)}`);
            if (res.ok) {
                const apiApps = await res.json();
                if (Array.isArray(apiApps) && apiApps.length > 0) {
                    apiApps.forEach((a: any) => {
                        const existing = list.find(item => item.email.toLowerCase() === (a.email || "").toLowerCase() && item.appliedDrive.toLowerCase() === (a.jobRole || "").toLowerCase());
                        
                        let stdStatus: RecruiterApplicationItem["applicationStatus"] = "Applied";
                        if (a.status === "Selected") stdStatus = "Selected";
                        else if (a.status === "Shortlisted") stdStatus = "Shortlisted";
                        else if (a.status === "Interview Completed") stdStatus = "Interview Completed";
                        else if (a.status === "Interview Scheduled" || a.status === "Technical Round" || a.status === "Assessment") stdStatus = "Interview Scheduled";
                        else if (a.status === "Not Shortlisted" || a.status === "Rejected") stdStatus = "Not Shortlisted";

                        if (existing) {
                            existing.applicationStatus = stdStatus;
                            existing.currentRound = a.currentRound || existing.currentRound;
                            existing.roundStatus = a.roundStatus || existing.roundStatus;
                            existing.roundName = a.roundName || existing.roundName;
                            existing.history = a.history && a.history.length > 0 ? a.history : existing.history;
                            existing.interviewSchedule = a.interviewSchedule || existing.interviewSchedule;
                            if (a.remarks && a.remarks.startsWith("Rejected:")) {
                                existing.rejectionReason = a.remarks.replace("Rejected:", "").trim();
                            }
                        } else {
                            list.push({
                                id: a._id || a.id || `app_db_${Date.now()}`,
                                registerNumber: a.regNo || "22CSR100",
                                studentName: a.studentName || "Student Candidate",
                                email: a.email,
                                branch: a.department || "CSE",
                                cgpa: a.cgpa || 8.0,
                                gradYear: a.gradYear || 2026,
                                companyName: a.companyName || recruiterCompany,
                                jobRole: a.jobRole || "Software Developer",
                                appliedDrive: a.jobRole || "Software Developer",
                                appliedDate: a.appliedDate || "24 Aug 2026",
                                applicationStatus: stdStatus,
                                currentRound: a.currentRound || 1,
                                roundStatus: a.roundStatus || "In Progress",
                                roundName: a.roundName || "Round 1: Technical Assessment",
                                remarks: a.remarks || "Application submitted and verified.",
                                history: a.history || [],
                                interviewSchedule: a.interviewSchedule || undefined
                            });
                        }
                    });
                }
            }
        } catch (err) {
            console.error("Error fetching applications from MongoDB:", err);
        }

        // Build unique clean roles for Placement Drive filter dropdown
        const rolesSet = new Set<string>();
        ["Software Developer", "Sales Development", "Cloud Engineer"].forEach(r => rolesSet.add(r));
        list.forEach((app) => {
            if (app.appliedDrive) {
                const existing = Array.from(rolesSet).find(r => r.toLowerCase() === app.appliedDrive.toLowerCase());
                if (!existing) rolesSet.add(app.appliedDrive);
            }
        });

        setDrivesList(Array.from(rolesSet));
        setApplications(list);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchApplicationsData();
    }, []);

    // Escape key modal handling
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setSelectedApplication(null);
                setShowRejectPrompt(false);
                setShowResumeViewer(false);
            }
        };
        if (selectedApplication || showResumeViewer) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedApplication, showResumeViewer]);

    // Reset All Filters
    const handleResetFilters = () => {
        setSearchQuery("");
        setDriveFilter("All Drives");
        setBranchFilter("All Branches");
        setGradYearFilter("All Years");
        setStatusFilter("All Statuses");
        setRoundFilter("All Rounds");
        setCurrentPage(1);
    };

    // Toggle Sorting
    const handleHeaderSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    // Filter Logic
    const filteredApplications = applications.filter((app) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = query === "" ||
            app.studentName.toLowerCase().includes(query) ||
            app.registerNumber.toLowerCase().includes(query) ||
            app.email.toLowerCase().includes(query) ||
            app.branch.toLowerCase().includes(query) ||
            app.appliedDrive.toLowerCase().includes(query);

        const matchesDrive = driveFilter === "All Drives" || app.appliedDrive.toLowerCase() === driveFilter.toLowerCase();
        const matchesBranch = branchFilter === "All Branches" || app.branch.toLowerCase() === branchFilter.toLowerCase();
        const matchesGradYear = gradYearFilter === "All Years" || String(app.gradYear) === gradYearFilter;
        const matchesStatus = statusFilter === "All Statuses" || app.applicationStatus.toLowerCase() === statusFilter.toLowerCase();

        let matchesRound = true;
        if (roundFilter !== "All Rounds") {
            if (roundFilter === "Completed") matchesRound = app.applicationStatus === "Selected";
            else if (roundFilter === "Round 1") matchesRound = app.currentRound === 1 && app.applicationStatus !== "Selected";
            else if (roundFilter === "Round 2") matchesRound = app.currentRound === 2 && app.applicationStatus !== "Selected";
            else if (roundFilter === "Round 3") matchesRound = app.currentRound === 3 && app.applicationStatus !== "Selected";
        }

        return matchesSearch && matchesDrive && matchesBranch && matchesGradYear && matchesStatus && matchesRound;
    });

    // Sorting Logic
    const sortedApplications = [...filteredApplications].sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
    });

    // Pagination Calculation
    const totalApplicationsCount = sortedApplications.length;
    const totalPages = Math.max(1, Math.ceil(totalApplicationsCount / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedApplications = sortedApplications.slice(startIndex, startIndex + itemsPerPage);

    // Standardized Status Badge Styling Helper
    const getStatusBadgeStyle = (status: string) => {
        switch (status) {
            case "Selected":
                return { bg: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", label: "🟢 Selected" };
            case "Shortlisted":
                return { bg: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", label: "🔵 Shortlisted" };
            case "Interview Scheduled":
                return { bg: "#faf5ff", color: "#7e22ce", border: "1px solid #e9d5ff", label: "🟣 Interview Scheduled" };
            case "Interview Completed":
                return { bg: "#f0fdf4", color: "#059669", border: "1px solid #a7f3d0", label: "🟢 Interview Completed" };
            case "Not Shortlisted":
            case "Rejected":
                return { bg: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", label: "🔴 Not Shortlisted" };
            default:
                return { bg: "#fefce8", color: "#ca8a04", border: "1px solid #fef08a", label: "🟡 Applied" };
        }
    };

    // Execute Recruiter Status Change & Persist to MongoDB
    const handleUpdateApplicationState = async (
        appId: string,
        newStatus: RecruiterApplicationItem["applicationStatus"],
        logTitle: string,
        logDesc: string,
        newCurrentRound?: number,
        newRoundStatus?: string,
        newRoundName?: string,
        rejectionReasonText?: string,
        newInterviewSchedule?: RecruiterApplicationItem["interviewSchedule"]
    ) => {
        const todayStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        const newHistoryItem = { date: todayStr, title: logTitle, desc: logDesc, status: newStatus === "Selected" ? "Selected 🎉" : (newStatus === "Not Shortlisted" ? "Not Shortlisted ✕" : "Passed ✓"), roundNumber: newCurrentRound || 1 };

        setApplications(prev => prev.map(item => {
            if (item.id === appId) {
                return {
                    ...item,
                    applicationStatus: newStatus,
                    currentRound: newCurrentRound !== undefined ? newCurrentRound : item.currentRound,
                    roundStatus: newRoundStatus !== undefined ? newRoundStatus : item.roundStatus,
                    roundName: newRoundName !== undefined ? newRoundName : item.roundName,
                    rejectionReason: rejectionReasonText || item.rejectionReason,
                    history: [newHistoryItem, ...(item.history || [])],
                    interviewSchedule: newInterviewSchedule || item.interviewSchedule
                };
            }
            return item;
        }));

        if (selectedApplication && selectedApplication.id === appId) {
            setSelectedApplication(prev => prev ? {
                ...prev,
                applicationStatus: newStatus,
                currentRound: newCurrentRound !== undefined ? newCurrentRound : prev.currentRound,
                roundStatus: newRoundStatus !== undefined ? newRoundStatus : prev.roundStatus,
                roundName: newRoundName !== undefined ? newRoundName : prev.roundName,
                rejectionReason: rejectionReasonText || prev.rejectionReason,
                history: [newHistoryItem, ...(prev.history || [])],
                interviewSchedule: newInterviewSchedule || prev.interviewSchedule
            } : null);
        }

        // Call MongoDB API Endpoint PUT /api/applications/:id/status
        try {
            await fetch(`http://localhost:5001/api/applications/${appId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: newStatus,
                    currentRound: newCurrentRound,
                    roundStatus: newRoundStatus,
                    roundName: newRoundName,
                    remarks: rejectionReasonText ? `Rejected: ${rejectionReasonText}` : undefined,
                    historyItem: newHistoryItem,
                    interviewSchedule: newInterviewSchedule
                })
            });
        } catch (e) {
            console.error("Error updating application status in MongoDB:", e);
        }

        window.dispatchEvent(new CustomEvent("cpms_applications_updated"));
        setShowRejectPrompt(false);
    };

    // Recruiter submits round evaluation (PASS/FAIL) to Placement Officer for verification
    const handleSubmitRoundEvaluation = async () => {
        if (!selectedApplication) return;
        const appId = selectedApplication.id;
        const rNum = selectedApplication.currentRound || 1;
        const rName = selectedApplication.roundName || `Round ${rNum}: Technical Assessment`;

        try {
            await fetch(`http://localhost:5001/api/applications/${appId}/round-result`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roundNumber: rNum,
                    roundName: rName,
                    score: evalScore,
                    remarks: evalRemarks,
                    recruiterDecision: evalDecision
                })
            });
        } catch (e) {
            console.error("Error submitting round evaluation:", e);
        }

        const todayStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        const newHistoryItem = {
            date: todayStr,
            title: `Round ${rNum}: ${evalDecision} (Submitted for Officer Verification)`,
            desc: evalRemarks,
            status: "Pending Verification ⏳",
            roundNumber: rNum
        };

        setApplications(prev => prev.map(item => {
            if (item.id === appId) {
                return {
                    ...item,
                    roundStatus: "Pending Officer Verification",
                    remarks: `Round ${rNum} marked ${evalDecision} by recruiter. Sent to Placement Officer for official verification.`,
                    history: [newHistoryItem, ...(item.history || [])]
                };
            }
            return item;
        }));

        if (selectedApplication && selectedApplication.id === appId) {
            setSelectedApplication(prev => prev ? {
                ...prev,
                roundStatus: "Pending Officer Verification",
                remarks: `Round ${rNum} marked ${evalDecision} by recruiter. Sent to Placement Officer for official verification.`,
                history: [newHistoryItem, ...(prev.history || [])]
            } : null);
        }

        window.dispatchEvent(new CustomEvent("cpms_applications_updated"));
        setShowRoundEvalModal(false);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", color: "#0f172a" }}>
            {/* Header Section */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: "800", margin: "0 0 6px 0", color: "#0f172a", letterSpacing: "-0.02em" }}>
                        Applications
                    </h1>
                    <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                        Review and manage submitted student applications for your placement drives.
                    </p>
                </div>
            </div>

            {/* Filter Controls Card */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "20px 24px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Search Input */}
                <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                        Search Candidate
                    </label>
                    <input
                        type="text"
                        placeholder="Search candidate by name, register number (e.g. 22CSR101)..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13px",
                            outline: "none",
                            boxSizing: "border-box",
                            color: "#0f172a",
                            backgroundColor: "#f8fafc"
                        }}
                    />
                </div>

                {/* Dropdown Filters Grid + Reset Button */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", alignItems: "end" }}>
                    {/* Placement Drive Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                            Placement Drive
                        </label>
                        <select
                            value={driveFilter}
                            onChange={(e) => { setDriveFilter(e.target.value); setCurrentPage(1); }}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#fff", color: "#0f172a", outline: "none" }}
                        >
                            <option value="All Drives">All Drives</option>
                            {drivesList.map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    {/* Branch Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                            Branch
                        </label>
                        <select
                            value={branchFilter}
                            onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#fff", color: "#0f172a", outline: "none" }}
                        >
                            <option value="All Branches">All Branches</option>
                            <option value="CSE">CSE</option>
                            <option value="IT">IT</option>
                            <option value="ECE">ECE</option>
                        </select>
                    </div>

                    {/* Graduation Year Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                            Graduation Year
                        </label>
                        <select
                            value={gradYearFilter}
                            onChange={(e) => { setGradYearFilter(e.target.value); setCurrentPage(1); }}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#fff", color: "#0f172a", outline: "none" }}
                        >
                            <option value="All Years">All Years</option>
                            <option value="2026">2026</option>
                        </select>
                    </div>

                    {/* Application Status Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                            Application Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#fff", color: "#0f172a", outline: "none" }}
                        >
                            <option value="All Statuses">All Statuses</option>
                            <option value="Applied">Applied</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interview Scheduled">Interview Scheduled</option>
                            <option value="Interview Completed">Interview Completed</option>
                            <option value="Selected">Selected</option>
                            <option value="Not Shortlisted">Not Shortlisted</option>
                        </select>
                    </div>

                    {/* Current Round Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                            Current Round
                        </label>
                        <select
                            value={roundFilter}
                            onChange={(e) => { setRoundFilter(e.target.value); setCurrentPage(1); }}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#fff", color: "#0f172a", outline: "none" }}
                        >
                            <option value="All Rounds">All Rounds</option>
                            <option value="Round 1">Round 1</option>
                            <option value="Round 2">Round 2</option>
                            <option value="Round 3">Round 3</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>

                    {/* Reset Filters Button */}
                    <div>
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            style={{
                                width: "100%",
                                padding: "9px 14px",
                                backgroundColor: "#f1f5f9",
                                color: "#475569",
                                border: "1px solid #cbd5e1",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer",
                                transition: "all 0.15s ease"
                            }}
                        >
                            🔄 Reset Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Applications Table Card with Smooth Horizontal Scroll & Full View Button Visibility */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #eaedf0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                {isLoading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                        Loading application records...
                    </div>
                ) : sortedApplications.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                        No application records match your search criteria.
                    </div>
                ) : (
                    <>
                        <div style={{ overflowX: "auto", width: "100%" }}>
                            <table style={{ width: "100%", minWidth: "1080px", borderCollapse: "collapse", textAlign: "left", whiteSpace: "nowrap" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #eaedf0", color: "#475569", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        <th onClick={() => handleHeaderSort("studentName")} style={{ padding: "14px 14px", minWidth: "170px", cursor: "pointer", whiteSpace: "nowrap" }}>
                                            Candidate Name {sortField === "studentName" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                                        </th>
                                        <th style={{ padding: "14px 14px", minWidth: "110px", whiteSpace: "nowrap" }}>Register No.</th>
                                        <th style={{ padding: "14px 14px", minWidth: "140px", whiteSpace: "nowrap" }}>Applied Drive</th>
                                        <th style={{ padding: "14px 14px", minWidth: "75px", whiteSpace: "nowrap" }}>Branch</th>
                                        <th onClick={() => handleHeaderSort("cgpa")} style={{ padding: "14px 14px", minWidth: "75px", cursor: "pointer", whiteSpace: "nowrap" }}>
                                            CGPA {sortField === "cgpa" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                                        </th>
                                        <th onClick={() => handleHeaderSort("gradYear")} style={{ padding: "14px 14px", minWidth: "80px", cursor: "pointer", whiteSpace: "nowrap" }}>
                                            Year {sortField === "gradYear" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                                        </th>
                                        <th onClick={() => handleHeaderSort("appliedDate")} style={{ padding: "14px 14px", minWidth: "110px", cursor: "pointer", whiteSpace: "nowrap" }}>
                                            Applied Date {sortField === "appliedDate" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                                        </th>
                                        <th onClick={() => handleHeaderSort("applicationStatus")} style={{ padding: "14px 14px", minWidth: "175px", cursor: "pointer", whiteSpace: "nowrap" }}>
                                            Status {sortField === "applicationStatus" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                                        </th>
                                        <th onClick={() => handleHeaderSort("currentRound")} style={{ padding: "14px 14px", minWidth: "120px", textAlign: "center", cursor: "pointer", whiteSpace: "nowrap" }}>
                                            Current Round {sortField === "currentRound" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                                        </th>
                                        <th style={{ padding: "14px 14px", minWidth: "85px", textAlign: "center", whiteSpace: "nowrap" }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedApplications.map((app, idx) => {
                                        const badgeStyle = getStatusBadgeStyle(app.applicationStatus);
                                        const roundLabel = app.applicationStatus === "Selected" ? "Completed" : `Round ${app.currentRound || 1}`;

                                        return (
                                            <tr
                                                key={app.id || `app_row_${idx}`}
                                                style={{ borderBottom: idx !== paginatedApplications.length - 1 ? "1px solid #f1f5f9" : "none", transition: "background-color 0.15s ease" }}
                                            >
                                                {/* Candidate Name + Email */}
                                                <td style={{ padding: "14px 14px", minWidth: "170px", whiteSpace: "nowrap" }}>
                                                    <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px", whiteSpace: "nowrap" }}>
                                                        {app.studentName}
                                                    </div>
                                                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", whiteSpace: "nowrap" }}>
                                                        {app.email}
                                                    </div>
                                                </td>

                                                {/* Register No */}
                                                <td style={{ padding: "14px 14px", minWidth: "110px", whiteSpace: "nowrap" }}>
                                                    <span style={{ fontFamily: "monospace", fontWeight: "700", color: "#334155", fontSize: "13px", backgroundColor: "#f1f5f9", padding: "3px 7px", borderRadius: "6px", whiteSpace: "nowrap" }}>
                                                        {app.registerNumber}
                                                    </span>
                                                </td>

                                                {/* Applied Drive */}
                                                <td style={{ padding: "14px 14px", minWidth: "140px", whiteSpace: "nowrap" }}>
                                                    <span style={{ fontWeight: "700", color: "#0f172a", fontSize: "13px", whiteSpace: "nowrap" }}>
                                                        {app.appliedDrive}
                                                    </span>
                                                </td>

                                                {/* Branch */}
                                                <td style={{ padding: "14px 14px", minWidth: "75px", fontSize: "13px", color: "#334155", fontWeight: "700", whiteSpace: "nowrap" }}>
                                                    {app.branch}
                                                </td>

                                                {/* CGPA */}
                                                <td style={{ padding: "14px 14px", minWidth: "75px", whiteSpace: "nowrap" }}>
                                                    <span style={{ fontWeight: "800", color: app.cgpa >= 8.0 ? "#16a34a" : "#2563eb", fontSize: "14px", whiteSpace: "nowrap" }}>
                                                        {app.cgpa.toFixed(app.cgpa % 1 === 0 ? 1 : 2)}
                                                    </span>
                                                </td>

                                                {/* Graduation Year */}
                                                <td style={{ padding: "14px 14px", minWidth: "80px", fontSize: "13px", color: "#475569", fontWeight: "600", whiteSpace: "nowrap" }}>
                                                    {app.gradYear}
                                                </td>

                                                {/* Application Date */}
                                                <td style={{ padding: "14px 14px", minWidth: "110px", fontSize: "13px", color: "#475569", fontWeight: "600", whiteSpace: "nowrap" }}>
                                                    {app.appliedDate}
                                                </td>

                                                {/* Application Status */}
                                                <td style={{ padding: "14px 14px", minWidth: "175px", whiteSpace: "nowrap" }}>
                                                    <span
                                                        style={{
                                                            backgroundColor: badgeStyle.bg,
                                                            color: badgeStyle.color,
                                                            border: badgeStyle.border,
                                                            padding: "6px 12px",
                                                            borderRadius: "12px",
                                                            fontSize: "11px",
                                                            fontWeight: "700",
                                                            whiteSpace: "nowrap",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            width: "165px",
                                                            boxSizing: "border-box",
                                                            textAlign: "center"
                                                        }}
                                                    >
                                                        {badgeStyle.label}
                                                    </span>
                                                </td>

                                                {/* Current Round */}
                                                <td style={{ padding: "14px 14px", minWidth: "120px", textAlign: "center", fontSize: "13px", fontWeight: "700", color: "#2563eb", whiteSpace: "nowrap" }}>
                                                    {roundLabel}
                                                </td>

                                                {/* Action: View Button */}
                                                <td style={{ padding: "14px 14px", minWidth: "85px", textAlign: "center", whiteSpace: "nowrap" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedApplication(app);
                                                            if (onViewApplication) onViewApplication(app);
                                                        }}
                                                        style={{
                                                            backgroundColor: "#f8fafc",
                                                            color: "#334155",
                                                            border: "1px solid #cbd5e1",
                                                            padding: "6px 16px",
                                                            borderRadius: "8px",
                                                            fontSize: "12px",
                                                            fontWeight: "700",
                                                            cursor: "pointer",
                                                            whiteSpace: "nowrap",
                                                            transition: "all 0.15s ease"
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

                        {/* Pagination Footer */}
                        <div style={{ padding: "16px 24px", backgroundColor: "#f8fafc", borderTop: "1px solid #eaedf0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>
                                Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalApplicationsCount)} of {totalApplicationsCount} applications
                            </div>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    style={{
                                        padding: "6px 14px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        backgroundColor: currentPage === 1 ? "#f1f5f9" : "#ffffff",
                                        color: currentPage === 1 ? "#94a3b8" : "#0f172a",
                                        fontSize: "12px",
                                        fontWeight: "700",
                                        cursor: currentPage === 1 ? "not-allowed" : "pointer"
                                    }}
                                >
                                    ← Previous
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pNum => (
                                    <button
                                        key={pNum}
                                        onClick={() => setCurrentPage(pNum)}
                                        style={{
                                            padding: "6px 12px",
                                            borderRadius: "6px",
                                            border: `1px solid ${currentPage === pNum ? "#2563eb" : "#cbd5e1"}`,
                                            backgroundColor: currentPage === pNum ? "#2563eb" : "#ffffff",
                                            color: currentPage === pNum ? "#ffffff" : "#0f172a",
                                            fontSize: "12px",
                                            fontWeight: "700",
                                            cursor: "pointer"
                                        }}
                                    >
                                        {pNum}
                                    </button>
                                ))}
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    style={{
                                        padding: "6px 14px",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        backgroundColor: currentPage === totalPages ? "#f1f5f9" : "#ffffff",
                                        color: currentPage === totalPages ? "#94a3b8" : "#0f172a",
                                        fontSize: "12px",
                                        fontWeight: "700",
                                        cursor: currentPage === totalPages ? "not-allowed" : "pointer"
                                    }}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* APPLICATION DETAILS POPUP MODAL WITH STICKY HEADER AND STICKY RECRUITER ACTIONS */}
            {selectedApplication && (() => {
                const badgeStyle = getStatusBadgeStyle(selectedApplication.applicationStatus);

                const currentRoundNum = selectedApplication.currentRound || 1;
                const isSelected = selectedApplication.applicationStatus === "Selected";
                const isNotShortlisted = selectedApplication.applicationStatus === "Not Shortlisted" || selectedApplication.applicationStatus === "Rejected";
                const hasInterview = (selectedApplication.applicationStatus === "Interview Scheduled" || selectedApplication.applicationStatus === "Interview Completed") && selectedApplication.interviewSchedule?.date;

                return (
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(15, 23, 42, 0.6)",
                            backdropFilter: "blur(4px)",
                            zIndex: 9999,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "20px"
                        }}
                        onClick={() => setSelectedApplication(null)}
                    >
                        <div
                            style={{
                                backgroundColor: "#ffffff",
                                borderRadius: "20px",
                                width: "100%",
                                maxWidth: "720px",
                                maxHeight: "85vh",
                                overflow: "hidden",
                                display: "flex",
                                flexDirection: "column",
                                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                                border: "1px solid #eaedf0"
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* STICKY MODAL HEADER */}
                            <div style={{ padding: "20px 28px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, backgroundColor: "#ffffff", zIndex: 10 }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2px" }}>
                                        <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                                            Application Details
                                        </h2>
                                        <span style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color, border: badgeStyle.border, padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
                                            {badgeStyle.label}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                                        Submitted application record for {selectedApplication.studentName}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedApplication(null)}
                                    style={{ background: "none", border: "none", fontSize: "20px", color: "#94a3b8", cursor: "pointer", padding: "4px", borderRadius: "6px" }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* SCROLLABLE MODAL BODY CONTENT */}
                            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "24px", overflowY: "auto", flex: 1 }}>
                                {/* 1. Student Information */}
                                <div>
                                    <h3 style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px 0" }}>
                                        Student Information
                                    </h3>
                                    <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "16px", border: "1px solid #f1f5f9", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "700" }}>STUDENT NAME</span>
                                            <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedApplication.studentName}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "700" }}>REGISTER NO.</span>
                                            <span style={{ fontFamily: "monospace", fontWeight: "700", color: "#334155" }}>{selectedApplication.registerNumber}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "700" }}>EMAIL ADDRESS</span>
                                            <span style={{ fontWeight: "600", color: "#2563eb" }}>{selectedApplication.email}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "700" }}>BRANCH</span>
                                            <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedApplication.branch}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "700" }}>CGPA</span>
                                            <span style={{ fontWeight: "800", color: selectedApplication.cgpa >= 8.0 ? "#16a34a" : "#2563eb" }}>
                                                {selectedApplication.cgpa.toFixed(selectedApplication.cgpa % 1 === 0 ? 1 : 2)}
                                            </span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "700" }}>GRADUATION YEAR</span>
                                            <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedApplication.gradYear}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Drive Information */}
                                <div>
                                    <h3 style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px 0" }}>
                                        Drive Information
                                    </h3>
                                    <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "16px", border: "1px solid #f1f5f9", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "700" }}>COMPANY</span>
                                            <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedApplication.companyName}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "700" }}>JOB ROLE</span>
                                            <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedApplication.jobRole}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "700" }}>PLACEMENT DRIVE</span>
                                            <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedApplication.appliedDrive}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "700" }}>APPLICATION DATE</span>
                                            <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedApplication.appliedDate}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Application Status */}
                                <div>
                                    <h3 style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px 0" }}>
                                        Application Status
                                    </h3>
                                    <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "14px 18px", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>Current Status Outcome</span>
                                        <span style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color, border: badgeStyle.border, padding: "6px 16px", borderRadius: "12px", fontSize: "12px", fontWeight: "800" }}>
                                            {badgeStyle.label}
                                        </span>
                                    </div>

                                    {/* Rejection Reason Alert Callout for Not Shortlisted Candidates */}
                                    {isNotShortlisted && (
                                        <div style={{ marginTop: "12px", padding: "14px 18px", backgroundColor: "#fef2f2", borderRadius: "12px", border: "1px solid #fecaca", color: "#991b1b", fontSize: "13px" }}>
                                            <div style={{ fontWeight: "800", fontSize: "13px", marginBottom: "2px" }}>🔴 Application Outcome: Not Shortlisted</div>
                                            <div style={{ color: "#dc2626", fontWeight: "600" }}>
                                                Reason: {selectedApplication.rejectionReason || "Technical assessment score below threshold"}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 4. Recruitment Progress */}
                                <div>
                                    <h3 style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px 0" }}>
                                        Recruitment Progress
                                    </h3>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        {/* Round 1 */}
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                            <span style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>Round 1 → Technical Assessment</span>
                                            <span style={{ fontSize: "12px", fontWeight: "800", color: isSelected || currentRoundNum > 1 || selectedApplication.applicationStatus === "Shortlisted" || selectedApplication.applicationStatus === "Interview Scheduled" || selectedApplication.applicationStatus === "Interview Completed" ? "#16a34a" : (isNotShortlisted ? "#dc2626" : "#2563eb") }}>
                                                {isSelected || currentRoundNum > 1 || selectedApplication.applicationStatus === "Shortlisted" || selectedApplication.applicationStatus === "Interview Scheduled" || selectedApplication.applicationStatus === "Interview Completed" ? "Passed ✓" : (isNotShortlisted ? "Failed ✕" : "In Progress ●")}
                                            </span>
                                        </div>

                                        {/* Round 2 */}
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                            <span style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>Round 2 → Technical Interview</span>
                                            <span style={{ fontSize: "12px", fontWeight: "800", color: isSelected || (currentRoundNum > 2 && !isNotShortlisted) || selectedApplication.applicationStatus === "Interview Completed" ? "#16a34a" : (currentRoundNum === 2 && !isNotShortlisted ? "#2563eb" : (isNotShortlisted ? "#dc2626" : "#64748b")) }}>
                                                {isSelected || (currentRoundNum > 2 && !isNotShortlisted) || selectedApplication.applicationStatus === "Interview Completed" ? "Passed ✓" : (currentRoundNum === 2 && !isNotShortlisted ? "In Progress ●" : (isNotShortlisted ? "Locked 🔒" : "Upcoming ○"))}
                                            </span>
                                        </div>

                                        {/* Round 3 */}
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                                            <span style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>Round 3 → HR Bar Raiser</span>
                                            <span style={{ fontSize: "12px", fontWeight: "800", color: isSelected || (currentRoundNum > 3 && !isNotShortlisted) ? "#16a34a" : (currentRoundNum === 3 && !isNotShortlisted ? "#2563eb" : (isNotShortlisted ? "#dc2626" : "#64748b")) }}>
                                                {isSelected || (currentRoundNum > 3 && !isNotShortlisted) ? "Passed ✓" : (currentRoundNum === 3 && !isNotShortlisted ? "In Progress ●" : (isNotShortlisted ? "Locked 🔒" : "Upcoming ○"))}
                                            </span>
                                        </div>

                                        {/* Selected Outcome */}
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: "10px", backgroundColor: isSelected ? "#f0fdf4" : "#f8fafc", border: isSelected ? "1px solid #bbf7d0" : "1px solid #e2e8f0" }}>
                                            <span style={{ fontSize: "13px", fontWeight: "700", color: isSelected ? "#16a34a" : "#0f172a" }}>Selected → Final Offer Outcome</span>
                                            <span style={{ fontSize: "12px", fontWeight: "800", color: isSelected ? "#16a34a" : (isNotShortlisted ? "#dc2626" : "#ca8a04") }}>
                                                {isSelected ? "Selected 🎉" : (isNotShortlisted ? "Not Shortlisted ✕" : "Pending ⏳")}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* 5. Interview Details (Clean Location Description & Shown ONLY when an interview is scheduled/completed) */}
                                {hasInterview && (
                                    <div>
                                        <h3 style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px 0" }}>
                                            Interview Details
                                        </h3>
                                        <div style={{ backgroundColor: "#faf5ff", borderRadius: "12px", padding: "16px", border: "1px solid #e9d5ff", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
                                            <div>
                                                <span style={{ color: "#7e22ce", display: "block", fontSize: "11px", fontWeight: "700" }}>INTERVIEW ROUND</span>
                                                <span style={{ fontWeight: "700", color: "#0f172a" }}>
                                                    {selectedApplication.currentRound === 3 ? "Round 3: HR Bar Raiser" : "Round 2: Technical Interview"}
                                                </span>
                                            </div>
                                            <div>
                                                <span style={{ color: "#7e22ce", display: "block", fontSize: "11px", fontWeight: "700" }}>DATE & TIME</span>
                                                <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedApplication.interviewSchedule?.date || "30 Aug 2026"} at {selectedApplication.interviewSchedule?.time || "03:30 PM"}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: "#7e22ce", display: "block", fontSize: "11px", fontWeight: "700" }}>MODE & LOCATION</span>
                                                <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedApplication.interviewSchedule?.location || "Online — Amazon Chime"}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: "#7e22ce", display: "block", fontSize: "11px", fontWeight: "700" }}>INTERVIEWER</span>
                                                <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedApplication.interviewSchedule?.interviewer || (selectedApplication.currentRound === 3 ? "HR Director" : "Senior Technical Lead")}</span>
                                            </div>
                                            {selectedApplication.interviewSchedule?.meetingLink && (
                                                <div style={{ gridColumn: "span 2" }}>
                                                    <span style={{ color: "#7e22ce", display: "block", fontSize: "11px", fontWeight: "700" }}>MEETING LINK</span>
                                                    <a href={selectedApplication.interviewSchedule.meetingLink} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", fontWeight: "700", textDecoration: "none" }}>
                                                        🔗 {selectedApplication.interviewSchedule.meetingLink}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 6. Candidate Documents */}
                                <div>
                                    <h3 style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px 0" }}>
                                        Candidate Documents
                                    </h3>
                                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                        <button
                                            onClick={() => setShowResumeViewer(true)}
                                            style={{ padding: "10px 16px", backgroundColor: "#f8fafc", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                        >
                                            📄 View Resume
                                        </button>
                                        <button
                                            onClick={() => alert(`Downloading resume for ${selectedApplication.studentName}...`)}
                                            style={{ padding: "10px 16px", backgroundColor: "#f8fafc", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                        >
                                            ⬇ Download Resume
                                        </button>
                                    </div>
                                </div>

                                {/* 7. Dynamic Chronological Application Timeline */}
                                {selectedApplication.history && selectedApplication.history.length > 0 && (
                                    <div>
                                        <h3 style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px 0" }}>
                                            Application Timeline
                                        </h3>
                                        <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "16px", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: "12px" }}>
                                            {selectedApplication.history.map((hItem, hIdx) => (
                                                <div key={hIdx} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                                    <div style={{ minWidth: "100px", fontSize: "11px", color: "#64748b", fontWeight: "700" }}>{hItem.date}</div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>{hItem.title}</div>
                                                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{hItem.desc}</div>
                                                    </div>
                                                    <span style={{ fontSize: "11px", fontWeight: "800", color: hItem.status.includes("Passed") || hItem.status.includes("Selected") || hItem.status.includes("Completed") ? "#16a34a" : (hItem.status.includes("Not Shortlisted") ? "#dc2626" : "#2563eb") }}>
                                                        {hItem.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* STICKY STAGE-DEPENDENT RECRUITER ACTIONS PANEL */}
                            <div style={{ padding: "16px 28px", backgroundColor: "#f8fafc", borderTop: "1px solid #eaedf0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", bottom: 0, zIndex: 10 }}>
                                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                                    Recruiter Actions Panel
                                </div>
                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                    {/* Applied -> Shortlist for Round 1 or Reject */}
                                    {selectedApplication.applicationStatus === "Applied" && (
                                        <button
                                            onClick={() => handleUpdateApplicationState(
                                                selectedApplication.id,
                                                "Shortlisted",
                                                "Shortlisted for Round 1",
                                                "Candidate application approved and shortlisted for Round 1 Assessment.",
                                                1,
                                                "In Progress",
                                                "Round 1: Online Assessment"
                                            )}
                                            style={{ padding: "10px 18px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                        >
                                            ✓ Shortlist for Round 1
                                        </button>
                                    )}

                                    {/* Active Round Evaluation -> Submit Result to Placement Officer */}
                                    {(selectedApplication.applicationStatus === "Shortlisted" || selectedApplication.applicationStatus === "Interview Scheduled" || selectedApplication.applicationStatus === "Interview Completed") && (
                                        <>
                                            {selectedApplication.roundStatus === "Pending Officer Verification" ? (
                                                <span style={{ padding: "8px 16px", backgroundColor: "#fffbeb", color: "#d97706", border: "1px solid #fde68a", borderRadius: "8px", fontSize: "12.5px", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                                    🟠 Round {selectedApplication.currentRound || 1} Result Awaiting Officer Verification
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => setShowRoundEvalModal(true)}
                                                    style={{ padding: "10px 18px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", boxShadow: "0 2px 4px rgba(37,99,235,0.2)" }}
                                                >
                                                    📝 Evaluate Round {selectedApplication.currentRound || 1} & Submit to Officer
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {/* Selected -> Offer Letter Issued */}
                                    {selectedApplication.applicationStatus === "Selected" && (
                                        <span style={{ padding: "8px 16px", backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "8px", fontSize: "13px", fontWeight: "800" }}>
                                            🏆 Selected & Verified by Placement Officer
                                        </span>
                                    )}

                                    {/* Not Shortlisted -> Application Closed */}
                                    {isNotShortlisted && (
                                        <span style={{ padding: "8px 16px", backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px", fontSize: "13px", fontWeight: "800" }}>
                                            🔴 Application Process Closed
                                        </span>
                                    )}

                                    {/* Reject Button (Allowed for active non-final applications) */}
                                    {!isSelected && !isNotShortlisted && (
                                        <button
                                            onClick={() => setShowRejectPrompt(true)}
                                            style={{ padding: "10px 18px", backgroundColor: "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                                        >
                                            ✕ Reject Application
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* MULTI-ROUND EVALUATION MODAL (Submit Result to Placement Officer) */}
            {showRoundEvalModal && selectedApplication && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.7)",
                        backdropFilter: "blur(4px)",
                        zIndex: 99999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "16px"
                    }}
                    onClick={() => setShowRoundEvalModal(false)}
                >
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            width: "100%",
                            maxWidth: "520px",
                            padding: "24px",
                            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)",
                            border: "1px solid #eaedf0"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                                    📝 Round Evaluation — {selectedApplication.studentName}
                                </h3>
                                <span style={{ fontSize: "12px", color: "#64748b" }}>{selectedApplication.jobRole} ({selectedApplication.companyName})</span>
                            </div>
                            <span style={{ backgroundColor: "#dbeafe", color: "#1d4ed8", padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "800" }}>
                                Round {selectedApplication.currentRound || 1}
                            </span>
                        </div>

                        <div style={{ backgroundColor: "#f8fafc", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px", fontSize: "12.5px" }}>
                            <strong>Current Round:</strong> {selectedApplication.roundName || `Round ${selectedApplication.currentRound || 1}: Assessment`}
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", marginBottom: "6px" }}>
                                RECRUITER EVALUATION OUTCOME *
                            </label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <button
                                    type="button"
                                    onClick={() => setEvalDecision("PASS")}
                                    style={{
                                        padding: "10px",
                                        borderRadius: "8px",
                                        border: evalDecision === "PASS" ? "2px solid #16a34a" : "1px solid #cbd5e1",
                                        backgroundColor: evalDecision === "PASS" ? "#f0fdf4" : "#ffffff",
                                        color: evalDecision === "PASS" ? "#16a34a" : "#475569",
                                        fontWeight: "800",
                                        fontSize: "13px",
                                        cursor: "pointer"
                                    }}
                                >
                                    🟢 PASS (Qualify for Next Round)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEvalDecision("FAIL")}
                                    style={{
                                        padding: "10px",
                                        borderRadius: "8px",
                                        border: evalDecision === "FAIL" ? "2px solid #dc2626" : "1px solid #cbd5e1",
                                        backgroundColor: evalDecision === "FAIL" ? "#fef2f2" : "#ffffff",
                                        color: evalDecision === "FAIL" ? "#dc2626" : "#475569",
                                        fontWeight: "800",
                                        fontSize: "13px",
                                        cursor: "pointer"
                                    }}
                                >
                                    🔴 FAIL (Disqualify)
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", marginBottom: "6px" }}>
                                ROUND SCORE / RATING
                            </label>
                            <input
                                type="text"
                                value={evalScore}
                                onChange={(e) => setEvalScore(e.target.value)}
                                placeholder="e.g. 88/100, Grade A, Cleared"
                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                            />
                        </div>

                        <div style={{ marginBottom: "18px" }}>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase", marginBottom: "6px" }}>
                                TECHNICAL REMARKS & FEEDBACK FOR OFFICER *
                            </label>
                            <textarea
                                rows={3}
                                value={evalRemarks}
                                onChange={(e) => setEvalRemarks(e.target.value)}
                                placeholder="Describe performance, coding accuracy, communication, and recommendation..."
                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" }}
                            />
                        </div>

                        <div style={{ backgroundColor: "#eff6ff", padding: "10px 12px", borderRadius: "8px", border: "1px solid #bfdbfe", fontSize: "11.5px", color: "#1e40af", marginBottom: "16px" }}>
                            ℹ️ <strong>Officer Control Flow:</strong> The recruiter's round decision will be submitted to the Placement Officer. The student will advance only after official Officer verification.
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button
                                type="button"
                                onClick={() => setShowRoundEvalModal(false)}
                                style={{ padding: "9px 16px", backgroundColor: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitRoundEvaluation}
                                style={{ padding: "9px 18px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                            >
                                🚀 Submit Result to Placement Officer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REJECTION REASON PROMPT MODAL */}
            {showRejectPrompt && selectedApplication && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.7)",
                        backdropFilter: "blur(4px)",
                        zIndex: 10000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px"
                    }}
                    onClick={() => setShowRejectPrompt(false)}
                >
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            padding: "24px",
                            width: "100%",
                            maxWidth: "480px",
                            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
                            border: "1px solid #eaedf0"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                            Reject Application
                        </h3>
                        <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#64748b" }}>
                            Specify rejection reason for {selectedApplication.studentName}. This will update application status in MongoDB.
                        </p>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                                REJECTION REASON
                            </label>
                            <select
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }}
                            >
                                <option value="Technical assessment score below threshold">Technical assessment score below threshold</option>
                                <option value="Did not meet eligibility criteria">Did not meet eligibility criteria</option>
                                <option value="Interview performance below threshold">Interview performance below threshold</option>
                                <option value="Position filled / Openings exhausted">Position filled / Openings exhausted</option>
                                <option value="Other / Special circumstance">Other / Special circumstance</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                                RECRUITER NOTE (OPTIONAL)
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Add specific feedback or evaluation notes..."
                                value={rejectNote}
                                onChange={(e) => setRejectNote(e.target.value)}
                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                            />
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button
                                onClick={() => setShowRejectPrompt(false)}
                                style={{ padding: "8px 16px", backgroundColor: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    const fullReason = rejectNote ? `${rejectReason}: ${rejectNote}` : rejectReason;
                                    handleUpdateApplicationState(
                                        selectedApplication.id,
                                        "Not Shortlisted",
                                        `Not Shortlisted in Round ${selectedApplication.currentRound || 1}`,
                                        `Application rejected. Reason: ${fullReason}`,
                                        selectedApplication.currentRound || 1,
                                        "Failed",
                                        selectedApplication.roundName,
                                        fullReason
                                    );
                                }}
                                style={{ padding: "8px 16px", backgroundColor: "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ATS RESUME DOCUMENT VIEWER OVERLAY */}
            {showResumeViewer && selectedApplication && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.8)",
                        backdropFilter: "blur(4px)",
                        zIndex: 10000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px"
                    }}
                    onClick={() => setShowResumeViewer(false)}
                >
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            width: "100%",
                            maxWidth: "600px",
                            padding: "28px",
                            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                                📄 ATS Verified Resume — {selectedApplication.studentName}
                            </h3>
                            <button onClick={() => setShowResumeViewer(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>✕</button>
                        </div>
                        <div style={{ backgroundColor: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #eaedf0", fontSize: "13px", color: "#334155", display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div><strong>Name:</strong> {selectedApplication.studentName}</div>
                            <div><strong>Register Number:</strong> {selectedApplication.registerNumber}</div>
                            <div><strong>Department:</strong> {selectedApplication.branch} (CGPA: {selectedApplication.cgpa})</div>
                            <div><strong>Email:</strong> {selectedApplication.email}</div>
                            <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "10px 0" }} />
                            <div><strong>Technical Core Skills:</strong> Java, Python, Data Structures & Algorithms, React, AWS, Node.js</div>
                            <div><strong>Projects:</strong> College Placement Management System, Cloud Infrastructure Automation</div>
                            <div><strong>Status:</strong> Verified & Certified by College Placement Office</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
