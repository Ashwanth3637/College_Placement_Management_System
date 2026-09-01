import React, { useState, useMemo, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";

export interface RecruiterSelectionItem {
    id: string;
    studentName: string;
    email: string;
    registerNumber: string;
    branch?: string;
    cgpa?: number;
    gradYear?: number;
    company: string;
    jobRole: string;
    appliedDrive: string;
    finalRound: string;
    result: "Selected" | "Pending" | "Rejected";
    offerStatus: "Offer Released" | "Offer Pending" | "Rejected" | "—";
    selectionDate?: string;
    salaryPackage?: string;
}

interface RecruiterSelectionsProps {
    user?: {
        name?: string;
        email?: string;
        role?: string;
        company?: string;
    };
    onViewSelection?: (selection: RecruiterSelectionItem) => void;
}

type SortField = "studentName" | "jobRole" | "finalRound" | "result" | "offerStatus";
type SortOrder = "asc" | "desc";

export const RecruiterSelections: React.FC<RecruiterSelectionsProps> = ({ user, onViewSelection }) => {
    const recruiterCompany = user?.company || "Amazon Development Center";
    const companyNameShort = recruiterCompany.split(" ")[0] || "Amazon";

    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [driveFilter, setDriveFilter] = useState<string>("All Drives");
    const [companyFilter, setCompanyFilter] = useState<string>("All Companies");
    const [statusFilter, setStatusFilter] = useState<string>("All Statuses");
    const [dateFilter, setDateFilter] = useState<string>("All Dates");

    // Sorting & Pagination States
    const [sortField, setSortField] = useState<SortField>("studentName");
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 5;

    const [selections, setSelections] = useState<RecruiterSelectionItem[]>([]);
    const [drivesList, setDrivesList] = useState<string[]>([
        "Software Developer",
        "Sales Development",
        "Cloud Engineer"
    ]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Modal States (Step 2)
    const [selectedItem, setSelectedItem] = useState<RecruiterSelectionItem | null>(null);
    const [showResumeViewer, setShowResumeViewer] = useState<boolean>(false);
    const [showOfferLetterViewer, setShowOfferLetterViewer] = useState<boolean>(false);

    // Selections loaded exclusively from live database & approved offers
    const initialSelections: RecruiterSelectionItem[] = [];

    // Load Applications / Selections from MongoDB API
    const fetchSelectionsData = async () => {
        setIsLoading(true);
        let list: RecruiterSelectionItem[] = [];

        try {
            const res = await fetch(`${API_BASE_URL}/api/applications?company=${encodeURIComponent(companyNameShort)}`);
            if (res.ok) {
                const apiApps = await res.json();
                if (Array.isArray(apiApps) && apiApps.length > 0) {
                    apiApps.forEach((a: any) => {
                        const existing = list.find(item => item.email.toLowerCase() === (a.email || "").toLowerCase() && item.jobRole.toLowerCase() === (a.jobRole || "").toLowerCase());
                        
                        let stdResult: RecruiterSelectionItem["result"] = "Pending";
                        let stdOffer: RecruiterSelectionItem["offerStatus"] = "—";

                        if (a.status === "Selected" || a.status === "Placed") {
                            stdResult = "Selected";
                            stdOffer = "Offer Released";
                        } else if (a.status === "Not Shortlisted" || a.status === "Rejected") {
                            stdResult = "Rejected";
                            stdOffer = "—";
                        } else {
                            stdResult = "Pending";
                            stdOffer = "—";
                        }

                        const finalRoundLabel = `Round ${a.currentRound || 1}`;

                        if (existing) {
                            existing.result = stdResult;
                            existing.offerStatus = stdOffer;
                            existing.finalRound = finalRoundLabel;
                        } else {
                            list.push({
                                id: a._id || a.id || `sel_db_${Date.now()}`,
                                studentName: a.studentName || "Student Candidate",
                                email: a.email,
                                registerNumber: a.regNo || "22CSR100",
                                branch: a.department || "CSE",
                                cgpa: a.cgpa || 8.0,
                                gradYear: a.gradYear || 2026,
                                company: recruiterCompany,
                                jobRole: a.jobRole || "Software Developer",
                                appliedDrive: a.jobRole || "Software Developer",
                                finalRound: finalRoundLabel,
                                result: stdResult,
                                offerStatus: stdOffer,
                                selectionDate: "31 Aug 2026",
                                salaryPackage: stdResult === "Selected" ? "₹18.5 LPA" : undefined
                            });
                        }
                    });
                }
            }
        } catch (err) {
            console.error("Error fetching selections from MongoDB API:", err);
        }

        // Build unique placement drives list
        const rolesSet = new Set<string>();
        ["Software Developer", "Sales Development", "Cloud Engineer"].forEach(r => rolesSet.add(r));
        list.forEach(i => { if (i.jobRole) rolesSet.add(i.jobRole); });
        setDrivesList(Array.from(rolesSet));

        setSelections(list);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchSelectionsData();
    }, []);

    // Escape key modal handling
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setSelectedItem(null);
                setShowResumeViewer(false);
                setShowOfferLetterViewer(false);
            }
        };
        if (selectedItem || showResumeViewer || showOfferLetterViewer) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedItem, showResumeViewer, showOfferLetterViewer]);

    // Reset All Filters
    const handleResetFilters = () => {
        setSearchQuery("");
        setDriveFilter("All Drives");
        setCompanyFilter("All Companies");
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
    const filteredSelections = selections.filter((item) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = query === "" ||
            item.studentName.toLowerCase().includes(query) ||
            item.registerNumber.toLowerCase().includes(query) ||
            item.email.toLowerCase().includes(query) ||
            item.jobRole.toLowerCase().includes(query) ||
            item.company.toLowerCase().includes(query);

        const matchesDrive = driveFilter === "All Drives" || item.jobRole.toLowerCase() === driveFilter.toLowerCase();
        const matchesCompany = companyFilter === "All Companies" || item.company.toLowerCase().includes(companyFilter.toLowerCase());

        let matchesStatus = true;
        if (statusFilter === "Selected") matchesStatus = item.result === "Selected";
        else if (statusFilter === "Pending") matchesStatus = item.result === "Pending";
        else if (statusFilter === "Rejected") matchesStatus = item.result === "Rejected";
        else if (statusFilter === "Offer Released") matchesStatus = item.offerStatus === "Offer Released";

        let matchesDate = true;
        if (dateFilter === "Today") matchesDate = item.selectionDate?.includes("31 Aug 2026") || false;

        return matchesSearch && matchesDrive && matchesCompany && matchesStatus && matchesDate;
    });

    // Sort Logic
    const sortedSelections = [...filteredSelections].sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
    });

    // Pagination Calculation
    const totalCount = sortedSelections.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedSelections = sortedSelections.slice(startIndex, startIndex + itemsPerPage);

    // Badge Style Helpers
    const getResultBadgeStyle = (result: RecruiterSelectionItem["result"]) => {
        switch (result) {
            case "Selected":
                return { bg: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", label: "🟢 Selected" };
            case "Pending":
                return { bg: "#fefce8", color: "#ca8a04", border: "1px solid #fef08a", label: "🟡 Pending" };
            case "Rejected":
                return { bg: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", label: "🔴 Rejected" };
            default:
                return { bg: "#fefce8", color: "#ca8a04", border: "1px solid #fef08a", label: "🟡 Pending" };
        }
    };

    const getOfferBadgeStyle = (offer: RecruiterSelectionItem["offerStatus"]) => {
        if (offer === "Offer Released") {
            return { bg: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", label: "📜 Offer Released" };
        }
        return { bg: "transparent", color: "#94a3b8", border: "none", label: "—" };
    };

    // Recruiter Action Handler for Selection Status Update
    const handleUpdateSelectionStatus = async (
        itemId: string,
        newResult: RecruiterSelectionItem["result"],
        newOffer: RecruiterSelectionItem["offerStatus"],
        packageAmount?: string
    ) => {
        setSelections(prev => prev.map(item => {
            if (item.id === itemId) {
                return {
                    ...item,
                    result: newResult,
                    offerStatus: newOffer,
                    salaryPackage: packageAmount || item.salaryPackage || "₹18.5 LPA",
                    selectionDate: "31 Aug 2026"
                };
            }
            return item;
        }));

        if (selectedItem && selectedItem.id === itemId) {
            setSelectedItem(prev => prev ? {
                ...prev,
                result: newResult,
                offerStatus: newOffer,
                salaryPackage: packageAmount || prev.salaryPackage || "₹18.5 LPA",
                selectionDate: "31 Aug 2026"
            } : null);
        }

        window.dispatchEvent(new CustomEvent("cpms_selections_updated"));
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", color: "#0f172a" }}>
            {/* Page Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: "800", margin: "0 0 6px 0", color: "#0f172a", letterSpacing: "-0.02em" }}>
                        Selection Management
                    </h1>
                    <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                        Track and manage final candidate selection outcomes and offer letter status for placement drives.
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
                        placeholder="Search candidate by name, register number (e.g. 22CSR110), company, or role..."
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

                    {/* Company Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                            Company Filter
                        </label>
                        <select
                            value={companyFilter}
                            onChange={(e) => { setCompanyFilter(e.target.value); setCurrentPage(1); }}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#fff", color: "#0f172a", outline: "none" }}
                        >
                            <option value="All Companies">All Companies</option>
                            <option value={companyNameShort}>{recruiterCompany}</option>
                        </select>
                    </div>

                    {/* Selection Status Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                            Selection Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#fff", color: "#0f172a", outline: "none" }}
                        >
                            <option value="All Statuses">All Statuses</option>
                            <option value="Selected">Selected</option>
                            <option value="Pending">Pending</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Offer Released">Offer Released</option>
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
                            <option value="This Month">This Month</option>
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

            {/* Selection Records Table */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #eaedf0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                {isLoading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                        Loading selection records...
                    </div>
                ) : sortedSelections.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                        No candidate selection records match your search or filter criteria.
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
                                        <th style={{ padding: "14px 16px", minWidth: "180px", whiteSpace: "nowrap" }}>Company</th>
                                        <th onClick={() => handleHeaderSort("jobRole")} style={{ padding: "14px 16px", minWidth: "140px", cursor: "pointer", whiteSpace: "nowrap" }}>
                                            Job Role {sortField === "jobRole" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                                        </th>
                                        <th onClick={() => handleHeaderSort("finalRound")} style={{ padding: "14px 16px", minWidth: "90px", cursor: "pointer", whiteSpace: "nowrap" }}>
                                            Final Round {sortField === "finalRound" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                                        </th>
                                        <th onClick={() => handleHeaderSort("result")} style={{ padding: "14px 16px", minWidth: "120px", cursor: "pointer", whiteSpace: "nowrap" }}>
                                            Result {sortField === "result" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                                        </th>
                                        <th onClick={() => handleHeaderSort("offerStatus")} style={{ padding: "14px 16px", minWidth: "140px", cursor: "pointer", whiteSpace: "nowrap" }}>
                                            Offer Status {sortField === "offerStatus" ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                                        </th>
                                        <th style={{ padding: "14px 16px", minWidth: "85px", textAlign: "center", whiteSpace: "nowrap" }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedSelections.map((item, idx) => {
                                        const resultStyle = getResultBadgeStyle(item.result);
                                        const offerStyle = getOfferBadgeStyle(item.offerStatus);

                                        return (
                                            <tr
                                                key={item.id || `sel_row_${idx}`}
                                                style={{ borderBottom: idx !== paginatedSelections.length - 1 ? "1px solid #f1f5f9" : "none", transition: "background-color 0.15s ease" }}
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

                                                {/* Company */}
                                                <td style={{ padding: "14px 16px", minWidth: "180px", whiteSpace: "nowrap" }}>
                                                    <span style={{ fontWeight: "700", color: "#0f172a", fontSize: "13px", whiteSpace: "nowrap" }}>
                                                        {item.company}
                                                    </span>
                                                </td>

                                                {/* Job Role */}
                                                <td style={{ padding: "14px 16px", minWidth: "140px", whiteSpace: "nowrap" }}>
                                                    <span style={{ fontWeight: "600", color: "#334155", fontSize: "13px", whiteSpace: "nowrap" }}>
                                                        {item.jobRole}
                                                    </span>
                                                </td>

                                                {/* Final Round */}
                                                <td style={{ padding: "14px 16px", minWidth: "90px", fontSize: "13px", fontWeight: "700", color: "#2563eb", whiteSpace: "nowrap" }}>
                                                    {item.finalRound.includes("Round") ? item.finalRound.split(":")[0] : item.finalRound}
                                                </td>

                                                {/* Result Badge */}
                                                <td style={{ padding: "14px 16px", minWidth: "120px", whiteSpace: "nowrap" }}>
                                                    <span
                                                        style={{
                                                            backgroundColor: resultStyle.bg,
                                                            color: resultStyle.color,
                                                            border: resultStyle.border,
                                                            padding: "5px 12px",
                                                            borderRadius: "12px",
                                                            fontSize: "11px",
                                                            fontWeight: "700",
                                                            whiteSpace: "nowrap",
                                                            display: "inline-flex",
                                                            alignItems: "center"
                                                        }}
                                                    >
                                                        {resultStyle.label}
                                                    </span>
                                                </td>

                                                {/* Offer Status Badge */}
                                                <td style={{ padding: "14px 16px", minWidth: "140px", whiteSpace: "nowrap" }}>
                                                    {item.offerStatus === "Offer Released" ? (
                                                        <span
                                                            style={{
                                                                backgroundColor: offerStyle.bg,
                                                                color: offerStyle.color,
                                                                border: offerStyle.border,
                                                                padding: "5px 12px",
                                                                borderRadius: "12px",
                                                                fontSize: "11px",
                                                                fontWeight: "700",
                                                                whiteSpace: "nowrap",
                                                                display: "inline-flex",
                                                                alignItems: "center"
                                                            }}
                                                        >
                                                            {offerStyle.label}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: "#94a3b8", fontWeight: "600" }}>—</span>
                                                    )}
                                                </td>

                                                {/* Action View Button */}
                                                <td style={{ padding: "14px 16px", minWidth: "85px", textAlign: "center", whiteSpace: "nowrap" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedItem(item);
                                                            if (onViewSelection) onViewSelection(item);
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
                                Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalCount)} of {totalCount} selection records
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

            {/* STEP 2: SELECTION DETAILS POPUP MODAL */}
            {selectedItem && (() => {
                const resultStyle = getResultBadgeStyle(selectedItem.result);
                const offerStyle = getOfferBadgeStyle(selectedItem.offerStatus);

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
                        onClick={() => setSelectedItem(null)}
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
                                            Selection Details
                                        </h2>
                                        <span style={{ backgroundColor: resultStyle.bg, color: resultStyle.color, border: resultStyle.border, padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
                                            {resultStyle.label}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                                        Final placement outcome record for {selectedItem.studentName}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    style={{ background: "none", border: "none", fontSize: "20px", color: "#94a3b8", cursor: "pointer", padding: "4px", borderRadius: "6px" }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* SCROLLABLE MODAL BODY */}
                            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "24px", overflowY: "auto", flex: 1 }}>
                                {/* 1. Student & Academic Information */}
                                <div>
                                    <h3 style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px 0" }}>
                                        Student Information
                                    </h3>
                                    <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "16px", border: "1px solid #f1f5f9", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "700" }}>CANDIDATE NAME</span>
                                            <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedItem.studentName}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "700" }}>REGISTER NO.</span>
                                            <span style={{ fontFamily: "monospace", fontWeight: "700", color: "#334155" }}>{selectedItem.registerNumber}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "700" }}>EMAIL ADDRESS</span>
                                            <span style={{ fontWeight: "600", color: "#2563eb" }}>{selectedItem.email}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "700" }}>DEPARTMENT & CGPA</span>
                                            <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedItem.branch || "CSE"} (CGPA: {selectedItem.cgpa || 8.4})</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "700" }}>GRADUATION YEAR</span>
                                            <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedItem.gradYear || 2026}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#64748b", display: "block", fontSize: "11px", fontWeight: "700" }}>COMPANY</span>
                                            <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedItem.company}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Placement Drive & Selection Outcome Card */}
                                <div>
                                    <h3 style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px 0" }}>
                                        Placement Drive & Selection Outcome
                                    </h3>
                                    <div style={{ backgroundColor: "#f0fdf4", borderRadius: "12px", padding: "18px", border: "1px solid #bbf7d0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "13px" }}>
                                        <div>
                                            <span style={{ color: "#166534", display: "block", fontSize: "11px", fontWeight: "700" }}>JOB ROLE / DRIVE</span>
                                            <span style={{ fontWeight: "800", color: "#0f172a", fontSize: "14px" }}>{selectedItem.jobRole}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#166534", display: "block", fontSize: "11px", fontWeight: "700" }}>FINAL ROUND CLEARED</span>
                                            <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedItem.finalRound}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#166534", display: "block", fontSize: "11px", fontWeight: "700" }}>SELECTION RESULT</span>
                                            <span style={{ backgroundColor: resultStyle.bg, color: resultStyle.color, border: resultStyle.border, padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", display: "inline-block", marginTop: "2px" }}>
                                                {resultStyle.label}
                                            </span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#166534", display: "block", fontSize: "11px", fontWeight: "700" }}>OFFER STATUS</span>
                                            {selectedItem.offerStatus === "Offer Released" ? (
                                                <span style={{ backgroundColor: offerStyle.bg, color: offerStyle.color, border: offerStyle.border, padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", display: "inline-block", marginTop: "2px" }}>
                                                    {offerStyle.label}
                                                </span>
                                            ) : (
                                                <span style={{ fontWeight: "600", color: "#64748b" }}>Pending Offer Generation</span>
                                            )}
                                        </div>
                                        {selectedItem.salaryPackage && (
                                            <div>
                                                <span style={{ color: "#166534", display: "block", fontSize: "11px", fontWeight: "700" }}>SALARY PACKAGE (CTC)</span>
                                                <span style={{ fontWeight: "800", color: "#16a34a", fontSize: "15px" }}>{selectedItem.salaryPackage}</span>
                                            </div>
                                        )}
                                        {selectedItem.selectionDate && (
                                            <div>
                                                <span style={{ color: "#166534", display: "block", fontSize: "11px", fontWeight: "700" }}>CONFIRMATION DATE</span>
                                                <span style={{ fontWeight: "700", color: "#0f172a" }}>{selectedItem.selectionDate}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 3. Candidate Documents & Offer Letter Actions */}
                                <div>
                                    <h3 style={{ fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px 0" }}>
                                        Candidate Documents & Verification
                                    </h3>
                                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                        <button
                                            onClick={() => setShowResumeViewer(true)}
                                            style={{ padding: "10px 16px", backgroundColor: "#f8fafc", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                        >
                                            📄 View Resume
                                        </button>
                                        <button
                                            onClick={() => alert(`Downloading ATS resume for ${selectedItem.studentName}...`)}
                                            style={{ padding: "10px 16px", backgroundColor: "#f8fafc", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                        >
                                            ⬇ Download Resume
                                        </button>
                                        {selectedItem.offerStatus === "Offer Released" && (
                                            <button
                                                onClick={() => setShowOfferLetterViewer(true)}
                                                style={{ padding: "10px 16px", backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #93c5fd", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                            >
                                                📜 View Official Offer Letter
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* STICKY FOOTER RECRUITER ACTIONS PANEL */}
                            <div style={{ padding: "16px 28px", backgroundColor: "#f8fafc", borderTop: "1px solid #eaedf0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", bottom: 0, zIndex: 10 }}>
                                <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                                    Recruiter Selection Actions
                                </div>
                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                    {selectedItem.result === "Pending" && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateSelectionStatus(selectedItem.id, "Selected", "Offer Released", "₹18.5 LPA")}
                                                style={{ padding: "9px 18px", backgroundColor: "#16a34a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                                            >
                                                🏆 Select Candidate & Issue Offer
                                            </button>
                                            <button
                                                onClick={() => handleUpdateSelectionStatus(selectedItem.id, "Rejected", "—")}
                                                style={{ padding: "9px 18px", backgroundColor: "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                                            >
                                                ✕ Reject Candidate
                                            </button>
                                        </>
                                    )}

                                    {selectedItem.result === "Selected" && (
                                        <span style={{ padding: "8px 16px", backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "8px", fontSize: "12px", fontWeight: "800" }}>
                                            📜 Official Offer Letter Dispatched (₹18.5 LPA)
                                        </span>
                                    )}

                                    {selectedItem.result === "Rejected" && (
                                        <span style={{ padding: "8px 16px", backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px", fontSize: "12px", fontWeight: "800" }}>
                                            🔴 Candidate Application Closed
                                        </span>
                                    )}

                                    <button
                                        onClick={() => setSelectedItem(null)}
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
            {showResumeViewer && selectedItem && (
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
                                📄 ATS Verified Resume — {selectedItem.studentName}
                            </h3>
                            <button onClick={() => setShowResumeViewer(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>✕</button>
                        </div>
                        <div style={{ backgroundColor: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #eaedf0", fontSize: "13px", color: "#334155", display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div><strong>Name:</strong> {selectedItem.studentName}</div>
                            <div><strong>Register Number:</strong> {selectedItem.registerNumber}</div>
                            <div><strong>Department:</strong> {selectedItem.branch || "CSE"} (CGPA: {selectedItem.cgpa || 8.4})</div>
                            <div><strong>Email:</strong> {selectedItem.email}</div>
                            <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "10px 0" }} />
                            <div><strong>Technical Core Skills:</strong> Java, Python, Data Structures & Algorithms, React, AWS, Node.js</div>
                            <div><strong>Projects:</strong> College Placement Management System, Cloud Infrastructure Automation</div>
                            <div><strong>Status:</strong> Verified & Certified by College Placement Office</div>
                        </div>
                    </div>
                </div>
            )}

            {/* OFFICIAL OFFER LETTER VIEWER OVERLAY */}
            {showOfferLetterViewer && selectedItem && (
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
                    onClick={() => setShowOfferLetterViewer(false)}
                >
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            width: "100%",
                            maxWidth: "640px",
                            padding: "32px",
                            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
                            border: "1px solid #e2e8f0"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "24px" }}>📜</span>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                                    Official Offer Letter — {recruiterCompany}
                                </h3>
                            </div>
                            <button onClick={() => setShowOfferLetterViewer(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748b" }}>✕</button>
                        </div>
                        <div style={{ backgroundColor: "#f8fafc", padding: "24px", borderRadius: "12px", border: "1px solid #eaedf0", fontSize: "13px", color: "#334155", display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>
                                APPOINTMENT LETTER FOR THE POSITION OF {selectedItem.jobRole.toUpperCase()}
                            </div>
                            <div>Dear <strong>{selectedItem.studentName}</strong> (Reg. No: {selectedItem.registerNumber}),</div>
                            <p style={{ margin: 0, lineHeight: "1.6" }}>
                                On behalf of <strong>{selectedItem.company}</strong>, we are pleased to offer you full-time employment as a <strong>{selectedItem.jobRole}</strong> following your successful clearance of all placement drive rounds.
                            </p>
                            <div style={{ backgroundColor: "#eff6ff", padding: "12px 16px", borderRadius: "8px", border: "1px solid #bfdbfe", fontWeight: "700", color: "#1d4ed8" }}>
                                Annual Salary Package (CTC): {selectedItem.salaryPackage || "₹18.5 LPA"}
                            </div>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                                Issue Date: {selectedItem.selectionDate || "28 Aug 2026"} | Verification Code: AMZ-OFFER-2026-REG{selectedItem.registerNumber}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecruiterSelections;
