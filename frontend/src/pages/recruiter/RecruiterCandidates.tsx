import React, { useState, useEffect } from "react";

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

    const [candidates, setCandidates] = useState<CandidateItem[]>([]);
    const [drivesList, setDrivesList] = useState<string[]>(["Software Developer", "Sales Development", "Cloud Engineer"]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Initial Mock Candidates data matching user's exact specification
    const initialCandidates: CandidateItem[] = [
        {
            id: "cand_1",
            registerNumber: "22CSR101",
            name: "Rahul Kumar",
            email: "rahul.k@gmail.com",
            branch: "CSE",
            cgpa: 8.4,
            gradYear: 2026,
            appliedDrive: "Software Developer",
            applicationStatus: "Applied",
            appliedDate: "24 Aug 2026"
        },
        {
            id: "cand_2",
            registerNumber: "22IT045",
            name: "Priya Sharma",
            email: "priya.sharma@gmail.com",
            branch: "IT",
            cgpa: 8.7,
            gradYear: 2026,
            appliedDrive: "Software Developer",
            applicationStatus: "Shortlisted",
            appliedDate: "23 Aug 2026"
        },
        {
            id: "cand_3",
            registerNumber: "22ECE032",
            name: "Arun Kumar",
            email: "arun.k@gmail.com",
            branch: "ECE",
            cgpa: 7.9,
            gradYear: 2026,
            appliedDrive: "Sales Development",
            applicationStatus: "Applied",
            appliedDate: "22 Aug 2026"
        },
        {
            id: "cand_4",
            registerNumber: "22CSR025",
            name: "Ashwanth Kumar",
            email: "ashwanth@gmail.com",
            branch: "CSE",
            cgpa: 8.45,
            gradYear: 2026,
            appliedDrive: "Cloud Engineer",
            applicationStatus: "Interview Scheduled",
            appliedDate: "21 Aug 2026"
        },
        {
            id: "cand_5",
            registerNumber: "22CSR110",
            name: "Ananya Roy",
            email: "ananya.roy@gmail.com",
            branch: "CSE",
            cgpa: 9.1,
            gradYear: 2026,
            appliedDrive: "Cloud Engineer",
            applicationStatus: "Selected",
            appliedDate: "20 Aug 2026"
        }
    ];

    // Load Candidate Records from API + Local Storage
    const fetchCandidateRecords = async () => {
        setIsLoading(true);
        let list: CandidateItem[] = [...initialCandidates];

        try {
            // Fetch registered students from backend
            const res = await fetch("http://localhost:5001/api/student/all");
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

        // Fetch company drives to populate Drive Filter dropdown
        try {
            const drivesRes = await fetch(`http://localhost:5001/api/company/drives?company=${encodeURIComponent(recruiterCompany.split(" ")[0])}`);
            if (drivesRes.ok) {
                const driveData = await drivesRes.json();
                if (Array.isArray(driveData) && driveData.length > 0) {
                    const titles = driveData.map((d: any) => d.jobTitle || d.role).filter(Boolean);
                    setDrivesList(Array.from(new Set([...titles, "Software Developer", "Sales Development", "Cloud Engineer"])));
                }
            }
        } catch (e) { }

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

        // Placement Drive Filter
        const matchesDrive = driveFilter === "All Drives" || cand.appliedDrive.toLowerCase().includes(driveFilter.toLowerCase());

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
                                                        padding: "4px 10px",
                                                        borderRadius: "12px",
                                                        fontSize: "11px",
                                                        fontWeight: "700",
                                                        whiteSpace: "nowrap",
                                                        display: "inline-flex",
                                                        alignItems: "center"
                                                    }}
                                                >
                                                    {badgeStyle.label}
                                                </span>
                                            </td>

                                            {/* Action: View Button */}
                                            <td style={{ padding: "14px 18px", textAlign: "center" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => onViewProfile && onViewProfile(cand)}
                                                    style={{
                                                        backgroundColor: "#f8fafc",
                                                        color: "#334155",
                                                        border: "1px solid #cbd5e1",
                                                        padding: "6px 16px",
                                                        borderRadius: "8px",
                                                        fontSize: "12px",
                                                        fontWeight: "700",
                                                        cursor: "pointer",
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
                )}
            </div>
        </div>
    );
};

export default RecruiterCandidates;
