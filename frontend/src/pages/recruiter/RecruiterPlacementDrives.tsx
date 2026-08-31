import React, { useState, useEffect } from "react";
import { addRecruiterActivity } from "../../utils/recruiterActivityUtils";

export interface PlacementDrive {
    id: string;
    company: string;
    jobTitle: string;
    jobType: string;
    workMode?: "On-site" | "Hybrid" | "Remote";
    location: string;
    packageCtc: string;
    deadline: string;
    driveDate?: string;
    status: "Approved" | "Active" | "Pending Approval" | "Rejected" | "Closed" | "Draft";
    rejectionReason?: string;
    approvedBy?: string;
    createdBy?: string;
    logo?: string;
    appliedCount?: number;
    openings?: number;
    eligibleBranches?: string[];
    minCgpa?: number;
    gradYear?: number;
    maxBacklogs?: number;
    requiredSkills?: string[];
    jobDescription?: string;
    selectionProcess?: string;
    bondAgreement?: string;
    benefitsPerks?: string;
    additionalInstructions?: string;
}

export interface RecruiterPlacementDrivesProps {
    user?: any;
}

export interface EngineeringDepartment {
    code: string;
    fullName: string;
    category: "IT & Computer" | "Circuit & Electronics" | "Core Engineering" | "Specialized & Allied";
}

export const ALL_ENGINEERING_DEPARTMENTS: EngineeringDepartment[] = [
    // IT & Computer
    { code: "CSE", fullName: "Computer Science & Engineering", category: "IT & Computer" },
    { code: "IT", fullName: "Information Technology", category: "IT & Computer" },
    { code: "AI & DS", fullName: "Artificial Intelligence & Data Science", category: "IT & Computer" },
    { code: "CSBS", fullName: "Computer Science & Business Systems", category: "IT & Computer" },
    { code: "CSE (Cyber)", fullName: "CSE (Cyber Security)", category: "IT & Computer" },

    // Circuit & Electronics
    { code: "ECE", fullName: "Electronics & Communication Engineering", category: "Circuit & Electronics" },
    { code: "EEE", fullName: "Electrical & Electronics Engineering", category: "Circuit & Electronics" },
    { code: "EIE", fullName: "Electronics & Instrumentation Engineering", category: "Circuit & Electronics" },

    // Core Engineering
    { code: "MECH", fullName: "Mechanical Engineering", category: "Core Engineering" },
    { code: "CIVIL", fullName: "Civil Engineering", category: "Core Engineering" },
    { code: "CHEM", fullName: "Chemical Engineering", category: "Core Engineering" },
    { code: "AERO", fullName: "Aerospace & Aeronautical Engineering", category: "Core Engineering" },

    // Specialized & Allied
    { code: "BIOMED", fullName: "Biomedical Engineering", category: "Specialized & Allied" },
    { code: "ROBOTICS", fullName: "Robotics & Automation", category: "Specialized & Allied" },
    { code: "BIOTECH", fullName: "Biotechnology", category: "Specialized & Allied" }
];

const ALL_BRANCHES = ALL_ENGINEERING_DEPARTMENTS.map(d => d.code);

export const RecruiterPlacementDrives: React.FC<RecruiterPlacementDrivesProps> = ({ user }) => {
    const recruiterCompany = user?.company || "Amazon Development Center";

    const [drives, setDrives] = useState<PlacementDrive[]>(() => {
        try {
            const saved = localStorage.getItem("cpms_drives");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.map((item: any) => ({
                        id: item.id || item._id,
                        company: item.company || item.companyName || recruiterCompany,
                        jobTitle: item.jobTitle || item.jobRole || item.role || "Software Engineer",
                        jobType: item.jobType || "Full-Time (FTE)",
                        location: item.location || "Bangalore, India",
                        packageCtc: item.packageCtc || item.ctc || item.salaryPackage || "₹18.0 LPA",
                        deadline: item.deadline || item.driveDate || "28 Aug 2026",
                        status: item.status || "Approved",
                        logo: item.logo || item.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
                        appliedCount: item.appliedStudents ? item.appliedStudents.length : (item.appliedCount || 0),
                        openings: item.openings || 10,
                        eligibleBranches: item.eligibleBranches || ["CSE", "IT", "ECE"],
                        minCgpa: item.minCgpa || 7.0,
                        gradYear: item.gradYear || 2026,
                        maxBacklogs: item.maxBacklogs || 0,
                        requiredSkills: item.requiredSkills || ["Java", "React"],
                        jobDescription: item.jobDescription || "Responsible for software development.",
                        selectionProcess: item.selectionProcess || "Aptitude Test → Technical Interview → HR Round"
                    }));
                }
            }
        } catch (e) { }
        return [];
    });

    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Modal State Management
    const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [selectedDriveId, setSelectedDriveId] = useState<string | null>(null);
    const [viewDrive, setViewDrive] = useState<PlacementDrive | null>(null);

    // Form State
    const [formData, setFormData] = useState<Omit<PlacementDrive, "id">>({
        company: recruiterCompany,
        jobTitle: "",
        jobType: "Full-Time (FTE)",
        location: "Bangalore, India",
        packageCtc: "₹18.0 LPA",
        deadline: "",
        status: "Active",
        logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
        appliedCount: 0,
        openings: 10,
        eligibleBranches: ["CSE", "IT", "ECE"],
        minCgpa: 7.0,
        gradYear: 2026,
        maxBacklogs: 0,
        requiredSkills: ["Java", "React", "Python"],
        jobDescription: "Responsible for software development, technical problem solving, and building scalable applications.",
        selectionProcess: "Aptitude Test → Technical Interview → HR Round"
    });

    const [skillsInput, setSkillsInput] = useState<string>("Java, React, Python");
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState<boolean>(false);

    // Fetch Drives from MongoDB Backend + Local Storage for recruiter's company
    const fetchDrivesFromMongoDB = async () => {
        if (drives.length === 0) {
            setIsLoading(true);
        }
        let localDrives: any[] = [];
        try {
            const saved = localStorage.getItem("cpms_drives");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    localDrives = parsed;
                }
            }
        } catch (e) { }

        try {
            const cleanCompName = recruiterCompany.split(" ")[0];
            const url = `http://localhost:5001/api/company/drives?company=${encodeURIComponent(cleanCompName)}`;
            const res = await fetch(url);
            let combinedRaw: any[] = [];

            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    combinedRaw = data;
                }
            }

            if (combinedRaw.length === 0 && localDrives.length > 0) {
                combinedRaw = localDrives;
            } else if (localDrives.length > 0) {
                // Merge local updates (e.g. status changes by Officer) with backend drives
                localDrives.forEach((ld: any) => {
                    const idx = combinedRaw.findIndex((bd: any) => (bd._id || bd.id) === (ld._id || ld.id));
                    if (idx !== -1) {
                        combinedRaw[idx] = { ...combinedRaw[idx], ...ld };
                    } else {
                        combinedRaw.push(ld);
                    }
                });
            }

            if (combinedRaw.length > 0) {
                const formatted = combinedRaw.map((item: any) => ({
                    id: item._id || item.id,
                    company: item.company || item.companyName || recruiterCompany,
                    jobTitle: item.jobTitle || item.jobRole || item.role || "Software Engineer",
                    jobType: item.jobType || "Full-Time (FTE)",
                    location: item.location || "Bangalore, India",
                    packageCtc: item.packageCtc || item.ctc || item.salaryPackage || "₹18.0 LPA",
                    deadline: item.deadline || item.driveDate || "28 Aug 2026",
                    status: item.status || (item.isActive ? "Approved" : "Closed"),
                    logo: item.logo || item.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
                    appliedCount: item.appliedStudents ? item.appliedStudents.length : (item.appliedCount || 0),
                    openings: item.openings || 10,
                    eligibleBranches: item.eligibleBranches || ["CSE", "IT", "ECE"],
                    minCgpa: item.minCgpa || 7.0,
                    gradYear: item.gradYear || 2026,
                    maxBacklogs: item.maxBacklogs || 0,
                    requiredSkills: item.requiredSkills || ["Java", "React"],
                    jobDescription: item.jobDescription || "Responsible for software development.",
                    selectionProcess: item.selectionProcess || "Aptitude Test → Technical Interview → HR Round"
                }));

                // Deduplicate by company + jobTitle so recruiter never sees duplicate cards!
                const uniqueDrivesMap = new Map();
                formatted.forEach(item => {
                    const key = `${(item.company || "").toLowerCase().trim()}_${(item.jobTitle || "").toLowerCase().trim()}`;
                    if (!uniqueDrivesMap.has(key)) {
                        uniqueDrivesMap.set(key, item);
                    } else {
                        const existing = uniqueDrivesMap.get(key);
                        if (item.status === "Approved" || item.status === "Active" || item.status === "Upcoming") {
                            uniqueDrivesMap.set(key, { ...existing, ...item });
                        }
                    }
                });
                setDrives(Array.from(uniqueDrivesMap.values()));
            } else {
                setDrives([]);
            }
        } catch (err) {
            console.error("Error fetching company placement drives:", err);
            if (localDrives.length > 0) {
                const formatted = localDrives.map((item: any) => ({
                    id: item.id || item._id,
                    company: item.company || item.companyName || recruiterCompany,
                    jobTitle: item.jobTitle || item.jobRole || item.role || "Software Engineer",
                    jobType: item.jobType || "Full-Time (FTE)",
                    location: item.location || "Bangalore, India",
                    packageCtc: item.packageCtc || item.ctc || item.salaryPackage || "₹18.0 LPA",
                    deadline: item.deadline || item.driveDate || "28 Aug 2026",
                    status: item.status || "Approved",
                    logo: item.logo || item.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
                    appliedCount: item.appliedStudents ? item.appliedStudents.length : (item.appliedCount || 0),
                    openings: item.openings || 10,
                    eligibleBranches: item.eligibleBranches || ["CSE", "IT", "ECE"],
                    minCgpa: item.minCgpa || 7.0,
                    gradYear: item.gradYear || 2026,
                    maxBacklogs: item.maxBacklogs || 0,
                    requiredSkills: item.requiredSkills || ["Java", "React"],
                    jobDescription: item.jobDescription || "Responsible for software development.",
                    selectionProcess: item.selectionProcess || "Aptitude Test → Technical Interview → HR Round"
                }));
                setDrives(formatted);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDrivesFromMongoDB();
        const handleStorageChange = () => {
            fetchDrivesFromMongoDB();
        };
        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("focus", handleStorageChange);
        const interval = setInterval(() => {
            fetchDrivesFromMongoDB();
        }, 3000);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("focus", handleStorageChange);
            clearInterval(interval);
        };
    }, [recruiterCompany]);

    const handleDeleteDrive = async (driveId: string) => {
        if (!window.confirm("Are you sure you want to delete this placement drive?")) return;
        setDrives(prev => prev.filter(d => d.id !== driveId));
        try {
            await fetch(`http://localhost:5001/api/company/drives/${driveId}`, {
                method: "DELETE"
            });
        } catch (err) { }
    };

    // Close modals on Escape key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsFormModalOpen(false);
                setIsViewModalOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const getStatusStyle = (driveInput: PlacementDrive | any) => {
        const status = typeof driveInput === "object" ? driveInput.status : driveInput;
        const deadline = typeof driveInput === "object" ? (driveInput.deadline || driveInput.applicationDeadline) : null;
        let isDeadlinePassed = false;
        if (deadline) {
            const dDate = new Date(deadline);
            if (!isNaN(dDate.getTime())) {
                isDeadlinePassed = dDate.getTime() < new Date().setHours(0, 0, 0, 0);
            }
        }

        switch (status) {
            case "Approved":
            case "Active":
                if (isDeadlinePassed) {
                    return { bg: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", label: "⚪ Applications Closed" };
                }
                return { bg: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", label: "🟢 Approved · Applications Open" };
            case "Pending Approval":
                return { bg: "#fffbeb", color: "#d97706", border: "1px solid #fde68a", label: "🟠 Pending Approval" };
            case "Rejected":
                return { bg: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", label: "🔴 Rejected" };
            case "Draft":
                return { bg: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", label: "⚪ Draft" };
            case "Closed":
                return { bg: "#f8fafc", color: "#64748b", border: "1px solid #cbd5e1", label: "⚫ Closed" };
            default:
                return { bg: "#f8fafc", color: "#64748b", border: "1px solid #cbd5e1", label: status || "⚪ Draft" };
        }
    };

    // Branch Checkbox Toggle
    const handleBranchToggle = (branch: string) => {
        const current = formData.eligibleBranches || [];
        if (current.includes(branch)) {
            setFormData({ ...formData, eligibleBranches: current.filter(b => b !== branch) });
        } else {
            setFormData({ ...formData, eligibleBranches: [...current, branch] });
        }
    };

    // Quick Branch Selection Helpers
    const handleSelectBranchPreset = (preset: "all" | "it" | "circuit" | "core" | "clear") => {
        let selected: string[] = [];
        if (preset === "all") {
            selected = ALL_ENGINEERING_DEPARTMENTS.map(d => d.code);
        } else if (preset === "it") {
            selected = ALL_ENGINEERING_DEPARTMENTS.filter(d => d.category === "IT & Computer").map(d => d.code);
        } else if (preset === "circuit") {
            selected = ALL_ENGINEERING_DEPARTMENTS.filter(d => d.category === "Circuit & Electronics").map(d => d.code);
        } else if (preset === "core") {
            selected = ALL_ENGINEERING_DEPARTMENTS.filter(d => d.category === "Core Engineering").map(d => d.code);
        } else if (preset === "clear") {
            selected = [];
        }
        setFormData({ ...formData, eligibleBranches: selected });
    };

    // Open Create Modal
    const handleOpenCreateModal = () => {
        setModalMode("create");
        setSelectedDriveId(null);
        setFormData({
            company: recruiterCompany,
            jobTitle: "",
            jobType: "Full-Time (FTE)",
            location: "Bangalore, India",
            packageCtc: "₹18.0 LPA",
            deadline: "",
            status: "Pending Approval",
            logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
            appliedCount: 0,
            openings: 10,
            eligibleBranches: ["CSE", "IT", "ECE"],
            minCgpa: 7.0,
            gradYear: 2026,
            maxBacklogs: 0,
            requiredSkills: ["Java", "React", "Python"],
            jobDescription: "Responsible for software development, technical problem solving, and building scalable applications.",
            selectionProcess: "Aptitude Test → Technical Interview → HR Round"
        });
        setSkillsInput("Java, React, Python");
        setFormError(null);
        setIsFormModalOpen(true);
    };

    // Open Edit Modal
    const handleOpenEditModal = (drive: PlacementDrive) => {
        setModalMode("edit");
        setSelectedDriveId(drive.id);
        setFormData({
            company: drive.company || recruiterCompany,
            jobTitle: drive.jobTitle,
            jobType: drive.jobType,
            location: drive.location,
            packageCtc: drive.packageCtc,
            deadline: drive.deadline,
            status: drive.status,
            logo: drive.logo || "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
            appliedCount: drive.appliedCount || 0,
            openings: drive.openings || 10,
            eligibleBranches: drive.eligibleBranches || ["CSE", "IT"],
            minCgpa: drive.minCgpa || 7.0,
            gradYear: drive.gradYear || 2026,
            maxBacklogs: drive.maxBacklogs || 0,
            requiredSkills: drive.requiredSkills || ["Java", "React"],
            jobDescription: drive.jobDescription || "Responsible for software development.",
            selectionProcess: drive.selectionProcess || "Aptitude Test → Technical Interview → HR Round"
        });
        setSkillsInput((drive.requiredSkills || ["Java", "React"]).join(", "));
        setFormError(null);
        setIsFormModalOpen(true);
    };

    // Open View Modal
    const handleOpenViewModal = (drive: PlacementDrive) => {
        setViewDrive(drive);
        setIsViewModalOpen(true);
    };

    const [submitAction, setSubmitAction] = useState<"Draft" | "Pending Approval">("Pending Approval");

    // Save Form (Create or Edit) to MongoDB Backend
    const handleSaveDrive = async (e: React.FormEvent, overrideStatus?: "Draft" | "Pending Approval") => {
        e.preventDefault();
        if (!formData.jobTitle.trim()) {
            setFormError("Please enter a Job Title.");
            return;
        }
        if (!formData.deadline.trim()) {
            setFormError("Please specify Application Deadline.");
            return;
        }

        // 📅 Important Dates Validation: Application Deadline <= Drive Date
        if (formData.deadline && formData.driveDate) {
            const deadlineDate = new Date(formData.deadline);
            const driveDateObj = new Date(formData.driveDate);
            if (!isNaN(deadlineDate.getTime()) && !isNaN(driveDateObj.getTime())) {
                if (deadlineDate > driveDateObj) {
                    setFormError("⚠️ Important Dates Error: Application Deadline cannot be after the Drive Date (Application Deadline must be on or before the Drive Date).");
                    setSaving(false);
                    return;
                }
            }
        }

        setSaving(true);
        setFormError(null);

        const targetStatus = overrideStatus || submitAction || "Pending Approval";
        const skillsArr = skillsInput.split(",").map(s => s.trim()).filter(Boolean);

        const payload = {
            ...formData,
            status: targetStatus,
            company: recruiterCompany, // Locked to logged in recruiter's company
            recruiterCompany,
            requiredSkills: skillsArr
        };

        // Re-approval logic: If an approved drive is edited or resubmitted, set status to Pending Approval
        if ((formData.status === "Approved" || formData.status === "Active" || formData.status === "Rejected") && targetStatus === "Pending Approval") {
            payload.status = "Pending Approval";
            delete (payload as any).rejectionReason;
        }

        try {
            let finalDrive: PlacementDrive | null = null;
            if (modalMode === "create") {
                try {
                    const res = await fetch("http://localhost:5001/api/company/drives", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                    if (res.ok) {
                        const resData = await res.json();
                        const createdMongoDrive = resData.drive;
                        finalDrive = {
                            id: createdMongoDrive._id || createdMongoDrive.id || `drive_${Date.now()}`,
                            company: createdMongoDrive.company || recruiterCompany,
                            jobTitle: createdMongoDrive.jobTitle || createdMongoDrive.role || formData.jobTitle,
                            jobType: createdMongoDrive.jobType || formData.jobType,
                            location: createdMongoDrive.location || formData.location,
                            packageCtc: createdMongoDrive.packageCtc || createdMongoDrive.ctc || formData.packageCtc,
                            deadline: createdMongoDrive.deadline || formData.deadline,
                            status: createdMongoDrive.status || formData.status || "Pending Approval",
                            logo: createdMongoDrive.logo || formData.logo,
                            appliedCount: 0,
                            openings: createdMongoDrive.openings || formData.openings,
                            eligibleBranches: createdMongoDrive.eligibleBranches || formData.eligibleBranches,
                            minCgpa: createdMongoDrive.minCgpa || formData.minCgpa,
                            gradYear: createdMongoDrive.gradYear || formData.gradYear,
                            maxBacklogs: createdMongoDrive.maxBacklogs || formData.maxBacklogs,
                            requiredSkills: createdMongoDrive.requiredSkills || skillsArr,
                            jobDescription: createdMongoDrive.jobDescription || formData.jobDescription,
                            selectionProcess: createdMongoDrive.selectionProcess || formData.selectionProcess
                        };
                    }
                } catch (apiErr) { }

                if (!finalDrive) {
                    finalDrive = { id: `drive_${Date.now()}`, ...payload };
                }
                setDrives(prev => [finalDrive!, ...prev]);
            } else if (modalMode === "edit" && selectedDriveId) {
                if (!selectedDriveId.startsWith("drive_")) {
                    try {
                        await fetch(`http://localhost:5001/api/company/drives/${selectedDriveId}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload)
                        });
                    } catch (apiErr) { }
                }
                finalDrive = { id: selectedDriveId, ...payload };
                setDrives(prev =>
                    prev.map(d => (d.id === selectedDriveId ? finalDrive! : d))
                );
            }

            // Sync with cpms_drives in localStorage so Officer Dashboard updates immediately
            try {
                const savedLocal = localStorage.getItem("cpms_drives");
                let localArr: any[] = savedLocal ? JSON.parse(savedLocal) : [];
                if (finalDrive) {
                    const formattedLocalDrive = {
                        id: finalDrive.id,
                        companyName: finalDrive.company,
                        jobRole: finalDrive.jobTitle,
                        driveDate: finalDrive.deadline,
                        applicationDeadline: finalDrive.deadline,
                        status: finalDrive.status,
                        salaryPackage: finalDrive.packageCtc,
                        location: finalDrive.location,
                        logoUrl: finalDrive.logo,
                        eligibleBranches: finalDrive.eligibleBranches,
                        minCgpa: finalDrive.minCgpa,
                        gradYear: finalDrive.gradYear,
                        rejectionReason: finalDrive.rejectionReason || ""
                    };
                    const existingIdx = localArr.findIndex(d => d.id === finalDrive!.id || d.companyName === finalDrive!.company && d.jobRole === finalDrive!.jobTitle);
                    if (existingIdx >= 0) {
                        localArr[existingIdx] = { ...localArr[existingIdx], ...formattedLocalDrive };
                    } else {
                        localArr.unshift(formattedLocalDrive);
                    }
                    localStorage.setItem("cpms_drives", JSON.stringify(localArr));
                    
                    // Instant sync to cpms_companies so recruiter drive appears exclusively in Placement Officer Company Management!
                    try {
                        localStorage.removeItem("cpms_companies_cleared");
                        localStorage.removeItem("cpms_drives_cleared");

                        const savedComps = localStorage.getItem("cpms_companies");
                        let compArr: any[] = (savedComps && savedComps !== "[]") ? JSON.parse(savedComps) : [];
                        
                        const newCompanyDriveObj = {
                            id: `comp_drive_${Date.now()}`,
                            companyName: recruiterCompany,
                            createdBy: user?.name || recruiterCompany,
                            recruiterName: user?.name || recruiterCompany,
                            recruiterEmail: user?.email || "recruitment@company.com",
                            jobRole: finalDrive.jobTitle,
                            driveDate: finalDrive.deadline,
                            salaryPackage: finalDrive.packageCtc,
                            applications: 0,
                            shortlisted: 0,
                            registrationStatus: targetStatus === "Pending Approval" ? "Pending Officer Approval" : "Approved",
                            status: targetStatus === "Pending Approval" ? "Pending Officer Approval" : "Approved",
                            logoUrl: finalDrive.logo || "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
                            industry: "Technology",
                            jobType: finalDrive.jobType || "Full-Time (FTE)"
                        };

                        const existingCompIdx = compArr.findIndex(c => 
                            (c.companyName || "").toLowerCase().trim() === recruiterCompany.toLowerCase().trim() && 
                            (c.jobRole || "").toLowerCase().trim() === finalDrive!.jobTitle.toLowerCase().trim()
                        );
                        if (existingCompIdx >= 0) {
                            compArr[existingCompIdx] = { ...compArr[existingCompIdx], ...newCompanyDriveObj };
                        } else {
                            compArr.unshift(newCompanyDriveObj);
                        }

                        localStorage.setItem("cpms_companies", JSON.stringify(compArr));
                        window.dispatchEvent(new Event("storage"));
                        window.dispatchEvent(new CustomEvent("cpms_companies_updated"));

                        try {
                            const bc = new BroadcastChannel("cpms_company_channel");
                            bc.postMessage({ type: "COMPANY_UPDATED", drive: newCompanyDriveObj });
                            bc.close();
                        } catch (bcErr) { }
                    } catch (compErr) { }

                    if (targetStatus === "Pending Approval") {
                        addRecruiterActivity({
                            type: "PLACEMENT_DRIVE_SUBMITTED",
                            title: "Placement Drive Submitted",
                            message: `${finalDrive.jobTitle} placement drive has been submitted for Placement Officer approval.`,
                            company: recruiterCompany,
                            driveRole: finalDrive.jobTitle
                        });
                    }

                    window.dispatchEvent(new Event("storage"));
                }
            } catch (lsErr) { }

            setIsFormModalOpen(false);
        } catch (err) {
            console.error("Error saving drive to MongoDB:", err);
            if (modalMode === "create") {
                const newDrive: PlacementDrive = { id: `drive_${Date.now()}`, ...payload };
                setDrives(prev => [newDrive, ...prev]);
            } else if (modalMode === "edit" && selectedDriveId) {
                setDrives(prev =>
                    prev.map(d => (d.id === selectedDriveId ? { id: selectedDriveId, ...payload } : d))
                );
            }
            setIsFormModalOpen(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: "1100px", margin: "0 auto", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}>
            <style>{`
                .drives-card-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
                    gap: 20px;
                    margin-top: 16px;
                }
                @media (max-width: 640px) {
                    .drives-card-grid {
                        grid-template-columns: 1fr !important;
                        gap: 16px !important;
                    }
                    .responsive-drive-header {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 12px !important;
                    }
                }
            `}</style>

            {/* Main White Outer Container Card */}
            <div style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                padding: "28px 32px",
                border: "1px solid #eaedf0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
            }}>

                {/* Page Heading & Create New Drive Action */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }} className="responsive-drive-header">
                    <div>
                        <h2 style={{ margin: "0 0 6px 0", fontSize: "20px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.3px" }}>
                            Placement Drives ({recruiterCompany})
                        </h2>
                        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                            Manage recruitment drives, job roles, eligibility criteria, and campus deadlines exclusively for {recruiterCompany}.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: "#2563eb",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            boxShadow: "0 2px 4px rgba(37, 99, 235, 0.15)",
                            transition: "all 0.15s ease-in-out",
                            whiteSpace: "nowrap"
                        }}
                    >
                        <span>➕</span> Create New Drive
                    </button>
                </div>

                {/* RESPONSIVE PLACEMENT DRIVES CARD GRID */}
                {isLoading && drives.length === 0 ? (
                    <div style={{ backgroundColor: "#ffffff", padding: "48px 24px", borderRadius: "16px", border: "1px solid #e2e8f0", textAlign: "center", marginTop: "16px", color: "#64748b" }}>
                        ⏳ Loading placement drives...
                    </div>
                ) : drives.length === 0 ? (
                    <div style={{ backgroundColor: "#ffffff", padding: "48px 24px", borderRadius: "16px", border: "1px solid #e2e8f0", textAlign: "center", marginTop: "16px" }}>
                        <div style={{ fontSize: "42px", marginBottom: "12px" }}>🚀</div>
                        <h3 style={{ margin: "0 0 6px 0", fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>No Placement Drives Posted</h3>
                        <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#64748b" }}>
                            You haven't created any recruitment drives for {recruiterCompany} yet.
                        </p>
                        <button
                            type="button"
                            onClick={handleOpenCreateModal}
                            style={{
                                backgroundColor: "#2563eb",
                                color: "#ffffff",
                                border: "none",
                                padding: "10px 22px",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: "700",
                                cursor: "pointer",
                                boxShadow: "0 2px 4px rgba(37,99,235,0.2)"
                            }}
                        >
                            + Create New Drive
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                        {drives.map((drive) => {
                            const statusStyle = getStatusStyle(drive);
                            return (
                                <div
                                    key={drive.id}
                                    style={{
                                        backgroundColor: "#ffffff",
                                        borderRadius: "14px",
                                        border: "1px solid #e2e8f0",
                                        padding: "20px",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                                        transition: "transform 0.15s ease, box-shadow 0.15s ease",
                                        height: "100%",
                                        boxSizing: "border-box"
                                    }}
                                >
                                    <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                                        {/* Card Header: Logo, Company & Job Title + Status Pill */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%" }}>
                                                <div style={{
                                                    width: "44px",
                                                    height: "44px",
                                                    borderRadius: "10px",
                                                    border: "1px solid #eaedf0",
                                                    backgroundColor: "#ffffff",
                                                    padding: "6px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    flexShrink: 0
                                                }}>
                                                    <img src={drive.logo} alt={drive.company} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a", lineHeight: "1.3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {drive.jobTitle}
                                                    </h3>
                                                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", display: "block", marginTop: "2px" }}>
                                                        {drive.company}
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <span style={{
                                                    backgroundColor: statusStyle.bg,
                                                    color: statusStyle.color,
                                                    border: statusStyle.border,
                                                    padding: "4px 12px",
                                                    borderRadius: "16px",
                                                    fontSize: "11px",
                                                    fontWeight: "700",
                                                    display: "inline-flex",
                                                    alignItems: "center"
                                                }}>
                                                    {statusStyle.label || drive.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* ⚠️ Rejection Notice Banner */}
                                        {drive.status === "Rejected" && (
                                            <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "10px 12px", marginBottom: "12px", fontSize: "12px", color: "#991b1b" }}>
                                                <div style={{ fontWeight: "800", marginBottom: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                                                    ❌ Drive Rejected by Placement Officer
                                                </div>
                                                <div>
                                                    <strong>Reason:</strong> {drive.rejectionReason || "Requirements need review before approval."}
                                                </div>
                                            </div>
                                        )}

                                        {/* Drive Key Specs Grid */}
                                        <div style={{ backgroundColor: "#f8fafc", borderRadius: "10px", padding: "12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                                            <div>
                                                <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: "800", color: "#64748b", display: "block" }}>JOB TYPE</span>
                                                <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>{drive.jobType}</span>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: "800", color: "#64748b", display: "block" }}>PACKAGE / CTC</span>
                                                <span style={{ fontSize: "13px", fontWeight: "800", color: "#2563eb" }}>{drive.packageCtc}</span>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: "800", color: "#64748b", display: "block" }}>LOCATION</span>
                                                <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>📍 {drive.location}</span>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: "800", color: "#64748b", display: "block" }}>DEADLINE</span>
                                                <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>📅 {drive.deadline}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: "flex", gap: "8px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenViewModal(drive)}
                                            style={{
                                                flex: 1,
                                                padding: "8px 12px",
                                                backgroundColor: "#f1f5f9",
                                                color: "#0f172a",
                                                border: "1px solid #cbd5e1",
                                                borderRadius: "8px",
                                                fontSize: "12px",
                                                fontWeight: "700",
                                                cursor: "pointer",
                                                whiteSpace: "nowrap",
                                                textAlign: "center"
                                            }}
                                        >
                                            View
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenEditModal(drive)}
                                            style={{
                                                flex: 1,
                                                padding: "8px 12px",
                                                backgroundColor: "#eff6ff",
                                                color: "#2563eb",
                                                border: "1px solid #bfdbfe",
                                                borderRadius: "8px",
                                                fontSize: "12px",
                                                fontWeight: "700",
                                                cursor: "pointer",
                                                whiteSpace: "nowrap",
                                                textAlign: "center"
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteDrive(drive.id)}
                                            title="Delete Drive"
                                            style={{
                                                padding: "8px 12px",
                                                backgroundColor: "#fef2f2",
                                                color: "#dc2626",
                                                border: "1px solid #fca5a5",
                                                borderRadius: "8px",
                                                fontSize: "12px",
                                                fontWeight: "700",
                                                cursor: "pointer",
                                                whiteSpace: "nowrap",
                                                textAlign: "center"
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>

            {/* CREATE / EDIT FORM MODAL (Structured Sections & Locked Company Name) */}
            {isFormModalOpen && (
                <div
                    onClick={() => setIsFormModalOpen(false)}
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
                            maxWidth: "680px",
                            maxHeight: "92vh",
                            overflowY: "auto",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                            border: "1px solid #e2e8f0"
                        }}
                    >
                        {/* Admin Style Dark Slate Header */}
                        <div style={{
                            backgroundColor: "#0f172a",
                            color: "#ffffff",
                            padding: "18px 60px 18px 24px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderTopLeftRadius: "16px",
                            borderTopRightRadius: "16px",
                            position: "relative"
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#ffffff" }}>
                                    {modalMode === "create" ? "➕ Create New Placement Drive" : "✏️ Edit Placement Drive"}
                                </h3>
                                <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: "600" }}>
                                    {recruiterCompany}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFormModalOpen(false)}
                                style={{
                                    position: "absolute",
                                    top: "18px",
                                    right: "20px",
                                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                                    border: "none",
                                    color: "#ffffff",
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontSize: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ padding: "24px" }}>
                            {formError && (
                                <div style={{ backgroundColor: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", marginBottom: "16px" }}>
                                    {formError}
                                </div>
                            )}

                            <form onSubmit={handleSaveDrive} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                                {/* 🏢 1. COMPANY & RECRUITER INFORMATION (LOCKED) */}
                                <div style={{ backgroundColor: "#f8fafc", padding: "14px 16px", borderRadius: "10px", border: "1px solid #eaedf0" }}>
                                    <div style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                        🏢 Company & Recruiter Profile (Locked)
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                                Company Name 🔒
                                            </label>
                                            <input
                                                type="text"
                                                readOnly
                                                disabled
                                                value={recruiterCompany}
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#e2e8f0", color: "#0f172a", fontSize: "13px", fontWeight: "800", boxSizing: "border-box", cursor: "not-allowed" }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>
                                                Recruiter Contact 🔒
                                            </label>
                                            <input
                                                type="text"
                                                readOnly
                                                disabled
                                                value={`${user?.name || "Arya"} (${user?.email || "arya@amazon.com"})`}
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#e2e8f0", color: "#0f172a", fontSize: "13px", fontWeight: "700", boxSizing: "border-box", cursor: "not-allowed" }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 💼 2. JOB INFORMATION */}
                                <div>
                                    <div style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>
                                        💼 Job Information
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>Job Title / Designation</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Software Development Engineer (SDE-1)"
                                                value={formData.jobTitle}
                                                onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                            />
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>Job Type</label>
                                                <select
                                                    value={formData.jobType}
                                                    onChange={e => setFormData({ ...formData, jobType: e.target.value })}
                                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "#fff", boxSizing: "border-box" }}
                                                >
                                                    <option value="Full-Time (FTE)">Full-Time (FTE)</option>
                                                    <option value="Internship + FTE">Internship + FTE</option>
                                                    <option value="Contract">Contractual</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>Number of Openings</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={formData.openings || 10}
                                                    onChange={e => setFormData({ ...formData, openings: parseInt(e.target.value) || 1 })}
                                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>Location</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. Bangalore, India"
                                                    value={formData.location}
                                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>Package / CTC</label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. ₹24.0 LPA"
                                                    value={formData.packageCtc}
                                                    onChange={e => setFormData({ ...formData, packageCtc: e.target.value })}
                                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 🎓 3. ELIGIBILITY & CRITERIA */}
                                <div>
                                    <div style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>
                                        🎓 Eligibility & Criteria
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                                                <label style={{ fontSize: "12px", fontWeight: "700", color: "#334155", display: "flex", alignItems: "center", gap: "6px" }}>
                                                    <span>Eligible Branches</span>
                                                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#2563eb", backgroundColor: "#eff6ff", padding: "2px 8px", borderRadius: "12px", border: "1px solid #bfdbfe" }}>
                                                        {(formData.eligibleBranches || []).length} / {ALL_ENGINEERING_DEPARTMENTS.length} Selected
                                                    </span>
                                                </label>
                                                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectBranchPreset("all")}
                                                        style={{ padding: "3px 8px", fontSize: "11px", fontWeight: "700", color: "#2563eb", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "4px", cursor: "pointer" }}
                                                    >
                                                        Select All
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectBranchPreset("it")}
                                                        style={{ padding: "3px 8px", fontSize: "11px", fontWeight: "700", color: "#0284c7", backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "4px", cursor: "pointer" }}
                                                    >
                                                        IT & CS
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectBranchPreset("circuit")}
                                                        style={{ padding: "3px 8px", fontSize: "11px", fontWeight: "700", color: "#7c3aed", backgroundColor: "#f5f3ff", border: "1px solid #ddd6fe", borderRadius: "4px", cursor: "pointer" }}
                                                    >
                                                        Circuit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectBranchPreset("core")}
                                                        style={{ padding: "3px 8px", fontSize: "11px", fontWeight: "700", color: "#d97706", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "4px", cursor: "pointer" }}
                                                    >
                                                        Core
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectBranchPreset("clear")}
                                                        style={{ padding: "3px 8px", fontSize: "11px", fontWeight: "700", color: "#64748b", backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "4px", cursor: "pointer" }}
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </div>

                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: "8px", maxHeight: "240px", overflowY: "auto", padding: "8px", border: "1px solid #e2e8f0", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                                                {ALL_ENGINEERING_DEPARTMENTS.map((dept) => {
                                                    const isChecked = (formData.eligibleBranches || []).includes(dept.code);
                                                    return (
                                                        <div
                                                            key={dept.code}
                                                            onClick={() => handleBranchToggle(dept.code)}
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "flex-start",
                                                                gap: "8px",
                                                                padding: "8px 10px",
                                                                borderRadius: "6px",
                                                                border: isChecked ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                                                                backgroundColor: isChecked ? "#eff6ff" : "#ffffff",
                                                                boxShadow: isChecked ? "0 2px 4px rgba(37, 99, 235, 0.08)" : "none",
                                                                cursor: "pointer",
                                                                transition: "all 0.15s ease"
                                                            }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => { }}
                                                                style={{ accentColor: "#2563eb", marginTop: "2px", cursor: "pointer" }}
                                                            />
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
                                                                    <span style={{ fontSize: "12px", fontWeight: "800", color: isChecked ? "#1e40af" : "#0f172a" }}>
                                                                        {dept.code}
                                                                    </span>
                                                                </div>
                                                                <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={dept.fullName}>
                                                                    {dept.fullName}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>Minimum CGPA</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="10"
                                                    value={formData.minCgpa || 7.0}
                                                    onChange={e => setFormData({ ...formData, minCgpa: parseFloat(e.target.value) || 0 })}
                                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>Graduation Year</label>
                                                <input
                                                    type="number"
                                                    value={formData.gradYear || 2026}
                                                    onChange={e => setFormData({ ...formData, gradYear: parseInt(e.target.value) || 2026 })}
                                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>Active Backlogs</label>
                                                <select
                                                    value={formData.maxBacklogs || 0}
                                                    onChange={e => setFormData({ ...formData, maxBacklogs: parseInt(e.target.value) || 0 })}
                                                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "#fff", boxSizing: "border-box" }}
                                                >
                                                    <option value={0}>No Active Backlogs (0)</option>
                                                    <option value={1}>Max 1 Active Backlog</option>
                                                    <option value={2}>Max 2 Active Backlogs</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 📝 4. RECRUITMENT DETAILS */}
                                <div>
                                    <div style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>
                                        📝 Recruitment Details
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>Required Skills & Technologies (comma-separated)</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Java, Python, SQL, AWS, Data Structures"
                                                value={skillsInput}
                                                onChange={e => setSkillsInput(e.target.value)}
                                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>Selection Process</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Aptitude → Technical → HR"
                                                value={formData.selectionProcess || ""}
                                                onChange={e => setFormData({ ...formData, selectionProcess: e.target.value })}
                                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>Job Description & Responsibilities</label>
                                            <textarea
                                                rows={3}
                                                placeholder="Enter job roles, responsibilities, and team overview..."
                                                value={formData.jobDescription || ""}
                                                onChange={e => setFormData({ ...formData, jobDescription: e.target.value })}
                                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ⚙️ 5. DRIVE SETTINGS & DEADLINES */}
                                <div>
                                    <div style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>
                                        ⚙️ Drive Settings & Deadlines
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>Application Deadline *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. 28 Aug 2026"
                                                value={formData.deadline}
                                                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "4px" }}>Drive Date *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. 05 Sep 2026"
                                                value={formData.driveDate || "05 Sep 2026"}
                                                onChange={e => setFormData({ ...formData, driveDate: e.target.value })}
                                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* FORM MODAL ACTION BUTTONS */}
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsFormModalOpen(false)}
                                        style={{ padding: "9px 16px", backgroundColor: "#f8fafc", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        onClick={() => setSubmitAction("Draft")}
                                        style={{ padding: "9px 18px", backgroundColor: "#f1f5f9", color: "#0f172a", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                                    >
                                        <span>💾</span> Save as Draft
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        onClick={() => setSubmitAction("Pending Approval")}
                                        style={{ padding: "9px 20px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", boxShadow: "0 2px 4px rgba(37,99,235,0.2)" }}
                                    >
                                        <span>🚀</span> {formData.status === "Rejected" ? "Resubmit for Approval" : "Submit for Approval"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW ONLY DRIVE DETAILS MODAL (Complete Specification Details) */}
            {isViewModalOpen && viewDrive && (
                <div
                    onClick={() => setIsViewModalOpen(false)}
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
                            maxWidth: "640px",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                            border: "1px solid #e2e8f0"
                        }}
                    >
                        {/* Admin Style Dark Slate Header */}
                        <div style={{
                            backgroundColor: "#0f172a",
                            color: "#ffffff",
                            padding: "18px 60px 18px 24px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderTopLeftRadius: "16px",
                            borderTopRightRadius: "16px",
                            position: "relative"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#ffffff", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <img src={viewDrive.logo} alt={viewDrive.company} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#ffffff" }}>{viewDrive.jobTitle}</h3>
                                    <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: "600" }}>{viewDrive.company}</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsViewModalOpen(false)}
                                style={{
                                    position: "absolute",
                                    top: "18px",
                                    right: "20px",
                                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                                    border: "none",
                                    color: "#ffffff",
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontSize: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
                            {/* Grid Overview */}
                            <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", fontSize: "13px", border: "1px solid #f1f5f9" }}>
                                <div>
                                    <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>JOB TYPE</div>
                                    <div style={{ color: "#0f172a", fontWeight: "700", marginTop: "2px" }}>{viewDrive.jobType}</div>
                                </div>
                                <div>
                                    <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>PACKAGE / CTC</div>
                                    <div style={{ color: "#2563eb", fontWeight: "800", fontSize: "15px", marginTop: "2px" }}>{viewDrive.packageCtc}</div>
                                </div>
                                <div>
                                    <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>OPENINGS</div>
                                    <div style={{ color: "#0f172a", fontWeight: "700", marginTop: "2px" }}>{viewDrive.openings || 10} Positions</div>
                                </div>
                                <div>
                                    <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>LOCATION</div>
                                    <div style={{ color: "#334155", fontWeight: "600", marginTop: "2px" }}>📍 {viewDrive.location}</div>
                                </div>
                                <div>
                                    <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>DEADLINE</div>
                                    <div style={{ color: "#334155", fontWeight: "600", marginTop: "2px" }}>📅 {viewDrive.deadline}</div>
                                </div>
                                <div>
                                    <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>STATUS</div>
                                    <div style={{ marginTop: "2px" }}>
                                        <span style={{
                                            backgroundColor: getStatusStyle(viewDrive.status).bg,
                                            color: getStatusStyle(viewDrive.status).color,
                                            border: getStatusStyle(viewDrive.status).border,
                                            padding: "3px 10px",
                                            borderRadius: "12px",
                                            fontSize: "11px",
                                            fontWeight: "700"
                                        }}>
                                            {viewDrive.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Eligibility Box */}
                            <div style={{ border: "1px solid #eaedf0", borderRadius: "12px", padding: "16px", backgroundColor: "#ffffff" }}>
                                <div style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    🎓 Eligibility Requirements
                                </div>

                                <div style={{ marginBottom: "14px" }}>
                                    <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>ELIGIBLE BRANCHES</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                        {(viewDrive.eligibleBranches || ["CSE", "IT"]).map((b: string) => {
                                            const deptInfo = ALL_ENGINEERING_DEPARTMENTS.find(d => d.code === b || d.fullName === b);
                                            return (
                                                <span
                                                    key={b}
                                                    style={{
                                                        backgroundColor: "#eff6ff",
                                                        color: "#1d4ed8",
                                                        border: "1px solid #bfdbfe",
                                                        padding: "5px 12px",
                                                        borderRadius: "8px",
                                                        fontSize: "12px",
                                                        fontWeight: "700",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        whiteSpace: "nowrap"
                                                    }}
                                                    title={deptInfo ? deptInfo.fullName : b}
                                                >
                                                    <span>{b}</span>
                                                    {deptInfo && <span style={{ fontSize: "11px", opacity: 0.85, fontWeight: "500" }}>({deptInfo.fullName})</span>}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "12px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                                    <div>
                                        <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>MIN CGPA</div>
                                        <div style={{ color: "#0f172a", fontWeight: "800", fontSize: "15px", marginTop: "2px" }}>{viewDrive.minCgpa || 7.0} CGPA</div>
                                    </div>
                                    <div>
                                        <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>MAX BACKLOGS</div>
                                        <div style={{ color: "#0f172a", fontWeight: "800", fontSize: "15px", marginTop: "2px" }}>{viewDrive.maxBacklogs ?? 0} Allowed</div>
                                    </div>
                                    <div>
                                        <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>GRADUATION YEAR</div>
                                        <div style={{ color: "#0f172a", fontWeight: "800", fontSize: "15px", marginTop: "2px" }}>{viewDrive.gradYear || 2026} Batch</div>
                                    </div>
                                </div>
                            </div>

                            {/* Skills & Process */}
                            <div style={{ border: "1px solid #eaedf0", borderRadius: "12px", padding: "16px" }}>
                                <div style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a", marginBottom: "10px", textTransform: "uppercase" }}>
                                    📝 Skills & Selection Process
                                </div>
                                <div style={{ marginBottom: "10px" }}>
                                    <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "600", marginBottom: "4px" }}>REQUIRED SKILLS</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                        {(viewDrive.requiredSkills || ["Java", "React"]).map((skill, i) => (
                                            <span key={i} style={{ backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "700" }}>
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ color: "#64748b", fontSize: "11px", fontWeight: "600", marginBottom: "2px" }}>SELECTION PROCESS</div>
                                    <div style={{ color: "#334155", fontSize: "13px", fontWeight: "600" }}>{viewDrive.selectionProcess || "Aptitude → Technical → HR"}</div>
                                </div>
                            </div>

                            {/* Role Description */}
                            {viewDrive.jobDescription && (
                                <div style={{ border: "1px solid #eaedf0", borderRadius: "12px", padding: "16px" }}>
                                    <div style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a", marginBottom: "6px", textTransform: "uppercase" }}>
                                        📄 Job Description
                                    </div>
                                    <div style={{ color: "#475569", fontSize: "13px", lineHeight: "1.5" }}>
                                        {viewDrive.jobDescription}
                                    </div>
                                </div>
                            )}

                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <button
                                    type="button"
                                    onClick={() => setIsViewModalOpen(false)}
                                    style={{ padding: "9px 20px", backgroundColor: "#0f172a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default RecruiterPlacementDrives;
