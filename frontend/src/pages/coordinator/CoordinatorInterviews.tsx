import React, { useState, useEffect } from "react";

export interface CoordinatorInterviewRecord {
    id: string;
    candidateName: string;
    registerNo: string;
    company: string;
    drive: string;
    round: string;
    dateTime: string;
    originallyScheduledDate?: string;
    interviewer: string;
    status: "Scheduled" | "In Progress" | "Completed" | "Rescheduled" | "Cancelled";
    venue?: string;
    coordinationNotes?: string;
    result?: "Selected" | "Rejected" | "On Hold" | "Pending" | "Not Applicable";
    feedback?: string;
    nextRound?: string;
    updatedBy?: string;
    updatedAt?: string;
    reasonForChange?: string;
    cancellationNotes?: string;
}

export interface CoordinatorInterviewsProps {
    user?: any;
    onBackToDashboard?: () => void;
}

export const CoordinatorInterviews: React.FC<CoordinatorInterviewsProps> = ({
    onBackToDashboard
}) => {
    // Clean Interviews Data loaded exclusively from live database
    const defaultInterviews: CoordinatorInterviewRecord[] = [];

    // Persisted State
    const [interviewsList, setInterviewsList] = useState<CoordinatorInterviewRecord[]>(() => {
        try {
            const saved = localStorage.getItem("cpms_coordinator_interviews_records");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {}
        return defaultInterviews;
    });

    // Filters State
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCompany, setSelectedCompany] = useState("All");
    const [selectedDrive, setSelectedDrive] = useState("All");
    const [selectedRound, setSelectedRound] = useState("All");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
    const [isSavingOutcome, setIsSavingOutcome] = useState<boolean>(false);

    // Main Modal State
    const [selectedInterview, setSelectedInterview] = useState<CoordinatorInterviewRecord | null>(null);
    const [editVenueNotesMode, setEditVenueNotesMode] = useState<boolean>(false);

    // Sub-Dialog Modals State
    const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
    const [cancelReason, setCancelReason] = useState<string>("Student unavailable");
    const [cancelNotesInput, setCancelNotesInput] = useState<string>("");

    const [showRescheduleModal, setShowRescheduleModal] = useState<boolean>(false);
    const [newRescheduleDate, setNewRescheduleDate] = useState<string>("");
    const [rescheduleReason, setRescheduleReason] = useState<string>("Recruiter schedule update");

    // Main Modal Form Inputs
    const [modalForm, setModalForm] = useState({
        status: "Scheduled" as CoordinatorInterviewRecord["status"],
        venue: "",
        coordinationNotes: "",
        result: "Pending" as NonNullable<CoordinatorInterviewRecord["result"]>,
        feedback: "",
        nextRound: ""
    });

    useEffect(() => {
        if (selectedInterview) {
            const isCancelled = selectedInterview.status === "Cancelled";
            setModalForm({
                status: selectedInterview.status,
                venue: selectedInterview.venue || "",
                coordinationNotes: selectedInterview.coordinationNotes || "",
                result: isCancelled ? "Not Applicable" : (selectedInterview.result || "Pending"),
                feedback: selectedInterview.feedback || "",
                nextRound: isCancelled ? "Not Applicable (Cancelled)" : (selectedInterview.nextRound || (selectedInterview.result === "Selected" ? "HR Round" : "Pending Evaluation"))
            });
            setEditVenueNotesMode(false);
            setNewRescheduleDate(selectedInterview.dateTime);
        }
    }, [selectedInterview]);

    // ESC Key Navigation Handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" || e.code === "Escape") {
                if (showCancelModal) {
                    e.stopImmediatePropagation();
                    setShowCancelModal(false);
                } else if (showRescheduleModal) {
                    e.stopImmediatePropagation();
                    setShowRescheduleModal(false);
                } else if (selectedInterview) {
                    e.stopImmediatePropagation();
                    setSelectedInterview(null);
                } else if (onBackToDashboard) {
                    onBackToDashboard();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown, true);
        return () => window.removeEventListener("keydown", handleKeyDown, true);
    }, [showCancelModal, showRescheduleModal, selectedInterview, onBackToDashboard]);

    // Reset Filters Handler
    const handleResetFilters = () => {
        setSearchTerm("");
        setSelectedCompany("All");
        setSelectedDrive("All");
        setSelectedRound("All");
        setSelectedDate("");
        setSelectedStatus("All");
    };

    // Filter Logic
    const filteredInterviews = interviewsList.filter(item => {
        const matchesSearch = item.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.registerNo.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCompany = selectedCompany === "All" || item.company === selectedCompany;
        const matchesDrive = selectedDrive === "All" || item.drive === selectedDrive;
        const matchesRound = selectedRound === "All" || item.round === selectedRound;

        let matchesDate = true;
        if (selectedDate) {
            matchesDate = item.dateTime.toLowerCase().includes(selectedDate.toLowerCase());
        }

        const matchesStatus = selectedStatus === "All" || item.status === selectedStatus;

        return matchesSearch && matchesCompany && matchesDrive && matchesRound && matchesDate && matchesStatus;
    });

    const getStatusBadge = (status: CoordinatorInterviewRecord["status"]) => {
        switch (status) {
            case "Scheduled":
                return { bg: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", icon: "🔵", label: "Scheduled" };
            case "In Progress":
                return { bg: "#f0f9ff", color: "#0284c7", border: "1px solid #bae6fd", icon: "🔵", label: "In Progress" };
            case "Completed":
                return { bg: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", icon: "🟢", label: "Completed" };
            case "Rescheduled":
                return { bg: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa", icon: "🟡", label: "Rescheduled" };
            case "Cancelled":
                return { bg: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", icon: "🔴", label: "Cancelled" };
            default:
                return { bg: "#f8fafc", color: "#64748b", border: "1px solid #cbd5e1", icon: "⚪", label: status };
        }
    };

    // Result Change Handler with Status Coupling & Conditional Next Round
    const handleResultChange = (newResult: NonNullable<CoordinatorInterviewRecord["result"]>) => {
        let newStatus = modalForm.status;
        let newNextRound = modalForm.nextRound;

        if (newResult === "Selected") {
            newStatus = "Completed";
            if (!newNextRound || newNextRound === "Not Applicable (Rejected)" || newNextRound === "Pending Evaluation" || newNextRound.includes("Not Applicable")) {
                newNextRound = "HR Round";
            }
        } else if (newResult === "Rejected") {
            newStatus = "Completed";
            newNextRound = "Not Applicable (Rejected)";
        } else if (newResult === "On Hold") {
            newStatus = "Completed";
            newNextRound = newNextRound || "Pending Decision";
        } else if (newResult === "Pending") {
            newNextRound = "Pending Evaluation";
        } else if (newResult === "Not Applicable") {
            newNextRound = "Not Applicable (Cancelled)";
        }

        setModalForm(prev => ({
            ...prev,
            result: newResult,
            status: newStatus,
            nextRound: newNextRound
        }));
    };

    // Save Modal Changes Handler with Duplicate Prevention
    const handleSaveModalRecord = () => {
        if (!selectedInterview || isSavingOutcome) return;

        setIsSavingOutcome(true);

        const currentTimestamp = new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

        const updatedRecord: CoordinatorInterviewRecord = {
            ...selectedInterview,
            status: modalForm.status,
            venue: modalForm.venue,
            coordinationNotes: modalForm.coordinationNotes,
            result: modalForm.result,
            feedback: modalForm.feedback,
            nextRound: modalForm.nextRound,
            updatedBy: "Prof. Rajesh Sharma (Coordinator)",
            updatedAt: currentTimestamp
        };

        const updatedList = interviewsList.map(item => item.id === selectedInterview.id ? updatedRecord : item);
        setInterviewsList(updatedList);
        try {
            localStorage.setItem("cpms_coordinator_interviews_records", JSON.stringify(updatedList));
        } catch (e) {}

        setSelectedInterview(updatedRecord);
        setIsSavingOutcome(false);
        setSaveFeedback("Interview outcome saved successfully.");
        setTimeout(() => setSaveFeedback(null), 3500);
    };

    // Confirm Cancellation Action
    const handleConfirmCancellation = () => {
        if (!selectedInterview) return;

        const currentTimestamp = new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

        const updatedRecord: CoordinatorInterviewRecord = {
            ...selectedInterview,
            status: "Cancelled",
            result: "Not Applicable",
            nextRound: "Not Applicable (Cancelled)",
            reasonForChange: cancelReason,
            cancellationNotes: cancelNotesInput,
            coordinationNotes: `Cancelled: ${cancelReason}${cancelNotesInput ? ` - ${cancelNotesInput}` : ""}`,
            updatedBy: "Prof. Rajesh Sharma (Coordinator)",
            updatedAt: currentTimestamp
        };

        const updatedList = interviewsList.map(item => item.id === selectedInterview.id ? updatedRecord : item);
        setInterviewsList(updatedList);
        try {
            localStorage.setItem("cpms_coordinator_interviews_records", JSON.stringify(updatedList));
        } catch (e) {}

        setShowCancelModal(false);
        setSelectedInterview(updatedRecord);
        setSaveFeedback(`🔴 Interview for ${selectedInterview.candidateName} cancelled (${cancelReason}).`);
        setTimeout(() => setSaveFeedback(null), 3500);
    };

    // Restore Cancelled Schedule
    const handleRestoreSchedule = () => {
        if (!selectedInterview) return;

        const currentTimestamp = new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

        const updatedRecord: CoordinatorInterviewRecord = {
            ...selectedInterview,
            status: "Scheduled",
            result: "Pending",
            nextRound: "Pending Evaluation",
            reasonForChange: "",
            cancellationNotes: "",
            coordinationNotes: "Schedule restored by Coordinator.",
            updatedBy: "Prof. Rajesh Sharma (Coordinator)",
            updatedAt: currentTimestamp
        };

        const updatedList = interviewsList.map(item => item.id === selectedInterview.id ? updatedRecord : item);
        setInterviewsList(updatedList);
        try {
            localStorage.setItem("cpms_coordinator_interviews_records", JSON.stringify(updatedList));
        } catch (e) {}

        setSelectedInterview(updatedRecord);
        setSaveFeedback(`🔵 Interview schedule for ${selectedInterview.candidateName} restored to Scheduled!`);
        setTimeout(() => setSaveFeedback(null), 3500);
    };

    // Confirm Rescheduling Action
    const handleConfirmRescheduling = () => {
        if (!selectedInterview || !newRescheduleDate) return;

        const currentTimestamp = new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });

        const updatedRecord: CoordinatorInterviewRecord = {
            ...selectedInterview,
            originallyScheduledDate: selectedInterview.originallyScheduledDate || selectedInterview.dateTime,
            status: "Rescheduled",
            dateTime: newRescheduleDate,
            result: "Pending",
            reasonForChange: rescheduleReason,
            coordinationNotes: `Rescheduled to ${newRescheduleDate}. Reason: ${rescheduleReason}`,
            updatedBy: "Prof. Rajesh Sharma (Coordinator)",
            updatedAt: currentTimestamp
        };

        const updatedList = interviewsList.map(item => item.id === selectedInterview.id ? updatedRecord : item);
        setInterviewsList(updatedList);
        try {
            localStorage.setItem("cpms_coordinator_interviews_records", JSON.stringify(updatedList));
        } catch (e) {}

        setShowRescheduleModal(false);
        setSelectedInterview(updatedRecord);
        setSaveFeedback(`🟡 Interview for ${selectedInterview.candidateName} rescheduled to ${newRescheduleDate}.`);
        setTimeout(() => setSaveFeedback(null), 3500);
    };

    return (
        <div style={{ maxWidth: "1150px", margin: "0 auto", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}>
            <style>{`
                @media (max-width: 768px) {
                    .desktop-table-container {
                        display: none !important;
                    }
                    .mobile-cards-container {
                        display: flex !important;
                        flex-direction: column;
                        gap: 14px;
                    }
                    .interviews-filter-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .interviews-header-row {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 12px !important;
                    }
                }
                @media (min-width: 769px) {
                    .mobile-cards-container {
                        display: none !important;
                    }
                    .desktop-table-container {
                        display: block !important;
                    }
                }
            `}</style>

            {/* PAGE HEADER */}
            <div style={{ marginBottom: "24px" }} className="interviews-header-row">
                <h2 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.3px" }}>
                    Interview Coordination
                </h2>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                    Assist with student interview scheduling, venue assignments, and logging interview results.
                </p>
            </div>

            {/* FEEDBACK ALERT BANNER */}
            {saveFeedback && (
                <div style={{
                    backgroundColor: "#f0fdf4",
                    color: "#16a34a",
                    border: "1px solid #bbf7d0",
                    borderRadius: "10px",
                    padding: "12px 18px",
                    marginBottom: "20px",
                    fontSize: "13px",
                    fontWeight: "700",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <span>{saveFeedback}</span>
                    <button onClick={() => setSaveFeedback(null)} style={{ background: "none", border: "none", color: "#16a34a", cursor: "pointer", fontWeight: "800" }}>✕</button>
                </div>
            )}

            {/* FILTERS CARD WITH DATE FILTER */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "20px 24px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", marginBottom: "24px" }}>
                <div className="interviews-filter-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr auto", gap: "12px", alignItems: "center" }}>
                    {/* Search Candidate */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                            SEARCH CANDIDATE
                        </label>
                        <input
                            type="text"
                            placeholder="Search name or reg no..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "9px 12px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "13px",
                                outline: "none",
                                boxSizing: "border-box",
                                color: "#0f172a"
                            }}
                        />
                    </div>

                    {/* Company Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                            COMPANY
                        </label>
                        <select
                            value={selectedCompany}
                            onChange={(e) => setSelectedCompany(e.target.value)}
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
                            <option value="All">All Companies</option>
                            <option value="Amazon">Amazon</option>
                            <option value="TCS">TCS</option>
                            <option value="Google">Google</option>
                            <option value="Infosys">Infosys</option>
                        </select>
                    </div>

                    {/* Placement Drive Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                            DRIVE
                        </label>
                        <select
                            value={selectedDrive}
                            onChange={(e) => setSelectedDrive(e.target.value)}
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
                            <option value="All">All Drives</option>
                            <option value="SDE">SDE</option>
                            <option value="Ninja">Ninja</option>
                            <option value="Cloud Engineer">Cloud Engineer</option>
                            <option value="Systems Engineer">Systems Engineer</option>
                        </select>
                    </div>

                    {/* Round Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                            ROUND
                        </label>
                        <select
                            value={selectedRound}
                            onChange={(e) => setSelectedRound(e.target.value)}
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
                            <option value="All">All Rounds</option>
                            <option value="Round 1">Round 1</option>
                            <option value="Round 2">Round 2</option>
                            <option value="HR Round">HR Round</option>
                        </select>
                    </div>

                    {/* Date Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                            DATE
                        </label>
                        <input
                            type="text"
                            placeholder="Sep 2"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "9px 10px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "13px",
                                outline: "none",
                                boxSizing: "border-box",
                                color: "#0f172a"
                            }}
                        />
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                            STATUS
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
                            <option value="Scheduled">Scheduled</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Rescheduled">Rescheduled</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Reset Filters */}
                    <div style={{ paddingTop: "18px" }}>
                        <button
                            onClick={handleResetFilters}
                            style={{
                                padding: "9px 14px",
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

            {/* DESKTOP INTERVIEWS TABLE */}
            <div className="desktop-table-container" style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", overflow: "hidden" }}>
                <div style={{ padding: "18px 24px", borderBottom: "1px solid #eaedf0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>
                        Interview Schedule ({filteredInterviews.length})
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                        Showing {filteredInterviews.length} of {interviewsList.length} interviews
                    </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px", whiteSpace: "nowrap" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #eaedf0", color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                <th style={{ padding: "12px 16px", textAlign: "left" }}>Student</th>
                                <th style={{ padding: "12px 16px", textAlign: "left" }}>Reg No</th>
                                <th style={{ padding: "12px 16px", textAlign: "left" }}>Company</th>
                                <th style={{ padding: "12px 16px", textAlign: "left" }}>Drive</th>
                                <th style={{ padding: "12px 16px", textAlign: "left" }}>Round</th>
                                <th style={{ padding: "12px 16px", textAlign: "center" }}>Date & Time</th>
                                <th style={{ padding: "12px 16px", textAlign: "left" }}>Interviewer</th>
                                <th style={{ padding: "12px 16px", textAlign: "center" }}>Status</th>
                                <th style={{ padding: "12px 16px", textAlign: "right" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInterviews.length === 0 ? (
                                <tr>
                                    <td colSpan={9} style={{ padding: "40px", textAlign: "center" }}>
                                        <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔍</div>
                                        <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>No interviews found</div>
                                        <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>Try changing your search or filter criteria.</div>
                                        <button onClick={handleResetFilters} style={{ padding: "8px 18px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                                            Reset All Filters
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                filteredInterviews.map((inv, idx) => {
                                    const badge = getStatusBadge(inv.status);
                                    return (
                                        <tr key={inv.id} style={{ borderBottom: idx !== filteredInterviews.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                                            <td style={{ padding: "14px 16px", textAlign: "left", fontWeight: "800", color: "#0f172a", fontSize: "14px" }}>
                                                {inv.candidateName}
                                            </td>
                                            <td style={{ padding: "14px 16px", textAlign: "left", color: "#475569", fontSize: "13px", fontWeight: "600" }}>
                                                {inv.registerNo}
                                            </td>
                                            <td style={{ padding: "14px 16px", textAlign: "left", color: "#0f172a", fontSize: "13px", fontWeight: "700" }}>
                                                {inv.company}
                                            </td>
                                            <td style={{ padding: "14px 16px", textAlign: "left", color: "#334155", fontSize: "13px", fontWeight: "600" }}>
                                                {inv.drive}
                                            </td>
                                            <td style={{ padding: "14px 16px", textAlign: "left", color: "#2563eb", fontSize: "13px", fontWeight: "700" }}>
                                                {inv.round}
                                            </td>
                                            <td style={{ padding: "14px 16px", textAlign: "center", color: "#475569", fontSize: "13px", fontWeight: "600" }}>
                                                📅 {inv.dateTime}
                                            </td>
                                            <td style={{ padding: "14px 16px", textAlign: "left", color: "#334155", fontSize: "13px", fontWeight: "600" }}>
                                                {inv.interviewer}
                                            </td>
                                            <td style={{ padding: "14px 16px", textAlign: "center" }}>
                                                <span style={{
                                                    backgroundColor: badge.bg,
                                                    color: badge.color,
                                                    border: badge.border,
                                                    padding: "6px 14px",
                                                    borderRadius: "14px",
                                                    fontSize: "11px",
                                                    fontWeight: "700",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    width: "135px",
                                                    boxSizing: "border-box",
                                                    gap: "6px"
                                                }}>
                                                    {badge.icon} {badge.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: "14px 16px", textAlign: "right" }}>
                                                <button
                                                    onClick={() => setSelectedInterview(inv)}
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
                                                        transition: "all 0.15s ease"
                                                    }}
                                                >
                                                    View / Record
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

            {/* MOBILE RESPONSIVE CARDS CONTAINER */}
            <div className="mobile-cards-container">
                {filteredInterviews.length === 0 ? (
                    <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "32px 20px", border: "1px solid #eaedf0", textAlign: "center" }}>
                        <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔍</div>
                        <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>No interviews found</div>
                        <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>Try changing your search or filter criteria.</div>
                        <button onClick={handleResetFilters} style={{ padding: "8px 18px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                            Reset All Filters
                        </button>
                    </div>
                ) : (
                    filteredInterviews.map((inv) => {
                        const badge = getStatusBadge(inv.status);
                        return (
                            <div key={inv.id} style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "18px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>{inv.candidateName}</h4>
                                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>{inv.registerNo}</span>
                                    </div>
                                    <span style={{ backgroundColor: badge.bg, color: badge.color, border: badge.border, padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
                                        {badge.icon} {badge.label}
                                    </span>
                                </div>

                                <div style={{ fontSize: "13px", color: "#334155", marginBottom: "6px" }}>
                                    <strong>{inv.company}</strong> • {inv.drive} ({inv.round})
                                </div>

                                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "14px" }}>
                                    📅 {inv.dateTime} | Interviewer: {inv.interviewer}
                                </div>

                                <button
                                    onClick={() => setSelectedInterview(inv)}
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
                                    View / Record
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* MAIN MODAL: INTERVIEW COORDINATION & OUTCOME */}
            {selectedInterview && (
                <div
                    onClick={() => setSelectedInterview(null)}
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
                            maxWidth: "620px",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            padding: "24px 28px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)"
                        }}
                    >
                        {/* MODAL HEADER */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                            <div>
                                <span style={{ fontSize: "11px", fontWeight: "800", color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px" }}>INTERVIEW COORDINATION & OUTCOME</span>
                                <h3 style={{ margin: "2px 0 0 0", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                                    {selectedInterview.candidateName} ({selectedInterview.registerNo})
                                </h3>
                            </div>
                            <button onClick={() => setSelectedInterview(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b", fontWeight: "700" }}>✕</button>
                        </div>

                        {/* INTERVIEW METRICS SUMMARY CARD */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", backgroundColor: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #f1f5f9", marginBottom: "16px" }}>
                            <div>
                                <div style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>COMPANY & DRIVE</div>
                                <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>{selectedInterview.company} • {selectedInterview.drive}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>INTERVIEW ROUND</div>
                                <div style={{ fontSize: "13px", fontWeight: "700", color: "#2563eb", marginTop: "2px" }}>{selectedInterview.round}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>DATE & TIME</div>
                                <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>📅 {selectedInterview.dateTime}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>PANEL INTERVIEWER</div>
                                <div style={{ fontSize: "13px", fontWeight: "700", color: "#334155", marginTop: "2px" }}>{selectedInterview.interviewer}</div>
                            </div>
                        </div>

                        {/* RESCHEDULE HISTORY AUDIT BADGE */}
                        {selectedInterview.originallyScheduledDate && (
                            <div style={{ marginBottom: "16px", backgroundColor: "#fff7ed", padding: "12px 16px", borderRadius: "10px", border: "1px solid #fed7aa" }}>
                                <div style={{ fontSize: "10px", fontWeight: "800", color: "#ea580c", textTransform: "uppercase", letterSpacing: "0.5px" }}>📜 RESCHEDULE HISTORY</div>
                                <div style={{ fontSize: "12px", color: "#9a3412", marginTop: "4px" }}>
                                    Originally Scheduled: <strong>{selectedInterview.originallyScheduledDate}</strong>
                                </div>
                                <div style={{ fontSize: "12px", color: "#9a3412", marginTop: "2px" }}>
                                    Rescheduled To: <strong>{selectedInterview.dateTime}</strong>
                                </div>
                                {selectedInterview.reasonForChange && (
                                    <div style={{ fontSize: "12px", color: "#c2410c", marginTop: "2px", fontStyle: "italic" }}>
                                        Reason: {selectedInterview.reasonForChange}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* STRUCTURED READ-ONLY CANCELLED BADGE */}
                        {selectedInterview.status === "Cancelled" && (
                            <div style={{ marginBottom: "16px", backgroundColor: "#fef2f2", padding: "14px 18px", borderRadius: "12px", border: "1px solid #fca5a5" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <div style={{ fontSize: "12px", fontWeight: "800", color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.5px" }}>🔴 INTERVIEW CANCELLED</div>
                                        <div style={{ fontSize: "13px", color: "#7f1d1d", fontWeight: "700", marginTop: "6px" }}>
                                            Reason: <span style={{ fontWeight: "600", color: "#991b1b" }}>{selectedInterview.reasonForChange || "Candidate unavailable"}</span>
                                        </div>
                                        {selectedInterview.cancellationNotes && (
                                            <div style={{ fontSize: "12px", color: "#991b1b", marginTop: "2px" }}>
                                                Notes: {selectedInterview.cancellationNotes}
                                            </div>
                                        )}
                                        <div style={{ fontSize: "11px", color: "#b91c1c", marginTop: "6px" }}>
                                            Cancelled on: {selectedInterview.updatedAt || "Aug 31, 2026, 1:57 PM"}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleRestoreSchedule}
                                        style={{ padding: "8px 16px", backgroundColor: "#ffffff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "8px", fontWeight: "800", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                                    >
                                        🔄 Restore Schedule
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* VENUE & LOCATION DISPLAY */}
                        {!editVenueNotesMode && selectedInterview.venue && selectedInterview.status !== "Cancelled" && (
                            <div style={{ marginBottom: "16px", backgroundColor: "#eff6ff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #bfdbfe" }}>
                                <div style={{ fontSize: "10px", fontWeight: "800", color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px" }}>📍 VENUE & LOCATION</div>
                                <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e3a8a", marginTop: "2px" }}>{selectedInterview.venue}</div>
                            </div>
                        )}

                        {/* SCHEDULING ACTIONS (Only for non-cancelled) */}
                        {selectedInterview.status !== "Cancelled" && (
                            <div style={{ marginBottom: "20px" }}>
                                <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.5px" }}>SCHEDULING ACTIONS</div>
                                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                    <button
                                        onClick={() => setEditVenueNotesMode(!editVenueNotesMode)}
                                        style={{
                                            padding: "7px 14px",
                                            backgroundColor: editVenueNotesMode ? "#eff6ff" : "#f8fafc",
                                            color: editVenueNotesMode ? "#2563eb" : "#334155",
                                            border: editVenueNotesMode ? "1px solid #bfdbfe" : "1px solid #cbd5e1",
                                            borderRadius: "8px",
                                            fontSize: "12px",
                                            fontWeight: "700",
                                            cursor: "pointer"
                                        }}
                                    >
                                        ✏️ {editVenueNotesMode ? "Cancel Editing" : "Edit Venue/Notes"}
                                    </button>

                                    <button
                                        onClick={() => setShowRescheduleModal(true)}
                                        style={{
                                            padding: "7px 14px",
                                            backgroundColor: "#fff7ed",
                                            color: "#ea580c",
                                            border: "1px solid #fed7aa",
                                            borderRadius: "8px",
                                            fontSize: "12px",
                                            fontWeight: "700",
                                            cursor: "pointer"
                                        }}
                                    >
                                        🗓️ Reschedule
                                    </button>

                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        style={{
                                            padding: "7px 14px",
                                            backgroundColor: "#ffffff",
                                            color: "#dc2626",
                                            border: "1px solid #fca5a5",
                                            borderRadius: "8px",
                                            fontSize: "12px",
                                            fontWeight: "700",
                                            cursor: "pointer"
                                        }}
                                    >
                                        ❌ Cancel Interview
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* EDIT VENUE/NOTES MODE INLINE FORM */}
                        {editVenueNotesMode && (
                            <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                                <div style={{ fontSize: "11px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", marginBottom: "8px" }}>EDIT VENUE & COORDINATOR NOTES</div>
                                <div style={{ marginBottom: "10px" }}>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>VENUE</label>
                                    <input
                                        type="text"
                                        value={modalForm.venue}
                                        onChange={(e) => setModalForm({ ...modalForm, venue: e.target.value })}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>NOTES</label>
                                    <textarea
                                        rows={2}
                                        value={modalForm.coordinationNotes}
                                        onChange={(e) => setModalForm({ ...modalForm, coordinationNotes: e.target.value })}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* INTERVIEW RESULT & FEEDBACK SECTION */}
                        <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "800", color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                                📊 Interview Result & Feedback
                            </h4>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                                {/* RESULT */}
                                <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        RESULT *
                                    </label>
                                    <select
                                        disabled={selectedInterview.status === "Cancelled"}
                                        value={selectedInterview.status === "Cancelled" ? "Not Applicable" : modalForm.result}
                                        onChange={(e) => handleResultChange(e.target.value as any)}
                                        style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "13px",
                                            fontWeight: "700",
                                            backgroundColor: selectedInterview.status === "Cancelled" ? "#f1f5f9" : "#ffffff",
                                            color: "#0f172a",
                                            boxSizing: "border-box"
                                        }}
                                    >
                                        {selectedInterview.status === "Cancelled" ? (
                                            <option value="Not Applicable">Not Applicable (Cancelled)</option>
                                        ) : (
                                            <>
                                                <option value="Pending">Pending</option>
                                                <option value="Selected">Selected</option>
                                                <option value="Rejected">Rejected</option>
                                                <option value="On Hold">On Hold</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                {/* CONDITIONAL NEXT ROUND */}
                                <div>
                                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        NEXT ROUND {modalForm.result === "Selected" && selectedInterview.status !== "Cancelled" && <span style={{ color: "#dc2626" }}>*</span>}
                                    </label>
                                    <input
                                        type="text"
                                        disabled={modalForm.result === "Pending" || modalForm.result === "Rejected" || modalForm.result === "Not Applicable" || selectedInterview.status === "Cancelled"}
                                        placeholder={
                                            selectedInterview.status === "Cancelled" ? "Not Applicable (Cancelled)" :
                                            modalForm.result === "Selected" ? "e.g. HR Round" :
                                            modalForm.result === "Rejected" ? "Not Applicable (Rejected)" : "Pending Evaluation"
                                        }
                                        value={selectedInterview.status === "Cancelled" ? "Not Applicable (Cancelled)" : modalForm.nextRound}
                                        onChange={(e) => setModalForm({ ...modalForm, nextRound: e.target.value })}
                                        style={{
                                            width: "100%",
                                            padding: "8px 12px",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "13px",
                                            backgroundColor: (modalForm.result === "Pending" || modalForm.result === "Rejected" || modalForm.result === "Not Applicable" || selectedInterview.status === "Cancelled") ? "#f1f5f9" : "#ffffff",
                                            color: "#0f172a",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>
                            </div>

                            {/* FEEDBACK TEXTAREA */}
                            <div style={{ marginBottom: "12px" }}>
                                <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                    FEEDBACK & TECHNICAL OBSERVATIONS
                                </label>
                                <textarea
                                    rows={3}
                                    disabled={selectedInterview.status === "Cancelled"}
                                    placeholder={selectedInterview.status === "Cancelled" ? "No evaluation recorded for cancelled interview." : "Log candidate strengths, DSA problem solving speed, or interviewer remarks..."}
                                    value={modalForm.feedback}
                                    onChange={(e) => setModalForm({ ...modalForm, feedback: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        color: "#0f172a",
                                        backgroundColor: selectedInterview.status === "Cancelled" ? "#f1f5f9" : "#ffffff",
                                        boxSizing: "border-box",
                                        fontFamily: "inherit"
                                    }}
                                />
                            </div>

                            {/* AUDIT TRAIL */}
                            {selectedInterview.updatedBy && (
                                <div style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic", borderTop: "1px dashed #e2e8f0", paddingTop: "8px" }}>
                                    Updated By: <strong>{selectedInterview.updatedBy}</strong> | {selectedInterview.updatedAt}
                                </div>
                            )}
                        </div>

                        {/* MODAL FOOTER BUTTONS */}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button
                                onClick={() => setSelectedInterview(null)}
                                style={{
                                    padding: "9px 16px",
                                    backgroundColor: "#f8fafc",
                                    color: "#475569",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                }}
                            >
                                Cancel
                            </button>

                            {selectedInterview.status !== "Cancelled" && (
                                <button
                                    onClick={handleSaveModalRecord}
                                    disabled={isSavingOutcome}
                                    style={{
                                        padding: "9px 20px",
                                        backgroundColor: isSavingOutcome ? "#94a3b8" : "#2563eb",
                                        color: "#ffffff",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                        fontWeight: "700",
                                        cursor: isSavingOutcome ? "not-allowed" : "pointer",
                                        boxShadow: "0 2px 4px rgba(37,99,235,0.2)",
                                        transition: "all 0.15s ease"
                                    }}
                                >
                                    {isSavingOutcome ? "⌛ Saving..." : "💾 Save Interview Outcome"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* DEDICATED CANCEL CONFIRMATION DIALOG */}
            {showCancelModal && selectedInterview && (
                <div
                    onClick={() => setShowCancelModal(false)}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.75)",
                        zIndex: 100000,
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
                            maxWidth: "450px",
                            padding: "24px",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                            border: "1px solid #fecaca"
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                            <span style={{ fontSize: "22px" }}>⚠️</span>
                            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#991b1b" }}>
                                Cancel Interview?
                            </h3>
                        </div>

                        <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>
                            Are you sure you want to cancel the scheduled interview for <strong>{selectedInterview.candidateName}</strong>?
                        </p>

                        <div style={{ marginBottom: "12px" }}>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#334155", textTransform: "uppercase", marginBottom: "6px" }}>
                                CANCELLATION REASON *
                            </label>
                            <select
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "9px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    color: "#0f172a",
                                    backgroundColor: "#ffffff",
                                    boxSizing: "border-box"
                                }}
                            >
                                <option value="Student unavailable">Student unavailable</option>
                                <option value="Recruiter requested cancellation">Recruiter requested cancellation</option>
                                <option value="Company cancelled">Company cancelled</option>
                                <option value="Schedule conflict">Schedule conflict</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#334155", textTransform: "uppercase", marginBottom: "6px" }}>
                                ADDITIONAL NOTES
                            </label>
                            <textarea
                                rows={2}
                                placeholder="Add optional details regarding cancellation..."
                                value={cancelNotesInput}
                                onChange={(e) => setCancelNotesInput(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "13px",
                                    color: "#0f172a",
                                    boxSizing: "border-box",
                                    fontFamily: "inherit"
                                }}
                            />
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button
                                onClick={() => setShowCancelModal(false)}
                                style={{
                                    padding: "9px 16px",
                                    backgroundColor: "#f8fafc",
                                    color: "#475569",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                }}
                            >
                                Keep Interview
                            </button>

                            <button
                                onClick={handleConfirmCancellation}
                                style={{
                                    padding: "9px 18px",
                                    backgroundColor: "#dc2626",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    boxShadow: "0 2px 4px rgba(220,38,38,0.2)"
                                }}
                            >
                                Cancel Interview
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DEDICATED RESCHEDULE DIALOG WITH HISTORY LOGGING */}
            {showRescheduleModal && selectedInterview && (
                <div
                    onClick={() => setShowRescheduleModal(false)}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.75)",
                        zIndex: 100000,
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
                            maxWidth: "440px",
                            padding: "24px",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                            border: "1px solid #fed7aa"
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                            <span style={{ fontSize: "22px" }}>🗓️</span>
                            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#ea580c" }}>
                                Reschedule Interview
                            </h3>
                        </div>

                        <div style={{ backgroundColor: "#fff7ed", padding: "10px 14px", borderRadius: "8px", border: "1px solid #ffedd5", marginBottom: "16px", fontSize: "12px", color: "#9a3412" }}>
                            Current Date: <strong>{selectedInterview.dateTime}</strong>
                        </div>

                        <div style={{ marginBottom: "12px" }}>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#334155", textTransform: "uppercase", marginBottom: "4px" }}>
                                NEW DATE & TIME *
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Sep 8, 11:00 AM"
                                value={newRescheduleDate}
                                onChange={(e) => setNewRescheduleDate(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "9px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    color: "#0f172a",
                                    boxSizing: "border-box"
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#334155", textTransform: "uppercase", marginBottom: "4px" }}>
                                RESCHEDULING REASON *
                            </label>
                            <select
                                value={rescheduleReason}
                                onChange={(e) => setRescheduleReason(e.target.value)}
                                style={{
                                    width: "100%",
                                    padding: "9px 12px",
                                    borderRadius: "8px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    color: "#0f172a",
                                    backgroundColor: "#ffffff",
                                    boxSizing: "border-box"
                                }}
                            >
                                <option value="Recruiter schedule update">Recruiter schedule update</option>
                                <option value="Student request">Student request</option>
                                <option value="Venue conflict">Venue conflict</option>
                                <option value="Technical infrastructure delay">Technical infrastructure delay</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button
                                onClick={() => setShowRescheduleModal(false)}
                                style={{
                                    padding: "9px 16px",
                                    backgroundColor: "#f8fafc",
                                    color: "#475569",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleConfirmRescheduling}
                                style={{
                                    padding: "9px 18px",
                                    backgroundColor: "#ea580c",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    boxShadow: "0 2px 4px rgba(234,88,12,0.2)"
                                }}
                            >
                                Reschedule Interview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoordinatorInterviews;
