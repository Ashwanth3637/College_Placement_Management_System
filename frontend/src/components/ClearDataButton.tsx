import React, { useState } from "react";
import { API_BASE_URL } from "../config/api";

interface ClearDataButtonProps {
  variant?: "header" | "compact" | "banner";
  onSuccess?: () => void;
}

export const ClearDataButton: React.FC<ClearDataButtonProps> = () => {
  return null;
};

export const LegacyClearDataButton: React.FC<ClearDataButtonProps> = ({ variant = "header", onSuccess }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const executeClear = async () => {
    setIsClearing(true);
    try {
      // 1. Call Backend to purge DB records (drives, applications, interviews, selections, student profiles, etc.)
      try {
        const res = await fetch(`${API_BASE_URL}/api/system/clear-all-data`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        if (!res.ok) {
          await fetch(`${API_BASE_URL}/api/system/clear-all-data`, { method: "GET" });
        }
      } catch (err) {
        console.warn("Backend clear endpoint call:", err);
      }

      // 2. Clear browser storage while preserving user authentication and current active tab
      const savedUser = localStorage.getItem("user");
      const savedToken = localStorage.getItem("token");
      const savedRole = localStorage.getItem("role") || localStorage.getItem("user_role");
      const savedEmail = localStorage.getItem("email");

      // Save all active tab states across officer, recruiter, coordinator, student
      const activeTabEntries: [string, string][] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("cpms_active_tab_") || key.startsWith("active_tab_") || key.includes("activeTab"))) {
          const val = localStorage.getItem(key);
          if (val) activeTabEntries.push([key, val]);
        }
      }

      localStorage.clear();
      sessionStorage.clear();

      if (savedUser) localStorage.setItem("user", savedUser);
      if (savedToken) localStorage.setItem("token", savedToken);
      if (savedRole) {
        localStorage.setItem("role", savedRole);
        localStorage.setItem("user_role", savedRole);
      }
      if (savedEmail) localStorage.setItem("email", savedEmail);

      // Restore active tab states so user stays on the exact same page/tab
      activeTabEntries.forEach(([k, v]) => {
        localStorage.setItem(k, v);
      });

      localStorage.setItem("cpms_drives_cleared", "true");
      localStorage.setItem("cpms_companies_cleared", "true");

      // 3. Broadcast across tabs and windows
      try {
        const ch = new BroadcastChannel("cpms_profile_channel");
        ch.postMessage({ type: "SYSTEM_CLEARED" });
        ch.close();
      } catch (e) { }

      window.dispatchEvent(new Event("cpms_drives_updated"));
      window.dispatchEvent(new Event("cpms_profile_updated"));
      window.dispatchEvent(new Event("cpms_verification_updated"));
      window.dispatchEvent(new Event("storage"));

      setIsModalOpen(false);
      setShowSuccessToast(true);

      if (onSuccess) {
        onSuccess();
      }

      // Instant page reload to display fresh clean slate while staying on the exact same page
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Failed to clear system data:", error);
      setIsClearing(false);
      window.location.reload();
    }
  };

  return (
    <div style={{ display: "inline-block", position: "relative", zIndex: 9999 }}>
      {/* Header Clear Button */}
      <button
        type="button"
        id="btn-clear-all-system-data"
        onClick={() => setIsModalOpen(true)}
        title="Clear all system data (drives, applications, interviews, test data) to start fresh"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: variant === "compact" ? "6px 12px" : "8px 14px",
          backgroundColor: "#fef2f2",
          color: "#dc2626",
          border: "1.5px solid #f87171",
          borderRadius: "8px",
          fontSize: variant === "compact" ? "11px" : "12px",
          fontWeight: "800",
          cursor: "pointer",
          transition: "all 0.15s ease",
          whiteSpace: "nowrap",
          boxShadow: "0 2px 4px rgba(220, 38, 38, 0.08)"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#fee2e2";
          e.currentTarget.style.borderColor = "#dc2626";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#fef2f2";
          e.currentTarget.style.borderColor = "#f87171";
        }}
      >
        <span style={{ fontSize: "14px" }}>️</span>
        <span>Clear All Data</span>
      </button>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999999,
            padding: "16px"
          }}
          onClick={() => !isClearing && setIsModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "24px",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
              border: "1px solid #e2e8f0",
              animation: "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", backgroundColor: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
                ️
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                  Clear All System Data?
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                  Reset drives, applications, interviews & student forms
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13px", color: "#334155", lineHeight: "155%", marginBottom: "20px" }}>
              <p style={{ margin: "0 0 8px 0" }}>
                This will completely reset all <strong>Placement Drives</strong>, <strong>Student Applications</strong>, <strong>Interview Rounds</strong>, <strong>Selections</strong>, and test profile details across MongoDB & Browser Storage.
              </p>
              <p style={{ margin: 0, color: "#16a34a", fontWeight: "700" }}>
                 Your login account will remain safely preserved.
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                disabled={isClearing}
                onClick={() => setIsModalOpen(false)}
                style={{
                  padding: "9px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  color: "#475569",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-clear-data"
                disabled={isClearing}
                onClick={executeClear}
                style={{
                  padding: "9px 18px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: isClearing ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 2px 6px rgba(220, 38, 38, 0.3)"
                }}
              >
                {isClearing ? (
                  <>
                    <span>⏳</span> Clearing Data...
                  </>
                ) : (
                  <>
                    <span>️</span> Yes, Clear All Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          backgroundColor: "#16a34a",
          color: "#ffffff",
          padding: "12px 20px",
          borderRadius: "10px",
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
          fontSize: "13px",
          fontWeight: "700",
          zIndex: 9999999,
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span></span> All system data cleared! Reloading fresh state...
        </div>
      )}
    </div>
  );
};

export default ClearDataButton;
