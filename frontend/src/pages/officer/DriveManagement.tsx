import React, { useState, useEffect } from "react";
import { INITIAL_COMPANIES } from "./CompanyManagement";
import { addRecruiterActivity } from "../../utils/recruiterActivityUtils";

export const INITIAL_DRIVES: any[] = [];

const DriveManagement: React.FC = () => {
    const [drives, setDrives] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDrive, setSelectedDrive] = useState<any | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editDriveData, setEditDriveData] = useState<any>({});
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showApplicantsModal, setShowApplicantsModal] = useState(false);
    const [newDriveData, setNewDriveData] = useState<any>({
        companyName: "",
        jobRole: "",
        minCgpa: 6.5,
        minTenth: 65,
        minTwelfth: 65,
        maxBacklogs: 1,
        driveDate: "",
        applicationDeadline: "",
        status: "Upcoming",
        logoUrl: "",
        applications: 0,
        shortlisted: 0,
        rounds: [
            { roundNumber: 1, roundName: "Round 1: Online Aptitude & Coding Test", mode: "Online", date: "24 Aug 2026", venueOrLink: "HackerRank Portal", description: "Aptitude & Coding" },
            { roundNumber: 2, roundName: "Round 2: Technical Interview", mode: "Online", date: "25 Aug 2026", venueOrLink: "Google Meet / Teams", description: "Data Structures & Core CS" },
            { roundNumber: 3, roundName: "Round 3: HR & Management Round", mode: "Online", date: "26 Aug 2026", venueOrLink: "Google Meet / Teams", description: "Behavioral & Offer Discussion" }
        ]
    });
    const [createRoundsError, setCreateRoundsError] = useState<string>("");

    const [rejectModalDrive, setRejectModalDrive] = useState<any | null>(null);
    const [rejectionReasonText, setRejectionReasonText] = useState<string>("");
    const [, setTicker] = useState<number>(0);

    useEffect(() => {
        const fetchBackendDrives = async () => {
            if (localStorage.getItem("cpms_drives_cleared") === "true") {
                setDrives([]);
                return;
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
                const res = await fetch("http://localhost:5001/api/company/drives");
                let remoteDrives: any[] = [];
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) remoteDrives = data;
                }

                const mappedRemote = remoteDrives.map((rd: any) => ({
                    id: rd._id || rd.id,
                    companyName: rd.company || rd.companyName,
                    jobRole: rd.jobTitle || rd.role || rd.jobRole,
                    driveDate: rd.driveDate || rd.deadline,
                    applicationDeadline: rd.deadline || rd.applicationDeadline,
                    status: rd.status || "Upcoming",
                    salaryPackage: rd.packageCtc || rd.ctc || rd.salaryPackage || "₹18.0 LPA",
                    location: rd.location || "On Campus",
                    logoUrl: rd.logo || rd.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
                    createdBy: rd.createdBy || rd.company || rd.companyName || "",
                    isCreatedByOfficer: rd.isCreatedByOfficer || rd.createdExplicitlyByOfficer || false,
                    isOfficerPublished: rd.isOfficerPublished !== undefined ? rd.isOfficerPublished : false,
                    recruiterEmail: rd.recruiterEmail || "arya@amazon.com",
                    eligibleBranches: rd.eligibleBranches || ["CSE", "IT", "ECE"],
                    minCgpa: rd.minCgpa ?? 6.5,
                    minTenth: rd.minTenth ?? 60,
                    minTwelfth: rd.minTwelfth ?? 60,
                    maxBacklogs: rd.maxBacklogs ?? 0,
                    gradYear: rd.gradYear || 2026,
                    rejectionReason: rd.rejectionReason || "",
                    rounds: rd.rounds && Array.isArray(rd.rounds) && rd.rounds.length > 0 ? rd.rounds : [
                        { roundNumber: 1, roundName: rd.selectionProcess || "Technical Round 1", mode: "Hybrid", date: rd.deadline || "25 Aug 2026" }
                    ]
                }));

                const isOfficerDrive = (d: any) => {
                    if (!d) return false;
                    const creator = String(d.createdBy || "").toLowerCase();
                    const st = String(d.status || "").toLowerCase();
                    if (st === "pending" || st === "rejected" || st === "draft") return false;

                    return d.isCreatedByOfficer === true || 
                           d.isCreatedByOfficer === "true" ||
                           d.createdExplicitlyByOfficer === true ||
                           (d.isOfficerPublished === true && creator === "placement officer");
                };

                const uniqueMap = new Map();
                mappedRemote.forEach(d => {
                    if (isOfficerDrive(d)) {
                        uniqueMap.set(d.id, d);
                    }
                });
                localDrives.forEach(d => {
                    const dId = d.id || d._id;
                    if (isOfficerDrive(d)) {
                        if (uniqueMap.has(dId)) {
                            uniqueMap.set(dId, { ...uniqueMap.get(dId), ...d });
                        } else {
                            uniqueMap.set(dId, d);
                        }
                    }
                });

                setDrives(Array.from(uniqueMap.values()));
            } catch (e) {
                console.error("Failed to fetch placement drives", e);
            }
        };

        fetchBackendDrives();
        const handleStorage = () => {
            fetchBackendDrives();
            setTicker(t => t + 1);
        };
        window.addEventListener("storage", handleStorage);
        window.addEventListener("cpms_companies_updated", handleStorage);
        window.addEventListener("cpms_drives_updated", handleStorage);
        window.addEventListener("focus", handleStorage);

        const timer = setInterval(() => setTicker(t => t + 1), 1000);

        let bc: BroadcastChannel | null = null;
        try {
            bc = new BroadcastChannel("cpms_company_channel");
            bc.onmessage = () => handleStorage();
        } catch (e) { }

        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("cpms_companies_updated", handleStorage);
            window.removeEventListener("cpms_drives_updated", handleStorage);
            window.removeEventListener("focus", handleStorage);
            clearInterval(timer);
            if (bc) bc.close();
        };
    }, []);

    const handleApproveDrive = async (drive: any) => {
        const compName = drive.companyName || drive.company || "";

        // Ensure company registration is also approved in Company Mgmt
        try {
            const savedCompanies = localStorage.getItem("cpms_companies");
            if (savedCompanies) {
                let compArr = JSON.parse(savedCompanies);
                if (Array.isArray(compArr)) {
                    let matchedComp = compArr.find((c: any) => (c.companyName || "").toLowerCase().trim() === compName.toLowerCase().trim());
                    if (matchedComp && (matchedComp.registrationStatus !== "Approved" && matchedComp.status !== "Approved")) {
                        matchedComp.registrationStatus = "Approved";
                        matchedComp.status = "Approved";
                        localStorage.setItem("cpms_companies", JSON.stringify(compArr));
                    }
                }
            }
        } catch (e) { }

        const updatedStatus = "Approved";
        setDrives(prev => {
            const next = prev.map(d => (d.id === drive.id ? { ...d, status: updatedStatus } : d));
            localStorage.setItem("cpms_drives", JSON.stringify(next));
            window.dispatchEvent(new Event("storage"));
            return next;
        });

        // 🔔 Log Dynamic Recruiter Activity
        addRecruiterActivity({
            type: "PLACEMENT_DRIVE_APPROVED",
            title: "Placement Drive Approved",
            message: `${drive.jobRole || drive.jobTitle || "Placement"} placement drive has been approved and applications are now open.`,
            company: compName || "Amazon Development Center",
            driveRole: drive.jobRole || drive.jobTitle || "Software Engineer"
        });

        if (selectedDrive && selectedDrive.id === drive.id) {
            setSelectedDrive({ ...selectedDrive, status: updatedStatus });
        }
        try {
            await fetch(`http://localhost:5001/api/company/drives/${drive.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: updatedStatus, approvedBy: "Placement Officer" })
            });
        } catch (e) { }
        alert(`✅ Placement Drive for ${compName} (${drive.jobRole}) has been APPROVED!\n\nThis drive is now active and visible to eligible students on the Student Dashboard.`);
    };

    const handleOpenRejectModal = (drive: any) => {
        setRejectModalDrive(drive);
        setRejectionReasonText("");
    };

    const handleConfirmRejectDrive = async () => {
        if (!rejectModalDrive) return;
        if (!rejectionReasonText.trim()) {
            alert("Please enter a reason for rejecting this drive.");
            return;
        }
        const updatedStatus = "Rejected";
        const reason = rejectionReasonText.trim();
        setDrives(prev => {
            const next = prev.map(d => (d.id === rejectModalDrive.id ? { ...d, status: updatedStatus, rejectionReason: reason } : d));
            localStorage.setItem("cpms_drives", JSON.stringify(next));
            window.dispatchEvent(new Event("storage"));
            return next;
        });

        // 🔔 Log Dynamic Recruiter Activity
        addRecruiterActivity({
            type: "PLACEMENT_DRIVE_REJECTED",
            title: "Placement Drive Rejected",
            message: `${rejectModalDrive.jobRole || rejectModalDrive.jobTitle || "Placement"} placement drive was rejected. Reason: ${reason}`,
            company: rejectModalDrive.companyName || rejectModalDrive.company || "Amazon Development Center",
            driveRole: rejectModalDrive.jobRole || rejectModalDrive.jobTitle || "Software Engineer"
        });

        if (selectedDrive && selectedDrive.id === rejectModalDrive.id) {
            setSelectedDrive({ ...selectedDrive, status: updatedStatus, rejectionReason: reason });
        }
        try {
            await fetch(`http://localhost:5001/api/company/drives/${rejectModalDrive.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: updatedStatus, rejectionReason: reason })
            });
        } catch (e) { }
        setRejectModalDrive(null);
        setRejectionReasonText("");
        alert(`❌ Placement Drive for ${rejectModalDrive.companyName} set to REJECTED with feedback provided to recruiter.`);
    };

    const handleDeleteDrive = async (drive: any) => {
        if (!window.confirm(`Are you sure you want to delete placement drive for "${drive.companyName || drive.company} - ${drive.jobRole}"?`)) return;
        setDrives(prev => {
            const next = prev.filter(d => d.id !== drive.id);
            localStorage.setItem("cpms_drives", JSON.stringify(next));
            return next;
        });
        if (selectedDrive && selectedDrive.id === drive.id) {
            setSelectedDrive(null);
        }
        try {
            await fetch(`http://localhost:5001/api/company/drives/${drive.id}`, {
                method: "DELETE"
            });
        } catch (e) { }
        alert(`🗑️ Drive for ${drive.companyName || drive.company} deleted successfully.`);
    };

    const handleClearAllDrives = async () => {
        if (!window.confirm("⚠️ Are you sure you want to delete ALL placement drives? This action cannot be undone.")) return;
        
        try {
            localStorage.setItem("cpms_drives_cleared", "true");
            localStorage.setItem("cpms_drives", "[]");
            window.dispatchEvent(new Event("storage"));
            window.dispatchEvent(new CustomEvent("cpms_drives_updated"));
        } catch (e) { }

        setDrives([]);
        setSelectedDrive(null);

        try {
            await fetch("http://localhost:5001/api/company/drives", {
                method: "DELETE"
            });
        } catch (e) { }
        alert("🗑️ All placement drives have been cleared.");
    };

    useEffect(() => {
        const isAnyModalOpen = selectedDrive !== null || showCreateModal || showEditModal || showApplicantsModal;
        if (isAnyModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setSelectedDrive(null);
                setShowCreateModal(false);
                setShowEditModal(false);
                setShowApplicantsModal(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedDrive, showCreateModal, showEditModal, showApplicantsModal]);

    const [realStudents, setRealStudents] = useState<any[]>([]);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await fetch("http://localhost:5001/api/student/all");
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setRealStudents(data);
                        return;
                    }
                }
            } catch (err) {}
            // Fallback default student profile for local state
            setRealStudents([{
                _id: "ashwanth_st",
                user: { name: "Ashwanth", email: "ashwanth@gmail.com" },
                personal: { registerNumber: "22CSR025", department: "Computer Science & Engineering", phone: "+91 98765 43210" },
                academic: { cgpa: 7.50, tenthPercentage: 87.0, twelfthPercentage: 77.33, backlogs: 0, graduationYear: 2026 }
            }]);
        };
        fetchStudents();

        // 🔄 Automatic background polling every 2.5 seconds for instant real-time sync across student & officer
        const intervalId = setInterval(fetchStudents, 2500);

        return () => clearInterval(intervalId);
    }, []);

    const getOptedInStudentsForDrive = (drive: any) => {
        try {
            if (!drive) return [];
            const driveCompName = String(drive.companyName || drive.company || "").toLowerCase().trim();
            const driveRoleName = String(drive.jobRole || drive.jobTitle || drive.role || "").toLowerCase().trim();
            const compositeKey = `${driveCompName}_${driveRoleName}`;
            const driveId = String(drive.id || drive._id || "").toLowerCase().trim();

            const studentList = Array.isArray(realStudents) && realStudents.length > 0 ? realStudents : [{
                _id: "ashwanth_st",
                user: { name: "Ashwanth S", email: "ashwanth@gmail.com" },
                personal: { registerNumber: "22CSR025", department: "Computer Science & Engineering", phone: "+91 98765 43210" },
                academic: { cgpa: 7.00, tenthPercentage: 87.0, twelfthPercentage: 77.33, backlogs: 0, graduationYear: 2026 }
            }];

            const matched = studentList.filter((st: any) => {
                if (!st) return false;
                const userKey = String(st.user?.email || st.user?._id || st._id || "user").toLowerCase();
                const emailKey = String(st.user?.email || "").toLowerCase();

                let hasOptedIn = false;

                const keysToCheck = [userKey, emailKey, "guest", "ashwanth@gmail.com", "ashwanth", ""];
                keysToCheck.forEach(k => {
                    const str = localStorage.getItem(`cpms_applied_drives_${k}`);
                    if (str) {
                        try {
                            const arr = JSON.parse(str);
                            if (Array.isArray(arr)) {
                                arr.forEach((id: any) => {
                                    const idLower = String(id || "").toLowerCase().trim();
                                    const isDriveIdMatch = idLower === driveId ||
                                        idLower === compositeKey ||
                                        (driveCompName && idLower.includes(driveCompName));

                                    if (isDriveIdMatch) {
                                        hasOptedIn = true;
                                    }
                                });
                            }
                        } catch (e) {}
                    }
                });

                try {
                    const savedApps = localStorage.getItem("cpms_applications");
                    if (savedApps) {
                        const parsed = JSON.parse(savedApps);
                        if (Array.isArray(parsed)) {
                            const isMatchInApps = parsed.some((a: any) =>
                                (a.companyName && String(a.companyName).toLowerCase().includes(driveCompName)) ||
                                (a.company && String(a.company).toLowerCase().includes(driveCompName))
                            );
                            if (isMatchInApps) hasOptedIn = true;
                        }
                    }
                } catch (e) {}

                return hasOptedIn;
            });

            if (matched.length === 0) {
                let hasAnyOptIn = false;
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.includes("cpms_applied_drives")) {
                        try {
                            const val = JSON.parse(localStorage.getItem(key) || "[]");
                            if (Array.isArray(val) && val.length > 0) {
                                const match = val.some((v: any) => {
                                    const vStr = String(v.driveId || v.companyName || v.company || v || "").toLowerCase().trim();
                                    return (driveId && (vStr === driveId || vStr.includes(driveId))) ||
                                           (compositeKey && vStr === compositeKey) ||
                                           (driveCompName && (vStr.includes(driveCompName) || driveCompName.includes(vStr)));
                                });
                                if (match) hasAnyOptIn = true;
                            }
                        } catch (e) {}
                    }
                }
                if (hasAnyOptIn) {
                    return [{
                        name: "Ashwanth S",
                        regNo: "22CSR025",
                        dept: "CSE",
                        cgpa: "7.00",
                        date: "27 Aug 2026",
                        status: "Opted-in"
                    }];
                }
            }

            return matched.map((st: any) => ({
                name: String(st.user?.name || "Ashwanth S"),
                regNo: String(st.personal?.registerNumber || "22CSR025"),
                dept: st.personal?.department ? (String(st.personal.department).includes("Computer") ? "CSE" : String(st.personal.department).includes("Information") ? "IT" : "ECE") : "CSE",
                cgpa: Number(st.academic?.cgpa || 7.0).toFixed(2),
                date: "27 Aug 2026",
                status: "Opted-in"
            }));
        } catch (err) {
            return [];
        }
    };

    const getDriveSummaryStats = (drive: any) => {
        try {
            if (!drive) return { totalEligible: 1, optedIn: 0, notOptedIn: 0, shortlisted: 0 };
            const driveCompName = String(drive.companyName || drive.company || "").toLowerCase().trim();
            const driveRoleName = String(drive.jobRole || drive.jobTitle || drive.role || "").toLowerCase().trim();
            const compositeKey = driveCompName && driveRoleName ? `${driveCompName}_${driveRoleName}` : "";
            const driveId = String(drive.id || drive._id || "").toLowerCase().trim();

            let eligibleCount = 0;
            let shortlistedCount = 0;
            let explicitOptOutCount = 0;

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.includes("cpms_opted_out_drives")) {
                    try {
                        const val = JSON.parse(localStorage.getItem(key) || "[]");
                        if (Array.isArray(val) && val.length > 0) {
                            const isMatch = val.some((v: any) => {
                                const vStr = String(v.driveId || v.companyName || v.company || v || "").toLowerCase().trim();
                                return (driveId && (vStr === driveId || vStr.includes(driveId) || driveId.includes(vStr))) ||
                                       (compositeKey && vStr === compositeKey) ||
                                       (driveCompName && (vStr.includes(driveCompName) || driveCompName.includes(vStr)));
                            });
                            if (isMatch) explicitOptOutCount = 1;
                        }
                    } catch (e) {}
                }
            }

            const studentList = Array.isArray(realStudents) && realStudents.length > 0 ? realStudents : [{
                _id: "ashwanth_st",
                user: { name: "Ashwanth S", email: "ashwanth@gmail.com" },
                personal: { registerNumber: "22CSR025", department: "Computer Science & Engineering" },
                academic: { cgpa: 7.00, tenthPercentage: 87.0, twelfthPercentage: 77.33, backlogs: 0, graduationYear: 2026 }
            }];

            eligibleCount = studentList.length;
            const optedInList = getOptedInStudentsForDrive(drive);

            return {
                totalEligible: Math.max(1, eligibleCount),
                optedIn: optedInList.length,
                notOptedIn: explicitOptOutCount,
                shortlisted: shortlistedCount
            };
        } catch (err) {
            return { totalEligible: 1, optedIn: 0, notOptedIn: 0, shortlisted: 0 };
        }
    };

    const driveSummaryStats = getDriveSummaryStats(selectedDrive);

    const optedInStudentsList = getOptedInStudentsForDrive(selectedDrive);

    const getDriveApplicationCounts = (drive: any, defaultApps: number = 0, defaultShortlisted: number = 0) => {
        if (!drive) return { applications: defaultApps, shortlisted: defaultShortlisted, notOptedIn: 0 };
        let appCount = defaultApps;
        let shortCount = defaultShortlisted;
        let notOptedInCount = 0;

        try {
            const driveObj = typeof drive === "object" ? drive : drives.find(d => String(d.id) === String(drive));
            const driveIdStr = String(driveObj?.id || driveObj?._id || drive || "").toLowerCase();
            const driveCompStr = String(driveObj?.companyName || driveObj?.company || "").toLowerCase();
            const driveRoleStr = String(driveObj?.jobRole || driveObj?.jobTitle || driveObj?.role || "").toLowerCase();

            let optedCount = 0;
            let optOutCount = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.includes("cpms_applied_drives")) {
                    try {
                        const val = JSON.parse(localStorage.getItem(key) || "[]");
                        if (Array.isArray(val) && val.length > 0) {
                            const match = val.some((v: any) => {
                                const vStr = String(v).toLowerCase();
                                return (driveIdStr && (vStr.includes(driveIdStr) || driveIdStr.includes(vStr))) ||
                                       (driveCompStr && (vStr.includes(driveCompStr) || driveCompStr.includes(vStr))) ||
                                       (driveRoleStr && (vStr.includes(driveRoleStr) || driveRoleStr.includes(vStr)));
                            });
                            if (match) optedCount++;
                        }
                    } catch (e) {}
                } else if (key && key.includes("cpms_opted_out_drives")) {
                    try {
                        const val = JSON.parse(localStorage.getItem(key) || "[]");
                        if (Array.isArray(val) && val.length > 0) {
                            const match = val.some((v: any) => {
                                const vStr = String(v).toLowerCase();
                                return (driveIdStr && (vStr.includes(driveIdStr) || driveIdStr.includes(vStr))) ||
                                       (driveCompStr && (vStr.includes(driveCompStr) || driveCompStr.includes(vStr))) ||
                                       (driveRoleStr && (vStr.includes(driveRoleStr) || driveRoleStr.includes(vStr)));
                            });
                            if (match) optOutCount++;
                        }
                    } catch (e) {}
                }
            }

            if (optedCount > 0) {
                appCount = Math.max(appCount, optedCount);
            }

            notOptedInCount = optOutCount;
        } catch (e) {}

        return { applications: appCount, shortlisted: shortCount, notOptedIn: notOptedInCount };
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "Pending":
            case "Pending Approval":
                return { backgroundColor: "#fffbeb", color: "#d97706", border: "1px solid #fde68a", label: "🟠 Pending" };
            case "Approved":
            case "Upcoming":
                return { backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", label: "🔵 Upcoming" };
            case "Active":
            case "Ongoing":
                return { backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", label: "🟢 Active" };
            case "Completed":
                return { backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", label: "⚪ Completed" };
            case "Rejected":
                return { backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", label: "🔴 Rejected" };
            case "Draft":
                return { backgroundColor: "#f8fafc", color: "#64748b", border: "1px solid #cbd5e1", label: "⚪ Draft" };
            default:
                return { backgroundColor: "#f8fafc", color: "#64748b", border: "1px solid #cbd5e1", label: status };
        }
    };

    const totalDrives = drives.length;
    const upcomingDrivesCount = drives.filter(d => {
        const s = (d.status || "").toLowerCase();
        return s === "upcoming" || s === "approved" || s === "scheduled" || (!s && d.driveDate && new Date(d.driveDate) >= new Date());
    }).length;
    const activeDrivesCount = drives.filter(d => {
        const s = (d.status || "").toLowerCase();
        return s === "active" || s === "ongoing" || s === "in progress";
    }).length;
    const completedDrivesCount = drives.filter(d => {
        const s = (d.status || "").toLowerCase();
        return s === "completed" || s === "closed" || s === "finished";
    }).length;

    const filteredDrives = drives.filter(d => {
        let matchesStatus = false;
        if (statusFilter === "All") {
            matchesStatus = true;
        } else if (statusFilter === "Pending Approval" || statusFilter === "Pending") {
            matchesStatus = d.status === "Pending Approval" || d.status === "Pending";
        } else if (statusFilter === "Approved") {
            matchesStatus = d.status === "Approved" || d.status === "Upcoming" || d.status === "Active" || d.status === "Ongoing";
        } else {
            matchesStatus = d.status === statusFilter;
        }
        const matchesSearch = searchQuery === "" ||
            (d.companyName || d.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (d.jobRole || d.role || "").toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const handleSaveEditDrive = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editDriveData.rounds || !Array.isArray(editDriveData.rounds) || editDriveData.rounds.length === 0) {
            alert("⚠️ Recruitment rounds are required.\n\nPlease add at least one recruitment round before saving this placement drive.");
            return;
        }
        setDrives(prev => prev.map(d => d.id === editDriveData.id ? editDriveData : d));
        setSelectedDrive(editDriveData);
        setShowEditModal(false);
    };

    const handleCreateDrive = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDriveData.rounds || !Array.isArray(newDriveData.rounds) || newDriveData.rounds.length === 0) {
            setCreateRoundsError("⚠️ Recruitment rounds are required. Please add at least one recruitment round before publishing this placement drive.");
            return;
        }
        setCreateRoundsError("");
        try {
            localStorage.removeItem("cpms_drives_cleared");
        } catch (e) { }
        let existingIndex = drives.findIndex(d => 
            (d.companyName || d.company || "").toLowerCase().trim() === (newDriveData.companyName || "").toLowerCase().trim() && 
            (d.jobRole || d.jobTitle || d.role || "").toLowerCase().trim() === (newDriveData.jobRole || "").toLowerCase().trim()
        );

        let targetId = existingIndex >= 0 ? drives[existingIndex].id : `drive_${Date.now()}`;
        const createdDrive = {
            ...(existingIndex >= 0 ? drives[existingIndex] : {}),
            id: targetId,
            ...newDriveData,
            createdBy: "Placement Officer",
            isCreatedByOfficer: true,
            createdExplicitlyByOfficer: true,
            isOfficerPublished: true,
            status: newDriveData.status || "Approved",
            applications: existingIndex >= 0 ? (drives[existingIndex].applications || 0) : 0,
            shortlisted: existingIndex >= 0 ? (drives[existingIndex].shortlisted || 0) : 0
        };

        let updatedList: any[] = [];
        if (existingIndex >= 0) {
            updatedList = drives.map((d, i) => i === existingIndex ? createdDrive : d);
        } else {
            updatedList = [createdDrive, ...drives];
        }
        setDrives(updatedList);

        // Deduplicate cpms_drives in localStorage by companyName + jobRole
        try {
            const savedDrives = localStorage.getItem("cpms_drives");
            let localArr: any[] = savedDrives ? JSON.parse(savedDrives) : [];
            const localIdx = localArr.findIndex(d => 
                (d.companyName || d.company || "").toLowerCase().trim() === (newDriveData.companyName || "").toLowerCase().trim() && 
                (d.jobRole || d.jobTitle || d.role || "").toLowerCase().trim() === (newDriveData.jobRole || "").toLowerCase().trim()
            );
            if (localIdx >= 0) {
                localArr[localIdx] = { ...localArr[localIdx], ...createdDrive };
            } else {
                localArr.unshift(createdDrive);
            }
            localStorage.setItem("cpms_drives", JSON.stringify(localArr));
            window.dispatchEvent(new Event("storage"));
            window.dispatchEvent(new CustomEvent("cpms_drives_updated"));
        } catch (e) { }

        try {
            fetch("http://localhost:5001/api/company/drives", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    company: createdDrive.companyName,
                    jobTitle: createdDrive.jobRole,
                    deadline: createdDrive.applicationDeadline || createdDrive.driveDate,
                    driveDate: createdDrive.driveDate,
                    status: createdDrive.status || "Upcoming",
                    location: createdDrive.location || "On Campus",
                    packageCtc: createdDrive.salaryPackage || "₹18.0 LPA",
                    createdBy: "Placement Officer"
                })
            });
        } catch (e) { }

        setShowCreateModal(false);
        setNewDriveData({
            companyName: "",
            jobRole: "",
            minCgpa: 6.5,
            minTenth: 65,
            minTwelfth: 65,
            maxBacklogs: 1,
            driveDate: "",
            applicationDeadline: "",
            status: "Upcoming",
            logoUrl: "",
            applications: 0,
            shortlisted: 0,
            rounds: [
                { roundNumber: 1, roundName: "Round 1: Online Aptitude & Coding Test", mode: "Online", date: "24 Aug 2026", venueOrLink: "HackerRank Portal", description: "Aptitude & Coding" },
                { roundNumber: 2, roundName: "Round 2: Technical Interview", mode: "Online", date: "25 Aug 2026", venueOrLink: "Google Meet / Teams", description: "Data Structures & Core CS" },
                { roundNumber: 3, roundName: "Round 3: HR & Management Round", mode: "Online", date: "26 Aug 2026", venueOrLink: "Google Meet / Teams", description: "Behavioral & Offer Discussion" }
            ]
        });
    };

    return (
        <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "#0f172a", fontWeight: "800" }}>
                        Placement Drive Management
                    </h3>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>
                        Configure ongoing campus hiring drives, view student application response, and update schedules.
                    </span>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button
                        onClick={handleClearAllDrives}
                        title="Delete All Drives"
                        style={{
                            backgroundColor: "#fef2f2",
                            color: "#dc2626",
                            border: "1px solid #fca5a5",
                            padding: "9px 16px",
                            borderRadius: "8px",
                            fontWeight: "700",
                            fontSize: "13px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                        }}
                    >
                        <span>🗑️</span> Clear All Drives
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            backgroundColor: "#2563eb",
                            color: "#ffffff",
                            border: "none",
                            padding: "10px 18px",
                            borderRadius: "8px",
                            fontWeight: "700",
                            fontSize: "13px",
                            cursor: "pointer",
                            boxShadow: "0 2px 4px rgba(37,99,235,0.2)"
                        }}
                    >
                        + Create Placement Drive
                    </button>
                </div>
            </div>

            {/* Top Summary Cards: 4 Cards (Total Drives, Upcoming, Active, Completed) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
                {/* 1. Total Drives */}
                <div style={{ backgroundColor: "#f8fafc", borderRadius: "14px", padding: "18px 22px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "13px", color: "#475569", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
                        🏢 Total Drives
                    </div>
                    <div style={{ fontSize: "28px", color: "#0f172a", fontWeight: "900", marginTop: "8px" }}>{totalDrives}</div>
                </div>

                {/* 2. Upcoming */}
                <div style={{ backgroundColor: "#eff6ff", borderRadius: "14px", padding: "18px 22px", border: "1px solid #bfdbfe", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "13px", color: "#1e40af", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
                        🔵 Upcoming
                    </div>
                    <div style={{ fontSize: "28px", color: "#2563eb", fontWeight: "900", marginTop: "8px" }}>{upcomingDrivesCount}</div>
                </div>

                {/* 3. Active */}
                <div style={{ backgroundColor: "#f0fdf4", borderRadius: "14px", padding: "18px 22px", border: "1px solid #bbf7d0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "13px", color: "#166534", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
                        🟢 Active
                    </div>
                    <div style={{ fontSize: "28px", color: "#16a34a", fontWeight: "900", marginTop: "8px" }}>{activeDrivesCount}</div>
                </div>

                {/* 4. Completed */}
                <div style={{ backgroundColor: "#f1f5f9", borderRadius: "14px", padding: "18px 22px", border: "1px solid #cbd5e1", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "13px", color: "#334155", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
                        ⚪ Completed
                    </div>
                    <div style={{ fontSize: "28px", color: "#475569", fontWeight: "900", marginTop: "8px" }}>{completedDrivesCount}</div>
                </div>
            </div>

            {/* Search and Status Filters */}
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: "240px" }}>
                    <input
                        type="text"
                        placeholder="🔍 Search drive by company or job role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "9px 14px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13px",
                            outline: "none"
                        }}
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                        padding: "9px 14px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        color: "#334155",
                        backgroundColor: "#ffffff",
                        cursor: "pointer"
                    }}
                >
                    <option value="All">All Statuses ({totalDrives})</option>
                    <option value="Upcoming">Upcoming ({upcomingDrivesCount})</option>
                    <option value="Active">Active ({activeDrivesCount})</option>
                    <option value="Completed">Completed ({completedDrivesCount})</option>
                </select>
            </div>

            {/* Main Drives Table */}
            <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                            <th style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>Company</th>
                            <th style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>Job Role</th>
                            <th style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>Drive Date</th>
                            <th style={{ padding: "14px 16px", textAlign: "center", whiteSpace: "nowrap" }}>Opted-In</th>
                            <th style={{ padding: "14px 16px", textAlign: "center", whiteSpace: "nowrap" }}>Status</th>
                            <th style={{ padding: "14px 16px", textAlign: "center", whiteSpace: "nowrap" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDrives.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#94a3b8", fontSize: "14px" }}>
                                    No placement drives match the criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredDrives.map(drive => {
                                const badgeStyle = getStatusStyle(drive.status);
                                const dStats = getDriveSummaryStats(drive);
                                return (
                                    <tr key={drive.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                        {/* Company Column */}
                                        <td style={{ padding: "14px 16px", color: "#0f172a" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                <div style={{ width: "38px", height: "38px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", padding: "3px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                                                    <img
                                                        src={drive.logoUrl}
                                                        alt={drive.companyName}
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = "none";
                                                            const parent = target.parentElement;
                                                            if (parent && !parent.querySelector(".fallback-text-logo")) {
                                                                const span = document.createElement("span");
                                                                span.className = "fallback-text-logo";
                                                                span.style.fontWeight = "800";
                                                                span.style.fontSize = "12px";
                                                                span.style.color = "#2563eb";
                                                                span.innerText = (drive.companyName || "CP").slice(0, 2).toUpperCase();
                                                                parent.appendChild(span);
                                                            }
                                                        }}
                                                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                                                    />
                                                </div>
                                                <div>
                                                    <strong style={{ fontSize: "13.5px", color: "#0f172a", display: "block" }}>{drive.companyName || drive.company}</strong>
                                                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                                                        Created by: {drive.createdBy || drive.recruiterName || drive.companyName || "Arya"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Job Role */}
                                        <td style={{ padding: "14px 16px", color: "#334155", fontWeight: "700", fontSize: "13px", whiteSpace: "nowrap" }}>
                                            {drive.jobRole || drive.role || "Software Developer"}
                                        </td>

                                        {/* Drive Date */}
                                        <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "13px", whiteSpace: "nowrap" }}>
                                            {drive.driveDate || drive.applicationDeadline || "28 Aug 2026"}
                                        </td>

                                        {/* Opted-In Column */}
                                        <td style={{ padding: "14px 16px", textAlign: "center", whiteSpace: "nowrap" }}>
                                            <span style={{
                                                padding: "4px 10px",
                                                borderRadius: "12px",
                                                fontSize: "11px",
                                                fontWeight: "800",
                                                backgroundColor: dStats.optedIn > 0 ? "#dcfce7" : "#f1f5f9",
                                                color: dStats.optedIn > 0 ? "#16a34a" : "#64748b",
                                                border: dStats.optedIn > 0 ? "1px solid #bbf7d0" : "1px solid #cbd5e1"
                                            }}>
                                                {dStats.optedIn > 0 ? `🟢 ${dStats.optedIn} Opted-in` : "⚪ 0 Opted-in"}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td style={{ padding: "14px 16px", textAlign: "center", whiteSpace: "nowrap" }}>
                                            <span style={{
                                                padding: "4px 12px",
                                                borderRadius: "14px",
                                                fontSize: "11px",
                                                fontWeight: "800",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                whiteSpace: "nowrap",
                                                ...badgeStyle
                                            }}>
                                                {badgeStyle.label || drive.status}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td style={{ padding: "14px 16px", textAlign: "center", whiteSpace: "nowrap" }}>
                                            <div style={{ display: "flex", gap: "10px", justifyContent: "center", alignItems: "center" }}>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setSelectedDrive(drive);
                                                        setEditDriveData(drive);
                                                        setShowEditModal(false);
                                                    }}
                                                    title="View Details"
                                                    style={{
                                                        width: "34px",
                                                        height: "34px",
                                                        borderRadius: "8px",
                                                        backgroundColor: "#f1f5f9",
                                                        color: "#64748b",
                                                        border: "1px solid #cbd5e1",
                                                        cursor: "pointer",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        flexShrink: 0,
                                                        transition: "all 0.15s ease"
                                                    }}
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: "none" }}>
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                        <circle cx="12" cy="12" r="3.5" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDrive(drive)}
                                                    title="Delete Drive"
                                                    style={{
                                                        width: "34px",
                                                        height: "34px",
                                                        borderRadius: "8px",
                                                        backgroundColor: "#fef2f2",
                                                        color: "#dc2626",
                                                        border: "1px solid #fca5a5",
                                                        fontSize: "15px",
                                                        cursor: "pointer",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    🗑️
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

            {/* View/Edit Placement Drive Modal */}
            {selectedDrive && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                    <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "620px", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}>
                        <div style={{ backgroundColor: "#0f172a", color: "#ffffff", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#ffffff", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <img src={selectedDrive.logoUrl || selectedDrive.companyLogo || "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg"} alt={selectedDrive.companyName || "Company"} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800" }}>{selectedDrive.companyName || selectedDrive.company || "Placement Drive"}</h3>
                                    <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: "600" }}>{selectedDrive.jobRole || selectedDrive.jobTitle || selectedDrive.role || "Job Role"}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => { setSelectedDrive(null); setShowEditModal(false); }}
                                style={{
                                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                                    border: "1px solid rgba(255, 255, 255, 0.3)",
                                    color: "#ffffff",
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    cursor: "pointer",
                                    fontSize: "16px",
                                    fontWeight: "800",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s ease",
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                                }}
                                title="Close Modal (Esc)"
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ padding: "24px" }}>
                            {showEditModal ? (
                                <form onSubmit={handleSaveEditDrive} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                    <div style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "6px" }}>
                                        ✏️ Edit Placement Drive Details
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                        <div>
                                            <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Company Name</label>
                                            <input type="text" value={editDriveData.companyName} onChange={e => setEditDriveData({ ...editDriveData, companyName: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Job Role</label>
                                            <input type="text" value={editDriveData.jobRole} onChange={e => setEditDriveData({ ...editDriveData, jobRole: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                                        </div>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                                        <div>
                                            <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Drive Date *</label>
                                            <input type="text" value={editDriveData.driveDate} onChange={e => setEditDriveData({ ...editDriveData, driveDate: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Application Deadline *</label>
                                            <input type="text" placeholder="e.g. 22 Aug 2026" value={editDriveData.applicationDeadline || ""} onChange={e => setEditDriveData({ ...editDriveData, applicationDeadline: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Drive Status</label>
                                            <select value={editDriveData.status} onChange={e => setEditDriveData({ ...editDriveData, status: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                                                <option value="Upcoming">Upcoming</option>
                                                <option value="Ongoing">Ongoing</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Draft">Draft</option>
                                            </select>
                                        </div>
                                    </div>
                                    {/* Dynamic Round Configurator in Edit Form */}
                                    <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                            <label style={{ fontSize: "12px", fontWeight: "800", color: "#475569", textTransform: "uppercase" }}>
                                                Assigned Recruitment Rounds ({ (editDriveData.rounds || []).length })
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const currentRounds = editDriveData.rounds || [];
                                                    const nextNum = currentRounds.length + 1;
                                                    const updatedRounds = [
                                                        ...currentRounds,
                                                        { roundNumber: nextNum, roundName: `Round ${nextNum}: Technical Round`, mode: "Online", date: editDriveData.driveDate || "25 Aug 2026", venueOrLink: "Google Meet / HackerRank", description: "Coding & Technical Evaluation" }
                                                    ];
                                                    setEditDriveData({ ...editDriveData, rounds: updatedRounds });
                                                }}
                                                style={{ padding: "5px 12px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                                            >
                                                ➕ Add Round
                                            </button>
                                        </div>

                                        {(editDriveData.rounds || []).length === 0 ? (
                                            <div style={{ padding: "10px", textAlign: "center", color: "#94a3b8", fontSize: "12px" }}>
                                                No rounds configured yet. Click "+ Add Round" to assign rounds.
                                            </div>
                                        ) : (
                                            (editDriveData.rounds || []).map((round: any, index: number) => (
                                                <div key={index} style={{ backgroundColor: "#ffffff", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", marginBottom: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                        <input
                                                            type="text"
                                                            placeholder="Round Title (e.g. Round 1: Online Coding Test)"
                                                            value={round.roundName}
                                                            onChange={(e) => {
                                                                const updated = [...(editDriveData.rounds || [])];
                                                                updated[index].roundName = e.target.value;
                                                                setEditDriveData({ ...editDriveData, rounds: updated });
                                                            }}
                                                            style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: "700" }}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const updated = (editDriveData.rounds || []).filter((_: any, i: number) => i !== index);
                                                                setEditDriveData({ ...editDriveData, rounds: updated });
                                                            }}
                                                            style={{ padding: "4px 8px", backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                                        <input
                                                            type="text"
                                                            placeholder="Mode / Venue / Link"
                                                            value={round.venueOrLink || round.mode}
                                                            onChange={(e) => {
                                                                const updated = [...(editDriveData.rounds || [])];
                                                                updated[index].venueOrLink = e.target.value;
                                                                setEditDriveData({ ...editDriveData, rounds: updated });
                                                            }}
                                                            style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Date (e.g. 25 Aug 2026)"
                                                            value={round.date}
                                                            onChange={(e) => {
                                                                const updated = [...(editDriveData.rounds || [])];
                                                                updated[index].date = e.target.value;
                                                                setEditDriveData({ ...editDriveData, rounds: updated });
                                                            }}
                                                            style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                                                        />
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
                                        <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: "8px 16px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Cancel</button>
                                        <button type="submit" style={{ padding: "8px 18px", backgroundColor: "#16a34a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Save Drive Changes</button>
                                    </div>
                                </form>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                    {/* 👤 RECRUITER & COMPANY INFORMATION (OWNERSHIP & AUDIT) */}
                                    <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#1e40af", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                            👤 Recruiter & Company Ownership Audit
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", fontSize: "12px" }}>
                                            <div>
                                                <span style={{ color: "#64748b", fontSize: "11px", display: "block" }}>Company Name</span>
                                                <strong style={{ color: "#0f172a", fontSize: "13px" }}>{selectedDrive.companyName || selectedDrive.company}</strong>
                                            </div>
                                            <div>
                                                 <span style={{ color: "#64748b", fontSize: "11px", display: "block" }}>Created By / Recruiter</span>
                                                 <strong style={{ color: "#0f172a", fontSize: "13px" }}>
                                                     {(() => {
                                                         const rawCreator = selectedDrive.createdBy || selectedDrive.recruiterName || "";
                                                         const compName = selectedDrive.companyName || selectedDrive.company || "";
                                                         if (!rawCreator || rawCreator.toLowerCase().trim() === compName.toLowerCase().trim()) {
                                                             return "Arya (Recruiter)";
                                                         }
                                                         return rawCreator.includes("Recruiter") ? rawCreator : `${rawCreator} (Recruiter)`;
                                                     })()}
                                                 </strong>
                                             </div>
                                            <div>
                                                <span style={{ color: "#64748b", fontSize: "11px", display: "block" }}>Recruiter Email</span>
                                                <strong style={{ color: "#2563eb", fontSize: "12px" }}>{selectedDrive.recruiterEmail || selectedDrive.email || "arya@amazon.com"}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Eligibility Requirements & Opt-in Summary */}
                                    <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "12px" }}>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px" }}>
                                            <div>💼 <strong>Package / CTC:</strong> <span style={{ color: "#16a34a", fontWeight: "700" }}>{selectedDrive.salaryPackage || selectedDrive.ctc || "₹18.0 LPA"}</span></div>
                                            <div>📍 <strong>Location:</strong> {selectedDrive.location || "Bangalore, India"}</div>
                                            <div>📅 <strong>Drive Date:</strong> {selectedDrive.driveDate}</div>
                                            <div>⏳ <strong>Application Deadline:</strong> <span style={{ color: "#dc2626", fontWeight: "700" }}>{selectedDrive.applicationDeadline || "25 Aug 2026"}</span></div>
                                            <div>📊 <strong>Status:</strong> <span style={{ fontWeight: "700", color: selectedDrive.status === "Upcoming" ? "#2563eb" : selectedDrive.status === "Ongoing" ? "#16a34a" : "#475569" }}>{selectedDrive.status}</span></div>
                                            <div>🎓 <strong>Eligible Departments:</strong> {Array.isArray(selectedDrive.eligibleBranches) ? selectedDrive.eligibleBranches.join(", ") : "CSE, IT, ECE"}</div>
                                            <div>🎯 <strong>Minimum CGPA:</strong> {selectedDrive.minCgpa !== undefined ? Number(selectedDrive.minCgpa).toFixed(1) : "6.5"}</div>
                                            <div>⚠️ <strong>Max Backlogs Allowed:</strong> {selectedDrive.maxBacklogs !== undefined ? selectedDrive.maxBacklogs : 1}</div>
                                            <div style={{ gridColumn: "span 2" }}>💡 <strong>Required Technical Skills:</strong> {Array.isArray(selectedDrive.requiredSkills) ? selectedDrive.requiredSkills.join(", ") : "Problem Solving, Data Structures, Coding"}</div>
                                        </div>

                                        {/* Opt-in Summary Metrics */}
                                        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
                                            <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                                                📊 OPT-IN SUMMARY
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", textAlign: "center" }}>
                                                <div style={{ backgroundColor: "#ffffff", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Total Eligible</div>
                                                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", marginTop: "2px" }}>{driveSummaryStats.totalEligible}</div>
                                                </div>
                                                <div style={{ backgroundColor: "#f0fdf4", padding: "10px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                                                    <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: "700" }}>Opted-in</div>
                                                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#16a34a", marginTop: "2px" }}>{driveSummaryStats.optedIn}</div>
                                                </div>
                                                <div style={{ backgroundColor: "#fff7ed", padding: "10px", borderRadius: "8px", border: "1px solid #ffedd5" }}>
                                                    <div style={{ fontSize: "11px", color: "#c2410c", fontWeight: "700" }}>Opt-out</div>
                                                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#c2410c", marginTop: "2px" }}>{driveSummaryStats.notOptedIn}</div>
                                                </div>
                                                <div style={{ backgroundColor: "#faf5ff", padding: "10px", borderRadius: "8px", border: "1px solid #e9d5ff" }}>
                                                    <div style={{ fontSize: "11px", color: "#7e22ce", fontWeight: "700" }}>Shortlisted</div>
                                                    <div style={{ fontSize: "18px", fontWeight: "800", color: "#7e22ce", marginTop: "2px" }}>{driveSummaryStats.shortlisted}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Opted-in Students Section Table */}
                                    <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                    👥 OPTED-IN STUDENTS ({selectedDrive.companyName || "Drive"})
                                                </h4>
                                                <span style={{ fontSize: "11px", color: "#64748b" }}>
                                                    Students who explicitly clicked "Opt-in / I want to participate"
                                                </span>
                                            </div>
                                            <span style={{ fontSize: "11px", backgroundColor: "#dcfce7", color: "#15803d", border: "1px solid #86efac", padding: "3px 10px", borderRadius: "12px", fontWeight: "700" }}>
                                                {optedInStudentsList.length} Opted-in
                                            </span>
                                        </div>

                                        <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: "#f8fafc", color: "#475569", fontWeight: "700", borderBottom: "1px solid #e2e8f0" }}>
                                                        <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>Student</th>
                                                        <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>Register No</th>
                                                        <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>Department</th>
                                                        <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>CGPA</th>
                                                        <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>Opt-in Date</th>
                                                        <th style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {optedInStudentsList.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "#94a3b8", whiteSpace: "nowrap" }}>
                                                                No student has opted in for this drive yet.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        optedInStudentsList.map((st: any, i: number) => (
                                                            <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                                <td style={{ padding: "12px 16px", fontWeight: "700", color: "#0f172a", whiteSpace: "nowrap" }}>{st.name}</td>
                                                                <td style={{ padding: "12px 16px", color: "#475569", whiteSpace: "nowrap" }}>{st.regNo}</td>
                                                                <td style={{ padding: "12px 16px", color: "#475569", whiteSpace: "nowrap" }}>{st.dept}</td>
                                                                <td style={{ padding: "12px 16px", fontWeight: "700", color: "#2563eb", whiteSpace: "nowrap" }}>{st.cgpa}</td>
                                                                <td style={{ padding: "12px 16px", color: "#64748b", whiteSpace: "nowrap" }}>{st.date}</td>
                                                                <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                                                                    <span style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "10px", fontWeight: "700", backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", whiteSpace: "nowrap", display: "inline-block" }}>
                                                                        🟢 {st.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Recruitment Rounds & Schedule Section */}
                                    <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                            <h4 style={{ margin: 0, fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                📋 RECRUITMENT ROUNDS & SCHEDULE
                                            </h4>
                                            <button
                                                type="button"
                                                onClick={() => { setEditDriveData({ ...selectedDrive }); setShowEditModal(true); }}
                                                style={{ padding: "4px 10px", backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                                            >
                                                ✏️ Manage Rounds
                                            </button>
                                        </div>
                                        {(!selectedDrive.rounds || !Array.isArray(selectedDrive.rounds) || selectedDrive.rounds.length === 0) ? (
                                             <div style={{ padding: "14px", textAlign: "center", backgroundColor: "#f8fafc", borderRadius: "8px", color: "#94a3b8", fontSize: "12px" }}>
                                                 No specific recruitment rounds assigned yet for this company drive.
                                             </div>
                                         ) : (
                                             <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                 {selectedDrive.rounds.map((r: any, idx: number) => {
                                                     const roundObj = (typeof r === "object" && r !== null) ? r : { roundName: String(r || "Assessment"), mode: "Hybrid", date: selectedDrive.driveDate || "25 Aug 2026" };
                                                     return (
                                                         <div key={idx} style={{ backgroundColor: "#f8fafc", padding: "12px 14px", borderRadius: "10px", border: "1px solid #eaedf0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                             <div>
                                                                 <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                     <span style={{ backgroundColor: "#2563eb", color: "#ffffff", fontSize: "10px", fontWeight: "800", padding: "2px 7px", borderRadius: "12px" }}>
                                                                         Round {roundObj.roundNumber || idx + 1}
                                                                     </span>
                                                                     <strong style={{ fontSize: "13px", color: "#0f172a" }}>{roundObj.roundName || "Technical Assessment"}</strong>
                                                                 </div>
                                                                 <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                                                                     📍 Mode/Venue: <strong style={{ color: "#334155" }}>{roundObj.venueOrLink || roundObj.mode || "Online"}</strong> | 📅 Date: <strong style={{ color: "#334155" }}>{roundObj.date || selectedDrive.driveDate || "25 Aug 2026"}</strong>
                                                                 </div>
                                                                 {roundObj.description && (
                                                                     <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px", fontStyle: "italic" }}>
                                                                         {roundObj.description}
                                                                     </div>
                                                                 )}
                                                             </div>
                                                         </div>
                                                     );
                                                 })}
                                             </div>
                                         )}
                                    </div>

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
                                        <button onClick={() => setSelectedDrive(null)} style={{ padding: "8px 16px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Close</button>
                                        <button onClick={() => { setEditDriveData({ ...selectedDrive }); setShowEditModal(true); }} style={{ padding: "8px 20px", backgroundColor: "#0f172a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Edit Drive Details</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Placement Drive Modal */}
            {showCreateModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                    <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "600px", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}>
                        <div style={{ backgroundColor: "#2563eb", color: "#ffffff", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
                            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>+ Create Placement Drive</h3>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                style={{
                                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                                    border: "1px solid rgba(255, 255, 255, 0.35)",
                                    color: "#ffffff",
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    cursor: "pointer",
                                    fontSize: "16px",
                                    fontWeight: "800",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s ease",
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                                }}
                                title="Close Modal (Esc)"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleCreateDrive} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Approved Company *</label>
                                    <select
                                        required
                                        value={`${newDriveData.companyName}||${newDriveData.jobRole}`}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const [selectedCompName, selectedRole] = val.includes("||") ? val.split("||") : [val, ""];
                                            let approvedCompaniesList: any[] = [];
                                            try {
                                                const saved = localStorage.getItem("cpms_companies");
                                                if (saved) {
                                                    const parsed = JSON.parse(saved);
                                                    if (Array.isArray(parsed)) approvedCompaniesList = parsed;
                                                }
                                            } catch (err) {}
                                            
                                            const compObj = approvedCompaniesList.find((c: any) => 
                                                (c.companyName || c.company) === selectedCompName &&
                                                (!selectedRole || (c.jobRole || c.role || c.jobTitle) === selectedRole)
                                            );
                                            setNewDriveData({
                                                ...newDriveData,
                                                companyName: selectedCompName,
                                                jobRole: selectedRole || compObj?.jobRole || newDriveData.jobRole,
                                                logoUrl: compObj?.logoUrl || newDriveData.logoUrl
                                            });
                                        }}
                                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", fontSize: "13px", cursor: "pointer" }}
                                    >
                                        <option value="">-- Select approved company --</option>
                                        {(() => {
                                            let approvedList: any[] = [];
                                            try {
                                                const saved = localStorage.getItem("cpms_companies");
                                                if (saved) {
                                                    const parsed = JSON.parse(saved);
                                                    if (Array.isArray(parsed)) approvedList = parsed;
                                                }
                                            } catch (err) {}
                                            
                                            const filtered = approvedList.filter((c: any) => 
                                                c.registrationStatus === "Approved" || c.status === "Approved" || c.status === "Upcoming" || c.status === "Active"
                                            );

                                            const uniqueMap = new Map();
                                            filtered.forEach((c: any) => {
                                                const compName = c.companyName || c.company || "";
                                                const roleName = c.jobRole || c.role || c.jobTitle || "";
                                                const key = `${compName.toLowerCase().trim()}_${roleName.toLowerCase().trim()}`;
                                                if (compName && !uniqueMap.has(key)) {
                                                    uniqueMap.set(key, c);
                                                }
                                            });

                                            if (uniqueMap.size === 0) {
                                                return <option value="" disabled>No approved companies available yet</option>;
                                            }

                                            return Array.from(uniqueMap.values()).map((c: any) => {
                                                const compTitle = c.companyName || c.company || "";
                                                const roleTitle = c.jobRole || c.role || c.jobTitle || "";
                                                
                                                // Check if THIS SPECIFIC company + jobRole has already been published by the Officer
                                                const isAlreadyPublished = drives.some(d => {
                                                    const dComp = (d.companyName || d.company || "").toLowerCase().trim();
                                                    const dRole = (d.jobRole || d.jobTitle || d.role || "").toLowerCase().trim();
                                                    const isOfficer = d.isOfficerPublished === true || d.createdBy === "Placement Officer";
                                                    return isOfficer && dComp === compTitle.toLowerCase().trim() && (roleTitle ? dRole === roleTitle.toLowerCase().trim() : true);
                                                });

                                                const keyVal = `${compTitle}||${roleTitle}`;

                                                return (
                                                    <option 
                                                        key={c.id || keyVal} 
                                                        value={keyVal}
                                                        disabled={isAlreadyPublished}
                                                        style={isAlreadyPublished ? { color: "#94a3b8", backgroundColor: "#f1f5f9" } : {}}
                                                    >
                                                        {compTitle} {roleTitle ? `(${roleTitle})` : ''} {isAlreadyPublished ? '— Already Published 🔒' : ''}
                                                    </option>
                                                );
                                            });
                                        })()}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Job Role *</label>
                                    <input type="text" required placeholder="e.g. SDE-1" value={newDriveData.jobRole} onChange={e => setNewDriveData({ ...newDriveData, jobRole: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Drive Date *</label>
                                    <input type="text" required placeholder="e.g. 25 Aug 2026" value={newDriveData.driveDate} onChange={e => setNewDriveData({ ...newDriveData, driveDate: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Application Deadline *</label>
                                    <input type="text" required placeholder="e.g. 22 Aug 2026" value={newDriveData.applicationDeadline} onChange={e => setNewDriveData({ ...newDriveData, applicationDeadline: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Drive Status</label>
                                    <select value={newDriveData.status} onChange={e => setNewDriveData({ ...newDriveData, status: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", cursor: "pointer" }}>
                                        <option value="Draft">Draft</option>
                                        <option value="Upcoming">Upcoming</option>
                                    </select>
                                </div>
                            </div>

                            {/* Mandatory Recruitment Rounds Configuration */}
                            <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #eaedf0", marginTop: "4px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                    <label style={{ fontSize: "12px", fontWeight: "800", color: "#1e293b", textTransform: "uppercase" }}>
                                        Recruitment Rounds & Schedule (Mandatory *)
                                    </label>
                                    <span style={{ fontSize: "11px", color: "#2563eb", fontWeight: "700" }}>
                                        {newDriveData.rounds?.length || 0} Rounds Added
                                    </span>
                                </div>

                                {createRoundsError && (
                                    <div style={{ padding: "10px 14px", backgroundColor: "#fef2f2", color: "#991b1b", borderRadius: "8px", border: "1px solid #fecaca", fontSize: "12px", fontWeight: "700", marginBottom: "10px" }}>
                                        {createRoundsError}
                                    </div>
                                )}

                                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "280px", overflowY: "auto" }}>
                                    {(newDriveData.rounds || []).map((rnd: any, idx: number) => (
                                        <div key={idx} style={{ padding: "12px", backgroundColor: "#ffffff", borderRadius: "10px", border: "1px solid #cbd5e1", display: "flex", flexDirection: "column", gap: "8px" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <span style={{ fontSize: "11px", fontWeight: "800", color: "#2563eb", backgroundColor: "#eff6ff", padding: "2px 8px", borderRadius: "12px" }}>
                                                    Round {rnd.roundNumber || idx + 1}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updatedRounds = newDriveData.rounds.filter((_: any, i: number) => i !== idx);
                                                        setNewDriveData({ ...newDriveData, rounds: updatedRounds });
                                                    }}
                                                    style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "6px", padding: "3px 8px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                                                >
                                                    ✕ Delete
                                                </button>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Round Title / Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={rnd.roundName}
                                                    onChange={(e) => {
                                                        const updatedRounds = [...newDriveData.rounds];
                                                        updatedRounds[idx] = { ...updatedRounds[idx], roundName: e.target.value };
                                                        setNewDriveData({ ...newDriveData, rounds: updatedRounds });
                                                    }}
                                                    style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", fontWeight: "700", color: "#0f172a" }}
                                                />
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                                <div>
                                                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Mode / Venue *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={rnd.venueOrLink || rnd.mode}
                                                        onChange={(e) => {
                                                            const updatedRounds = [...newDriveData.rounds];
                                                            updatedRounds[idx] = { ...updatedRounds[idx], venueOrLink: e.target.value, mode: e.target.value };
                                                            setNewDriveData({ ...newDriveData, rounds: updatedRounds });
                                                        }}
                                                        style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Date *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={rnd.date}
                                                        onChange={(e) => {
                                                            const updatedRounds = [...newDriveData.rounds];
                                                            updatedRounds[idx] = { ...updatedRounds[idx], date: e.target.value };
                                                            setNewDriveData({ ...newDriveData, rounds: updatedRounds });
                                                        }}
                                                        style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        const nextRndNum = (newDriveData.rounds?.length || 0) + 1;
                                        const newRnd = {
                                            roundNumber: nextRndNum,
                                            roundName: `Round ${nextRndNum}: Technical / HR Interview`,
                                            mode: "Online",
                                            date: "26 Aug 2026",
                                            venueOrLink: "Google Meet",
                                            description: "Technical & Behavioral Assessment"
                                        };
                                        setNewDriveData({
                                            ...newDriveData,
                                            rounds: [...(newDriveData.rounds || []), newRnd]
                                        });
                                        setCreateRoundsError("");
                                    }}
                                    style={{ marginTop: "10px", width: "100%", padding: "8px", backgroundColor: "#eff6ff", color: "#2563eb", border: "1px dashed #93c5fd", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                                >
                                    + Add Recruitment Round
                                </button>
                            </div>

                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
                                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: "8px 16px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Cancel</button>
                                <button type="submit" style={{ padding: "8px 20px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Publish Placement Drive</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Rejection Feedback Modal */}
            {rejectModalDrive && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100000, padding: "20px" }}>
                    <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0", overflow: "hidden" }}>
                        <div style={{ backgroundColor: "#dc2626", color: "#ffffff", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>Reject Placement Drive</h3>
                            <button onClick={() => setRejectModalDrive(null)} style={{ background: "none", border: "none", color: "#fff", fontSize: "18px", cursor: "pointer", fontWeight: "800" }}>✕</button>
                        </div>
                        <div style={{ padding: "20px" }}>
                            <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>
                                Rejecting drive for <strong>{rejectModalDrive.companyName || rejectModalDrive.company}</strong> (<em>{rejectModalDrive.jobRole}</em>). Please enter the reason for rejection to notify the recruiter.
                            </p>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>Rejection Reason / Feedback *</label>
                            <textarea
                                rows={4}
                                required
                                placeholder="e.g. CTC package is below college criteria, or eligibility backlogs criteria needs adjustment..."
                                value={rejectionReasonText}
                                onChange={e => setRejectionReasonText(e.target.value)}
                                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box", fontFamily: "inherit" }}
                            />
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                                <button type="button" onClick={() => setRejectModalDrive(null)} style={{ padding: "8px 16px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Cancel</button>
                                <button type="button" onClick={handleConfirmRejectDrive} style={{ padding: "8px 18px", backgroundColor: "#dc2626", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Reject & Send Feedback</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DriveManagement;
