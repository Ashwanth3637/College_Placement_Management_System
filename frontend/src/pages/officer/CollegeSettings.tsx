import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";

interface CollegeSettingsProps {
  user: any;
}

const CollegeSettings: React.FC<CollegeSettingsProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [college, setCollege] = useState<any>(null);
  const [domains, setDomains] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [newDept, setNewDept] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const userId = user?.id || user?._id || "";
  const userEmail = user?.email || "";

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/officer/college-settings?userId=${userId}&email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.college) {
          setCollege(data.college);
          setDomains(data.college.allowedEmailDomains || []);
          setDepartments(data.college.departments || []);
        }
      }
    } catch (e) {
      console.error("Failed to fetch college settings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/officer/college-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email: userEmail, allowedEmailDomains: domains, departments }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg("College settings saved successfully!");
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(data.message || "Failed to save settings.");
      }
    } catch (e: any) {
      setErrorMsg("Error saving settings: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const addDomain = () => {
    let d = newDomain.trim().toLowerCase();
    if (!d) return;
    if (!d.startsWith("@")) d = "@" + d;
    if (!domains.includes(d)) {
      setDomains([...domains, d]);
    }
    setNewDomain("");
  };

  const removeDomain = (idx: number) => {
    setDomains(domains.filter((_, i) => i !== idx));
  };

  const addDept = () => {
    const d = newDept.trim();
    if (!d) return;
    if (!departments.includes(d)) {
      setDepartments([...departments, d]);
    }
    setNewDept("");
  };

  const removeDept = (idx: number) => {
    setDepartments(departments.filter((_, i) => i !== idx));
  };

  const commonDepts = [
    "Computer Science & Engineering", "Information Technology", "Electronics & Communication",
    "Electrical & Electronics", "Mechanical Engineering", "Civil Engineering",
    "Chemical Engineering", "Biomedical Engineering", "Artificial Intelligence & Data Science",
    "Cyber Security", "MBA", "MCA"
  ];

  const chipStyle: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500,
    background: "#EEF2FF", color: "#4338CA", border: "1px solid #C7D2FE",
    transition: "all 0.2s",
  };
  const removeBtn: React.CSSProperties = {
    background: "none", border: "none", cursor: "pointer", color: "#6366F1",
    fontSize: 16, fontWeight: 700, lineHeight: 1, padding: 0, marginLeft: 4,
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400, color: "#64748B" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: "spin 1s linear infinite" }}>⚙️</div>
          <p style={{ fontSize: 14 }}>Loading college settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1E293B", margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          College Settings
        </h2>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 6 }}>
          Configure which students can register and which departments are available.
          {college && <span style={{ fontWeight: 600, color: "#4338CA" }}> — {college.name}</span>}
        </p>
      </div>

      {/* Success / Error Messages */}
      {successMsg && (
        <div style={{ padding: "12px 18px", borderRadius: 10, background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46", fontSize: 13, fontWeight: 600, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: "12px 18px", borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B", fontSize: 13, fontWeight: 600, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
          {errorMsg}
        </div>
      )}

      {!college && (
        <div style={{ padding: "40px", textAlign: "center", background: "#F8FAFC", borderRadius: 12, border: "1px dashed #CBD5E1" }}>
          <h3 style={{ fontSize: 16, color: "#475569", fontWeight: 600, margin: "0 0 8px" }}>No College Linked</h3>
          <p style={{ fontSize: 13, color: "#94A3B8" }}>Your account is not linked to a college yet. Contact the Super Admin to link your account.</p>
        </div>
      )}

      {college && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* College Info Card */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E2E8F0", padding: "22px 26px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", margin: 0 }}>{college.name}</h3>
                <p style={{ fontSize: 12, color: "#94A3B8", margin: "4px 0 0" }}>Code: {college.code} • Plan: {college.currentPlan}</p>
              </div>
              <span style={{ padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: college.status === "Active" ? "#ECFDF5" : "#FEF2F2", color: college.status === "Active" ? "#065F46" : "#991B1B" }}>
                {college.status}
              </span>
            </div>
          </div>

          {/* Allowed Email Domains */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E2E8F0", padding: "22px 26px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 8 }}>
              Allowed Email Domains
            </h3>
            <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 16px" }}>
              Only students with email addresses ending in these domains can sign up to the portal.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {domains.map((d, i) => (
                <span key={i} style={chipStyle}>
                  {d}
                  <button style={removeBtn} onClick={() => removeDomain(i)} title="Remove">×</button>
                </span>
              ))}
              {domains.length === 0 && (
                <span style={{ fontSize: 13, color: "#94A3B8", fontStyle: "italic" }}>No domains configured yet. Add at least one.</span>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                value={newDomain}
                onChange={e => setNewDomain(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addDomain()}
                placeholder="e.g. @kongu.edu"
                style={{ flex: "1 1 200px", padding: "9px 14px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, outline: "none", minWidth: 180 }}
              />
              <button
                onClick={addDomain}
                style={{ padding: "9px 20px", borderRadius: 8, background: "#4F46E5", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                + Add Domain
              </button>
            </div>
          </div>

          {/* Departments */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E2E8F0", padding: "22px 26px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", margin: "0 0 6px", display: "flex", alignItems: "center", gap: 8 }}>
              Departments
            </h3>
            <p style={{ fontSize: 12, color: "#64748B", margin: "0 0 16px" }}>
              Departments available in your college. Students will select from these during registration.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {departments.map((d, i) => (
                <span key={i} style={{ ...chipStyle, background: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0" }}>
                  {d}
                  <button style={{ ...removeBtn, color: "#16A34A" }} onClick={() => removeDept(i)} title="Remove">×</button>
                </span>
              ))}
              {departments.length === 0 && (
                <span style={{ fontSize: 13, color: "#94A3B8", fontStyle: "italic" }}>No departments added yet.</span>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <input
                value={newDept}
                onChange={e => setNewDept(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addDept()}
                placeholder="e.g. Mechanical Engineering"
                style={{ flex: "1 1 200px", padding: "9px 14px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13, outline: "none", minWidth: 180 }}
              />
              <button
                onClick={addDept}
                style={{ padding: "9px 20px", borderRadius: 8, background: "#059669", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                + Add Dept
              </button>
            </div>

            {/* Quick-add common departments */}
            <div>
              <p style={{ fontSize: 11, color: "#94A3B8", margin: "0 0 8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Quick Add:</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {commonDepts.filter(d => !departments.includes(d)).map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setDepartments([...departments, d])}
                    style={{ padding: "5px 12px", borderRadius: 16, border: "1px dashed #CBD5E1", background: "#F8FAFC", color: "#475569", fontSize: 11, cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.background = "#EEF2FF"; (e.target as HTMLElement).style.borderColor = "#818CF8"; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.background = "#F8FAFC"; (e.target as HTMLElement).style.borderColor = "#CBD5E1"; }}
                  >
                    + {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button
              onClick={fetchSettings}
              style={{ padding: "11px 24px", borderRadius: 10, border: "1px solid #CBD5E1", background: "#fff", color: "#475569", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "11px 32px", borderRadius: 10, border: "none",
                background: saving ? "#94A3B8" : "linear-gradient(135deg, #4F46E5, #7C3AED)",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(79, 70, 229, 0.3)", transition: "all 0.2s",
              }}
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeSettings;
