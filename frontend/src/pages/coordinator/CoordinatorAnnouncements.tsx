import React, { useState, useEffect } from "react";

export interface AnnouncementItem {
    id: string;
    _id?: string;
    title: string;
    description: string;
    targetAudience: "All Students" | "Eligible Students" | "Selected Batch";
    targetBatch?: string;
    publishDate?: string;
    publishedDate?: string;
    expiryDate: string;
    status: "Published" | "Draft" | "Archived";
    author?: string;
    priority?: "Normal" | "High" | "Urgent";
    referenceLink?: string;
}

export interface CoordinatorAnnouncementsProps {
    user?: any;
    onBackToDashboard?: () => void;
    onCreateAnnouncement?: () => void;
}

export const CoordinatorAnnouncements: React.FC<CoordinatorAnnouncementsProps> = ({
    user = { name: "Prof. Rajesh Sharma (Coordinator)" },
    onBackToDashboard
}) => {
    // Date Helpers
    const toDateInputValue = (dateStr?: string): string => {
        if (!dateStr) return "";
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
            const [day, month, year] = dateStr.split("/");
            return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
            const year = parsed.getFullYear();
            const month = String(parsed.getMonth() + 1).padStart(2, "0");
            const day = String(parsed.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        }
        return "";
    };

    const formatDisplayDate = (dateStr?: string): string => {
        if (!dateStr) return "";
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const [year, month, day] = dateStr.split("-");
            const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
        }
        return dateStr;
    };

    // Initial Clean Default Data
    const initialAnnouncements: AnnouncementItem[] = [
        {
            id: "ann_1",
            title: "Amazon SDE-1 Drive Shortlist & Technical Round Schedule",
            description: "All shortlisted students for Amazon SDE-1 must report to Computer Lab 3 at 09:30 AM with college ID card and printed copies of their resume. Online technical assessment credentials will be shared on-site.",
            targetAudience: "Eligible Students",
            publishDate: "2026-08-30",
            expiryDate: "2026-09-05",
            status: "Published",
            author: "Prof. Rajesh Sharma (Coordinator)",
            priority: "Urgent",
            referenceLink: "https://amazon.jobs/students"
        },
        {
            id: "ann_2",
            title: "TCS Pre-Placement Talk & Mandatory Registration Deadline",
            description: "TCS Campus Recruitment 2026 Pre-placement talk will be held in the Main Auditorium on Sep 3 at 11:00 AM. Attendance is strictly mandatory for all registered 2026 batch candidates.",
            targetAudience: "Selected Batch",
            targetBatch: "CSE 2026 - Batch A",
            publishDate: "2026-08-29",
            expiryDate: "2026-09-03",
            status: "Published",
            author: "Prof. Rajesh Sharma (Coordinator)",
            priority: "High",
            referenceLink: "https://forms.google.com/tcs-registration"
        },
        {
            id: "ann_3",
            title: "Resume Building & Technical Mock Interview Workshop",
            description: "Department of Training & Placement is organizing a dedicated resume review session for all final year placement-registered students in Conference Hall B.",
            targetAudience: "All Students",
            publishDate: "2026-08-25",
            expiryDate: "2026-09-10",
            status: "Published",
            author: "Placement Cell",
            priority: "Normal"
        },
        {
            id: "ann_4",
            title: "Google Cloud Tech Challenge Guidelines & Registration Link",
            description: "Draft guidelines containing test environment links, IDE instructions, and eligibility criteria for Google Cloud challenge.",
            targetAudience: "Eligible Students",
            publishDate: "2026-08-31",
            expiryDate: "2026-09-15",
            status: "Draft",
            author: "Prof. Rajesh Sharma (Coordinator)",
            priority: "Normal",
            referenceLink: "https://cloud.google.com/edu"
        },
        {
            id: "ann_5",
            title: "Infosys Systems Engineer Drive Concluded — Offer Letters Released",
            description: "The campus placement drive for Infosys has been concluded. Selected candidates can collect their official physical offer letters from the Placement Office.",
            targetAudience: "Selected Batch",
            targetBatch: "All 2026 Batches",
            publishDate: "2026-08-20",
            expiryDate: "2026-08-28",
            status: "Archived",
            author: "Placement Cell",
            priority: "Normal"
        }
    ];

    // State
    const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() => {
        try {
            const saved = localStorage.getItem("cpms_coordinator_announcements");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {}
        return initialAnnouncements;
    });

    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [targetFilter, setTargetFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

    // Modals State
    const [viewAnnouncement, setViewAnnouncement] = useState<AnnouncementItem | null>(null);
    const [editAnnouncement, setEditAnnouncement] = useState<AnnouncementItem | null>(null);
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<AnnouncementItem | null>(null);

    // Today in YYYY-MM-DD for datepicker
    const todayYMD = new Date().toISOString().split("T")[0];

    // Form State with optional publishDate
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        targetAudience: "All Students" as AnnouncementItem["targetAudience"],
        targetBatch: "CSE 2026 - Batch A",
        publishDate: todayYMD,
        expiryDate: "2026-09-15",
        status: "Published" as AnnouncementItem["status"],
        priority: "Normal" as NonNullable<AnnouncementItem["priority"]>,
        referenceLink: ""
    });

    // Fetch Announcements from Backend API
    const fetchAnnouncements = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("token") || localStorage.getItem("userToken");
            const res = await fetch("http://localhost:5001/api/coordinator/announcements", {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.announcements) && data.announcements.length > 0) {
                    const mapped: AnnouncementItem[] = data.announcements.map((a: any) => ({
                        id: a._id || a.id,
                        _id: a._id,
                        title: a.title,
                        description: a.description,
                        targetAudience: a.targetAudience,
                        targetBatch: a.targetBatch,
                        publishDate: a.publishDate || a.publishedDate,
                        expiryDate: a.expiryDate,
                        status: a.status,
                        author: a.author,
                        priority: a.priority || "Normal",
                        referenceLink: a.referenceLink
                    }));
                    setAnnouncements(mapped);
                    try { localStorage.setItem("cpms_coordinator_announcements", JSON.stringify(mapped)); } catch (e) {}
                }
            }
        } catch (error) {
            console.warn("Could not fetch announcements from API, using saved state:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    // Prefill form for editing with reliable ISO Date parsing
    useEffect(() => {
        if (editAnnouncement) {
            const rawPub = editAnnouncement.publishDate || editAnnouncement.publishedDate || todayYMD;
            const parsedPubYMD = toDateInputValue(rawPub) || todayYMD;
            const rawExp = editAnnouncement.expiryDate || "2026-09-15";
            const parsedExpYMD = toDateInputValue(rawExp) || "2026-09-15";
            const isExpired = parsedExpYMD < todayYMD;

            setFormData({
                title: editAnnouncement.title,
                description: editAnnouncement.description,
                targetAudience: editAnnouncement.targetAudience,
                targetBatch: editAnnouncement.targetBatch || "CSE 2026 - Batch A",
                publishDate: parsedPubYMD,
                expiryDate: parsedExpYMD,
                status: isExpired ? "Archived" : editAnnouncement.status,
                priority: editAnnouncement.priority || "Normal",
                referenceLink: editAnnouncement.referenceLink || ""
            });
        }
    }, [editAnnouncement]);

    // Open Create Modal
    const handleOpenCreateModal = () => {
        setFormData({
            title: "",
            description: "",
            targetAudience: "All Students",
            targetBatch: "CSE 2026 - Batch A",
            publishDate: todayYMD,
            expiryDate: "2026-09-15",
            status: "Published",
            priority: "Normal",
            referenceLink: ""
        });
        setShowCreateModal(true);
    };

    // ESC Key Navigation Handler (2-step hierarchy)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" || e.code === "Escape") {
                if (showCreateModal) {
                    e.stopImmediatePropagation();
                    setShowCreateModal(false);
                } else if (editAnnouncement) {
                    e.stopImmediatePropagation();
                    setEditAnnouncement(null);
                } else if (viewAnnouncement) {
                    e.stopImmediatePropagation();
                    setViewAnnouncement(null);
                } else if (itemToDelete) {
                    e.stopImmediatePropagation();
                    setItemToDelete(null);
                } else if (onBackToDashboard) {
                    onBackToDashboard();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown, true);
        return () => window.removeEventListener("keydown", handleKeyDown, true);
    }, [showCreateModal, editAnnouncement, viewAnnouncement, itemToDelete, onBackToDashboard]);

    // Reset Filters Handler
    const handleResetFilters = () => {
        setSearchTerm("");
        setStatusFilter("All");
        setTargetFilter("All");
        setPriorityFilter("All");
    };

    // Save New Announcement to Backend API & Local State
    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.description.trim()) {
            alert("Please enter both an Announcement Title and Content.");
            return;
        }

        if (formData.expiryDate && formData.expiryDate < todayYMD) {
            alert("Expiry date cannot be set in the past. Please select a future expiry date.");
            return;
        }

        const newAnnPayload = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            targetAudience: formData.targetAudience,
            targetBatch: formData.targetAudience === "Selected Batch" ? formData.targetBatch : undefined,
            publishDate: formData.publishDate || todayYMD,
            expiryDate: formData.expiryDate,
            status: formData.status,
            author: user.name || "Prof. Rajesh Sharma (Coordinator)",
            priority: formData.priority,
            referenceLink: formData.referenceLink.trim() || undefined
        };

        try {
            const token = localStorage.getItem("token") || localStorage.getItem("userToken");
            const res = await fetch("http://localhost:5001/api/coordinator/announcements", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify(newAnnPayload)
            });

            if (res.ok) {
                const data = await res.json();
                if (data.announcement) {
                    const createdItem: AnnouncementItem = {
                        id: data.announcement._id || `ann_${Date.now()}`,
                        _id: data.announcement._id,
                        ...newAnnPayload
                    };
                    const updated = [createdItem, ...announcements];
                    setAnnouncements(updated);
                    try { localStorage.setItem("cpms_coordinator_announcements", JSON.stringify(updated)); } catch (err) {}
                }
            } else {
                // Local fallback
                const createdItem: AnnouncementItem = {
                    id: `ann_${Date.now()}`,
                    ...newAnnPayload
                };
                const updated = [createdItem, ...announcements];
                setAnnouncements(updated);
                try { localStorage.setItem("cpms_coordinator_announcements", JSON.stringify(updated)); } catch (err) {}
            }
        } catch (error) {
            // Local fallback
            const createdItem: AnnouncementItem = {
                id: `ann_${Date.now()}`,
                ...newAnnPayload
            };
            const updated = [createdItem, ...announcements];
            setAnnouncements(updated);
            try { localStorage.setItem("cpms_coordinator_announcements", JSON.stringify(updated)); } catch (err) {}
        }

        setShowCreateModal(false);
        setSaveFeedback(`✅ Announcement "${newAnnPayload.title}" saved successfully!`);
        setTimeout(() => setSaveFeedback(null), 3500);
    };

    // Save Edited Announcement to Backend API & Local State
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editAnnouncement || !formData.title.trim() || !formData.description.trim()) return;

        const isExpired = formData.expiryDate && formData.expiryDate < todayYMD;
        const finalStatus = isExpired ? "Archived" : formData.status;

        const updatedAnnPayload = {
            title: formData.title.trim(),
            description: formData.description.trim(),
            targetAudience: formData.targetAudience,
            targetBatch: formData.targetAudience === "Selected Batch" ? formData.targetBatch : undefined,
            publishDate: formData.publishDate,
            expiryDate: formData.expiryDate,
            status: finalStatus,
            priority: formData.priority,
            referenceLink: formData.referenceLink.trim() || undefined,
            author: user.name || editAnnouncement.author
        };

        const targetId = editAnnouncement._id || editAnnouncement.id;

        try {
            const token = localStorage.getItem("token") || localStorage.getItem("userToken");
            await fetch(`http://localhost:5001/api/coordinator/announcements/${targetId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify(updatedAnnPayload)
            });
        } catch (error) {
            console.warn("API update fallback to local:", error);
        }

        const updatedAnn: AnnouncementItem = {
            ...editAnnouncement,
            ...updatedAnnPayload
        };

        const updated = announcements.map(a => (a._id === targetId || a.id === targetId) ? updatedAnn : a);
        setAnnouncements(updated);
        try { localStorage.setItem("cpms_coordinator_announcements", JSON.stringify(updated)); } catch (err) {}

        setEditAnnouncement(null);
        setSaveFeedback(`✅ Announcement "${updatedAnn.title}" updated successfully!`);
        setTimeout(() => setSaveFeedback(null), 3500);
    };

    // Confirm Delete from Backend API & Local State
    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        const targetId = itemToDelete._id || itemToDelete.id;

        try {
            const token = localStorage.getItem("token") || localStorage.getItem("userToken");
            await fetch(`http://localhost:5001/api/coordinator/announcements/${targetId}`, {
                method: "DELETE",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });
        } catch (error) {
            console.warn("API delete fallback to local:", error);
        }

        const updated = announcements.filter(a => a._id !== targetId && a.id !== targetId);
        setAnnouncements(updated);
        try { localStorage.setItem("cpms_coordinator_announcements", JSON.stringify(updated)); } catch (err) {}

        setItemToDelete(null);
        setSaveFeedback(`🗑️ Announcement "${itemToDelete.title}" deleted.`);
        setTimeout(() => setSaveFeedback(null), 3500);
    };

    // Auto-Archival, Filter & Smart Group/Date Sorting Logic
    const filteredAnnouncements = announcements.map(item => {
        const itemExpYMD = toDateInputValue(item.expiryDate);
        if (itemExpYMD && itemExpYMD < todayYMD && item.status === "Published") {
            return { ...item, status: "Archived" as const };
        }
        return item;
    }).filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.targetBatch && item.targetBatch.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === "All" || item.status === statusFilter;
        const matchesTarget = targetFilter === "All" || item.targetAudience === targetFilter;
        const matchesPriority = priorityFilter === "All" || item.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesTarget && matchesPriority;
    }).sort((a, b) => {
        // Status Group Ordering: Published (1) -> Draft (2) -> Archived (3)
        const statusOrder: Record<string, number> = { Published: 1, Draft: 2, Archived: 3 };
        const orderA = statusOrder[a.status] || 4;
        const orderB = statusOrder[b.status] || 4;

        if (orderA !== orderB) {
            return orderA - orderB;
        }

        // Within each status group: newest published date first
        const dateA = new Date(toDateInputValue(a.publishDate || a.publishedDate) || "1970-01-01").getTime();
        const dateB = new Date(toDateInputValue(b.publishDate || b.publishedDate) || "1970-01-01").getTime();
        return dateB - dateA;
    });

    const getStatusBadge = (status: AnnouncementItem["status"]) => {
        switch (status) {
            case "Published":
                return { bg: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", icon: "🟢", label: "Published" };
            case "Draft":
                return { bg: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa", icon: "🟡", label: "Draft" };
            case "Archived":
                return { bg: "#f8fafc", color: "#64748b", border: "1px solid #cbd5e1", icon: "⚪", label: "Archived" };
            default:
                return { bg: "#f8fafc", color: "#64748b", border: "1px solid #cbd5e1", icon: "⚪", label: status };
        }
    };

    const getPriorityBadge = (priority: AnnouncementItem["priority"]) => {
        switch (priority) {
            case "Urgent":
                return { bg: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", icon: "🔴", label: "Urgent" };
            case "High":
                return { bg: "#fff7ed", color: "#ea580c", border: "1px solid #fed7aa", icon: "🟡", label: "High" };
            case "Normal":
            default:
                return { bg: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1", icon: "⚪", label: "Normal" };
        }
    };

    const getTargetBadge = (target: AnnouncementItem["targetAudience"]) => {
        switch (target) {
            case "All Students":
                return { bg: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" };
            case "Eligible Students":
                return { bg: "#faf5ff", color: "#9333ea", border: "1px solid #e9d5ff" };
            case "Selected Batch":
                return { bg: "#f0fdfa", color: "#0d9488", border: "1px solid #99f6e4" };
            default:
                return { bg: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1" };
        }
    };

    return (
        <div style={{ maxWidth: "1150px", margin: "0 auto", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}>
            <style>{`
                @media (max-width: 768px) {
                    .announcements-desktop-table {
                        display: none !important;
                    }
                    .announcements-mobile-cards {
                        display: flex !important;
                        flex-direction: column;
                        gap: 14px;
                    }
                    .announcements-controls-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .announcements-header-row {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 14px !important;
                    }
                }
                @media (min-width: 769px) {
                    .announcements-mobile-cards {
                        display: none !important;
                    }
                    .announcements-desktop-table {
                        display: block !important;
                    }
                }
            `}</style>

            {/* PAGE HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }} className="announcements-header-row">
                <div>
                    <h2 style={{ margin: "0 0 4px 0", fontSize: "24px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.4px" }}>
                        Announcements
                    </h2>
                    <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                        Create and manage placement-related announcements for students.
                    </p>
                </div>

                <button
                    onClick={handleOpenCreateModal}
                    style={{
                        padding: "10px 20px",
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "10px",
                        fontWeight: "800",
                        fontSize: "14px",
                        cursor: "pointer",
                        boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.25)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        whiteSpace: "nowrap"
                    }}
                >
                    <span>+</span> Create Announcement
                </button>
            </div>

            {/* FEEDBACK BANNER */}
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

            {/* CONTROLS & FILTERS CARD */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "20px 24px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", marginBottom: "24px" }}>
                <div className="announcements-controls-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: "12px", alignItems: "center" }}>
                    {/* Search Input */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                            SEARCH ANNOUNCEMENTS
                        </label>
                        <input
                            type="text"
                            placeholder="🔍 Search title, content, batch..."
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

                    {/* Status Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                            STATUS
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
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
                            <option value="Published">Published</option>
                            <option value="Draft">Draft</option>
                            <option value="Archived">Archived</option>
                        </select>
                    </div>

                    {/* Target Audience Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                            TARGET AUDIENCE
                        </label>
                        <select
                            value={targetFilter}
                            onChange={(e) => setTargetFilter(e.target.value)}
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
                            <option value="All">All Targets</option>
                            <option value="All Students">All Students</option>
                            <option value="Eligible Students">Eligible Students</option>
                            <option value="Selected Batch">Selected Batch</option>
                        </select>
                    </div>

                    {/* Priority Filter */}
                    <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                            PRIORITY
                        </label>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
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
                            <option value="All">All Priorities</option>
                            <option value="Urgent">Urgent</option>
                            <option value="High">High</option>
                            <option value="Normal">Normal</option>
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

            {/* DESKTOP ANNOUNCEMENTS TABLE WITH PRIORITY COLUMN */}
            <div className="announcements-desktop-table" style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", overflow: "hidden" }}>
                <div style={{ padding: "18px 24px", borderBottom: "1px solid #eaedf0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: "800", fontSize: "15px", color: "#0f172a" }}>
                        All Announcements ({filteredAnnouncements.length})
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                        {isLoading ? "Syncing with MongoDB..." : `Showing ${filteredAnnouncements.length} of ${announcements.length} announcements`}
                    </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "950px", whiteSpace: "nowrap" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #eaedf0", color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                <th style={{ padding: "12px 18px", textAlign: "left", width: "35%" }}>Announcement</th>
                                <th style={{ padding: "12px 14px", textAlign: "left" }}>Target Audience</th>
                                <th style={{ padding: "12px 14px", textAlign: "center" }}>Priority</th>
                                <th style={{ padding: "12px 14px", textAlign: "center" }}>Published Date</th>
                                <th style={{ padding: "12px 14px", textAlign: "center" }}>Expiry Date</th>
                                <th style={{ padding: "12px 14px", textAlign: "center" }}>Status</th>
                                <th style={{ padding: "12px 18px", textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAnnouncements.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: "40px", textAlign: "center" }}>
                                        <div style={{ fontSize: "28px", marginBottom: "8px" }}>📢</div>
                                        <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>No announcements found</div>
                                        <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>Try changing your search or filter criteria.</div>
                                        <button onClick={handleResetFilters} style={{ padding: "8px 18px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                                            Reset All Filters
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                filteredAnnouncements.map((item, idx) => {
                                    const statusBadge = getStatusBadge(item.status);
                                    const targetBadge = getTargetBadge(item.targetAudience);
                                    const priorityBadge = getPriorityBadge(item.priority);
                                    return (
                                        <tr key={item.id || item._id} style={{ borderBottom: idx !== filteredAnnouncements.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                                            {/* Title & Preview */}
                                            <td style={{ padding: "16px 18px", textAlign: "left", whiteSpace: "normal" }}>
                                                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                                                    <span style={{ fontSize: "15px", marginTop: "1px" }}>📢</span>
                                                    <div>
                                                        <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "14px", lineHeight: "1.3", marginBottom: "4px" }}>
                                                            {item.title}
                                                        </div>
                                                        <div style={{ color: "#64748b", fontSize: "12px", lineHeight: "1.4", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                            {item.description}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Target Audience & Conditional Batch */}
                                            <td style={{ padding: "16px 14px", textAlign: "left" }}>
                                                <div>
                                                    <span style={{
                                                        backgroundColor: targetBadge.bg,
                                                        color: targetBadge.color,
                                                        border: targetBadge.border,
                                                        padding: "4px 10px",
                                                        borderRadius: "12px",
                                                        fontSize: "11px",
                                                        fontWeight: "700",
                                                        whiteSpace: "nowrap"
                                                    }}>
                                                        {item.targetAudience}
                                                    </span>
                                                    {item.targetBatch && (
                                                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#0f766e", marginTop: "4px" }}>
                                                            🎯 {item.targetBatch}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Priority Badge */}
                                            <td style={{ padding: "16px 14px", textAlign: "center" }}>
                                                <span style={{
                                                    backgroundColor: priorityBadge.bg,
                                                    color: priorityBadge.color,
                                                    border: priorityBadge.border,
                                                    padding: "4px 10px",
                                                    borderRadius: "12px",
                                                    fontSize: "11px",
                                                    fontWeight: "700",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "4px"
                                                }}>
                                                    {priorityBadge.icon} {priorityBadge.label}
                                                </span>
                                            </td>

                                            {/* Published Date */}
                                            <td style={{ padding: "16px 14px", textAlign: "center", color: "#475569", fontSize: "13px", fontWeight: "600" }}>
                                                {formatDisplayDate(item.publishDate || item.publishedDate)}
                                            </td>

                                            {/* Expiry Date */}
                                            <td style={{ padding: "16px 14px", textAlign: "center", color: "#64748b", fontSize: "13px", fontWeight: "600" }}>
                                                {formatDisplayDate(item.expiryDate)}
                                            </td>

                                            {/* Status Badge */}
                                            <td style={{ padding: "16px 14px", textAlign: "center" }}>
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
                                                    width: "115px",
                                                    boxSizing: "border-box",
                                                    gap: "6px"
                                                }}>
                                                    {statusBadge.icon} {statusBadge.label}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td style={{ padding: "16px 18px", textAlign: "right" }}>
                                                <div style={{ display: "inline-flex", gap: "6px" }}>
                                                    <button
                                                        onClick={() => setViewAnnouncement(item)}
                                                        style={{
                                                            padding: "6px 12px",
                                                            backgroundColor: "#0f172a",
                                                            color: "#ffffff",
                                                            border: "none",
                                                            borderRadius: "6px",
                                                            fontSize: "11px",
                                                            fontWeight: "700",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => setEditAnnouncement(item)}
                                                        style={{
                                                            padding: "6px 12px",
                                                            backgroundColor: "#f8fafc",
                                                            color: "#334155",
                                                            border: "1px solid #cbd5e1",
                                                            borderRadius: "6px",
                                                            fontSize: "11px",
                                                            fontWeight: "700",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setItemToDelete(item)}
                                                        style={{
                                                            padding: "6px 10px",
                                                            backgroundColor: "#ffffff",
                                                            color: "#dc2626",
                                                            border: "1px solid #fca5a5",
                                                            borderRadius: "6px",
                                                            fontSize: "11px",
                                                            fontWeight: "700",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        Delete
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

            {/* MOBILE RESPONSIVE CARDS */}
            <div className="announcements-mobile-cards">
                {filteredAnnouncements.length === 0 ? (
                    <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "32px 20px", border: "1px solid #eaedf0", textAlign: "center" }}>
                        <div style={{ fontSize: "28px", marginBottom: "8px" }}>📢</div>
                        <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginBottom: "4px" }}>No announcements found</div>
                        <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>Try changing your search or filter criteria.</div>
                        <button onClick={handleResetFilters} style={{ padding: "8px 18px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                            Reset All Filters
                        </button>
                    </div>
                ) : (
                    filteredAnnouncements.map((item) => {
                        const statusBadge = getStatusBadge(item.status);
                        const targetBadge = getTargetBadge(item.targetAudience);
                        const priorityBadge = getPriorityBadge(item.priority);
                        return (
                            <div key={item.id || item._id} style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "18px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                        <span style={{ backgroundColor: targetBadge.bg, color: targetBadge.color, border: targetBadge.border, padding: "3px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>
                                            {item.targetAudience}
                                        </span>
                                        {item.targetBatch && (
                                            <span style={{ backgroundColor: "#f0fdfa", color: "#0d9488", border: "1px solid #99f6e4", padding: "3px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>
                                                {item.targetBatch}
                                            </span>
                                        )}
                                        <span style={{ backgroundColor: priorityBadge.bg, color: priorityBadge.color, border: priorityBadge.border, padding: "3px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>
                                            {priorityBadge.icon} {priorityBadge.label}
                                        </span>
                                    </div>
                                    <span style={{ backgroundColor: statusBadge.bg, color: statusBadge.color, border: statusBadge.border, padding: "3px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>
                                        {statusBadge.icon} {statusBadge.label}
                                    </span>
                                </div>

                                <h4 style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>
                                    📢 {item.title}
                                </h4>

                                <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
                                    {item.description}
                                </p>

                                <div style={{ fontSize: "11px", color: "#475569", marginBottom: "14px" }}>
                                    📅 Published: {formatDisplayDate(item.publishDate || item.publishedDate)} | Expires: {formatDisplayDate(item.expiryDate)}
                                </div>

                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button onClick={() => setViewAnnouncement(item)} style={{ flex: 1, padding: "8px", backgroundColor: "#0f172a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                                        View
                                    </button>
                                    <button onClick={() => setEditAnnouncement(item)} style={{ flex: 1, padding: "8px", backgroundColor: "#f8fafc", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                                        Edit
                                    </button>
                                    <button onClick={() => setItemToDelete(item)} style={{ padding: "8px 12px", backgroundColor: "#ffffff", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 1. VIEW ANNOUNCEMENT MODAL */}
            {viewAnnouncement && (
                <div
                    onClick={() => setViewAnnouncement(null)}
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
                            maxWidth: "580px",
                            padding: "24px 28px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)"
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                            <div>
                                <span style={{ fontSize: "11px", fontWeight: "800", color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px" }}>ANNOUNCEMENT DETAILS</span>
                                <h3 style={{ margin: "4px 0 0 0", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                                    📢 {viewAnnouncement.title}
                                </h3>
                            </div>
                            <button onClick={() => setViewAnnouncement(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b", fontWeight: "700" }}>✕</button>
                        </div>

                        {/* Badges & Metadata */}
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
                            <span style={{
                                backgroundColor: getTargetBadge(viewAnnouncement.targetAudience).bg,
                                color: getTargetBadge(viewAnnouncement.targetAudience).color,
                                border: getTargetBadge(viewAnnouncement.targetAudience).border,
                                padding: "4px 10px",
                                borderRadius: "10px",
                                fontSize: "11px",
                                fontWeight: "700"
                            }}>
                                Target: {viewAnnouncement.targetAudience}
                                {viewAnnouncement.targetBatch && ` (${viewAnnouncement.targetBatch})`}
                            </span>
                            <span style={{
                                backgroundColor: getPriorityBadge(viewAnnouncement.priority).bg,
                                color: getPriorityBadge(viewAnnouncement.priority).color,
                                border: getPriorityBadge(viewAnnouncement.priority).border,
                                padding: "4px 10px",
                                borderRadius: "10px",
                                fontSize: "11px",
                                fontWeight: "700"
                            }}>
                                {getPriorityBadge(viewAnnouncement.priority).icon} {getPriorityBadge(viewAnnouncement.priority).label} Priority
                            </span>
                            <span style={{
                                backgroundColor: getStatusBadge(viewAnnouncement.status).bg,
                                color: getStatusBadge(viewAnnouncement.status).color,
                                border: getStatusBadge(viewAnnouncement.status).border,
                                padding: "4px 10px",
                                borderRadius: "10px",
                                fontSize: "11px",
                                fontWeight: "700"
                            }}>
                                {getStatusBadge(viewAnnouncement.status).icon} {getStatusBadge(viewAnnouncement.status).label}
                            </span>
                        </div>

                        {/* Description Content */}
                        <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>ANNOUNCEMENT CONTENT</div>
                            <p style={{ margin: 0, fontSize: "14px", color: "#1e293b", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                                {viewAnnouncement.description}
                            </p>
                        </div>

                        {/* Optional Reference Link Button */}
                        {viewAnnouncement.referenceLink && (
                            <div style={{ marginBottom: "16px", backgroundColor: "#eff6ff", padding: "12px 16px", borderRadius: "10px", border: "1px solid #bfdbfe", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ fontSize: "13px", color: "#1e3a8a", fontWeight: "600", wordBreak: "break-all" }}>
                                    🔗 {viewAnnouncement.referenceLink}
                                </div>
                                <a
                                    href={viewAnnouncement.referenceLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        padding: "6px 14px",
                                        backgroundColor: "#2563eb",
                                        color: "#ffffff",
                                        borderRadius: "6px",
                                        fontSize: "12px",
                                        fontWeight: "700",
                                        textDecoration: "none",
                                        whiteSpace: "nowrap"
                                    }}
                                >
                                    Open Link ↗
                                </a>
                            </div>
                        )}

                        {/* Schedule Timestamps */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", backgroundColor: "#ffffff", border: "1px solid #f1f5f9", padding: "12px", borderRadius: "10px", marginBottom: "20px", fontSize: "12px", color: "#475569" }}>
                            <div>
                                📅 <strong>Published:</strong> {formatDisplayDate(viewAnnouncement.publishDate || viewAnnouncement.publishedDate)}
                            </div>
                            <div>
                                ⏳ <strong>Expiry Date:</strong> {formatDisplayDate(viewAnnouncement.expiryDate)}
                            </div>
                            {viewAnnouncement.author && (
                                <div style={{ gridColumn: "1 / -1", color: "#64748b", fontStyle: "italic", borderTop: "1px dashed #e2e8f0", paddingTop: "8px", marginTop: "4px" }}>
                                    Posted By: {viewAnnouncement.author}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button
                                onClick={() => {
                                    const toEdit = viewAnnouncement;
                                    setViewAnnouncement(null);
                                    setEditAnnouncement(toEdit);
                                }}
                                style={{
                                    padding: "9px 16px",
                                    backgroundColor: "#f8fafc",
                                    color: "#334155",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                }}
                            >
                                ✏️ Edit Announcement
                            </button>
                            <button
                                onClick={() => setViewAnnouncement(null)}
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
                                Close Window
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. CREATE ANNOUNCEMENT MODAL WITH OPTIONAL PUBLISH DATE */}
            {showCreateModal && (
                <div
                    onClick={() => setShowCreateModal(false)}
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
                            maxWidth: "600px",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            padding: "24px 28px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)"
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                            <div>
                                <span style={{ fontSize: "11px", fontWeight: "800", color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px" }}>NEW PLACEMENT ANNOUNCEMENT</span>
                                <h3 style={{ margin: "2px 0 0 0", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                                    📢 Create Announcement
                                </h3>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b", fontWeight: "700" }}>✕</button>
                        </div>

                        <form onSubmit={handleCreateSubmit}>
                            {/* Title */}
                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                    ANNOUNCEMENT TITLE *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Amazon SDE-1 Drive Shortlist & Technical Round Schedule"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                                />
                            </div>

                            {/* Target Audience & Conditional Target Batch */}
                            <div style={{ display: "grid", gridTemplateColumns: formData.targetAudience === "Selected Batch" ? "1fr 1fr" : "1fr", gap: "12px", marginBottom: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        TARGET AUDIENCE *
                                    </label>
                                    <select
                                        value={formData.targetAudience}
                                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#ffffff", boxSizing: "border-box" }}
                                    >
                                        <option value="All Students">All Students</option>
                                        <option value="Eligible Students">Eligible Students</option>
                                        <option value="Selected Batch">Selected Batch</option>
                                    </select>
                                </div>

                                {formData.targetAudience === "Selected Batch" && (
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                            SELECT BATCH *
                                        </label>
                                        <select
                                            value={formData.targetBatch}
                                            onChange={(e) => setFormData({ ...formData, targetBatch: e.target.value })}
                                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #0d9488", fontSize: "13px", backgroundColor: "#f0fdfa", color: "#0f766e", fontWeight: "700", boxSizing: "border-box" }}
                                        >
                                            <option value="CSE 2026 - Batch A">CSE 2026 - Batch A</option>
                                            <option value="CSE 2026 - Batch B">CSE 2026 - Batch B</option>
                                            <option value="ISE 2026 - Batch A">ISE 2026 - Batch A</option>
                                            <option value="ECE 2026 - Batch A">ECE 2026 - Batch A</option>
                                            <option value="MECH 2026 - Batch A">MECH 2026 - Batch A</option>
                                            <option value="All 2026 Batches">All 2026 Batches</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Publish Date & Expiry Date */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        PUBLISH / SCHEDULE DATE
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.publishDate}
                                        onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        EXPIRY DATE *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        min={todayYMD}
                                        value={formData.expiryDate}
                                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                                    />
                                </div>
                            </div>

                            {/* Priority & Status */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        PRIORITY
                                    </label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#ffffff", boxSizing: "border-box" }}
                                    >
                                        <option value="Normal">Normal</option>
                                        <option value="High">High</option>
                                        <option value="Urgent">Urgent</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        INITIAL STATUS
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#ffffff", boxSizing: "border-box" }}
                                    >
                                        <option value="Published">Published (Live to Students)</option>
                                        <option value="Draft">Draft (Save for Later)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Reference Link (Optional) */}
                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                    REFERENCE LINK (OPTIONAL)
                                </label>
                                <input
                                    type="url"
                                    placeholder="e.g. https://forms.google.com/registration-link"
                                    value={formData.referenceLink}
                                    onChange={(e) => setFormData({ ...formData, referenceLink: e.target.value })}
                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                                />
                            </div>

                            {/* Content Description */}
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                    ANNOUNCEMENT CONTENT *
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    placeholder="Write detailed announcement instructions, venue locations, dress code, or registration links..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontFamily: "inherit", boxSizing: "border-box" }}
                                />
                            </div>

                            {/* Footer Buttons */}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    style={{ padding: "9px 16px", backgroundColor: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: "9px 20px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(37,99,235,0.25)" }}
                                >
                                    📢 Publish Announcement
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 3. EDIT ANNOUNCEMENT MODAL */}
            {editAnnouncement && (
                <div
                    onClick={() => setEditAnnouncement(null)}
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
                            maxWidth: "600px",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            padding: "24px 28px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)"
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "12px" }}>
                            <div>
                                <span style={{ fontSize: "11px", fontWeight: "800", color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px" }}>EDIT ANNOUNCEMENT</span>
                                <h3 style={{ margin: "2px 0 0 0", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                                    ✏️ Edit Announcement Details
                                </h3>
                            </div>
                            <button onClick={() => setEditAnnouncement(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#64748b", fontWeight: "700" }}>✕</button>
                        </div>

                        <form onSubmit={handleEditSubmit}>
                            {/* Title */}
                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                    ANNOUNCEMENT TITLE *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                                />
                            </div>

                            {/* Target Audience & Conditional Target Batch */}
                            <div style={{ display: "grid", gridTemplateColumns: formData.targetAudience === "Selected Batch" ? "1fr 1fr" : "1fr", gap: "12px", marginBottom: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        TARGET AUDIENCE *
                                    </label>
                                    <select
                                        value={formData.targetAudience}
                                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#ffffff", boxSizing: "border-box" }}
                                    >
                                        <option value="All Students">All Students</option>
                                        <option value="Eligible Students">Eligible Students</option>
                                        <option value="Selected Batch">Selected Batch</option>
                                    </select>
                                </div>

                                {formData.targetAudience === "Selected Batch" && (
                                    <div>
                                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                            SELECT BATCH *
                                        </label>
                                        <select
                                            value={formData.targetBatch}
                                            onChange={(e) => setFormData({ ...formData, targetBatch: e.target.value })}
                                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #0d9488", fontSize: "13px", backgroundColor: "#f0fdfa", color: "#0f766e", fontWeight: "700", boxSizing: "border-box" }}
                                        >
                                            <option value="CSE 2026 - Batch A">CSE 2026 - Batch A</option>
                                            <option value="CSE 2026 - Batch B">CSE 2026 - Batch B</option>
                                            <option value="ISE 2026 - Batch A">ISE 2026 - Batch A</option>
                                            <option value="ECE 2026 - Batch A">ECE 2026 - Batch A</option>
                                            <option value="MECH 2026 - Batch A">MECH 2026 - Batch A</option>
                                            <option value="All 2026 Batches">All 2026 Batches</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Publish Date & Expiry Date */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        PUBLISH / SCHEDULE DATE
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.publishDate}
                                        onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        EXPIRY DATE *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.expiryDate}
                                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                                    />
                                </div>
                            </div>

                            {/* Priority & Status */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        PRIORITY
                                    </label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#ffffff", boxSizing: "border-box" }}
                                    >
                                        <option value="Normal">Normal</option>
                                        <option value="High">High</option>
                                        <option value="Urgent">Urgent</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                        STATUS
                                    </label>
                                    {formData.expiryDate && formData.expiryDate < todayYMD ? (
                                        <div>
                                            <select
                                                disabled
                                                value="Archived"
                                                style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#f1f5f9", color: "#64748b", fontWeight: "700", boxSizing: "border-box" }}
                                            >
                                                <option value="Archived">Archived (Expired)</option>
                                            </select>
                                            <div style={{ fontSize: "11px", color: "#ea580c", marginTop: "4px", fontWeight: "600" }}>
                                                ℹ️ Expiry date passed ({formatDisplayDate(formData.expiryDate)}). Set a future date to reactivate.
                                            </div>
                                        </div>
                                    ) : (
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                            style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#ffffff", boxSizing: "border-box" }}
                                        >
                                            <option value="Published">Published (Live to Students)</option>
                                            <option value="Draft">Draft</option>
                                            <option value="Archived">Archived</option>
                                        </select>
                                    )}
                                </div>
                            </div>

                            {/* Reference Link (Optional) */}
                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                    REFERENCE LINK (OPTIONAL)
                                </label>
                                <input
                                    type="url"
                                    placeholder="e.g. https://forms.google.com/registration-link"
                                    value={formData.referenceLink}
                                    onChange={(e) => setFormData({ ...formData, referenceLink: e.target.value })}
                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
                                />
                            </div>

                            {/* Content Description */}
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                    ANNOUNCEMENT CONTENT *
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", fontFamily: "inherit", boxSizing: "border-box" }}
                                />
                            </div>

                            {/* Footer Buttons */}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    type="button"
                                    onClick={() => setEditAnnouncement(null)}
                                    style={{ padding: "9px 16px", backgroundColor: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: "9px 20px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(37,99,235,0.25)" }}
                                >
                                    💾 Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 4. DELETE CONFIRMATION MODAL */}
            {itemToDelete && (
                <div
                    onClick={() => setItemToDelete(null)}
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
                            border: "1px solid #fecaca"
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                            <span style={{ fontSize: "22px" }}>⚠️</span>
                            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#991b1b" }}>
                                Delete Announcement?
                            </h3>
                        </div>

                        <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>
                            Are you sure you want to permanently delete <strong>"{itemToDelete.title}"</strong>?
                        </p>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button
                                onClick={() => setItemToDelete(null)}
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
                                onClick={handleConfirmDelete}
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
                                Delete Announcement
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoordinatorAnnouncements;
