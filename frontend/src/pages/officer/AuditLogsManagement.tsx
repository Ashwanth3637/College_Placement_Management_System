import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";

export interface AuditLogItem {
  _id?: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

const AuditLogsManagement: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterEntity, setFilterEntity] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = `${API_BASE_URL}/api/admin/audit-logs?entityType=${filterEntity !== "ALL" ? filterEntity : ""}&action=${searchTerm}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.logs) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error("Failed to fetch audit logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterEntity]);

  const handleExportCSV = () => {
    if (!logs.length) return;
    const headers = ["Timestamp", "Actor Name", "Role", "Action", "Entity Type", "IP Address", "Details"];
    const rows = logs.map((l) => [
      new Date(l.createdAt).toLocaleString(),
      `"${l.actorName || "System"}"`,
      `"${l.actorRole || "admin"}"`,
      `"${l.action}"`,
      `"${l.entityType}"`,
      `"${l.ipAddress || "127.0.0.1"}"`,
      `"${(l.details || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Audit_Logs_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEntityBadge = (type: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      USER: { bg: "#E6EEFC", text: "#1E5FCC" },
      STUDENT: { bg: "#DCFCE7", text: "#15803D" },
      COMPANY: { bg: "#CCFBF1", text: "#0F766E" },
      DRIVE: { bg: "#FEF3C7", text: "#B45309" },
      APPLICATION: { bg: "#F3E8FF", text: "#7E22CE" },
      SEASON: { bg: "#FEE2E2", text: "#B91C1C" },
      SYSTEM: { bg: "#F1F5F9", text: "#475569" },
    };
    const c = colors[type] || { bg: "#F1F5F9", text: "#475569" };
    return (
      <span style={{ padding: "3px 8px", borderRadius: "4px", backgroundColor: c.bg, color: c.text, fontWeight: 700, fontSize: "11px", fontFamily: "JetBrains Mono, monospace" }}>
        {type}
      </span>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0F172A" }}>
            Compliance Audit Trail & Security Logs
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "13.5px", color: "#64748B" }}>
            Immutable ledger tracking administrative actions, status overrides, and user activities.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={fetchLogs}
            style={{
              padding: "8px 14px",
              borderRadius: "6px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #CBD5E1",
              color: "#334155",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span></span> Refresh
          </button>
          <button
            onClick={handleExportCSV}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              backgroundColor: "#0F766E", // Teal
              border: "none",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span></span> Export CSV Log
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", backgroundColor: "#FFFFFF", padding: "14px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            type="text"
            placeholder="Search by action keyword (e.g. ACTIVATE, VERIFY, CREATE)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13.5px" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#64748B" }}>Entity:</span>
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", cursor: "pointer" }}
          >
            <option value="ALL">All Entities</option>
            <option value="USER">User / Auth</option>
            <option value="STUDENT">Student Records</option>
            <option value="COMPANY">Company Profile</option>
            <option value="DRIVE">Placement Drive</option>
            <option value="APPLICATION">Applications</option>
            <option value="SEASON">Seasons</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>Fetching audit ledger...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#94A3B8" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>️</div>
            <div style={{ fontWeight: 600, color: "#475569" }}>No audit log entries matching filter</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Timestamp</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Actor</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Action</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Entity</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>IP Address</th>
                  <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id || Math.random().toString()} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "12px 16px", fontSize: "12.5px", color: "#64748B", whiteSpace: "nowrap", fontFamily: "JetBrains Mono, monospace" }}>
                      {new Date(log.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#0F172A" }}>{log.actorName || "System Admin"}</div>
                      <div style={{ fontSize: "11px", color: "#64748B", textTransform: "capitalize" }}>{log.actorRole || "admin"}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#0B3D91", fontFamily: "JetBrains Mono, monospace" }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {getEntityBadge(log.entityType)}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "#64748B", fontFamily: "JetBrains Mono, monospace" }}>
                      {log.ipAddress || "127.0.0.1"}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", color: "#334155", maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsManagement;
