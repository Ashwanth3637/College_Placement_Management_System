import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";

export interface PlacementSeason {
    _id?: string;
    name: string;
    code: string;
    startDate: string;
    endDate?: string;
    status: "upcoming" | "active" | "frozen" | "archived";
    description?: string;
    rulesConfig?: {
        maxOffersPerStudent: number;
        dreamTierMinCtc: number;
        allowMultipleOffers: boolean;
        requireCgpaVerification: boolean;
    };
}

const SeasonManagement: React.FC = () => {
    const [seasons, setSeasons] = useState<PlacementSeason[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [status, setStatus] = useState<"upcoming" | "active" | "frozen" | "archived">("active");
    const [description, setDescription] = useState("");
    const [maxOffers, setMaxOffers] = useState(2);
    const [dreamCtc, setDreamCtc] = useState(12.0);

    const fetchSeasons = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/seasons`);
            const data = await res.json();
            if (data.success && data.seasons) {
                setSeasons(data.seasons);
            }
        } catch (e) {
            console.error("Failed to fetch seasons:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSeasons();
    }, []);

    const handleCreateSeason = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name,
                code,
                status,
                description,
                rulesConfig: {
                    maxOffersPerStudent: maxOffers,
                    dreamTierMinCtc: dreamCtc,
                    allowMultipleOffers: true,
                    requireCgpaVerification: true,
                },
            };

            const res = await fetch(`${API_BASE_URL}/api/admin/seasons`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                fetchSeasons();
                setShowCreateModal(false);
                setName("");
                setCode("");
                setDescription("");
            }
        } catch (e) {
            console.error("Failed to create season:", e);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/seasons/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) fetchSeasons();
        } catch (e) {
            console.error("Failed to update season status:", e);
        }
    };

    const getStatusBadge = (s: string) => {
        switch (s) {
            case "active":
                return <span style={{ padding: "4px 10px", borderRadius: "12px", backgroundColor: "#DCFCE7", color: "#15803D", fontWeight: 700, fontSize: "12px" }}>● ACTIVE</span>;
            case "upcoming":
                return <span style={{ padding: "4px 10px", borderRadius: "12px", backgroundColor: "#E6EEFC", color: "#1E5FCC", fontWeight: 700, fontSize: "12px" }}>UPCOMING</span>;
            case "frozen":
                return <span style={{ padding: "4px 10px", borderRadius: "12px", backgroundColor: "#FEF3C7", color: "#B45309", fontWeight: 700, fontSize: "12px" }}>❄️ FROZEN</span>;
            case "archived":
                return <span style={{ padding: "4px 10px", borderRadius: "12px", backgroundColor: "#F3F4F6", color: "#64748B", fontWeight: 700, fontSize: "12px" }}>ARCHIVED</span>;
            default:
                return <span>{s}</span>;
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Action Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0F172A" }}>
                        Placement Season Lifecycle Management
                    </h2>
                    <p style={{ margin: "4px 0 0", fontSize: "13.5px", color: "#64748B" }}>
                        Control active cycles, rules isolation, and academic rollover configurations.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                        padding: "10px 18px",
                        borderRadius: "8px",
                        backgroundColor: "#0B3D91",
                        color: "#FFFFFF",
                        border: "none",
                        fontWeight: 700,
                        fontSize: "13.5px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                >
                    <span>+</span>
                    <span>New Placement Season</span>
                </button>
            </div>

            {/* Seasons Grid */}
            {loading ? (
                <div style={{ padding: "32px", textAlign: "center", color: "#64748B" }}>Loading placement seasons...</div>
            ) : seasons.length === 0 ? (
                <div style={{ padding: "48px", textAlign: "center", backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: "36px", marginBottom: "8px" }}>📅</div>
                    <div style={{ fontWeight: 700, color: "#1E293B" }}>No placement seasons created yet</div>
                    <p style={{ color: "#64748B", fontSize: "13px" }}>Initialize your first placement season cycle using the button above.</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "16px" }}>
                    {seasons.map((season) => (
                        <div
                            key={season._id || season.code}
                            style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: "12px",
                                border: "1px solid #E2E8F0",
                                padding: "20px",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                gap: "16px",
                            }}
                        >
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>
                                            {season.name}
                                        </h3>
                                        <span style={{ fontSize: "12px", fontFamily: "JetBrains Mono, monospace", color: "#64748B" }}>
                                            {season.code}
                                        </span>
                                    </div>
                                    {getStatusBadge(season.status)}
                                </div>

                                <p style={{ fontSize: "13px", color: "#475569", margin: "8px 0 12px", lineHeight: 1.4 }}>
                                    {season.description || "Academic recruitment cycle."}
                                </p>

                                <div style={{ padding: "10px 12px", backgroundColor: "#F8FAFC", borderRadius: "8px", fontSize: "12px", color: "#334155" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                        <span>Max Offers Allowed:</span>
                                        <strong>{season.rulesConfig?.maxOffersPerStudent || 2} Offers</strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Dream Tier Min CTC:</span>
                                        <strong>₹{season.rulesConfig?.dreamTierMinCtc || 12.0} LPA</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Lifecycle Action Buttons */}
                            <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #F1F5F9", paddingTop: "12px" }}>
                                {season.status !== "active" && (
                                    <button
                                        onClick={() => handleStatusChange(season._id!, "active")}
                                        style={{ flex: 1, padding: "7px 10px", borderRadius: "6px", border: "1px solid #15803D", backgroundColor: "#DCFCE7", color: "#15803D", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                                    >
                                        Set Active
                                    </button>
                                )}
                                {season.status === "active" && (
                                    <button
                                        onClick={() => handleStatusChange(season._id!, "frozen")}
                                        style={{ flex: 1, padding: "7px 10px", borderRadius: "6px", border: "1px solid #B45309", backgroundColor: "#FEF3C7", color: "#B45309", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                                    >
                                        Freeze Season
                                    </button>
                                )}
                                {season.status !== "archived" && (
                                    <button
                                        onClick={() => handleStatusChange(season._id!, "archived")}
                                        style={{ padding: "7px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", backgroundColor: "#FFFFFF", color: "#64748B", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                                    >
                                        Archive
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Season Modal */}
            {showCreateModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(15, 23, 42, 0.6)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        padding: "16px",
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            maxWidth: "480px",
                            backgroundColor: "#FFFFFF",
                            borderRadius: "14px",
                            padding: "24px",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                        }}
                    >
                        <h3 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: 800, color: "#0F172A" }}>
                            Create Placement Season
                        </h3>
                        <form onSubmit={handleCreateSeason} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                                    Season Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Placement Season 2026-2027"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13.5px" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                                    Season Identifier Code
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. SEASON-2026-27"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    required
                                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13.5px", textTransform: "uppercase" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                                    Initial Status
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as any)}
                                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13.5px" }}
                                >
                                    <option value="active">Active</option>
                                    <option value="upcoming">Upcoming</option>
                                    <option value="frozen">Frozen</option>
                                </select>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                                        Max Offers / Student
                                    </label>
                                    <input
                                        type="number"
                                        value={maxOffers}
                                        onChange={(e) => setMaxOffers(Number(e.target.value))}
                                        min={1}
                                        max={5}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px" }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                                        Dream Tier CTC (LPA)
                                    </label>
                                    <input
                                        type="number"
                                        value={dreamCtc}
                                        onChange={(e) => setDreamCtc(Number(e.target.value))}
                                        step="0.5"
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px" }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                                    Description & Scope
                                </label>
                                <textarea
                                    placeholder="Scope details for graduating batches..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", resize: "none" }}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #CBD5E1", backgroundColor: "#FFFFFF", color: "#475569", fontWeight: 600, cursor: "pointer" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: "8px 16px", borderRadius: "6px", border: "none", backgroundColor: "#0B3D91", color: "#FFFFFF", fontWeight: 700, cursor: "pointer" }}
                                >
                                    Create Season
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeasonManagement;
