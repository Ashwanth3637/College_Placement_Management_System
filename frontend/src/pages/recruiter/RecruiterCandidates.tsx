import React, { useState, useMemo, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";
import { formatCleanRoundName } from "../../utils/roundUtils";

export interface CandidateItem {
    id: string;
    registerNumber: string;
    name: string;
    email: string;
    branch: string;
    cgpa: number;
    gradYear: number;
    appliedDrive: string;
    applicationStatus: "Applied" | "Shortlisted" | "Interview Scheduled" | "Selected" | "Rejected";
    appliedDate?: string;
}

export interface RecruiterCandidatesProps {
    user?: any;
    onViewProfile?: (candidate: CandidateItem) => void;
}

export const RecruiterCandidates: React.FC<RecruiterCandidatesProps> = ({ user, onViewProfile }) => {
    const recruiterCompany = user?.company || "Amazon Development Center";

    // Filter States
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [driveFilter, setDriveFilter] = useState<string>("All Drives");
    const [branchFilter, setBranchFilter] = useState<string>("All Branches");
    const [gradYearFilter, setGradYearFilter] = useState<string>("All Years");
    const [statusFilter, setStatusFilter] = useState<string>("All Statuses");

    const companyNameShort = recruiterCompany.split(" ")[0] || "Amazon";

    const [candidates, setCandidates] = useState<CandidateItem[]>([]);
    const [drivesList, setDrivesList] = useState<string[]>([
        "Software Developer",
        "Sales Development",
        "Cloud Engineer"
    ]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Candidate Records loaded exclusively from live database & registered applications
    const initialCandidates: CandidateItem[] = [];

    // Load Candidate Records from API + Local Storage
    const fetchCandidateRecords = async () => {
        setIsLoading(true);
        let list: CandidateItem[] = [];

        try {
            // Fetch registered applications from MongoDB backend API
            const appRes = await fetch(`${API_BASE_URL}/api/applications?company=${encodeURIComponent(companyNameShort)}`);
            if (appRes.ok) {
                const dbApps = await appRes.json();
                if (Array.isArray(dbApps) && dbApps.length > 0) {
                    dbApps.forEach((app: any) => {
                        const existingCand = list.find(c => c.email.toLowerCase() === (app.email || "").toLowerCase());
                        if (existingCand) {
                            existingCand.applicationStatus = app.status || existingCand.applicationStatus;
                            existingCand.appliedDrive = app.jobRole || existingCand.appliedDrive;
                        } else {
                            list.push({
                                id: app._id || app.id || `cand_db_${Date.now()}`,
                                registerNumber: app.regNo || "22CSR100",
                                name: app.studentName || "Student Candidate",
                                email: app.email,
                                branch: app.department || "CSE",
                                cgpa: app.cgpa || 8.0,
                                gradYear: app.gradYear || 2026,
                                appliedDrive: app.jobRole || "Software Developer",
                                applicationStatus: app.status || "Applied",
                                appliedDate: app.appliedDate || "24 Aug 2026"
                            });
                        }
                    });
                }
            }

            // Fetch registered students from backend
            const res = await fetch(`${API_BASE_URL}/api/student/all`);
            if (res.ok) {
                const apiStudents = await res.json();
                if (Array.isArray(apiStudents) && apiStudents.length > 0) {
                    const mapped: CandidateItem[] = apiStudents.map((st: any, idx: number) => ({
                        id: st._id || st.id || `cand_api_${idx}`,
                        registerNumber: st.personal?.registerNumber || st.registerNumber || `22CSR${100 + idx}`,
                        name: st.user?.name || st.name || "Student Candidate",
                        email: st.user?.email || st.email || "student@gmail.com",
                        branch: st.personal?.department?.includes("Computer") ? "CSE" : (st.personal?.department?.includes("Information") ? "IT" : "ECE"),
                        cgpa: st.academic?.cgpa !== undefined ? Number(st.academic.cgpa) : 7.8,
                        gradYear: st.academic?.graduationYear !== undefined ? Number(st.academic.graduationYear) : 2026,
                        appliedDrive: "Software Developer",
                        applicationStatus: "Applied",
                        appliedDate: "24 Aug 2026"
                    }));

                    mapped.forEach(m => {
                        if (!list.some(c => c.email.toLowerCase() === m.email.toLowerCase())) {
                            list.push(m);
                        }
                    });
                }
            }
        } catch (err) {
            console.error("Error fetching candidates:", err);
        }

        // Build role options list cleanly with case-insensitive deduplication
        const rolesSet = new Set<string>();
        ["Software Developer", "Sales Development", "Cloud Engineer"].forEach(r => rolesSet.add(r));

        list.forEach((c) => {
            if (c.appliedDrive) {
                const existing = Array.from(rolesSet).find(r => r.toLowerCase() === c.appliedDrive.toLowerCase());
                if (!existing) {
                    rolesSet.add(c.appliedDrive);
                }
            }
        });

        try {
            const savedDrivesStr = localStorage.getItem("cpms_drives");
            if (savedDrivesStr) {
                const parsedDrives = JSON.parse(savedDrivesStr);
                if (Array.isArray(parsedDrives)) {
                    parsedDrives.forEach((d: any) => {
                        const role = d.jobRole || d.role || d.title;
                        if (role) {
                            const existing = Array.from(rolesSet).find(r => r.toLowerCase() === role.toLowerCase());
                            if (!existing) {
                                rolesSet.add(role);
                            }
                        }
                    });
                }
            }
        } catch (e) { }

        try {
            const drivesRes = await fetch(`${API_BASE_URL}/api/company/drives?company=${encodeURIComponent(companyNameShort)}`);
            if (drivesRes.ok) {
                const driveData = await drivesRes.json();
                if (Array.isArray(driveData) && driveData.length > 0) {
                    driveData.forEach((d: any) => {
                        const role = d.jobRole || d.role || d.title;
                        if (role) {
                            const existing = Array.from(rolesSet).find(r => r.toLowerCase() === role.toLowerCase());
                            if (!existing) {
                                rolesSet.add(role);
                            }
                        }
                    });
                }
            }
        } catch (e) { }

        setDrivesList(Array.from(rolesSet));
        setCandidates(list);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCandidateRecords();
    }, []);

    // Filter Logic
    const filteredCandidates = candidates.filter((cand) => {
        // Search Filter (Candidate Name, Register No., Email, Branch, Drive)
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = query === "" ||
            cand.name.toLowerCase().includes(query) ||
            cand.registerNumber.toLowerCase().includes(query) ||
            cand.email.toLowerCase().includes(query) ||
            cand.branch.toLowerCase().includes(query) ||
            cand.appliedDrive.toLowerCase().includes(query);

        // Placement Drive Filter (Matches Role Name)
        const matchesDrive = driveFilter === "All Drives" ||
            cand.appliedDrive.toLowerCase() === driveFilter.toLowerCase();

        // Branch Filter
        const matchesBranch = branchFilter === "All Branches" || cand.branch.toLowerCase() === branchFilter.toLowerCase();

        // Graduation Year Filter
        const matchesGradYear = gradYearFilter === "All Years" || String(cand.gradYear) === gradYearFilter;

        // Application Status Filter
        const matchesStatus = statusFilter === "All Statuses" || cand.applicationStatus.toLowerCase() === statusFilter.toLowerCase();

        return matchesSearch && matchesDrive && matchesBranch && matchesGradYear && matchesStatus;
    });

    // Helper for Exact Status Badge Styles as specified:
    // 🟡 Applied | 🔵 Shortlisted | 🟣 Interview Scheduled | 🟢 Selected | 🔴 Rejected
    const getStatusBadgeStyle = (status: CandidateItem["applicationStatus"]) => {
        switch (status) {
            case "Applied":
                return { bg: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", label: "🟡 Applied" };
            case "Shortlisted":
                return { bg: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", label: "🔵 Shortlisted" };
            case "Interview Scheduled":
                return { bg: "#faf5ff", color: "#7e22ce", border: "1px solid #e9d5ff", label: "🟣 Interview Scheduled" };
            case "Selected":
                return { bg: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", label: "🟢 Selected" };
            case "Rejected":
                return { bg: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5", label: "🔴 Rejected" };
            default:
                return { bg: "#f8fafc", color: "#64748b", border: "1px solid #cbd5e1", label: status };
        }
    };

    const [selectedCandidate, setSelectedCandidate] = useState<CandidateItem | null>(null);

    // Escape Key Listener & Body Overflow Lock
    useEffect(() => {
        if (selectedCandidate) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setSelectedCandidate(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedCandidate]);

    return (
        <div style={{ padding: "8px 0" }}>
            {/* Header Section */}
            <div style={{ marginBottom: "20px" }}>
                <h2 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.3px" }}>
                    Candidates
                </h2>
                <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                    View and manage candidates eligible for your placement drives.
                </p>
            </div>

            {/* SEARCH & FILTERS BAR */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "18px", border: "1px solid #e2e8f0", marginBottom: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                {/* Search Candidate */}
                <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
                        🔍 Search Candidate
                    </label>
                    <input
                        type="text"
                        placeholder="Search candidate by name, register number (e.g. 22CSR101)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "11px 16px",
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            fontSize: "14px",
                            outline: "none",
                            boxSizing: "border-box",
                            backgroundColor: "#f8fafc"
                        }}
                    />
                </div>

                {/* 4 Filter Dropdowns Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                    {/* Placement Drive Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                            Placement Drive
                        </label>
                        <select
                            value={driveFilter}
                            onChange={(e) => setDriveFilter(e.target.value)}
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
                            onChange={(e) => setBranchFilter(e.target.value)}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#fff", color: "#0f172a", outline: "none" }}
                        >
                            <option value="All Branches">All Branches</option>
                            <option value="CSE">CSE</option>
                            <option value="IT">IT</option>
                            <option value="ECE">ECE</option>
                            <option value="EEE">EEE</option>
                            <option value="MECH">MECH</option>
                            <option value="CIVIL">CIVIL</option>
                        </select>
                    </div>

                    {/* Graduation Year Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                            Graduation Year
                        </label>
                        <select
                            value={gradYearFilter}
                            onChange={(e) => setGradYearFilter(e.target.value)}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#fff", color: "#0f172a", outline: "none" }}
                        >
                            <option value="All Years">All Years</option>
                            <option value="2026">2026</option>
                            <option value="2025">2025</option>
                            <option value="2027">2027</option>
                        </select>
                    </div>

                    {/* Application Status Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                            Application Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#fff", color: "#0f172a", outline: "none" }}
                        >
                            <option value="All Statuses">All Statuses</option>
                            <option value="Applied">Applied</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interview Scheduled">Interview Scheduled</option>
                            <option value="Selected">Selected</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* CANDIDATE TABLE */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                {isLoading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                        ⏳ Loading Candidates...
                    </div>
                ) : filteredCandidates.length === 0 ? (
                    <div style={{ padding: "48px 24px", textAlign: "center" }}>
                        <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
                        <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>No Candidates Found</h3>
                        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                            No candidates match your search query or filter selection.
                        </p>
                    </div>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "900px" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                    <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Candidate</th>
                                    <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Register No.</th>
                                    <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Branch</th>
                                    <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>CGPA</th>
                                    <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Graduation</th>
                                    <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Applied Drive</th>
                                    <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Status</th>
                                    <th style={{ padding: "14px 18px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", textAlign: "center" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCandidates.map((cand, idx) => {
                                    const badgeStyle = getStatusBadgeStyle(cand.applicationStatus);
                                    return (
                                        <tr
                                            key={cand.id}
                                            style={{
                                                borderBottom: idx !== filteredCandidates.length - 1 ? "1px solid #f1f5f9" : "none",
                                                backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fafafa",
                                                transition: "background-color 0.15s ease"
                                            }}
                                        >
                                            {/* Candidate Name & Email */}
                                            <td style={{ padding: "14px 18px" }}>
                                                <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>
                                                    {cand.name}
                                                </div>
                                                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                                                    {cand.email}
                                                </div>
                                            </td>

                                            {/* Register No. */}
                                            <td style={{ padding: "14px 18px" }}>
                                                <span style={{ fontFamily: "monospace", fontWeight: "700", fontSize: "13px", color: "#334155", backgroundColor: "#f1f5f9", padding: "3px 8px", borderRadius: "6px" }}>
                                                    {cand.registerNumber}
                                                </span>
                                            </td>

                                            {/* Branch */}
                                            <td style={{ padding: "14px 18px", fontSize: "13px", color: "#334155", fontWeight: "700" }}>
                                                {cand.branch}
                                            </td>

                                            {/* CGPA */}
                                            <td style={{ padding: "14px 18px" }}>
                                                <span style={{ fontWeight: "800", color: cand.cgpa >= 8.0 ? "#16a34a" : "#2563eb", fontSize: "14px" }}>
                                                    {cand.cgpa.toFixed(cand.cgpa % 1 === 0 ? 1 : 2)}
                                                </span>
                                            </td>

                                            {/* Graduation */}
                                            <td style={{ padding: "14px 18px", fontSize: "13px", color: "#475569", fontWeight: "600" }}>
                                                {cand.gradYear}
                                            </td>

                                            {/* Applied Drive */}
                                            <td style={{ padding: "14px 18px" }}>
                                                <span style={{ fontWeight: "700", color: "#0f172a", fontSize: "13px" }}>
                                                    {cand.appliedDrive}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td style={{ padding: "14px 18px" }}>
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

                                            {/* Action: View Button */}
                                            <td style={{ padding: "14px 18px", textAlign: "center" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedCandidate(cand);
                                                        if (onViewProfile) onViewProfile(cand);
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
                )}
            </div>

            {/* CANDIDATE DETAILS POPUP MODAL */}
            {selectedCandidate && (() => {
                const badgeStyle = getStatusBadgeStyle(selectedCandidate.applicationStatus);
                
                // Dynamic detail resolution aligned with progress timeline
                let currentRoundLabel = "Round 1: Technical Assessment";
                if (selectedCandidate.applicationStatus === "Selected") {
                    currentRoundLabel = "Final Round Passed — Offer Letter Dispatched";
                } else if (selectedCandidate.applicationStatus === "Interview Scheduled") {
                    currentRoundLabel = "Round 2: Technical & HR Interview";
                } else if (selectedCandidate.applicationStatus === "Shortlisted") {
                    currentRoundLabel = "Round 1: Online Technical Assessment";
                } else if (selectedCandidate.applicationStatus === "Rejected") {
                    currentRoundLabel = "Selection Process Completed";
                } else if (selectedCandidate.applicationStatus === "Applied") {
                    currentRoundLabel = "Round 1: Technical Assessment";
                }

                let interviewDetails = "No interview scheduled yet.";
                if (selectedCandidate.applicationStatus === "Interview Scheduled") {
                    interviewDetails = "Aug 18, 2026 at 02:00 PM (IST) — Technical Interview (Google Meet)";
                } else if (selectedCandidate.applicationStatus === "Selected") {
                    interviewDetails = "Technical & HR Interviews Completed (Aug 15, 2026)";
                }

                let remarksText = "Candidate profile verified by Placement Cell.";
                if (selectedCandidate.name.includes("Rahul")) {
                    remarksText = "Strong technical core in Java & Data Structures. Profile verified for Software Developer drive.";
                } else if (selectedCandidate.name.includes("Priya")) {
                    remarksText = "High CGPA 8.7 in IT department. Shortlisted for Online Assessment.";
                } else if (selectedCandidate.name.includes("Ashwanth")) {
                    remarksText = "Excellent project portfolio. Technical interview scheduled with Senior Engineering Lead.";
                } else if (selectedCandidate.name.includes("Ananya")) {
                    remarksText = "Top ranker (CGPA 9.1). Cleared all technical & HR rounds. Official offer letter issued.";
                } else if (selectedCandidate.name.includes("Arun")) {
                    remarksText = "Application submitted for Sales Development drive. Pending initial document verification.";
                }

                const historyItems = [
                    { title: "Application Submitted", date: selectedCandidate.appliedDate || "24 Aug 2026", status: "Passed ✓", color: "#16a34a" },
                    { title: "Academic & Profile Verification", date: "25 Aug 2026", status: "Passed ✓", color: "#16a34a" },
                    {
                        title: "Technical Assessment",
                        date: "26 Aug 2026",
                        status: selectedCandidate.applicationStatus === "Applied" ? "In Progress ⏳" : "Passed ✓",
                        color: selectedCandidate.applicationStatus === "Applied" ? "#2563eb" : "#16a34a"
                    },
                    {
                        title: "Technical & HR Interview",
                        date: "28 Aug 2026",
                        status: selectedCandidate.applicationStatus === "Interview Scheduled"
                            ? "Scheduled 🗓️"
                            : selectedCandidate.applicationStatus === "Selected"
                            ? "Passed ✓"
                            : selectedCandidate.applicationStatus === "Rejected"
                            ? "Not Selected ✕"
                            : "Locked 🔒",
                        color: selectedCandidate.applicationStatus === "Interview Scheduled"
                            ? "#7e22ce"
                            : selectedCandidate.applicationStatus === "Selected"
                            ? "#16a34a"
                            : selectedCandidate.applicationStatus === "Rejected"
                            ? "#dc2626"
                            : "#94a3b8"
                    },
                    {
                        title: "Final Placement Status",
                        date: "30 Aug 2026",
                        status: selectedCandidate.applicationStatus === "Selected" ? "Offer Accepted 🎉" : "Pending ⏳",
                        color: selectedCandidate.applicationStatus === "Selected" ? "#16a34a" : "#64748b"
                    }
                ];

                return (
                    <div
                        onClick={() => setSelectedCandidate(null)}
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100vw",
                            height: "100vh",
                            backgroundColor: "rgba(15, 23, 42, 0.65)",
                            backdropFilter: "blur(4px)",
                            zIndex: 9999,
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
                                maxWidth: "680px",
                                width: "100%",
                                overflow: "hidden",
                                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
                            }}
                        >
                            {/* Modal Header */}
                            <div style={{ backgroundColor: "#0f172a", color: "#ffffff", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#ffffff" }}>
                                        {selectedCandidate.name} – Candidate Details
                                    </h3>
                                    <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: "600" }}>
                                        Register No: {selectedCandidate.registerNumber} • {recruiterCompany}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedCandidate(null)}
                                    style={{
                                        backgroundColor: "rgba(255, 255, 255, 0.15)",
                                        border: "1px solid rgba(255, 255, 255, 0.3)",
                                        color: "#ffffff",
                                        width: "34px",
                                        height: "34px",
                                        borderRadius: "50%",
                                        cursor: "pointer",
                                        fontSize: "16px",
                                        fontWeight: "800",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center"
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", maxHeight: "75vh", overflowY: "auto" }}>
                                
                                {/* 1. Student Information */}
                                <div style={{ backgroundColor: "#f8fafc", padding: "14px 18px", borderRadius: "12px", border: "1px solid #eaedf0" }}>
                                    <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>
                                        👤 Student Information
                                    </h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", color: "#334155" }}>
                                        <div><strong>Name:</strong> {selectedCandidate.name}</div>
                                        <div><strong>Register Number:</strong> <span style={{ fontFamily: "monospace", backgroundColor: "#e2e8f0", padding: "2px 6px", borderRadius: "4px" }}>{selectedCandidate.registerNumber}</span></div>
                                        <div><strong>Email:</strong> {selectedCandidate.email}</div>
                                        <div><strong>Branch / Dept:</strong> {selectedCandidate.branch}</div>
                                        <div><strong>CGPA:</strong> <strong style={{ color: selectedCandidate.cgpa >= 8.0 ? "#16a34a" : "#2563eb" }}>{selectedCandidate.cgpa.toFixed(2)}</strong></div>
                                        <div><strong>Graduation Year:</strong> {selectedCandidate.gradYear}</div>
                                    </div>
                                </div>

                                {/* 2. Placement Drive Details */}
                                <div style={{ backgroundColor: "#f8fafc", padding: "14px 18px", borderRadius: "12px", border: "1px solid #eaedf0" }}>
                                    <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>
                                        💼 Placement Drive & Application
                                    </h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", color: "#334155" }}>
                                        <div><strong>Applied Drive:</strong> {selectedCandidate.appliedDrive}</div>
                                        <div><strong>Company:</strong> {recruiterCompany}</div>
                                        <div><strong>Application Date:</strong> {selectedCandidate.appliedDate || "24 Aug 2026"}</div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <strong>Application Status:</strong>
                                            <span style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.color, border: badgeStyle.border, padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>
                                                {badgeStyle.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Current Recruitment Round & History */}
                                <div style={{ backgroundColor: "#ffffff", padding: "14px 18px", borderRadius: "12px", border: "1px solid #eaedf0" }}>
                                    <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>
                                        🎯 Recruitment Process & Progress
                                    </h4>
                                    <div style={{ fontSize: "13px", color: "#0f172a", fontWeight: "700", marginBottom: "12px" }}>
                                        Current Stage: <span style={{ color: "#2563eb" }}>{currentRoundLabel}</span>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                        {historyItems.map((h, hIdx) => (
                                            <div key={hIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", padding: "6px 10px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                                                <span style={{ fontWeight: "600", color: "#334155" }}>{h.title}</span>
                                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                    <span style={{ color: "#94a3b8" }}>{h.date}</span>
                                                    <span style={{ fontWeight: "700", color: h.color }}>{h.status}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 4. Interview Status & Remarks */}
                                <div style={{ backgroundColor: "#f8fafc", padding: "14px 18px", borderRadius: "12px", border: "1px solid #eaedf0" }}>
                                    <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>
                                        🗓️ Interview Schedule & Remarks
                                    </h4>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#334155" }}>
                                        <div><strong>Interview Status/Schedule:</strong> {interviewDetails}</div>
                                        <div><strong>Selection Status:</strong> {selectedCandidate.applicationStatus === "Selected" ? "Confirmed Offer Letter Released ✓" : "Pending Evaluation"}</div>
                                        <div style={{ marginTop: "4px", backgroundColor: "#ffffff", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", color: "#475569" }}>
                                            <strong>Remarks:</strong> {remarksText}
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Modal Footer */}
                            <div style={{ padding: "14px 24px", backgroundColor: "#f8fafc", borderTop: "1px solid #eaedf0", display: "flex", justifyContent: "flex-end" }}>
                                <button
                                    onClick={() => setSelectedCandidate(null)}
                                    style={{
                                        padding: "9px 20px",
                                        backgroundColor: "#0f172a",
                                        color: "#ffffff",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                        fontWeight: "700",
                                        cursor: "pointer"
                                    }}
                                >
                                    Close Details
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default RecruiterCandidates;
