import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";

export const DriveManagement: React.FC = () => {
  const [drives, setDrives] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDrive, setSelectedDrive] = useState<any | null>(null);

  // Multi-step Wizard State
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [wizardForm, setWizardForm] = useState<any>({
    company: "",
    role: "",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
    website: "",
    ctc: "₹12.0 LPA",
    location: "Bangalore, India",
    jobDescription: "Responsible for core software engineering, feature development, and scalable cloud solutions.",
    recruiterName: "",
    recruiterEmail: "",
    recruiterMobile: "",
    workMode: "On-site",
    minTenth: 65,
    minTwelfth: 65,
    minCgpa: 7.0,
    maxBacklogs: 0,
    eligibleBranches: ["CSE", "IT", "ECE"],
    deadline: "2026-09-30",
    openings: 15
  });

  // Fetch Applications to calculate live Opt-In counts
  const fetchApplications = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/applications`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setApplications(data);
        }
      }
    } catch (e) {}
  };

  // Fetch Drives from MongoDB API
  const fetchDrives = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/company/drives`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDrives(data);
        }
      }
    } catch (e) {
      console.error("Error fetching drives:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
    fetchApplications();
    const interval = setInterval(() => {
      fetchDrives();
      fetchApplications();
    }, 2000);

    const handleSync = () => {
      fetchDrives();
      fetchApplications();
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("cpms_applications_updated", handleSync);
    window.addEventListener("cpms_drives_updated", handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("cpms_applications_updated", handleSync);
      window.removeEventListener("cpms_drives_updated", handleSync);
    };
  }, []);

  // Compute live Opted-in Candidates list for a specific drive
  const getDriveOptedInCandidates = (d: any) => {
    if (!d) return [];
    const dId = String(d._id || d.id || "").toLowerCase().trim();
    const comp = String(d.company || d.companyName || "").toLowerCase().trim();
    const role = String(d.role || d.jobRole || d.jobTitle || "").toLowerCase().trim();

    const resultList: any[] = [];
    const seenEmails = new Set<string>();

    // 1. Check MongoDB applications
    applications.forEach(a => {
      const aId = String(a.driveId || "").toLowerCase().trim();
      const aComp = String(a.companyName || a.company || "").toLowerCase().trim();
      const aEmail = String(a.email || a.studentEmail || "").toLowerCase().trim();

      const isMatch = (dId && aId && dId === aId) || (comp && aComp && (comp.includes(aComp) || aComp.includes(comp)));
      if (isMatch && aEmail && !seenEmails.has(aEmail)) {
        seenEmails.add(aEmail);
        resultList.push(a);
      }
    });

    // 2. Check LocalStorage global applications
    try {
      const globalStr = localStorage.getItem("cpms_applied_drives_global");
      if (globalStr) {
        const globalArr = JSON.parse(globalStr);
        if (Array.isArray(globalArr)) {
          globalArr.forEach((g: any) => {
            const gId = String(g.driveId || "").toLowerCase().trim();
            const gComp = String(g.companyName || g.company || "").toLowerCase().trim();
            const gEmail = String(g.email || g.studentEmail || g.userKey || "").toLowerCase().trim();

            const isMatch = (dId && gId && dId === gId) || (comp && gComp && (comp.includes(gComp) || gComp.includes(comp)));
            if (isMatch && gEmail && !seenEmails.has(gEmail)) {
              seenEmails.add(gEmail);
              resultList.push({
                studentName: g.name || "Student Candidate",
                email: g.email || g.userKey,
                regNo: g.regNo || "Verified Student",
                department: g.department || "Engineering",
                status: "Opted-In"
              });
            }
          });
        }
      }
    } catch (e) {}

    return resultList;
  };

  // Publish New Drive (Step 3 Submit)
  const handlePublishDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizardForm.company || !wizardForm.role || !wizardForm.deadline) {
      alert("Please ensure Company Name, Job Role, and Deadline are filled.");
      return;
    }

    try {
      const payload = {
        company: wizardForm.company,
        jobTitle: wizardForm.role,
        role: wizardForm.role,
        packageCtc: wizardForm.ctc,
        ctc: wizardForm.ctc,
        location: wizardForm.location,
        logo: wizardForm.logo || "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
        website: wizardForm.website,
        jobDescription: wizardForm.jobDescription,
        recruiterName: wizardForm.recruiterName,
        recruiterEmail: wizardForm.recruiterEmail,
        recruiterMobile: wizardForm.recruiterMobile,
        workMode: wizardForm.workMode,
        minTenth: Number(wizardForm.minTenth) || 60,
        minTwelfth: Number(wizardForm.minTwelfth) || 60,
        minCgpa: Number(wizardForm.minCgpa) || 6.5,
        maxBacklogs: Number(wizardForm.maxBacklogs) || 0,
        eligibleBranches: Array.isArray(wizardForm.eligibleBranches) ? wizardForm.eligibleBranches : ["CSE", "IT", "ECE"],
        deadline: wizardForm.deadline,
        openings: Number(wizardForm.openings) || 10,
        status: "Active",
        isOfficerPublished: true,
        isCreatedByOfficer: true,
        createdBy: "Placement Officer",
        approvedBy: "Placement Officer"
      };

      const res = await fetch(`${API_BASE_URL}/api/company/drives`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert(`Placement Drive for "${wizardForm.company}" published successfully! Students can now view and apply.`);
        setShowCreateWizard(false);
        setCurrentStep(1);
        setWizardForm({
          company: "",
          role: "",
          logo: "",
          website: "",
          ctc: "₹12.0 LPA",
          location: "Bangalore, India",
          jobDescription: "",
          recruiterName: "",
          recruiterEmail: "",
          recruiterMobile: "",
          workMode: "On-site",
          minTenth: 65,
          minTwelfth: 65,
          minCgpa: 7.0,
          maxBacklogs: 0,
          eligibleBranches: ["CSE", "IT", "ECE"],
          deadline: "2026-09-30",
          openings: 15
        });
        fetchDrives();
      } else {
        const d = await res.json();
        alert(d.message || "Failed to publish drive.");
      }
    } catch (err: any) {
      alert("Error publishing drive: " + err.message);
    }
  };

  // ⌨️ ESC key handler to close all popups/modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.code === "Escape" || e.keyCode === 27) {
        setShowCreateWizard(false);
        setSelectedDrive(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredDrives = drives.filter(d => {
    const st = d.status || "Active";
    const matchesStatus = statusFilter === "All" || st.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch = !searchQuery ||
      (d.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.role || d.jobTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.location || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Top Action Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: 800, color: "#0F172A" }}>
            Campus Placement Drives Management
          </h2>
          <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B" }}>
            Add corporate partners, configure eligibility cutoffs, and publish hiring drives directly to student dashboards.
          </p>
        </div>
        <button
          onClick={() => { setShowCreateWizard(true); setCurrentStep(1); }}
          style={{
            padding: "10px 18px",
            backgroundColor: "#4F46E5",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(79,70,229,0.2)"
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>+ Create & Publish Drive</span>
        </button>
      </div>

      {/* Top 4 KPI Summary Cards Matching Dashboard Style */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
        {[
          { label: "Total Placement Drives", value: drives.length, sub: "Registered hiring drives", color: "#4F46E5", bg: "#EEF2FF" },
          { label: "Active Live Drives", value: drives.filter(d => (d.status || "").toLowerCase() === "active").length, sub: "Open for candidate applications", color: "#059669", bg: "#DCFCE7" },
          { label: "Upcoming / Pending", value: drives.filter(d => (d.status || "").toLowerCase().includes("pending") || (d.status || "").toLowerCase() === "upcoming").length, sub: "In onboarding queue", color: "#D97706", bg: "#FEF3C7" },
          { label: "Closed / Completed", value: drives.filter(d => (d.status || "").toLowerCase() === "closed").length, sub: "Recruitment rounds finalized", color: "#64748B", bg: "#F1F5F9" }
        ].map((kpi, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: "#FFFFFF",
              padding: "16px 18px",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              borderTop: `4px solid ${kpi.color}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              transition: "all 0.18s ease-in-out"
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>{kpi.label}</div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: kpi.color, marginTop: "4px" }}>{kpi.value}</div>
            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div style={{ backgroundColor: "#FFFFFF", padding: "14px 18px", borderRadius: "12px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "260px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search drive by company name, job role, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", outline: "none" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {["All", "Active", "Pending Approval", "Closed"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "1px solid",
                borderColor: statusFilter === st ? "#4F46E5" : "#CBD5E1",
                backgroundColor: statusFilter === st ? "#EEF2FF" : "#FFFFFF",
                color: statusFilter === st ? "#4338CA" : "#64748B",
                fontWeight: statusFilter === st ? 700 : 500,
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Placement Drives Data Table Container */}
      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: "15px", color: "#0F172A" }}>
            Published Placement Drives ({filteredDrives.length})
          </div>
          <span style={{ fontSize: "12px", color: "#64748B" }}>
            Showing live MongoDB drives
          </span>
        </div>

        <div className="responsive-table-wrapper" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: "720px", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569", fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Company & Job Role</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Package (CTC)</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Location</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Deadline</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Opted-In Students</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Status</th>
                <th style={{ padding: "14px 18px", fontWeight: 700, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrives.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "36px", textAlign: "center", color: "#64748B" }}>
                    <div style={{ fontWeight: 700, color: "#0F172A", marginBottom: "4px" }}>No placement drives found matching criteria</div>
                    <div style={{ fontSize: "12px" }}>Click "+ Create & Publish Drive" to onboard a new recruitment drive.</div>
                  </td>
                </tr>
              ) : (
                filteredDrives.map((d) => {
                  const isAct = (d.status || "").toLowerCase() === "active";
                  const optedCandidates = getDriveOptedInCandidates(d);
                  const count = optedCandidates.length;

                  return (
                    <tr key={d._id || d.id} style={{ borderBottom: "1px solid #F1F5F9", transition: "background-color 0.15s ease" }}>
                      
                      {/* Company & Role */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "3px", flexShrink: 0 }}>
                            {d.logo ? (
                              <img src={d.logo} alt={d.company} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} onError={(e: any) => { e.target.style.display = "none"; }} />
                            ) : (
                              <span style={{ fontWeight: 800, color: "#4F46E5", fontSize: "14px" }}>{(d.company || "C").charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: "#0F172A", fontSize: "13.5px" }}>{d.company}</div>
                            <div style={{ fontSize: "12px", color: "#4338CA", fontWeight: 600 }}>{d.role || d.jobTitle || "Software Trainee"}</div>
                          </div>
                        </div>
                      </td>

                      {/* Package CTC */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                        <strong style={{ color: "#0B3D91", fontSize: "13.5px" }}>{d.ctc || d.packageCtc || "₹12 LPA"}</strong>
                      </td>

                      {/* Location */}
                      <td style={{ padding: "14px 18px", color: "#334155", whiteSpace: "nowrap", fontSize: "12.5px" }}>
                        {d.location || "On Campus"}
                      </td>

                      {/* Deadline */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap", fontSize: "12px", color: "#DC2626", fontWeight: 700 }}>
                        {d.deadline}
                      </td>

                      {/* Opted-In Students */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                        <span
                          onClick={() => setSelectedDrive(d)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            backgroundColor: count > 0 ? "#EEF2FF" : "#F8FAFC",
                            color: count > 0 ? "#4338CA" : "#64748B",
                            border: `1px solid ${count > 0 ? "#C7D2FE" : "#E2E8F0"}`,
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                          title="Click to view candidate list"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                          <span>{count} {count === 1 ? "Student" : "Students"} Applied</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          backgroundColor: isAct ? "#DCFCE7" : "#FEF3C7",
                          color: isAct ? "#059669" : "#D97706",
                          border: `1px solid ${isAct ? "#86EFAC" : "#FDE68A"}`,
                          padding: "3px 9px",
                          borderRadius: "14px",
                          fontSize: "11px",
                          fontWeight: 700
                        }}>
                          <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: isAct ? "#10B981" : "#F59E0B" }}></span>
                          <span>{d.status || "Active"}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => setSelectedDrive(d)}
                          style={{
                            padding: "5px 12px",
                            backgroundColor: "#EEF2FF",
                            color: "#4338CA",
                            border: "1px solid #C7D2FE",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          View Details →
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

      {/* ========================================================================= */}
      {/* MULTI-STEP DRIVE CREATION WIZARD MODAL (Step 1 -> Step 2 -> Step 3) */}
      {/* ========================================================================= */}
      {showCreateWizard && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", maxWidth: "680px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            
            {/* Modal Header & Close Button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "16px", marginBottom: "20px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 800, color: "#0F172A" }}>
                  Create & Publish Placement Drive
                </h3>
                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                  Step {currentStep} of 3 • {currentStep === 1 ? "Company & Role" : (currentStep === 2 ? "Recruiter POC Details" : "Academic Eligibility & Publish")}
                </div>
              </div>
              <button
                onClick={() => setShowCreateWizard(false)}
                style={{ background: "none", border: "none", fontSize: "20px", color: "#64748B", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Step Progress Pills Bar */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
              {[
                { step: 1, label: "1. Company & Role" },
                { step: 2, label: "2. Recruiter Contact" },
                { step: 3, label: "3. Academic Criteria" }
              ].map((s) => (
                <div
                  key={s.step}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: "8px",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    backgroundColor: currentStep === s.step ? "#EEF2FF" : (currentStep > s.step ? "#DCFCE7" : "#F8FAFC"),
                    color: currentStep === s.step ? "#4338CA" : (currentStep > s.step ? "#15803D" : "#94A3B8"),
                    border: `1px solid ${currentStep === s.step ? "#C7D2FE" : (currentStep > s.step ? "#86EFAC" : "#E2E8F0")}`
                  }}
                >
                  {s.label}
                </div>
              ))}
            </div>

            {/* STEP 1: COMPANY & JOB PROFILE */}
            {currentStep === 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amazon, Google, Zoho, TCS"
                    value={wizardForm.company}
                    onChange={(e) => setWizardForm({ ...wizardForm, company: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Job Role / Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Development Engineer"
                    value={wizardForm.role}
                    onChange={(e) => setWizardForm({ ...wizardForm, role: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Package / CTC (LPA) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₹18.0 LPA"
                    value={wizardForm.ctc}
                    onChange={(e) => setWizardForm({ ...wizardForm, ctc: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Company Logo URL</label>
                  <input
                    type="url"
                    placeholder="https://.../logo.png"
                    value={wizardForm.logo}
                    onChange={(e) => setWizardForm({ ...wizardForm, logo: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Official Website URL</label>
                  <input
                    type="url"
                    placeholder="https://company.com"
                    value={wizardForm.website}
                    onChange={(e) => setWizardForm({ ...wizardForm, website: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Job Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore, Hyderabad, Chennai"
                    value={wizardForm.location}
                    onChange={(e) => setWizardForm({ ...wizardForm, location: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Job Description</label>
                  <textarea
                    rows={3}
                    placeholder="Brief job overview and responsibilities..."
                    value={wizardForm.jobDescription}
                    onChange={(e) => setWizardForm({ ...wizardForm, jobDescription: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>
            )}

            {/* STEP 2: RECRUITER CONTACT DETAILS */}
            {currentStep === 2 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Recruiter Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Priya Sharma"
                    value={wizardForm.recruiterName}
                    onChange={(e) => setWizardForm({ ...wizardForm, recruiterName: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Recruiter Official Email</label>
                  <input
                    type="email"
                    placeholder="e.g. campus@company.com"
                    value={wizardForm.recruiterEmail}
                    onChange={(e) => setWizardForm({ ...wizardForm, recruiterEmail: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Recruiter Mobile / Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={wizardForm.recruiterMobile}
                    onChange={(e) => setWizardForm({ ...wizardForm, recruiterMobile: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Work Mode</label>
                  <select
                    value={wizardForm.workMode}
                    onChange={(e) => setWizardForm({ ...wizardForm, workMode: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  >
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 3: ACADEMIC ELIGIBILITY & REGISTRATION DEADLINE */}
            {currentStep === 3 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Min 10th Standard Cutoff (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={wizardForm.minTenth}
                    onChange={(e) => setWizardForm({ ...wizardForm, minTenth: Number(e.target.value) })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Min 12th / Diploma Cutoff (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={wizardForm.minTwelfth}
                    onChange={(e) => setWizardForm({ ...wizardForm, minTwelfth: Number(e.target.value) })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Min CGPA Cutoff *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={wizardForm.minCgpa}
                    onChange={(e) => setWizardForm({ ...wizardForm, minCgpa: Number(e.target.value) })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Max Active Backlogs Allowed *</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={wizardForm.maxBacklogs}
                    onChange={(e) => setWizardForm({ ...wizardForm, maxBacklogs: Number(e.target.value) })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Application Deadline Date *</label>
                  <input
                    type="date"
                    required
                    value={wizardForm.deadline}
                    onChange={(e) => setWizardForm({ ...wizardForm, deadline: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>Estimated Openings</label>
                  <input
                    type="number"
                    min="1"
                    value={wizardForm.openings}
                    onChange={(e) => setWizardForm({ ...wizardForm, openings: Number(e.target.value) })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>
            )}

            {/* Modal Navigation Buttons: Previous / Next / Publish */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E2E8F0", paddingTop: "20px", marginTop: "24px" }}>
              <button
                type="button"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep((prev) => (prev > 1 ? (prev - 1) as any : 1))}
                style={{
                  padding: "9px 18px",
                  backgroundColor: currentStep === 1 ? "#F1F5F9" : "#FFFFFF",
                  color: currentStep === 1 ? "#94A3B8" : "#334155",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: currentStep === 1 ? "not-allowed" : "pointer"
                }}
              >
                ← Back
              </button>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateWizard(false)}
                  style={{ padding: "9px 18px", backgroundColor: "#F8FAFC", color: "#64748B", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentStep === 1 && (!wizardForm.company || !wizardForm.role)) {
                        alert("Please provide Company Name and Job Role before proceeding.");
                        return;
                      }
                      setCurrentStep((prev) => (prev < 3 ? (prev + 1) as any : 3));
                    }}
                    style={{ padding: "9px 22px", backgroundColor: "#4F46E5", color: "#FFFFFF", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePublishDrive}
                    style={{ padding: "9px 24px", backgroundColor: "#16A34A", color: "#FFFFFF", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(22,163,74,0.2)" }}
                  >
                    Publish Drive to Students
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRIVE DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedDrive && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", maxWidth: "640px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #E2E8F0", paddingBottom: "16px", marginBottom: "18px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 800, color: "#0F172A" }}>{selectedDrive.company}</h3>
                <div style={{ fontSize: "12px", color: "#4338CA", fontWeight: 700, marginTop: "2px" }}>{selectedDrive.role || selectedDrive.jobTitle}</div>
              </div>
              <button onClick={() => setSelectedDrive(null)} style={{ background: "none", border: "none", fontSize: "20px", color: "#64748B", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "13px", color: "#334155", marginBottom: "20px" }}>
              <div><strong>Package (CTC):</strong> {selectedDrive.ctc || selectedDrive.packageCtc}</div>
              <div><strong>Location:</strong> {selectedDrive.location}</div>
              <div><strong>Min CGPA:</strong> {selectedDrive.minCgpa || 6.5}</div>
              <div><strong>10th / 12th Cutoff:</strong> {selectedDrive.minTenth || 60}% / {selectedDrive.minTwelfth || 60}%</div>
              <div><strong>Max Backlogs:</strong> {selectedDrive.maxBacklogs ?? 0}</div>
              <div><strong>Deadline:</strong> {selectedDrive.deadline}</div>
              {selectedDrive.recruiterName && <div><strong>Recruiter Name:</strong> {selectedDrive.recruiterName}</div>}
              {selectedDrive.recruiterEmail && <div><strong>Recruiter Email:</strong> {selectedDrive.recruiterEmail}</div>}
            </div>

            <div style={{ backgroundColor: "#F8FAFC", padding: "14px", borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "12.5px", color: "#475569", lineHeight: 1.5, marginBottom: "20px" }}>
              <strong>Job Description:</strong>
              <div style={{ marginTop: "4px" }}>{selectedDrive.jobDescription || "No detailed description provided."}</div>
            </div>

            {/* Opted-In Candidates List */}
            {(() => {
              const opted = getDriveOptedInCandidates(selectedDrive);
              return (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Opted-In Students ({opted.length})
                    </h4>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>Live student registrations</span>
                  </div>

                  {opted.length === 0 ? (
                    <div style={{ padding: "16px", backgroundColor: "#F8FAFC", borderRadius: "8px", border: "1px dashed #CBD5E1", textAlign: "center", color: "#64748B", fontSize: "12px" }}>
                      No students have opted-in for this drive yet.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto" }}>
                      {opted.map((c, cIdx) => (
                        <div key={cIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "12.5px" }}>
                          <div>
                            <div style={{ fontWeight: 700, color: "#0F172A" }}>{c.studentName || c.name || "Student"}</div>
                            <div style={{ fontSize: "11px", color: "#64748B" }}>{c.regNo || "22CSR100"} • {c.department || "CSE"} • {c.email}</div>
                          </div>
                          <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#16A34A", backgroundColor: "#DCFCE7", padding: "3px 8px", borderRadius: "6px" }}>
                            {c.status || "Opted-In"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setSelectedDrive(null)}
                style={{ padding: "8px 20px", backgroundColor: "#F1F5F9", color: "#334155", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DriveManagement;
