import React, { useState, useEffect } from "react";

export interface CoordinatorEventItem {
    id: string;
    name: string;
    type: "Placement Drive" | "Technical Assessment" | "Pre-Placement Talk" | "Interview" | "Orientation" | "Other";
    date: string;
    time: string;
    venue: string;
    registeredStudents: number;
    status: "Scheduled" | "Upcoming" | "In Progress" | "Completed" | "Cancelled" | "Pending Verification";
    description?: string;
    organizer?: string;
}

export interface CoordinatorEventsProps {
    user?: any;
    autoOpenCreateModal?: boolean;
    onModalClose?: () => void;
    onBackToDashboard?: () => void;
}

export const CoordinatorEvents: React.FC<CoordinatorEventsProps> = ({
    autoOpenCreateModal = false,
    onModalClose,
    onBackToDashboard
}) => {
    const defaultEvents: CoordinatorEventItem[] = [
        {
            id: "evt_1",
            name: "Amazon Technical Test",
            type: "Technical Assessment",
            date: "Sep 1, 2026",
            time: "10:00 AM IST",
            venue: "Lab 3 — Computer Center",
            registeredStudents: 120,
            status: "Pending Verification",
            description: "Online coding and aptitude test for Amazon SDE-1 recruitment drive.",
            organizer: "Placement Operational Cell"
        },
        {
            id: "evt_2",
            name: "TCS Pre-Placement Talk",
            type: "Pre-Placement Talk",
            date: "Sep 3, 2026",
            time: "11:30 AM IST",
            venue: "Main Auditorium",
            registeredStudents: 350,
            status: "Scheduled",
            description: "Pre-placement briefing and company orientation session by TCS hiring team.",
            organizer: "TCS Campus Relations"
        },
        {
            id: "evt_3",
            name: "Google Cloud Interview Setup",
            type: "Interview",
            date: "Sep 5, 2026",
            time: "02:00 PM IST",
            venue: "Placement Cell Boardroom",
            registeredStudents: 45,
            status: "Upcoming",
            description: "Round 2 Technical Interview coordination for Cloud Engineer candidates.",
            organizer: "Google Talent Acquisition"
        },
        {
            id: "evt_4",
            name: "Placement Orientation 2026",
            type: "Orientation",
            date: "Aug 25, 2026",
            time: "09:00 AM IST",
            venue: "Hall A — Main Building",
            registeredStudents: 450,
            status: "Completed",
            description: "Annual placement readiness workshop for 2026 graduating batch.",
            organizer: "Placement Advisory Committee"
        },
        {
            id: "evt_5",
            name: "Infosys Aptitude Drive",
            type: "Placement Drive",
            date: "Sep 8, 2026",
            time: "09:30 AM IST",
            venue: "Lab 1 & Lab 2",
            registeredStudents: 280,
            status: "In Progress",
            description: "First round online aptitude test for Systems Engineer position.",
            organizer: "Infosys Recruitment Team"
        }
    ];

    // Persisted Events State
    const [eventsList, setEventsList] = useState<CoordinatorEventItem[]>(() => {
        try {
            const saved = localStorage.getItem("cpms_coordinator_events");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {}
        return defaultEvents;
    });

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(autoOpenCreateModal);
    const [newEvent, setNewEvent] = useState({
        name: "",
        type: "Technical Assessment" as CoordinatorEventItem["type"],
        date: "Sep 10, 2026",
        time: "10:00 AM IST",
        venue: "Lab 3 — Computer Center",
        registeredStudents: 150,
        description: "Pre-placement briefing & online assessment session."
    });

    useEffect(() => {
        if (autoOpenCreateModal) {
            setIsCreateModalOpen(true);
        }
    }, [autoOpenCreateModal]);

    // Filters State
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedType, setSelectedType] = useState("All");
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [selectedDate, setSelectedDate] = useState("");

    // Selected Event for View Only Modal
    const [viewEvent, setViewEvent] = useState<CoordinatorEventItem | null>(null);

    // ESC Key Handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" || e.code === "Escape") {
                if (isCreateModalOpen) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    setIsCreateModalOpen(false);
                    if (onModalClose) onModalClose();
                } else if (viewEvent) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    setViewEvent(null);
                } else if (onBackToDashboard) {
                    onBackToDashboard();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown, true);
        return () => window.removeEventListener("keydown", handleKeyDown, true);
    }, [isCreateModalOpen, viewEvent, onModalClose, onBackToDashboard]);

    // Reset Filters Handler
    const handleResetFilters = () => {
        setSearchTerm("");
        setSelectedType("All");
        setSelectedStatus("All");
        setSelectedDate("");
    };

    // Filter Logic
    const filteredEvents = eventsList.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.venue.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = selectedType === "All" || item.type === selectedType;
        const matchesStatus = selectedStatus === "All" || item.status === selectedStatus;
        const matchesDate = !selectedDate || item.date.toLowerCase().includes(selectedDate.toLowerCase());
        return matchesSearch && matchesType && matchesStatus && matchesDate;
    });

    const getStatusBadge = (status: CoordinatorEventItem["status"]) => {
        switch (status) {
            case "Scheduled":
                return { bg: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", icon: "🔵", label: "Scheduled" };
            case "Upcoming":
                return { bg: "#faf5ff", color: "#7e22ce", border: "1px solid #e9d5ff", icon: "🟣", label: "Upcoming" };
            case "In Progress":
                return { bg: "#f0f9ff", color: "#0284c7", border: "1px solid #bae6fd", icon: "🔵", label: "In Progress" };
            case "Completed":
                return { bg: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", icon: "🟢", label: "Completed" };
            case "Cancelled":
                return { bg: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", icon: "🔴", label: "Cancelled" };
            case "Pending Verification":
                return { bg: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa", icon: "🟡", label: "Pending Verification" };
            default:
                return { bg: "#f8fafc", color: "#64748b", border: "1px solid #cbd5e1", icon: "⚪", label: status };
        }
    };

    const handleCreateEventSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEvent.name.trim()) return;

        const createdItem: CoordinatorEventItem = {
            id: `evt_${Date.now()}`,
            name: newEvent.name.trim(),
            type: newEvent.type,
            date: newEvent.date,
            time: newEvent.time,
            venue: newEvent.venue,
            registeredStudents: Number(newEvent.registeredStudents) || 100,
            status: "Upcoming",
            description: newEvent.description,
            organizer: "Placement Operational Cell"
        };

        const updatedList = [createdItem, ...eventsList];
        setEventsList(updatedList);
        try {
            localStorage.setItem("cpms_coordinator_events", JSON.stringify(updatedList));
        } catch (e) {}

        setIsCreateModalOpen(false);
        if (onModalClose) onModalClose();

        // Reset form
        setNewEvent({
            name: "",
            type: "Technical Assessment",
            date: "Sep 10, 2026",
            time: "10:00 AM IST",
            venue: "Lab 3 — Computer Center",
            registeredStudents: 150,
            description: "Pre-placement briefing & online assessment session."
        });
    };

    return (
        <div style={{ maxWidth: "1150px", margin: "0 auto", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}>
            <style>{`
                @media (max-width: 768px) {
                    .events-filter-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .events-header-row {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 16px !important;
                    }
                }
            `}</style>

            {/* PAGE HEADER & TOP ACTION */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }} className="events-header-row">
                <div>
                    <h2 style={{ margin: "0 0 6px 0", fontSize: "22px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.3px" }}>
                        Events
                    </h2>
                    <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                        Manage placement drives, pre-placement talks, assessments, and other campus events.
                    </p>
                </div>

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    style={{
                        padding: "11px 20px",
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "10px",
                        fontWeight: "700",
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
                        transition: "all 0.15s ease"
                    }}
                >
                    <span style={{ fontSize: "16px" }}>+</span> Create Event
                </button>
            </div>

            {/* FILTERS BAR CARD */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "20px 24px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", marginBottom: "24px" }}>
                <div className="events-filter-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: "14px", alignItems: "center" }}>
                    {/* Search Event Input */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                            SEARCH EVENT
                        </label>
                        <input
                            type="text"
                            placeholder="🔍 Search by event name or venue..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "9px 14px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "13px",
                                outline: "none",
                                boxSizing: "border-box",
                                color: "#0f172a"
                            }}
                        />
                    </div>

                    {/* Event Type Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                            EVENT TYPE
                        </label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "9px 12px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "13px",
                                outline: "none",
                                backgroundColor: "#ffffff",
                                boxSizing: "border-box",
                                color: "#0f172a"
                            }}
                        >
                            <option value="All">All Event Types</option>
                            <option value="Placement Drive">Placement Drive</option>
                            <option value="Technical Assessment">Technical Assessment</option>
                            <option value="Pre-Placement Talk">Pre-Placement Talk</option>
                            <option value="Interview">Interview</option>
                            <option value="Orientation">Orientation</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Date Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                            DATE
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Sep 1"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
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
                                padding: "9px 12px",
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
                            <option value="Upcoming">Upcoming</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="Pending Verification">Pending Verification</option>
                        </select>
                    </div>

                    {/* Reset Filters Button */}
                    <div style={{ paddingTop: "18px" }}>
                        <button
                            onClick={handleResetFilters}
                            style={{
                                padding: "9px 16px",
                                backgroundColor: "#f8fafc",
                                color: "#475569",
                                border: "1px solid #cbd5e1",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: "700",
                                cursor: "pointer",
                                whiteSpace: "nowrap"
                            }}
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* EVENTS TABLE CONTAINER */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", overflow: "hidden" }}>
                <div style={{ padding: "18px 24px", borderBottom: "1px solid #eaedf0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>
                        Campus Events Schedule ({filteredEvents.length})
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                        Showing {filteredEvents.length} of {eventsList.length} total events
                    </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", whiteSpace: "nowrap" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #eaedf0", color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                <th style={{ padding: "12px 18px" }}>Event Name</th>
                                <th style={{ padding: "12px 18px" }}>Event Type</th>
                                <th style={{ padding: "12px 18px" }}>Date & Time</th>
                                <th style={{ padding: "12px 18px" }}>Venue</th>
                                <th style={{ padding: "12px 18px" }}>Registered Students</th>
                                <th style={{ padding: "12px 18px" }}>Status</th>
                                <th style={{ padding: "12px 18px", textAlign: "right" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEvents.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                                        No events found matching the selected filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredEvents.map((evt, idx) => {
                                    const badge = getStatusBadge(evt.status);
                                    return (
                                        <tr key={evt.id} style={{ borderBottom: idx !== filteredEvents.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                                            <td style={{ padding: "14px 18px", fontWeight: "800", color: "#0f172a", fontSize: "14px" }}>
                                                {evt.name}
                                            </td>
                                            <td style={{ padding: "14px 18px", color: "#334155", fontSize: "13px", fontWeight: "600" }}>
                                                {evt.type}
                                            </td>
                                            <td style={{ padding: "14px 18px", color: "#475569", fontSize: "13px", fontWeight: "600" }}>
                                                {evt.date} • {evt.time}
                                            </td>
                                            <td style={{ padding: "14px 18px", color: "#334155", fontSize: "13px", fontWeight: "600" }}>
                                                {evt.venue}
                                            </td>
                                            <td style={{ padding: "14px 18px", color: "#2563eb", fontSize: "13px", fontWeight: "700" }}>
                                                👥 {evt.registeredStudents}
                                            </td>
                                            <td style={{ padding: "14px 18px" }}>
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
                                                    width: "165px",
                                                    boxSizing: "border-box",
                                                    gap: "6px",
                                                    textAlign: "center"
                                                }}>
                                                    {badge.icon} {badge.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: "14px 18px", textAlign: "right" }}>
                                                <button
                                                    onClick={() => setViewEvent(evt)}
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

            {/* CREATE NEW EVENT MODAL */}
            {isCreateModalOpen && (
                <div
                    onClick={() => {
                        setIsCreateModalOpen(false);
                        if (onModalClose) onModalClose();
                    }}
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
                        padding: "16px",
                        boxSizing: "border-box"
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            width: "100%",
                            maxWidth: "560px",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            padding: "24px 28px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)"
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                            <div>
                                <span style={{ fontSize: "11px", fontWeight: "800", color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px" }}>EVENT CREATION</span>
                                <h3 style={{ margin: "2px 0 0 0", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>➕ Create Campus Event</h3>
                            </div>
                            <button
                                onClick={() => {
                                    setIsCreateModalOpen(false);
                                    if (onModalClose) onModalClose();
                                }}
                                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b", fontWeight: "700" }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateEventSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                    EVENT NAME *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Amazon SDE Technical Test"
                                    value={newEvent.name}
                                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none",
                                        boxSizing: "border-box",
                                        color: "#0f172a"
                                    }}
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        EVENT TYPE *
                                    </label>
                                    <select
                                        value={newEvent.type}
                                        onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                                        style={{
                                            width: "100%",
                                            padding: "10px 12px",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "13px",
                                            outline: "none",
                                            backgroundColor: "#ffffff",
                                            boxSizing: "border-box",
                                            color: "#0f172a"
                                        }}
                                    >
                                        <option value="Placement Drive">Placement Drive</option>
                                        <option value="Technical Assessment">Technical Assessment</option>
                                        <option value="Pre-Placement Talk">Pre-Placement Talk</option>
                                        <option value="Interview">Interview</option>
                                        <option value="Orientation">Orientation</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        EXPECTED STUDENTS *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={newEvent.registeredStudents}
                                        onChange={(e) => setNewEvent({ ...newEvent, registeredStudents: Number(e.target.value) })}
                                        style={{
                                            width: "100%",
                                            padding: "10px 12px",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "13px",
                                            outline: "none",
                                            boxSizing: "border-box",
                                            color: "#0f172a"
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        DATE *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Sep 10, 2026"
                                        value={newEvent.date}
                                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                        style={{
                                            width: "100%",
                                            padding: "10px 12px",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "13px",
                                            outline: "none",
                                            boxSizing: "border-box",
                                            color: "#0f172a"
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        TIME *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. 10:00 AM IST"
                                        value={newEvent.time}
                                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                                        style={{
                                            width: "100%",
                                            padding: "10px 12px",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "13px",
                                            outline: "none",
                                            boxSizing: "border-box",
                                            color: "#0f172a"
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                    VENUE / LOCATION *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Lab 3 — Computer Center"
                                    value={newEvent.venue}
                                    onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none",
                                        boxSizing: "border-box",
                                        color: "#0f172a"
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                    EVENT DESCRIPTION / AGENDA
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Describe operational guidelines, seating plan, or assessment syllabus..."
                                    value={newEvent.description}
                                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none",
                                        boxSizing: "border-box",
                                        color: "#0f172a",
                                        fontFamily: "inherit"
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        if (onModalClose) onModalClose();
                                    }}
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
                                    type="submit"
                                    style={{
                                        padding: "9px 20px",
                                        backgroundColor: "#2563eb",
                                        color: "#ffffff",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                        fontWeight: "700",
                                        cursor: "pointer",
                                        boxShadow: "0 2px 4px rgba(37,99,235,0.2)"
                                    }}
                                >
                                    🚀 Create Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW EVENT DETAILS MODAL */}
            {viewEvent && (
                <div
                    onClick={() => setViewEvent(null)}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.6)",
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
                            maxWidth: "540px",
                            padding: "24px 28px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <div>
                                <span style={{ fontSize: "11px", fontWeight: "800", color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px" }}>EVENT DETAILS</span>
                                <h3 style={{ margin: "2px 0 0 0", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>{viewEvent.name}</h3>
                            </div>
                            <button onClick={() => setViewEvent(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b", fontWeight: "700" }}>✕</button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #f1f5f9", marginBottom: "16px" }}>
                            <div>
                                <div style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>EVENT TYPE</div>
                                <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>{viewEvent.type}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>DATE & TIME</div>
                                <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>{viewEvent.date} • {viewEvent.time}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>VENUE</div>
                                <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>{viewEvent.venue}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>REGISTERED STUDENTS</div>
                                <div style={{ fontSize: "13px", fontWeight: "700", color: "#2563eb", marginTop: "2px" }}>👥 {viewEvent.registeredStudents} Candidates</div>
                            </div>
                        </div>

                        {viewEvent.description && (
                            <div style={{ marginBottom: "16px" }}>
                                <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>DESCRIPTION / AGENDA</div>
                                <div style={{ fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>{viewEvent.description}</div>
                            </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                                onClick={() => setViewEvent(null)}
                                style={{ padding: "8px 18px", backgroundColor: "#0f172a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
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

export default CoordinatorEvents;
