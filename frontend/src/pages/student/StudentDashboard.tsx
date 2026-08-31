import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import StudentProfile from "./StudentProfile";
import { formatCleanRoundName, getPureRoundTitle } from "../../utils/roundUtils";

interface User {
    id?: string;
    _id?: string;
    name: string;
    email: string;
    role: string;
    regNo?: string;
}

interface StudentDashboardProps {
    user: User;
    onLogout: () => void;
    initialTab?: "dashboard" | "companies" | "applications" | "schedule" | "results" | "profile";
}

interface PlacementDrive {
    _id?: string;
    id?: string;
    company: string;
    logo: string;
    bgColor: string;
    role: string;
    ctc: string;
    minCgpa: number;
    minTenth: number;
    minTwelfth: number;
    maxBacklogs: number;
    gradYear: number;
    departments: string[];
    requiredSkills: string[];
    location: string;
    deadline: string;
    statusTag?: "Opted-In" | "Opted-Out" | "Eligible" | "Not Eligible" | "Completed";
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onLogout, initialTab = "dashboard" }) => {
    const userEmailLower = (user?.email || "").toLowerCase().trim();
    const userKey = user?.id || user?._id || userEmailLower || "guest";

    const userId = user?.id || user?._id || "";

    const getFormattedName = (rawName?: string) => {
        if (!rawName) return "Student";
        const cleaned = rawName.split('@')[0].replace(/[0-9]/g, "").trim();
        if (cleaned) {
            return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }
        return rawName;
    };

    const [displayName, setDisplayName] = useState<string>(() => {
        const savedName = localStorage.getItem(`cpms_student_fullname_${userId}`) || localStorage.getItem("cpms_student_fullname");
        if (savedName && savedName.trim()) {
            return savedName.trim();
        }
        return getFormattedName(user?.name);
    });

    useEffect(() => {
        const syncName = () => {
            const savedName = localStorage.getItem(`cpms_student_fullname_${userId}`) || localStorage.getItem("cpms_student_fullname");
            if (savedName && savedName.trim()) {
                setDisplayName(savedName.trim());
            } else if (user?.name) {
                setDisplayName(getFormattedName(user?.name));
            }
        };

        syncName();
        window.addEventListener("cpms_profile_updated", syncName);
        window.addEventListener("storage", syncName);
        return () => {
            window.removeEventListener("cpms_profile_updated", syncName);
            window.removeEventListener("storage", syncName);
        };
    }, [userId, user?.name]);

    const [currentTab, setCurrentTabState] = useState<
        "dashboard" | "companies" | "applications" | "schedule" | "results" | "profile"
    >(() => {
        try {
            const saved = localStorage.getItem(`cpms_active_tab_student_${userKey}`);
            if (saved && ["dashboard", "companies", "applications", "schedule", "results", "profile"].includes(saved)) {
                return saved as any;
            }
        } catch (e) { }
        return initialTab;
    });

    const setCurrentTab = (tab: "dashboard" | "companies" | "applications" | "schedule" | "results" | "profile") => {
        setCurrentTabState(tab);
        try {
            localStorage.setItem(`cpms_active_tab_student_${userKey}`, tab);
        } catch (e) { }
    };

    useEffect(() => {
        if (initialTab) {
            setCurrentTabState(initialTab);
        }
    }, [initialTab]);

    const [driveFilter, setDriveFilterState] = useState<"Opted-In" | "Opted-Out" | "Eligible" | "Not Eligible" | "Completed">(() => {
        try {
            const saved = localStorage.getItem(`cpms_drive_filter_student_${userKey}`);
            if (saved && ["Opted-In", "Opted-Out", "Eligible", "Not Eligible", "Completed"].includes(saved)) {
                return saved as any;
            }
        } catch (e) {}
        return "Eligible";
    });

    const setDriveFilter = (filter: "Opted-In" | "Opted-Out" | "Eligible" | "Not Eligible" | "Completed") => {
        setDriveFilterState(filter);
        try {
            localStorage.setItem(`cpms_drive_filter_student_${userKey}`, filter);
        } catch (e) {}
    };

    const [selectedApplicationModal, setSelectedApplicationModal] = useState<any | null>(null);
    const [selectedOfferModal, setSelectedOfferModal] = useState<any | null>(null);
    const [appsUpdatedCounter, setAppsUpdatedCounter] = useState(0);

    React.useEffect(() => {
        const handleAppsUpdate = () => {
            setAppsUpdatedCounter(prev => prev + 1);
        };

        window.addEventListener("storage", handleAppsUpdate);
        window.addEventListener("cpms_applications_updated", handleAppsUpdate);
        window.addEventListener("cpms_interviews_updated", handleAppsUpdate);
        const interval = setInterval(handleAppsUpdate, 1000);

        return () => {
            window.removeEventListener("storage", handleAppsUpdate);
            window.removeEventListener("cpms_applications_updated", handleAppsUpdate);
            window.removeEventListener("cpms_interviews_updated", handleAppsUpdate);
            clearInterval(interval);
        };
    }, []);

    React.useEffect(() => {
        const fetchDbApps = async () => {
            try {
                const studentEmail = user?.email || "ashwanth@gmail.com";
                const res = await fetch(`http://localhost:5001/api/applications?email=${encodeURIComponent(studentEmail)}`);
                if (res.ok) {
                    const dbApps = await res.json();
                    if (Array.isArray(dbApps) && dbApps.length > 0) {
                        const localStr = localStorage.getItem("cpms_applications");
                        let localArr = localStr ? JSON.parse(localStr) : [];
                        if (!Array.isArray(localArr)) localArr = [];

                        dbApps.forEach((dbA: any) => {
                            const idx = localArr.findIndex((l: any) =>
                                (l.companyName || l.company || "").toLowerCase().includes((dbA.companyName || "").toLowerCase()) &&
                                (l.jobRole || l.role || "").toLowerCase().includes((dbA.jobRole || "").toLowerCase())
                            );
                            if (idx >= 0) {
                                localArr[idx] = {
                                    ...localArr[idx],
                                    ...dbA,
                                    currentRound: dbA.currentRound || localArr[idx].currentRound || 1,
                                    status: dbA.status || localArr[idx].status || "Opted-In",
                                    roundStatus: dbA.roundStatus || localArr[idx].roundStatus,
                                    roundName: dbA.roundName || localArr[idx].roundName,
                                    history: dbA.history && dbA.history.length > 0 ? dbA.history : localArr[idx].history,
                                    interviewSchedule: dbA.interviewSchedule || localArr[idx].interviewSchedule
                                };
                            } else {
                                localArr.push(dbA);
                            }
                        });

                        localStorage.setItem("cpms_applications", JSON.stringify(localArr));
                    }
                }
            } catch (e) {
                console.error("Error fetching MongoDB student applications:", e);
            }
        };

        fetchDbApps();
    }, [user?.email, appsUpdatedCounter]);



    const loadAllAppliedDrives = (): string[] => {
        const set = new Set<string>();
        // 1. User-specific applied drives
        try {
            const userVal = localStorage.getItem(`cpms_applied_drives_${userKey}`) || localStorage.getItem(`cpms_applied_drives_${userId}`);
            if (userVal) {
                const parsed = JSON.parse(userVal);
                if (Array.isArray(parsed)) {
                    parsed.forEach(item => {
                        if (typeof item === "string" && item.trim()) set.add(item.trim().toLowerCase());
                    });
                }
            }
        } catch (e) {}

        // 2. User-specific applications from cpms_applications
        try {
            const appsVal = localStorage.getItem("cpms_applications");
            if (appsVal) {
                const appsArr = JSON.parse(appsVal);
                if (Array.isArray(appsArr)) {
                    appsArr.forEach((rec: any) => {
                        const recEmail = String(rec.email || rec.studentEmail || "").toLowerCase().trim();
                        const recStudentId = String(rec.studentId || "").trim();
                        // Match ONLY the logged-in student
                        if ((recEmail && recEmail === userEmailLower) || (recStudentId && recStudentId === userId)) {
                            const recStatus = String(rec.status || "").toLowerCase();
                            if (recStatus !== "rejected" && recStatus !== "not shortlisted") {
                                if (rec.driveId) set.add(String(rec.driveId).toLowerCase());
                                if (rec.companyName || rec.company) {
                                    const c = String(rec.companyName || rec.company).toLowerCase().trim();
                                    set.add(c);
                                    if (rec.jobRole || rec.role) {
                                        const r = String(rec.jobRole || rec.role).toLowerCase().trim();
                                        set.add(`${c}_${r}`);
                                    }
                                }
                            }
                        }
                    });
                }
            }
        } catch (e) {}

        return Array.from(set);
    };

    const loadAllOptedOutDrives = (): string[] => {
        const set = new Set<string>();
        try {
            const userVal = localStorage.getItem(`cpms_opted_out_drives_${userKey}`) || localStorage.getItem(`cpms_opted_out_drives_${userId}`);
            if (userVal) {
                const parsed = JSON.parse(userVal);
                if (Array.isArray(parsed)) {
                    parsed.forEach(item => {
                        if (typeof item === "string" && item.trim()) set.add(item.trim().toLowerCase());
                    });
                }
            }
        } catch (e) {}
        return Array.from(set);
    };

    const [appliedDrives, setAppliedDrives] = useState<string[]>(() => loadAllAppliedDrives());
    const [optedOutDrives, setOptedOutDrives] = useState<string[]>(() => loadAllOptedOutDrives());

    const isDriveOptedIn = (d: PlacementDrive | any) => {
        if (!d) return false;
        if (d.statusTag === "Opted-In") return true;
        const driveId = String(d.id || d._id || "").toLowerCase().trim();
        const comp = String(d.company || d.companyName || "").toLowerCase().trim();
        const role = String(d.role || d.jobRole || d.jobTitle || "").toLowerCase().trim();
        const compRole = comp && role ? `${comp}_${role}` : "";

        return appliedDrives.some(item => {
            if (!item) return false;
            const str = String(item).toLowerCase().trim();
            if (driveId && (str === driveId || str.includes(driveId) || driveId.includes(str))) return true;
            if (compRole && (str === compRole || str.includes(compRole) || compRole.includes(str))) return true;
            if (comp && (str.includes(comp) || comp.includes(str))) return true;
            return false;
        });
    };


    const isDriveOptedOut = (d: PlacementDrive | any) => {
        if (!d) return false;
        if (d.statusTag === "Opted-Out") return true;
        const driveId = String(d.id || d._id || "").toLowerCase().trim();
        const comp = (d.company || d.companyName || "").toLowerCase().trim();
        const role = (d.role || d.jobRole || d.jobTitle || "").toLowerCase().trim();
        const compRole = comp && role ? `${comp}_${role}` : "";

        return optedOutDrives.some(item => {
            if (!item) return false;
            const str = String(item).toLowerCase().trim();
            if (driveId && str === driveId) return true;
            if (compRole && str === compRole) return true;
            return false;
        });
    };

    useEffect(() => {
        const syncAppDrivesFromStorage = () => {
            setAppliedDrives(loadAllAppliedDrives());
            setOptedOutDrives(loadAllOptedOutDrives());
        };
        window.addEventListener("storage", syncAppDrivesFromStorage);
        window.addEventListener("cpms_drives_updated", syncAppDrivesFromStorage);
        return () => {
            window.removeEventListener("storage", syncAppDrivesFromStorage);
            window.removeEventListener("cpms_drives_updated", syncAppDrivesFromStorage);
        };
    }, [userKey, userEmailLower, displayName]);

    const [studentCgpa, setStudentCgpa] = useState<number>(0.0);
    const [studentBacklogs, setStudentBacklogs] = useState<number>(0);
    const [studentDepartment, setStudentDepartment] = useState<string>("Computer Science & Engineering");
    const [studentTenth, setStudentTenth] = useState<number>(0.0);
    const [studentTwelfth, setStudentTwelfth] = useState<number>(0.0);
    const [studentGradYear, setStudentGradYear] = useState<number>(2026);
    const [studentRegNo, setStudentRegNo] = useState<string>("");
    const [studentPhone, setStudentPhone] = useState<string>("");
    const [studentResumeName, setStudentResumeName] = useState<string>("");
    const [studentResumeUrl, setStudentResumeUrl] = useState<string>("");
    const [studentSkills, setStudentSkills] = useState<string[]>([]);
    const [isProfileVerified, setIsProfileVerified] = useState<boolean>(false);
    const [selectedDriveCriteria, setSelectedDriveCriteria] = useState<PlacementDrive | null>(null);

    useEffect(() => {
        const isModalOpen = Boolean(selectedDriveCriteria || selectedApplicationModal || selectedOfferModal);
        if (isModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setSelectedDriveCriteria(null);
                setSelectedApplicationModal(null);
                setSelectedOfferModal(null);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedDriveCriteria, selectedApplicationModal, selectedOfferModal]);

    React.useEffect(() => {
        const checkLocalVerification = () => {
            const userEmail = (user?.email || "").toLowerCase().trim();
            const pendingStatus =
                localStorage.getItem(`cpms_verification_status_${userEmail}`) ||
                localStorage.getItem(`cpms_verification_status_${userId}`);

            if (pendingStatus === "Pending" || pendingStatus === "Pending Officer Approval") {
                setIsProfileVerified(false);
                return;
            }

            const localVerified =
                localStorage.getItem(`cpms_profile_verified_${userId}`) ||
                localStorage.getItem(`cpms_profile_verified_${userEmail}`) ||
                localStorage.getItem(`cpms_verified_student_${userId}`) ||
                localStorage.getItem(`cpms_verified_student_${userEmail}`);

            if (localVerified !== null) {
                setIsProfileVerified(localVerified === "true");
            }
        };

        const fetchProfile = async () => {
            if (!userId) return;
            try {
                const res = await fetch(`http://localhost:5001/api/student/profile/${userId}`);
                const data = await res.json();
                let student = (res.ok && data) ? data : null;

                if (!student) {
                    try {
                        const localSaved = localStorage.getItem(`cpms_profile_${userId}`);
                        if (localSaved) student = JSON.parse(localSaved);
                    } catch (e) { }
                }

                if (student) {
                    // Database response is the authoritative source of truth for verification status
                    if (student.isVerified !== undefined) {
                        const dbVerified = Boolean(student.isVerified);
                        setIsProfileVerified(dbVerified);
                        // Sync localStorage with DB state
                        const userEmail = (user?.email || "").toLowerCase().trim();
                        try {
                            localStorage.setItem(`cpms_profile_verified_${userId}`, String(dbVerified));
                            localStorage.setItem(`cpms_profile_verified_${userEmail}`, String(dbVerified));
                            localStorage.setItem(`cpms_profile_verified_global`, String(dbVerified));
                        } catch (e) { }
                    } else {
                        checkLocalVerification();
                    }

                    if (student.personal?.department) setStudentDepartment(student.personal.department);
                    if (student.personal?.registerNumber) setStudentRegNo(student.personal.registerNumber);
                    if (student.personal?.phone) setStudentPhone(student.personal.phone);
                    if (student.academic) {
                        if (student.academic.cgpa !== undefined) setStudentCgpa(Number(student.academic.cgpa));
                        if (student.academic.backlogs !== undefined) setStudentBacklogs(Number(student.academic.backlogs));
                        if (student.academic.tenthPercentage !== undefined) setStudentTenth(Number(student.academic.tenthPercentage));
                        if (student.academic.twelfthPercentage !== undefined) setStudentTwelfth(Number(student.academic.twelfthPercentage));
                        if (student.academic.graduationYear !== undefined) setStudentGradYear(Number(student.academic.graduationYear));
                    }
                    if (student.professional?.skills) {
                        setStudentSkills(Array.isArray(student.professional.skills) ? student.professional.skills : []);
                    }
                    if (student.professional?.resumeName) setStudentResumeName(student.professional.resumeName);
                    if (student.professional?.resumeUrl) setStudentResumeUrl(student.professional.resumeUrl);
                }
            } catch (err) {
                console.error("Error fetching student profile for dashboard:", err);
                checkLocalVerification();
            }
        };
        fetchProfile();

        const handleProfileUpdated = () => {
            checkLocalVerification();
            fetchProfile();
        };

        let channel: BroadcastChannel | null = null;
        try {
            channel = new BroadcastChannel("cpms_profile_channel");
            channel.onmessage = (event) => {
                if (event.data && event.data.type === "PROFILE_VERIFIED") {
                    setIsProfileVerified(Boolean(event.data.isVerified));
                    try {
                        localStorage.setItem(`cpms_profile_verified_${userId}`, String(event.data.isVerified));
                        localStorage.setItem(`cpms_profile_verified_global`, String(event.data.isVerified));
                    } catch (e) { }
                }
            };
        } catch (e) { }

        window.addEventListener("cpms_profile_updated", handleProfileUpdated);
        window.addEventListener("storage", handleProfileUpdated);
        return () => {
            if (channel) channel.close();
            window.removeEventListener("cpms_profile_updated", handleProfileUpdated);
            window.removeEventListener("storage", handleProfileUpdated);
        };
    }, [userId, currentTab]);

    const [dbInterviews, setDbInterviews] = useState<any[]>([]);
    const [interviewsLoading, setInterviewsLoading] = useState<boolean>(true);
    const [interviewsError, setInterviewsError] = useState<string | null>(null);
    const [selectedInterviewModal, setSelectedInterviewModal] = useState<any | null>(null);

    const fetchBackendInterviews = async () => {
        try {
            setInterviewsLoading(true);
            setInterviewsError(null);

            let officerInterviews: any[] = [];
            try {
                const savedStr = localStorage.getItem("cpms_interviews");
                if (savedStr) {
                    const parsed = JSON.parse(savedStr);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        officerInterviews = parsed;
                    }
                }
            } catch (e) {}

            const sName = (displayName || user?.name || "").toLowerCase().trim();
            const sReg = (localStorage.getItem("cpms_student_regno") || "").toLowerCase().trim();
            const sEmail = (user?.email || "").toLowerCase().trim();

            // Filter officerInterviews strictly for logged-in student
            const studentInterviews = officerInterviews.filter((item: any) => {
                const cName = (item.candidateName || item.studentName || item.name || "").toLowerCase().trim();
                const cReg = (item.regNo || item.registerNo || item.regNum || "").toLowerCase().trim();
                const cEmail = (item.email || "").toLowerCase().trim();

                if (cEmail && sEmail && cEmail === sEmail) return true;
                if (cReg && sReg && (cReg === sReg || sReg.includes(cReg) || cReg.includes(sReg))) return true;
                if (cName && sName && (cName === sName || cName.includes(sName) || sName.includes(cName))) return true;
                return false;
            });

            const listToUse = studentInterviews;

            const uniqueMap = new Map<string, any>();
            listToUse.forEach((item: any) => {
                const c = String(item.company || item.companyName || "").toLowerCase().trim();
                const r = String(item.role || item.jobRole || "").toLowerCase().trim();
                const rd = String(item.round || item.roundTitle || "").toLowerCase().trim();
                const key = item.id || `${c}_${r}_${rd}`;
                if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, item);
                }
            });

            setDbInterviews(Array.from(uniqueMap.values()));
        } catch (err) {
            setInterviewsError("Unable to load interview schedules. Please try again.");
        } finally {
            setInterviewsLoading(false);
        }
    };

    useEffect(() => {
        fetchBackendInterviews();
    }, [appsUpdatedCounter, displayName, user?.email]);




    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setSelectedDriveCriteria(null);
                setSelectedApplicationModal(null);
                setSelectedInterviewModal(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Drive listings populated EXCLUSIVELY by Placement Officer published drives
    const [placementDrives, setPlacementDrives] = useState<PlacementDrive[]>([]);

    useEffect(() => {
        const syncApprovedDrives = async () => {
            let rawDrives: any[] = [];
            try {
                const savedDrives = localStorage.getItem("cpms_drives");
                if (savedDrives) {
                    const parsed = JSON.parse(savedDrives);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        rawDrives.push(...parsed);
                    }
                }
            } catch (e) { }

            try {
                const res = await fetch("http://localhost:5001/api/company/drives");
                if (res.ok) {
                    const remote = await res.json();
                    if (Array.isArray(remote)) {
                        remote.forEach((rd: any) => {
                            const rdId = rd._id || rd.id;
                            const idx = rawDrives.findIndex(d => (d.id || d._id) === rdId);
                            if (idx !== -1) {
                                rawDrives[idx] = { ...rawDrives[idx], ...rd };
                            } else {
                                rawDrives.push(rd);
                            }
                        });
                    }
                }
            } catch (e) { }

            // If rawDrives is empty and cpms_drives_cleared is not set, include fallback Amazon Development Center drive
            if (rawDrives.length === 0 && localStorage.getItem("cpms_drives_cleared") !== "true") {
                rawDrives = [{
                    id: "drive_amazon_1",
                    companyName: "Amazon Development Center",
                    jobRole: "software developer",
                    salaryPackage: "₹18.0 LPA",
                    location: "Bangalore, India",
                    driveDate: "28 Aug 2026",
                    status: "Approved",
                    isCreatedByOfficer: true,
                    isOfficerPublished: true,
                    createdBy: "Placement Officer",
                    eligibleBranches: ["CSE", "IT", "ECE"],
                    minCgpa: 6.5
                }];
            }

            let approvedCompaniesSet = new Set<string>();
            let rejectedCompaniesSet = new Set<string>();
            try {
                const savedComps = localStorage.getItem("cpms_companies");
                if (savedComps) {
                    const parsedComps = JSON.parse(savedComps);
                    if (Array.isArray(parsedComps) && parsedComps.length > 0) {
                        parsedComps.forEach((c: any) => {
                            const compName = (c.companyName || c.company || "").toLowerCase().trim();
                            const isApproved = c.registrationStatus === "Approved" || c.status === "Approved";
                            const isRejected = c.registrationStatus === "Rejected" || c.status === "Rejected";
                            if (compName) {
                                if (isApproved) approvedCompaniesSet.add(compName);
                                if (isRejected) rejectedCompaniesSet.add(compName);
                            }
                        });
                    }
                }
            } catch (e) { }

            let dynamicApproved: PlacementDrive[] = [];
            rawDrives.forEach((pd: any) => {
                const compStr = (pd.companyName || pd.company || "").toLowerCase().trim();
                const isOptedIn = isDriveOptedIn(pd);
                const isOptedOut = isDriveOptedOut(pd);

                const isRejected = compStr && rejectedCompaniesSet.has(compStr);
                if (isRejected && !isOptedIn) return;

                const creator = String(pd.createdBy || "").toLowerCase();
                const st = (pd.status || "").toLowerCase();
                const isPendingOrRejected = st === "pending" || st === "pending approval" || st === "rejected" || st === "draft";
                const isOfficerApproved = st === "approved" || st === "active" || st === "published" || st === "open" || st === "upcoming" || st === "ongoing" || pd.isOfficerPublished === true || pd.isCreatedByOfficer === true || creator === "placement officer";
                const isPublished = !isPendingOrRejected && (isOfficerApproved || isOptedIn);

                if (isPublished || isOptedIn) {
                    const minCgpaVal = Number(pd.minCgpa) || 6.5;
                    const minTenthVal = Number(pd.minTenth) || 60;
                    const minTwelfthVal = Number(pd.minTwelfth) || 60;
                    const maxBacklogsVal = Number(pd.maxBacklogs) ?? 1;
                    const reqGradYear = Number(pd.gradYear) || 2026;
                    const eligibleBranches: string[] = pd.eligibleBranches || pd.departments || ["CSE", "IT", "ECE"];

                    const cgpaOk = studentCgpa >= minCgpaVal;
                    const tenthOk = studentTenth >= minTenthVal;
                    const twelfthOk = studentTwelfth >= minTwelfthVal;
                    const backlogsOk = studentBacklogs <= maxBacklogsVal;
                    const gradYearOk = !studentGradYear || studentGradYear === reqGradYear;
                    const deptOk = eligibleBranches.length === 0 || eligibleBranches.some(b => 
                        b.toLowerCase() === (studentDepartment || "").toLowerCase() ||
                        (studentDepartment || "").toLowerCase().includes(b.toLowerCase()) ||
                        b.toLowerCase().includes((studentDepartment || "").toLowerCase())
                    );

                    const isEligible = cgpaOk && tenthOk && twelfthOk && backlogsOk && gradYearOk && deptOk;

                    const roleStr = (pd.jobRole || pd.jobTitle || pd.role || "").toLowerCase().trim();
                    const driveKey = `${compStr}_${roleStr}`;
                    const driveIdVal = pd.id || pd._id || driveKey;

                    dynamicApproved.push({
                        id: driveIdVal || `drive_${Date.now()}`,
                        company: pd.companyName || pd.company || "Approved Company",
                        logo: pd.logoUrl || pd.logo || "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
                        bgColor: "#ffffff",
                        role: pd.jobRole || pd.jobTitle || pd.role || "Software Developer",
                        ctc: pd.salaryPackage || pd.packageCtc || pd.ctc || "₹18.0 LPA",
                        minCgpa: minCgpaVal,
                        minTenth: minTenthVal,
                        minTwelfth: minTwelfthVal,
                        maxBacklogs: maxBacklogsVal,
                        gradYear: pd.gradYear || 2026,
                        departments: pd.departments || pd.eligibleBranches || ["CSE", "IT", "ECE"],
                        requiredSkills: pd.requiredSkills || ["Problem Solving", "Coding"],
                        location: pd.location || "Bangalore",
                        deadline: pd.driveDate || pd.deadline || pd.applicationDeadline || "28 Aug 2026",
                        statusTag: isOptedIn ? "Opted-In" : (isOptedOut ? "Opted-Out" : (isEligible ? "Eligible" : "Not Eligible"))
                    });
                }
            });

            const map = new Map();
            dynamicApproved.forEach(d => {
                const key = `${(d.company || "").toLowerCase().trim()}_${(d.role || "").toLowerCase().trim()}`;
                if (!map.has(key) || d.statusTag === "Opted-In" || d.statusTag === "Eligible") {
                    map.set(key, d);
                }
            });
            setPlacementDrives(Array.from(map.values()));
        };

        syncApprovedDrives();
        window.addEventListener("storage", syncApprovedDrives);
        window.addEventListener("cpms_drives_updated", syncApprovedDrives);
        return () => {
            window.removeEventListener("storage", syncApprovedDrives);
            window.removeEventListener("cpms_drives_updated", syncApprovedDrives);
        };
    }, [studentCgpa, studentTenth, studentTwelfth, studentBacklogs, studentDepartment, appliedDrives, optedOutDrives]);

    const filterCounts = {
        "Opted-In": placementDrives.filter(d => isDriveOptedIn(d)).length,
        "Opted-Out": placementDrives.filter(d => isDriveOptedOut(d)).length,
        "Eligible": placementDrives.filter(d => d.statusTag === "Eligible" || isDriveOptedIn(d)).length,
        "Not Eligible": placementDrives.filter(d => d.statusTag === "Not Eligible" && !isDriveOptedIn(d)).length,
        "Completed": placementDrives.filter(d => d.statusTag === "Completed").length
    };

    // Dynamic Applications Data generated strictly from Opted-In Placement Drives and synced with Officer updates in cpms_applications
    const _tick = appsUpdatedCounter;
    const applicationsData = placementDrives
        .filter(d => isDriveOptedIn(d))
        .map(d => {
            const comp = (d.company || "").toLowerCase().trim();
            const role = (d.role || "").toLowerCase().trim();

            let savedAppRecord: any = null;
            try {
                const appsStr = localStorage.getItem("cpms_applications");
                if (appsStr) {
                    const appsArr = JSON.parse(appsStr);
                    if (Array.isArray(appsArr)) {
                        savedAppRecord = appsArr.find((a: any) => {
                            const aComp = (a.companyName || a.company || "").toLowerCase().trim();
                            const aRole = (a.jobRole || a.role || "").toLowerCase().trim();

                            const compMatch = aComp === comp || aComp.includes(comp) || comp.includes(aComp) ||
                                (comp.includes("amazon") && aComp.includes("amazon")) ||
                                (comp.includes("zoho") && aComp.includes("zoho"));

                            const isSalesA = aRole.includes("sales");
                            const isSalesB = role.includes("sales");
                            const isDevA = aRole.includes("software") || aRole.includes("dev");
                            const isDevB = role.includes("software") || role.includes("dev");

                            if ((isSalesA && !isSalesB) || (!isSalesA && isSalesB)) return false;
                            if ((isDevA && !isDevB) || (!isDevA && isDevB)) return false;

                            const roleMatch = !role || !aRole || aRole === role || aRole.includes(role) || role.includes(aRole);

                            return compMatch && roleMatch;

                        });
                    }
                }
            } catch (e) {}

            const activeRoundIdx = savedAppRecord?.currentRound || 1;
            const currentStatus = savedAppRecord?.status || "Opted-In";
            const isNotShortlisted = currentStatus === "Not Shortlisted" || savedAppRecord?.roundStatus === "Not Shortlisted";
            const isSelected = currentStatus === "Selected";


            // Fetch Drive Recruitment Rounds
            let driveRoundsList: any[] = [];
            try {
                const savedDrivesStr = localStorage.getItem("cpms_drives");
                if (savedDrivesStr) {
                    const parsedDrives = JSON.parse(savedDrivesStr);
                    if (Array.isArray(parsedDrives)) {
                        const matchedDrive = parsedDrives.find((pd: any) =>
                            (pd.companyName || pd.company || "").toLowerCase().includes(comp)
                        );
                        if (matchedDrive && Array.isArray(matchedDrive.rounds) && matchedDrive.rounds.length > 0) {
                            driveRoundsList = matchedDrive.rounds;
                        }
                    }
                }
            } catch (e) {}

            if (driveRoundsList.length === 0) {
                if (comp.includes("google")) {
                    driveRoundsList = [
                        { roundNumber: 1, roundName: "Round 1: Online Coding Challenge", mode: "Online", date: "23 Aug 2026" },
                        { roundNumber: 2, roundName: "Round 2: Technical Round 1 (DSA)", mode: "Online", date: "25 Aug 2026" },
                        { roundNumber: 3, roundName: "Round 3: Technical Round 2 (System Design)", mode: "Online", date: "26 Aug 2026" },
                        { roundNumber: 4, roundName: "Round 4: Googliness & HR Round", mode: "Online", date: "27 Aug 2026" }
                    ];
                } else if (comp.includes("zoho")) {
                    driveRoundsList = [
                        { roundNumber: 1, roundName: "Round 1: Written Aptitude & C Programming", mode: "On-Campus", date: "28 Aug 2026" },
                        { roundNumber: 2, roundName: "Round 2: Basic Programming Round", mode: "On-Campus", date: "28 Aug 2026" },
                        { roundNumber: 3, roundName: "Round 3: Advanced Programming Round", mode: "On-Campus", date: "29 Aug 2026" },
                        { roundNumber: 4, roundName: "Round 4: Technical & HR Interview", mode: "In-Person", date: "29 Aug 2026" }
                    ];
                } else {
                    driveRoundsList = [
                        { roundNumber: 1, roundName: "Round 1: Online Aptitude & Coding Test", mode: "Online", date: "24 Aug 2026" },
                        { roundNumber: 2, roundName: "Round 2: Technical Interview", mode: "Online", date: "25 Aug 2026" },
                        { roundNumber: 3, roundName: "Round 3: HR & Management Round", mode: "Online", date: "26 Aug 2026" }
                    ];
                }
            }

            // Build dynamic rounds status list for modal & table
            const dynamicRounds = driveRoundsList.map((rObj: any, idx: number) => {
                const rNum = rObj.roundNumber || (idx + 1);
                let roundBadgeText = "Upcoming";

                if (isSelected) {
                    roundBadgeText = "Cleared ✓";
                } else if (rNum < activeRoundIdx) {
                    roundBadgeText = "Cleared ✓";
                } else if (rNum === activeRoundIdx) {
                    if (isNotShortlisted) {
                        roundBadgeText = "Not Shortlisted 🔴";
                    } else {
                        roundBadgeText = "In Progress ⏳";
                    }
                } else {
                    roundBadgeText = "Locked 🔒";
                }


                return {
                    round: `Round ${rNum}`,
                    name: formatCleanRoundName(rNum, rObj.roundName || "Selection Assessment"),
                    date: rObj.date || d.deadline || "28 Aug 2026",
                    mode: rObj.mode || rObj.venueOrLink || "Online",
                    status: roundBadgeText
                };
            });

            // Calculate active round text & current workflow stage
            let currentStageText = `Round ${activeRoundIdx}`;
            let activeRoundTitle = `Round ${activeRoundIdx}`;

            if (isSelected) {
                currentStageText = "Selected";
                activeRoundTitle = "Selection Confirmed & Offer Released";
            } else if (isNotShortlisted) {
                currentStageText = "Not Shortlisted";
                activeRoundTitle = `Not Shortlisted in Round ${activeRoundIdx}`;
            } else {
                const currentRoundObj = driveRoundsList[activeRoundIdx - 1] || driveRoundsList[0];
                const pureTitle = getPureRoundTitle(currentRoundObj?.roundName, "Selection Round");
                activeRoundTitle = formatCleanRoundName(activeRoundIdx, pureTitle);
                currentStageText = `Round ${activeRoundIdx}`;
            }


            return {
                company: d.company,
                role: d.role,
                package: d.ctc,
                activeRoundType: activeRoundTitle,
                currentWorkflowStage: currentStageText,
                statusBadge: currentStageText,
                dept: Array.isArray(d.departments) ? d.departments.join(", ") : "CSE, IT, ECE",
                minCgpa: d.minCgpa !== undefined ? `${d.minCgpa}` : "6.5",
                tenth: d.minTenth !== undefined ? `${d.minTenth}%` : "60%",
                twelfth: d.minTwelfth !== undefined ? `${d.minTwelfth}%` : "60%",
                backlogs: d.maxBacklogs !== undefined ? `${d.maxBacklogs}` : "1",
                gradYear: d.gradYear ? `Batch ${d.gradYear}` : "Batch 2026",
                rounds: dynamicRounds,
                driveObj: d
            };
        });


    // Dynamic Interview Schedule cards
    const interviewSchedules = placementDrives
        .filter(d => isDriveOptedIn(d))
        .map(d => ({
            company: d.company,
            role: d.role,
            status: "Scheduled 🗓",
            activeRound: {
                title: "Round 1: Technical & Aptitude Assessment",
                dateTime: `${d.deadline || "28 Aug 2026"} | 10:00 AM IST`,
                interviewer: "Placement Officer / HR",
                location: "College Main Auditorium & Online"
            },
            historyCount: 1,
            history: [
                { name: "Round 1: Registration & Opt-In Verification", date: d.deadline || "28 Aug 2026", status: "Passed ✓" }
            ]
        }));

    // Results & Offer Letter records
    const [offersList, setOffersList] = useState(() => {
        const userKey = userEmailLower || "guest";
        try {
            const saved = localStorage.getItem(`cpms_offers_list_${userKey}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) { }
        return [];
    });

    // Profile completeness calculation
    const profileCompletenessPercent = React.useMemo(() => {
        let score = 0;
        if (displayName || user?.name) score += 20;
        if (studentRegNo) score += 15;
        if (studentDepartment) score += 15;
        if (studentCgpa > 0) score += 20;
        if (studentTenth > 0 && studentTwelfth > 0) score += 15;
        if (studentSkills && studentSkills.length > 0) score += 10;
        if (studentResumeUrl || studentResumeName) score += 5;
        return Math.min(100, Math.max(score, 10));
    }, [displayName, user?.name, studentRegNo, studentDepartment, studentCgpa, studentTenth, studentTwelfth, studentSkills, studentResumeUrl, studentResumeName]);

    // Dynamically aggregated Live Original Activities strictly from real data & deduplicated
    const liveActivities = React.useMemo(() => {
        const list: Array<{
            id: string;
            icon: string;
            date: string;
            title: string;
            subtitle: string;
            tag: string;
            tagBg: string;
            tagColor: string;
            tagBorder: string;
            targetTab: "schedule" | "applications" | "results" | "companies";
        }> = [];

        const seenKeys = new Set<string>();

        // 1. Live Scheduled Interviews for logged-in student (Highest priority)
        dbInterviews.forEach((sch: any, idx: number) => {
            const comp = String(sch.company || sch.companyName || "").trim();
            const role = String(sch.role || sch.jobRole || "").trim();
            const round = String(sch.roundTitle || sch.round || "Interview Assessment").trim();
            if (!comp) return;

            const key = `interview_${comp.toLowerCase()}_${role.toLowerCase()}`;
            if (seenKeys.has(key)) return;
            seenKeys.add(key);

            const st = (sch.status || "").toLowerCase();
            const isPassed = st.includes("passed") || st.includes("selected") || st.includes("cleared");
            const isToday = st === "today";

            let tagLabel = "Scheduled Interview";
            let tagBg = "#f0fdf4";
            let tagColor = "#16a34a";
            let tagBorder = "#bbf7d0";

            if (isPassed) {
                tagLabel = "Passed ✓";
                tagBg = "#f0fdf4";
                tagColor = "#16a34a";
                tagBorder = "#bbf7d0";
            } else if (isToday) {
                tagLabel = "Interview Today 🟠";
                tagBg = "#fffbeb";
                tagColor = "#d97706";
                tagBorder = "#fde68a";
            }

            list.push({
                id: sch.id || `sch_${idx}`,
                icon: "💻",
                date: sch.date ? `${sch.date}${sch.time ? ` • ${sch.time}` : ""}` : "Scheduled Interview",
                title: `${comp} — ${round}`,
                subtitle: `${sch.mode || "Online"} (${sch.venue || sch.platform || "Placement Cell"})${sch.interviewer ? ` • Panel: ${sch.interviewer}` : ""}`,
                tag: tagLabel,
                tagBg,
                tagColor,
                tagBorder,
                targetTab: "schedule"
            });
        });

        // 2. Live Confirmed Offers
        offersList.forEach((off: any, idx: number) => {
            const comp = String(off.company || "").trim();
            const role = String(off.role || "").trim();
            if (!comp) return;

            const key = `offer_${comp.toLowerCase()}_${role.toLowerCase()}`;
            if (seenKeys.has(key)) return;
            seenKeys.add(key);

            list.push({
                id: off.id || `off_${idx}`,
                icon: "🏆",
                date: off.date || "Offer Released",
                title: `${comp} — Placement Offer`,
                subtitle: `${role ? `${role} • ` : ""}Package: ${off.ctc || "Confirmed CTC"}`,
                tag: off.status === "Offer Accepted" ? "Offer Accepted ✓" : "Confirmed Offer 🎉",
                tagBg: "#ecfdf5",
                tagColor: "#059669",
                tagBorder: "#a7f3d0",
                targetTab: "results"
            });
        });

        // 3. Live Submitted Applications & Opted-In Drives
        applicationsData.forEach((app: any, idx: number) => {
            const comp = String(app.company || "").trim();
            const role = String(app.role || "").trim();
            if (!comp) return;

            // If already shown under interviews or offers, skip duplicate
            if (seenKeys.has(`interview_${comp.toLowerCase()}_${role.toLowerCase()}`) || seenKeys.has(`offer_${comp.toLowerCase()}_${role.toLowerCase()}`)) {
                return;
            }

            const key = `app_${comp.toLowerCase()}_${role.toLowerCase()}`;
            if (seenKeys.has(key)) return;
            seenKeys.add(key);

            const isSelected = app.statusTag === "Selected";
            const isNotShortlisted = app.statusTag === "Not Eligible" || app.isNotShortlisted;

            let tagLabel = "Applied & Opted-In";
            let tagBg = "#eff6ff";
            let tagColor = "#2563eb";
            let tagBorder = "#bfdbfe";

            if (isSelected) {
                tagLabel = "Selected 🎉";
                tagBg = "#f0fdf4";
                tagColor = "#16a34a";
                tagBorder = "#bbf7d0";
            } else if (isNotShortlisted) {
                tagLabel = "Not Shortlisted";
                tagBg = "#fef2f2";
                tagColor = "#dc2626";
                tagBorder = "#fecaca";
            }

            list.push({
                id: app.id || `app_${idx}`,
                icon: "✓",
                date: app.deadline ? `Deadline: ${app.deadline}` : "Application Active",
                title: `${comp} — ${role || "Campus Drive"}`,
                subtitle: `Package: ${app.ctc || "N/A"} • Location: ${app.location || "On-Campus"}`,
                tag: tagLabel,
                tagBg,
                tagColor,
                tagBorder,
                targetTab: "applications"
            });
        });

        // 4. Live Eligible / Open Campus Drives with Approaching Deadlines
        placementDrives
            .filter(d => !isDriveOptedOut(d) && !isDriveOptedIn(d) && d.statusTag === "Eligible")
            .slice(0, 3)
            .forEach((drive: any, idx: number) => {
                const comp = String(drive.company || "").trim();
                const role = String(drive.role || "").trim();
                if (!comp) return;

                const key = `drive_${comp.toLowerCase()}_${role.toLowerCase()}`;
                if (
                    seenKeys.has(key) ||
                    seenKeys.has(`interview_${comp.toLowerCase()}_${role.toLowerCase()}`) ||
                    seenKeys.has(`offer_${comp.toLowerCase()}_${role.toLowerCase()}`) ||
                    seenKeys.has(`app_${comp.toLowerCase()}_${role.toLowerCase()}`)
                ) {
                    return;
                }
                seenKeys.add(key);

                list.push({
                    id: drive.id || `drive_${idx}`,
                    icon: "📢",
                    date: drive.deadline ? `Closes: ${drive.deadline}` : "Registration Open",
                    title: `${comp} — ${role}`,
                    subtitle: `Package: ${drive.ctc || "N/A"} • Location: ${drive.location || "On-Campus"}`,
                    tag: "Eligible Drive 🔵",
                    tagBg: "#fffbeb",
                    tagColor: "#b45309",
                    tagBorder: "#fde68a",
                    targetTab: "companies"
                });
            });

        return list;
    }, [dbInterviews, offersList, applicationsData, placementDrives, appliedDrives, optedOutDrives]);

    const handleDownloadPDF = (offer: any) => {
        const doc = new jsPDF();
        const studentName = displayName || user?.name || "Student Candidate";
        const regNo = studentRegNo || (user as any)?.regNo || "N/A";
        const refNo = offer.refNo || `CPMS/OFFER/2026/SEL-${Math.floor(Math.random() * 900 + 100)}`;
        const issueDate = offer.date || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        const companyName = offer.company || "Placement Recruitment Partner";
        const roleTitle = offer.role || "Graduate Engineer Trainee";
        const ctcPackage = offer.ctc || "₹10.0 LPA";

        // Header Background Accent Bar
        doc.setFillColor(15, 23, 42); // Dark Slate Blue #0f172a
        doc.rect(0, 0, 210, 32, "F");

        // Header Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("COLLEGE PLACEMENT MANAGEMENT SYSTEM", 105, 14, { align: "center" });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(226, 232, 240);
        doc.text("OFFICIAL CAMPUS RECRUITMENT APPOINTMENT & OFFER LETTER", 105, 23, { align: "center" });

        // Reference & Date Box
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, 40, 182, 18, 3, 3, "FD");

        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text(`Reference No: ${refNo}`, 20, 51);
        doc.text(`Date of Issue: ${issueDate}`, 135, 51);

        // Candidate Details Section
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(37, 99, 235); // Blue #2563eb
        doc.text("CANDIDATE DETAILS", 14, 70);

        doc.setLineWidth(0.5);
        doc.setDrawColor(37, 99, 235);
        doc.line(14, 73, 196, 73);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        doc.text(`Candidate Name:   ${studentName.toUpperCase()}`, 14, 83);
        doc.text(`Register Number:  ${regNo}`, 14, 91);
        doc.text(`Department:       Computer Science & Engineering`, 14, 99);

        // Offer Details Section
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(37, 99, 235);
        doc.text("APPOINTMENT & SALARY PACKAGE TERMS", 14, 115);

        doc.line(14, 118, 196, 118);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
        doc.text(`Hiring Company:    ${companyName}`, 14, 128);
        doc.text(`Designation Role:  ${roleTitle}`, 14, 136);
        doc.text(`Annual CTC:        ${ctcPackage}`, 14, 144);
        doc.text(`Tentative Joining: 15 September 2026`, 14, 152);
        doc.text(`Work Location:     Corporate Campus / Office`, 14, 160);

        // Confirmation Note Box
        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(187, 247, 208);
        doc.roundedRect(14, 172, 182, 22, 3, 3, "FD");

        doc.setFontSize(9.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(22, 101, 52);
        doc.text("STATUS: SELECTION CONFIRMED & OFFER ACCEPTED BY CANDIDATE", 20, 182);
        doc.setFont("helvetica", "normal");
        doc.text("This document constitutes an official campus recruitment placement sign-off.", 20, 189);

        // Official Sign-off
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("OFFICIAL SIGN-OFF & TPO CELL APPROVAL", 14, 212);
        doc.line(14, 215, 196, 215);

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("K. Manimaran", 14, 228);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(71, 85, 105);
        doc.text("Prof. K. Manimaran", 14, 235);
        doc.text("Placement Officer & Head - TPO Cell", 14, 242);
        doc.text("College Placement Management System", 14, 249);

        // Footer Line & Timestamp
        doc.setDrawColor(226, 232, 240);
        doc.line(14, 272, 196, 272);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("System Generated Verified Placement Document • College Placement Management Portal", 105, 279, { align: "center" });

        // Download PDF File
        const filename = `Offer_Letter_${companyName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
        doc.save(filename);
    };

    const handleApply = (driveId: string, driveComp?: string, driveRole?: string) => {
        const compStr = (driveComp || "").toLowerCase().trim();
        const roleStr = (driveRole || "").toLowerCase().trim();
        const compRoleKey = compStr && roleStr ? `${compStr}_${roleStr}` : "";

        const keysToRemove = [driveId, compRoleKey].filter(Boolean) as string[];
        const updatedOptOut = optedOutDrives.filter(id => !keysToRemove.some(k => k.toLowerCase() === id.toLowerCase()));
        setOptedOutDrives(updatedOptOut);

        const keysToAdd = [driveId, compRoleKey].filter(Boolean) as string[];
        const updatedApplied = Array.from(new Set([...appliedDrives, ...keysToAdd]));
        setAppliedDrives(updatedApplied);

        const allUserKeys = [
            `cpms_applied_drives_${userKey}`,
            `cpms_applied_drives_${userEmailLower}`,
            userId ? `cpms_applied_drives_${userId}` : "",
            user?.name ? `cpms_applied_drives_${user.name.toLowerCase().trim()}` : "",
            "cpms_applied_drives_ashwanth@gmail.com",
            "cpms_applied_drives_ashwanth",
            "cpms_applied_drives_guest",
            "cpms_applied_drives",
        ].filter(Boolean);

        allUserKeys.forEach(k => {
            try {
                localStorage.setItem(k, JSON.stringify(updatedApplied));
            } catch (e) {}
        });

        // Also save to cpms_applied_drives_global
        try {
            const globalStr = localStorage.getItem("cpms_applied_drives_global");
            let globalArr: any[] = [];
            if (globalStr) {
                try { globalArr = JSON.parse(globalStr); } catch (e) {}
            }
            if (!Array.isArray(globalArr)) globalArr = [];

            const newRecord = {
                userKey,
                email: user?.email || "",
                name: displayName || user?.name || "Student",
                driveId: String(driveId),
                companyName: driveComp || "",
                role: driveRole || "",
                optedInAt: new Date().toISOString()
            };

            const existingIdx = globalArr.findIndex((r: any) =>
                (r.userKey === userKey || (r.email && user?.email && r.email.toLowerCase() === user.email.toLowerCase())) &&
                (String(r.driveId) === String(driveId) || (r.companyName && driveComp && r.companyName.toLowerCase() === driveComp.toLowerCase() && r.role && driveRole && r.role.toLowerCase() === driveRole.toLowerCase()))
            );
            if (existingIdx >= 0) {
                globalArr[existingIdx] = newRecord;
            } else {
                globalArr.push(newRecord);
            }
            localStorage.setItem("cpms_applied_drives_global", JSON.stringify(globalArr));
        } catch (e) {}

        // Also save to cpms_applications
        try {
            const appsStr = localStorage.getItem("cpms_applications");
            let appsArr: any[] = [];
            if (appsStr) {
                try { appsArr = JSON.parse(appsStr); } catch (e) {}
            }
            if (!Array.isArray(appsArr)) appsArr = [];

            const appRecord = {
                id: `app_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                studentId: userId || `std_${Date.now()}`,
                studentName: displayName || user?.name || "Student",
                regNo: studentRegNo || (user as any)?.regNo || "N/A",
                department: studentDepartment || "Computer Science & Engineering",
                email: user?.email || "",
                studentEmail: user?.email || "",
                phone: studentPhone || "",
                driveId: String(driveId),
                company: driveComp || "Placement Drive",
                companyName: driveComp || "Placement Drive",
                jobRole: driveRole || "Software Developer",
                role: driveRole || "Software Developer",
                appliedDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                status: "Opted-In",
                currentRound: 1,
                currentWorkflowStage: "Opted-In",
                activeRoundType: "Round 1: Technical Assessment",
                cgpa: studentCgpa || 0,
                minCgpa: Number(selectedDriveCriteria?.minCgpa) || 6.0,
                tenth: studentTenth || 0,
                minTenth: Number(selectedDriveCriteria?.minTenth) || 60,
                twelfth: studentTwelfth || 0,
                minTwelfth: Number(selectedDriveCriteria?.minTwelfth) || 60,
                backlogs: studentBacklogs || 0,
                maxBacklogs: Number(selectedDriveCriteria?.maxBacklogs) ?? 1,
                gradYear: studentGradYear || 2026,
                reqGradYear: 2026,
                resumeName: studentResumeName || `${(displayName || user?.name || "Student").replace(/\s+/g, "_")}_Resume.pdf`,
                resumeUrl: studentResumeUrl || ""
            };

            appsArr.push(appRecord);
            localStorage.setItem("cpms_applications", JSON.stringify(appsArr));

            // Persist application to MongoDB backend
            fetch("http://localhost:5001/api/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId: appRecord.studentId,
                    studentName: appRecord.studentName,
                    regNo: appRecord.regNo,
                    department: appRecord.department,
                    email: appRecord.email,
                    phone: appRecord.phone,
                    cgpa: appRecord.cgpa,
                    tenthPercentage: appRecord.tenth,
                    twelfthPercentage: appRecord.twelfth,
                    backlogs: appRecord.backlogs,
                    gradYear: appRecord.gradYear,
                    companyName: appRecord.companyName,
                    jobRole: appRecord.jobRole,
                    driveId: appRecord.driveId,
                    status: "Applied"
                })
            }).catch(err => console.error("Error creating application in MongoDB:", err));
        } catch (e) {}

        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("cpms_drives_updated"));
        alert("Opt-In application submitted successfully!");
    };

    const handleOptOut = (driveId: string, driveComp?: string, driveRole?: string) => {
        const compStr = (driveComp || "").toLowerCase().trim();
        const roleStr = (driveRole || "").toLowerCase().trim();
        const compRoleKey = compStr && roleStr ? `${compStr}_${roleStr}` : "";

        const keysToRemove = [driveId, compRoleKey].filter(Boolean) as string[];
        const updatedApplied = appliedDrives.filter(id => !keysToRemove.some(k => k.toLowerCase() === id.toLowerCase()));
        setAppliedDrives(updatedApplied);

        const keysToAdd = [driveId, compRoleKey].filter(Boolean) as string[];
        const updatedOptOut = Array.from(new Set([...optedOutDrives, ...keysToAdd]));
        setOptedOutDrives(updatedOptOut);

        const allUserKeys = [
            `cpms_opted_out_drives_${userKey}`,
            `cpms_opted_out_drives_${userEmailLower}`,
            userId ? `cpms_opted_out_drives_${userId}` : "",
            user?.name ? `cpms_opted_out_drives_${user.name.toLowerCase().trim()}` : "",
            "cpms_opted_out_drives_ashwanth@gmail.com",
            "cpms_opted_out_drives_ashwanth",
            "cpms_opted_out_drives_guest",
            "cpms_opted_out_drives",
        ].filter(Boolean);

        allUserKeys.forEach(k => {
            try {
                localStorage.setItem(k, JSON.stringify(updatedOptOut));
            } catch (e) {}
        });

        const allAppliedKeys = [
            `cpms_applied_drives_${userKey}`,
            `cpms_applied_drives_${userEmailLower}`,
            userId ? `cpms_applied_drives_${userId}` : "",
            user?.name ? `cpms_applied_drives_${user.name.toLowerCase().trim()}` : "",
            "cpms_applied_drives_ashwanth@gmail.com",
            "cpms_applied_drives_ashwanth",
            "cpms_applied_drives_guest",
            "cpms_applied_drives",
        ].filter(Boolean);

        allAppliedKeys.forEach(k => {
            try {
                localStorage.setItem(k, JSON.stringify(updatedApplied));
            } catch (e) {}
        });

        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("cpms_drives_updated"));
        alert("Opt-Out response recorded successfully.");
    };

    return (
        <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f4f6f8", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}>
            {/* Sidebar matching exact placement portal design */}
            <aside style={{ width: "240px", backgroundColor: "#ffffff", borderRight: "1px solid #eaedf0", display: "flex", flexDirection: "column", justifyContent: "space-between", flexShrink: 0, minHeight: "100vh", position: "sticky", top: 0, height: "100vh" }}>
                <div>
                    {/* Brand */}
                    <div style={{ padding: "20px 24px", borderBottom: "1px solid #f0f2f5", display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "38px", height: "38px", backgroundColor: "#0f172a", borderRadius: "10px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "16px" }}>
                            CP
                        </div>
                        <div>
                            <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "15px", letterSpacing: "-0.3px" }}>Placement Portal</div>
                            <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>PLACEMENT SPACE</div>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <div style={{ padding: "16px 12px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", letterSpacing: "1px", padding: "0 12px 14px 12px", textTransform: "uppercase" }}>MAIN SPACE</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {[
                                { id: "dashboard", label: "Dashboard", svg: <path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5M4 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4z" /> },
                                { id: "companies", label: "Campus Drives", svg: <path d="M3 21h18M3 7v14M21 7v14M6 10h4M6 14h4M6 18h4M14 10h4M14 14h4M14 18h4M9 3h6v4H9z" /> },
                                { id: "applications", label: "My Applications", svg: <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /> },
                                { id: "schedule", label: "Interview Schedule", svg: <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" /> },
                                { id: "results", label: "Results & Offer Letter", svg: <path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17M14 14.66V17M18 4H6v7a6 6 0 0012 0V4z" /> },


                                { id: "profile", label: "My Profile", svg: <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /> },
                            ].map((item) => {
                                const isActive = currentTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setCurrentTab(item.id as any)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "14px",
                                            padding: "12px 18px",
                                            borderRadius: "16px",
                                            border: isActive ? "2px solid #0052cc" : "2px solid transparent",
                                            backgroundColor: isActive ? "#f4f6f8" : "transparent",
                                            color: isActive ? "#0f172a" : "#64748b",
                                            fontWeight: isActive ? "700" : "400",
                                            fontSize: "15px",
                                            fontFamily: "Inter, -apple-system, sans-serif",
                                            cursor: "pointer",
                                            textAlign: "left",
                                            transition: "all 0.15s ease-in-out",
                                            outline: "none",
                                            width: "100%",
                                        }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isActive ? "#0f172a" : "#64748b"} strokeWidth={isActive ? "2.4" : "1.8"} strokeLinecap="round" strokeLinejoin="round">
                                            {item.svg}
                                        </svg>
                                        <span style={{ fontWeight: isActive ? "700" : "400", color: isActive ? "#0f172a" : "#64748b" }}>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Account */}
                <div style={{ padding: "16px", borderTop: "1px solid #f0f2f5" }}>
                    <div style={{ backgroundColor: "#f8fafc", borderRadius: "10px", padding: "10px 12px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" }}>
                            {(displayName || "A").charAt(0).toUpperCase()}
                        </div>
                        <div style={{ overflow: "hidden" }}>
                            <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>Student</div>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        style={{
                            width: "100%",
                            padding: "9px 14px",
                            backgroundColor: "#fff",
                            color: "#ef4444",
                            border: "1px solid #fee2e2",
                            borderRadius: "8px",
                            fontWeight: "700",
                            fontSize: "13px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Area */}
            <main style={{ flex: 1, padding: "24px 32px", overflowY: "auto" }}>
                {/* Header Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <div>
                        <h1 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                            Student Placement Dashboard
                        </h1>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", cursor: "pointer", position: "relative" }}>
                            🔔
                            <span style={{ position: "absolute", top: "4px", right: "4px", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ef4444" }}></span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px" }}>
                                {(displayName || "A").charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>{displayName}</div>
                                <div style={{ fontSize: "11px", color: "#94a3b8" }}>Student</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TAB 1: DASHBOARD */}
                {currentTab === "dashboard" && (
                    <div>
                        {/* Dark Welcome Hero Banner (Matching Placement Officer Dashboard) */}
                        <div style={{ backgroundColor: "#0f172a", borderRadius: "16px", padding: "28px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.15)" }}>
                            <div>
                                <div style={{ fontSize: "11px", fontWeight: "800", color: "#eab308", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                                    👋 STUDENT SPACE
                                </div>
                                <h2 style={{ margin: "0 0 8px 0", fontSize: "26px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.5px" }}>
                                    Welcome, {displayName}
                                </h2>
                                <div style={{ color: "#9ca3af", fontSize: "13px", fontWeight: "500" }}>
                                    Season: <strong style={{ color: "#ffffff" }}>2026 Drive Active ✓</strong> | Last Sync: {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                </div>
                            </div>
                            <div style={{ backgroundColor: "rgba(255, 255, 255, 0.08)", padding: "10px 18px", borderRadius: "30px", border: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981" }}></span>
                                <span style={{ fontSize: "12px", fontWeight: "700", color: "#f9fafb" }}>Drive Season 2026 Active</span>
                            </div>
                        </div>

                        {/* 4 Stat Metric Cards (Matching Officer Dashboard Layout & Card Dimensions) */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
                            <div
                                onClick={() => setCurrentTab("profile")}
                                style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", cursor: "pointer", transition: "transform 0.15s ease, boxShadow 0.15s ease" }}
                            >
                                <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                                <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>PROFILE COMPLETENESS</div>
                                <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "4px 0 2px 0" }}>{profileCompletenessPercent}%</div>
                                <div style={{ fontSize: "12px", color: profileCompletenessPercent >= 80 ? "#16a34a" : "#d97706", fontWeight: "600" }}>
                                    {profileCompletenessPercent === 100 ? "✓ Verified & Ready" : `${profileCompletenessPercent}% Profile Complete`}
                                </div>
                            </div>

                            <div style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: isProfileVerified ? "#dcfce7" : "#fef3c7", color: isProfileVerified ? "#16a34a" : "#d97706", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isProfileVerified ? "#16a34a" : "#d97706"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                                <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>VERIFICATION STATUS</div>
                                <div style={{ fontSize: "20px", fontWeight: "800", color: isProfileVerified ? "#16a34a" : "#d97706", margin: "4px 0 2px 0" }}>
                                    {isProfileVerified ? "Verified ✓" : "Pending Verification"}
                                </div>
                                <div style={{ fontSize: "12px", color: isProfileVerified ? "#16a34a" : "#d97706", fontWeight: "600" }}>
                                    {isProfileVerified ? "Cell Sign-off complete" : "Awaiting Placement Officer Sign-off"}
                                </div>
                            </div>

                            <div
                                onClick={() => setCurrentTab("applications")}
                                style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", cursor: "pointer", transition: "transform 0.15s ease, boxShadow 0.15s ease" }}
                            >
                                <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                    </svg>
                                </div>
                                <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>MY APPLICATIONS</div>
                                <div style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "4px 0 2px 0" }}>{applicationsData.length}</div>
                                <div style={{ fontSize: "12px", color: "#2563eb", fontWeight: "600" }}>Submitted by candidate</div>
                            </div>

                            <div
                                onClick={() => setCurrentTab("results")}
                                style={{ backgroundColor: "#ffffff", padding: "20px", borderRadius: "14px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", cursor: "pointer", transition: "transform 0.15s ease, boxShadow 0.15s ease" }}
                            >
                                <div style={{ width: "42px", height: "42px", borderRadius: "12px", backgroundColor: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17M14 14.66V17M18 4H6v7a6 6 0 0 0 12 0V4z" />
                                    </svg>
                                </div>
                                <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>SELECTED OFFERS</div>
                                <div style={{ fontSize: "28px", fontWeight: "800", color: "#16a34a", margin: "4px 0 2px 0" }}>{offersList.length}</div>
                                <div style={{ fontSize: "12px", color: "#16a34a", fontWeight: "600" }}>
                                    {offersList.length === 1 ? "Confirmed placement offer" : "Confirmed placement offers"}
                                </div>
                            </div>
                        </div>

                        {/* Live Activity & Recent Updates Section */}
                        <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "22px 24px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "14px", borderBottom: "1px solid #f1f5f9" }}>
                                <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span>📌</span> Live Activity & Recent Updates
                                </div>
                                <button onClick={() => setCurrentTab("applications")} style={{ border: "none", background: "none", color: "#2563eb", fontWeight: "700", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                    View Applications &rarr;
                                </button>
                            </div>

                            {/* Activity Items Grid - Dynamic Live Cards or Clean Empty State */}
                            {liveActivities.length === 0 ? (
                                <div style={{
                                    textAlign: "center",
                                    padding: "36px 20px",
                                    backgroundColor: "#f8fafc",
                                    borderRadius: "12px",
                                    border: "1px dashed #cbd5e1"
                                }}>
                                    <div style={{ fontSize: "36px", marginBottom: "8px" }}>📋</div>
                                    <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0" }}>
                                        No Active Recruitment Activities
                                    </h3>
                                    <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0", maxWidth: "420px", marginInline: "auto" }}>
                                        You currently have no scheduled interviews or ongoing application updates. Explore available campus drives and opt in to get started.
                                    </p>
                                    <button
                                        onClick={() => setCurrentTab("companies")}
                                        style={{
                                            backgroundColor: "#2563eb",
                                            color: "#ffffff",
                                            border: "none",
                                            borderRadius: "8px",
                                            padding: "9px 20px",
                                            fontWeight: "700",
                                            fontSize: "13px",
                                            cursor: "pointer",
                                            boxShadow: "0 2px 4px rgba(37,99,235,0.2)"
                                        }}
                                    >
                                        Browse Campus Drives &rarr;
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "14px" }}>
                                    {liveActivities.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => setCurrentTab(item.targetTab)}
                                            className="dash-card-hover"
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "space-between",
                                                padding: "16px 18px",
                                                borderRadius: "12px",
                                                backgroundColor: "#f8fafc",
                                                border: "1px solid #e2e8f0",
                                                boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                                                gap: "14px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                                                <div style={{
                                                    width: "42px",
                                                    height: "42px",
                                                    borderRadius: "10px",
                                                    backgroundColor: "#ffffff",
                                                    border: "1px solid #cbd5e1",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "20px",
                                                    flexShrink: 0,
                                                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                                                }}>
                                                    {item.icon}
                                                </div>
                                                <div>
                                                    <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "800", color: "#0f172a" }}>
                                                        {item.title}
                                                    </h4>
                                                    <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.4" }}>
                                                        {item.subtitle}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid #e2e8f0" }}>
                                                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>
                                                    🗓 {item.date}
                                                </span>
                                                <span
                                                    style={{
                                                        padding: "4px 10px",
                                                        borderRadius: "12px",
                                                        backgroundColor: item.tagBg,
                                                        color: item.tagColor,
                                                        border: `1px solid ${item.tagBorder}`,
                                                        fontSize: "11px",
                                                        fontWeight: "700",
                                                        whiteSpace: "nowrap"
                                                    }}
                                                >
                                                    {item.tag}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 2: CAMPUS DRIVES */}
                {currentTab === "companies" && (
                    <div>
                        {/* 5 Filter Pills */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "14px", marginBottom: "24px" }}>
                            {[
                                { key: "Opted-In", label: "✓ Opted-In", count: filterCounts["Opted-In"], activeBg: "#f0fdf4", activeBorder: "2px solid #16a34a", activeColor: "#16a34a" },
                                { key: "Opted-Out", label: "🚫 Opted-Out", count: filterCounts["Opted-Out"], activeBg: "#fef2f2", activeBorder: "2px solid #ef4444", activeColor: "#dc2626" },
                                { key: "Eligible", label: "🔵 Eligible Drives", count: filterCounts["Eligible"], activeBg: "#eff6ff", activeBorder: "2px solid #2563eb", activeColor: "#1d4ed8" },
                                { key: "Not Eligible", label: "🔴 Not Eligible", count: filterCounts["Not Eligible"], activeBg: "#fef2f2", activeBorder: "2px solid #ef4444", activeColor: "#dc2626" },
                                { key: "Completed", label: "✓ Completed", count: filterCounts["Completed"], activeBg: "#f8fafc", activeBorder: "2px solid #475569", activeColor: "#334155" },
                            ].map((filter) => {
                                const isSelected = driveFilter === filter.key;
                                return (
                                    <div
                                        key={filter.key}
                                        onClick={() => setDriveFilter(filter.key as any)}
                                        style={{
                                            backgroundColor: isSelected ? filter.activeBg : "#ffffff",
                                            borderRadius: "14px",
                                            padding: "16px 20px",
                                            border: isSelected ? filter.activeBorder : "1px solid #eaedf0",
                                            cursor: "pointer",
                                            transition: "all 0.15s ease"
                                        }}
                                    >
                                        <div style={{ fontSize: "13px", fontWeight: "700", color: isSelected ? filter.activeColor : "#64748b" }}>
                                            {filter.label}
                                        </div>
                                        <div style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginTop: "4px" }}>
                                            {filter.count}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Drives List Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
                            {placementDrives
                                .filter(d => {
                                    const isOptedIn = isDriveOptedIn(d);
                                    if (driveFilter === "Opted-In") return isOptedIn;
                                    if (driveFilter === "Opted-Out") return d.statusTag === "Opted-Out";
                                    if (driveFilter === "Eligible") return (d.statusTag === "Eligible" || isOptedIn) && d.statusTag !== "Not Eligible" && d.statusTag !== "Completed";
                                    if (driveFilter === "Not Eligible") return d.statusTag === "Not Eligible" && !isOptedIn;
                                    if (driveFilter === "Completed") return d.statusTag === "Completed";
                                    return true;
                                })
                                .map((drive) => {
                                    const isIneligible = drive.statusTag === "Not Eligible";
                                    return (
                                        <div key={drive.id} style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "20px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                                                <div style={{ width: "44px", height: "44px", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff", overflow: "hidden" }}>
                                                    <img
                                                        src={drive.logo}
                                                        alt={drive.company}
                                                        onError={(e: any) => {
                                                            e.target.style.display = "none";
                                                            if (e.target.parentNode) {
                                                                e.target.parentNode.style.backgroundColor = "#0f172a";
                                                                e.target.parentNode.style.color = "#ffffff";
                                                                e.target.parentNode.style.fontWeight = "800";
                                                                e.target.parentNode.style.fontSize = "14px";
                                                                e.target.parentNode.innerText = drive.company.charAt(0);
                                                            }
                                                        }}
                                                        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                                                    />
                                                </div>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>{drive.company}</h4>
                                                    <div style={{ fontSize: "13px", color: "#64748b" }}>{drive.role}</div>
                                                </div>
                                            </div>

                                            <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "18px", lineHeight: "1.5", minHeight: "36px" }}>
                                                Package: <strong style={{ color: drive.ctc ? "#16a34a" : "#64748b" }}>{drive.ctc || ""}</strong> {drive.location ? `| Location: ` : ""}<strong style={{ color: "#0f172a" }}>{drive.location}</strong> {drive.deadline ? `| Deadline: ` : ""}<strong style={{ color: "#dc2626" }}>{drive.deadline}</strong>
                                            </div>

                                            {isIneligible ? (
                                                <button
                                                    onClick={() => setSelectedDriveCriteria(drive)}
                                                    style={{
                                                        width: "100%",
                                                        height: "42px",
                                                        padding: "11px 0",
                                                        borderRadius: "10px",
                                                        border: "1.5px solid #fecaca",
                                                        backgroundColor: "#fef2f2",
                                                        color: "#dc2626",
                                                        fontWeight: "700",
                                                        fontSize: "13px",
                                                        fontFamily: "Inter, -apple-system, sans-serif",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        boxSizing: "border-box"
                                                    }}
                                                >
                                                    View Ineligibility 🔍
                                                </button>
                                            ) : drive.statusTag === "Opted-In" || isDriveOptedIn(drive) ? (
                                                <div
                                                    onClick={() => setSelectedDriveCriteria(drive)}
                                                    style={{
                                                        width: "100%",
                                                        height: "42px",
                                                        padding: "11px 0",
                                                        borderRadius: "10px",
                                                        border: "1.5px solid #16a34a",
                                                        backgroundColor: "#f0fdf4",
                                                        color: "#16a34a",
                                                        fontWeight: "800",
                                                        fontSize: "13px",
                                                        fontFamily: "Inter, -apple-system, sans-serif",
                                                        textAlign: "center",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "6px",
                                                        boxSizing: "border-box"
                                                    }}
                                                >
                                                    ✓ Opted-In
                                                </div>
                                            ) : drive.statusTag === "Opted-Out" || isDriveOptedOut(drive) ? (
                                                <div
                                                    onClick={() => setSelectedDriveCriteria(drive)}
                                                    style={{
                                                        width: "100%",
                                                        height: "42px",
                                                        padding: "11px 0",
                                                        borderRadius: "10px",
                                                        border: "1.5px solid #dc2626",
                                                        backgroundColor: "#fef2f2",
                                                        color: "#dc2626",
                                                        fontWeight: "800",
                                                        fontSize: "13px",
                                                        fontFamily: "Inter, -apple-system, sans-serif",
                                                        textAlign: "center",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "6px",
                                                        boxSizing: "border-box"
                                                    }}
                                                >
                                                    🚫 Opted-Out
                                                </div>
                                            ) : drive.statusTag === "Completed" ? (
                                                <div
                                                    onClick={() => setSelectedDriveCriteria(drive)}
                                                    style={{
                                                        width: "100%",
                                                        height: "42px",
                                                        padding: "11px 0",
                                                        borderRadius: "10px",
                                                        border: "1.5px solid #64748b",
                                                        backgroundColor: "#f8fafc",
                                                        color: "#334155",
                                                        fontWeight: "800",
                                                        fontSize: "13px",
                                                        fontFamily: "Inter, -apple-system, sans-serif",
                                                        textAlign: "center",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "6px",
                                                        boxSizing: "border-box"
                                                    }}
                                                >
                                                    ✓ Drive Completed
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setSelectedDriveCriteria(drive)}
                                                    style={{
                                                        width: "100%",
                                                        height: "42px",
                                                        padding: "11px 0",
                                                        borderRadius: "10px",
                                                        border: "none",
                                                        backgroundColor: "#2563eb",
                                                        color: "#ffffff",
                                                        fontWeight: "700",
                                                        fontSize: "13px",
                                                        fontFamily: "Inter, -apple-system, sans-serif",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        gap: "6px",
                                                        boxSizing: "border-box"
                                                    }}
                                                >
                                                    Apply for Drive ➔
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {/* TAB 3: MY APPLICATIONS */}
                {currentTab === "applications" && (
                    <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "24px", border: "1px solid #eaedf0" }}>
                        <div style={{ marginBottom: "20px" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "0 0 6px 0" }}>
                                Drive Applications & Selection Stage
                            </h2>
                            <div style={{ fontSize: "12px", color: "#64748b" }}>
                                Supported Rounds: <strong>Aptitude | Technical | HR | Coding Test | Online Assessment | Managerial</strong>
                            </div>
                        </div>

                        {/* Desktop View Table */}
                        <div className="desktop-applications-view" style={{ width: "100%" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                        <th style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>Company</th>
                                        <th style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>Role</th>
                                        <th style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>Package</th>
                                        <th style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>Active Round Type</th>
                                        <th style={{ padding: "12px 10px", whiteSpace: "nowrap" }}>Current Workflow Stage</th>
                                        <th style={{ padding: "12px 10px", whiteSpace: "nowrap", textAlign: "center" }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applicationsData.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} style={{ padding: "30px", textAlign: "center", color: "#64748b", fontSize: "14px", fontWeight: "600" }}>
                                                No active opted-in drive applications yet. Browse <span style={{ color: "#2563eb", cursor: "pointer", fontWeight: "800", textDecoration: "underline" }} onClick={() => setCurrentTab("companies")}>Campus Drives</span> to Opt-In.
                                            </td>
                                        </tr>
                                    ) : (
                                        applicationsData.map((app, idx) => (
                                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "14px 10px", fontWeight: "800", color: "#0f172a", whiteSpace: "nowrap" }}>{app.company}</td>
                                            <td style={{ padding: "14px 10px", color: "#334155", whiteSpace: "nowrap" }}>{app.role}</td>
                                            <td style={{ padding: "14px 10px", color: "#334155", whiteSpace: "nowrap" }}>{app.package}</td>
                                            <td style={{ padding: "14px 10px", whiteSpace: "nowrap" }}>
                                                <span style={{ backgroundColor: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap", display: "inline-block", border: "1px solid #bfdbfe" }}>
                                                    {app.activeRoundType}
                                                </span>
                                            </td>
                                            <td style={{ padding: "14px 10px", whiteSpace: "nowrap" }}>
                                                {(() => {
                                                    const st = app.currentWorkflowStage || "Round 1";
                                                    let bg = "#eff6ff";
                                                    let color = "#2563eb";
                                                    let border = "1px solid #bfdbfe";

                                                    if (st === "Selected") {
                                                        bg = "#f0fdf4"; color = "#15803d"; border = "1px solid #bbf7d0";
                                                    } else if (st === "Not Shortlisted" || st === "Rejected") {
                                                        bg = "#fef2f2"; color = "#dc2626"; border = "1px solid #fecaca";
                                                    }

                                                    return (
                                                        <span style={{
                                                            backgroundColor: bg,
                                                            color: color,
                                                            padding: "4px 12px",
                                                            borderRadius: "8px",
                                                            fontSize: "11px",
                                                            fontWeight: "700",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            whiteSpace: "nowrap",
                                                            border: border
                                                        }}>
                                                            {st}
                                                        </span>
                                                    );
                                                })()}

                                            </td>
                                            <td style={{ padding: "14px 10px", whiteSpace: "nowrap", textAlign: "center" }}>
                                                <button
                                                    onClick={() => setSelectedApplicationModal(app)}
                                                    style={{
                                                        backgroundColor: "#0f172a",
                                                        color: "#ffffff",
                                                        border: "none",
                                                        padding: "7px 18px",
                                                        borderRadius: "7px",
                                                        fontWeight: "700",
                                                        fontSize: "12px",
                                                        cursor: "pointer",
                                                        whiteSpace: "nowrap",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent: "center"
                                                    }}
                                                >
                                                    <span style={{ color: "#ffffff", fontWeight: "700", display: "inline-block" }}>View</span>
                                                </button>
                                            </td>
                                        </tr>
                                    )))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards View */}
                        <div className="mobile-applications-view">
                            {applicationsData.map((app, idx) => {
                                const isRed = app.currentWorkflowStage === "Not Shortlisted";
                                const isBlue = app.currentWorkflowStage === "Interview Shortlisted" || app.currentWorkflowStage === "Interview Scheduled" || app.currentWorkflowStage === "Under Review";
                                return (
                                    <div key={idx} style={{ backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "16px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", gap: "12px" }}>
                                        <div>
                                            <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>{app.company}</h3>
                                            <div style={{ fontSize: "13px", fontWeight: "700", color: "#2563eb" }}>{app.role}</div>
                                        </div>

                                        <div style={{ backgroundColor: "#f8fafc", borderRadius: "10px", padding: "12px", border: "1px solid #f1f5f9", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px" }}>
                                            <div>
                                                <div style={{ fontSize: "10px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", marginBottom: "2px" }}>Package</div>
                                                <strong style={{ color: "#16a34a" }}>{app.package}</strong>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "10px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", marginBottom: "2px" }}>Active Round</div>
                                                <strong style={{ color: "#2563eb" }}>{app.activeRoundType}</strong>
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <div style={{ fontSize: "10px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", marginBottom: "4px" }}>Current Status</div>
                                                <span style={{
                                                    padding: "2px 8px",
                                                    borderRadius: "10px",
                                                    fontSize: "10px",
                                                    fontWeight: "700",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    backgroundColor: isRed ? "#fef2f2" : (isBlue ? "#eff6ff" : "#dcfce7"),
                                                    color: isRed ? "#dc2626" : (isBlue ? "#2563eb" : "#15803d"),
                                                    border: `1px solid ${isRed ? "#fecaca" : (isBlue ? "#bfdbfe" : "#bbf7d0")}`
                                                }}>
                                                    {isRed ? "🔴 Not Shortlisted" : (isBlue ? `🔵 ${app.currentWorkflowStage}` : `🟢 ${app.currentWorkflowStage}`)}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => setSelectedApplicationModal(app)}
                                                style={{
                                                    backgroundColor: "#0f172a",
                                                    color: "#ffffff",
                                                    border: "none",
                                                    padding: "8px 16px",
                                                    borderRadius: "8px",
                                                    fontWeight: "700",
                                                    fontSize: "12px",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                <span style={{ color: "#ffffff", fontWeight: "700" }}>View Details ➔</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}



                {/* TAB 4: INTERVIEW SCHEDULE */}
                {currentTab === "schedule" && (
                    <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "24px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div>
                                <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span>🗓️</span> Active Interview Schedules & Venue Details
                                </h2>
                                <div style={{ fontSize: "12px", color: "#64748b" }}>
                                    Official recruitment interview dates, evaluator panels, meeting links, and officer feedback.
                                </div>
                            </div>
                            <button
                                onClick={fetchBackendInterviews}
                                style={{
                                    backgroundColor: "#f8fafc",
                                    border: "1px solid #cbd5e1",
                                    color: "#0f172a",
                                    padding: "6px 14px",
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px"
                                }}
                            >
                                🔄 Refresh Schedule
                            </button>
                        </div>

                        {interviewsLoading ? (
                            <div style={{ padding: "40px 0", textAlign: "center", color: "#64748b", fontWeight: "700", fontSize: "14px" }}>
                                ⏳ Loading interview schedules from backend...
                            </div>
                        ) : interviewsError ? (
                            <div style={{ padding: "30px 20px", backgroundColor: "#fef2f2", borderRadius: "12px", border: "1px solid #fecaca", color: "#dc2626", fontWeight: "700", fontSize: "13px", textAlign: "center" }}>
                                ⚠️ {interviewsError}
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
                                {(() => {
                                    // Build deduplicated interviews list: 1 card per company role
                                    const seenKeys = new Set<string>();
                                    const sortedList: any[] = [];

                                    const sourceList = dbInterviews.length > 0 ? dbInterviews : applicationsData;

                                    sourceList.forEach((item: any) => {
                                        const c = String(item.company || item.companyName || "").trim();
                                        const r = String(item.role || item.jobRole || "").trim();
                                        if (!c) return;

                                        const key = `${c.toLowerCase()}_${r.toLowerCase()}`;
                                        if (!seenKeys.has(key)) {
                                            seenKeys.add(key);

                                            // Find matched app from applicationsData
                                            const appMatch = applicationsData.find((a: any) =>
                                                (a.company || "").toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes((a.company || "").toLowerCase())
                                            );

                                            sortedList.push({
                                                id: item.id || item._id || key,
                                                company: c,
                                                role: r || appMatch?.role || "Software Developer",
                                                status: item.status || (appMatch?.currentWorkflowStage === "Selected" ? "passed" : "scheduled"),
                                                roundTitle: item.roundTitle || appMatch?.activeRoundType || "Round 1: Selection Assessment",
                                                date: item.date || appMatch?.rounds?.[0]?.date || "31 Aug 2026",
                                                time: item.time || "10:00 AM IST",
                                                interviewer: item.interviewer || "Siva",
                                                mode: item.mode || "Offline",
                                                venue: item.venue || "Placement Cell",
                                                platform: item.platform || "Web Platform",
                                                meetingLink: item.meetingLink,
                                                history: item.history || appMatch?.rounds || []
                                            });
                                        }
                                    });

                                    if (sortedList.length === 0) {
                                        return (
                                            <div style={{ padding: "40px 0", textAlign: "center", color: "#64748b", fontWeight: "700", fontSize: "14px", gridColumn: "1 / -1" }}>
                                                📌 No interviews scheduled yet.
                                            </div>
                                        );
                                    }

                                    return sortedList.map((sch: any, idx: number) => {
                                        const st = (sch.status || "").toLowerCase();
                                        const isCancelled = st === "cancelled";
                                        const isRescheduled = st === "rescheduled";
                                        const isPassed = st === "passed";

                                        let badgeBg = "#eff6ff";
                                        let badgeColor = "#2563eb";
                                        let badgeBorder = "#bfdbfe";
                                        let badgeLabel = "Scheduled 🗓️";

                                        if (isPassed) {
                                            badgeBg = "#f0fdf4";
                                            badgeColor = "#16a34a";
                                            badgeBorder = "#bbf7d0";
                                            badgeLabel = "Passed ✓";
                                        } else if (st === "today") {
                                            badgeBg = "#fffbeb";
                                            badgeColor = "#d97706";
                                            badgeBorder = "#fde68a";
                                            badgeLabel = "Today 🟠";
                                        } else if (isRescheduled) {
                                            badgeBg = "#fffbeb";
                                            badgeColor = "#d97706";
                                            badgeBorder = "#fde68a";
                                            badgeLabel = "Rescheduled 🗓️";
                                        } else if (isCancelled) {
                                            badgeBg = "#fef2f2";
                                            badgeColor = "#dc2626";
                                            badgeBorder = "#fecaca";
                                            badgeLabel = "Cancelled 🔴";
                                        }

                                        return (
                                            <div key={sch.id || idx} style={{ border: "1px solid #eaedf0", borderRadius: "14px", padding: "20px", backgroundColor: isCancelled ? "#f8fafc" : "#ffffff", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                                <div>
                                                    {/* Card Top Header */}
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                                                        <div>
                                                            <h4 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: "800", color: "#0f172a" }}>{sch.company}</h4>
                                                            <div style={{ fontSize: "13px", color: "#2563eb", fontWeight: "700" }}>{sch.role}</div>
                                                        </div>
                                                        <span style={{
                                                            backgroundColor: badgeBg,
                                                            color: badgeColor,
                                                            border: `1px solid ${badgeBorder}`,
                                                            padding: "4px 10px",
                                                            borderRadius: "12px",
                                                            fontSize: "12px",
                                                            fontWeight: "800",
                                                            whiteSpace: "nowrap",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            flexShrink: 0
                                                        }}>
                                                            {badgeLabel}
                                                        </span>
                                                    </div>

                                                    {/* Active Round Card Info Box */}
                                                    {!isCancelled && (
                                                        <div style={{ backgroundColor: "#f8fafc", borderRadius: "10px", padding: "14px", border: "1px solid #f1f5f9", marginBottom: "16px", fontSize: "12.5px", color: "#334155", lineHeight: "1.6" }}>
                                                            <div style={{ fontWeight: "800", color: "#1d4ed8", marginBottom: "6px" }}>📍 Round: {sch.roundTitle}</div>
                                                            <div>📅 Date & Time: <strong>{sch.date} | {sch.time}</strong></div>
                                                            <div>👨‍🏫 Interviewer Panel: <strong>{sch.interviewer}</strong></div>
                                                            <div>🏢 Mode & Location: <strong>{sch.mode} ({sch.venue || sch.platform || "Placement Cell"})</strong></div>
                                                        </div>
                                                    )}

                                                    {/* Previous Round History */}
                                                    {sch.history && sch.history.length > 0 && (
                                                        <div style={{ marginBottom: "16px" }}>
                                                            <div style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.5px" }}>
                                                                PREVIOUS ROUND HISTORY ({sch.history.length})
                                                            </div>
                                                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                                {sch.history.map((h: any, hIdx: number) => {
                                                                    const rawStatus = (h.status || "").toLowerCase().trim();
                                                                    const isPassed = rawStatus.includes("passed") || rawStatus.includes("cleared") || rawStatus.includes("selected");
                                                                    const isFailed = rawStatus.includes("rejected") || rawStatus.includes("not shortlisted") || rawStatus.includes("failed") || rawStatus.includes("not selected");

                                                                    let statusLabel = "In Progress ⏳";
                                                                    let statusColor = "#2563eb";

                                                                    if (isPassed) {
                                                                        statusLabel = "Passed ✓";
                                                                        statusColor = "#16a34a";
                                                                    } else if (isFailed) {
                                                                        statusLabel = "Not Selected ✕";
                                                                        statusColor = "#dc2626";
                                                                    } else if (rawStatus.includes("upcoming") || rawStatus.includes("pending") || rawStatus.includes("locked")) {
                                                                        statusLabel = "Locked 🔒";
                                                                        statusColor = "#94a3b8";
                                                                    }

                                                                    return (
                                                                        <div key={hIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#334155" }}>
                                                                            <div>
                                                                                <div style={{ fontWeight: "600" }}>{h.name || h.round}</div>
                                                                                {h.date && <div style={{ fontSize: "10px", color: "#94a3b8" }}>{h.date}</div>}
                                                                            </div>
                                                                            <span style={{ color: statusColor, fontWeight: "700", whiteSpace: "nowrap" }}>
                                                                                {statusLabel}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Card Footer Action Buttons */}
                                                <div style={{ display: "flex", gap: "10px", alignItems: "center", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                                                    <button
                                                        onClick={() => setSelectedInterviewModal(sch)}
                                                        style={{
                                                            flex: 1,
                                                            backgroundColor: "#ffffff",
                                                            border: "1px solid #cbd5e1",
                                                            color: "#0f172a",
                                                            borderRadius: "8px",
                                                            padding: "8px 14px",
                                                            fontSize: "12px",
                                                            fontWeight: "700",
                                                            cursor: "pointer",
                                                            textAlign: "center"
                                                        }}
                                                    >
                                                        View Details
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        )}
                    </div>
                )}


                {/* TAB 5: RESULTS & OFFER LETTER */}
                {currentTab === "results" && (

                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        {/* Table Box matching exact screenshot */}
                        <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "24px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                            <div style={{ marginBottom: "20px" }}>
                                <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span>🏆</span> Selection Results & Official PDF Offer Letter Download
                                </h2>
                                <div style={{ fontSize: "12px", color: "#64748b" }}>
                                    Download officially verified campus recruitment appointment letters.
                                </div>
                            </div>

                            {/* Table */}
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0", fontSize: "13px" }}>
                                    <thead>
                                        <tr style={{ backgroundColor: "#f8fafc", color: "#64748b", fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                            <th style={{ padding: "12px 16px", textAlign: "left", borderRadius: "8px 0 0 8px" }}>Company</th>
                                            <th style={{ padding: "12px 16px", textAlign: "left" }}>Job Role</th>
                                            <th style={{ padding: "12px 16px", textAlign: "left" }}>Salary Package</th>
                                            <th style={{ padding: "12px 16px", textAlign: "left" }}>Status</th>
                                            <th style={{ padding: "12px 16px", textAlign: "left" }}>Joining Date</th>
                                            <th style={{ padding: "12px 16px", textAlign: "left", borderRadius: "0 8px 8px 0" }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {offersList.map((off, idx) => {
                                            const isDeclined = off.status === "Offer Declined";
                                            return (
                                                <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                    <td style={{ padding: "16px", fontWeight: "800", color: "#0f172a" }}>
                                                        {off.company}
                                                    </td>
                                                    <td style={{ padding: "16px", color: "#334155", fontWeight: "600" }}>
                                                        {off.role}
                                                    </td>
                                                    <td style={{ padding: "16px", fontWeight: "800", color: "#16a34a" }}>
                                                        {off.ctc || "₹12 LPA"}
                                                    </td>
                                                    <td style={{ padding: "16px" }}>
                                                        <span style={{
                                                            backgroundColor: isDeclined ? "#fef2f2" : (off.accepted ? "#dcfce7" : "#eff6ff"),
                                                            color: isDeclined ? "#dc2626" : (off.accepted ? "#16a34a" : "#2563eb"),
                                                            padding: "4px 10px",
                                                            borderRadius: "12px",
                                                            fontSize: "12px",
                                                            fontWeight: "700",
                                                            whiteSpace: "nowrap",
                                                            display: "inline-flex",
                                                            alignItems: "center"
                                                        }}>
                                                            {isDeclined ? "✕ Declined" : (off.accepted ? "Selected ✓" : "Offer Released")}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "16px", color: "#64748b", fontWeight: "600" }}>
                                                        {off.date || "15 Sep 2026"}
                                                    </td>
                                                    <td style={{ padding: "16px" }}>
                                                        {off.accepted ? (
                                                            /* ON ACCEPT: SHOW ONLY VIEW OFFER AND DOWNLOAD PDF BUTTONS */
                                                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                                <button
                                                                    onClick={() => setSelectedOfferModal(off)}
                                                                    style={{
                                                                        backgroundColor: "#ffffff",
                                                                        border: "1px solid #cbd5e1",
                                                                        color: "#0f172a",
                                                                        borderRadius: "8px",
                                                                        padding: "7px 14px",
                                                                        fontSize: "12px",
                                                                        fontWeight: "700",
                                                                        cursor: "pointer",
                                                                        display: "inline-flex",
                                                                        alignItems: "center",
                                                                        gap: "4px",
                                                                        whiteSpace: "nowrap"
                                                                    }}
                                                                >
                                                                    View Offer
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDownloadPDF(off)}
                                                                    style={{
                                                                        backgroundColor: "#16a34a",
                                                                        border: "none",
                                                                        color: "#ffffff",
                                                                        borderRadius: "8px",
                                                                        padding: "7px 14px",
                                                                        fontSize: "12px",
                                                                        fontWeight: "700",
                                                                        cursor: "pointer",
                                                                        display: "inline-flex",
                                                                        alignItems: "center",
                                                                        gap: "4px",
                                                                        whiteSpace: "nowrap"
                                                                    }}
                                                                >
                                                                    Download PDF
                                                                </button>
                                                            </div>
                                                        ) : isDeclined ? (
                                                            <span style={{ color: "#dc2626", fontSize: "12px", fontWeight: "700" }}>✕ Offer Declined</span>
                                                        ) : (
                                                            <span style={{ color: "#d97706", fontSize: "12px", fontWeight: "700" }}>Pending Offer Acceptance</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Placement Confirmation & Offer Sign-off Box */}
                        {offersList.some(o => !o.accepted && o.status !== "Offer Declined") && (
                            <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "24px", border: "1px solid #bbf7d0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                <div style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ color: "#16a34a" }}>✅</span> Placement Confirmation & Offer Sign-off
                                </div>
                                <div style={{ fontSize: "13px", color: "#475569", marginBottom: "16px" }}>
                                    Final stage: Confirm your decision to accept the placement offer from <strong>{offersList.find(o => !o.accepted && o.status !== "Offer Declined")?.company} ({offersList.find(o => !o.accepted && o.status !== "Offer Declined")?.role})</strong>.
                                </div>
                                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                    <button
                                        onClick={() => {
                                            const target = offersList.find(o => !o.accepted && o.status !== "Offer Declined");
                                            if (target) {
                                                const updated = offersList.map(o => o.company === target.company ? { ...o, status: "Offer Accepted", accepted: true } : o);
                                                setOffersList(updated);
                                                const offerKeys = [
                                                    `cpms_offers_list_${userKey}`,
                                                    `cpms_offers_list_${userEmailLower}`,
                                                    userId ? `cpms_offers_list_${userId}` : "",
                                                    "cpms_offers_list_ashwanth@gmail.com",
                                                    "cpms_offers_list_ashwanth",
                                                    "cpms_offers_list",
                                                ].filter(Boolean);
                                                offerKeys.forEach(k => {
                                                    try { localStorage.setItem(k, JSON.stringify(updated)); } catch (e) {}
                                                });
                                                window.dispatchEvent(new Event("storage"));
                                            }
                                        }}
                                        style={{
                                            backgroundColor: "#16a34a",
                                            color: "#ffffff",
                                            border: "none",
                                            padding: "10px 20px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "700",
                                            cursor: "pointer",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px"
                                        }}
                                    >
                                        ✓ Accept Placement Offer
                                    </button>
                                    <button
                                        onClick={() => {
                                            const target = offersList.find(o => !o.accepted && o.status !== "Offer Declined");
                                            if (target && window.confirm(`Are you sure you want to decline the offer from ${target.company}?`)) {
                                                const updated = offersList.map(o => o.company === target.company ? { ...o, status: "Offer Declined", accepted: false } : o);
                                                setOffersList(updated);
                                                const offerKeys = [
                                                    `cpms_offers_list_${userKey}`,
                                                    `cpms_offers_list_${userEmailLower}`,
                                                    userId ? `cpms_offers_list_${userId}` : "",
                                                    "cpms_offers_list_ashwanth@gmail.com",
                                                    "cpms_offers_list_ashwanth",
                                                    "cpms_offers_list",
                                                ].filter(Boolean);
                                                offerKeys.forEach(k => {
                                                    try { localStorage.setItem(k, JSON.stringify(updated)); } catch (e) {}
                                                });
                                                window.dispatchEvent(new Event("storage"));
                                            }
                                        }}
                                        style={{
                                            backgroundColor: "#ffffff",
                                            color: "#dc2626",
                                            border: "1px solid #fecaca",
                                            padding: "10px 20px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: "700",
                                            cursor: "pointer",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "6px"
                                        }}
                                    >
                                        ✕ Decline Offer
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 6: PROFILE */}
                {currentTab === "profile" && <StudentProfile user={user} />}

                {/* MODAL 1: Drive Details & Opt-In / Opt-Out Modal */}
                {selectedDriveCriteria && (
                    <div onClick={() => setSelectedDriveCriteria(null)} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                        <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#ffffff", borderRadius: "16px", width: "480px", maxWidth: "92%", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}>
                            {/* Dark Modal Header */}
                            <div style={{ backgroundColor: "#0b1329", color: "#ffffff", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                    <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "#ffffff", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <img src={selectedDriveCriteria.logo} alt={selectedDriveCriteria.company} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#ffffff" }}>{selectedDriveCriteria.company}</h3>
                                        <div style={{ fontSize: "13px", color: "#60a5fa", fontWeight: "600" }}>{selectedDriveCriteria.role}</div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedDriveCriteria(null)} style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.15)", border: "none", color: "#ffffff", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                            </div>

                            {/* Modal Content */}
                            <div style={{ padding: "20px 24px" }}>
                                <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
                                    Package: <strong style={{ color: "#16a34a" }}>{selectedDriveCriteria.ctc}</strong> | Location: <strong style={{ color: "#0f172a" }}>{selectedDriveCriteria.location}</strong>
                                </div>

                                {/* Eligibility Box */}
                                <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "16px", border: "1px solid #f1f5f9", marginBottom: "16px" }}>
                                    <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "12px" }}>ELIGIBILITY REQUIREMENTS</div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>
                                        <div>Eligible Departments: <strong>{Array.isArray(selectedDriveCriteria.departments) ? selectedDriveCriteria.departments.join(", ") : (selectedDriveCriteria.departments || "CSE, IT, ECE")}</strong></div>
                                        <div>Minimum CGPA: <strong>{selectedDriveCriteria.minCgpa ?? "6.0"}</strong></div>
                                        <div>10th Percentage: <strong>{selectedDriveCriteria.minTenth ? `${selectedDriveCriteria.minTenth}%` : "60%+"}</strong></div>
                                        <div>12th Percentage: <strong>{selectedDriveCriteria.minTwelfth ? `${selectedDriveCriteria.minTwelfth}%` : "60%+"}</strong></div>
                                        <div>Maximum Backlogs: <strong>{selectedDriveCriteria.maxBacklogs ?? 0}</strong></div>
                                        <div>Graduation Year: <strong>Batch {selectedDriveCriteria.gradYear || 2026}</strong></div>
                                    </div>
                                    <div style={{ marginTop: "12px", fontSize: "13px", color: "#334155" }}>
                                        Required Skills: <strong>{Array.isArray(selectedDriveCriteria.requiredSkills) ? selectedDriveCriteria.requiredSkills.join(", ") : (selectedDriveCriteria.requiredSkills || "N/A")}</strong>
                                    </div>
                                </div>

                                {/* Status banner */}
                                <div style={{ backgroundColor: selectedDriveCriteria.statusTag === "Not Eligible" ? "#fef2f2" : (selectedDriveCriteria.statusTag === "Completed" ? "#f8fafc" : "#f0fdf4"), color: selectedDriveCriteria.statusTag === "Not Eligible" ? "#dc2626" : (selectedDriveCriteria.statusTag === "Completed" ? "#334155" : "#16a34a"), padding: "12px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", border: selectedDriveCriteria.statusTag === "Not Eligible" ? "1px solid #fecaca" : (selectedDriveCriteria.statusTag === "Completed" ? "1px solid #cbd5e1" : "1px solid #bbf7d0"), marginBottom: "20px" }}>
                                    {selectedDriveCriteria.statusTag === "Not Eligible" ? "🚫 Ineligible for this Drive" : (selectedDriveCriteria.statusTag === "Completed" ? "✓ Recruitment Drive Completed" : "✓ Fully Eligible to Opt-In for this Drive")}
                                </div>

                                {/* Your Response Opt-In / Opt-Out Buttons */}
                                <div style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "10px" }}>YOUR RESPONSE</div>
                                {selectedDriveCriteria.statusTag === "Not Eligible" ? (
                                    <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "14px", textAlign: "center", color: "#dc2626", fontWeight: "800", fontSize: "14px" }}>
                                        🚫 Ineligible (Response Locked 🔒)
                                    </div>
                                ) : selectedDriveCriteria.statusTag === "Completed" ? (
                                    <div style={{ backgroundColor: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "14px", textAlign: "center", color: "#475569", fontWeight: "800", fontSize: "14px" }}>
                                        ✓ Recruitment Drive Closed
                                    </div>
                                ) : selectedDriveCriteria.statusTag === "Opted-In" || isDriveOptedIn(selectedDriveCriteria) ? (
                                    <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "14px", textAlign: "center", color: "#16a34a", fontWeight: "800", fontSize: "14px" }}>
                                        ✓ Response Submitted: Opted-In
                                    </div>
                                ) : selectedDriveCriteria.statusTag === "Opted-Out" || isDriveOptedOut(selectedDriveCriteria) ? (
                                    <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "14px", textAlign: "center", color: "#dc2626", fontWeight: "800", fontSize: "14px" }}>
                                        🚫 Response Submitted: Opted-Out
                                    </div>
                                ) : (
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                        <button
                                            onClick={() => {
                                                handleApply(selectedDriveCriteria.id || "", selectedDriveCriteria.company, selectedDriveCriteria.role);
                                                setSelectedDriveCriteria(null);
                                            }}
                                            style={{
                                                padding: "12px",
                                                borderRadius: "10px",
                                                border: "none",
                                                backgroundColor: "#16a34a",
                                                color: "#ffffff",
                                                fontWeight: "800",
                                                fontSize: "14px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            Opt-In
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleOptOut(selectedDriveCriteria.id || "", selectedDriveCriteria.company, selectedDriveCriteria.role);
                                                setSelectedDriveCriteria(null);
                                            }}
                                            style={{
                                                padding: "12px",
                                                borderRadius: "10px",
                                                border: "none",
                                                backgroundColor: "#dc2626",
                                                color: "#ffffff",
                                                fontWeight: "800",
                                                fontSize: "14px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            Opt-Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL 2: Application & Company Details Modal */}
                {selectedApplicationModal && (
                    <div onClick={() => setSelectedApplicationModal(null)} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                        <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#ffffff", borderRadius: "18px", width: "min(900px, calc(100% - 24px))", maxHeight: "90vh", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column" }}>
                            {/* Modal Dark Header */}
                            <div style={{ backgroundColor: "#0f172a", color: "#ffffff", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <h3 style={{ margin: "0 0 2px 0", fontSize: "17px", fontWeight: "800", color: "#ffffff" }}>
                                        {selectedApplicationModal.company} — Application Details
                                    </h3>
                                    <div style={{ fontSize: "13px", color: "#38bdf8", fontWeight: "700" }}>
                                        {selectedApplicationModal.role}
                                    </div>
                                </div>
                                <button onClick={() => setSelectedApplicationModal(null)} style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "#ffffff", cursor: "pointer", fontSize: "16px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    ✕
                                </button>
                            </div>

                            {/* Modal Body with Scrollable Area */}
                            <div style={{ padding: "24px", maxHeight: "calc(90vh - 80px)", overflowY: "auto" }}>
                                {/* JOB OVERVIEW */}
                                <div style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "8px" }}>JOB OVERVIEW & PACKAGE</div>
                                <div style={{ backgroundColor: "#f8fafc", borderRadius: "10px", padding: "14px", border: "1px solid #f1f5f9", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", marginBottom: "20px" }}>
                                    <div>Company: <strong>{selectedApplicationModal.company}</strong></div>
                                    <div>Job Role: <strong>{selectedApplicationModal.role}</strong></div>
                                    <div>Package (CTC): <strong style={{ color: "#16a34a" }}>{selectedApplicationModal.package}</strong></div>
                                    <div>Current Status: <strong style={{ color: selectedApplicationModal.currentWorkflowStage === "Not Shortlisted" ? "#dc2626" : "#2563eb" }}>{selectedApplicationModal.currentWorkflowStage || "Under Review"}</strong></div>
                                </div>

                                {/* ELIGIBILITY EVALUATION CHECKLIST */}
                                <div style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "8px" }}>ELIGIBILITY EVALUATION CHECKLIST</div>
                                <div style={{ backgroundColor: "#f8fafc", borderRadius: "10px", padding: "14px", border: "1px solid #f1f5f9", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", marginBottom: "20px" }}>
                                    <div>Eligible Depts: <strong>{selectedApplicationModal.dept}</strong></div>
                                    <div>Minimum CGPA: <strong>{selectedApplicationModal.minCgpa}</strong></div>
                                    <div>10th Percentage: <strong>{selectedApplicationModal.tenth}</strong></div>
                                    <div>12th Percentage: <strong>{selectedApplicationModal.twelfth}</strong></div>
                                    <div>Max Backlogs: <strong>{selectedApplicationModal.backlogs}</strong></div>
                                    <div>Graduation Year: <strong>{selectedApplicationModal.gradYear}</strong></div>
                                </div>

                                {/* RECRUITMENT ROUNDS & SCHEDULE */}
                                <div style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "10px" }}>📋 RECRUITMENT ROUNDS & SCHEDULE</div>

                                {/* Desktop View Table */}
                                <div className="desktop-rounds-table" style={{ width: "100%", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left", tableLayout: "fixed" }}>
                                        <thead>
                                            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                                <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: "700", width: "12%" }}>Round</th>
                                                <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: "700", width: "36%" }}>Round Name</th>
                                                <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: "700", width: "15%" }}>Date</th>
                                                <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: "700", width: "21%" }}>Mode / Venue</th>
                                                <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: "700", width: "16%", textAlign: "center" }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedApplicationModal.rounds?.map((r: any, rIdx: number) => {
                                                const isCleared = r.status?.includes("Cleared") || r.status?.includes("Passed");
                                                const isFailed = r.status?.includes("Not Shortlisted") || r.status?.includes("Failed");
                                                return (
                                                    <tr key={rIdx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                        <td style={{ padding: "10px 12px", fontWeight: "800", color: isCleared ? "#16a34a" : (isFailed ? "#dc2626" : "#0f172a") }}>{r.round}</td>
                                                        <td style={{ padding: "10px 12px", fontWeight: "700", color: isCleared ? "#16a34a" : (isFailed ? "#dc2626" : "#334155") }}>{r.name}</td>
                                                        <td style={{ padding: "10px 12px", color: "#64748b" }}>{r.date}</td>
                                                        <td style={{ padding: "10px 12px", color: "#64748b" }}>{r.mode}</td>
                                                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                                                            <span style={{
                                                                padding: "2px 8px",
                                                                borderRadius: "10px",
                                                                fontSize: "10px",
                                                                fontWeight: "700",
                                                                width: "100%",
                                                                maxWidth: "100px",
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                textAlign: "center",
                                                                backgroundColor: isCleared ? "#dcfce7" : (isFailed ? "#fef2f2" : "#eff6ff"),
                                                                color: isCleared ? "#15803d" : (isFailed ? "#dc2626" : "#2563eb"),
                                                                border: `1px solid ${isCleared ? "#bbf7d0" : (isFailed ? "#fecaca" : "#bfdbfe")}`,
                                                                boxSizing: "border-box"
                                                            }}>
                                                                {r.status || "Cleared ✓"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile View Stacked Round Cards */}
                                <div className="mobile-rounds-cards">
                                    {selectedApplicationModal.rounds?.map((r: any, rIdx: number) => {
                                        const isCleared = r.status?.includes("Cleared") || r.status?.includes("Passed");
                                        const isFailed = r.status?.includes("Not Shortlisted") || r.status?.includes("Failed");
                                        return (
                                            <div key={rIdx} style={{ backgroundColor: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <span style={{ fontWeight: "800", fontSize: "12px", color: isCleared ? "#16a34a" : (isFailed ? "#dc2626" : "#0f172a") }}>{r.round}</span>
                                                    <span style={{
                                                        padding: "2px 8px",
                                                        borderRadius: "10px",
                                                        fontSize: "10px",
                                                        fontWeight: "700",
                                                        backgroundColor: isCleared ? "#dcfce7" : (isFailed ? "#fef2f2" : "#eff6ff"),
                                                        color: isCleared ? "#15803d" : (isFailed ? "#dc2626" : "#2563eb"),
                                                        border: `1px solid ${isCleared ? "#bbf7d0" : (isFailed ? "#fecaca" : "#bfdbfe")}`
                                                    }}>
                                                        {isCleared ? "🟢 Cleared" : (isFailed ? "🔴 Not Shortlisted" : "🔵 Scheduled")}
                                                    </span>
                                                </div>
                                                <div style={{ fontWeight: "700", fontSize: "13px", color: "#0f172a" }}>{r.name}</div>
                                                <div style={{ fontSize: "11px", color: "#64748b" }}>🗓 Date: <strong>{r.date}</strong></div>
                                                <div style={{ fontSize: "11px", color: "#64748b" }}>🏢 Venue / Mode: <strong>{r.mode}</strong></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL 3: Official Campus Recruitment Appointment & Offer Letter Modal */}
                {selectedOfferModal && (
                    <div onClick={() => setSelectedOfferModal(null)} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
                        <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#ffffff", borderRadius: "16px", width: "640px", maxWidth: "96%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}>
                            {/* Header */}
                            <div style={{ backgroundColor: "#0b1329", color: "#ffffff", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", color: "#0f172a", fontSize: "14px" }}>
                                        📜
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#ffffff" }}>{displayName}</h3>
                                        <div style={{ fontSize: "12px", color: "#93c5fd", fontWeight: "600" }}>{selectedOfferModal.company} • {selectedOfferModal.role}</div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedOfferModal(null)} style={{ width: "30px", height: "30px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.15)", border: "none", color: "#ffffff", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                            </div>

                            {/* Modal Body: Letter Document */}
                            <div style={{ padding: "20px" }}>
                                <div style={{ border: "2px solid #0f172a", borderRadius: "12px", padding: "24px", backgroundColor: "#ffffff" }}>
                                    {/* Header Banner */}
                                    <div style={{ backgroundColor: "#0b1329", color: "#ffffff", borderRadius: "8px", padding: "14px", textAlign: "center", marginBottom: "20px" }}>
                                        <div style={{ fontWeight: "800", fontSize: "15px", letterSpacing: "1px" }}>COLLEGE PLACEMENT MANAGEMENT SYSTEM</div>
                                        <div style={{ fontSize: "11px", color: "#60a5fa", marginTop: "4px", fontWeight: "700", letterSpacing: "0.5px" }}>OFFICIAL CAMPUS RECRUITMENT APPOINTMENT & OFFER LETTER</div>
                                    </div>

                                    {/* Reference & Date */}
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#475569", fontWeight: "700", marginBottom: "16px" }}>
                                        <div>Ref No: <strong>{selectedOfferModal.refNo || "CPMS/OFFER/2026/SEL-002"}</strong></div>
                                        <div>Date of Issue: <strong>{selectedOfferModal.date}</strong></div>
                                    </div>

                                    {/* Candidate Info */}
                                    <div style={{ fontSize: "13px", color: "#0f172a", marginBottom: "16px", lineHeight: "1.6" }}>
                                        <div style={{ fontWeight: "800", fontSize: "14px" }}>TO CANDIDATE: {displayName.toUpperCase()}</div>
                                        <div style={{ color: "#475569" }}>Register No: <strong>{user?.regNo || "22CSR025"}</strong> | Dept: <strong>Computer Science & Engineering</strong></div>
                                    </div>

                                    {/* Terms Summary Box */}
                                    <div style={{ backgroundColor: "#f8fafc", borderRadius: "10px", padding: "16px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
                                            APPOINTMENT TERMS SUMMARY
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
                                            <div>
                                                <span style={{ color: "#64748b", fontSize: "12px" }}>Hiring Company: </span>
                                                <strong style={{ color: "#2563eb" }}>{selectedOfferModal.company}</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: "#64748b", fontSize: "12px" }}>Position: </span>
                                                <strong>{selectedOfferModal.role}</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: "#64748b", fontSize: "12px" }}>Salary CTC: </span>
                                                <strong style={{ color: "#16a34a" }}>{selectedOfferModal.ctc || "₹12 LPA"}</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: "#64748b", fontSize: "12px" }}>Tentative Joining: </span>
                                                <strong>15 September 2026</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Signature */}
                                    <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px dashed #cbd5e1", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                        <div>
                                            <div style={{ fontFamily: "Georgia, serif", fontSize: "20px", fontWeight: "bold", fontStyle: "italic", color: "#1e3a8a", marginBottom: "4px" }}>
                                                K. Manimaran
                                            </div>
                                            <div style={{ fontWeight: "800", fontSize: "13px", color: "#0f172a" }}>Prof. K. Manimaran</div>
                                            <div style={{ fontSize: "11px", color: "#64748b" }}>Placement Officer & Head - TPO Cell</div>
                                        </div>

                                        <button
                                            onClick={() => handleDownloadPDF(selectedOfferModal)}
                                            style={{ backgroundColor: "#16a34a", color: "#ffffff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                                        >
                                            <span>📥 Download Official PDF Offer Letter</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Footer Sign-off tag */}
                                <div style={{ marginTop: "14px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ fontSize: "11px", fontWeight: "800", color: "#166534", letterSpacing: "0.5px" }}>OFFICIAL PLACEMENT DIRECTORATE SIGN-OFF</div>
                                    <div style={{ fontFamily: "Georgia, serif", fontWeight: "bold", fontStyle: "italic", color: "#166534", fontSize: "15px" }}>K. Manimaran</div>
                                </div>
                            </div>

                            {/* Modal Bottom Bar */}
                            <div style={{ padding: "14px 24px", backgroundColor: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>
                                    Current Status: <strong style={{ color: selectedOfferModal.accepted ? "#16a34a" : "#2563eb" }}>{selectedOfferModal.status}</strong>
                                </div>
                                <button
                                    onClick={() => setSelectedOfferModal(null)}
                                    style={{ backgroundColor: "#0f172a", color: "#ffffff", border: "none", padding: "8px 24px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL 4: Professional Interview Details Modal */}
                {selectedInterviewModal && (
                    <div onClick={() => setSelectedInterviewModal(null)} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
                        <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#ffffff", borderRadius: "16px", width: "580px", maxWidth: "96%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}>
                            {/* Header */}
                            <div style={{ backgroundColor: "#0b1329", color: "#ffffff", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "#ffffff", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <img src={selectedInterviewModal.logo || "/company-logos/default.png"} alt={selectedInterviewModal.company} onError={(e: any) => { e.target.style.display = "none"; }} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#ffffff" }}>{selectedInterviewModal.company}</h3>
                                        <div style={{ fontSize: "12px", color: "#60a5fa", fontWeight: "600" }}>{selectedInterviewModal.role}</div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedInterviewModal(null)} style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.15)", border: "none", color: "#ffffff", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                            </div>

                            {/* Modal Body */}
                            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
                                {/* Status Header Bar */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fafc", padding: "12px 16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>CURRENT INTERVIEW STATUS</div>
                                    {(() => {
                                        const st = (selectedInterviewModal.status || "").toLowerCase();
                                        let bBg = "#eff6ff";
                                        let bColor = "#2563eb";
                                        let bBorder = "#bfdbfe";
                                        let bLabel = "🟦 Scheduled";
                                        if (st === "today") { bBg = "#fffbeb"; bColor = "#d97706"; bBorder = "#fde68a"; bLabel = "🟠 Today"; }
                                        else if (st === "in_progress") { bBg = "#fef2f2"; bColor = "#dc2626"; bBorder = "#fecaca"; bLabel = "🔴 In Progress"; }
                                        else if (st === "rescheduled") { bBg = "#fffbeb"; bColor = "#d97706"; bBorder = "#fde68a"; bLabel = "🟠 Rescheduled"; }
                                        else if (st === "passed") { bBg = "#f0fdf4"; bColor = "#16a34a"; bBorder = "#bbf7d0"; bLabel = "🟢 Passed"; }
                                        else if (st === "failed") { bBg = "#fef2f2"; bColor = "#dc2626"; bBorder = "#fecaca"; bLabel = "🔴 Not Selected"; }
                                        else if (st === "cancelled") { bBg = "#f8fafc"; bColor = "#475569"; bBorder = "#cbd5e1"; bLabel = "⚫ Cancelled"; }

                                        return (
                                            <span style={{ backgroundColor: bBg, color: bColor, border: `1px solid ${bBorder}`, padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: "800" }}>
                                                {bLabel}
                                            </span>
                                        );
                                    })()}
                                </div>

                                {/* Details Grid */}
                                <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #f1f5f9", padding: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px", color: "#334155" }}>
                                    <div>
                                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", marginBottom: "2px" }}>Active Round</div>
                                        <strong style={{ color: "#0f172a" }}>{selectedInterviewModal.roundTitle}</strong>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", marginBottom: "2px" }}>Date & Time</div>
                                        <strong style={{ color: "#2563eb" }}>{selectedInterviewModal.date} • {selectedInterviewModal.time}</strong>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", marginBottom: "2px" }}>Interviewer Panel</div>
                                        <strong>{selectedInterviewModal.interviewer || "TPO Technical Panel"}</strong>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", marginBottom: "2px" }}>Mode & Location</div>
                                        <strong>{selectedInterviewModal.mode === "Offline" ? `Offline (${selectedInterviewModal.venue || "Placement Cell — Room 204"})` : `Online (${selectedInterviewModal.platform || "Web Platform"})`}</strong>
                                    </div>
                                </div>

                                {/* Rescheduled Warning Box */}
                                {selectedInterviewModal.status === "rescheduled" && (
                                    <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "12px", padding: "14px 16px", fontSize: "12px", color: "#92400e", lineHeight: "1.5" }}>
                                        <div style={{ fontWeight: "800", marginBottom: "4px" }}>🟠 Interview Rescheduled Notice</div>
                                        <div>Previous Schedule: <strong>{selectedInterviewModal.previousDate || "28 Aug 2026"} • {selectedInterviewModal.previousTime || "02:00 PM"}</strong></div>
                                        <div>Updated Schedule: <strong>{selectedInterviewModal.date} • {selectedInterviewModal.time}</strong></div>
                                        {selectedInterviewModal.rescheduleReason && <div>Reason: <em>{selectedInterviewModal.rescheduleReason}</em></div>}
                                    </div>
                                )}

                                {/* Cancelled Warning Box */}
                                {selectedInterviewModal.status === "cancelled" && (
                                    <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "14px 16px", fontSize: "12px", color: "#dc2626", lineHeight: "1.5" }}>
                                        <div style={{ fontWeight: "800", marginBottom: "4px" }}>🔴 Interview Session Cancelled</div>
                                        <div>Original Schedule: <strong>{selectedInterviewModal.date} • {selectedInterviewModal.time}</strong></div>
                                        {selectedInterviewModal.cancelReason && <div>Reason: <em>{selectedInterviewModal.cancelReason}</em></div>}
                                    </div>
                                )}

                                {/* Instructions List */}
                                {selectedInterviewModal.instructions && selectedInterviewModal.instructions.length > 0 && (
                                    <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0" }}>
                                        <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>INTERVIEW INSTRUCTIONS</div>
                                        <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "12.5px", color: "#334155", lineHeight: "1.6" }}>
                                            {selectedInterviewModal.instructions.map((inst: string, iIdx: number) => (
                                                <li key={iIdx}>{inst}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Recruitment Round Timeline */}
                                <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0" }}>
                                    <div style={{ fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>RECRUITMENT TIMELINE STAGES</div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        {(selectedInterviewModal.timeline && selectedInterviewModal.timeline.length > 0 ? selectedInterviewModal.timeline : [
                                            { round: "Round 1", title: "Online Assessment", date: selectedInterviewModal.date, status: "Passed" },
                                            { round: "Round 2", title: selectedInterviewModal.roundTitle, date: selectedInterviewModal.date, status: "Scheduled" }
                                        ]).map((stage: any, sIdx: number) => {
                                            const isDone = stage.status?.toLowerCase() === "passed" || stage.status?.toLowerCase() === "cleared";
                                            const isCurrent = stage.status?.toLowerCase() === "scheduled" || stage.status?.toLowerCase() === "today" || stage.status?.toLowerCase() === "rescheduled";
                                            return (
                                                <div key={sIdx} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px" }}>
                                                    <div style={{
                                                        width: "24px",
                                                        height: "24px",
                                                        borderRadius: "50%",
                                                        backgroundColor: isDone ? "#dcfce7" : (isCurrent ? "#eff6ff" : "#f1f5f9"),
                                                        color: isDone ? "#16a34a" : (isCurrent ? "#2563eb" : "#94a3b8"),
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontWeight: "800",
                                                        fontSize: "12px",
                                                        flexShrink: 0
                                                    }}>
                                                        {isDone ? "✓" : (isCurrent ? "●" : "○")}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: "700", color: "#0f172a" }}>{stage.round}: {stage.title}</div>
                                                        <div style={{ fontSize: "11px", color: "#64748b" }}>{stage.date}</div>
                                                    </div>
                                                    <span style={{
                                                        fontSize: "11px",
                                                        fontWeight: "700",
                                                        color: isDone ? "#16a34a" : (isCurrent ? "#2563eb" : "#94a3b8")
                                                    }}>
                                                        {stage.status}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Join Link */}
                                {selectedInterviewModal.status !== "cancelled" && (selectedInterviewModal.mode || "Online") === "Online" && selectedInterviewModal.meetingLink ? (
                                    <a
                                        href={selectedInterviewModal.meetingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            padding: "12px 0",
                                            borderRadius: "10px",
                                            backgroundColor: "#2563eb",
                                            color: "#ffffff",
                                            fontWeight: "800",
                                            fontSize: "14px",
                                            textAlign: "center",
                                            textDecoration: "none",
                                            boxSizing: "border-box"
                                        }}
                                    >
                                        🌐 Join Interview Platform
                                    </a>
                                ) : null}
                            </div>

                            {/* Footer */}
                            <div style={{ padding: "14px 24px", backgroundColor: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "flex-end" }}>
                                <button onClick={() => setSelectedInterviewModal(null)} style={{ backgroundColor: "#0f172a", color: "#ffffff", border: "none", padding: "8px 24px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Mobile App Bottom Navigation Bar Dock */}
            <nav className="mobile-bottom-nav">
                <button
                    onClick={() => setCurrentTab("dashboard")}
                    className={`mobile-tab-item ${currentTab === "dashboard" ? "active" : ""}`}
                >
                    <div className="tab-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5M4 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4z" /></svg>
                    </div>
                    <span>Home</span>
                </button>
                <button
                    onClick={() => setCurrentTab("companies")}
                    className={`mobile-tab-item ${currentTab === "companies" ? "active" : ""}`}
                >
                    <div className="tab-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 7v14M21 7v14M6 10h4M6 14h4M6 18h4M14 10h4M14 14h4M14 18h4M9 3h6v4H9z" /></svg>
                    </div>
                    <span>Drives</span>
                </button>
                <button
                    onClick={() => setCurrentTab("applications")}
                    className={`mobile-tab-item ${currentTab === "applications" ? "active" : ""}`}
                >
                    <div className="tab-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
                    </div>
                    <span>Apps</span>
                </button>

                <button
                    onClick={() => setCurrentTab("profile")}
                    className={`mobile-tab-item ${currentTab === "profile" ? "active" : ""}`}
                >
                    <div className="tab-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </div>
                    <span>Profile</span>
                </button>
            </nav>
        </div>
    );
};

export default StudentDashboard;
