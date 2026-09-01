import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";

export interface RecruiterInterviewItem {
    id: string;
    studentName: string;
    email: string;
    registerNumber: string;
    branch?: string;
    cgpa?: number;
    gradYear?: number;
    appliedDrive: string;
    jobRole?: string;
    round: string;
    dateTime: string;
    mode: "Online" | "On-site" | "Hybrid";
    platform?: string;
    location: string;
    interviewer: string;
    status: "Scheduled" | "In Progress" | "Completed" | "Evaluation Pending" | "Cancelled" | "No Show";
    meetingLink?: string;
    notes?: string;
}

interface RecruiterInterviewsProps {
    user?: {
        name?: string;
        email?: string;
        role?: string;
        company?: string;
    };
    onViewInterview?: (interview: RecruiterInterviewItem) => void;
}

type SortField = "studentName" | "appliedDrive" | "round" | "dateTime" | "status";
type SortOrder = "asc" | "desc";

export const RecruiterInterviews: React.FC<RecruiterInterviewsProps> = ({ user, onViewInterview }) => {
    const recruiterCompany = user?.company || "Amazon Development Center";
    const companyNameShort = recruiterCompany.split(" ")[0] || "Amazon";

    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [driveFilter, setDriveFilter] = useState<string>("All Drives");
    const [roundFilter, setRoundFilter] = useState<string>("All Rounds");
    const [statusFilter, setStatusFilter] = useState<string>("All Statuses");
    const [dateFilter, setDateFilter] = useState<string>("All Dates");

    // Sorting & Pagination States
    const [sortField, setSortField] = useState<SortField>("dateTime");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 5;

    const [interviews, setInterviews] = useState<RecruiterInterviewItem[]>([]);
    const [drivesList, setDrivesList] = useState<string[]>([
        "Software Developer",
        "Sales Development",
        "Cloud Engineer"
    ]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Modal States
    const [selectedInterview, setSelectedInterview] = useState<RecruiterInterviewItem | null>(null);
    const [showResumeViewer, setShowResumeViewer] = useState<boolean>(false);

    // Interviews loaded exclusively from live database & scheduled interviews
    const initialInterviews: RecruiterInterviewItem[] = [];

    // Load Applications / Interviews from MongoDB API
    const fetchInterviewsData = async () => {
        setIsLoading(true);
        let list: RecruiterInterviewItem[] = [];

        try {
            const res = await fetch(`${API_BASE_URL}/api/applications?company=${encodeURIComponent(companyNameShort)}`);
            if (res.ok) {
                const apiApps = await res.json();
                if (Array.isArray(apiApps) && apiApps.length > 0) {
                    apiApps.forEach((a: any) => {
                        if (a.interviewSchedule && a.interviewSchedule.date) {
                            const existing = list.find(item => item.email.toLowerCase() === (a.email || "").toLowerCase() && item.appliedDrive.toLowerCase() === (a.jobRole || "").toLowerCase());
                            const sched = a.interviewSchedule;
                            
                            let stdStatus: RecruiterInterviewItem["status"] = "Scheduled";
                            if (sched.status?.includes("Completed")) stdStatus = "Completed";
                            else if (sched.status?.includes("Pending")) stdStatus = "Evaluation Pending";
                            else if (sched.status?.includes("Cancelled")) stdStatus = "Cancelled";
                            else if (sched.status?.includes("In Progress")) stdStatus = "In Progress";
                            else if (sched.status?.includes("No Show")) stdStatus = "No Show";

                            const roundLabel = a.currentRound === 3 ? "Round 3: HR Bar Raiser" : `Round ${a.currentRound || 2}: Technical Interview`;
                            const cleanMode: RecruiterInterviewItem["mode"] = sched.mode === "On-site" ? "On-site" : "Online";
                            const cleanPlatform = sched.meetingLink?.includes("google") ? "Google Meet" : (sched.meetingLink?.includes("chime") ? "Amazon Chime" : (cleanMode === "On-site" ? "Placement Boardroom" : "Online Platform"));

                            if (existing) {
                                existing.dateTime = `${sched.date}, ${sched.time || "10:00 AM IST"}`;
                                existing.mode = cleanMode;
                                existing.platform = cleanPlatform;
                                existing.interviewer = sched.interviewer || existing.interviewer;
                                existing.status = stdStatus;
                                existing.meetingLink = sched.meetingLink || existing.meetingLink;
                                existing.location = sched.location || existing.location;
                                existing.round = roundLabel;
                            } else {
                                list.push({
                                    id: a._id || a.id || `int_db_${Date.now()}`,
                                    studentName: a.studentName || "Student Candidate",
                                    email: a.email,
                                    registerNumber: a.regNo || "22CSR100",
                                    branch: a.department || "CSE",
                                    cgpa: a.cgpa || 8.0,
                                    gradYear: a.gradYear || 2026,
                                    appliedDrive: a.jobRole || "Software Developer",
                                    jobRole: a.jobRole || "Software Developer",
                                    round: roundLabel,
                                    dateTime: `${sched.date || "30 Aug 2026"}, ${sched.time || "10:00 AM IST"}`,
                                    mode: cleanMode,
                                    platform: cleanPlatform,
                                    location: sched.location || (cleanMode === "On-site" ? "Offline — Placement Boardroom" : "Online — Amazon Chime"),
                                    interviewer: sched.interviewer || "Technical Lead",
                                    status: stdStatus,
                                    meetingLink: sched.meetingLink
                                });
                            }
                        }
                    });
                }
            }
        } catch (err) {
            console.error("Error fetching interviews from MongoDB API:", err);
        }

        // Build unique placement drives list
        const rolesSet = new Set<string>();
        ["Software Developer", "Sales Development", "Cloud Engineer"].forEach(r => rolesSet.add(r));
        list.forEach(i => { if (i.appliedDrive) rolesSet.add(i.appliedDrive); });
        setDrivesList(Array.from(rolesSet));

        setInterviews(list);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchInterviewsData();
    }, []);

    // Escape key modal handling
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setSelectedInterview(null);
                setShowResumeViewer(false);
            }
        };
        if (selectedInterview || showResumeViewer) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedInterview, showResumeViewer]);

    // Reset All Filters
    const handleResetFilters = () => {
        setSearchQuery("");
        setDriveFilter("All Drives");
        setRoundFilter("All Rounds");
        setStatusFilter("All Statuses");
        setDateFilter("All Dates");
        setCurrentPage(1);
    };

    // Toggle Header Sort
    const handleHeaderSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    // Filter Logic
    const filteredInterviews = interviews.filter((item) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = query === "" ||
            item.studentName.toLowerCase().includes(query) ||
            item.registerNumber.toLowerCase().includes(query) ||
            item.email.toLowerCase().includes(query) ||
            item.appliedDrive.toLowerCase().includes(query) ||
            item.interviewer.toLowerCase().includes(query);

        const matchesDrive = driveFilter === "All Drives" || item.appliedDrive.toLowerCase() === driveFilter.toLowerCase();
        const matchesRound = roundFilter === "All Rounds" || item.round.toLowerCase().includes(roundFilter.toLowerCase());
        const matchesStatus = statusFilter === "All Statuses" || item.status.toLowerCase() === statusFilter.toLowerCase();

        let matchesDate = true;
        if (dateFilter === "Today") {
            matchesDate = item.dateTime.includes("31 Aug 2026");
        } else if (dateFilter === "Upcoming") {
            matchesDate = item.status === "Scheduled";
        } else if (dateFilter === "Past") {
            matchesDate = item.status === "Completed" || item.status === "Evaluation Pending";
        }

        return matchesSearch && matchesDrive && matchesRound && matchesStatus && matchesDate;
    });

    // Sort Logic
    const sortedInterviews = [...filteredInterviews].sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
    });

    // Pagination Calculation
    const totalCount = sortedInterviews.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedInterviews = sortedInterviews.slice(startIndex, startIndex + itemsPerPage);

    // Exact Status Badge Helpers specified by User
    const getStatusBadgeStyle = (status: RecruiterInterviewItem["status"]) => {
        switch (status) {
            case "Scheduled":
                return { bg: "#faf5ff", color: "#7e22ce", border: "1px solid #e9d5ff", label: "🟣 Scheduled" };
            case "In Progress":
                return { bg: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", label: "🔵 In Progress" };
            case "Completed":
                return { bg: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", label: "🟢 Completed" };
            case "Evaluation Pending":
                return { bg: "#fefce8", color: "#ca8a04", border: "1px solid #fef08a", label: "🟡 Evaluation Pending" };
            case "Cancelled":
                return { bg: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", label: "🔴 Cancelled" };
            case "No Show":
                return { bg: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", label: "⚫ No Show" };
            default:
                return { bg: "#faf5ff", color: "#7e22ce", border: "1px solid #e9d5ff", label: "🟣 Scheduled" };
        }
    };

    // Update Interview Status in State & Broadcast Sync
    const handleUpdateInterviewStatus = async (
        interviewId: string,
        newStatus: RecruiterInterviewItem["status"],
        newNotes?: string
    ) => {
        setInterviews(prev => prev.map(item => {
            if (item.id === interviewId) {
                return { ...item, status: newStatus, notes: newNotes || item.notes };
            }
            return item;
        }));

        if (selectedInterview && selectedInterview.id === interviewId) {
            setSelectedInterview(prev => prev ? { ...prev, status: newStatus, notes: newNotes || prev.notes } : null);
        }

        window.dispatchEvent(new CustomEvent("cpms_interviews_updated"));
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", color: "#0f172a" }}>
            {/* Page Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: "800", margin: "0 0 6px 0", color: "#0f172a", letterSpacing: "-0.02em" }}>
                        Interview Management
                    </h1>
                    <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                        Manage and track scheduled recruitment interviews for placement drives.
                    </p>
                </div>
            </div>

            {/* Top Search & Filter Bar Card */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "20px 24px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Search Input */}
                <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                        Search Candidate
                    </label>
                    <input
                        type="text"
                        placeholder="Search candidate by name, register number (e.g. 22CSR025), drive, or interviewer..."
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

                    {/* Interview Round Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                            Interview Round
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
                        </select>
                    </div>

                    {/* Interview Status Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                            Interview Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#fff", color: "#0f172a", outline: "none" }}
                        >
                            <option value="All Statuses">All Statuses</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Evaluation Pending">Evaluation Pending</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="No Show">No Show</option>
                        </select>
                    </div>

                    {/* Date Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                            Date Filter
                        </label>
                        <select
                            value={dateFilter}
                            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#fff", color: "#0f172a", outline: "none" }}
                        >
                            <option value="All Dates">All Dates</option>
                            <option value="Today">Today</option>
                            <option value="Upcoming">Upcoming</option>
                            <option value="Past">Past</option>
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

            {/* Interview Table Card with Optimized Column Widths (Zero Badge Text Clipping) */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #eaedf0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                {isLoading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                        Loading interview schedules...
                    </div>
                ) : sortedInterviews.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                        No interview schedules match your search or filter criteria.
                    </div>
                ) : (
                    <>
                        <div style={{ overflowX: "auto", width: "100%" }}>
                            <table style={{ width: "100%", minWidth: "1050px", borderCollapse: "collapse", textAlign: "left", whiteSpace: "nowrap" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #eaedf0", color: "#475569", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                        <th onClick={() => handleHeaderSort("studentName")} style={{ padding: "14px 16px", minWidth: "160px", cursor: "pointer", whiteSpace: "nowrap" }}>
                                            Candidate {sortField === "studentName" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                                        </th>
                                        <th style={{ padding: "14px 16px", minWidth: "100px", whiteSpace: "nowrap" }}>Register No.</th>
                                        <th onClick={() => handleHeaderSort("appliedDrive")} style={{ padding: "14px 16px", minWidth: "140px", cursor: "pointer", whiteSpace: "nowrap" }}>
                                            Drive {sortField === "appliedDrive" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                                        </th>
                                        <th onClick={() => handleHeaderSort("round")} style={{ padding: "14px 16px", minWidth: "85px", cursor: "pointer", whiteSpace: "nowrap" }}>
                                            Round {sortField === "round" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                                        </th>
                                        <th onClick={() => handleHeaderSort("dateTime")} style={{ padding: "14px 16px", minWidth: "160px", cursor: "pointer", whiteSpace: "nowrap" }}>
                                            Date & Time {sortField === "dateTime" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                                        </th>
                                        <th style={{ padding: "14px 16px", minWidth: "75px", whiteSpace: "nowrap" }}>Mode</th>
                                        <th style={{ padding: "14px 16px", minWidth: "140px", whiteSpace: "nowrap" }}>Interviewer</th>
                                        <th onClick={() => handleHeaderSort("status")} style={{ padding: "14px 16px", minWidth: "165px", cursor: "pointer", whiteSpace: "nowrap" }}>
                                            Status {sortField === "status" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                                        </th>
                                        <th style={{ padding: "14px 16px", minWidth: "85px", textAlign: "center", whiteSpace: "nowrap" }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedInterviews.map((item, idx) => {
                                        const badgeStyle = getStatusBadgeStyle(item.status);
                                        const simpleRoundLabel = item.round.includes("Round 1") ? "Round 1" : (item.round.includes("Round 3") ? "Round 3" : "Round 2");

                                        return (
                                            <tr
                                                key={item.id || `int_row_${idx}`}
                                                style={{ borderBottom: idx !== paginatedInterviews.length - 1 ? "1px solid #f1f5f9" : "none", transition: "background-color 0.15s ease" }}
                                            >
                                                {/* Candidate Name + Email */}
                                                <td style={{ padding: "14px 16px", minWidth: "160px", whiteSpace: "nowrap" }}>
                                                    <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px", whiteSpace: "nowrap" }}>
                                                        {item.studentName}
                                                    </div>
                                                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", whiteSpace: "nowrap" }}>
                                                        {item.email}
                                                    </div>
                                                </td>

                                                {/* Register No. */}
                                                <td style={{ padding: "14px 16px", minWidth: "100px", whiteSpace: "nowrap" }}>
                                                    <span style={{ fontFamily: "monospace", fontWeight: "700", color: "#334155", fontSize: "13px", backgroundColor: "#f1f5f9", padding: "3px 7px", borderRadius: "6px", whiteSpace: "nowrap" }}>
                                                        {item.registerNumber}
                                                    </span>
                                                </td>

                                                {/* Drive */}
                                                <td style={{ padding: "14px 16px", minWidth: "140px", whiteSpace: "nowrap" }}>
                                                    <span style={{ fontWeight: "700", color: "#0f172a", fontSize: "13px", whiteSpace: "nowrap" }}>
                                                        {item.appliedDrive}
                                                    </span>
                                                </td>

                                                {/* Round */}
                                                <td style={{ padding: "14px 16px", minWidth: "85px", fontSize: "13px", fontWeight: "700", color: "#2563eb", whiteSpace: "nowrap" }}>
                                                    {simpleRoundLabel}
                                                </td>

                                                {/* Date & Time */}
                                                <td style={{ padding: "14px 16px", minWidth: "160px", fontSize: "13px", color: "#475569", fontWeight: "600", whiteSpace: "nowrap" }}>
                                                    {item.dateTime}
                                                </td>

                                                {/* Mode */}
                                                <td style={{ padding: "14px 16px", minWidth: "75px", fontSize: "13px", color: "#334155", fontWeight: "600", whiteSpace: "nowrap" }}>
                                                    {item.mode}
                                                </td>

                                                {/* Interviewer */}
                                                <td style={{ padding: "14px 16px", minWidth: "140px", fontSize: "13px", color: "#0f172a", fontWeight: "700", whiteSpace: "nowrap" }}>
                                                    {item.interviewer}
                                                </td>

                                                {/* Status Badge (100% full text visibility) */}
                                                <td style={{ padding: "14px 16px", minWidth: "165px", whiteSpace: "nowrap" }}>
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
                                                            width: "155px",
                                                            boxSizing: "border-box",
                                                            textAlign: "center"
                                                        }}
                                                    >
                                                        {badgeStyle.label}
                                                    </span>
                                                </td>

                                                {/* Action View Button */}
                                                <td style={{ padding: "14px 16px", minWidth: "85px", textAlign: "center", whiteSpace: "nowrap" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedInterview(item);
                                                            if (onViewInterview) onViewInterview(item);
                                                        }}
                                                        style={{
                                                            backgroundColor: "#0f172a",
                                                            color: "#ffffff",
                                                            border: "none",
                                                            padding: "7px 16px",
                                                            borderRadius: "8px",
                                                            fontSize: "12px",
                                                            fontWeight: "700",
                                                            cursor: "pointer",
                                                            whiteSpace: "nowrap",
                                                            boxShadow: "0 2px 4px rgba(15,23,42,0.12)",
                                                            transition: "all 0.15s ease"
                                                        }}
                                                    >
                                                        View / Record
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
                                Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalCount)} of {totalCount} interview schedules
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

            {/* INTERVIEW DETAILS POPUP MODAL (Strict Mode vs Venue vs Status Grid + Join Meeting Action Button) */}
            {selectedInterview && (() => {
                const badgeStyle = getStatusBadgeStyle(selectedInterview.status);
                const isScheduled = selectedInterview.status === "Scheduled";
                const isCompleted = selectedInterview.status === "Completed";
                const dateLabel = isScheduled ? "SCHEDULED DATE & TIME" : "INTERVIEW DATE & TIME";
                const venueDisplay = selectedInterview.platform || selectedInterview.location;

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
                        onClick={() => setSelectedInterview(null)}
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
                                            Interview Details
                                        </h2>
                                        <span style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color, border: badgeStyle.border, padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
                                            {badgeStyle.label}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                                        Scheduled interview session details for {selectedInterview.studentName}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedInterview(null)}
                                    style={{ background: "none", border: "none", fontSize: "20px", color: "#94a3b8", cursor: "pointer", padding: "4px", borderRadius: "6px" }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* SCROLLABLE MODAL BODY */}
                            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "24px", overflowY: "auto", flex: 1 }}>
                                {/* 1. Student & Drive Information */}
                                <div>
                                    <h3 style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px 0" }}>
                                        Candidate & Placement Drive Info
                                    </h3>
                                    <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "16px", border: "1px solid #f1f5f9", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "700" }}>CANDIDATE NAME</span>
                                            <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedInterview.studentName}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "700" }}>REGISTER NO.</span>
                                            <span style={{ fontFamily: "monospace", fontWeight: "700", color: "#334155" }}>{selectedInterview.registerNumber}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "700" }}>EMAIL ADDRESS</span>
                                            <span style={{ fontWeight: "600", color: "#2563eb" }}>{selectedInterview.email}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "700" }}>DEPARTMENT & CGPA</span>
                                            <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedInterview.branch || "CSE"} (CGPA: {selectedInterview.cgpa || 8.4})</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "700" }}>COMPANY</span>
                                            <span style={{ fontWeight: "700", color: "#0f172a" }}>{recruiterCompany}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "700" }}>JOB ROLE / DRIVE</span>
                                            <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedInterview.appliedDrive}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Interview Session Details (Strict Mode vs Venue vs Status Grid) */}
                                <div>
                                    <h3 style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px 0" }}>
                                        Interview Session Details
                                    </h3>
                                    <div style={{ backgroundColor: "#faf5ff", borderRadius: "12px", padding: "18px", border: "1px solid #e9d5ff", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "13px" }}>
                                        <div>
                                            <span style={{ color: "#7e22ce", display: "block", fontSize: "11px", fontWeight: "700" }}>INTERVIEW ROUND</span>
                                            <span style={{ fontWeight: "800", color: "#0f172a", fontSize: "14px" }}>{selectedInterview.round}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#7e22ce", display: "block", fontSize: "11px", fontWeight: "700" }}>{dateLabel}</span>
                                            <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedInterview.dateTime}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#7e22ce", display: "block", fontSize: "11px", fontWeight: "700" }}>MODE</span>
                                            <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedInterview.mode}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#7e22ce", display: "block", fontSize: "11px", fontWeight: "700" }}>PLATFORM / VENUE</span>
                                            <span style={{ fontWeight: "700", color: "#0f172a" }}>{venueDisplay}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#7e22ce", display: "block", fontSize: "11px", fontWeight: "700" }}>ASSIGNED INTERVIEWER</span>
                                            <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedInterview.interviewer}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#7e22ce", display: "block", fontSize: "11px", fontWeight: "700" }}>INTERVIEW STATUS</span>
                                            <span style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color, border: badgeStyle.border, padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", display: "inline-block", marginTop: "2px" }}>
                                                {badgeStyle.label}
                                            </span>
                                        </div>

                                        {/* Clickable Action Button for Join Meeting */}
                                        {selectedInterview.meetingLink && (
                                            <div style={{ gridColumn: "span 2", paddingTop: "4px" }}>
                                                <span style={{ color: "#7e22ce", display: "block", fontSize: "11px", fontWeight: "700", marginBottom: "6px" }}>MEETING ACCESS LINK</span>
                                                <a
                                                    href={selectedInterview.meetingLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        backgroundColor: "#2563eb",
                                                        color: "#ffffff",
                                                        padding: "8px 18px",
                                                        borderRadius: "8px",
                                                        fontWeight: "700",
                                                        fontSize: "12px",
                                                        textDecoration: "none",
                                                        boxShadow: "0 2px 4px rgba(37,99,235,0.2)"
                                                    }}
                                                >
                                                    🚀 Join {selectedInterview.platform || "Meeting"} ↗
                                                </a>
                                            </div>
                                        )}

                                        {selectedInterview.notes && (
                                            <div style={{ gridColumn: "span 2", paddingTop: "8px", borderTop: "1px dashed #e9d5ff" }}>
                                                <span style={{ color: "#7e22ce", display: "block", fontSize: "11px", fontWeight: "700" }}>EVALUATION NOTES / INSTRUCTIONS</span>
                                                <span style={{ color: "#475569", fontSize: "12px", fontStyle: "italic" }}>{selectedInterview.notes}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 3. Candidate Documents */}
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
                                            onClick={() => alert(`Downloading ATS resume for ${selectedInterview.studentName}...`)}
                                            style={{ padding: "10px 16px", backgroundColor: "#f8fafc", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                        >
                                            ⬇ Download Resume
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* STICKY FOOTER RECRUITER ACTIONS PANEL */}
                            <div style={{ padding: "16px 28px", backgroundColor: "#f8fafc", borderTop: "1px solid #eaedf0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", bottom: 0, zIndex: 10 }}>
                                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                                    Interview Recruiter Actions
                                </div>
                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                    {isScheduled && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateInterviewStatus(selectedInterview.id, "In Progress", "Interview session started.")}
                                                style={{ padding: "9px 16px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                                            >
                                                ▶ Start Interview Session
                                            </button>
                                            <button
                                                onClick={() => handleUpdateInterviewStatus(selectedInterview.id, "Cancelled", "Interview cancelled by recruiter.")}
                                                style={{ padding: "9px 16px", backgroundColor: "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                                            >
                                                ✕ Cancel Session
                                            </button>
                                        </>
                                    )}

                                    {selectedInterview.status === "Evaluation Pending" && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateInterviewStatus(selectedInterview.id, "Completed", "Interview evaluation passed by panel.")}
                                                style={{ padding: "9px 16px", backgroundColor: "#16a34a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                                            >
                                                ✓ Pass Evaluation & Complete
                                            </button>
                                            <button
                                                onClick={() => handleUpdateInterviewStatus(selectedInterview.id, "Cancelled", "Evaluation failed.")}
                                                style={{ padding: "9px 16px", backgroundColor: "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                                            >
                                                ✕ Reject Evaluation
                                            </button>
                                        </>
                                    )}

                                    {isCompleted && (
                                        <span style={{ padding: "8px 16px", backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "8px", fontSize: "12px", fontWeight: "800" }}>
                                            🟢 Interview Evaluation Completed
                                        </span>
                                    )}

                                    <button
                                        onClick={() => setSelectedInterview(null)}
                                        style={{ padding: "9px 18px", backgroundColor: "#0f172a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                                    >
                                        Close Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ATS RESUME DOCUMENT VIEWER OVERLAY */}
            {showResumeViewer && selectedInterview && (
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
                                📄 ATS Verified Resume — {selectedInterview.studentName}
                            </h3>
                            <button onClick={() => setShowResumeViewer(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>✕</button>
                        </div>
                        <div style={{ backgroundColor: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #eaedf0", fontSize: "13px", color: "#334155", display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div><strong>Name:</strong> {selectedInterview.studentName}</div>
                            <div><strong>Register Number:</strong> {selectedInterview.registerNumber}</div>
                            <div><strong>Department:</strong> {selectedInterview.branch || "CSE"} (CGPA: {selectedInterview.cgpa || 8.4})</div>
                            <div><strong>Email:</strong> {selectedInterview.email}</div>
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

export default RecruiterInterviews;
