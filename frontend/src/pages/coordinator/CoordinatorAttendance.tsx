import React, { useState, useEffect, useCallback } from "react";
import { API_BASE_URL as BASE_URL } from "../../config/api";

export interface StudentAttendanceRow {
    registerNo: string;
    studentName: string;
    department: string;
    attendance: "Present" | "Absent" | "Not Marked";
}

export interface CoordinatorAttendanceProps {
    user?: any;
    onBackToDashboard?: () => void;
}

const API_BASE_URL = `${BASE_URL}/api/coordinator`;

export const CoordinatorAttendance: React.FC<CoordinatorAttendanceProps> = ({
    onBackToDashboard
}) => {
    // Campus Events Options
    const [eventsList, setEventsList] = useState<Array<{ id: string; name: string; date: string }>>(() => {
        try {
            const saved = localStorage.getItem("cpms_coordinator_events");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.map((e: any) => ({
                        id: e.id || `evt_${Date.now()}`,
                        name: e.name || "Placement Event",
                        date: e.date || "Upcoming"
                    }));
                }
            }
        } catch (e) {}
        return [];
    });

    const [selectedEventId, setSelectedEventId] = useState<string>(() => {
        return eventsList.length > 0 ? eventsList[0].id : "";
    });
    const selectedEvent = eventsList.find(e => e.id === selectedEventId) || eventsList[0];

    // Clean Attendance Data loaded exclusively from live database
    const defaultData: Record<string, StudentAttendanceRow[]> = {};

    // Attendance State per Event
    const [attendanceData, setAttendanceData] = useState<Record<string, StudentAttendanceRow[]>>(() => {
        try {
            const saved = localStorage.getItem("cpms_coordinator_attendance_exact");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === "object") return parsed;
            }
        } catch (e) {}
        return defaultData;
    });

    // Verification Map per Event
    const [verifiedMap, setVerifiedMap] = useState<Record<string, boolean>>(() => {
        try {
            const saved = localStorage.getItem("cpms_coordinator_verified_map");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === "object") return parsed;
            }
        } catch (e) {}
        return {};
    });

    const isVerified = Boolean(selectedEventId && verifiedMap[selectedEventId]);

    const [loading, setLoading] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

    // Fetch Events List
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const saved = localStorage.getItem("cpms_coordinator_events");
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        const mapped = parsed.map((e: any) => ({
                            id: e.id || `evt_${Date.now()}`,
                            name: e.name || "Placement Event",
                            date: e.date || "Upcoming"
                        }));
                        setEventsList(mapped);
                        if (!selectedEventId) setSelectedEventId(mapped[0].id);
                        return;
                    }
                }
                const res = await fetch(`${API_BASE_URL}/events`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.events && Array.isArray(data.events) && data.events.length > 0) {
                        setEventsList(data.events);
                        if (!selectedEventId) setSelectedEventId(data.events[0].id);
                    } else {
                        setEventsList([]);
                    }
                }
            } catch (e) {}
        };
        fetchEvents();
    }, [selectedEventId]);

    // Fetch Attendance Records & Verification status from API
    const fetchAttendanceForEvent = useCallback(async (eventId: string) => {
        if (!eventId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/events/${eventId}/attendance`);
            if (res.ok) {
                const data = await res.json();
                if (data.attendance && Array.isArray(data.attendance)) {
                    setAttendanceData(prev => {
                        const updated = { ...prev, [eventId]: data.attendance };
                        try {
                            localStorage.setItem("cpms_coordinator_attendance_exact", JSON.stringify(updated));
                        } catch (e) {}
                        return updated;
                    });
                }
                if (typeof data.isVerified === "boolean") {
                    setVerifiedMap(prev => {
                        const updated = { ...prev, [eventId]: data.isVerified };
                        try {
                            localStorage.setItem("cpms_coordinator_verified_map", JSON.stringify(updated));
                        } catch (e) {}
                        return updated;
                    });
                }
            }
        } catch (err) {
            console.warn("Backend fetch failed, relying on local state:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAttendanceForEvent(selectedEventId);
    }, [selectedEventId, fetchAttendanceForEvent]);

    // ESC Key Navigation Handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" || e.code === "Escape") {
                if (onBackToDashboard) onBackToDashboard();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onBackToDashboard]);

    const students = attendanceData[selectedEventId] || defaultData[selectedEventId] || [];

    // Functional Status Toggle
    const handleAttendanceChange = (registerNo: string, newStatus: "Present" | "Absent" | "Not Marked") => {
        const updatedList = students.map(s => s.registerNo === registerNo ? { ...s, attendance: newStatus } : s);
        const updatedMap = { ...attendanceData, [selectedEventId]: updatedList };
        setAttendanceData(updatedMap);
    };

    // Save Attendance (Frontend + Backend)
    const handleSave = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE_URL}/events/${selectedEventId}/attendance`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    attendanceRecords: students,
                    markedBy: "Prof. Rajesh Sharma (Coordinator)",
                    isVerified
                })
            });

            if (res.ok) {
                const resData = await res.json();
                if (resData.attendance) {
                    setAttendanceData(prev => ({ ...prev, [selectedEventId]: resData.attendance }));
                }
            }
        } catch (err) {
            console.warn("Backend save warning:", err);
        } finally {
            try {
                localStorage.setItem("cpms_coordinator_attendance_exact", JSON.stringify(attendanceData));
            } catch (e) {}
            setLoading(false);
            setSaveFeedback(`✅ Attendance for "${selectedEvent.name}" saved successfully!`);
            setTimeout(() => setSaveFeedback(null), 3500);
        }
    };

    // Verify Attendance Action
    const handleVerifyAttendance = async () => {
        try {
            setLoading(true);
            const updatedVerifiedMap = { ...verifiedMap, [selectedEventId]: true };
            setVerifiedMap(updatedVerifiedMap);
            try {
                localStorage.setItem("cpms_coordinator_verified_map", JSON.stringify(updatedVerifiedMap));
            } catch (e) {}

            const token = localStorage.getItem("token");
            await fetch(`${API_BASE_URL}/events/${selectedEventId}/attendance`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    attendanceRecords: students,
                    markedBy: "Prof. Rajesh Sharma (Coordinator)",
                    isVerified: true
                })
            });
        } catch (err) {
            console.warn("Backend verify warning:", err);
        } finally {
            setLoading(false);
            setSaveFeedback(`🟢 Attendance Verified & Logged for "${selectedEvent.name}"!`);
            setTimeout(() => setSaveFeedback(null), 3500);
        }
    };

    // Filter Logic
    const filteredStudents = students.filter(s =>
        s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.registerNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Live Metrics
    const totalStudents = students.length;
    const presentStudents = students.filter(s => s.attendance === "Present").length;
    const absentStudents = students.filter(s => s.attendance === "Absent").length;
    const notMarkedStudents = students.filter(s => s.attendance === "Not Marked").length;

    return (
        <div style={{ maxWidth: "1100px", margin: "0 auto", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}>
            <style>{`
                @media (max-width: 768px) {
                    .controls-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>

            {/* PAGE HEADER & VERIFICATION STATUS BADGE */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                    <h2 style={{ margin: "0 0 4px 0", fontSize: "24px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.4px" }}>
                        Attendance
                    </h2>
                    <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                        Track and manage student attendance for placement events.
                    </p>
                </div>

                {/* Attendance Verification Status Badge */}
                <div style={{
                    padding: "8px 16px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "800",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: isVerified ? "#f0fdf4" : "#fff7ed",
                    color: isVerified ? "#16a34a" : "#ea580c",
                    border: isVerified ? "1px solid #bbf7d0" : "1px solid #fed7aa"
                }}>
                    <span>{isVerified ? "🟢 Verified & Logged" : "🟠 Not Verified"}</span>
                </div>
            </div>

            {/* FEEDBACK ALERT */}
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

            {/* TOP CONTROLS CARD */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "20px 24px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", marginBottom: "24px" }}>
                <div className="controls-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr", gap: "16px", alignItems: "center" }}>
                    {/* Select Event */}
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                            Select Event
                        </label>
                        <select
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "14px",
                                fontWeight: "600",
                                backgroundColor: "#ffffff",
                                color: "#0f172a",
                                outline: "none",
                                boxSizing: "border-box"
                            }}
                        >
                            {eventsList.length === 0 ? (
                                <option value="">No events scheduled</option>
                            ) : (
                                eventsList.map(e => (
                                    <option key={e.id} value={e.id}>{e.name} ▼</option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Date */}
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                            Date
                        </label>
                        <div style={{
                            padding: "10px 14px",
                            backgroundColor: "#f8fafc",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#334155"
                        }}>
                            {selectedEvent ? selectedEvent.date : "—"}
                        </div>
                    </div>

                    {/* Search Student */}
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                            Search Student
                        </label>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 14px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "14px",
                                color: "#0f172a",
                                outline: "none",
                                boxSizing: "border-box"
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* ATTENDANCE SUMMARY CARDS */}
            <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                        Attendance Summary
                    </h3>
                    {loading && <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: "700" }}>⌛ Syncing with MongoDB...</span>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                    <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "18px 20px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", textAlign: "center" }}>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#64748b", marginBottom: "6px" }}>Total Students</div>
                        <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a" }}>{totalStudents}</div>
                    </div>

                    <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "18px 20px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", textAlign: "center" }}>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#16a34a", marginBottom: "6px" }}>Present</div>
                        <div style={{ fontSize: "28px", fontWeight: "800", color: "#16a34a" }}>{presentStudents}</div>
                    </div>

                    <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "18px 20px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", textAlign: "center" }}>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#dc2626", marginBottom: "6px" }}>Absent</div>
                        <div style={{ fontSize: "28px", fontWeight: "800", color: "#dc2626" }}>{absentStudents}</div>
                    </div>

                    <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "18px 20px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", textAlign: "center" }}>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#d97706", marginBottom: "6px" }}>Not Marked</div>
                        <div style={{ fontSize: "28px", fontWeight: "800", color: "#d97706" }}>{notMarkedStudents}</div>
                    </div>
                </div>
            </div>

            {/* STUDENT ATTENDANCE TABLE */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #eaedf0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", overflow: "hidden", marginBottom: "28px" }}>
                <div style={{ padding: "18px 24px", borderBottom: "1px solid #eaedf0", fontWeight: "800", fontSize: "16px", color: "#0f172a" }}>
                    Student Attendance
                </div>

                <div className="responsive-table-wrapper" style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", minWidth: "600px", borderCollapse: "collapse", textAlign: "left", whiteSpace: "nowrap" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #eaedf0", color: "#64748b", fontSize: "12px", fontWeight: "700" }}>
                                <th style={{ padding: "14px 20px" }}>Register</th>
                                <th style={{ padding: "14px 20px" }}>Student Name</th>
                                <th style={{ padding: "14px 20px" }}>Department</th>
                                <th style={{ padding: "14px 20px" }}>Attendance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: "36px 20px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                                        {eventsList.length === 0 ? "No campus events scheduled yet. Create an event in Events tab to record attendance." : "No student attendance records found for this event."}
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((st, idx) => (
                                    <tr key={st.registerNo} style={{ borderBottom: idx !== filteredStudents.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                                        <td style={{ padding: "14px 20px", fontWeight: "700", color: "#334155", fontSize: "14px" }}>
                                            {st.registerNo}
                                        </td>
                                        <td style={{ padding: "14px 20px", fontWeight: "800", color: "#0f172a", fontSize: "14px" }}>
                                            {st.studentName}
                                        </td>
                                        <td style={{ padding: "14px 20px", color: "#475569", fontSize: "14px", fontWeight: "600" }}>
                                            {st.department}
                                        </td>
                                        <td style={{ padding: "14px 20px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                                <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "700", color: st.attendance === "Present" ? "#16a34a" : "#475569" }}>
                                                    <input
                                                        type="radio"
                                                        name={`att_${st.registerNo}`}
                                                        checked={st.attendance === "Present"}
                                                        onChange={() => handleAttendanceChange(st.registerNo, "Present")}
                                                        style={{ accentColor: "#16a34a", width: "16px", height: "16px", cursor: "pointer" }}
                                                    />
                                                    ● Present
                                                </label>

                                                <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "700", color: st.attendance === "Absent" ? "#dc2626" : "#475569" }}>
                                                    <input
                                                        type="radio"
                                                        name={`att_${st.registerNo}`}
                                                        checked={st.attendance === "Absent"}
                                                        onChange={() => handleAttendanceChange(st.registerNo, "Absent")}
                                                        style={{ accentColor: "#dc2626", width: "16px", height: "16px", cursor: "pointer" }}
                                                    />
                                                    ○ Absent
                                                </label>

                                                <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "700", color: st.attendance === "Not Marked" ? "#d97706" : "#94a3b8" }}>
                                                    <input
                                                        type="radio"
                                                        name={`att_${st.registerNo}`}
                                                        checked={st.attendance === "Not Marked"}
                                                        onChange={() => handleAttendanceChange(st.registerNo, "Not Marked")}
                                                        style={{ accentColor: "#d97706", width: "16px", height: "16px", cursor: "pointer" }}
                                                    />
                                                    Not Marked
                                                </label>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* BOTTOM ACTION BUTTONS: SAVE ATTENDANCE & VERIFY ATTENDANCE */}
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "40px" }}>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    style={{
                        padding: "12px 28px",
                        backgroundColor: loading ? "#94a3b8" : "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "10px",
                        fontWeight: "800",
                        fontSize: "14px",
                        cursor: loading ? "not-allowed" : "pointer",
                        boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
                        transition: "all 0.15s ease"
                    }}
                >
                    {loading ? "⌛ Saving..." : "[ Save Attendance ]"}
                </button>

                <button
                    onClick={handleVerifyAttendance}
                    disabled={loading || isVerified}
                    style={{
                        padding: "12px 28px",
                        backgroundColor: isVerified ? "#f0fdf4" : "#16a34a",
                        color: isVerified ? "#16a34a" : "#ffffff",
                        border: isVerified ? "1px solid #bbf7d0" : "none",
                        borderRadius: "10px",
                        fontWeight: "800",
                        fontSize: "14px",
                        cursor: (loading || isVerified) ? "default" : "pointer",
                        boxShadow: isVerified ? "none" : "0 4px 6px -1px rgba(22, 163, 74, 0.2)",
                        transition: "all 0.15s ease"
                    }}
                >
                    {isVerified ? "✓ Verified & Logged" : "[ Verify Attendance ]"}
                </button>
            </div>
        </div>
    );
};

export default CoordinatorAttendance;
