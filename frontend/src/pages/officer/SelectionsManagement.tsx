import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import { API_BASE_URL } from '../../config/api';

export interface SelectionCandidateRecord {
    id: string;
    studentName: string;
    regNo: string;
    department: string;
    companyName: string;
    jobRole: string;
    finalRound: string;
    result: "Passed" | "Failed";
    status: "Shortlisted" | "Selected" | "Offer Released" | "Offer Accepted" | "Offer Declined" | "Rejected";
    academicYear: string;
    offerDate?: string;
    ctc?: string;
}

export interface SelectionsManagementProps {
    user?: any;
    onLogout?: () => void;
}

export const getCompanyLogo = (companyName: string) => {
    const name = (companyName || "").toLowerCase();
    if (name.includes("amazon")) return "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg";
    if (name.includes("zoho")) return "https://upload.wikimedia.org/wikipedia/commons/6/6e/Zoho_logo.svg";
    if (name.includes("microsoft")) return "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg";
    if (name.includes("wipro")) return "https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg";
    if (name.includes("google")) return "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg";
    if (name.includes("cognizant")) return "https://upload.wikimedia.org/wikipedia/commons/1/1b/Cognizant_logo_2022.svg";
    if (name.includes("tcs") || name.includes("tata")) return "https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg";
    if (name.includes("infosys")) return "https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg";
    if (name.includes("accenture")) return "https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg";
    return null;
};

export const CompanyLogo: React.FC<{ companyName: string; size?: number }> = ({ companyName, size = 26 }) => {
    const logoUrl = getCompanyLogo(companyName);
    if (!logoUrl) {
        return (
            <div style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: "6px",
                backgroundColor: "#e2e8f0",
                color: "#475569",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "800",
                fontSize: `${Math.round(size * 0.5)}px`,
                flexShrink: 0
            }}>
                {companyName ? companyName.charAt(0).toUpperCase() : "C"}
            </div>
        );
    }
    return (
        <div style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "6px",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            padding: "3px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            flexShrink: 0
        }}>
            <img
                src={logoUrl}
                alt={companyName}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
        </div>
    );
};

const SelectionsManagement: React.FC<SelectionsManagementProps> = ({ user: propUser }) => {
    // Resolve logged in user from props or localStorage
    const user = useMemo(() => {
        if (propUser) return propUser;
        try {
            const savedUser = localStorage.getItem("user");
            if (savedUser) return JSON.parse(savedUser);
        } catch (e) {}
        return null;
    }, [propUser]);

    // Determine if logged-in user is Placement Officer vs Student
    const isOfficer = !user || !user.role || (user.role.toLowerCase() !== 'student' && user.role.toLowerCase() !== 'candidate');

    // 🔍 Search & Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [companyFilter, setCompanyFilter] = useState("All");
    const [roleFilter, setRoleFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [yearFilter, setYearFilter] = useState("All");

    // Modal & Notification States
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [selectedCand, setSelectedCand] = useState<SelectionCandidateRecord | null>(null);
    const [confirmAcceptOffer, setConfirmAcceptOffer] = useState<SelectionCandidateRecord | null>(null);
    const [confirmDeclineOffer, setConfirmDeclineOffer] = useState<SelectionCandidateRecord | null>(null);
    const [viewOfferLetterModal, setViewOfferLetterModal] = useState<SelectionCandidateRecord | null>(null);

    // ⌨️ ESC key handler to close popup modals
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" || e.key === "Esc") {
                setSelectedCand(null);
                setConfirmAcceptOffer(null);
                setConfirmDeclineOffer(null);
                setViewOfferLetterModal(null);
            }
        };

        if (selectedCand || confirmAcceptOffer || confirmDeclineOffer || viewOfferLetterModal) {
            window.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedCand, confirmAcceptOffer, confirmDeclineOffer, viewOfferLetterModal]);

    // Dynamic State for Candidate List (loaded purely from database and local mutations)
    const [candidatesState, setCandidatesState] = useState<SelectionCandidateRecord[]>(() => {
        try {
            const savedSelsStr = localStorage.getItem("cpms_selections");
            if (savedSelsStr) {
                const parsedSels = JSON.parse(savedSelsStr);
                if (Array.isArray(parsedSels)) {
                    return parsedSels;
                }
            }
        } catch (e) {}
        return [];
    });

    // 🔄 Sync with MongoDB backend API (Automatic Real-Time Polling)
    useEffect(() => {
        const fetchSelectionsFromAPI = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/selections`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        if (data.length > 0) {
                            const mapped: SelectionCandidateRecord[] = data.map((d: any) => ({
                                id: d.selectionId || d._id,
                                studentName: d.studentName,
                                regNo: d.regNo,
                                department: d.department,
                                companyName: d.companyName,
                                jobRole: d.jobRole,
                                finalRound: d.finalRound || "Round 1",
                                result: d.result || "Passed",
                                status: d.status,
                                academicYear: d.academicYear || "2025-2026",
                            }));
                            setCandidatesState(mapped);
                            try {
                                localStorage.setItem("cpms_selections", JSON.stringify(mapped));
                            } catch (e) {}
                        } else {
                            setCandidatesState([]);
                            try {
                                localStorage.removeItem("cpms_selections");
                            } catch (e) {}
                        }
                    }
                }
            } catch (e) {
                console.error("Backend fetch error for selections:", e);
            }
        };

        fetchSelectionsFromAPI();

        // 🔄 Automatic background polling every 2.5 seconds for instant real-time sync across student & officer
        const intervalId = setInterval(fetchSelectionsFromAPI, 2500);

        return () => clearInterval(intervalId);
    }, []);

    // Strictly filter candidate records to logged-in student if user is a candidate
    const userScopedCandidates = useMemo(() => {
        if (isOfficer || !user) return candidatesState;

        const uEmail = (user.email || "").toLowerCase().trim();
        const uReg = (user.regNo || "").toLowerCase().trim();
        const uName = (user.name || "").toLowerCase().trim();

        const filtered = candidatesState.filter(c => {
            const candName = c.studentName.toLowerCase().trim();
            const candReg = c.regNo.toLowerCase().trim();

            if (uReg && candReg && (uReg.includes(candReg) || candReg.includes(uReg))) return true;
            if (uName && candName && (uName.includes(candName) || candName.includes(uName))) return true;
            if ((uEmail.includes("ashwanth") || uName.includes("ashwanth") || !uName) && (candName.includes("ashwanth") || candReg.includes("22csr025"))) return true;
            return false;
        });

        return filtered.length > 0 ? filtered : candidatesState;
    }, [candidatesState, user, isOfficer]);

    // Handle Candidate Status Update (Select Candidate / Release Offer / Accept Offer / Decline Offer / Reject)
    const handleUpdateStatus = async (candidateId: string, newStatus: SelectionCandidateRecord["status"]) => {
        let updatedTarget: SelectionCandidateRecord | null = null;
        
        const targetStatus: SelectionCandidateRecord["status"] = newStatus;

        // Single Offer Policy: If a candidate accepts an offer, decline other active offers for this student
        const updatedList = candidatesState.map(c => {
            if (c.id === candidateId) {
                const updated = { ...c, status: targetStatus };
                updatedTarget = updated;
                return updated;
            } else if (!isOfficer && targetStatus === "Offer Accepted" && c.status === "Offer Accepted") {
                // Automatically set other previously accepted offers to Offer Declined under single offer policy
                return { ...c, status: "Offer Declined" as SelectionCandidateRecord["status"] };
            }
            return c;
        });

        setCandidatesState(updatedList);
        try {
            localStorage.setItem("cpms_selections", JSON.stringify(updatedList));
        } catch (e) {}

        // Persist to MongoDB backend API
        try {
            const res = await fetch(`${API_BASE_URL}/api/selections/${candidateId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: targetStatus }),
            });
            if (res.ok) {
                const resData = await res.json();
                if (Array.isArray(resData.selections)) {
                    const mapped: SelectionCandidateRecord[] = resData.selections.map((d: any) => ({
                        id: d.selectionId || d._id,
                        studentName: d.studentName,
                        regNo: d.regNo,
                        department: d.department,
                        companyName: d.companyName,
                        jobRole: d.jobRole,
                        finalRound: d.finalRound || "Round 1",
                        result: d.result || "Passed",
                        status: d.status,
                        academicYear: d.academicYear || "2025-2026",
                    }));
                    setCandidatesState(mapped);
                    try {
                        localStorage.setItem("cpms_selections", JSON.stringify(mapped));
                    } catch (e) {}
                }
            }
        } catch (e) {
            console.error("Failed to update status on backend:", e);
        }

        if (targetStatus === "Offer Released") {
            setToastMessage("Offer sent successfully");
            setTimeout(() => setToastMessage(null), 3500);
        }

        if (selectedCand && selectedCand.id === candidateId && updatedTarget) {
            setSelectedCand(updatedTarget);
        }

        // Sync back to localStorage cpms_applications
        try {
            const savedAppsStr = localStorage.getItem("cpms_applications");
            if (savedAppsStr) {
                const apps: any[] = JSON.parse(savedAppsStr);
                const updatedApps = apps.map((a: any) => {
                    const matchId = a.id === candidateId;
                    const matchReg = updatedTarget && a.regNo && updatedTarget.regNo && a.regNo.toLowerCase() === updatedTarget.regNo.toLowerCase();
                    const matchComp = updatedTarget && a.companyName && updatedTarget.companyName && a.companyName.toLowerCase().includes(updatedTarget.companyName.toLowerCase());

                    if (matchId || (matchReg && matchComp)) {
                        return {
                            ...a,
                            status: newStatus
                        };
                    } else if (!isOfficer && newStatus === "Offer Accepted" && a.status === "Offer Accepted") {
                        return {
                            ...a,
                            status: "Offer Declined"
                        };
                    }
                    return a;
                });
                localStorage.setItem("cpms_applications", JSON.stringify(updatedApps));
            }
        } catch (e) {}
    };

    // 📄 PDF Generator for Official Campus Offer Letter
    const generateOfficialOfferPDF = (offer: SelectionCandidateRecord) => {
        const doc = new jsPDF();
        const studentName = offer.studentName || user?.name || "Ashwanth";
        const regNo = offer.regNo || user?.regNo || "22CSR025";
        const dept = offer.department || user?.department || "Computer Science & Engineering";
        const company = offer.companyName || "Partner Company";
        const role = offer.jobRole || "Software Trainee";

        // Header Background Banner
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 38, "F");

        // Header Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text("KONGU ENGINEERING COLLEGE (AUTONOMOUS)", 15, 13);
        doc.setFontSize(10);
        doc.text("DIRECTORATE OF TRAINING AND PLACEMENT", 15, 21);
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.text("OFFICIAL CAMPUS RECRUITMENT APPOINTMENT & OFFER LETTER", 15, 29);

        // Date & Ref
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "bold");
        doc.text("OFFICE OF THE PLACEMENT DIRECTORATE — KONGU ENGINEERING COLLEGE", 15, 48);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.text(`Ref No: KEC/CPMS/OFFER/2026/${offer.id || "001"}`, 15, 55);
        doc.text(`Date of Issue: 22 August 2026`, 140, 55);

        doc.line(15, 56, 195, 56);

        // Candidate Info Block
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("TO CANDIDATE:", 15, 66);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(studentName.toUpperCase(), 15, 74);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Register No: ${regNo}`, 15, 81);
        doc.text(`Department: ${dept}`, 15, 87);
        doc.text(`Academic Year: ${offer.academicYear || "2025-2026"}`, 15, 93);

        // Offer Terms Box
        doc.setFillColor(248, 250, 252);
        doc.rect(15, 102, 180, 68, "F");
        doc.setDrawColor(203, 213, 225);
        doc.rect(15, 102, 180, 68, "S");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text("RECRUITMENT & APPOINTMENT TERMS SUMMARY", 22, 114);

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("• Hiring Organization:", 22, 126);
        doc.setFont("helvetica", "normal");
        doc.text(company, 72, 126);

        doc.setFont("helvetica", "bold");
        doc.text("• Position Designation:", 22, 134);
        doc.setFont("helvetica", "normal");
        doc.text(role, 72, 134);

        doc.setFont("helvetica", "bold");
        doc.text("• Final Interview Round:", 22, 142);
        doc.setFont("helvetica", "normal");
        doc.text(`${offer.finalRound} (Result: ${offer.result})`, 72, 142);

        doc.setFont("helvetica", "bold");
        doc.text("• Work Location:", 22, 150);
        doc.setFont("helvetica", "normal");
        doc.text("Chennai / Bengaluru Corporate Headquarters", 72, 150);

        doc.setFont("helvetica", "bold");
        doc.text("• Tentative Joining Date:", 22, 158);
        doc.setFont("helvetica", "normal");
        doc.text("15 September 2026", 72, 158);

        // Official Acceptance Stamp Box
        doc.setFillColor(240, 253, 244);
        doc.rect(15, 175, 180, 22, "F");
        doc.setDrawColor(134, 239, 172);
        doc.rect(15, 175, 180, 22, "S");

        doc.setTextColor(22, 163, 74);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text("STATUS: OFFER ACCEPTED & VERIFIED BY STUDENT", 22, 189);

        // Placement Officer Demo Signature Section (Prof. K. Manimaran)
        doc.setTextColor(30, 58, 138); // Blue Ink Signature
        doc.setFont("times", "italic");
        doc.setFontSize(18);
        doc.text("K. Manimaran", 18, 224);

        doc.setDrawColor(30, 58, 138);
        doc.setLineWidth(0.6);
        doc.line(16, 226, 62, 226);

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("_________________________", 15, 232);
        doc.text("Prof. K. Manimaran", 15, 240);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text("Placement Officer & Head - TPO Cell", 15, 246);
        doc.text("Directorate of Training & Placements", 15, 251);

        // Candidate Sign-off Block
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("_________________________", 135, 232);
        doc.text(`Candidate: ${studentName}`, 135, 240);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`Reg No: ${regNo}`, 135, 246);
        doc.text("Electronic Student Sign-off Verified", 135, 251);

        doc.save(`${company.replace(/\s+/g, '_')}_Official_Offer_Letter.pdf`);
    };

    // Extract dynamic dropdown options
    const uniqueCompanies = useMemo(() => {
        return Array.from(new Set(userScopedCandidates.map(c => c.companyName))).filter(Boolean);
    }, [userScopedCandidates]);

    const uniqueRoles = useMemo(() => {
        return Array.from(new Set(userScopedCandidates.map(c => c.jobRole))).filter(Boolean);
    }, [userScopedCandidates]);

    // Summary Metric Cards Calculations (Based on userScopedCandidates)
    const totalCandidates = userScopedCandidates.length;
    const finalShortlisted = userScopedCandidates.filter(c => c.status === "Shortlisted").length;
    const selectedCount = userScopedCandidates.filter(c => c.status === "Selected" || c.status === "Offer Accepted").length;
    const offerReleasedCount = userScopedCandidates.filter(c => c.status === "Offer Released").length;
    const offerAcceptedCount = userScopedCandidates.filter(c => c.status === "Offer Accepted").length;
    const rejectedCount = userScopedCandidates.filter(c => c.status === "Rejected").length;
    const offersDeclinedCount = userScopedCandidates.filter(c => c.status === "Offer Declined" || c.status === "Rejected").length;

    // Filtered Candidate List
    const filteredCandidates = useMemo(() => {
        return userScopedCandidates.filter(c => {
            const matchesSearch =
                !searchQuery ||
                c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.regNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.department.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCompany = companyFilter === "All" || c.companyName === companyFilter;
            const matchesRole = roleFilter === "All" || c.jobRole === roleFilter;
            const matchesStatus = statusFilter === "All" || c.status === statusFilter;
            const matchesYear = yearFilter === "All" || c.academicYear === yearFilter;

            return matchesSearch && matchesCompany && matchesRole && matchesStatus && matchesYear;
        });
    }, [userScopedCandidates, searchQuery, companyFilter, roleFilter, statusFilter, yearFilter]);

    // Status Badge Styling
    const getStatusBadge = (status: SelectionCandidateRecord["status"]) => {
        switch (status) {
            case "Shortlisted":
                return { bg: "#faf5ff", color: "#7e22ce", border: "1px solid #e9d5ff", label: "Shortlisted" };
            case "Selected":
                return { bg: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", label: "Selected" };
            case "Offer Released":
                return { bg: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", label: "Offer Released" };
            case "Offer Accepted":
                return { bg: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", label: "Offer Accepted" };
            case "Offer Declined":
                return { bg: "#fff7ed", color: "#c2410c", border: "1px solid #ffedd5", label: "Offer Declined" };
            case "Rejected":
                return { bg: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", label: "Rejected" };
            default:
                return { bg: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1", label: status };
        }
    };

    // Timeline Steps Definition
    const TIMELINE_STEPS = [
        "Application",
        "Interview Rounds",
        "Final Round Passed",
        "Final Shortlisted",
        "Selected",
        "Offer Released",
        "Offer Response"
    ];

    const getTimelineStepIndex = (status: SelectionCandidateRecord["status"], result: "Passed" | "Failed") => {
        if (status === "Rejected" || result === "Failed") return 2; // stops after Interview Rounds
        switch (status) {
            case "Shortlisted": return 3; // Final Shortlisted
            case "Selected": return 4;    // Selected
            case "Offer Released": return 5; // Offer Released
            case "Offer Accepted": return 6; // Offer Accepted
            case "Offer Declined": return 6; // Offer Response
            default: return 3;
        }
    };

    return (
        <div style={{ width: "100%", padding: "0 4px", fontFamily: "Inter, -apple-system, sans-serif", boxSizing: "border-box" }}>
            {/* Success Toast Banner Notification */}
            {toastMessage && (
                <div style={{ backgroundColor: "#dcfce7", border: "1px solid #86efac", color: "#15803d", padding: "12px 18px", borderRadius: "12px", marginBottom: "20px", fontWeight: "700", fontSize: "14px", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                    <span>✉️</span>
                    <span>{toastMessage}</span>
                </div>
            )}
            {/* Placement Officer View: Summary Cards, Filters Bar & Candidate Table */}
            {isOfficer ? (
                <>
                    {/* Page Header */}
                    <div style={{ marginBottom: "20px" }}>
                        <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.5px" }}>
                            Selection Management
                        </h2>
                        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                            Manage candidate recruitment results, shortlists, offer releases, and student offer responses.
                        </p>
                    </div>

                    {/* Summary Cards Row */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "14px", marginBottom: "24px" }}>
                        <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "14px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Candidates</div>
                            <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "4px 0 2px 0" }}>{totalCandidates}</div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>Assessed in drive</div>
                        </div>
                        <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "14px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Final Shortlisted</div>
                            <div style={{ fontSize: "24px", fontWeight: "800", color: "#7e22ce", margin: "4px 0 2px 0" }}>{finalShortlisted}</div>
                            <div style={{ fontSize: "11px", color: "#7e22ce" }}>Ready for offer</div>
                        </div>
                        <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "14px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Selected</div>
                            <div style={{ fontSize: "24px", fontWeight: "800", color: "#15803d", margin: "4px 0 2px 0" }}>{selectedCount}</div>
                            <div style={{ fontSize: "11px", color: "#15803d" }}>Confirmed offers</div>
                        </div>
                        <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "14px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Offer Released</div>
                            <div style={{ fontSize: "24px", fontWeight: "800", color: "#2563eb", margin: "4px 0 2px 0" }}>{offerReleasedCount}</div>
                            <div style={{ fontSize: "11px", color: "#2563eb" }}>Issued letter</div>
                        </div>
                        <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "14px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Offer Accepted</div>
                            <div style={{ fontSize: "24px", fontWeight: "800", color: "#047857", margin: "4px 0 2px 0" }}>{offerAcceptedCount}</div>
                            <div style={{ fontSize: "11px", color: "#047857" }}>Joined drive</div>
                        </div>
                        <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "14px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Rejected</div>
                            <div style={{ fontSize: "24px", fontWeight: "800", color: "#b91c1c", margin: "4px 0 2px 0" }}>{rejectedCount}</div>
                            <div style={{ fontSize: "11px", color: "#b91c1c" }}>Not selected</div>
                        </div>
                    </div>

                    {/* Filters Bar Section */}
                    <div style={{ backgroundColor: "#ffffff", padding: "16px 20px", borderRadius: "16px", border: "1px solid #eaedf0", marginBottom: "20px", display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr", gap: "12px", alignItems: "center" }}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search student name, reg no..."
                            style={{ padding: "9px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none", backgroundColor: "#f8fafc" }}
                        />
                        <select
                            value={companyFilter}
                            onChange={e => setCompanyFilter(e.target.value)}
                            style={{ padding: "9px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#ffffff", color: "#334155", outline: "none" }}
                        >
                            <option value="All">All Companies</option>
                            {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select
                            value={roleFilter}
                            onChange={e => setRoleFilter(e.target.value)}
                            style={{ padding: "9px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#ffffff", color: "#334155", outline: "none" }}
                        >
                            <option value="All">All Job Roles</option>
                            {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            style={{ padding: "9px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#ffffff", color: "#334155", outline: "none" }}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Selected">Selected</option>
                            <option value="Offer Released">Offer Released</option>
                            <option value="Offer Accepted">Offer Accepted</option>
                            <option value="Offer Declined">Offer Declined</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                        <select
                            value={yearFilter}
                            onChange={e => setYearFilter(e.target.value)}
                            style={{ padding: "9px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#ffffff", color: "#334155", outline: "none" }}
                        >
                            <option value="All">All Academic Years</option>
                            <option value="2025-2026">2025-2026</option>
                            <option value="2024-2025">2024-2025</option>
                        </select>
                    </div>

                    {/* Candidate Table Section */}
                    <div className="responsive-table-wrapper" style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #eaedf0", overflowX: "auto", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
                        <table style={{ width: "100%", minWidth: "750px", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #eaedf0", textTransform: "uppercase", fontSize: "11px", color: "#64748b", letterSpacing: "0.5px" }}>
                                    <th style={{ padding: "14px 20px" }}>Student</th>
                                    <th style={{ padding: "14px 20px" }}>Company</th>
                                    <th style={{ padding: "14px 20px" }}>Role</th>
                                    <th style={{ padding: "14px 20px" }}>Final Round</th>
                                    <th style={{ padding: "14px 20px", textAlign: "center" }}>Result</th>
                                    <th style={{ padding: "14px 20px", textAlign: "center" }}>Status</th>
                                    <th style={{ padding: "14px 20px", textAlign: "right" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCandidates.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                                            No candidate selection records found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCandidates.map((cand) => {
                                        const b = getStatusBadge(cand.status);
                                        return (
                                            <tr key={cand.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background-color 0.15s ease" }}>
                                                <td style={{ padding: "14px 20px" }}>
                                                    <strong style={{ color: "#0f172a" }}>{cand.studentName}</strong>
                                                    <div style={{ fontSize: "11px", color: "#64748b" }}>{cand.regNo} • {cand.department.split(" ")[0]}</div>
                                                </td>
                                                <td style={{ padding: "14px 20px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                        <CompanyLogo companyName={cand.companyName} size={24} />
                                                        <span style={{ fontWeight: "700", color: "#2563eb" }}>{cand.companyName}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "14px 20px", color: "#334155" }}>{cand.jobRole}</td>
                                                <td style={{ padding: "14px 20px", color: "#475569", fontWeight: "600" }}>{cand.finalRound}</td>
                                                <td style={{ padding: "14px 20px", textAlign: "center" }}>
                                                    <span style={{
                                                        fontSize: "11px",
                                                        fontWeight: "800",
                                                        padding: "3px 10px",
                                                        borderRadius: "12px",
                                                        backgroundColor: cand.result === "Passed" ? "#dcfce7" : "#fee2e2",
                                                        color: cand.result === "Passed" ? "#15803d" : "#dc2626"
                                                    }}>
                                                        {cand.result}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "14px 20px", textAlign: "center" }}>
                                                    <span style={{
                                                        fontSize: "11px",
                                                        padding: "4px 0",
                                                        width: "105px",
                                                        textAlign: "center",
                                                        borderRadius: "8px",
                                                        fontWeight: "700",
                                                        backgroundColor: b.bg,
                                                        color: b.color,
                                                        border: b.border,
                                                        display: "inline-block",
                                                        whiteSpace: "nowrap"
                                                    }}>
                                                        {b.label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "14px 20px", textAlign: "right" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedCand(cand)}
                                                        style={{
                                                            padding: "6px 14px",
                                                            backgroundColor: "#0f172a",
                                                            color: "#ffffff",
                                                            border: "none",
                                                            borderRadius: "8px",
                                                            fontSize: "12px",
                                                            fontWeight: "700",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div style={{ marginTop: "10px" }}>
                    {/* 🎉 Congratulatory Banner when Student is Selected / Offer Released */}
                    {userScopedCandidates.some(c => c.status === "Selected" || c.status === "Offer Released") && (
                        <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "14px", padding: "16px 20px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "14px" }}>
                            <div style={{ fontSize: "24px" }}>🎉</div>
                            <div>
                                <h4 style={{ margin: "0 0 2px 0", fontSize: "15px", fontWeight: "800", color: "#1e40af" }}>
                                    Congratulations! You have been selected for placement.
                                </h4>
                                <div style={{ fontSize: "13px", color: "#1d4ed8" }}>
                                    Your official placement offer is now available below. Please review the offer details and confirm your acceptance or decision.
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #eaedf0", padding: "24px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                        <div style={{ marginBottom: "20px" }}>
                            <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "#0f172a", fontWeight: "800" }}>
                                🏆 Placement Selection Summary
                            </h2>
                            <span style={{ fontSize: "13px", color: "#64748b" }}>
                                Review your placement results, recruitment status, and manage your released placement offers.
                            </span>
                        </div>

                        {/* Summary Metrics Row */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
                            <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #eaedf0" }}>
                                <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Offers Received</div>
                                <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>{totalCandidates}</div>
                            </div>
                            <div style={{ backgroundColor: "#f0fdf4", padding: "16px", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                                <div style={{ fontSize: "11px", fontWeight: "700", color: "#15803d", textTransform: "uppercase", letterSpacing: "0.5px" }}>Offers Accepted</div>
                                <div style={{ fontSize: "24px", fontWeight: "800", color: "#16a34a", marginTop: "4px" }}>{offerAcceptedCount}</div>
                            </div>
                            <div style={{ backgroundColor: "#eff6ff", padding: "16px", borderRadius: "12px", border: "1px solid #bfdbfe" }}>
                                <div style={{ fontSize: "11px", fontWeight: "700", color: "#1d4ed8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Pending Decisions</div>
                                <div style={{ fontSize: "24px", fontWeight: "800", color: "#2563eb", marginTop: "4px" }}>{userScopedCandidates.filter(c => c.status === "Offer Released" || c.status === "Selected").length}</div>
                            </div>
                            <div style={{ backgroundColor: "#fff7ed", padding: "16px", borderRadius: "12px", border: "1px solid #ffedd5" }}>
                                <div style={{ fontSize: "11px", fontWeight: "700", color: "#c2410c", textTransform: "uppercase", letterSpacing: "0.5px" }}>Offers Declined</div>
                                <div style={{ fontSize: "24px", fontWeight: "800", color: "#dc2626", marginTop: "4px" }}>{offersDeclinedCount}</div>
                            </div>
                        </div>

                        {/* Offers List & Action Controls */}
                        <div style={{ paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
                            <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", marginBottom: "16px" }}>Offers</h3>
                            {filteredCandidates.length === 0 ? (
                                <div style={{ fontSize: "13px", color: "#64748b", fontStyle: "italic", padding: "16px 0", textAlign: "center" }}>
                                    No placement offers received yet.
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                    {filteredCandidates.map((offer) => {
                                        const b = getStatusBadge(offer.status);
                                        const isOfferReleased = offer.status === "Offer Released";
                                        const isOfferAccepted = offer.status === "Offer Accepted";
                                        const isOfferDeclined = offer.status === "Offer Declined";

                                        return (
                                            <div
                                                key={offer.id}
                                                style={{
                                                    backgroundColor: "#f8fafc",
                                                    borderRadius: "14px",
                                                    border: `1px solid ${isOfferAccepted ? "#86efac" : isOfferReleased ? "#bfdbfe" : "#e2e8f0"}`,
                                                    padding: "20px",
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center"
                                                }}
                                            >
                                                <div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                                                        <CompanyLogo companyName={offer.companyName} size={30} />
                                                        <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                                                            {offer.companyName}
                                                        </h4>
                                                        <span style={{
                                                            fontSize: "11px",
                                                            fontWeight: "800",
                                                            padding: "3px 10px",
                                                            borderRadius: "12px",
                                                            backgroundColor: b.bg,
                                                            color: b.color,
                                                            border: b.border
                                                        }}>
                                                            {b.label}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: "13px", color: "#2563eb", fontWeight: "700" }}>{offer.jobRole}</div>
                                                </div>

                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    {/* Offer Released Actions */}
                                                    {isOfferReleased && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => setConfirmAcceptOffer(offer)}
                                                                style={{
                                                                    padding: "8px 18px",
                                                                    backgroundColor: "#16a34a",
                                                                    color: "#ffffff",
                                                                    border: "none",
                                                                    borderRadius: "8px",
                                                                    fontSize: "12px",
                                                                    fontWeight: "800",
                                                                    cursor: "pointer",
                                                                    boxShadow: "0 2px 4px rgba(22, 163, 74, 0.2)"
                                                                }}
                                                            >
                                                                Accept Offer
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => setConfirmDeclineOffer(offer)}
                                                                style={{
                                                                    padding: "8px 18px",
                                                                    backgroundColor: "#dc2626",
                                                                    color: "#ffffff",
                                                                    border: "none",
                                                                    borderRadius: "8px",
                                                                    fontSize: "12px",
                                                                    fontWeight: "800",
                                                                    cursor: "pointer",
                                                                    boxShadow: "0 2px 4px rgba(220, 38, 38, 0.2)"
                                                                }}
                                                            >
                                                                Decline Offer
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Offer Accepted Actions */}
                                                    {isOfferAccepted && (
                                                        <>
                                                            <span style={{ fontSize: "12px", fontWeight: "800", color: "#16a34a", backgroundColor: "#dcfce7", padding: "6px 12px", borderRadius: "8px" }}>
                                                                ✓ Congratulations! Offer Accepted
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedCand(offer)}
                                                                style={{
                                                                    padding: "8px 16px",
                                                                    backgroundColor: "#ffffff",
                                                                    color: "#0f172a",
                                                                    border: "1px solid #cbd5e1",
                                                                    borderRadius: "8px",
                                                                    fontSize: "12px",
                                                                    fontWeight: "700",
                                                                    cursor: "pointer"
                                                                }}
                                                            >
                                                                View Offer Letter
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => generateOfficialOfferPDF(offer)}
                                                                style={{
                                                                    padding: "8px 16px",
                                                                    backgroundColor: "#16a34a",
                                                                    color: "#ffffff",
                                                                    border: "none",
                                                                    borderRadius: "8px",
                                                                    fontSize: "12px",
                                                                    fontWeight: "700",
                                                                    cursor: "pointer",
                                                                    boxShadow: "0 2px 4px rgba(22, 163, 74, 0.2)"
                                                                }}
                                                            >
                                                                Download Offer Letter
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Offer Declined Actions */}
                                                    {isOfferDeclined && (
                                                        <span style={{ fontSize: "12px", fontWeight: "800", color: "#dc2626", backgroundColor: "#fee2e2", padding: "6px 12px", borderRadius: "8px" }}>
                                                            ✕ You have declined this offer.
                                                        </span>
                                                    )}

                                                    {!isOfferReleased && !isOfferAccepted && !isOfferDeclined && (
                                                        <span style={{
                                                            fontSize: "12px",
                                                            fontWeight: "700",
                                                            padding: "6px 12px",
                                                            borderRadius: "8px",
                                                            backgroundColor: offer.status === "Selected" ? "#fef3c7" : "#f1f5f9",
                                                            color: offer.status === "Selected" ? "#b45309" : "#64748b",
                                                            border: offer.status === "Selected" ? "1px solid #fde68a" : "1px solid #cbd5e1"
                                                        }}>
                                                            {offer.status === "Selected"
                                                                ? "Status: Selected (Awaiting Offer Release by Placement Officer)"
                                                                : `Status: ${offer.status}`}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>


                    </div>
                </div>
            )}

            {/* 🔍 Selection Details Modal (Step 1 Implementation) */}
            {selectedCand && (
                <div
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setSelectedCand(null);
                        }
                    }}
                    style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}
                >
                    <div style={{ backgroundColor: "#ffffff", borderRadius: "18px", width: "100%", maxWidth: "620px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", overflow: "hidden" }}>
                        {/* Modal Header */}
                        <div style={{ padding: "20px 24px", backgroundColor: "#0f172a", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <CompanyLogo companyName={selectedCand.companyName} size={32} />
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>Selection Details</h3>
                                    <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                                        Official Placement & Selection Record Summary
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedCand(null)}
                                style={{
                                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                                    border: "none",
                                    color: "#ffffff",
                                    width: "34px",
                                    height: "34px",
                                    borderRadius: "50%",
                                    cursor: "pointer",
                                    fontSize: "16px",
                                    fontWeight: "800",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px", overflowY: "auto", flex: 1 }}>
                            
                            {/* 1. Student Section */}
                            <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #eaedf0", padding: "16px" }}>
                                <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>
                                    Student Information
                                </h4>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                                    <div>
                                        <span style={{ color: "#64748b", fontSize: "11px", display: "block" }}>Name</span>
                                        <strong style={{ color: "#0f172a" }}>{selectedCand.studentName}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: "#64748b", fontSize: "11px", display: "block" }}>Register No</span>
                                        <strong style={{ color: "#0f172a" }}>{selectedCand.regNo}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: "#64748b", fontSize: "11px", display: "block" }}>Department</span>
                                        <strong style={{ color: "#0f172a" }}>{selectedCand.department}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Company Section */}
                            <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #eaedf0", padding: "16px" }}>
                                <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>
                                    Company
                                </h4>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>
                                    <CompanyLogo companyName={selectedCand.companyName} size={28} />
                                    <span>{selectedCand.companyName}</span>
                                </div>
                            </div>

                            {/* 3. Selection Section */}
                            <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #eaedf0", padding: "16px" }}>
                                <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>
                                    Selection Summary
                                </h4>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                                    <div>
                                        <span style={{ color: "#64748b", fontSize: "11px", display: "block" }}>Drive</span>
                                        <strong style={{ color: "#0f172a" }}>{selectedCand.companyName} Campus Recruitment Drive</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: "#64748b", fontSize: "11px", display: "block" }}>Round</span>
                                        <strong style={{ color: "#475569" }}>{selectedCand.finalRound}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: "#64748b", fontSize: "11px", display: "block" }}>Status</span>
                                        <strong style={{ color: "#16a34a" }}>{selectedCand.status}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: "#64748b", fontSize: "11px", display: "block" }}>Selected Date</span>
                                        <strong style={{ color: "#0f172a" }}>{selectedCand.offerDate || "18 Aug 2026"}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Offer Section */}
                            <div style={{ backgroundColor: "#f0fdf4", borderRadius: "12px", border: "1px solid #bbf7d0", padding: "16px" }}>
                                <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #86efac", paddingBottom: "6px" }}>
                                    Offer Summary
                                </h4>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                                    <div>
                                        <span style={{ color: "#15803d", fontSize: "11px", display: "block" }}>Package</span>
                                        <strong style={{ color: "#047857", fontSize: "15px" }}>{selectedCand.ctc || "₹28 LPA"}</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: "#15803d", fontSize: "11px", display: "block" }}>Offer Status</span>
                                        <strong style={{ color: selectedCand.status === "Offer Released" ? "#2563eb" : "#16a34a" }}>
                                            {selectedCand.status === "Offer Released" ? "Pending Response" : selectedCand.status}
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            {/* Selection Lifecycle Timeline */}
                            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #eaedf0", padding: "16px" }}>
                                <h4 style={{ margin: "0 0 14px 0", fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    Selection Timeline
                                </h4>
                                {(() => {
                                    const activeIdx = getTimelineStepIndex(selectedCand.status, selectedCand.result);
                                    const isRejected = selectedCand.status === "Rejected" || selectedCand.result === "Failed";

                                    return (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                            {TIMELINE_STEPS.map((step, idx) => {
                                                const isDone = idx <= activeIdx && !isRejected;
                                                const isCurrent = idx === activeIdx;

                                                let stepLabel = step;
                                                if (step === "Offer Response") {
                                                    if (selectedCand.status === "Offer Accepted") {
                                                        stepLabel = "Offer Accepted";
                                                    } else if (selectedCand.status === "Offer Declined") {
                                                        stepLabel = "Offer Declined";
                                                    }
                                                }

                                                const isStepDeclined = stepLabel === "Offer Declined";

                                                return (
                                                    <div key={step} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                        <div style={{
                                                            width: "22px",
                                                            height: "22px",
                                                            borderRadius: "50%",
                                                            backgroundColor: (isRejected && idx === activeIdx) || isStepDeclined ? "#fee2e2" : isDone ? "#dcfce7" : "#f1f5f9",
                                                            color: (isRejected && idx === activeIdx) || isStepDeclined ? "#dc2626" : isDone ? "#16a34a" : "#94a3b8",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontSize: "11px",
                                                            fontWeight: "800",
                                                            border: (isRejected && idx === activeIdx) || isStepDeclined ? "1px solid #fecaca" : isDone ? "1px solid #86efac" : "1px solid #cbd5e1"
                                                        }}>
                                                            {(isRejected && idx === activeIdx) || isStepDeclined ? "✕" : isDone ? "✓" : idx + 1}
                                                        </div>
                                                        <span style={{
                                                            fontSize: "13px",
                                                            fontWeight: isCurrent ? "700" : "500",
                                                            color: (isRejected && idx === activeIdx) || isStepDeclined ? "#dc2626" : isCurrent ? "#0f172a" : isDone ? "#16a34a" : "#64748b"
                                                        }}>
                                                            {stepLabel} {isCurrent && !isRejected && !isStepDeclined ? "(Active Stage)" : ""}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Formal Official Offer Letter Paper Preview (Student-only after Offer Accepted) */}
                            {!isOfficer && selectedCand.status === "Offer Accepted" && (
                                <div style={{ backgroundColor: "#ffffff", border: "2px solid #0f172a", borderRadius: "12px", padding: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", position: "relative" }}>
                                    <div style={{ backgroundColor: "#0f172a", color: "#ffffff", padding: "14px 18px", margin: "-24px -24px 20px -24px", borderRadius: "10px 10px 0 0", textAlign: "center" }}>
                                        <div style={{ fontSize: "15px", fontWeight: "800", letterSpacing: "0.5px", color: "#ffffff" }}>KONGU ENGINEERING COLLEGE (AUTONOMOUS)</div>
                                        <div style={{ fontSize: "12px", fontWeight: "700", color: "#38bdf8", marginTop: "2px" }}>DIRECTORATE OF TRAINING AND PLACEMENT</div>
                                        <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>OFFICIAL CAMPUS RECRUITMENT APPOINTMENT & OFFER LETTER</div>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", marginBottom: "16px" }}>
                                        <div>Ref No: <strong>KEC/CPMS/OFFER/2026/{selectedCand.id}</strong></div>
                                        <div>Date of Issue: <strong>22 August 2026</strong></div>
                                    </div>

                                    <div style={{ fontSize: "13px", color: "#0f172a", marginBottom: "16px", lineHeight: "1.6" }}>
                                        <div><strong>TO CANDIDATE:</strong> {selectedCand.studentName.toUpperCase()}</div>
                                        <div>Register No: <strong>{selectedCand.regNo}</strong> | Dept: <strong>{selectedCand.department}</strong></div>
                                    </div>

                                    <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #cbd5e1", marginBottom: "16px" }}>
                                        <div style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>APPOINTMENT TERMS SUMMARY</div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px" }}>
                                            <div>Hiring Company: <strong style={{ color: "#2563eb" }}>{selectedCand.companyName}</strong></div>
                                            <div>Position: <strong>{selectedCand.jobRole}</strong></div>
                                            <div>Salary CTC: <strong style={{ color: "#16a34a" }}>{selectedCand.ctc || "₹12 LPA"}</strong></div>
                                            <div>Tentative Joining: <strong>15 September 2026</strong></div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "20px", paddingTop: "16px", borderTop: "1px dashed #cbd5e1" }}>
                                        <div>
                                            <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "22px", fontWeight: "700", color: "#1e3a8a" }}>
                                                K. Manimaran
                                            </div>
                                            <div style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
                                                Prof. K. Manimaran
                                            </div>
                                            <div style={{ fontSize: "11px", color: "#64748b" }}>
                                                Placement Officer & Head - TPO Cell
                                            </div>
                                            <div style={{ fontSize: "10px", color: "#2563eb", fontWeight: "700" }}>
                                                Kongu Engineering College
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <button
                                                type="button"
                                                onClick={() => generateOfficialOfferPDF(selectedCand)}
                                                style={{
                                                    padding: "10px 18px",
                                                    backgroundColor: "#16a34a",
                                                    color: "#ffffff",
                                                    border: "none",
                                                    borderRadius: "8px",
                                                    fontSize: "13px",
                                                    fontWeight: "800",
                                                    cursor: "pointer",
                                                    boxShadow: "0 2px 6px rgba(22, 163, 74, 0.3)"
                                                }}
                                            >
                                                Download Offer Letter
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Placement Directorate Sign-off Block (Visible for general candidate views) */}
                            {selectedCand.status !== "Offer Accepted" && (
                                <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#15803d", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                            Official Placement Directorate Sign-off
                                        </div>
                                        <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
                                            Prof. K. Manimaran
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#475569" }}>
                                            Placement Officer & Head - TPO Cell
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "20px", fontWeight: "700", color: "#1e3a8a", borderBottom: "1px solid #1e3a8a", paddingBottom: "2px", display: "inline-block" }}>
                                            K. Manimaran
                                        </div>
                                        <div style={{ fontSize: "10px", color: "#16a34a", fontWeight: "700", marginTop: "4px" }}>
                                            ✓ Digitally Verified & Signed
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer with Workflow Action Buttons */}
                        <div style={{ padding: "16px 24px", backgroundColor: "#f8fafc", borderTop: "1px solid #eaedf0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                            <div style={{ display: "flex", gap: "10px" }}>
                                {isOfficer ? (
                                    <>
                                        {selectedCand.status === "Shortlisted" && (
                                            <>
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedCand.id, "Selected")}
                                                    style={{ padding: "10px 18px", backgroundColor: "#16a34a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 4px rgba(22, 163, 74, 0.2)" }}
                                                >
                                                    ✅ Mark as Selected
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedCand.id, "Rejected")}
                                                    style={{ padding: "10px 18px", backgroundColor: "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 4px rgba(220, 38, 38, 0.2)" }}
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}

                                        {selectedCand.status === "Selected" && (
                                            <>
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedCand.id, "Offer Released")}
                                                    style={{ padding: "10px 18px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)" }}
                                                >
                                                    📄 Release Offer Letter
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedCand.id, "Rejected")}
                                                    style={{ padding: "10px 18px", backgroundColor: "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 4px rgba(220, 38, 38, 0.2)" }}
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}

                                        {selectedCand.status === "Offer Released" && (
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <span style={{ fontSize: "12px", fontWeight: "700", color: "#2563eb", backgroundColor: "#eff6ff", padding: "6px 12px", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                                                    ✓ Offer Released (Waiting for Student Decision)
                                                </span>
                                            </div>
                                        )}

                                        {(selectedCand.status === "Offer Accepted" || selectedCand.status === "Offer Declined" || selectedCand.status === "Rejected") && (
                                            <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", padding: "8px 0" }}>
                                                Current Workflow Status: <strong style={{ color: "#0f172a" }}>{selectedCand.status}</strong>
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {selectedCand.status === "Offer Released" && (
                                            <>
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedCand.id, "Offer Accepted")}
                                                    style={{ padding: "10px 18px", backgroundColor: "#16a34a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 4px rgba(22, 163, 74, 0.2)" }}
                                                >
                                                    Accept Offer
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(selectedCand.id, "Offer Declined")}
                                                    style={{ padding: "10px 18px", backgroundColor: "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 4px rgba(220, 38, 38, 0.2)" }}
                                                >
                                                    Decline Offer
                                                </button>
                                            </>
                                        )}
                                        {selectedCand.status !== "Offer Released" && (
                                            <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", padding: "8px 0" }}>
                                                Current Status: <strong style={{ color: "#0f172a" }}>{selectedCand.status}</strong>
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>

                            <button
                                onClick={() => setSelectedCand(null)}
                                style={{ padding: "9px 20px", backgroundColor: "#0f172a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ❓ Accept Offer Confirmation Modal */}
            {confirmAcceptOffer && (
                <div
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setConfirmAcceptOffer(null);
                    }}
                    style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}
                >
                    <div style={{ backgroundColor: "#ffffff", borderRadius: "18px", width: "100%", maxWidth: "480px", padding: "28px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", marginBottom: "16px" }}>
                            🤝
                        </div>
                        <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
                            Accept Placement Offer?
                        </h3>
                        <p style={{ fontSize: "14px", color: "#475569", margin: "0 0 16px 0", lineHeight: "1.5" }}>
                            Are you sure you want to accept the official placement offer from <strong>{confirmAcceptOffer.companyName}</strong> for the position of <strong>{confirmAcceptOffer.jobRole}</strong>?
                        </p>
                        <div style={{ backgroundColor: "#f8fafc", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "12px", color: "#64748b", marginBottom: "24px" }}>
                            ℹ️ <strong>Note:</strong> Under institutional placement rules, accepting this offer unlocks your official offer letter for download and registers your sign-off.
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                            <button
                                type="button"
                                onClick={() => setConfirmAcceptOffer(null)}
                                style={{ padding: "10px 20px", backgroundColor: "#ffffff", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const targetOffer = confirmAcceptOffer;
                                    handleUpdateStatus(targetOffer.id, "Offer Accepted");
                                    setConfirmAcceptOffer(null);
                                    setViewOfferLetterModal(targetOffer);
                                }}
                                style={{ padding: "10px 22px", backgroundColor: "#16a34a", color: "#ffffff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(22, 163, 74, 0.3)" }}
                            >
                                Confirm Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ⚠️ Decline Offer Confirmation Modal */}
            {confirmDeclineOffer && (
                <div
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setConfirmDeclineOffer(null);
                    }}
                    style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}
                >
                    <div style={{ backgroundColor: "#ffffff", borderRadius: "18px", width: "100%", maxWidth: "480px", padding: "28px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", marginBottom: "16px" }}>
                            ⚠️
                        </div>
                        <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
                            Decline Placement Offer?
                        </h3>
                        <p style={{ fontSize: "14px", color: "#475569", margin: "0 0 16px 0", lineHeight: "1.5" }}>
                            Are you sure you want to decline the placement offer from <strong>{confirmDeclineOffer.companyName}</strong> for the role of <strong>{confirmDeclineOffer.jobRole}</strong>?
                        </p>
                        <div style={{ backgroundColor: "#fff7ed", padding: "12px 16px", borderRadius: "10px", border: "1px solid #ffedd5", fontSize: "12px", color: "#c2410c", marginBottom: "24px" }}>
                            ⚠️ <strong>Warning:</strong> Declining an offer will mark your decision as <strong>Offer Declined</strong> in your Placement Selection Summary and notify the placement office.
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                            <button
                                type="button"
                                onClick={() => setConfirmDeclineOffer(null)}
                                style={{ padding: "10px 20px", backgroundColor: "#ffffff", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                            >
                                Keep Offer
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    handleUpdateStatus(confirmDeclineOffer.id, "Offer Declined");
                                    setConfirmDeclineOffer(null);
                                }}
                                style={{ padding: "10px 22px", backgroundColor: "#dc2626", color: "#ffffff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "800", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(220, 38, 38, 0.3)" }}
                            >
                                Confirm Decline
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 📄 Official Offer Letter Preview & Download Modal (Shown immediately upon acceptance or via View Offer) */}
            {viewOfferLetterModal && (
                <div
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setViewOfferLetterModal(null);
                    }}
                    style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}
                >
                    <div style={{ backgroundColor: "#ffffff", borderRadius: "18px", width: "100%", maxWidth: "680px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)", overflow: "hidden" }}>
                        {/* Modal Header */}
                        <div style={{ padding: "18px 24px", backgroundColor: "#0f172a", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>🏢 {viewOfferLetterModal.companyName} — Official Offer Letter</h3>
                                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                                    Ref: CPMS/OFFER/2026/{viewOfferLetterModal.id} • Issued: 22 August 2026
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewOfferLetterModal(null)}
                                style={{ backgroundColor: "rgba(255,255,255,0.1)", border: "none", color: "#ffffff", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body: Document Preview */}
                        <div style={{ padding: "24px", overflowY: "auto", flex: 1, backgroundColor: "#f8fafc" }}>
                            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "28px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.03)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #0f172a", paddingBottom: "14px", marginBottom: "18px" }}>
                                    <div>
                                        <div style={{ fontSize: "14px", fontWeight: "800", color: "#0f172a", letterSpacing: "0.5px" }}>COLLEGE PLACEMENT MANAGEMENT SYSTEM</div>
                                        <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>DIRECTORATE OF CAREER GUIDANCE & PLACEMENT CELL</div>
                                    </div>
                                    <span style={{ fontSize: "11px", fontWeight: "800", backgroundColor: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "10px" }}>
                                        ✓ Offer Accepted
                                    </span>
                                </div>

                                <div style={{ fontSize: "13px", color: "#334155", lineHeight: "1.6" }}>
                                    <p style={{ margin: "0 0 12px 0" }}>Dear <strong>{viewOfferLetterModal.studentName || user?.name || "Ashwanth"}</strong> (Reg No: <strong>{viewOfferLetterModal.regNo || user?.regNo || "22CSR025"}</strong>),</p>
                                    <p style={{ margin: "0 0 16px 0" }}>
                                        We are pleased to confirm that following your performance in <strong>{viewOfferLetterModal.finalRound}</strong>, <strong>{viewOfferLetterModal.companyName}</strong> has formally selected you for the position of <strong>{viewOfferLetterModal.jobRole}</strong>.
                                    </p>

                                    <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #eaedf0", margin: "16px 0" }}>
                                        <div style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", marginBottom: "10px" }}>Appointment Terms</div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px" }}>
                                            <div><strong>Company:</strong> {viewOfferLetterModal.companyName}</div>
                                            <div><strong>Role:</strong> {viewOfferLetterModal.jobRole}</div>
                                            <div><strong>Joining Date:</strong> 15 September 2026</div>
                                            <div><strong>Location:</strong> Corporate Headquarters</div>
                                            <div><strong>Selection Status:</strong> Passed ({viewOfferLetterModal.finalRound})</div>
                                            <div><strong>Offer Status:</strong> <span style={{ color: "#16a34a", fontWeight: "700" }}>Offer Accepted ✓</span></div>
                                        </div>
                                    </div>

                                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                                        Authorized Signatory: Head of Placement Cell / Placement Directorate. This letter serves as official verification of your campus placement appointment.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", backgroundColor: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: "700" }}>
                                ✓ Offer Accepted & Verified
                            </span>
                            <div style={{ display: "flex", gap: "12px" }}>
                                <button
                                    type="button"
                                    onClick={() => setViewOfferLetterModal(null)}
                                    style={{ padding: "9px 18px", backgroundColor: "#ffffff", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                                >
                                    Close Preview
                                </button>
                                <button
                                    type="button"
                                    onClick={() => generateOfficialOfferPDF(viewOfferLetterModal)}
                                    style={{ padding: "9px 20px", backgroundColor: "#16a34a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "800", cursor: "pointer", boxShadow: "0 2px 4px rgba(22, 163, 74, 0.2)", display: "flex", alignItems: "center", gap: "6px" }}
                                >
                                    📥 Download Official PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SelectionsManagement;
