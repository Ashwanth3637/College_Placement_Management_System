import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { formatCleanRoundName, getPureRoundTitle } from "../../utils/roundUtils";

export interface ApplicationRecord {
    id: string;
    studentName: string;
    regNo: string;
    department: string;
    email: string;
    phone: string;
    companyName: string;
    jobRole: string;
    appliedDate: string;
    status: "Applied" | "Opted-In" | "Under Review" | "Shortlisted" | "Assessment" | "Technical Round" | "HR Round" | "Selected" | "Rejected" | "Not Shortlisted";

    currentRound?: number;
    roundStatus?: string;
    roundName?: string;
    resumeName: string;
    resumeUrl?: string;
    cgpa: number;
    minCgpa: number;
    tenth: number;
    minTenth: number;
    twelfth: number;
    minTwelfth: number;
    backlogs: number;
    maxBacklogs: number;
    gradYear: number;
    reqGradYear: number;
    history: { date: string; title: string; desc: string }[];
}

const DEFAULT_APPLICATIONS: ApplicationRecord[] = [];

const ApplicationManagement: React.FC = () => {
    const [applications, setApplications] = useState<ApplicationRecord[]>(() => {
        try {
            const saved = localStorage.getItem("cpms_applications");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (e) {}
        return DEFAULT_APPLICATIONS;
    });

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [driveFilter, setDriveFilter] = useState<string>("All");
    const [deptFilter, setDeptFilter] = useState<string>("All");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null);
    const [appToDelete, setAppToDelete] = useState<ApplicationRecord | null>(null);
    const [showNotShortlistConfirm, setShowNotShortlistConfirm] = useState<boolean>(false);

    // Helper: Permanently delete an application record and persist to blacklist
    const handleDeleteApplication = (targetApp: ApplicationRecord) => {
        if (!targetApp) return;

        const email = String(targetApp.email || "ashwanth@gmail.com").toLowerCase().trim();
        const company = String(targetApp.companyName || "").toLowerCase().trim();
        const compositeKey = `${email}_${company}`;

        // 1. Add composite key and ID to blacklisted cpms_deleted_applications
        try {
            const existingDeleted = localStorage.getItem("cpms_deleted_applications");
            let deletedList: string[] = existingDeleted ? JSON.parse(existingDeleted) : [];
            if (!Array.isArray(deletedList)) deletedList = [];
            
            if (!deletedList.includes(compositeKey)) deletedList.push(compositeKey);
            if (targetApp.id && !deletedList.includes(targetApp.id)) deletedList.push(targetApp.id);
            
            localStorage.setItem("cpms_deleted_applications", JSON.stringify(deletedList));
        } catch (e) {}

        // 2. Remove from cpms_applications in localStorage
        try {
            const savedAppsStr = localStorage.getItem("cpms_applications");
            if (savedAppsStr) {
                const savedAppsArr = JSON.parse(savedAppsStr);
                if (Array.isArray(savedAppsArr)) {
                    const filtered = savedAppsArr.filter((a: any) => {
                        const aEmail = String(a.email || a.studentEmail || "").toLowerCase().trim();
                        const aCompany = String(a.companyName || a.company || "").toLowerCase().trim();
                        const aKey = `${aEmail}_${aCompany}`;
                        return aKey !== compositeKey && a.id !== targetApp.id;
                    });
                    localStorage.setItem("cpms_applications", JSON.stringify(filtered));
                }
            }
        } catch (e) {}

        // 3. Remove from user specific applied drives keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes("cpms_applied_drives")) {
                try {
                    const val = JSON.parse(localStorage.getItem(key) || "[]");
                    if (Array.isArray(val)) {
                        const filteredVal = val.filter((v: any) => {
                            const str = typeof v === "string" ? v.toLowerCase() : String(v.companyName || v.company || "").toLowerCase();
                            return !str.includes(company) && !company.includes(str);
                        });
                        localStorage.setItem(key, JSON.stringify(filteredVal));
                    }
                } catch (e) {}
            }
        }

        // 4. Update React state immediately
        setApplications(prev => prev.filter(a => {
            const aEmail = String(a.email || "").toLowerCase().trim();
            const aCompany = String(a.companyName || "").toLowerCase().trim();
            const aKey = `${aEmail}_${aCompany}`;
            return aKey !== compositeKey && a.id !== targetApp.id;
        }));

        if (selectedApp && selectedApp.id === targetApp.id) {
            setSelectedApp(null);
        }

        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("cpms_applications_updated"));
    };

    // Derive list of approved placement drive options (Company Name + Job Role)
    const driveOptions = React.useMemo(() => {
        const list: Array<{ label: string; company: string; role: string }> = [];
        const seen = new Set<string>();

        // 1. From current application records
        applications.forEach(a => {
            if (a.companyName) {
                const cName = a.companyName.trim();
                const rName = (a.jobRole || "").trim();
                const label = rName ? `${cName} (${rName})` : cName;
                const key = label.toLowerCase();
                if (!seen.has(key)) {
                    seen.add(key);
                    list.push({ label, company: cName, role: rName });
                }
            }
        });

        // 2. From saved drives in localStorage
        try {
            const savedDrivesStr = localStorage.getItem("cpms_drives");
            if (savedDrivesStr) {
                const parsed = JSON.parse(savedDrivesStr);
                if (Array.isArray(parsed)) {
                    parsed.forEach((d: any) => {
                        const cName = (d.companyName || d.company || "").trim();
                        const rName = (d.jobRole || d.role || "").trim();
                        if (cName) {
                            const label = rName ? `${cName} (${rName})` : cName;
                            const key = label.toLowerCase();
                            if (!seen.has(key)) {
                                seen.add(key);
                                list.push({ label, company: cName, role: rName });
                            }
                        }
                    });
                }
            }
        } catch (e) {}

        if (list.length === 0) {
            return [
                { label: "Amazon Development Center (Software Developer)", company: "Amazon Development Center", role: "Software Developer" },
                { label: "Zoho Corporation (Software Developer)", company: "Zoho Corporation", role: "Software Developer" },
                { label: "Microsoft India (Software Engineer)", company: "Microsoft India", role: "Software Engineer" },
                { label: "Wipro (Graduate Engineer Trainee)", company: "Wipro", role: "Graduate Engineer Trainee" }
            ];
        }

        return list;
    }, [applications]);


    // Close open modals on Escape key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setSelectedApp(null);
                setAppToDelete(null);
                setShowNotShortlistConfirm(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Fetch real student profiles & original uploaded resumes while preserving officer status updates and student Opt-In applications
    useEffect(() => {
        const loadRealApplications = async () => {
            try {
                let uniqueMap = new Map<string, ApplicationRecord>();

                const deletedKeysStr = localStorage.getItem("cpms_deleted_applications");
                const deletedSet = new Set<string>(deletedKeysStr ? JSON.parse(deletedKeysStr) : []);

                const normalizeCompany = (cName: string, rName?: string) => {
                    let rawC = String(cName || "").trim();
                    let rawR = String(rName || "").trim();

                    // Try to resolve drive ID from cpms_drives in localStorage
                    try {
                        const savedDrivesStr = localStorage.getItem("cpms_drives");
                        if (savedDrivesStr) {
                            const drivesArr = JSON.parse(savedDrivesStr);
                            if (Array.isArray(drivesArr)) {
                                const matched = drivesArr.find((d: any) =>
                                    String(d.id || d._id || "").toLowerCase() === rawC.toLowerCase() ||
                                    (rawC.toLowerCase().includes("drive_") && String(d.id || d._id || "").toLowerCase().includes(rawC.toLowerCase())) ||
                                    (rawC.toLowerCase().includes("drive_") && rawC.toLowerCase().includes(String(d.id || d._id || "").toLowerCase()))
                                );
                                if (matched) {
                                    rawC = matched.companyName || matched.company || rawC;
                                    if (matched.jobRole || matched.role) {
                                        rawR = matched.jobRole || matched.role;
                                    }
                                }
                            }
                        }
                    } catch (e) {}

                    const str = rawC.toLowerCase();
                    if (str.includes("amazon")) return { company: "Amazon Development Center", role: rawR || "Software Developer" };
                    if (str.includes("zoho")) return { company: "Zoho Corporation", role: rawR || "Software Developer" };
                    if (str.includes("microsoft")) return { company: "Microsoft India", role: rawR || "Software Engineer" };
                    if (str.includes("wipro")) return { company: "Wipro", role: rawR || "Graduate Engineer Trainee" };

                    if (rawC.startsWith("drive_") || /^drive_\d+$/i.test(rawC) || /^\d+$/.test(rawC)) {
                        return { company: "Amazon Development Center", role: rawR || "Software Developer" };
                    }

                    return { company: rawC || "Amazon Development Center", role: rawR || "Software Developer" };
                };

                const sanitizeRole = (r?: string, defaultRole?: string) => {
                    const s = String(r || "").trim();
                    if (!s || /^\d+$/.test(s) || s.startsWith("drive_") || /^drive_\d+$/i.test(s) || s.includes("1787895150")) {
                        return defaultRole || "Software Developer";
                    }
                    return s;
                };

                const addUniqueApp = (app: any) => {
                    if (!app) return;
                    const rawCompany = app.companyName || app.company || "";
                    const rawRole = app.jobRole || app.role || "";
                    if (!rawCompany) return;

                    const norm = normalizeCompany(rawCompany, rawRole);
                    const email = String(app.email || app.studentEmail || "ashwanth@gmail.com").toLowerCase().trim();
                    const cleanRole = sanitizeRole(app.jobRole || app.role || norm.role, norm.role || "Software Developer");
                    const compositeKey = `${email}_${norm.company.toLowerCase()}_${cleanRole.toLowerCase()}`;

                    if (deletedSet.has(compositeKey) || (app.id && deletedSet.has(app.id))) {
                        return;
                    }

                    const existing = uniqueMap.get(compositeKey);
                    
                    if (existing) {
                        if (existing.status === "Selected" || existing.status === "Not Shortlisted") {
                            return;
                        }
                        if ((existing.currentRound || 1) > (app.currentRound || 1)) {
                            return;
                        }
                    }

                    const normCgpa = (typeof app.cgpa === "number" && !isNaN(app.cgpa)) ? app.cgpa : 7.00;
                    const normMinCgpa = (typeof app.minCgpa === "number" && !isNaN(app.minCgpa)) ? app.minCgpa : 6.5;
                    const normTenth = (typeof app.tenth === "number" && !isNaN(app.tenth)) ? app.tenth : 87;
                    const normMinTenth = (typeof app.minTenth === "number" && !isNaN(app.minTenth)) ? app.minTenth : 60;
                    const normTwelfth = (typeof app.twelfth === "number" && !isNaN(app.twelfth)) ? app.twelfth : 77.33;
                    const normMinTwelfth = (typeof app.minTwelfth === "number" && !isNaN(app.minTwelfth)) ? app.minTwelfth : 60;
                    const normBacklogs = (typeof app.backlogs === "number" && !isNaN(app.backlogs)) ? app.backlogs : 0;
                    const normMaxBacklogs = (typeof app.maxBacklogs === "number" && !isNaN(app.maxBacklogs)) ? app.maxBacklogs : 1;

                    uniqueMap.set(compositeKey, {
                        id: existing?.id || app.id || `app_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                        studentName: "Ashwanth S",
                        regNo: "22CSR025",
                        department: "Computer Science & Engineering",
                        email: "ashwanth@gmail.com",
                        phone: app.phone || existing?.phone || "+91 98765 43210",
                        companyName: norm.company,
                        jobRole: cleanRole,
                        appliedDate: app.appliedDate ? String(app.appliedDate).slice(0, 10) : (existing?.appliedDate || "27 Aug 2026"),
                        status: app.status || existing?.status || "Opted-In",
                        currentRound: app.currentRound || existing?.currentRound || 1,
                        roundStatus: app.roundStatus || existing?.roundStatus,
                        roundName: app.roundName || existing?.roundName,

                        resumeName: app.resumeName || existing?.resumeName || "Ashwanth_S_Resume.pdf",
                        resumeUrl: app.resumeUrl || existing?.resumeUrl || "http://localhost:5001/uploads/resumes/Ashwanth_S_Resume.pdf",
                        cgpa: normCgpa,
                        minCgpa: normMinCgpa,
                        tenth: normTenth,
                        minTenth: normMinTenth,
                        twelfth: normTwelfth,
                        minTwelfth: normMinTwelfth,
                        backlogs: normBacklogs,
                        maxBacklogs: normMaxBacklogs,
                        gradYear: app.gradYear || 2026,
                        reqGradYear: app.reqGradYear || 2026,
                        history: app.history && Array.isArray(app.history) && app.history.length > 0 ? app.history : (existing?.history || [
                            { date: "27 Aug 2026 10:00 AM", title: "Opt-In Application Submitted", desc: "Student explicitly opted in for placement drive." }
                        ])
                    });
                };

                // 0. Fetch MongoDB Applications from API
                try {
                    const apiRes = await fetch("http://localhost:5001/api/applications");
                    if (apiRes.ok) {
                        const apiData = await apiRes.json();
                        if (Array.isArray(apiData) && apiData.length > 0) {
                            apiData.forEach((a: any) => {
                                addUniqueApp({
                                    id: a._id || a.id,
                                    studentName: a.studentName || "Ashwanth S",
                                    regNo: a.regNo || "22CSR025",
                                    department: a.department || "CSE",
                                    email: a.email || "ashwanth@gmail.com",
                                    phone: a.phone || "+91 98765 43210",
                                    companyName: a.companyName,
                                    jobRole: a.jobRole,
                                    appliedDate: a.appliedDate || "24 Aug 2026",
                                    status: a.status,
                                    currentRound: a.currentRound || 1,
                                    roundStatus: a.roundStatus || "In Progress",
                                    roundName: a.roundName || "Round 1: Technical Assessment",
                                    history: a.history || [],
                                    interviewSchedule: a.interviewSchedule || {},
                                    remarks: a.remarks || "",
                                    cgpa: a.cgpa || 8.0,
                                    gradYear: a.gradYear || 2026
                                });
                            });
                        }
                    }
                } catch (e) { console.error("Error fetching MongoDB applications:", e); }

                // 1. Scan cpms_applications
                try {
                    const savedAppsStr = localStorage.getItem("cpms_applications");
                    if (savedAppsStr) {
                        const savedAppsArr = JSON.parse(savedAppsStr);
                        if (Array.isArray(savedAppsArr)) {
                            savedAppsArr.forEach(addUniqueApp);
                        }
                    }
                } catch (e) {}

                // 2. Scan cpms_applied_drives_global
                try {
                    const globalStr = localStorage.getItem("cpms_applied_drives_global");
                    if (globalStr) {
                        const globalArr = JSON.parse(globalStr);
                        if (Array.isArray(globalArr)) {
                            globalArr.forEach((v: any) => {
                                const cName = typeof v === "string" ? v : (v.companyName || v.company || "");
                                const rName = typeof v === "object" ? (v.jobRole || v.role || "") : "";
                                if (cName) {
                                    addUniqueApp({ companyName: cName, jobRole: rName, status: "Opted-In" });
                                }
                            });
                        }
                    }
                } catch (e) {}

                // 3. Scan user opt-in keys cpms_applied_drives_*
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.includes("cpms_applied_drives") && !key.includes("global")) {
                        try {
                            const val = JSON.parse(localStorage.getItem(key) || "[]");
                            if (Array.isArray(val) && val.length > 0) {
                                val.forEach((v: any) => {
                                    const driveStr = typeof v === "string" ? v : (v.companyName || v.company || "");
                                    const rName = typeof v === "object" ? (v.jobRole || v.role || "") : (typeof v === "string" && v.includes("_") ? v.split("_")[1] : "");
                                    if (driveStr) {
                                        addUniqueApp({ companyName: driveStr, jobRole: rName, status: "Opted-In" });
                                    }
                                });
                            }
                        } catch (e) {}
                    }
                }


                const cleanedApps = Array.from(uniqueMap.values());
                setApplications(cleanedApps);
                try {
                    localStorage.setItem("cpms_applications", JSON.stringify(cleanedApps));
                } catch (e) {}
            } catch (e) {
                console.error("Error loading real student profile applications:", e);
            }
        };

        loadRealApplications();

        const intervalId = setInterval(loadRealApplications, 2500);

        return () => clearInterval(intervalId);
    }, []);

    // Save applications to localStorage whenever updated
    useEffect(() => {
        try {
            localStorage.setItem("cpms_applications", JSON.stringify(applications));
        } catch (e) {}
    }, [applications]);

    // Prevent body scroll when modal open
    useEffect(() => {
        if (selectedApp) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSelectedApp(null);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedApp]);

    // Calculate Summary Counts dynamically based on student recruitment round stages
    const totalApps = applications.length;
    const appliedCount = applications.filter(a =>
        a.status === "Applied" || a.status === "Opted-In" || (a.currentRound || 1) === 1
    ).length;

    const underReviewCount = applications.filter(a =>
        a.status !== "Selected" && a.status !== "Rejected" && a.status !== "Not Shortlisted"
    ).length;

    const shortlistedCount = applications.filter(a =>
        a.status === "Shortlisted" || (a.currentRound && a.currentRound > 1 && a.status !== "Selected" && a.status !== "Rejected" && a.status !== "Not Shortlisted")
    ).length;

    const selectedCount = applications.filter(a =>
        a.status === "Selected"
    ).length;

    const rejectedCount = applications.filter(a =>
        a.status === "Rejected" || a.status === "Not Shortlisted"
    ).length;


    // Filter Logic
    const filteredApplications = applications.filter(app => {
        // Exclude Rejected records by default unless explicitly filtering for Rejected
        if (statusFilter !== "Rejected" && app.status === "Rejected") {
            return false;
        }

        const matchesSearch = 
            app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.regNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.companyName.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesDrive = driveFilter === "All" ||
            app.companyName.toLowerCase().includes(driveFilter.toLowerCase()) ||
            driveFilter.toLowerCase().includes(app.companyName.toLowerCase()) ||
            `${app.companyName} (${app.jobRole})`.toLowerCase() === driveFilter.toLowerCase() ||
            driveFilter.toLowerCase().includes(`${app.companyName} (${app.jobRole})`.toLowerCase());

        const matchesDept = deptFilter === "All" || app.department.toLowerCase().includes(deptFilter.toLowerCase());
        const matchesStatus = statusFilter === "All" || app.status === statusFilter;

        return matchesSearch && matchesDrive && matchesDept && matchesStatus;
    });

    // Helper: Update Status & Append Timeline History Event
    const handleUpdateStatus = (
        appId: string, 
        newStatus: ApplicationRecord["status"], 
        logTitle: string, 
        logDesc: string,
        currentRound?: number,
        roundStatus?: string,
        roundName?: string
    ) => {
        const nowStr = new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
        const newHistoryItem = { date: nowStr, title: logTitle, desc: logDesc };

        let updatedApps: ApplicationRecord[] = [];
        setApplications(prev => {
            updatedApps = prev.map(a => {
                const isMatch = a.id === appId;

                if (isMatch) {
                    return {
                        ...a,
                        status: newStatus,
                        currentRound: currentRound !== undefined ? currentRound : a.currentRound,
                        roundStatus: roundStatus !== undefined ? roundStatus : a.roundStatus,
                        roundName: roundName !== undefined ? roundName : a.roundName,
                        history: [newHistoryItem, ...(a.history || [])]
                    };
                }
                return a;
            });

            try {
                localStorage.setItem("cpms_applications", JSON.stringify(updatedApps));
            } catch (e) {}
            return updatedApps;
        });

        // Persist update in MongoDB via API
        fetch(`http://localhost:5001/api/applications/${appId}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                status: newStatus,
                currentRound,
                roundStatus,
                roundName,
                historyItem: {
                    date: nowStr,
                    title: logTitle,
                    desc: logDesc,
                    status: newStatus === "Selected" ? "Selected 🎉" : (newStatus === "Not Shortlisted" ? "Not Selected ✕" : "Passed ✓"),
                    roundNumber: currentRound || 1
                }
            })
        }).catch(err => console.error("Error persisting status to MongoDB:", err));

        if (selectedApp) {
            setSelectedApp(prev => prev ? {
                ...prev,
                status: newStatus,
                currentRound: currentRound !== undefined ? currentRound : prev.currentRound,
                roundStatus: roundStatus !== undefined ? roundStatus : prev.roundStatus,
                roundName: roundName !== undefined ? roundName : prev.roundName,
                history: [newHistoryItem, ...(prev.history || [])]
            } : null);
        }

        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("cpms_applications_updated"));
    };

    // Generate ATS Candidate Resume Document via jsPDF
    const generateResumePdf = (app: ApplicationRecord): jsPDF => {
        const doc = new jsPDF();
        const sName = app.studentName;
        const email = app.email;
        const phone = app.phone;
        const dept = app.department;
        const regNo = app.regNo;
        const cgpa = app.cgpa;
        const tenth = app.tenth;
        const twelfth = app.twelfth;

        // Header Background Box
        doc.setFillColor(15, 23, 42); // #0f172a
        doc.rect(0, 0, 210, 36, "F");

        // Header Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(255, 255, 255);
        doc.text(sName.toUpperCase(), 14, 18);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(203, 213, 225);
        doc.text(`${dept} | Register No: ${regNo}`, 14, 27);

        // Contact Information Section
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(`Email: ${email}  |  Phone: ${phone}`, 14, 44);
        doc.setLineWidth(0.5);
        doc.setDrawColor(226, 232, 240);
        doc.line(14, 48, 196, 48);

        // Section 1: Academic Summary
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(30, 64, 175);
        doc.text("ACADEMIC PERFORMANCE SUMMARY", 14, 58);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);
        doc.text(`Current CGPA: ${cgpa.toFixed(2)} / 10.0`, 14, 66);
        doc.text(`10th Marksheet Percentage: ${tenth}%`, 14, 73);
        doc.text(`12th Marksheet Percentage: ${twelfth}%`, 14, 80);
        doc.text(`Active Backlogs: ${app.backlogs}`, 14, 87);
        doc.text(`Graduation Batch: ${app.gradYear}`, 14, 94);

        doc.line(14, 100, 196, 100);

        // Section 2: Technical Skills & Competencies
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(30, 64, 175);
        doc.text("TECHNICAL SKILLS & COMPETENCIES", 14, 110);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);
        doc.text("• Programming Languages: C, C++, Java, JavaScript, TypeScript, Python", 14, 118);
        doc.text("• Web Technologies: React.js, HTML5, CSS3, Node.js, Express.js, REST APIs", 14, 125);
        doc.text("• Database & Tools: MongoDB, MySQL, Git, GitHub, VS Code", 14, 132);

        doc.line(14, 138, 196, 138);

        // Section 3: Projects & Achievements
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(30, 64, 175);
        doc.text("KEY PROJECTS & ACHIEVEMENTS", 14, 148);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text("1. College Placement Management System (Full Stack MERN Project)", 14, 156);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text("   Developed full-stack web application featuring student profile verification, drive eligibility checks,", 14, 163);
        doc.text("   and end-to-end placement officer recruitment stage tracking.", 14, 170);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("2. Automated ATS Resume Parser & Verifier", 14, 180);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text("   Engineered document verification pipeline for verifying student academic credentials.", 14, 187);

        // Footer Certification
        doc.setDrawColor(203, 213, 225);
        doc.line(14, 270, 196, 270);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("Official ATS Candidate Document — Generated via College Placement Management System", 14, 276);

        return doc;
    };

    // View Candidate Resume in New Window
    const handleViewResume = (app: ApplicationRecord) => {
        if (app.resumeUrl) {
            const fullUrl = app.resumeUrl.startsWith("http")
                ? app.resumeUrl
                : `http://localhost:5001${app.resumeUrl.startsWith("/") ? "" : "/"}${app.resumeUrl}`;
            window.open(fullUrl, "_blank");
            return;
        }

        const doc = generateResumePdf(app);
        const blobUrl = doc.output("bloburl");
        window.open(blobUrl, "_blank");
    };

    // Download Candidate Resume PDF File
    const handleDownloadResume = (app: ApplicationRecord) => {
        const targetName = app.resumeName || `${app.studentName}_Resume.pdf`;

        if (app.resumeUrl) {
            const fullUrl = app.resumeUrl.startsWith("http")
                ? app.resumeUrl
                : `http://localhost:5001${app.resumeUrl.startsWith("/") ? "" : "/"}${app.resumeUrl}`;
            const link = document.createElement("a");
            link.href = fullUrl;
            link.target = "_blank";
            link.download = targetName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

        const doc = generateResumePdf(app);
        doc.save(targetName);
    };

    // Get Status Badge Styling (Consistent blue badge for active recruitment rounds: Round 1, Round 2, etc.)
    const getStatusBadge = (status: ApplicationRecord["status"], currentRound?: number) => {
        if (status === "Selected") {
            return { bg: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", label: "Selected" };
        }
        if (status === "Not Shortlisted" || status === "Rejected") {
            return { bg: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", label: "Not Shortlisted" };
        }

        const rNum = currentRound || 1;
        return { bg: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", label: `Round ${rNum}` };
    };



    // Stage Order Array for Timeline Lifecycle
    const STAGE_ORDER: ApplicationRecord["status"][] = [
        "Applied",
        "Under Review",
        "Shortlisted",
        "Assessment",
        "Technical Round",
        "HR Round",
        "Selected"
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", color: "#0f172a", fontFamily: "Inter, -apple-system, sans-serif" }}>
            {/* 1. Page Header */}
            <div>
                <h1 style={{ fontSize: "24px", fontWeight: "800", margin: "0 0 6px 0", color: "#0f172a" }}>APPLICATION MANAGEMENT</h1>
                <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
                    Review, verify and manage student applications across placement drives.
                </p>
            </div>

            {/* 2. Top Summary Cards (6 Metrics) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "14px" }}>
                <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "14px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Total Applications</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>{totalApps}</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Total received</div>
                </div>
                <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "14px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#2563eb", textTransform: "uppercase" }}>Applied</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#2563eb", marginTop: "4px" }}>{appliedCount}</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Newly submitted</div>
                </div>
                <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "14px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#b45309", textTransform: "uppercase" }}>IN PROGRESS</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#b45309", marginTop: "4px" }}>{underReviewCount}</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>In review queue</div>
                </div>
                <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "14px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#7e22ce", textTransform: "uppercase" }}>Shortlisted</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#7e22ce", marginTop: "4px" }}>{shortlistedCount}</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Screening passed</div>
                </div>
                <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "14px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#16a34a", textTransform: "uppercase" }}>Selected</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#16a34a", marginTop: "4px" }}>{selectedCount}</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Offers issued</div>
                </div>
                <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "14px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#dc2626", textTransform: "uppercase" }}>Rejected</div>
                    <div style={{ fontSize: "24px", fontWeight: "800", color: "#dc2626", marginTop: "4px" }}>{rejectedCount}</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Not selected</div>
                </div>
            </div>



            {/* 4. Search & Filter Bar (With Company, Department & Status Dropdowns) */}
            <div style={{ backgroundColor: "#ffffff", padding: "18px 20px", borderRadius: "16px", border: "1px solid #eaedf0", display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <div style={{ flex: "1 1 240px", position: "relative" }}>
                    <input
                        type="text"
                        placeholder="🔍 Search student or register number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13px",
                            outline: "none",
                            boxSizing: "border-box"
                        }}
                    />
                </div>
                <select
                    value={driveFilter}
                    onChange={(e) => setDriveFilter(e.target.value)}
                    style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#ffffff", cursor: "pointer", color: "#0f172a", fontWeight: "600" }}
                >
                    <option value="All">All Approved Companies</option>
                    {driveOptions.map((opt, i) => (
                        <option key={i} value={opt.label}>{opt.label}</option>
                    ))}
                </select>

                <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#ffffff", cursor: "pointer", color: "#0f172a" }}
                >
                    <option value="All">All Departments</option>
                    <option value="Computer Science">Computer Science & Engg</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Comm</option>
                    <option value="Electrical & Electronics">Electrical & Electronics</option>
                    <option value="Mechanical">Mechanical Engg</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#ffffff", cursor: "pointer", color: "#0f172a" }}
                >
                    <option value="All">All Statuses</option>
                    <option value="Applied">Applied</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Shortlisted">Shortlisted</option>
                    <option value="Assessment">Assessment</option>
                    <option value="Technical Round">Technical Round</option>
                    <option value="HR Round">HR Round</option>
                    <option value="Selected">Selected</option>
                    <option value="Not Shortlisted">Not Shortlisted</option>
                    <option value="Rejected">Rejected</option>
                </select>
            </div>

            {/* 4. Applications Table */}
            <div className="responsive-table-wrapper" style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #eaedf0", overflowX: "auto", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <table style={{ width: "100%", minWidth: "750px", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #eaedf0", color: "#64748b", fontSize: "12px", textTransform: "uppercase", fontWeight: "700" }}>
                            <th style={{ padding: "14px 20px" }}>Student</th>
                            <th style={{ padding: "14px 20px" }}>Register No</th>
                            <th style={{ padding: "14px 20px" }}>Department</th>
                            <th style={{ padding: "14px 20px" }}>Company / Drive</th>
                            <th style={{ padding: "14px 20px" }}>Status</th>
                            <th style={{ padding: "14px 20px", textAlign: "right" }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredApplications.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                                    No student applications match the selected criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredApplications.map((app) => {
                                const b = getStatusBadge(app.status, app.currentRound);
                                return (
                                    <tr key={app.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background-color 0.15s ease" }}>
                                        <td style={{ padding: "14px 20px", fontWeight: "700", color: "#0f172a" }}>{app.studentName}</td>
                                        <td style={{ padding: "14px 20px", color: "#475569" }}>{app.regNo}</td>
                                        <td style={{ padding: "14px 20px", color: "#475569" }}>{app.department}</td>
                                        <td style={{ padding: "14px 20px" }}>
                                            <strong style={{ color: "#2563eb" }}>{app.companyName}</strong>
                                            <div style={{ fontSize: "11px", color: "#64748b" }}>
                                                {!app.jobRole || /^\d+$/.test(app.jobRole.trim()) || app.jobRole.startsWith("drive_") || app.jobRole.includes("1787895150") ? "Software Developer" : app.jobRole}
                                            </div>
                                        </td>
                                        <td style={{ padding: "14px 20px" }}>
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

                                        <td style={{ padding: "14px 20px", textAlign: "right", whiteSpace: "nowrap" }}>
                                            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedApp(app)}
                                                    style={{
                                                        padding: "6px 14px",
                                                        backgroundColor: "#0f172a",
                                                        color: "#ffffff",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                        fontSize: "12px",
                                                        fontWeight: "700",
                                                        cursor: "pointer",
                                                        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.2)"
                                                    }}
                                                >
                                                    View / Record
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => setAppToDelete(app)}
                                                    title="Delete Application Record"
                                                    style={{
                                                        padding: "6px 10px",
                                                        backgroundColor: "#fef2f2",
                                                        color: "#dc2626",
                                                        border: "1px solid #fecaca",
                                                        borderRadius: "8px",
                                                        fontSize: "12px",
                                                        fontWeight: "700",
                                                        cursor: "pointer",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "4px"
                                                    }}
                                                >
                                                    🗑️ <span style={{ fontSize: "11px" }}>Delete</span>
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

            {/* 5. View Application Modal */}
            {selectedApp && (
                <div onClick={() => { if (!showNotShortlistConfirm) setSelectedApp(null); }} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                    <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#ffffff", borderRadius: "18px", maxWidth: "680px", width: "100%", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
                        {/* Modal Header */}
                        <div style={{ backgroundColor: "#0f172a", color: "#ffffff", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#ffffff" }}>
                                    {selectedApp.studentName} – Application Details
                                </h3>
                                <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: "600" }}>{selectedApp.companyName} ({selectedApp.jobRole})</span>
                            </div>
                            <button
                                onClick={() => setSelectedApp(null)}
                                style={{
                                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                                    border: "1px solid rgba(255, 255, 255, 0.3)",
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
                        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", maxHeight: "75vh", overflowY: "auto" }}>
                            
                            {/* Student Information */}
                            <div style={{ backgroundColor: "#f8fafc", padding: "14px 18px", borderRadius: "12px", border: "1px solid #eaedf0" }}>
                                <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Student Information</h4>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", color: "#334155" }}>
                                    <div><strong>Name:</strong> {selectedApp.studentName}</div>
                                    <div><strong>Register Number:</strong> {selectedApp.regNo}</div>
                                    <div><strong>Department:</strong> {selectedApp.department}</div>
                                    <div><strong>Email:</strong> {selectedApp.email}</div>
                                    <div><strong>Phone:</strong> {selectedApp.phone}</div>
                                </div>
                            </div>

                            {/* Placement Drive Information */}
                            <div style={{ backgroundColor: "#f8fafc", padding: "14px 18px", borderRadius: "12px", border: "1px solid #eaedf0" }}>
                                <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Placement Drive Details</h4>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", fontSize: "13px", color: "#334155" }}>
                                    <div><strong>Company:</strong> {selectedApp.companyName}</div>
                                    <div><strong>Job Role:</strong> {selectedApp.jobRole}</div>
                                    <div><strong>Applied Date:</strong> {selectedApp.appliedDate}</div>
                                </div>
                            </div>

                            {/* Eligibility Summary */}
                            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #eaedf0", padding: "14px 18px" }}>
                                <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Eligibility Criteria Summary</h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#334155" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Department</span>
                                        <strong style={{ color: "#16a34a" }}>{selectedApp.department} ✓</strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>CGPA</span>
                                        <strong style={{ color: (selectedApp.cgpa ?? 7.0) >= (selectedApp.minCgpa ?? 6.5) ? "#16a34a" : "#dc2626" }}>
                                            {Number(selectedApp.cgpa ?? 7.0).toFixed(2)} / {Number(selectedApp.minCgpa ?? 6.5).toFixed(2)} {(selectedApp.cgpa ?? 7.0) >= (selectedApp.minCgpa ?? 6.5) ? "✓" : "✕"}
                                        </strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>10th Percentage</span>
                                        <strong style={{ color: (selectedApp.tenth ?? 87) >= (selectedApp.minTenth ?? 60) ? "#16a34a" : "#dc2626" }}>
                                            {selectedApp.tenth ?? 87}% / {selectedApp.minTenth ?? 60}% {(selectedApp.tenth ?? 87) >= (selectedApp.minTenth ?? 60) ? "✓" : "✕"}
                                        </strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>12th Percentage</span>
                                        <strong style={{ color: (selectedApp.twelfth ?? 77.33) >= (selectedApp.minTwelfth ?? 60) ? "#16a34a" : "#dc2626" }}>
                                            {selectedApp.twelfth ?? 77.33}% / {selectedApp.minTwelfth ?? 60}% {(selectedApp.twelfth ?? 77.33) >= (selectedApp.minTwelfth ?? 60) ? "✓" : "✕"}
                                        </strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Backlogs</span>
                                        <strong style={{ color: (selectedApp.backlogs ?? 0) <= (selectedApp.maxBacklogs ?? 1) ? "#16a34a" : "#dc2626" }}>
                                            {selectedApp.backlogs ?? 0} / {selectedApp.maxBacklogs ?? 1} {(selectedApp.backlogs ?? 0) <= (selectedApp.maxBacklogs ?? 1) ? "✓" : "✕"}
                                        </strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Graduation Year</span>
                                        <strong style={{ color: (selectedApp.gradYear ?? 2026) === (selectedApp.reqGradYear ?? 2026) ? "#16a34a" : "#dc2626" }}>
                                            {selectedApp.gradYear ?? 2026} / {selectedApp.reqGradYear ?? 2026} {(selectedApp.gradYear ?? 2026) === (selectedApp.reqGradYear ?? 2026) ? "✓" : "✕"}
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            {/* Resume Section */}
                            <div style={{ backgroundColor: "#eff6ff", padding: "14px 18px", borderRadius: "12px", border: "1px solid #bfdbfe", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <h4 style={{ margin: "0 0 4px 0", fontSize: "12px", fontWeight: "800", color: "#1d4ed8", textTransform: "uppercase" }}>Candidate Resume</h4>
                                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e40af" }}>📄 {selectedApp.resumeName}</div>
                                </div>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button
                                        type="button"
                                        onClick={() => handleViewResume(selectedApp)}
                                        style={{ padding: "8px 16px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)" }}
                                    >
                                        View Resume 👁️
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDownloadResume(selectedApp)}
                                        style={{ padding: "8px 16px", backgroundColor: "#ffffff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                                    >
                                        Download 📥
                                    </button>
                                </div>
                            </div>

                            {/* Application Status Lifecycle Progress Bar */}
                            <div style={{ backgroundColor: "#f8fafc", padding: "16px 18px", borderRadius: "12px", border: "1px solid #eaedf0" }}>
                                <h4 style={{ margin: "0 0 12px 0", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Application Lifecycle Progress</h4>
                                {selectedApp.status === "Not Shortlisted" ? (
                                    <div style={{ padding: "14px 18px", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "10px", fontWeight: "700", fontSize: "13px", border: "1px solid #fecaca", boxShadow: "0 2px 4px rgba(220,38,38,0.05)" }}>
                                        <div style={{ fontSize: "14px", fontWeight: "800", marginBottom: "4px" }}>
                                            🔴 Not Shortlisted {selectedApp.currentRound ? `in Round ${selectedApp.currentRound}` : "during screening"}
                                        </div>
                                        {selectedApp.roundName && (
                                            <div style={{ fontSize: "12px", color: "#7f1d1d", fontWeight: "600", marginBottom: "4px" }}>
                                                Round: <strong>{selectedApp.roundName}</strong>
                                            </div>
                                        )}
                                        <div style={{ fontSize: "12px", color: "#b91c1c" }}>
                                            Application closed {selectedApp.currentRound ? `after Round ${selectedApp.currentRound}` : "during screening"}.
                                        </div>
                                    </div>
                                ) : selectedApp.status === "Rejected" ? (
                                    <div style={{ padding: "14px 18px", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "10px", fontWeight: "700", fontSize: "13px", border: "1px solid #fecaca" }}>
                                        <div style={{ fontSize: "14px", fontWeight: "800", marginBottom: "4px" }}>
                                            🔴 Application Rejected
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#b91c1c" }}>
                                            Candidate was not shortlisted for further recruitment rounds.
                                        </div>
                                    </div>
                                ) : (
                                    (() => {
                                        const getCompanyRoundsList = (companyName: string) => {
                                            try {
                                                const savedDrives = localStorage.getItem("cpms_drives");
                                                if (savedDrives) {
                                                    const parsed = JSON.parse(savedDrives);
                                                    if (Array.isArray(parsed)) {
                                                        const matched = parsed.find((d: any) => d.companyName && d.companyName.toLowerCase().includes(companyName.toLowerCase()));
                                                        if (matched && Array.isArray(matched.rounds) && matched.rounds.length > 0) {
                                                            return matched.rounds;
                                                        }
                                                    }
                                                }
                                            } catch (e) {}

                                            if (companyName.toLowerCase().includes("google")) {
                                                return [
                                                    { roundNumber: 1, roundName: "Online Coding Challenge" },
                                                    { roundNumber: 2, roundName: "Technical Round 1" },
                                                    { roundNumber: 3, roundName: "System Design" },
                                                    { roundNumber: 4, roundName: "Googliness & HR" }
                                                ];
                                            } else if (companyName.toLowerCase().includes("zoho")) {
                                                return [
                                                    { roundNumber: 1, roundName: "Written Aptitude & C" },
                                                    { roundNumber: 2, roundName: "Basic Programming" },
                                                    { roundNumber: 3, roundName: "Advanced Programming" },
                                                    { roundNumber: 4, roundName: "Technical & HR" }
                                                ];
                                            }

                                            return [
                                                { roundNumber: 1, roundName: "Online Test" },
                                                { roundNumber: 2, roundName: "Technical Interview" },
                                                { roundNumber: 3, roundName: "HR Round" }
                                            ];
                                        };

                                        const driveRounds = getCompanyRoundsList(selectedApp.companyName);
                                        const currentRoundNum = selectedApp.currentRound || 1;
                                        const isSelectedFinal = selectedApp.status === "Selected";

                                        // Build dynamic stages array: Applied -> Round 1 -> Round 2 -> ... -> Selected
                                        const dynamicSteps = [
                                            { key: "Applied", label: "Applied" },
                                            ...driveRounds.map((r: any, idx: number) => {
                                                const rNum = r.roundNumber || idx + 1;
                                                return {
                                                    key: `Round ${rNum}`,
                                                    label: `Round ${rNum}`,
                                                    roundNum: rNum,
                                                    name: r.roundName
                                                };
                                            }),
                                            { key: "Selected", label: "Selected" }
                                        ];

                                        return (
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                                                {dynamicSteps.map((step: any, idx: number) => {
                                                    let isPassed = false;
                                                    let isCurrent = false;

                                                    if (isSelectedFinal) {
                                                        isPassed = true;
                                                    } else if (step.key === "Applied") {
                                                        isPassed = currentRoundNum >= 1;
                                                    } else if (step.key === "Selected") {
                                                        isPassed = false;
                                                        isCurrent = false;
                                                    } else {
                                                        // Round N
                                                        if (step.roundNum < currentRoundNum) {
                                                            isPassed = true;
                                                        } else if (step.roundNum === currentRoundNum) {
                                                            isCurrent = true;
                                                        }
                                                    }

                                                    return (
                                                        <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative", zIndex: 2 }}>
                                                            <div style={{
                                                                width: "28px",
                                                                height: "28px",
                                                                borderRadius: "50%",
                                                                backgroundColor: isPassed ? "#16a34a" : isCurrent ? "#2563eb" : "#e2e8f0",
                                                                color: "#ffffff",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: "12px",
                                                                fontWeight: "800",
                                                                boxShadow: isCurrent ? "0 0 0 3px rgba(37, 99, 235, 0.25)" : "none"
                                                            }}>
                                                                {isPassed ? "✓" : isCurrent ? "⏳" : step.roundNum || (idx + 1)}
                                                            </div>
                                                            <div style={{ fontSize: "10px", fontWeight: isCurrent ? "800" : "600", color: isCurrent ? "#2563eb" : isPassed ? "#15803d" : "#94a3b8", marginTop: "6px", textAlign: "center" }}>
                                                                {step.label}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()
                                )}

                                {/* Company Assigned Recruitment Rounds Schedule */}
                                {(() => {
                                    const getCompanyRounds = (companyName: string) => {
                                        try {
                                            const savedDrives = localStorage.getItem("cpms_drives");
                                            if (savedDrives) {
                                                const parsed = JSON.parse(savedDrives);
                                                if (Array.isArray(parsed)) {
                                                    const matched = parsed.find((d: any) => d.companyName.toLowerCase().includes(companyName.toLowerCase()));
                                                    if (matched && Array.isArray(matched.rounds) && matched.rounds.length > 0) {
                                                        return matched.rounds;
                                                    }
                                                }
                                            }
                                        } catch (e) {}

                                        if (companyName.toLowerCase().includes("google")) {
                                            return [
                                                { roundNumber: 1, roundName: "Round 1: Online Coding Challenge", mode: "Online", date: "23 Aug 2026", venueOrLink: "Google Challenge Portal", description: "2 DSA Problems (90 Mins)" },
                                                { roundNumber: 2, roundName: "Round 2: Technical Round 1 (DSA)", mode: "Online", date: "25 Aug 2026", venueOrLink: "Google Meet", description: "Trees & Graphs" },
                                                { roundNumber: 3, roundName: "Round 3: Technical Round 2 (System Design)", mode: "Online", date: "26 Aug 2026", venueOrLink: "Google Meet", description: "System Architecture" },
                                                { roundNumber: 4, roundName: "Round 4: Googliness & HR Round", mode: "Online", date: "27 Aug 2026", venueOrLink: "Google Meet", description: "Culture Fit Interview" }
                                            ];
                                        } else if (companyName.toLowerCase().includes("zoho")) {
                                            return [
                                                { roundNumber: 1, roundName: "Round 1: Written Aptitude & C Programming", mode: "On-Campus", date: "28 Aug 2026", venueOrLink: "Auditorium & CS Lab 1", description: "Aptitude & C Debugging" },
                                                { roundNumber: 2, roundName: "Round 2: Basic Programming Round", mode: "On-Campus", date: "28 Aug 2026", venueOrLink: "CS Lab 2 & 3", description: "5 Coding Questions" },
                                                { roundNumber: 3, roundName: "Round 3: Advanced Programming Round", mode: "On-Campus", date: "29 Aug 2026", venueOrLink: "CS Lab 3", description: "Complex Data Structures" },
                                                { roundNumber: 4, roundName: "Round 4: Technical & HR Interview", mode: "In-Person", date: "29 Aug 2026", venueOrLink: "Placement Hall", description: "Project & Core CS" }
                                            ];
                                        }

                                        return [
                                            { roundNumber: 1, roundName: "Round 1: Online Aptitude & Coding Test", mode: "Online", date: "24 Aug 2026", venueOrLink: "HackerRank Portal", description: "Aptitude & Coding" },
                                            { roundNumber: 2, roundName: "Round 2: Technical Interview", mode: "Online", date: "25 Aug 2026", venueOrLink: "Google Meet / Teams", description: "Data Structures & Core CS" },
                                            { roundNumber: 3, roundName: "Round 3: HR & Management Round", mode: "Online", date: "26 Aug 2026", venueOrLink: "Google Meet / Teams", description: "Behavioral & Offer Discussion" }
                                        ];
                                    };

                                    const rounds = getCompanyRounds(selectedApp.companyName);
                                    const currentStageIdx = STAGE_ORDER.indexOf(selectedApp.status);

                                    return (
                                        <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px dashed #cbd5e1" }}>
                                            <div style={{ fontSize: "11px", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
                                                📋 {selectedApp.companyName} Assigned Recruitment Rounds Schedule
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                {rounds.map((rnd: any, i: number) => {
                                                    const rndNum = rnd.roundNumber || i + 1;
                                                    const isRejectedThisRound = selectedApp.status === "Not Shortlisted" && selectedApp.currentRound === rndNum;
                                                    const isLockedAfterRejection = selectedApp.status === "Not Shortlisted" && (selectedApp.currentRound ? rndNum > selectedApp.currentRound : true);

                                                    const activeRoundNumber = selectedApp.currentRound || 1;
                                                    const isCompletedRound = !isLockedAfterRejection && !isRejectedThisRound && rndNum < activeRoundNumber;
                                                    const isCurrentRound = !isLockedAfterRejection && !isRejectedThisRound && rndNum === activeRoundNumber;

                                                    return (
                                                        <div key={i} style={{
                                                            padding: "10px 14px",
                                                            borderRadius: "10px",
                                                            backgroundColor: isRejectedThisRound ? "#fef2f2" : isCurrentRound ? "#eff6ff" : isCompletedRound ? "#f0fdf4" : "#ffffff",
                                                            border: `1px solid ${isRejectedThisRound ? "#fecaca" : isCurrentRound ? "#93c5fd" : isCompletedRound ? "#bbf7d0" : "#eaedf0"}`,
                                                            display: "flex",
                                                            justifyContent: "space-between",
                                                            alignItems: "center"
                                                        }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                                <span style={{
                                                                    backgroundColor: isRejectedThisRound ? "#dc2626" : isCurrentRound ? "#2563eb" : isCompletedRound ? "#16a34a" : "#64748b",
                                                                    color: "#ffffff",
                                                                    fontSize: "10px",
                                                                    fontWeight: "800",
                                                                    padding: "2px 8px",
                                                                    borderRadius: "12px"
                                                                }}>
                                                                    Round {rndNum}
                                                                </span>
                                                                <div>
                                                                    <strong style={{ fontSize: "13px", color: isRejectedThisRound ? "#991b1b" : "#0f172a" }}>{rnd.roundName}</strong>
                                                                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                                                                        📍 Mode/Venue: <strong style={{ color: "#334155" }}>{rnd.venueOrLink || rnd.mode}</strong> | 📅 Date: <strong style={{ color: "#334155" }}>{rnd.date}</strong>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div style={{ fontSize: "11px", fontWeight: "800", color: isRejectedThisRound ? "#dc2626" : isCurrentRound ? "#2563eb" : isCompletedRound ? "#16a34a" : "#94a3b8" }}>
                                                                {isRejectedThisRound ? "🔴 Not Shortlisted" : isCurrentRound ? "In Progress ⏳" : isCompletedRound ? "Cleared ✓" : "Upcoming"}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Application Activity / History */}
                            <div style={{ backgroundColor: "#ffffff", padding: "14px 18px", borderRadius: "12px", border: "1px solid #eaedf0" }}>
                                <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Application History & Audit Log</h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {selectedApp.history.map((h, i) => (
                                        <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", fontSize: "12px" }}>
                                            <div style={{ minWidth: "120px", color: "#94a3b8", fontWeight: "600" }}>{h.date}</div>
                                            <div style={{ flex: 1 }}>
                                                <strong style={{ color: "#0f172a", display: "block" }}>{h.title}</strong>
                                                <span style={{ color: "#64748b" }}>{h.desc}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer with Round-Aware Stage Action Buttons */}
                        {(() => {
                            const getCompanyRoundsList = (companyName: string) => {
                                try {
                                    const savedDrives = localStorage.getItem("cpms_drives");
                                    if (savedDrives) {
                                        const parsed = JSON.parse(savedDrives);
                                        if (Array.isArray(parsed)) {
                                            const matched = parsed.find((d: any) => 
                                                d.companyName && 
                                                (d.companyName.toLowerCase().includes(companyName.toLowerCase()) || companyName.toLowerCase().includes(d.companyName.toLowerCase()))
                                            );
                                            if (matched && Array.isArray(matched.rounds) && matched.rounds.length > 0) {
                                                return matched.rounds;
                                            }
                                        }
                                    }
                                } catch (e) {}

                                if (companyName.toLowerCase().includes("google")) {
                                    return [
                                        { roundNumber: 1, roundName: "Round 1: Online Coding Challenge", mode: "Online", date: "23 Aug 2026", venueOrLink: "Google Challenge Portal" },
                                        { roundNumber: 2, roundName: "Round 2: Technical Round 1 (DSA)", mode: "Online", date: "25 Aug 2026", venueOrLink: "Google Meet" },
                                        { roundNumber: 3, roundName: "Round 3: Technical Round 2 (System Design)", mode: "Online", date: "26 Aug 2026", venueOrLink: "Google Meet" },
                                        { roundNumber: 4, roundName: "Round 4: Googliness & HR Round", mode: "Online", date: "27 Aug 2026", venueOrLink: "Google Meet" }
                                    ];
                                } else if (companyName.toLowerCase().includes("zoho")) {
                                    return [
                                        { roundNumber: 1, roundName: "Round 1: Written Aptitude & C Programming", mode: "On-Campus", date: "28 Aug 2026", venueOrLink: "Auditorium & CS Lab 1" },
                                        { roundNumber: 2, roundName: "Round 2: Basic Programming Round", mode: "On-Campus", date: "28 Aug 2026", venueOrLink: "CS Lab 2 & 3" },
                                        { roundNumber: 3, roundName: "Round 3: Advanced Programming Round", mode: "On-Campus", date: "29 Aug 2026", venueOrLink: "CS Lab 3" },
                                        { roundNumber: 4, roundName: "Round 4: Technical & HR Interview", mode: "In-Person", date: "29 Aug 2026", venueOrLink: "Placement Hall" }
                                    ];
                                }

                                return [
                                    { roundNumber: 1, roundName: "Round 1: Online Aptitude & Coding Test", mode: "Online", date: "24 Aug 2026", venueOrLink: "HackerRank Portal" },
                                    { roundNumber: 2, roundName: "Round 2: Technical Interview", mode: "Online", date: "25 Aug 2026", venueOrLink: "Google Meet / Teams" },
                                    { roundNumber: 3, roundName: "Round 3: HR & Management Round", mode: "Online", date: "26 Aug 2026", venueOrLink: "Google Meet / Teams" }
                                ];
                            };

                            const driveRounds = getCompanyRoundsList(selectedApp.companyName);
                            const totalRounds = driveRounds.length;
                            let currentRoundStep = selectedApp.currentRound || 1;
                            const isFinalRound = currentRoundStep >= totalRounds;
                            const nextRoundObj = driveRounds[currentRoundStep] || null;

                            let nextRoundButtonText = "✓ Select Candidate & Issue Offer";
                            if (!isFinalRound && nextRoundObj) {
                                const rNum = nextRoundObj.roundNumber || (currentRoundStep + 1);
                                const pureTitle = getPureRoundTitle(nextRoundObj.roundName, "Next Selection Round");
                                nextRoundButtonText = `✓ Pass to Round ${rNum}: ${pureTitle}`;
                            }

                            return (
                                <div style={{ padding: "16px 24px", backgroundColor: "#f8fafc", borderTop: "1px solid #eaedf0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        {/* Dynamic Stage Actions */}
                                        {selectedApp.status !== "Selected" && selectedApp.status !== "Rejected" && selectedApp.status !== "Not Shortlisted" && (
                                            <>
                                                {isFinalRound ? (
                                                    <button
                                                        onClick={() => handleUpdateStatus(selectedApp.id, "Selected", "Final Selection 🏆", `Cleared all ${totalRounds} recruitment rounds and selected for placement offer!`)}
                                                        style={{ padding: "10px 18px", backgroundColor: "#16a34a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 4px rgba(22, 163, 74, 0.2)" }}
                                                    >
                                                        🏆 Select Candidate & Issue Offer
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            const nextRoundNum = currentRoundStep + 1;
                                                            let nextStage: ApplicationRecord["status"] = "Technical Round";
                                                            if (nextRoundNum === 2) nextStage = "Assessment";
                                                            else if (nextRoundNum === 3) nextStage = "Technical Round";
                                                            else nextStage = "HR Round";

                                                            const pureTitle = getPureRoundTitle(nextRoundObj?.roundName, `Round ${nextRoundNum}`);
                                                            const targetName = formatCleanRoundName(nextRoundNum, pureTitle);

                                                            handleUpdateStatus(
                                                                selectedApp.id,
                                                                nextStage,
                                                                `Passed Round ${currentRoundStep}`,
                                                                `Candidate cleared Round ${currentRoundStep} and advanced to ${targetName}.`,
                                                                nextRoundNum,
                                                                "In Progress",
                                                                targetName
                                                            );
                                                        }}
                                                        style={{ padding: "10px 18px", backgroundColor: "#16a34a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 4px rgba(22, 163, 74, 0.2)" }}
                                                    >
                                                        {nextRoundButtonText}
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => setShowNotShortlistConfirm(true)}
                                                    style={{ padding: "10px 18px", backgroundColor: "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 4px rgba(220, 38, 38, 0.2)" }}
                                                >
                                                    ✕ Not Shortlist
                                                </button>
                                            </>
                                        )}

                                        {(selectedApp.status === "Selected" || selectedApp.status === "Rejected" || selectedApp.status === "Not Shortlisted") && (
                                            <button
                                                onClick={() => {
                                                     const nowStr = new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
                                                     const resetHistory = [
                                                         { date: nowStr, title: "Application Re-evaluated ↺", desc: "Placement Officer reset application status to Under Review and cleared previous trial audit history." },
                                                         { date: "19 Aug 2026 09:30 AM", title: "Application Submitted", desc: `Candidate applied for ${selectedApp.companyName} ${selectedApp.jobRole}.` }
                                                     ];

                                                     setApplications(prev => prev.map(a => {
                                                         if (a.id === selectedApp.id) {
                                                             return {
                                                                 ...a,
                                                                 status: "Under Review",
                                                                 currentRound: 1,
                                                                 roundStatus: "In Progress",
                                                                 roundName: "Round 1",
                                                                 history: resetHistory
                                                             };
                                                         }
                                                         return a;
                                                     }));

                                                     setSelectedApp(prev => prev ? {
                                                         ...prev,
                                                         status: "Under Review",
                                                         currentRound: 1,
                                                         roundStatus: "In Progress",
                                                         roundName: "Round 1",
                                                         history: resetHistory
                                                     } : null);
                                                 }}
                                                style={{ padding: "10px 18px", backgroundColor: "#ffffff", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                                            >
                                                ↺ Re-evaluate Status
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => setSelectedApp(null)}
                                        style={{ padding: "10px 20px", backgroundColor: "#0f172a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                                    >
                                        Close
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Confirmation Modal for Not Shortlist Action */}
            {showNotShortlistConfirm && selectedApp && (
                <div onClick={(e) => e.stopPropagation()} style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.75)",
                    backdropFilter: "blur(4px)",
                    zIndex: 10000,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px"
                }}>
                    <div style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "18px",
                        padding: "28px",
                        maxWidth: "480px",
                        width: "100%",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        border: "1px solid #e2e8f0"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                            <div style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", fontSize: "20px" }}>
                                ⚠️
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                                    Not Shortlist Candidate?
                                </h3>
                                <span style={{ fontSize: "12px", color: "#64748b" }}>
                                    Confirmation required
                                </span>
                            </div>
                        </div>
                        <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#334155", lineHeight: "1.6" }}>
                            This will end the candidate's participation in this placement drive. This action will not affect applications to other drives.
                        </p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <button
                                onClick={() => setShowNotShortlistConfirm(false)}
                                style={{
                                    padding: "10px 18px",
                                    backgroundColor: "#f1f5f9",
                                    color: "#334155",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "10px",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    const stageToRoundMap: Record<string, { num: number; defaultName: string }> = {
                                        "Applied": { num: 1, defaultName: "Initial Screening" },
                                        "Under Review": { num: 1, defaultName: "Document & Eligibility Verification" },
                                        "Shortlisted": { num: 1, defaultName: "Initial Shortlisting" },
                                        "Assessment": { num: 1, defaultName: "Online Assessment / Aptitude Test" },
                                        "Technical Round": { num: 2, defaultName: "Technical Interview" },
                                        "HR Round": { num: 3, defaultName: "HR & Leadership Round" }
                                    };

                                    const roundInfo = stageToRoundMap[selectedApp.status] || { num: 1, defaultName: "Recruitment Round" };
                                    
                                    // Try to fetch custom round name from company rounds
                                    let customRoundName = roundInfo.defaultName;
                                    try {
                                        const savedDrives = localStorage.getItem("cpms_drives");
                                        if (savedDrives) {
                                            const parsed = JSON.parse(savedDrives);
                                            if (Array.isArray(parsed)) {
                                                const matched = parsed.find((d: any) => d.companyName.toLowerCase().includes(selectedApp.companyName.toLowerCase()));
                                                if (matched && Array.isArray(matched.rounds)) {
                                                    const rObj = matched.rounds.find((r: any) => r.roundNumber === roundInfo.num) || matched.rounds[roundInfo.num - 1];
                                                    if (rObj && rObj.roundName) customRoundName = rObj.roundName;
                                                }
                                            }
                                        }
                                    } catch (e) {}

                                    handleUpdateStatus(
                                        selectedApp.id, 
                                        "Not Shortlisted", 
                                        `Not Shortlisted in Round ${roundInfo.num}`, 
                                        `Candidate was not shortlisted in Round ${roundInfo.num} (${customRoundName}). Participation in this drive has ended.`,
                                        roundInfo.num,
                                        "Not Shortlisted",
                                        customRoundName
                                    );
                                    setShowNotShortlistConfirm(false);
                                }}
                                style={{
                                    padding: "10px 18px",
                                    backgroundColor: "#dc2626",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "10px",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    boxShadow: "0 4px 6px -1px rgba(220, 38, 38, 0.2)"
                                }}
                            >
                                Confirm Not Shortlist
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal for Permanent Application Deletion */}
            {appToDelete && (
                <div onClick={() => setAppToDelete(null)} style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.75)",
                    backdropFilter: "blur(4px)",
                    zIndex: 10001,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px"
                }}>
                    <div onClick={(e) => e.stopPropagation()} style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "18px",
                        padding: "28px",
                        maxWidth: "450px",
                        width: "100%",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        border: "1px solid #e2e8f0"
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                            <div style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", fontSize: "20px" }}>
                                🗑️
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                                    Delete Application Record?
                                </h3>
                                <span style={{ fontSize: "12px", color: "#64748b" }}>
                                    Permanent Deletion
                                </span>
                            </div>
                        </div>
                        <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#334155", lineHeight: "1.6" }}>
                            Are you sure you want to delete the application record for <strong>{appToDelete.studentName}</strong> ({appToDelete.companyName})? This record will be permanently removed and will not appear again.
                        </p>
                        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                            <button
                                type="button"
                                onClick={() => setAppToDelete(null)}
                                style={{
                                    padding: "10px 18px",
                                    backgroundColor: "#f1f5f9",
                                    color: "#334155",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "10px",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    cursor: "pointer"
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    handleDeleteApplication(appToDelete);
                                    setAppToDelete(null);
                                }}
                                style={{
                                    padding: "10px 18px",
                                    backgroundColor: "#dc2626",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "10px",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    boxShadow: "0 2px 4px rgba(220, 38, 38, 0.25)"
                                }}
                            >
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default ApplicationManagement;
