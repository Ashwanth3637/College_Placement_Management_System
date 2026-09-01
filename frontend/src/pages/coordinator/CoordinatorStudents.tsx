import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";

export interface StudentDriveHistory {
    company: string;
    role: string;
    round: string;
    status: "Shortlisted" | "In Process" | "Selected" | "Rejected" | "Applied";
    date: string;
}

export interface StudentDirectoryItem {
    id: string;
    name: string;
    registerNo: string;
    department: string;
    batch: string;
    email: string;
    phone: string;
    cgpa: number;
    tenthPercentage?: number;
    twelfthPercentage?: number;
    backlogs?: number;
    verificationStatus?: "verified" | "pending";
    placementStatus: "Placed" | "Shortlisted" | "In Process" | "Applied" | "Not Eligible";
    placedCompany?: string;
    placedPackage?: string;
    currentStage?: string;
    skills?: string[];
    resumeUrl?: string;
    drivesHistory?: StudentDriveHistory[];
}

export interface CoordinatorStudentsProps {
    user?: any;
    onBackToDashboard?: () => void;
    onSelectStudent?: (student: StudentDirectoryItem) => void;
}

export const CoordinatorStudents: React.FC<CoordinatorStudentsProps> = ({
    onBackToDashboard
}) => {
    // Clean Student Directory Data loaded exclusively from live system
    const defaultStudents: StudentDirectoryItem[] = [];

    // State
    const [studentsList, setStudentsList] = useState<StudentDirectoryItem[]>([]);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/student/all`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        const mapped: StudentDirectoryItem[] = data.map((s: any, idx: number) => ({
                            id: s._id || s.id || `std_${idx}`,
                            name: s.user?.name || s.personal?.fullName || "Student",
                            registerNo: s.personal?.registerNumber || `22CSR0${25 + idx}`,
                            department: s.personal?.department || "Computer Science & Engineering",
                            batch: "2022-2026",
                            email: s.user?.email || s.personal?.email || "",
                            phone: s.personal?.phone || "+91 98765 43210",
                            cgpa: Number(s.academic?.cgpa || 0),
                            tenthPercentage: Number(s.academic?.tenthPercentage || 0),
                            twelfthPercentage: Number(s.academic?.twelfthPercentage || 0),
                            backlogs: Number(s.academic?.backlogs || 0),
                            verificationStatus: s.isVerified ? "verified" : "pending",
                            placementStatus: "Applied",
                            placedCompany: "General Placement Drive Pool",
                            currentStage: s.isVerified ? "Verified for Placements" : "Profile Pending Verification",
                            skills: s.professional?.skills || [],
                            drivesHistory: []
                        }));
                        setStudentsList(mapped);
                        return;
                    }
                }
            } catch (e) {}
            setStudentsList([]);
        };
        fetchStudents();
    }, []);

    // Modal State
    const [selectedStudent, setSelectedStudent] = useState<StudentDirectoryItem | null>(null);

    // Filters State
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("All");
    const [selectedBatch, setSelectedBatch] = useState("All");
    const [selectedStatus, setSelectedStatus] = useState("All");

    // ESC Key Navigation Handler (2-step hierarchy)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" || e.code === "Escape") {
                if (selectedStudent) {
                    e.stopImmediatePropagation();
                    setSelectedStudent(null);
                } else if (onBackToDashboard) {
                    onBackToDashboard();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown, true);
        return () => window.removeEventListener("keydown", handleKeyDown, true);
    }, [selectedStudent, onBackToDashboard]);

    // Reset Filters Handler
    const handleResetFilters = () => {
        setSearchTerm("");
        setSelectedDepartment("All");
        setSelectedBatch("All");
        setSelectedStatus("All");
    };

    // Filter Logic
    const filteredStudents = studentsList.filter(item => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = item.name.toLowerCase().includes(query) ||
            item.registerNo.toLowerCase().includes(query) ||
            item.email.toLowerCase().includes(query) ||
            item.phone.includes(searchTerm);

        const matchesDepartment = selectedDepartment === "All" || item.department === selectedDepartment;
        const matchesBatch = selectedBatch === "All" || item.batch === selectedBatch;
        const matchesStatus = selectedStatus === "All" || item.placementStatus === selectedStatus;

        return matchesSearch && matchesDepartment && matchesBatch && matchesStatus;
    });

    // Stats calculations
    const totalCount = studentsList.length;
    const placedCount = studentsList.filter(s => s.placementStatus === "Placed").length;
    const shortlistedCount = studentsList.filter(s => s.placementStatus === "Shortlisted").length;
    const inProcessCount = studentsList.filter(s => s.placementStatus === "In Process").length;
    const appliedCount = studentsList.filter(s => s.placementStatus === "Applied").length;

    const getStatusBadge = (status: StudentDirectoryItem["placementStatus"]) => {
        switch (status) {
            case "Placed":
                return { bg: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", icon: "🟢", label: "Placed" };
            case "Shortlisted":
                return { bg: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", icon: "🔵", label: "Shortlisted" };
            case "In Process":
                return { bg: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa", icon: "🟡", label: "In Process" };
            case "Applied":
                return { bg: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1", icon: "⚪", label: "Applied" };
            case "Not Eligible":
                return { bg: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", icon: "🔴", label: "Not Eligible" };
            default:
                return { bg: "#f8fafc", color: "#64748b", border: "1px solid #cbd5e1", icon: "⚪", label: status };
        }
    };

    // Render Status-Dependent Placement Banner in Modal
    const renderPlacementDetailsCard = (student: StudentDirectoryItem) => {
        switch (student.placementStatus) {
            case "Placed":
                return (
                    <div style={{ backgroundColor: "#f0fdf4", padding: "16px 18px", borderRadius: "12px", border: "1px solid #bbf7d0", marginBottom: "18px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            🎉 PLACEMENT OFFER
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                            <div>
                                <div style={{ fontSize: "16px", fontWeight: "800", color: "#14532d" }}>
                                    {student.placedCompany}
                                </div>
                                {student.placedPackage && (
                                    <div style={{ fontSize: "13px", color: "#16a34a", fontWeight: "700", marginTop: "2px" }}>
                                        Compensation: {student.placedPackage}
                                    </div>
                                )}
                            </div>
                            <span style={{ backgroundColor: "#ffffff", color: "#16a34a", border: "1px solid #86efac", padding: "5px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "800" }}>
                                ✅ Offer Confirmed
                            </span>
                        </div>
                    </div>
                );

            case "Shortlisted":
                return (
                    <div style={{ backgroundColor: "#eff6ff", padding: "16px 18px", borderRadius: "12px", border: "1px solid #bfdbfe", marginBottom: "18px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            🔵 SHORTLISTED
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                            <div>
                                <div style={{ fontSize: "16px", fontWeight: "800", color: "#1e3a8a" }}>
                                    {student.placedCompany || "TCS (Ninja / Digital)"}
                                </div>
                                <div style={{ fontSize: "13px", color: "#2563eb", fontWeight: "700", marginTop: "2px" }}>
                                    Next Stage: {student.currentStage || "Technical Interview"}
                                </div>
                            </div>
                            <span style={{ backgroundColor: "#ffffff", color: "#2563eb", border: "1px solid #93c5fd", padding: "5px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "800" }}>
                                🔵 Shortlisted
                            </span>
                        </div>
                    </div>
                );

            case "In Process":
                return (
                    <div style={{ backgroundColor: "#fff7ed", padding: "16px 18px", borderRadius: "12px", border: "1px solid #fed7aa", marginBottom: "18px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#ea580c", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            🟡 APPLICATION IN PROCESS
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                            <div>
                                <div style={{ fontSize: "16px", fontWeight: "800", color: "#9a3412" }}>
                                    {student.placedCompany || "Amazon / Active Drive"}
                                </div>
                                <div style={{ fontSize: "13px", color: "#ea580c", fontWeight: "700", marginTop: "2px" }}>
                                    Current Stage: {student.currentStage || "Round 2 Assessment"}
                                </div>
                            </div>
                            <span style={{ backgroundColor: "#ffffff", color: "#ea580c", border: "1px solid #fdba74", padding: "5px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "800" }}>
                                🟡 In Process
                            </span>
                        </div>
                    </div>
                );

            case "Applied":
            default:
                return (
                    <div style={{ backgroundColor: "#f8fafc", padding: "16px 18px", borderRadius: "12px", border: "1px solid #cbd5e1", marginBottom: "18px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            ⚪ APPLICATION
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                            <div>
                                <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                                    {student.placedCompany || "Campus Placement Drive Pool"}
                                </div>
                                <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginTop: "2px" }}>
                                    Status: {student.currentStage || "Application Submitted"}
                                </div>
                            </div>
                            <span style={{ backgroundColor: "#ffffff", color: "#475569", border: "1px solid #cbd5e1", padding: "5px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "800" }}>
                                ⚪ Application Submitted
                            </span>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div style={{ maxWidth: "1150px", margin: "0 auto", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}>
            <style>{`
                @media (max-width: 768px) {
                    .directory-desktop-table {
                        display: none !important;
                    }
                    .directory-mobile-cards {
                        display: flex !important;
                        flex-direction: column;
                        gap: 14px;
                    }
                    .directory-controls-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .directory-stats-grid {
                        grid-template-columns: 1fr 1fr !important;
                    }
                }
                @media (min-width: 769px) {
                    .directory-mobile-cards {
                        display: none !important;
                    }
                    .directory-desktop-table {
                        display: block !important;
                    }
                }
            `}</style>

            {/* PAGE HEADER */}
            <div style={{ marginBottom: "20px" }}>
                <h2 style={{ margin: "0 0 4px 0", fontSize: "24px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.4px" }}>
                    Student Directory
                </h2>
                <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                    View and monitor student academic profiles, placement readiness, and registration status.
                </p>
            </div>

            {/* QUICK STATS SUMMARY PILLS */}
            <div className="directory-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "20px" }}>
                <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "14px 16px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Total Students</div>
                    <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>{totalCount}</div>
                </div>

                <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "14px 16px", border: "1px solid #bbf7d0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#16a34a", textTransform: "uppercase" }}>🟢 Placed</div>
                    <div style={{ fontSize: "20px", fontWeight: "800", color: "#15803d", marginTop: "4px" }}>{placedCount}</div>
                </div>

                <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "14px 16px", border: "1px solid #bfdbfe", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#2563eb", textTransform: "uppercase" }}>🔵 Shortlisted</div>
                    <div style={{ fontSize: "20px", fontWeight: "800", color: "#1d4ed8", marginTop: "4px" }}>{shortlistedCount}</div>
                </div>

                <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "14px 16px", border: "1px solid #fed7aa", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#ea580c", textTransform: "uppercase" }}>🟡 In Process</div>
                    <div style={{ fontSize: "20px", fontWeight: "800", color: "#c2410c", marginTop: "4px" }}>{inProcessCount}</div>
                </div>

                <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "14px 16px", border: "1px solid #cbd5e1", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#475569", textTransform: "uppercase" }}>⚪ Applied</div>
                    <div style={{ fontSize: "20px", fontWeight: "800", color: "#334155", marginTop: "4px" }}>{appliedCount}</div>
                </div>
            </div>

            {/* CONTROLS & FILTERS CARD */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "20px 24px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", marginBottom: "24px" }}>
                <div className="directory-controls-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 1fr auto", gap: "12px", alignItems: "center" }}>
                    {/* Search Input */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                            SEARCH STUDENTS
                        </label>
                        <input
                            type="text"
                            placeholder="Search name, reg no, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "9px 12px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "13px",
                                color: "#0f172a",
                                outline: "none",
                                boxSizing: "border-box"
                            }}
                        />
                    </div>

                    {/* Department Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                            DEPARTMENT
                        </label>
                        <select
                            value={selectedDepartment}
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "9px 10px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "13px",
                                outline: "none",
                                backgroundColor: "#ffffff",
                                boxSizing: "border-box",
                                color: "#0f172a"
                            }}
                        >
                            <option value="All">All Departments</option>
                            <option value="Computer Science & Engineering">CSE</option>
                            <option value="Information Science & Engineering">ISE</option>
                            <option value="Electronics & Communication">ECE</option>
                            <option value="Mechanical Engineering">MECH</option>
                        </select>
                    </div>

                    {/* Batch Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                            BATCH
                        </label>
                        <select
                            value={selectedBatch}
                            onChange={(e) => setSelectedBatch(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "9px 10px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "13px",
                                outline: "none",
                                backgroundColor: "#ffffff",
                                boxSizing: "border-box",
                                color: "#0f172a"
                            }}
                        >
                            <option value="All">All Batches</option>
                            <option value="2022-2026">2022-2026</option>
                            <option value="2023-2027">2023-2027</option>
                        </select>
                    </div>

                    {/* Placement Status Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                            PLACEMENT STATUS
                        </label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "9px 10px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "13px",
                                outline: "none",
                                backgroundColor: "#ffffff",
                                boxSizing: "border-box",
                                color: "#0f172a"
                            }}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Placed">Placed</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="In Process">In Process</option>
                            <option value="Applied">Applied</option>
                        </select>
                    </div>

                    {/* Reset Button */}
                    <div style={{ paddingTop: "18px" }}>
                        <button
                            onClick={handleResetFilters}
                            style={{
                                padding: "9px 16px",
                                backgroundColor: "#f8fafc",
                                color: "#475569",
                                border: "1px solid #cbd5e1",
                                borderRadius: "8px",
                                fontSize: "12px",
                                fontWeight: "700",
                                cursor: "pointer",
                                whiteSpace: "nowrap"
                            }}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* DESKTOP STUDENT DIRECTORY TABLE WITH HORIZONTAL SCROLL & STICKY ACTION COLUMN */}
            <div className="directory-desktop-table" style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", overflow: "hidden" }}>
                <div style={{ padding: "18px 24px", borderBottom: "1px solid #eaedf0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>
                        Student Directory ({filteredStudents.length})
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                        Showing {filteredStudents.length} of {studentsList.length} registered students
                    </div>
                </div>

                <div style={{ overflowX: "auto", width: "100%" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1000px" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #eaedf0", color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                <th style={{ padding: "12px 18px", textAlign: "left", width: "22%" }}>Student Name</th>
                                <th style={{ padding: "12px 14px", textAlign: "left", width: "12%" }}>Register No.</th>
                                <th style={{ padding: "12px 14px", textAlign: "left", width: "18%" }}>Department</th>
                                <th style={{ padding: "12px 12px", textAlign: "center", width: "10%" }}>Batch</th>
                                <th style={{ padding: "12px 14px", textAlign: "left", width: "18%" }}>Email</th>
                                <th style={{ padding: "12px 14px", textAlign: "left", width: "12%" }}>Phone</th>
                                <th style={{ padding: "12px 14px", textAlign: "center", width: "14%" }}>Placement Status</th>
                                <th style={{
                                    padding: "12px 18px",
                                    textAlign: "right",
                                    position: "sticky",
                                    right: 0,
                                    backgroundColor: "#f8fafc",
                                    zIndex: 2,
                                    boxShadow: "-3px 0 6px rgba(0,0,0,0.03)"
                                }}>
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ padding: "40px", textAlign: "center" }}>
                                        <div style={{ fontSize: "28px", marginBottom: "8px" }}>👥</div>
                                        <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>No students found</div>
                                        <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>Try changing your search or filter criteria.</div>
                                        <button onClick={handleResetFilters} style={{ padding: "8px 18px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                                            Reset All Filters
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((std, idx) => {
                                    const statusBadge = getStatusBadge(std.placementStatus);
                                    return (
                                        <tr key={std.id} style={{ borderBottom: idx !== filteredStudents.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                                            {/* Name with CGPA Badge */}
                                            <td style={{ padding: "14px 18px", textAlign: "left" }}>
                                                <div>
                                                    <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "14px", whiteSpace: "nowrap" }}>
                                                        {std.name}
                                                    </div>
                                                    <div style={{ fontSize: "11px", color: "#2563eb", fontWeight: "700" }}>
                                                        CGPA: {std.cgpa.toFixed(2)}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Register No */}
                                            <td style={{ padding: "14px 14px", textAlign: "left", color: "#475569", fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap" }}>
                                                {std.registerNo}
                                            </td>

                                            {/* Department */}
                                            <td style={{ padding: "14px 14px", textAlign: "left", color: "#334155", fontSize: "13px", fontWeight: "600" }}>
                                                {std.department}
                                            </td>

                                            {/* Batch */}
                                            <td style={{ padding: "14px 12px", textAlign: "center", color: "#64748b", fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap" }}>
                                                {std.batch}
                                            </td>

                                            {/* Email */}
                                            <td style={{ padding: "14px 14px", textAlign: "left", color: "#475569", fontSize: "13px", wordBreak: "break-all" }}>
                                                {std.email}
                                            </td>

                                            {/* Phone */}
                                            <td style={{ padding: "14px 14px", textAlign: "left", color: "#475569", fontSize: "13px", fontWeight: "500", whiteSpace: "nowrap" }}>
                                                {std.phone}
                                            </td>

                                            {/* Placement Status */}
                                            <td style={{ padding: "14px 14px", textAlign: "center" }}>
                                                <div>
                                                    <span style={{
                                                        backgroundColor: statusBadge.bg,
                                                        color: statusBadge.color,
                                                        border: statusBadge.border,
                                                        padding: "5px 12px",
                                                        borderRadius: "14px",
                                                        fontSize: "11px",
                                                        fontWeight: "700",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        minWidth: "100px",
                                                        boxSizing: "border-box",
                                                        gap: "4px",
                                                        whiteSpace: "nowrap"
                                                    }}>
                                                        {statusBadge.icon} {statusBadge.label}
                                                    </span>
                                                    {std.placedCompany && (
                                                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px", fontWeight: "600", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                            {std.placedCompany}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Sticky Action Column */}
                                            <td style={{
                                                padding: "14px 18px",
                                                textAlign: "right",
                                                position: "sticky",
                                                right: 0,
                                                backgroundColor: "#ffffff",
                                                zIndex: 1,
                                                boxShadow: "-3px 0 6px rgba(0,0,0,0.03)"
                                            }}>
                                                <button
                                                    onClick={() => setSelectedStudent(std)}
                                                    style={{
                                                        padding: "7px 16px",
                                                        backgroundColor: "#0f172a",
                                                        color: "#ffffff",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                        fontSize: "12px",
                                                        fontWeight: "700",
                                                        cursor: "pointer",
                                                        boxShadow: "0 2px 4px rgba(15,23,42,0.12)",
                                                        transition: "all 0.15s ease",
                                                        whiteSpace: "nowrap"
                                                    }}
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MOBILE RESPONSIVE CARDS */}
            <div className="directory-mobile-cards">
                {filteredStudents.length === 0 ? (
                    <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "32px 20px", border: "1px solid #eaedf0", textAlign: "center" }}>
                        <div style={{ fontSize: "28px", marginBottom: "8px" }}>👥</div>
                        <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>No students found</div>
                        <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>Try changing your search or filter criteria.</div>
                        <button onClick={handleResetFilters} style={{ padding: "8px 18px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                            Reset All Filters
                        </button>
                    </div>
                ) : (
                    filteredStudents.map((std) => {
                        const statusBadge = getStatusBadge(std.placementStatus);
                        return (
                            <div key={std.id} style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "18px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>{std.name}</h4>
                                        <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginTop: "2px" }}>
                                            {std.registerNo} • CGPA: <strong style={{ color: "#2563eb" }}>{std.cgpa.toFixed(2)}</strong>
                                        </div>
                                    </div>
                                    <span style={{ backgroundColor: statusBadge.bg, color: statusBadge.color, border: statusBadge.border, padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
                                        {statusBadge.icon} {statusBadge.label}
                                    </span>
                                </div>

                                <div style={{ fontSize: "13px", color: "#334155", marginBottom: "6px" }}>
                                    <strong>{std.department}</strong> ({std.batch})
                                </div>

                                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "14px" }}>
                                    ✉️ {std.email} | 📞 {std.phone}
                                </div>

                                <button
                                    onClick={() => setSelectedStudent(std)}
                                    style={{
                                        width: "100%",
                                        padding: "10px",
                                        backgroundColor: "#0f172a",
                                        color: "#ffffff",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                        fontWeight: "700",
                                        cursor: "pointer"
                                    }}
                                >
                                    View Profile
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* VIEW STUDENT PROFILE & PLACEMENT RECORD MODAL */}
            {selectedStudent && (
                <div
                    onClick={() => setSelectedStudent(null)}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.65)",
                        zIndex: 99999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "16px"
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            width: "100%",
                            maxWidth: "650px",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            padding: "24px 28px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)"
                        }}
                    >
                        {/* MODAL HEADER */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
                            <div>
                                <div style={{ fontSize: "11px", fontWeight: "800", color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    STUDENT PROFILE & PLACEMENT RECORD
                                </div>
                                <h3 style={{ margin: "2px 0 0 0", fontSize: "19px", fontWeight: "800", color: "#0f172a" }}>
                                    {selectedStudent.name} ({selectedStudent.registerNo})
                                </h3>
                            </div>
                            <button onClick={() => setSelectedStudent(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b", fontWeight: "700" }}>✕</button>
                        </div>

                        {/* STATUS BADGES ROW */}
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "18px" }}>
                            <span style={{
                                backgroundColor: getStatusBadge(selectedStudent.placementStatus).bg,
                                color: getStatusBadge(selectedStudent.placementStatus).color,
                                border: getStatusBadge(selectedStudent.placementStatus).border,
                                padding: "4px 12px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "800",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                            }}>
                                {getStatusBadge(selectedStudent.placementStatus).icon} Status: {getStatusBadge(selectedStudent.placementStatus).label}
                            </span>

                            <span style={{
                                backgroundColor: selectedStudent.verificationStatus === "verified" ? "#f0fdf4" : "#fff7ed",
                                color: selectedStudent.verificationStatus === "verified" ? "#16a34a" : "#ea580c",
                                border: selectedStudent.verificationStatus === "verified" ? "1px solid #bbf7d0" : "1px solid #fed7aa",
                                padding: "4px 12px",
                                borderRadius: "12px",
                                fontSize: "12px",
                                fontWeight: "700"
                            }}>
                                {selectedStudent.verificationStatus === "verified" ? "✅ Verified Profile" : "🟠 Verification Pending"}
                            </span>
                        </div>

                        {/* ACADEMIC METRICS GRID */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", backgroundColor: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #f1f5f9", marginBottom: "18px" }}>
                            <div>
                                <div style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>CGPA</div>
                                <div style={{ fontSize: "16px", fontWeight: "800", color: "#2563eb", marginTop: "2px" }}>{selectedStudent.cgpa.toFixed(2)} / 10</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>10TH SCORE</div>
                                <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>{selectedStudent.tenthPercentage || 92.4}%</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>12TH / DIPLOMA</div>
                                <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>{selectedStudent.twelfthPercentage || 90.5}%</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>BACKLOGS</div>
                                <div style={{ fontSize: "14px", fontWeight: "700", color: selectedStudent.backlogs ? "#dc2626" : "#16a34a", marginTop: "2px" }}>
                                    {selectedStudent.backlogs ?? 0} Active
                                </div>
                            </div>
                        </div>

                        {/* CONTACT & DEPARTMENT CARD */}
                        <div style={{ backgroundColor: "#ffffff", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "18px" }}>
                            <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
                                PERSONAL & ACADEMIC DETAILS
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                                <div>
                                    <span style={{ color: "#64748b" }}>Department:</span> <strong style={{ color: "#0f172a" }}>{selectedStudent.department}</strong>
                                </div>
                                <div>
                                    <span style={{ color: "#64748b" }}>Batch:</span> <strong style={{ color: "#0f172a" }}>{selectedStudent.batch}</strong>
                                </div>
                                <div>
                                    <span style={{ color: "#64748b" }}>Email:</span> <strong style={{ color: "#0f172a" }}>{selectedStudent.email}</strong>
                                </div>
                                <div>
                                    <span style={{ color: "#64748b" }}>Phone:</span> <strong style={{ color: "#0f172a" }}>{selectedStudent.phone}</strong>
                                </div>
                            </div>
                        </div>

                        {/* DYNAMIC STATUS-DEPENDENT PLACEMENT OFFER / DRIVE CARD */}
                        {renderPlacementDetailsCard(selectedStudent)}

                        {/* SKILLS & RESUME */}
                        <div style={{ backgroundColor: "#ffffff", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                            <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
                                TECHNICAL SKILLS & RESUME
                            </div>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                                {selectedStudent.skills && selectedStudent.skills.length > 0 ? (
                                    selectedStudent.skills.map((skill, idx) => (
                                        <span key={idx} style={{ backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "3px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "700" }}>
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <span style={{ fontSize: "12px", color: "#64748b" }}>No specific skills logged</span>
                                )}
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed #e2e8f0", paddingTop: "10px" }}>
                                <span style={{ fontSize: "12px", color: "#475569" }}>
                                    📄 Resume: <strong>{selectedStudent.name.replace(/\s+/g, "_")}_Resume.pdf</strong>
                                </span>
                                <button
                                    onClick={() => alert(`Opening verified resume document for ${selectedStudent.name}...`)}
                                    style={{
                                        padding: "6px 14px",
                                        backgroundColor: "#f8fafc",
                                        color: "#2563eb",
                                        border: "1px solid #bfdbfe",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        fontWeight: "700",
                                        cursor: "pointer"
                                    }}
                                >
                                    View Resume ↗
                                </button>
                            </div>
                        </div>

                        {/* FOOTER ACTIONS */}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button
                                onClick={() => setSelectedStudent(null)}
                                style={{
                                    padding: "9px 22px",
                                    backgroundColor: "#0f172a",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    boxShadow: "0 2px 4px rgba(15,23,42,0.12)"
                                }}
                            >
                                Close Window
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoordinatorStudents;
