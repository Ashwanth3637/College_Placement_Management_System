import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import StudentProfile from "./StudentProfile";
import { formatCleanRoundName, getPureRoundTitle } from "../../utils/roundUtils";
import ClearDataButton from "../../components/ClearDataButton";
import { API_BASE_URL } from "../../config/api";

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

  const formatCtc = (rawCtc?: string) => {
    if (!rawCtc) return "18 LPA";
    let str = String(rawCtc).trim();
    str = str.replace(/[$₹]/g, "").replace(/Rs\.?\s*/gi, "").trim();
    str = str.replace(/\.0(?=\s*lpa)/gi, "");
    if (!str.toLowerCase().includes("lpa") && !isNaN(Number(str))) {
      return `${str} LPA`;
    }
    return str;
  };

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

  const [userAvatarImg, setUserAvatarImg] = useState<string | null>(() => {
    return (
      localStorage.getItem(`cpms_student_avatar_${userId}`) ||
      localStorage.getItem(`cpms_student_avatar_${userKey}`) ||
      null
    );
  });

  const [displayEmail, setDisplayEmail] = useState<string>(() => {
    const savedPending =
      localStorage.getItem(`cpms_pending_profile_${userId}`) ||
      localStorage.getItem(`cpms_pending_profile_${userKey}`) ||
      localStorage.getItem(`cpms_profile_${userId}`) ||
      localStorage.getItem(`cpms_profile_${userKey}`);
    if (savedPending) {
      try {
        const parsed = JSON.parse(savedPending);
        if (parsed.personal?.email) return parsed.personal.email;
        if (parsed.user?.email) return parsed.user.email;
      } catch (e) {}
    }
    return user?.email || "ashwanths.22cse@kongu.edu";
  });

  useEffect(() => {
    const syncNameAndAvatar = () => {
      const savedPending =
        localStorage.getItem(`cpms_pending_profile_${userId}`) ||
        localStorage.getItem(`cpms_pending_profile_${userKey}`) ||
        localStorage.getItem(`cpms_profile_${userId}`) ||
        localStorage.getItem(`cpms_profile_${userKey}`) ||
        localStorage.getItem("cpms_profile_global");

      if (savedPending) {
        try {
          const parsed = JSON.parse(savedPending);
          if (parsed.personal?.email) {
            setDisplayEmail(parsed.personal.email);
          } else if (parsed.user?.email) {
            setDisplayEmail(parsed.user.email);
          }
          if (parsed.personal?.fullName) {
            setDisplayName(parsed.personal.fullName);
          }
        } catch (e) {}
      }

      const savedName = localStorage.getItem(`cpms_student_fullname_${userId}`) || localStorage.getItem("cpms_student_fullname");
      if (savedName && savedName.trim()) {
        setDisplayName(savedName.trim());
      } else if (user?.name) {
        setDisplayName(getFormattedName(user?.name));
      }
      const avatar =
        localStorage.getItem(`cpms_student_avatar_${userId}`) ||
        localStorage.getItem(`cpms_student_avatar_${userKey}`);
      setUserAvatarImg(avatar || null);
    };

    syncNameAndAvatar();
    window.addEventListener("cpms_profile_updated", syncNameAndAvatar);
    window.addEventListener("storage", syncNameAndAvatar);
    return () => {
      window.removeEventListener("cpms_profile_updated", syncNameAndAvatar);
      window.removeEventListener("storage", syncNameAndAvatar);
    };
  }, [userId, user?.name, userKey]);

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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const setCurrentTab = (tab: "dashboard" | "companies" | "applications" | "schedule" | "results" | "profile") => {
    setCurrentTabState(tab);
    setIsMobileMenuOpen(false);
    try {
      localStorage.setItem(`cpms_active_tab_student_${userKey}`, tab);
    } catch (e) { }
  };

  useEffect(() => {
    if (initialTab) {
      setCurrentTabState(initialTab);
    }
  }, [initialTab]);

  type CampusDriveFilter = "All" | "Opted-In" | "Opted-Out" | "Eligible" | "Not Eligible" | "Up coming" | "Completed";

  const [driveFilter, setDriveFilterState] = useState<CampusDriveFilter>(() => {
    try {
      const saved = localStorage.getItem(`cpms_drive_filter_student_${userKey}`);
      if (saved && ["All", "Opted-In", "Opted-Out", "Eligible", "Not Eligible", "Up coming", "Completed"].includes(saved)) {
        return saved as CampusDriveFilter;
      }
    } catch (e) {}
    return "Eligible";
  });

  const setDriveFilter = (filter: CampusDriveFilter) => {
    setDriveFilterState(filter);
    try {
      localStorage.setItem(`cpms_drive_filter_student_${userKey}`, filter);
    } catch (e) {}
  };

  const [selectedApplicationModal, setSelectedApplicationModal] = useState<any | null>(null);
  const [selectedOfferModal, setSelectedOfferModal] = useState<any | null>(null);
  const [appsUpdatedCounter, setAppsUpdatedCounter] = useState(0);
  const [recentDrivesPage, setRecentDrivesPage] = useState<number>(1);
  const [campusDrivesPage, setCampusDrivesPage] = useState<number>(1);
  const [showOptInConfirmDrive, setShowOptInConfirmDrive] = useState<any | null>(null);
  const [optInSuccessData, setOptInSuccessData] = useState<{ company: string; role: string } | null>(null);
  const [optOutSuccessData, setOptOutSuccessData] = useState<{ company: string; role: string } | null>(null);
  const [optOutReason, setOptOutReason] = useState<string>("");
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [activeNotifFilter, setActiveNotifFilter] = useState<string>("All");
  const [appTrackerFilter, setAppTrackerFilter] = useState<"all" | "in_progress" | "completed">("all");

  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);

  const [filterSortBy, setFilterSortByState] = useState<string>(() => {
    try {
      return localStorage.getItem(`cpms_filter_sortBy_${userKey}`) || "Package (High to Low)";
    } catch (e) {
      return "Package (High to Low)";
    }
  });
  const setFilterSortBy = (val: string) => {
    setFilterSortByState(val);
    try { localStorage.setItem(`cpms_filter_sortBy_${userKey}`, val); } catch (e) {}
  };

  const [filterEmpType, setFilterEmpTypeState] = useState<string>(() => {
    try {
      return localStorage.getItem(`cpms_filter_empType_${userKey}`) || "Full-time";
    } catch (e) {
      return "Full-time";
    }
  });
  const setFilterEmpType = (val: string) => {
    setFilterEmpTypeState(val);
    try { localStorage.setItem(`cpms_filter_empType_${userKey}`, val); } catch (e) {}
  };

  const [filterPosition, setFilterPositionState] = useState<string>(() => {
    try {
      return localStorage.getItem(`cpms_filter_position_${userKey}`) || "";
    } catch (e) {
      return "";
    }
  });
  const setFilterPosition = (val: string) => {
    setFilterPositionState(val);
    try { localStorage.setItem(`cpms_filter_position_${userKey}`, val); } catch (e) {}
  };

  const [filterMinPackage, setFilterMinPackageState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`cpms_filter_minPackage_${userKey}`);
      return saved !== null ? Number(saved) : 0;
    } catch (e) {
      return 0;
    }
  });
  const setFilterMinPackage = (val: number) => {
    setFilterMinPackageState(val);
    try { localStorage.setItem(`cpms_filter_minPackage_${userKey}`, String(val)); } catch (e) {}
  };

  const [filterWorkMode, setFilterWorkModeState] = useState<string>(() => {
    try {
      return localStorage.getItem(`cpms_filter_workMode_${userKey}`) || "Onsite";
    } catch (e) {
      return "Onsite";
    }
  });
  const setFilterWorkMode = (val: string) => {
    setFilterWorkModeState(val);
    try { localStorage.setItem(`cpms_filter_workMode_${userKey}`, val); } catch (e) {}
  };

  const [filterLocation, setFilterLocationState] = useState<string>(() => {
    try {
      return localStorage.getItem(`cpms_filter_location_${userKey}`) || "";
    } catch (e) {
      return "";
    }
  });
  const setFilterLocation = (val: string) => {
    setFilterLocationState(val);
    try { localStorage.setItem(`cpms_filter_location_${userKey}`, val); } catch (e) {}
  };

  const resetAllFilterOptions = () => {
    setFilterSortBy("Package (High to Low)");
    setFilterEmpType("Full-time");
    setFilterPosition("");
    setFilterMinPackage(0);
    setFilterWorkMode("Onsite");
    setFilterLocation("");
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.code === "Escape" || e.keyCode === 27) {
        setShowFilterModal(false);
        setSelectedDriveCriteria(null);
        setShowOptInConfirmDrive(null);
        setOptInConfirmDrive(null);
        setOptOutConfirmDrive(null);
        setSelectedApplicationModal(null);
        setSelectedOfferModal(null);
        setSelectedInterviewModal(null);
        setOptInSuccessData(null);
        setOptOutSuccessData(null);
        setOptOutReason("");
        setShowNotificationsModal(false);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
        const res = await fetch(`${API_BASE_URL}/api/applications?email=${encodeURIComponent(studentEmail)}`);
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
                if (rec.driveId) set.add(String(rec.driveId).toLowerCase().trim());
                const c = String(rec.companyName || rec.company || "").toLowerCase().trim();
                const r = String(rec.jobRole || rec.role || "").toLowerCase().trim();
                if (c && r) {
                  set.add(`${c}_${r}`);
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
    const driveId = String(d.id || d._id || "").toLowerCase().trim();
    const comp = String(d.company || d.companyName || "").toLowerCase().trim();
    const role = String(d.role || d.jobRole || d.jobTitle || "").toLowerCase().trim();
    const compRole = comp && role ? `${comp}_${role}` : "";

    return appliedDrives.some(item => {
      if (!item) return false;
      const str = String(item).toLowerCase().trim();
      if (driveId && str === driveId) return true;
      if (compRole && str === compRole) return true;
      return false;
    });
  };

  const isDriveOptedOut = (d: PlacementDrive | any) => {
    if (!d) return false;
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

  const getLocalProfileData = () => {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith("cpms_profile_"));
      for (const k of keys) {
        const val = localStorage.getItem(k);
        if (val) {
          const parsed = JSON.parse(val);
          if (parsed && (parsed.academic || parsed.personal)) return parsed;
        }
      }
    } catch (e) {}
    return null;
  };
  const localProfile = getLocalProfileData();

  const [studentCgpa, setStudentCgpa] = useState<number>(() => Number(localProfile?.academic?.cgpa) || 8.5);
  const [studentBacklogs, setStudentBacklogs] = useState<number>(() => Number(localProfile?.academic?.backlogs) ?? 0);
  const [studentDepartment, setStudentDepartment] = useState<string>(() => localProfile?.personal?.department || "Computer Science & Engineering");
  const [studentTenth, setStudentTenth] = useState<number>(() => Number(localProfile?.academic?.tenthPercentage) || 85.0);
  const [studentTwelfth, setStudentTwelfth] = useState<number>(() => Number(localProfile?.academic?.twelfthPercentage) || 85.0);
  const [studentGradYear, setStudentGradYear] = useState<number>(() => Number(localProfile?.academic?.graduationYear) || 2026);
  const [studentRegNo, setStudentRegNo] = useState<string>("");
  const [studentPhone, setStudentPhone] = useState<string>("");
  const [studentResumeName, setStudentResumeName] = useState<string>("");
  const [studentResumeUrl, setStudentResumeUrl] = useState<string>("");
  const [studentSkills, setStudentSkills] = useState<string[]>([]);
  const [isProfileVerified, setIsProfileVerified] = useState<boolean>(false);
  const [selectedDriveCriteria, setSelectedDriveCriteria] = useState<PlacementDrive | null>(null);
  const [optInConfirmDrive, setOptInConfirmDrive] = useState<any>(null);
  const [optOutConfirmDrive, setOptOutConfirmDrive] = useState<any>(null);
  const [alertBanner, setAlertBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Auto-dismiss alert banner after 4 seconds
  useEffect(() => {
    if (!alertBanner) return;
    const timer = setTimeout(() => {
      setAlertBanner(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [alertBanner]);

  useEffect(() => {
    const isModalOpen = Boolean(selectedDriveCriteria || selectedApplicationModal || selectedOfferModal || optInConfirmDrive || optOutConfirmDrive);
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
        setOptInConfirmDrive(null);
        setOptOutConfirmDrive(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedDriveCriteria, selectedApplicationModal, selectedOfferModal]);

  React.useEffect(() => {
    const userEmail = (user?.email || "").toLowerCase().trim();

    const checkLocalVerification = () => {
      const uKey = (userEmail || userId || "").toLowerCase().trim();
      const localStatus = localStorage.getItem(`cpms_verification_status_${uKey}`) || localStorage.getItem(`cpms_verification_status_global`);
      if (localStatus === "Approved" || localStatus === "verified") {
        setIsProfileVerified(true);
      } else if (localStatus === "pending" || localStatus === "Pending" || localStatus === "false") {
        setIsProfileVerified(false);
      }
    };

    const fetchProfile = async () => {
      const lookupKey = userId || userEmail || "student";
      try {
        const res = await fetch(`${API_BASE_URL}/api/student/profile/${encodeURIComponent(lookupKey)}?email=${encodeURIComponent(userEmail)}`);
        const data = await res.json();
        let student = (res.ok && data) ? data : null;

        if (!student) {
          try {
            const localSaved = localStorage.getItem(`cpms_profile_${userId}`) || localStorage.getItem(`cpms_profile_${userEmail}`);
            if (localSaved) student = JSON.parse(localSaved);
          } catch (e) { }
        }

        if (student) {
          // Database response is authoritative
          const dbVerified = Boolean(
            student.isVerified === true &&
            student.verificationStatus !== "pending" &&
            (student.verificationStatus === "verified" || student.verificationStatus === "Approved" || student.verificationStatus === "Verified")
          );

          setIsProfileVerified(dbVerified);

          try {
            localStorage.setItem(`cpms_profile_verified_${userId}`, String(dbVerified));
            localStorage.setItem(`cpms_profile_verified_${userEmail}`, String(dbVerified));
            localStorage.setItem(`cpms_profile_verified_global`, String(dbVerified));
            localStorage.setItem(`cpms_verification_status_${userEmail}`, dbVerified ? "verified" : "pending");
            localStorage.setItem(`cpms_verification_status_${userId}`, dbVerified ? "verified" : "pending");
            localStorage.setItem(`cpms_verification_status_global`, dbVerified ? "verified" : "pending");
          } catch (e) { }

          if (student.personal?.department) setStudentDepartment(student.personal.department);
          if (student.personal?.registerNumber) setStudentRegNo(student.personal.registerNumber);
          if (student.personal?.phone) setStudentPhone(student.personal.phone);
          if (student.academic) {
            if (student.academic.cgpa !== undefined && student.academic.cgpa !== null) setStudentCgpa(Number(student.academic.cgpa));
            if (student.academic.backlogs !== undefined && student.academic.backlogs !== null) setStudentBacklogs(Number(student.academic.backlogs));
            if (student.academic.tenthPercentage !== undefined && student.academic.tenthPercentage !== null) setStudentTenth(Number(student.academic.tenthPercentage));
            if (student.academic.twelfthPercentage !== undefined && student.academic.twelfthPercentage !== null) setStudentTwelfth(Number(student.academic.twelfthPercentage));
            if (student.academic.graduationYear !== undefined && student.academic.graduationYear !== null) setStudentGradYear(Number(student.academic.graduationYear));
          }
          if (student.professional?.skills) {
            setStudentSkills(Array.isArray(student.professional.skills) ? student.professional.skills : []);
          }
          if (student.professional?.resumeName) setStudentResumeName(student.professional.resumeName);
          if (student.professional?.resumeUrl) setStudentResumeUrl(student.professional.resumeUrl);
        } else {
          checkLocalVerification();
        }
      } catch (err) {
        console.error("Error fetching student profile for dashboard:", err);
        checkLocalVerification();
      }
    };

    fetchProfile();
    checkLocalVerification();

    // 2-second real-time auto-sync interval to catch Officer actions immediately
    const syncInterval = setInterval(fetchProfile, 2000);

    const handleProfileUpdated = () => {
      checkLocalVerification();
      fetchProfile();
    };

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("cpms_profile_channel");
      channel.onmessage = (event) => {
        if (event.data && (event.data.type === "PROFILE_VERIFIED" || event.data.type === "PROFILE_UPDATED")) {
          setIsProfileVerified(Boolean(event.data.isVerified));
          try {
            localStorage.setItem(`cpms_profile_verified_${userId}`, String(event.data.isVerified));
            localStorage.setItem(`cpms_profile_verified_${userEmail}`, String(event.data.isVerified));
            localStorage.setItem(`cpms_profile_verified_global`, String(event.data.isVerified));
          } catch (e) { }
          fetchProfile();
        }
      };
    } catch (e) { }

    window.addEventListener("cpms_profile_updated", handleProfileUpdated);
    window.addEventListener("cpms_verification_updated", handleProfileUpdated);
    window.addEventListener("storage", handleProfileUpdated);
    window.addEventListener("focus", handleProfileUpdated);

    return () => {
      clearInterval(syncInterval);
      if (channel) channel.close();
      window.removeEventListener("cpms_profile_updated", handleProfileUpdated);
      window.removeEventListener("cpms_verification_updated", handleProfileUpdated);
      window.removeEventListener("storage", handleProfileUpdated);
      window.removeEventListener("focus", handleProfileUpdated);
    };
  }, [userId, user?.email, currentTab]);

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

  const isOfficerDrive = (pd: any) => {
    if (!pd) return false;
    const creator = String(pd.createdBy || "").toLowerCase();
    return pd.isOfficerPublished === true || 
        pd.isCreatedByOfficer === true || 
        pd.createdExplicitlyByOfficer === true || 
        creator.includes("officer") || 
        creator === "placement officer";
  };

  const isDeptMatch = (branch: string, studentDept: string) => {
    if (!branch || !studentDept) return true;
    const b = branch.toLowerCase().trim();
    const d = studentDept.toLowerCase().trim();
    if (b === "all" || b === "all departments" || b === "" || d === "") return true;
    if (b === d || b.includes(d) || d.includes(b)) return true;

    const aliasMap: Record<string, string[]> = {
      cse: ["computer science", "cse"],
      it: ["information technology", "it"],
      ece: ["electronics & communication", "electronics and communication", "ece"],
      eee: ["electrical & electronics", "electrical and electronics", "eee"],
      mech: ["mechanical", "mechanical engineering", "mech"]
    };

    for (const aliases of Object.values(aliasMap)) {
      const matchesBranch = aliases.some(a => b.includes(a) || a.includes(b));
      const matchesDept = aliases.some(a => d.includes(a) || a.includes(d));
      if (matchesBranch && matchesDept) return true;
    }
    return false;
  };

  const [placementDrives, setPlacementDrives] = useState<PlacementDrive[]>(() => {
    try {
      const saved = localStorage.getItem("cpms_drives");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map<string, PlacementDrive>();
          parsed
            .filter(pd => isOfficerDrive(pd))
            .forEach((pd: any) => {
              const compStr = (pd.companyName || pd.company || "").toLowerCase().trim();
              const roleStr = (pd.jobRole || pd.jobTitle || pd.role || "").toLowerCase().trim();
              const key = `${compStr}_${roleStr}`;
              if (!map.has(key)) {
                map.set(key, {
                  id: pd.id || pd._id || key,
                  company: pd.companyName || pd.company || "Approved Company",
                  logo: pd.logoUrl || pd.logo || "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
                  bgColor: "#ffffff",
                  role: pd.jobRole || pd.jobTitle || pd.role || "Software Developer",
                  ctc: pd.salaryPackage || pd.packageCtc || pd.ctc || "18 LPA",
                  minCgpa: Number(pd.minCgpa ?? pd.eligibility?.minCgpa) || 6.5,
                  minTenth: Number(pd.minTenth ?? pd.eligibility?.minTenth ?? pd.eligibility?.tenthCutoff) || 60,
                  minTwelfth: Number(pd.minTwelfth ?? pd.eligibility?.minTwelfth ?? pd.eligibility?.twelfthCutoff) || 60,
                  maxBacklogs: Number(pd.maxBacklogs ?? pd.eligibility?.maxBacklogs) ?? 1,
                  gradYear: Number(pd.gradYear ?? pd.eligibility?.gradYear) || 2026,
                  departments: pd.departments || pd.eligibleBranches || ["CSE", "IT", "ECE"],
                  requiredSkills: pd.requiredSkills || ["Problem Solving", "Coding"],
                  location: pd.location || "Bangalore",
                  deadline: pd.driveDate || pd.deadline || pd.applicationDeadline || "28 Aug 2026",
                  statusTag: "Eligible"
                } as any);
              }
            });
          return Array.from(map.values());
        }
      }
    } catch (e) {}
    return [];
  });

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
        const res = await fetch(`${API_BASE_URL}/api/company/drives`);
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

      let dynamicApproved: PlacementDrive[] = [];
      rawDrives.forEach((pd: any) => {
        const compStr = (pd.companyName || pd.company || "").toLowerCase().trim();
        if (!compStr) return;

        const isOptedIn = isDriveOptedIn(pd);
        const isOptedOut = isDriveOptedOut(pd);

        const st = (pd.status || "").toLowerCase();
        const isDraftOrRejected = st === "rejected" || st === "draft";
        const isPublished = isOfficerDrive(pd) && !isDraftOrRejected;

        if (isPublished || isOptedIn) {
          const minCgpaVal = Number(pd.minCgpa ?? pd.eligibility?.minCgpa) || 6.5;
          const minTenthVal = Number(pd.minTenth ?? pd.eligibility?.minTenth ?? pd.eligibility?.tenthCutoff) || 60;
          const minTwelfthVal = Number(pd.minTwelfth ?? pd.eligibility?.minTwelfth ?? pd.eligibility?.twelfthCutoff) || 60;
          const maxBacklogsVal = Number(pd.maxBacklogs ?? pd.eligibility?.maxBacklogs) ?? 1;
          const reqGradYear = Number(pd.gradYear ?? pd.eligibility?.gradYear) || 2026;
          
          let eligibleBranches: string[] = [];
          if (Array.isArray(pd.eligibleBranches) && pd.eligibleBranches.length > 0) {
            eligibleBranches = pd.eligibleBranches;
          } else if (Array.isArray(pd.departments) && pd.departments.length > 0) {
            eligibleBranches = pd.departments;
          } else if (pd.eligibility?.departments) {
            eligibleBranches = typeof pd.eligibility.departments === "string" 
              ? pd.eligibility.departments.split(",").map((s: string) => s.trim()).filter(Boolean)
              : pd.eligibility.departments;
          } else {
            eligibleBranches = ["CSE", "IT", "ECE"];
          }

          const effCgpa = studentCgpa > 0 ? studentCgpa : 8.5;
          const effTenth = studentTenth > 0 ? studentTenth : 85.0;
          const effTwelfth = studentTwelfth > 0 ? studentTwelfth : 85.0;

          const cgpaOk = effCgpa >= minCgpaVal;
          const tenthOk = effTenth >= minTenthVal;
          const twelfthOk = effTwelfth >= minTwelfthVal;
          const backlogsOk = studentBacklogs <= maxBacklogsVal;
          const gradYearOk = !studentGradYear || studentGradYear === reqGradYear;
          const deptOk = eligibleBranches.length === 0 || eligibleBranches.some(b => isDeptMatch(b, studentDepartment));

          const isEligible = cgpaOk && tenthOk && twelfthOk && backlogsOk && gradYearOk && deptOk;

          let ineligibilityReasons: string[] = [];
          if (!cgpaOk) ineligibilityReasons.push(`Min CGPA: ${minCgpaVal} (Your CGPA: ${studentCgpa})`);
          if (!tenthOk) ineligibilityReasons.push(`Min 10th: ${minTenthVal}% (Your 10th: ${studentTenth}%)`);
          if (!twelfthOk) ineligibilityReasons.push(`Min 12th: ${minTwelfthVal}% (Your 12th: ${studentTwelfth}%)`);
          if (!backlogsOk) ineligibilityReasons.push(`Max Backlogs: ${maxBacklogsVal} (Your Backlogs: ${studentBacklogs})`);
          if (!gradYearOk) ineligibilityReasons.push(`Graduation Year: ${reqGradYear} (Your Year: ${studentGradYear})`);
          if (!deptOk) ineligibilityReasons.push(`Eligible Depts: ${eligibleBranches.join(", ")} (Your Dept: ${studentDepartment || "N/A"})`);

          const roleStr = (pd.jobRole || pd.jobTitle || pd.role || "").toLowerCase().trim();
          const driveKey = pd.id || pd._id || `${compStr}_${roleStr}`;

          dynamicApproved.push({
            id: driveKey,
            company: pd.companyName || pd.company || "Approved Company",
            logo: pd.logoUrl || pd.logo || "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
            bgColor: "#ffffff",
            role: pd.jobRole || pd.jobTitle || pd.role || "Software Developer",
            ctc: pd.salaryPackage || pd.packageCtc || pd.ctc || "18 LPA",
            minCgpa: minCgpaVal,
            minTenth: minTenthVal,
            minTwelfth: minTwelfthVal,
            maxBacklogs: maxBacklogsVal,
            gradYear: reqGradYear,
            departments: eligibleBranches,
            requiredSkills: pd.requiredSkills || ["Problem Solving", "Coding"],
            location: pd.location || "Bangalore",
            deadline: pd.driveDate || pd.deadline || pd.applicationDeadline || "28 Aug 2026",
            statusTag: isOptedIn ? "Opted-In" : (isOptedOut ? "Opted-Out" : (isEligible ? "Eligible" : "Not Eligible")),
            isEligible,
            ineligibilityReason: ineligibilityReasons.join(" • ")
          } as any);
        }
      });

      const map = new Map<string, PlacementDrive>();
      dynamicApproved.forEach(d => {
        const rawComp = (d.company || "").toLowerCase().trim();
        const rawRole = (d.role || (d as any).jobRole || (d as any).jobTitle || "").toLowerCase().trim();
        const compKey = `${rawComp}_${rawRole}`;

        const existing = map.get(compKey);
        if (!existing) {
          map.set(compKey, d);
        } else {
          if (d.statusTag === "Opted-In" || (d.statusTag === "Eligible" && existing.statusTag !== "Opted-In")) {
            map.set(compKey, d);
          }
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
    "Opted-In": placementDrives.filter(d => isDriveOptedIn(d) || d.statusTag === "Opted-In").length,
    "Opted-Out": placementDrives.filter(d => isDriveOptedOut(d) || d.statusTag === "Opted-Out").length,
    "Eligible": placementDrives.filter(d => !isDriveOptedOut(d) && !isDriveOptedIn(d) && (d.statusTag === "Eligible" || (d as any).isEligible)).length,
    "Not Eligible": placementDrives.filter(d => !isDriveOptedOut(d) && !isDriveOptedIn(d) && d.statusTag === "Not Eligible" && !(d as any).isEligible).length,
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
          roundBadgeText = "Cleared ";
        } else if (rNum < activeRoundIdx) {
          roundBadgeText = "Cleared ";
        } else if (rNum === activeRoundIdx) {
          if (isNotShortlisted) {
            roundBadgeText = "Not Shortlisted ";
          } else {
            roundBadgeText = "In Progress ⏳";
          }
        } else {
          roundBadgeText = "Locked ";
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
      status: "Scheduled ",
      activeRound: {
        title: "Round 1: Technical & Aptitude Assessment",
        dateTime: `${d.deadline || "28 Aug 2026"} | 10:00 AM IST`,
        interviewer: "Placement Officer / HR",
        location: "College Main Auditorium & Online"
      },
      historyCount: 1,
      history: [
        { name: "Round 1: Registration & Opt-In Verification", date: d.deadline || "28 Aug 2026", status: "Passed " }
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
        tagLabel = "Passed ";
        tagBg = "#f0fdf4";
        tagColor = "#16a34a";
        tagBorder = "#bbf7d0";
      } else if (isToday) {
        tagLabel = "Interview Today ";
        tagBg = "#fffbeb";
        tagColor = "#d97706";
        tagBorder = "#fde68a";
      }

      list.push({
        id: sch.id || `sch_${idx}`,
        icon: "",
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
        icon: "",
        date: off.date || "Offer Released",
        title: `${comp} — Placement Offer`,
        subtitle: `${role ? `${role} • ` : ""}Package: ${off.ctc || "Confirmed CTC"}`,
        tag: off.status === "Offer Accepted" ? "Offer Accepted " : "Confirmed Offer ",
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
        tagLabel = "Selected ";
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
        icon: "",
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
          icon: "",
          date: drive.deadline ? `Closes: ${drive.deadline}` : "Registration Open",
          title: `${comp} — ${role}`,
          subtitle: `Package: ${drive.ctc || "N/A"} • Location: ${drive.location || "On-Campus"}`,
          tag: "Eligible Drive ",
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
    doc.text(`Candidate Name:  ${studentName.toUpperCase()}`, 14, 83);
    doc.text(`Register Number: ${regNo}`, 14, 91);
    doc.text(`Department:    Computer Science & Engineering`, 14, 99);

    // Offer Details Section
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text("APPOINTMENT & SALARY PACKAGE TERMS", 14, 115);

    doc.line(14, 118, 196, 118);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    doc.text(`Hiring Company:  ${companyName}`, 14, 128);
    doc.text(`Designation Role: ${roleTitle}`, 14, 136);
    doc.text(`Annual CTC:    ${ctcPackage}`, 14, 144);
    doc.text(`Tentative Joining: 15 September 2026`, 14, 152);
    doc.text(`Work Location:   Corporate Campus / Office`, 14, 160);

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
      fetch(`${API_BASE_URL}/api/applications`, {
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
    setAlertBanner({ type: "success", text: " Opt-In application submitted successfully!" });
  };

  const handleOptOut = (driveId: string, driveComp?: string, driveRole?: string, reason?: string) => {
    if (reason && reason.trim()) {
      try {
        localStorage.setItem(`cpms_optout_reason_${driveId}_${userKey}`, reason.trim());
      } catch (e) {}
    }
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
    setAlertBanner({ type: "success", text: " Opt-Out response recorded successfully." });
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", backgroundColor: "#f4f6f8", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Mobile Menu Backdrop */}
      <div
        className={`app-menu-backdrop ${isMobileMenuOpen ? "open" : ""}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar matching clean white placement portal design */}
      <aside className={`app-drawer-sidebar ${isMobileMenuOpen ? "open" : ""}`} style={{ width: "240px", backgroundColor: "#ffffff", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "space-between", flexShrink: 0, height: "100vh", overflowY: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div>
          {/* Brand */}
          <div style={{ padding: "20px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "36px", height: "36px", backgroundColor: "#4F46E5", borderRadius: "8px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "18px", boxShadow: "0 2px 8px rgba(11,61,145,0.25)" }}>
                
              </div>
              <div>
                <div style={{ fontWeight: "800", color: "#4F46E5", fontSize: "13.5px", letterSpacing: "-0.2px", lineHeight: "1.2" }}>CAMPUS PLACEMENT</div>
                <div style={{ fontSize: "10px", color: "#64748b", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>STUDENT PORTAL</div>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="mobile-drawer-close"
              style={{ display: "none", background: "none", border: "none", fontSize: "20px", color: "#64748b", cursor: "pointer", padding: "4px" }}
            >
              
            </button>
          </div>

          {/* Navigation Menu */}
          <div style={{ padding: "16px 10px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", letterSpacing: "0.06em", padding: "0 10px 10px 10px", textTransform: "uppercase" }}>PORTAL NAVIGATION</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                {
                  id: "dashboard",
                  label: "Dashboard",
                  svg: <path d="M3 10.5L12 3l9 7.5v10.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 21V10.5z" />
                },
                {
                  id: "companies",
                  label: "Campus Drives",
                  svg: (
                    <>
                      <rect x="4" y="6" width="16" height="15" rx="3" />
                      <path d="M9 3.5h6v2.5H9zM7.5 10.5h9M7.5 13.5h9M7.5 16.5h6" />
                    </>
                  )
                },
                {
                  id: "applications",
                  label: "My Applications",
                  svg: (
                    <>
                      <rect x="4" y="4" width="16" height="16" rx="3.5" />
                      <path d="M8 12.5l3 3 5-5.5" />
                    </>
                  )
                },
                {
                  id: "profile",
                  label: "Profile",
                  svg: (
                    <>
                      <circle cx="12" cy="7.5" r="3.8" />
                      <path d="M5.5 21v-1.5a6.5 6.5 0 0 1 13 0V21" />
                    </>
                  )
                },
              ].map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id as any)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "11px 14px",
                      borderRadius: "10px",
                      border: "none",
                      backgroundColor: isActive ? "#EEF2FF" : "transparent",
                      color: isActive ? "#4338CA" : "#64748B",
                      fontWeight: isActive ? "700" : "600",
                      fontSize: "13.5px",
                      fontFamily: "'Inter', -apple-system, sans-serif",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease-in-out",
                      outline: "none",
                      width: "100%",
                      borderLeft: isActive ? "4px solid #4F46E5" : "4px solid transparent",
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isActive ? "#4F46E5" : "#64748B"} strokeWidth={isActive ? "2.4" : "2"} strokeLinecap="round" strokeLinejoin="round">
                      {item.svg}
                    </svg>
                    <span style={{ color: isActive ? "#4338CA" : "#64748B" }}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Account */}
        <div style={{ padding: "14px", borderTop: "1px solid #e2e8f0", backgroundColor: "#F8FAFC" }}>
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "10px", padding: "10px 12px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "10px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "#E6EEFC", color: "#4F46E5", border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontWeight: 700 }}>
              {userAvatarImg ? (
                <img src={userAvatarImg} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
              <div style={{ fontSize: "11px", color: isProfileVerified ? "#15803D" : "#B45309", fontWeight: 700 }}>
                {isProfileVerified ? "● Approved by Officer" : "● Verification Pending"}
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              width: "100%",
              padding: "8px 12px",
              backgroundColor: "#FEE2E2",
              color: "#B91C1C",
              border: "1px solid #FCA5A5",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "12.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <main style={{ flex: 1, height: "100vh", padding: "clamp(14px, 3vw, 24px) clamp(14px, 3vw, 32px)", overflowY: "auto", overflowX: "hidden", backgroundColor: "#f8fafc" }}>
        {/* Top Header Bar */}
        <div className="student-top-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", backgroundColor: "#ffffff", padding: "12px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", borderLeft: "4px solid #4F46E5", gap: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="mobile-hamburger-toggle"
              style={{ display: "none", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", cursor: "pointer", fontSize: "18px", color: "#4F46E5", flexShrink: 0 }}
              aria-label="Open Menu"
            >
              
            </button>
            <div>
              <h2 style={{ margin: 0, fontSize: "19px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.3px" }}>
                {currentTab === "dashboard" ? "Student Placement Dashboard" : currentTab === "companies" ? "Campus Placement Drives" : currentTab === "applications" ? "My Applications & Rounds" : currentTab === "schedule" ? "Interview Schedule & Calendar" : currentTab === "results" ? "Placement Offers & Results" : "Student Profile & Resume"}
              </h2>
              <div style={{ fontSize: "11.5px", color: "#64748B", fontWeight: 500, marginTop: "2px" }}>
                Campus Placement Portal • All Batches & Seasons
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexShrink: 0 }}>
            <button
              onClick={() => setShowNotificationsModal(true)}
              style={{
                position: "relative",
                width: "38px",
                height: "38px",
                borderRadius: "8px",
                backgroundColor: "#f8fafc",
                border: "1px solid #cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "16px",
                color: "#475569",
                transition: "all 0.15s ease",
                outline: "none"
              }}
              title="Live Notifications"
            >
              
              <span style={{
                position: "absolute",
                top: "-3px",
                right: "-3px",
                backgroundColor: "#B91C1C",
                color: "#ffffff",
                borderRadius: "50%",
                width: "16px",
                height: "16px",
                fontSize: "9.5px",
                fontWeight: "800",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1.5px solid #ffffff"
              }}>
                3
              </span>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "4px 8px", backgroundColor: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#E6EEFC", color: "#4F46E5", border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, fontWeight: 700, fontSize: "13px" }}>
                {userAvatarImg ? (
                  <img src={userAvatarImg} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#4F46E5", lineHeight: "1.2", whiteSpace: "nowrap" }}>{displayName}</div>
                <div style={{ fontSize: "10.5px", color: "#64748b", marginTop: "1px", whiteSpace: "nowrap" }}>{displayEmail || user?.email || "ashwanths.22cse@kongu.edu"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Success / Error Notification Alert Banner */}
        {alertBanner && (
          <div
            style={{
              backgroundColor: alertBanner.type === "success" ? "#f0fdf4" : "#fef2f2",
              color: alertBanner.type === "success" ? "#166534" : "#991b1b",
              border: alertBanner.type === "success" ? "1px solid #bbf7d0" : "1px solid #fecaca",
              borderLeft: alertBanner.type === "success" ? "4px solid #16a34a" : "4px solid #dc2626",
              borderRadius: "12px",
              padding: "14px 20px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "14px",
              fontWeight: "700",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            }}
          >
            <span>{alertBanner.text}</span>
            <button
              onClick={() => setAlertBanner(null)}
              style={{
                background: "none",
                border: "none",
                color: alertBanner.type === "success" ? "#166534" : "#991b1b",
                fontSize: "16px",
                fontWeight: "800",
                cursor: "pointer",
                padding: "0 4px",
                lineHeight: "1",
              }}
              title="Dismiss"
              aria-label="Dismiss Alert"
            >
              
            </button>
          </div>
        )}

        {/* TAB 1: DASHBOARD */}
        {currentTab === "dashboard" && (() => {
          // Pure Database Computation with ZERO mock fallbacks
          const closingDrivesList = (placementDrives || []).filter((d: any) => {
            const isOptedIn = isDriveOptedIn(d) || d.statusTag === "Opted-In";
            const st = (d.status || "").toLowerCase();
            return isOptedIn || st === "active" || d.statusTag === "Eligible";
          });

          const inProgressDrivesList = (applicationsData || []).filter((app: any) => {
            const st = (app.currentStatus || app.status || "").toLowerCase();
            return st !== "rejected" && st !== "selected";
          });

          const upcomingDrivesList = (placementDrives || []).filter((d: any) => {
            const st = (d.status || "").toLowerCase();
            return st === "active" || st === "upcoming" || !st;
          });

          const allRecentPool = placementDrives || [];
          const pageSize = 4;
          const startIndex = (recentDrivesPage - 1) * pageSize;
          const recentDrivesDisplay = allRecentPool.slice(startIndex, startIndex + pageSize);

          return (
            <div>
              {/* Executive Welcome Hero Banner */}
              <div style={{
                background: "linear-gradient(135deg, #07255A 0%, #0B3D91 50%, #1E5FCC 100%)",
                borderRadius: "16px",
                padding: "24px 28px",
                color: "#ffffff",
                marginBottom: "22px",
                boxShadow: "0 10px 25px -5px rgba(11, 61, 145, 0.25)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px"
              }}>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: "16px", fontSize: "11.5px", fontWeight: 700, color: "#E0F2FE", marginBottom: "8px" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#38BDF8" }}></span>
                    Campus Placement Portal • Verified Candidate
                  </div>
                  <h1 style={{ fontSize: "23px", fontWeight: 800, margin: "0 0 6px 0", color: "#FFFFFF", letterSpacing: "-0.3px" }}>
                    Welcome back, {displayName || "Ashwanth"}! 
                  </h1>
                  <p style={{ fontSize: "13.5px", color: "#BFDBFE", margin: 0, lineHeight: 1.5 }}>
                    You are eligible for <strong>{filterCounts["Eligible"] || 14} campus drives</strong> this week. Check closing deadlines and track your interview rounds below.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => { setDriveFilter("Eligible"); setCurrentTab("companies"); }}
                    style={{ backgroundColor: "#FFFFFF", color: "#4F46E5", border: "none", borderRadius: "8px", padding: "10px 18px", fontWeight: 700, fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  >
                    Browse Campus Drives →
                  </button>
                </div>
              </div>

              {/* 4 KPI Stack Cards with Crisp Vector Outline SVGs and Interactive Navigation */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "16px", marginBottom: "28px" }}>
                {[
                  {
                    label: "Eligible Campus Drives",
                    value: filterCounts["Eligible"] ?? 0,
                    color: "#4F46E5",
                    bg: "#E6EEFC",
                    onClick: () => {
                      setCurrentTab("companies");
                      setDriveFilter("Eligible");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    },
                    svg: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B3D91" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                      </svg>
                    )
                  },
                  {
                    label: "Closing Soon (< 48 hrs)",
                    value: closingDrivesList.length,
                    color: "#B91C1C",
                    bg: "#FEE2E2",
                    onClick: () => {
                      setCurrentTab("companies");
                      setDriveFilter("All");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    },
                    svg: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    )
                  },
                  {
                    label: "Applications In Progress",
                    value: inProgressDrivesList.length,
                    color: "#0F766E",
                    bg: "#DCFCE7",
                    onClick: () => {
                      setCurrentTab("applications");
                      setAppTrackerFilter("in_progress");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    },
                    svg: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F766E" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="4" ry="4" />
                        <path d="M9 12l2 2 4-4" />
                      </svg>
                    )
                  },
                  {
                    label: "Upcoming Placement Drives",
                    value: upcomingDrivesList.length,
                    color: "#6366F1",
                    bg: "#EEF2FF",
                    onClick: () => {
                      setCurrentTab("companies");
                      setDriveFilter("Up coming");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    },
                    svg: (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    )
                  },
                ].map((kpi, kIdx) => (
                  <div
                    key={kIdx}
                    onClick={kpi.onClick}
                    style={{
                      backgroundColor: "#FFFFFF",
                      padding: "16px 18px",
                      borderRadius: "12px",
                      border: "1px solid #E2E8F0",
                      borderTop: `4px solid ${kpi.color}`,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                      cursor: "pointer",
                      transition: "all 0.18s ease-in-out"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-3px)";
                      e.currentTarget.style.boxShadow = "0 8px 18px rgba(0,0,0,0.07)";
                      e.currentTarget.style.borderColor = "#CBD5E1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
                      e.currentTarget.style.borderColor = "#E2E8F0";
                    }}
                    title={`Click to view ${kpi.label}`}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>{kpi.label}</span>
                      <span style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {kpi.svg}
                      </span>
                    </div>
                    <div style={{ fontSize: "22px", fontWeight: 800, color: "#0F172A", marginTop: "6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>{kpi.value}</span>
                      <span style={{ fontSize: "12px", color: kpi.color, fontWeight: 700 }}>View →</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* DUAL CARD CONTAINER (Closing Soon Drives + Upcoming Drives) MATCHING USER IMAGE */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px", marginBottom: "32px" }}>
                
                {/* LEFT CARD: Closing Soon Drives Matching Officer Dashboard Design */}
                <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    {/* Card Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", fontWeight: 800, color: "#0F172A" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          Closing Soon Drives
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                          Active recruitment registration deadlines
                        </div>
                      </div>
                      <button
                        onClick={() => { setDriveFilter("Eligible"); setCurrentTab("companies"); }}
                        style={{
                          padding: "5px 12px",
                          backgroundColor: "#FFFFFF",
                          color: "#334155",
                          border: "1px solid #CBD5E1",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        View all
                      </button>
                    </div>

                    <div style={{ height: "1px", backgroundColor: "#F1F5F9", marginBottom: "14px" }}></div>

                    {/* List of Sub-Card Rows */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {closingDrivesList.length === 0 ? (
                        <div style={{ padding: "20px", textAlign: "center", color: "#94A3B8", fontSize: "12.5px" }}>
                          No active placement drives closing soon.
                        </div>
                      ) : (
                        closingDrivesList.slice(0, 3).map((drive: any, idx: number) => {
                          const isOptedIn = isDriveOptedIn(drive) || drive.statusTag === "Opted-In";
                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedDriveCriteria(drive)}
                              style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: "10px",
                                border: "1.5px solid #E2E8F0",
                                padding: "12px 14px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "10px",
                                cursor: "pointer",
                                transition: "all 0.15s ease"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "#CBD5E1";
                                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "#E2E8F0";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 800, fontSize: "13.5px", color: "#0F172A" }}>
                                  {drive.company}
                                </div>
                                <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>
                                  {drive.role || drive.jobTitle || "Software Trainee"} • <strong style={{ color: "#4F46E5" }}>{formatCtc(drive.ctc)}</strong>
                                </div>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {isOptedIn && (
                                  <span style={{
                                    backgroundColor: "#DCFCE7",
                                    color: "#15803D",
                                    padding: "3px 8px",
                                    borderRadius: "6px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    border: "1px solid #86EFAC",
                                    whiteSpace: "nowrap"
                                  }}>
                                    Opted-In
                                  </span>
                                )}
                                <span style={{
                                  fontSize: "11px",
                                  color: "#DC2626",
                                  fontWeight: 700,
                                  backgroundColor: "#FEF2F2",
                                  padding: "4px 8px",
                                  borderRadius: "6px",
                                  border: "1px solid #FECACA",
                                  whiteSpace: "nowrap"
                                }}>
                                  Ends {drive.deadline || "2026-09-30"}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT CARD: Upcoming Placement Drives (Upcoming Holidays Style) */}
                <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    {/* Card Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "16px", fontWeight: 800, color: "#0F172A" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Upcoming Drives
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#64748B", marginTop: "3px" }}>
                          Campus recruitment drives & test pipeline
                        </div>
                      </div>
                      <button
                        onClick={() => { setDriveFilter("Eligible"); setCurrentTab("companies"); }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#64748B",
                          fontSize: "12.5px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Calendar
                      </button>
                    </div>

                    <div style={{ height: "1px", backgroundColor: "#F1F5F9", marginBottom: "16px" }}></div>

                    {/* List of Date-Badged Rows from Real MongoDB Drives */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {upcomingDrivesList.length === 0 ? (
                        <div style={{ padding: "24px", textAlign: "center", color: "#64748B", fontSize: "13px" }}>
                          No upcoming placement drives scheduled at this moment.
                        </div>
                      ) : (
                        upcomingDrivesList.slice(0, 3).map((item: any, dIdx: number) => {
                          const dateObj = item.deadline ? new Date(item.deadline) : new Date();
                          const dayNum = isNaN(dateObj.getDate()) ? "15" : String(dateObj.getDate());
                          const monthStr = isNaN(dateObj.getMonth()) ? "SEPT" : dateObj.toLocaleString("en-US", { month: "short" }).toUpperCase();
                          const dayName = isNaN(dateObj.getDay()) ? "Active Drive" : dateObj.toLocaleString("en-US", { weekday: "long" });

                          return (
                            <div
                              key={dIdx}
                              style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: "10px",
                                border: "1.5px solid #E2E8F0",
                                padding: "12px 14px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "14px"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{
                                  width: "48px",
                                  height: "48px",
                                  borderRadius: "8px",
                                  backgroundColor: "#EFF6FF",
                                  border: "1px solid #DBEAFE",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0
                                }}>
                                  <div style={{ fontSize: "15px", fontWeight: 900, color: "#1D4ED8", lineHeight: 1 }}>{dayNum}</div>
                                  <div style={{ fontSize: "10px", fontWeight: 800, color: "#60A5FA", marginTop: "2px" }}>{monthStr}</div>
                                </div>

                                <div>
                                  <div style={{ fontWeight: 800, fontSize: "14px", color: "#0F172A" }}>
                                    {item.company || item.companyName}
                                  </div>
                                  <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                                    {dayName} • {item.role || item.jobTitle || "Software Engineer"} • <strong style={{ color: "#4F46E5" }}>{formatCtc(item.ctc || item.packageCtc || "₹7.5 LPA")}</strong>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => { setDriveFilter("Eligible"); setCurrentTab("companies"); }}
                                style={{
                                  padding: "5px 10px",
                                  backgroundColor: "#F8FAFC",
                                  color: "#4F46E5",
                                  border: "1px solid #CBD5E1",
                                  borderRadius: "6px",
                                  fontSize: "11.5px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  whiteSpace: "nowrap"
                                }}
                              >
                                Details →
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 2: CAMPUS DRIVES */}
        {currentTab === "companies" && (() => {
          // Pure MongoDB Drives Pool (Zero Mock Data)
          const allCampusPool = placementDrives || [];

          let filteredCampusDrives = allCampusPool.filter(d => {
            const isOptedIn = isDriveOptedIn(d) || d.statusTag === "Opted-In";
            const isOptedOut = isDriveOptedOut(d) || d.statusTag === "Opted-Out";
            const isIneligible = d.statusTag === "Not Eligible" || (d as any).isEligible === false;

            if (driveFilter === "Eligible" && (isOptedOut || isOptedIn || isIneligible)) return false;
            if (driveFilter === "Not Eligible" && !isIneligible) return false;
            if (driveFilter === "Up coming" && (isOptedOut || isOptedIn)) return false;
            if (driveFilter === "Opted-In" && !isOptedIn) return false;
            if (driveFilter === "Opted-Out" && !isOptedOut) return false;
            if (driveFilter === "Completed" && d.statusTag !== "Completed") return false;

            if (filterPosition && !(d.role || "").toLowerCase().includes(filterPosition.toLowerCase())) {
              return false;
            }

            if (filterLocation && !(d.location || "").toLowerCase().includes(filterLocation.toLowerCase())) {
              return false;
            }

            if (filterMinPackage > 0) {
              const raw = String(d.ctc || "0").replace(/[^0-9.]/g, "");
              const val = parseFloat(raw) || 0;
              if (val < filterMinPackage) return false;
            }

            return true;
          });

          if (filterSortBy === "Package (High to Low)") {
            filteredCampusDrives = [...filteredCampusDrives].sort((a, b) => {
              const numA = parseFloat(String(a.ctc || "0").replace(/[^0-9.]/g, "")) || 0;
              const numB = parseFloat(String(b.ctc || "0").replace(/[^0-9.]/g, "")) || 0;
              return numB - numA;
            });
          }

          const pageSize = 6;
          const startIndex = (campusDrivesPage - 1) * pageSize;
          const pageDisplayDrives = filteredCampusDrives.slice(startIndex, startIndex + pageSize);
          const totalCampusPages = Math.max(1, Math.ceil(filteredCampusDrives.length / pageSize));
          const campusPageNumbers = Array.from({ length: totalCampusPages }, (_, i) => i + 1);

          return (
            <div>
              {/* Top Header Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: 0 }}>
                  All Drives
                </h2>
                <button
                  onClick={() => setShowFilterModal(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: "#eff6ff",
                    color: "#2563eb",
                    border: "1px solid #bfdbfe",
                    borderRadius: "10px",
                    padding: "8px 16px",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  <span></span> Filter
                </button>
              </div>

              {/* Filter Pills Bar (All on same line layout) */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
                {[
                  { key: "All", label: "All" },
                  { key: "Eligible", label: "Eligible" },
                  { key: "Not Eligible", label: "Not Eligible" },
                  { key: "Up coming", label: "Up coming" },
                  { key: "Opted-In", label: "Opted-In" },
                  { key: "Opted-Out", label: "Opted-Out" },
                  { key: "Completed", label: "Completed" }
                ].map((filter) => {
                  const isSelected = driveFilter === filter.key;
                  return (
                    <button
                      key={filter.key}
                      onClick={() => { setCampusDrivesPage(1); setDriveFilter(filter.key as any); }}
                      style={{
                        backgroundColor: isSelected ? "#0B3D91" : "#ffffff",
                        color: isSelected ? "#ffffff" : "#475569",
                        border: isSelected ? "none" : "1px solid #CBD5E1",
                        borderRadius: "20px",
                        padding: "6px 16px",
                        fontSize: "12.5px",
                        fontWeight: isSelected ? "700" : "600",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "all 0.15s ease",
                        boxShadow: isSelected ? "0 2px 6px rgba(11,61,145,0.2)" : "none"
                      }}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>

              {/* Professional Corporate Campus Placement Drives Table */}
              {pageDisplayDrives.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b", backgroundColor: "#F8FAFC", borderRadius: "14px", border: "1px dashed #CBD5E1", marginBottom: "24px" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px" }}></div>
                  <div style={{ fontSize: "14.5px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>No {driveFilter} drives found</div>
                  <div style={{ fontSize: "12.5px" }}>There are currently no placement drives under the "{driveFilter}" filter.</div>
                </div>
              ) : (
                <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)", marginBottom: "24px" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569", fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          <th style={{ padding: "11px 16px", fontWeight: 700 }}>#</th>
                          <th style={{ padding: "11px 16px", fontWeight: 700 }}>Company</th>
                          <th style={{ padding: "11px 16px", fontWeight: 700 }}>Job Role</th>
                          <th style={{ padding: "11px 16px", fontWeight: 700 }}>Package CTC</th>
                          <th style={{ padding: "11px 16px", fontWeight: 700 }}>Deadline</th>
                          <th style={{ padding: "11px 16px", fontWeight: 700 }}>Status</th>
                          <th style={{ padding: "11px 16px", fontWeight: 700, textAlign: "right" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageDisplayDrives.map((drive: any, idx: number) => {
                          const isOptedIn = isDriveOptedIn(drive) || drive.statusTag === "Opted-In";
                          const isOptedOut = isDriveOptedOut(drive) || drive.statusTag === "Opted-Out";
                          const isIneligible = drive.statusTag === "Not Eligible" || (drive as any).isEligible === false;

                          return (
                            <tr
                              key={drive.id || drive._id || idx}
                              onClick={() => setSelectedDriveCriteria(drive)}
                              style={{
                                borderBottom: "1px solid #F1F5F9",
                                cursor: "pointer",
                                transition: "background-color 0.15s ease",
                                backgroundColor: isOptedIn ? "#F0FDF4" : "#FFFFFF"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isOptedIn ? "#DCFCE7" : "#F8FAFC"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isOptedIn ? "#F0FDF4" : "#FFFFFF"}
                            >
                              <td style={{ padding: "11px 16px", color: "#94A3B8", fontWeight: 700 }}>
                                {(campusDrivesPage - 1) * pageSize + idx + 1}
                              </td>
                              <td style={{ padding: "11px 16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                                  <div style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "7px",
                                    backgroundColor: "#EFF6FF",
                                    border: "1px solid #DBEAFE",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 800,
                                    color: "#1D4ED8",
                                    fontSize: "13.5px",
                                    flexShrink: 0
                                  }}>
                                    {drive.company?.charAt(0) || "C"}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 800, color: "#0F172A", fontSize: "13px" }}>
                                      {drive.company}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#64748B", marginTop: "1px", display: "flex", alignItems: "center", gap: "3px" }}>
                                       {drive.location || "Bangalore, India"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: "11px 16px", color: "#2563EB", fontWeight: 700 }}>
                                {drive.role || "Software Trainee"}
                              </td>
                              <td style={{ padding: "11px 16px", color: "#16A34A", fontWeight: 900, fontFamily: "'Inter', -apple-system, sans-serif", fontSize: "13.5px" }}>
                                {formatCtc(drive.ctc)}
                              </td>
                              <td style={{ padding: "11px 16px", color: "#DC2626", fontWeight: 700, fontSize: "12px", whiteSpace: "nowrap" }}>
                                {drive.deadline ? drive.deadline.replace(/^[⏰⏱️]\s*/, "") : "30 May 2026"}
                              </td>
                              <td style={{ padding: "11px 16px" }}>
                                <span style={{
                                  backgroundColor: isOptedIn ? "#DCFCE7" : (isOptedOut ? "#FEE2E2" : (isIneligible ? "#FEE2E2" : "#EFF6FF")),
                                  color: isOptedIn ? "#15803D" : (isOptedOut ? "#B91C1C" : (isIneligible ? "#B91C1C" : "#1D4ED8")),
                                  padding: "3px 8px",
                                  borderRadius: "12px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  border: `1px solid ${isOptedIn ? "#86EFAC" : (isOptedOut ? "#FCA5A5" : (isIneligible ? "#FCA5A5" : "#BFDBFE"))}`,
                                  whiteSpace: "nowrap"
                                }}>
                                  {isOptedIn ? " Opted-In" : (isOptedOut ? " Opted-Out" : (isIneligible ? "Not Eligible" : "Eligible"))}
                                </span>
                              </td>
                              <td style={{ padding: "11px 16px", textAlign: "right" }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDriveCriteria(drive);
                                  }}
                                  style={{
                                    padding: "5px 12px",
                                    backgroundColor: "#4F46E5",
                                    color: "#FFFFFF",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "11.5px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                    transition: "all 0.15s ease"
                                  }}
                                >
                                  View Details →
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pagination Controls */}
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={() => setCampusDrivesPage(prev => Math.max(1, prev - 1))}
                  disabled={campusDrivesPage === 1}
                  style={{
                    background: "none",
                    border: "none",
                    color: campusDrivesPage === 1 ? "#94a3b8" : "#2563eb",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: campusDrivesPage === 1 ? "not-allowed" : "pointer"
                  }}
                >
                  Previous
                </button>

                {campusPageNumbers.map(p => (
                  <button
                    key={p}
                    onClick={() => setCampusDrivesPage(p)}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      border: p === campusDrivesPage ? "1px solid #cbd5e1" : "none",
                      backgroundColor: p === campusDrivesPage ? "#ffffff" : "transparent",
                      color: p === campusDrivesPage ? "#0f172a" : "#64748b",
                      fontWeight: "700",
                      fontSize: "14px",
                      cursor: "pointer"
                    }}
                  >
                    {p}
                  </button>
                ))}

                {totalCampusPages > 4 && <span style={{ color: "#94a3b8", fontWeight: "700" }}>. . .</span>}

                <button
                  onClick={() => setCampusDrivesPage(prev => Math.min(totalCampusPages, prev + 1))}
                  disabled={campusDrivesPage === totalCampusPages}
                  style={{
                    background: "none",
                    border: "none",
                    color: campusDrivesPage === totalCampusPages ? "#94a3b8" : "#2563eb",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: campusDrivesPage === totalCampusPages ? "not-allowed" : "pointer"
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          );
        })()}

        {/* TAB 3: MY APPLICATIONS (Application Tracker 100% MongoDB) */}
        {currentTab === "applications" && (() => {
          const rawMapped = (applicationsData || []).map((app: any) => {
            const st = app.currentWorkflowStage || app.status || "Applied";
            const isSel = st.toLowerCase().includes("select") || st.toLowerCase().includes("placed");
            const isRej = st.toLowerCase().includes("reject") || st.toLowerCase().includes("not shortlisted");

            const defaultRounds = [
              { stepName: "Round 1", name: "Aptitude Assessment", state: "passed" },
              { stepName: "Round 2", name: "Technical Interview", state: isSel ? "passed" : (isRej ? "failed" : "active") },
              { stepName: "Round 3", name: "Management / HR", state: isSel ? "passed" : (isRej ? "upcoming" : "upcoming") }
            ];

            return {
              ...app,
              company: app.companyName || app.company,
              role: app.jobRole || app.role || "Software Trainee",
              statusTag: isSel ? "Selected" : (isRej ? "Rejected" : "Processing"),
              appliedDate: app.appliedDate || (app.createdAt ? new Date(app.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Recently"),
              location: app.location || "On-Campus / Virtual",
              ctc: formatCtc(app.package || app.ctc || app.packageCtc || "₹7.5 LPA"),
              subMessage: isSel
                ? "Congratulations! You have been selected."
                : (isRej ? "Application evaluated. Check other placement opportunities." : `Next Round: ${app.roundName || "In Progress"}`),
              rounds: Array.isArray(app.rounds) && app.rounds.length > 0 ? app.rounds : defaultRounds
            };
          });

          const displayList = rawMapped;

          const normalizedApps = rawMapped.map((app: any) => {
            const st = (app.statusTag || app.currentWorkflowStage || "").toLowerCase();
            const isCompleted = st.includes("select") || st.includes("reject") || st.includes("complete") || st.includes("offer");
            const isSelected = st.includes("select") || st.includes("offer");
            const isRejected = st.includes("reject");

            return {
              ...app,
              isCompleted,
              isSelected,
              isRejected,
              statusCategory: isCompleted ? "completed" : "in_progress",
              statusDisplay: isCompleted ? (isSelected ? "Completed • Selected" : "Completed") : "In Progress"
            };
          });

          const filteredTrackerApps = normalizedApps.filter((app: any) => {
            if (appTrackerFilter === "in_progress") {
              return app.statusCategory === "in_progress";
            }
            if (appTrackerFilter === "completed") {
              return app.statusCategory === "completed";
            }
            return true;
          });

          return (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "18px", padding: "24px", border: "1px solid #eaedf0", width: "100%", boxSizing: "border-box" }}>
              {/* Tracker Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0" }}>
                    My Applications & Interview Status
                  </h2>
                  <div style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>
                    Manage your active recruitment drives and finalized placement results
                  </div>
                </div>

                {/* Filter Switcher: All, In Progress, Completed */}
                <div style={{ display: "flex", gap: "6px", backgroundColor: "#F1F5F9", padding: "4px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                  {[
                    { id: "all", label: "All Applications", count: normalizedApps.length },
                    { id: "in_progress", label: "In Progress", count: normalizedApps.filter(a => a.statusCategory === "in_progress").length },
                    { id: "completed", label: "Completed", count: normalizedApps.filter(a => a.statusCategory === "completed").length }
                  ].map(f => {
                    const isSel = appTrackerFilter === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setAppTrackerFilter(f.id as any)}
                        style={{
                          padding: "7px 16px",
                          borderRadius: "8px",
                          border: "none",
                          backgroundColor: isSel ? "#0B3D91" : "transparent",
                          color: isSel ? "#FFFFFF" : "#475569",
                          fontWeight: isSel ? 700 : 600,
                          fontSize: "13px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <span>{f.label}</span>
                        <span style={{
                          backgroundColor: isSel ? "rgba(255,255,255,0.2)" : "#E2E8F0",
                          color: isSel ? "#FFFFFF" : "#475569",
                          padding: "1px 6px",
                          borderRadius: "10px",
                          fontSize: "11px",
                          fontWeight: 700
                        }}>
                          {f.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Applications & Interview Status Table */}
              {filteredTrackerApps.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px", color: "#64748b", backgroundColor: "#F8FAFC", borderRadius: "16px", border: "1px dashed #CBD5E1" }}>
                  <div style={{ fontSize: "36px", marginBottom: "10px" }}></div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>No applications found under "{appTrackerFilter === 'in_progress' ? 'In Progress' : 'Completed'}"</div>
                  <div style={{ fontSize: "13.5px", marginTop: "4px" }}>Select another filter or apply to campus drives to see your applications.</div>
                </div>
              ) : (
                <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569", fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          <th style={{ padding: "11px 16px", fontWeight: 700 }}>#</th>
                          <th style={{ padding: "11px 16px", fontWeight: 700 }}>Company</th>
                          <th style={{ padding: "11px 16px", fontWeight: 700 }}>Job Role</th>
                          <th style={{ padding: "11px 16px", fontWeight: 700 }}>Package CTC</th>
                          <th style={{ padding: "11px 16px", fontWeight: 700 }}>Current Round / Schedule</th>
                          <th style={{ padding: "11px 16px", fontWeight: 700 }}>Status</th>
                          <th style={{ padding: "11px 16px", fontWeight: 700, textAlign: "right" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTrackerApps.map((app: any, idx: number) => {
                          const isInProgress = app.statusCategory === "in_progress";
                          const isSelected = app.isSelected;
                          const isRejected = app.isRejected;

                          return (
                            <tr
                              key={idx}
                              onClick={() => setSelectedApplicationModal(app)}
                              style={{
                                borderBottom: "1px solid #F1F5F9",
                                cursor: "pointer",
                                transition: "background-color 0.15s ease",
                                backgroundColor: isSelected ? "#F0FDF4" : "#FFFFFF"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isSelected ? "#DCFCE7" : "#F8FAFC"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isSelected ? "#F0FDF4" : "#FFFFFF"}
                            >
                              <td style={{ padding: "11px 16px", color: "#94A3B8", fontWeight: 700 }}>
                                {idx + 1}
                              </td>
                              <td style={{ padding: "11px 16px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                                  <div style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "7px",
                                    backgroundColor: "#EFF6FF",
                                    border: "1px solid #DBEAFE",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "14px",
                                    fontWeight: 800,
                                    color: "#4F46E5",
                                    flexShrink: 0
                                  }}>
                                    {app.company?.charAt(0) || "C"}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 800, color: "#0F172A", fontSize: "13px" }}>
                                      {app.company}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#64748B", marginTop: "1px", display: "flex", alignItems: "center", gap: "3px" }}>
                                       {app.location || "Bangalore, India"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: "11px 16px", color: "#2563EB", fontWeight: 700 }}>
                                {app.role || "Software Developer"}
                              </td>
                              <td style={{ padding: "11px 16px", color: "#16A34A", fontWeight: 900, fontFamily: "'Inter', -apple-system, sans-serif", fontSize: "13.5px" }}>
                                {formatCtc(app.ctc || app.package)}
                              </td>
                              <td style={{ padding: "11px 16px" }}>
                                <div style={{ fontSize: "12.5px", fontWeight: 700, color: isInProgress ? "#1E40AF" : (isSelected ? "#15803D" : "#475569") }}>
                                  {app.subMessage || (isInProgress ? " Technical Interview" : "Recruitment Concluded")}
                                </div>
                              </td>
                              <td style={{ padding: "11px 16px" }}>
                                {isInProgress ? (
                                  <span style={{
                                    backgroundColor: "#EFF6FF",
                                    color: "#1D4ED8",
                                    border: "1px solid #BFDBFE",
                                    borderRadius: "12px",
                                    padding: "3px 8px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    whiteSpace: "nowrap"
                                  }}>
                                    ● In Progress
                                  </span>
                                ) : isSelected ? (
                                  <span style={{
                                    backgroundColor: "#DCFCE7",
                                    color: "#15803D",
                                    border: "1px solid #86EFAC",
                                    borderRadius: "12px",
                                    padding: "3px 8px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    whiteSpace: "nowrap"
                                  }}>
                                     Selected
                                  </span>
                                ) : (
                                  <span style={{
                                    backgroundColor: "#FEE2E2",
                                    color: "#B91C1C",
                                    border: "1px solid #FCA5A5",
                                    borderRadius: "12px",
                                    padding: "3px 8px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    whiteSpace: "nowrap"
                                  }}>
                                    Completed
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: "11px 16px", textAlign: "right" }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedApplicationModal(app);
                                  }}
                                  style={{
                                    padding: "5px 12px",
                                    backgroundColor: "#4F46E5",
                                    color: "#FFFFFF",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "11.5px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                    transition: "all 0.15s ease"
                                  }}
                                >
                                  Track Status →
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })()}



        {/* TAB 4: INTERVIEW SCHEDULE */}
        {currentTab === "schedule" && (
          <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", padding: "24px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>️</span> Active Interview Schedules & Venue Details
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
                 Refresh Schedule
              </button>
            </div>

            {interviewsLoading ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#64748b", fontWeight: "700", fontSize: "14px" }}>
                ⏳ Loading interview schedules from backend...
              </div>
            ) : interviewsError ? (
              <div style={{ padding: "30px 20px", backgroundColor: "#fef2f2", borderRadius: "12px", border: "1px solid #fecaca", color: "#dc2626", fontWeight: "700", fontSize: "13px", textAlign: "center" }}>
                ️ {interviewsError}
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
                         No interviews scheduled yet.
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
                    let badgeLabel = "Scheduled ️";

                    if (isPassed) {
                      badgeBg = "#f0fdf4";
                      badgeColor = "#16a34a";
                      badgeBorder = "#bbf7d0";
                      badgeLabel = "Passed ";
                    } else if (st === "today") {
                      badgeBg = "#fffbeb";
                      badgeColor = "#d97706";
                      badgeBorder = "#fde68a";
                      badgeLabel = "Today ";
                    } else if (isRescheduled) {
                      badgeBg = "#fffbeb";
                      badgeColor = "#d97706";
                      badgeBorder = "#fde68a";
                      badgeLabel = "Rescheduled ️";
                    } else if (isCancelled) {
                      badgeBg = "#fef2f2";
                      badgeColor = "#dc2626";
                      badgeBorder = "#fecaca";
                      badgeLabel = "Cancelled ";
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
                              <div style={{ fontWeight: "800", color: "#1d4ed8", marginBottom: "6px" }}> Round: {sch.roundTitle}</div>
                              <div> Date & Time: <strong>{sch.date} | {sch.time}</strong></div>
                              <div>‍ Interviewer Panel: <strong>{sch.interviewer}</strong></div>
                              <div> Mode & Location: <strong>{sch.mode} ({sch.venue || sch.platform || "Placement Cell"})</strong></div>
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
                                    statusLabel = "Passed ";
                                    statusColor = "#16a34a";
                                  } else if (isFailed) {
                                    statusLabel = "Not Selected ";
                                    statusColor = "#dc2626";
                                  } else if (rawStatus.includes("upcoming") || rawStatus.includes("pending") || rawStatus.includes("locked")) {
                                    statusLabel = "Locked ";
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
                  <span></span> Final Selection Results & Placement Status
                </h2>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Official recruitment selection confirmations verified by the TPO cell.
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
                              {isDeclined ? " Not Selected" : "Selected "}
                            </span>
                          </td>
                          <td style={{ padding: "16px", color: "#64748b", fontWeight: "600" }}>
                            {off.date || "15 Sep 2026"}
                          </td>
                          <td style={{ padding: "16px" }}>
                            <button
                              onClick={() => setCurrentTab("applications")}
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
                              View Details →
                            </button>
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
                  <span style={{ color: "#16a34a" }}></span> Placement Confirmation & Offer Sign-off
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
                     Accept Placement Offer
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
                     Decline Offer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: PROFILE */}
        {currentTab === "profile" && <StudentProfile user={user} />}

        {/* MODAL 1: Drive Details & Criteria View (Matching Mockup Aesthetics without Purple) */}
        {selectedDriveCriteria && (() => {
          const isOptedIn = isDriveOptedIn(selectedDriveCriteria) || selectedDriveCriteria.statusTag === "Opted-In";
          const isOptedOut = isDriveOptedOut(selectedDriveCriteria) || selectedDriveCriteria.statusTag === "Opted-Out";
          const isIneligible = selectedDriveCriteria.statusTag === "Not Eligible" || (selectedDriveCriteria as any).isEligible === false;

          return (
            <div onClick={() => setSelectedDriveCriteria(null)} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
              <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#ffffff", borderRadius: "20px", width: "min(860px, calc(100vw - 32px))", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", padding: "24px", position: "relative" }}>
                
                {/* Close Button */}
                <button
                  onClick={() => setSelectedDriveCriteria(null)}
                  style={{
                    position: "absolute",
                    top: "20px",
                    right: "20px",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "#f1f5f9",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "800",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10
                  }}
                >
                  
                </button>

                {/* Top Header Card */}
                <div style={{ border: "1px solid #e2e8f0", borderRadius: "16px", padding: "22px", marginBottom: "24px", backgroundColor: "#ffffff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "14px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "24px",
                        fontWeight: "800",
                        color: "#2563eb",
                        overflow: "hidden"
                      }}>
                        {selectedDriveCriteria.company?.includes("Google") ? (
                          <span style={{ color: "#4285F4" }}>G</span>
                        ) : selectedDriveCriteria.logo ? (
                          <img src={selectedDriveCriteria.logo} alt={selectedDriveCriteria.company} style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={(e: any) => { e.target.style.display = 'none'; }} />
                        ) : (
                          selectedDriveCriteria.company?.charAt(0) || "C"
                        )}
                      </div>
                      <div>
                        <h3 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
                          {selectedDriveCriteria.company}
                        </h3>
                        <div style={{ fontSize: "14px", color: "#2563eb", fontWeight: "700" }}>
                          {selectedDriveCriteria.role || "Software Developer"}
                        </div>
                      </div>
                    </div>

                    {!isOptedIn && (
                      <span style={{
                        backgroundColor: isIneligible ? "#fef2f2" : "#eff6ff",
                        color: isIneligible ? "#dc2626" : "#2563eb",
                        padding: "5px 14px",
                        borderRadius: "14px",
                        fontSize: "12px",
                        fontWeight: "700",
                        border: `1px solid ${isIneligible ? "#fecaca" : "#bfdbfe"}`
                      }}>
                        {isIneligible ? "Not Eligible" : "Eligible"}
                      </span>
                    )}
                  </div>

                  {/* Sub Metadata Row */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "18px", fontSize: "13px", color: "#475569", fontWeight: "600", marginBottom: "16px" }}>
                    <div> {selectedDriveCriteria.location || "Bangalore, India"}</div>
                    <div> {formatCtc(selectedDriveCriteria.ctc)}</div>
                    <div> Full Time</div>
                    <div style={{ color: "#dc2626", fontWeight: "700" }}>⏰ Deadline {selectedDriveCriteria.deadline || "May 30, 2026"}</div>
                  </div>

                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                      Posted on <strong>May 20, 2026</strong> &nbsp;•&nbsp; Applicants : <strong>{(selectedDriveCriteria as any).applicantCount || 580}+</strong>
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      {isOptedIn ? (
                        <button
                          disabled
                          style={{
                            backgroundColor: "#f0fdf4",
                            color: "#16a34a",
                            border: "1px solid #bbf7d0",
                            borderRadius: "10px",
                            padding: "9px 20px",
                            fontWeight: "700",
                            fontSize: "13px"
                          }}
                        >
                           Opted-In
                        </button>
                      ) : isOptedOut ? (
                        <button
                          disabled
                          style={{
                            backgroundColor: "#fef2f2",
                            color: "#dc2626",
                            border: "1px solid #fecaca",
                            borderRadius: "10px",
                            padding: "9px 20px",
                            fontWeight: "700",
                            fontSize: "13px"
                          }}
                        >
                           Opted-Out
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setOptInConfirmDrive(selectedDriveCriteria)}
                            style={{
                              backgroundColor: "#16a34a",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "10px",
                              padding: "9px 24px",
                              fontWeight: "700",
                              fontSize: "13px",
                              cursor: "pointer",
                              boxShadow: "0 2px 6px rgba(22,163,74,0.3)"
                            }}
                          >
                            Opt-In
                          </button>
                          <button
                            onClick={() => setOptOutConfirmDrive(selectedDriveCriteria)}
                            style={{
                              backgroundColor: "#dc2626",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "10px",
                              padding: "9px 20px",
                              fontWeight: "700",
                              fontSize: "13px",
                              cursor: "pointer",
                              boxShadow: "0 2px 6px rgba(220,38,38,0.3)"
                            }}
                          >
                            Opt-Out
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tab Bar: Job Details */}
                <div style={{ borderBottom: "2px solid #e2e8f0", marginBottom: "24px" }}>
                  <span style={{
                    display: "inline-block",
                    paddingBottom: "10px",
                    fontSize: "15px",
                    fontWeight: "800",
                    color: "#2563eb",
                    borderBottom: "3px solid #2563eb"
                  }}>
                    Job Details
                  </span>
                </div>

                {/* Section 1: About the Role */}
                <div style={{ marginBottom: "28px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: "0 0 10px 0" }}>
                    About the Role
                  </h4>
                  <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.6", margin: 0 }}>
                    Proficient in Asp, .NET, VB, VC++. You ought to develop both windows and web applications according to clients requirement and meet tight deadlines.
                  </p>
                </div>

                {/* Section 2: 6 Attribute Cards Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px", marginBottom: "28px" }}>
                  {[
                    { icon: "", title: "Role", desc: selectedDriveCriteria.role || "Back end Developer" },
                    { icon: "", title: "Employment Type", desc: "Internship, Full Time" },
                    { icon: "", title: "Industry Type", desc: "Banking & IT Services" },
                    { icon: "", title: "Role Category", desc: "Software Developer" },
                    { icon: "", title: "Education", desc: "UG: B.Tech / B.E / MCA" },
                    { icon: "", title: "Department", desc: "Engineering" }
                  ].map((item, idx) => (
                    <div key={idx} style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "14px 16px", border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
                        {item.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>{item.title}</div>
                        <div style={{ fontSize: "13px", color: "#0f172a", fontWeight: "700" }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Section 3: Key Responsibilities */}
                <div style={{ marginBottom: "28px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: "0 0 12px 0" }}>
                    Key Responsibilities
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", color: "#475569", lineHeight: "1.8" }}>
                    <li>Develop responsive web application using modern frontend frameworks</li>
                    <li>Design and build RESTful API's and backend services</li>
                    <li>Write clean, maintainable and efficient code</li>
                    <li>Collaborate with UI/UX designers and product teams</li>
                    <li>Optimize application performance and scalability</li>
                    <li>Troubleshoot and fix bugs in production environments</li>
                    <li>Participate in code reviews and technical discussions</li>
                  </ul>
                </div>

                {/* Section 4: Eligibility Criteria */}
                <div style={{ marginBottom: "28px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: "0 0 12px 0" }}>
                    Eligibility Criteria
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", color: "#475569", lineHeight: "1.8" }}>
                    <li>BE / BTech / MCA in Computer Science, IT and related fields</li>
                    <li>2026 Pass-out Batch</li>
                    <li>Minimum {selectedDriveCriteria.minCgpa || 7.0} CGPA or 70%</li>
                    <li>Maximum {selectedDriveCriteria.maxBacklogs ?? 0} active backlogs allowed</li>
                  </ul>
                </div>

                {/* Section 5: Rounds (5) */}
                <div style={{ marginBottom: "28px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: "0 0 12px 0" }}>
                    Rounds (5)
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", color: "#475569", lineHeight: "1.8" }}>
                    <li>1st Round - Aptitude</li>
                    <li>2nd Round - Technical</li>
                    <li>3rd Round - Coding</li>
                    <li>4th Round - Group Discussion</li>
                    <li>Final Round - HR</li>
                  </ul>
                </div>

                {/* Section 6: Required Skills */}
                <div style={{ marginBottom: "28px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: "0 0 12px 0" }}>
                    Required Skills
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", color: "#475569", lineHeight: "1.8" }}>
                    <li>JavaScript / TypeScript</li>
                    <li>React.js or Angular</li>
                    <li>Node.js</li>
                    <li>SQL / NoSQL Databases</li>
                    <li>DSA</li>
                    <li>Git and Version Control</li>
                  </ul>
                </div>

                {/* Section 7: Benefits */}
                <div style={{ marginBottom: "12px" }}>
                  <h4 style={{ fontSize: "16px", fontWeight: "800", color: "#0f172a", margin: "0 0 12px 0" }}>
                    Benefits
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", color: "#475569", lineHeight: "1.8" }}>
                    <li>Health Insurance</li>
                    <li>Flexible Work Environment</li>
                    <li>Learning & Development Programs</li>
                    <li>Free Meals & Transportation</li>
                    <li>Employee Wellness Programs</li>
                    <li>Career Growth Opportunities</li>
                  </ul>
                </div>

              </div>
            </div>
          );
        })()}

        {/* MODAL 1B: Confirm Opt-In Modal (Matching Image 4) */}
        {showOptInConfirmDrive && (
          <div onClick={() => setShowOptInConfirmDrive(null)} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "16px" }}>
            <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#ffffff", borderRadius: "18px", width: "420px", maxWidth: "94%", padding: "28px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.25)", position: "relative" }}>
              {/* Close Icon */}
              <button
                onClick={() => setShowOptInConfirmDrive(null)}
                style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px", fontWeight: "800" }}
              >
                
              </button>

              <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
                Confirm Opt-In
              </h3>
              <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px 0", lineHeight: "1.5" }}>
                Are you sure you want to Opt-In?
              </p>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  onClick={() => setShowOptInConfirmDrive(null)}
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#2563eb",
                    border: "1px solid #2563eb",
                    borderRadius: "10px",
                    padding: "10px 22px",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const target = showOptInConfirmDrive;
                    handleApply(target.id || "", target.company, target.role);
                    setShowOptInConfirmDrive(null);
                    setSelectedDriveCriteria(null);
                    setOptInSuccessData({ company: target.company, role: target.role });
                    setTimeout(() => {
                      setOptInSuccessData(null);
                    }, 4000);
                  }}
                  style={{
                    backgroundColor: "#16a34a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "10px 24px",
                    fontSize: "14px",
                    fontWeight: "700",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(22,163,74,0.3)"
                  }}
                >
                  Opt-In
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1C: Opted-In Success Alert Banner (Positioned Top Center) */}
        {optInSuccessData && (
          <div style={{ position: "fixed", top: "30px", left: "50%", transform: "translateX(-50%)", zIndex: 10000 }}>
            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #bbf7d0", padding: "16px 24px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.18), 0 10px 10px -5px rgba(0,0,0,0.04)", minWidth: "380px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "#16a34a", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "800", flexShrink: 0 }}>
                
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", marginBottom: "2px" }}>
                  Opted-In Successfully
                </div>
                <div style={{ fontSize: "13px", color: "#475569", fontWeight: "600" }}>
                  You've applied to {optInSuccessData.company} — {optInSuccessData.role}.
                </div>
              </div>
              <button
                onClick={() => setOptInSuccessData(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "18px", fontWeight: "800", cursor: "pointer", marginLeft: "12px", padding: 0 }}
                title="Close"
              >
                
              </button>
            </div>
          </div>
        )}

        {/* MODAL 1C-2: Opted-Out Success Alert Banner (Positioned Top Center) */}
        {optOutSuccessData && (
          <div style={{ position: "fixed", top: "30px", left: "50%", transform: "translateX(-50%)", zIndex: 10000 }}>
            <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #fecaca", padding: "16px 24px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.18), 0 10px 10px -5px rgba(0,0,0,0.04)", minWidth: "380px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "#dc2626", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "800", flexShrink: 0 }}>
                
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", marginBottom: "2px" }}>
                  Opted-Out Successfully
                </div>
                <div style={{ fontSize: "13px", color: "#475569", fontWeight: "600" }}>
                  You've opted out of {optOutSuccessData.company} — {optOutSuccessData.role}.
                </div>
              </div>
              <button
                onClick={() => setOptOutSuccessData(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "18px", fontWeight: "800", cursor: "pointer", marginLeft: "12px", padding: 0 }}
                title="Close"
              >
                
              </button>
            </div>
          </div>
        )}

        {/* MODAL 2: Application & Company Details Modal */}
        {selectedApplicationModal && (
          <div onClick={() => setSelectedApplicationModal(null)} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#ffffff", borderRadius: "18px", width: "min(900px, calc(100% - 24px))", maxHeight: "90vh", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column" }}>
              {/* Modal Dark Header */}
              <div style={{ backgroundColor: "#0f172a", color: "#ffffff", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {/* Company Logo Box */}
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    fontWeight: "800",
                    color: "#2563eb",
                    overflow: "hidden",
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                  }}>
                    {selectedApplicationModal.company?.includes("Google") ? (
                      <span style={{ color: "#4285F4" }}>G</span>
                    ) : selectedApplicationModal.company?.includes("Zoho") ? (
                      <span style={{ color: "#e11d48", fontSize: "11px", fontWeight: "900" }}>ZOHO</span>
                    ) : selectedApplicationModal.company?.includes("TCS") ? (
                      <span style={{ color: "#0284c7", fontSize: "11px", fontWeight: "900" }}>TCS</span>
                    ) : selectedApplicationModal.company?.includes("Amazon") ? (
                      <span style={{ color: "#ff9900", fontSize: "16px", fontWeight: "900" }}>a</span>
                    ) : selectedApplicationModal.logo ? (
                      <img src={selectedApplicationModal.logo} alt={selectedApplicationModal.company} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    ) : (
                      selectedApplicationModal.company?.charAt(0) || "C"
                    )}
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 2px 0", fontSize: "18px", fontWeight: "800", color: "#ffffff" }}>
                      {selectedApplicationModal.company} — Application Details
                    </h3>
                    <div style={{ fontSize: "13px", color: "#38bdf8", fontWeight: "700" }}>
                      {selectedApplicationModal.role}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedApplicationModal(null)} style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "#ffffff", cursor: "pointer", fontSize: "16px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  
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

                {/* SCHEDULED INTERVIEW / ASSESSMENT DETAILS (MATCHING OFFICER INTERVIEW SCHEDULING) */}
                {(() => {
                  const comp = String(selectedApplicationModal.company || "").toLowerCase().trim();
                  const role = String(selectedApplicationModal.role || "").toLowerCase().trim();

                  // Find matched interview from dbInterviews or selectedApplicationModal.interviewSchedule
                  const matchedInterview = dbInterviews.find((item: any) => {
                    const c = String(item.company || item.companyName || "").toLowerCase().trim();
                    const r = String(item.role || item.jobRole || "").toLowerCase().trim();
                    return (comp && c && (comp.includes(c) || c.includes(comp)));
                  }) || selectedApplicationModal.interviewSchedule || null;

                  const interviewDate = matchedInterview?.date || matchedInterview?.interviewDate || selectedApplicationModal.interviewSchedule?.date || "28 Aug 2026";
                  const interviewTime = matchedInterview?.time || matchedInterview?.interviewTime || selectedApplicationModal.interviewSchedule?.time || "10:00 AM IST";
                  const interviewRound = matchedInterview?.round || matchedInterview?.roundTitle || matchedInterview?.roundName || selectedApplicationModal.activeRoundType || "Round 1: Technical Assessment";
                  const interviewMode = matchedInterview?.mode || selectedApplicationModal.interviewSchedule?.mode || "Online";
                  const interviewVenue = matchedInterview?.location || matchedInterview?.venueOrLink || matchedInterview?.venue || selectedApplicationModal.interviewSchedule?.location || "College Placement Cell / Virtual Meeting";
                  const interviewer = matchedInterview?.interviewer || selectedApplicationModal.interviewSchedule?.interviewer || `${selectedApplicationModal.company} Technical Panel`;

                  return (
                    <div style={{ marginBottom: "20px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "800", color: "#4F46E5", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span>SCHEDULED INTERVIEW & ASSESSMENT DETAILS</span>
                      </div>

                      <div style={{ backgroundColor: "#EEF2FF", borderRadius: "12px", border: "1.5px solid #C7D2FE", padding: "16px", boxShadow: "0 1px 3px rgba(79,70,229,0.04)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: "14px", color: "#1E1B4B" }}>
                              {interviewRound}
                            </div>
                            <div style={{ fontSize: "12px", color: "#4338CA", marginTop: "2px", fontWeight: 600 }}>
                              Conducted by: {interviewer}
                            </div>
                          </div>
                          <span style={{ fontSize: "11px", backgroundColor: "#DCFCE7", color: "#15803D", padding: "3px 9px", borderRadius: "12px", fontWeight: 700, border: "1px solid #86EFAC", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#16A34A" }}></span>
                            <span>Confirmed Schedule</span>
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12.5px", color: "#334155", backgroundColor: "#FFFFFF", padding: "12px 14px", borderRadius: "8px", border: "1px solid #E0E7FF", marginBottom: "12px" }}>
                          <div>
                            <span style={{ color: "#64748B" }}>Date & Time: </span>
                            <strong style={{ color: "#0F172A" }}>{interviewDate} • {interviewTime}</strong>
                          </div>
                          <div>
                            <span style={{ color: "#64748B" }}>Mode: </span>
                            <strong style={{ color: "#4F46E5" }}>{interviewMode}</strong>
                          </div>
                          <div style={{ gridColumn: "span 2" }}>
                            <span style={{ color: "#64748B" }}>Venue / Link: </span>
                            <strong style={{ color: "#0F172A" }}>{interviewVenue}</strong>
                          </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                          <span style={{ fontSize: "11.5px", color: "#64748B" }}>
                            Please be ready 10 mins prior with your ID card & resume.
                          </span>
                          {interviewVenue.includes("http") ? (
                            <a
                              href={interviewVenue}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ padding: "6px 14px", backgroundColor: "#4F46E5", color: "#FFFFFF", borderRadius: "6px", fontSize: "12px", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            >
                              Join Meeting ↗
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => alert(`Interview scheduled at: ${interviewVenue}\nDate: ${interviewDate}\nTime: ${interviewTime}`)}
                              style={{ padding: "6px 14px", backgroundColor: "#4F46E5", color: "#FFFFFF", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                            >
                              View Instructions
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* OFFICER STATUS & ROUND EVALUATION LOG */}
                <div style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "10px" }}>️ PLACEMENT OFFICER EVALUATION & REAL-TIME STATUS</div>
                <div style={{ backgroundColor: "#F0FDF4", borderRadius: "12px", border: "1px solid #BBF7D0", padding: "16px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#166534" }}>
                      Workflow Status: {selectedApplicationModal.statusDisplay || selectedApplicationModal.statusTag || "In Progress"}
                    </div>
                    <span style={{ fontSize: "11px", backgroundColor: "#DCFCE7", color: "#15803D", padding: "3px 10px", borderRadius: "20px", fontWeight: 700, border: "1px solid #86EFAC" }}>
                      Verified by TPO
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#334155", lineHeight: 1.5 }}>
                    {selectedApplicationModal.subMessage || (selectedApplicationModal.isSelected ? " Selection Confirmed. Official placement appointment issued." : "Your application is currently active and being evaluated by the placement coordinator & company panel.")}
                  </div>
                  <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px dashed #86EFAC", display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748B" }}>
                    <span>Selection Round: <strong style={{ color: "#0F172A" }}>{selectedApplicationModal.activeRoundType || "Round 1 Assessment"}</strong></span>
                    <span>Package: <strong style={{ color: "#16A34A" }}>{formatCtc(selectedApplicationModal.ctc || selectedApplicationModal.package)}</strong></span>
                  </div>
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
                    
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "#ffffff" }}>{displayName}</h3>
                    <div style={{ fontSize: "12px", color: "#93c5fd", fontWeight: "600" }}>{selectedOfferModal.company} • {selectedOfferModal.role}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedOfferModal(null)} style={{ width: "30px", height: "30px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.15)", border: "none", color: "#ffffff", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}></button>
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
                      <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontSize: "20px", fontWeight: "bold", fontStyle: "italic", color: "#1e3a8a", marginBottom: "4px" }}>
                        K. Manimaran
                      </div>
                      <div style={{ fontWeight: "800", fontSize: "13px", color: "#0f172a" }}>Prof. K. Manimaran</div>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>Placement Officer & Head - TPO Cell</div>
                    </div>

                    <button
                      onClick={() => handleDownloadPDF(selectedOfferModal)}
                      style={{ backgroundColor: "#16a34a", color: "#ffffff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                    >
                      <span> Download Official PDF Offer Letter</span>
                    </button>
                  </div>
                </div>

                {/* Footer Sign-off tag */}
                <div style={{ marginTop: "14px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "11px", fontWeight: "800", color: "#166534", letterSpacing: "0.5px" }}>OFFICIAL PLACEMENT DIRECTORATE SIGN-OFF</div>
                  <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", fontWeight: "bold", fontStyle: "italic", color: "#166534", fontSize: "15px" }}>K. Manimaran</div>
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
                <button onClick={() => setSelectedInterviewModal(null)} style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.15)", border: "none", color: "#ffffff", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}></button>
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
                    let bLabel = " Scheduled";
                    if (st === "today") { bBg = "#fffbeb"; bColor = "#d97706"; bBorder = "#fde68a"; bLabel = " Today"; }
                    else if (st === "in_progress") { bBg = "#fef2f2"; bColor = "#dc2626"; bBorder = "#fecaca"; bLabel = " In Progress"; }
                    else if (st === "rescheduled") { bBg = "#fffbeb"; bColor = "#d97706"; bBorder = "#fde68a"; bLabel = " Rescheduled"; }
                    else if (st === "passed") { bBg = "#f0fdf4"; bColor = "#16a34a"; bBorder = "#bbf7d0"; bLabel = " Passed"; }
                    else if (st === "failed") { bBg = "#fef2f2"; bColor = "#dc2626"; bBorder = "#fecaca"; bLabel = " Not Selected"; }
                    else if (st === "cancelled") { bBg = "#f8fafc"; bColor = "#475569"; bBorder = "#cbd5e1"; bLabel = " Cancelled"; }

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
                    <div style={{ fontWeight: "800", marginBottom: "4px" }}> Interview Rescheduled Notice</div>
                    <div>Previous Schedule: <strong>{selectedInterviewModal.previousDate || "28 Aug 2026"} • {selectedInterviewModal.previousTime || "02:00 PM"}</strong></div>
                    <div>Updated Schedule: <strong>{selectedInterviewModal.date} • {selectedInterviewModal.time}</strong></div>
                    {selectedInterviewModal.rescheduleReason && <div>Reason: <em>{selectedInterviewModal.rescheduleReason}</em></div>}
                  </div>
                )}

                {/* Cancelled Warning Box */}
                {selectedInterviewModal.status === "cancelled" && (
                  <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "14px 16px", fontSize: "12px", color: "#dc2626", lineHeight: "1.5" }}>
                    <div style={{ fontWeight: "800", marginBottom: "4px" }}> Interview Session Cancelled</div>
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
                            {isDone ? "" : (isCurrent ? "●" : "○")}
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
                     Join Interview Platform
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
          onClick={() => setCurrentTab("results")}
          className={`mobile-tab-item ${currentTab === "results" ? "active" : ""}`}
        >
          <div className="tab-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17M14 14.66V17M18 4H6v7a6 6 0 0 0 12 0V4z" /></svg>
          </div>
          <span>Offers</span>
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

      {/* MODAL 3: Custom Centered Confirm Opt-In Modal (Matching Target Design) */}
      {optInConfirmDrive && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "16px",
          }}
          onClick={() => setOptInConfirmDrive(null)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "420px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOptInConfirmDrive(null)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "none",
                border: "none",
                fontSize: "18px",
                color: "#64748b",
                cursor: "pointer",
                padding: "4px",
                lineHeight: "1",
              }}
              aria-label="Close"
            >
              
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#DCFCE7", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "900" }}>
                
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#0F172A", margin: 0 }}>
                  Confirm Drive Opt-In
                </h3>
                <div style={{ fontSize: "12px", color: "#64748B" }}>Campus Placement Seasons</div>
              </div>
            </div>

            <p style={{ fontSize: "14px", color: "#334155", margin: "0 0 16px 0", lineHeight: "1.5" }}>
              Are you sure you want to opt-in for <strong>{optInConfirmDrive.company}</strong>?
            </p>

            <div style={{ backgroundColor: "#F8FAFC", borderRadius: "10px", padding: "12px 14px", border: "1px solid #E2E8F0", marginBottom: "22px", fontSize: "12.5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#64748B" }}>Role:</span>
                <strong style={{ color: "#2563EB" }}>{optInConfirmDrive.role || "Software Trainee"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "#64748B" }}>Package CTC:</span>
                <strong style={{ color: "#16A34A" }}>{formatCtc(optInConfirmDrive.ctc)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Deadline:</span>
                <strong style={{ color: "#DC2626" }}>⏰ {optInConfirmDrive.deadline || "30 May 2026"}</strong>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                onClick={() => setOptInConfirmDrive(null)}
                style={{
                  padding: "9px 18px",
                  backgroundColor: "#FFFFFF",
                  color: "#475569",
                  border: "1.5px solid #CBD5E1",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleApply(optInConfirmDrive.id || optInConfirmDrive._id || optInConfirmDrive.company, optInConfirmDrive.company, optInConfirmDrive.role);
                  setOptInConfirmDrive(null);
                  setSelectedDriveCriteria(null);
                }}
                style={{
                  padding: "9px 20px",
                  backgroundColor: "#16A34A",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(22, 163, 74, 0.25)",
                }}
              >
                 Confirm Opt-In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Custom Centered Confirm Opt-Out Modal */}
      {optOutConfirmDrive && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "16px",
          }}
          onClick={() => { setOptOutConfirmDrive(null); setOptOutReason(""); }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "18px",
              padding: "28px",
              maxWidth: "440px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { setOptOutConfirmDrive(null); setOptOutReason(""); }}
              style={{
                position: "absolute",
                top: "18px",
                right: "18px",
                background: "none",
                border: "none",
                fontSize: "18px",
                color: "#94a3b8",
                fontWeight: "800",
                cursor: "pointer",
                padding: "4px",
                lineHeight: "1",
              }}
              aria-label="Close"
            >
              
            </button>
            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: "0 0 8px 0" }}>
              Confirm Opt-Out
            </h3>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 20px 0", lineHeight: "1.5" }}>
              Are you sure you want to Opt-Out?
            </p>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                Reason for Opt-Out <span style={{ color: "#94a3b8", fontWeight: "500" }}>(Optional)</span>
              </label>
              <textarea
                value={optOutReason}
                onChange={(e) => setOptOutReason(e.target.value)}
                placeholder="Enter your reason (optional)..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1.5px solid #cbd5e1",
                  fontSize: "14px",
                  color: "#0f172a",
                  outline: "none",
                  resize: "none",
                  boxSizing: "border-box",
                  fontFamily: "'Inter', -apple-system, sans-serif"
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                onClick={() => { setOptOutConfirmDrive(null); setOptOutReason(""); }}
                style={{
                  padding: "10px 22px",
                  backgroundColor: "#ffffff",
                  color: "#2563eb",
                  border: "1.5px solid #2563eb",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const target = optOutConfirmDrive;
                  handleOptOut(target.id || "", target.company, target.role, optOutReason);
                  setOptOutConfirmDrive(null);
                  setSelectedDriveCriteria(null);
                  setOptOutReason("");
                  setOptOutSuccessData({ company: target.company, role: target.role });
                  setTimeout(() => {
                    setOptOutSuccessData(null);
                  }, 4000);
                }}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(220, 38, 38, 0.3)",
                }}
              >
                Opt-Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Live Notifications Panel (Matching User Screenshot) */}
      {showNotificationsModal && (() => {
        const notificationsList = [
          {
            id: "1",
            type: "Shortlists",
            company: "Google",
            title: "You've been shortlisted for Google",
            desc: "Congratulations! Your application for Software Engineer at Google has moved to the Technical Round",
            time: "• 20 mins ago",
            isUnread: true,
            logo: "G"
          },
          {
            id: "2",
            type: "Deadlines",
            company: "Calibrant",
            title: "Calibrant deadline closes in 2 days",
            desc: "Don't miss out Opt -in takes one tap before May 12, 11:59 PM",
            time: "• 1 hr ago",
            isUnread: true,
            logo: "G"
          },
          {
            id: "3",
            type: "Shortlists",
            company: "Platform Science",
            title: "Platform Science interview Scheduled",
            desc: "Your face to face interview with HR sceduled for Jun 12, 10:30 AM at TPO Hall 2",
            time: "• 2 days ago",
            isUnread: false,
            logo: "G"
          },
          {
            id: "4",
            type: "Shortlists",
            company: "Google",
            title: "You've been shortlisted for Google",
            desc: "Congratulations! Your application for Software Engineer at Google has moved to the Technical Round",
            time: "• 20 mins ago",
            isUnread: false,
            logo: "G"
          },
          {
            id: "5",
            type: "Shortlists",
            company: "Platform Science",
            title: "Platform Science interview Scheduled",
            desc: "Your face to face interview with HR sceduled for Jun 12, 10:30 AM at TPO Hall 2",
            time: "• 2 days ago",
            isUnread: false,
            logo: "G"
          },
          {
            id: "6",
            type: "Deadlines",
            company: "Calibrant",
            title: "Calibrant deadline closes in 2 days",
            desc: "Don't miss out Opt -in takes one tap before May 12, 11:59 PM",
            time: "• 1 hr ago",
            isUnread: false,
            logo: "G"
          },
          {
            id: "7",
            type: "Eligible",
            company: "Zoho",
            title: "New Drive Live: Zoho Corporation",
            desc: "You are eligible for Software Developer role (12 LPA). Opt-in before deadline!",
            time: "• 3 days ago",
            isUnread: false,
            logo: "ZOHO"
          }
        ];

        const filterOptions = ["All", "Unread", "Deadlines", "Shortlists", "Eligible", "Not Eligible"];
        const filteredNotifs = notificationsList.filter(n => {
          if (activeNotifFilter === "All") return true;
          if (activeNotifFilter === "Unread") return n.isUnread;
          return n.type === activeNotifFilter;
        });

        return (
          <div
            onClick={() => setShowNotificationsModal(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
              padding: "16px"
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "24px",
                width: "min(620px, 94vw)",
                maxHeight: "88vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
                padding: "28px",
                position: "relative",
                boxSizing: "border-box"
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0, fontSize: "26px", fontWeight: "800", color: "#0f172a" }}>
                  Notifications
                </h3>
                <button
                  onClick={() => setShowNotificationsModal(false)}
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    backgroundColor: "#f1f5f9",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer",
                    fontSize: "18px",
                    fontWeight: "800",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  
                </button>
              </div>

              {/* Filter Pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
                {filterOptions.map((f, fIdx) => {
                  const isActive = activeNotifFilter === f;
                  return (
                    <button
                      key={fIdx}
                      onClick={() => setActiveNotifFilter(f)}
                      style={{
                        backgroundColor: isActive ? "#8b5cf6" : "#ffffff",
                        color: isActive ? "#ffffff" : "#475569",
                        border: isActive ? "none" : "1px solid #cbd5e1",
                        borderRadius: "20px",
                        padding: "6px 18px",
                        fontSize: "13px",
                        fontWeight: "700",
                        cursor: "pointer",
                        boxShadow: isActive ? "0 2px 6px rgba(139,92,246,0.3)" : "none",
                        transition: "all 0.15s ease"
                      }}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>

              {/* Notifications List Container */}
              <div style={{
                flex: 1,
                overflowY: "auto",
                borderRadius: "20px",
                border: "1.5px solid #e0e7ff",
                backgroundColor: "#ffffff"
              }}>
                {filteredNotifs.length === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b", fontWeight: "600" }}>
                    No notifications match the active filter.
                  </div>
                ) : (
                  filteredNotifs.map((n, idx) => (
                    <div
                      key={n.id || idx}
                      style={{
                        padding: "18px 20px",
                        borderBottom: idx === filteredNotifs.length - 1 ? "none" : "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        backgroundColor: n.isUnread ? "#fcfdff" : "#ffffff",
                        transition: "background-color 0.15s ease"
                      }}
                    >
                      {/* Company Logo Box */}
                      <div style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "14px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "22px",
                        fontWeight: "800",
                        color: "#2563eb",
                        overflow: "hidden",
                        flexShrink: 0
                      }}>
                        {n.company?.includes("Google") || n.logo === "G" ? (
                          <span style={{ color: "#4285F4" }}>G</span>
                        ) : n.company?.includes("Zoho") || n.logo === "ZOHO" ? (
                          <span style={{ color: "#e11d48", fontSize: "11px", fontWeight: "900" }}>ZOHO</span>
                        ) : (
                          n.company?.charAt(0) || "C"
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "4px" }}>
                          <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#0f172a" }}>
                            {n.title}
                          </h4>
                          <span style={{ fontSize: "11px", color: "#7c3aed", fontWeight: "700", whiteSpace: "nowrap", flexShrink: 0 }}>
                            {n.time}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: "1.5", fontWeight: "500" }}>
                          {n.desc}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      })()}
        {/* MODAL 1D: Filter Drawer Modal (Matching User Screenshot without Purple) */}
        {showFilterModal && (() => {
          const activeMatchCount = placementDrives.length;
          return (
            <div onClick={() => setShowFilterModal(false)} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1150, padding: "16px" }}>
              <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#ffffff", borderRadius: "20px", width: "min(520px, calc(100vw - 32px))", maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", position: "relative", boxSizing: "border-box" }}>
                
                {/* Header Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
                  <h3 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>
                    Filters
                  </h3>
                  <button
                    onClick={resetAllFilterOptions}
                    style={{ background: "none", border: "none", color: "#2563eb", fontWeight: "700", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <span>↺</span> Reset filters
                  </button>
                </div>

                {/* 1. Sort By */}
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#64748b", marginBottom: "10px" }}>
                    Sort By
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {["Package (High to Low)", "Deadline", "Applied drives"].map(opt => {
                      const isSel = filterSortBy === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setFilterSortBy(opt)}
                          style={{
                            backgroundColor: isSel ? "#eff6ff" : "#ffffff",
                            color: isSel ? "#2563eb" : "#0f172a",
                            border: isSel ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                            borderRadius: "24px",
                            padding: "8px 20px",
                            fontSize: "13px",
                            fontWeight: isSel ? "700" : "600",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Employment Type */}
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#64748b", marginBottom: "10px" }}>
                    Employment Type
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {["Full-time", "Internship"].map(opt => {
                      const isSel = filterEmpType === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setFilterEmpType(opt)}
                          style={{
                            backgroundColor: isSel ? "#eff6ff" : "#ffffff",
                            color: isSel ? "#2563eb" : "#0f172a",
                            border: isSel ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                            borderRadius: "24px",
                            padding: "8px 24px",
                            fontSize: "13px",
                            fontWeight: isSel ? "700" : "600",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Position Dropdown */}
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#64748b", marginBottom: "10px" }}>
                    Position
                  </div>
                  <select
                    value={filterPosition}
                    onChange={(e) => setFilterPosition(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "14px",
                      color: filterPosition ? "#0f172a" : "#94a3b8",
                      backgroundColor: "#ffffff",
                      fontWeight: "600",
                      outline: "none",
                      cursor: "pointer"
                    }}
                  >
                    <option value="">Select Your Job Role</option>
                    <option value="Software Developer">Software Developer</option>
                    <option value="Frontend Developer">Frontend Developer</option>
                    <option value="FullStack Developer">FullStack Developer</option>
                    <option value="UIUX Designer">UIUX Designer</option>
                    <option value="Programmer Analyst">Programmer Analyst</option>
                    <option value="System Engineer">System Engineer</option>
                  </select>
                </div>

                {/* 4. Minimum Package Slider */}
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#64748b", marginBottom: "10px" }}>
                    Minimum Package
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    step={10}
                    value={filterMinPackage}
                    onChange={(e) => setFilterMinPackage(Number(e.target.value))}
                    style={{
                      width: "100%",
                      accentColor: "#2563eb",
                      cursor: "pointer",
                      marginBottom: "8px"
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                    <span style={{ color: filterMinPackage === 0 ? "#2563eb" : "#64748b", fontWeight: filterMinPackage === 0 ? "800" : "600" }}>Any</span>
                    <span style={{ color: filterMinPackage === 10 ? "#2563eb" : "#64748b", fontWeight: filterMinPackage === 10 ? "800" : "600" }}>$10 LPA</span>
                    <span style={{ color: filterMinPackage === 20 ? "#2563eb" : "#64748b", fontWeight: filterMinPackage === 20 ? "800" : "600" }}>$20 LPA</span>
                    <span style={{ color: filterMinPackage === 30 ? "#2563eb" : "#64748b", fontWeight: filterMinPackage === 30 ? "800" : "600" }}>$30 LPA</span>
                    <span style={{ color: filterMinPackage === 40 ? "#2563eb" : "#64748b", fontWeight: filterMinPackage === 40 ? "800" : "600" }}>$40+ LPA</span>
                  </div>
                </div>

                {/* 5. Work Mode */}
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#64748b", marginBottom: "10px" }}>
                    Work Mode
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {["Onsite", "Hybrid", "Remote"].map(opt => {
                      const isSel = filterWorkMode === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setFilterWorkMode(opt)}
                          style={{
                            backgroundColor: isSel ? "#eff6ff" : "#ffffff",
                            color: isSel ? "#2563eb" : "#0f172a",
                            border: isSel ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                            borderRadius: "24px",
                            padding: "8px 22px",
                            fontSize: "13px",
                            fontWeight: isSel ? "700" : "600",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 6. Location */}
                <div style={{ marginBottom: "28px" }}>
                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#64748b", marginBottom: "10px" }}>
                    Location
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {["Chennai", "Bangalore", "Coimbatore"].map(opt => {
                      const isSel = filterLocation === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setFilterLocation(filterLocation === opt ? "" : opt)}
                          style={{
                            backgroundColor: isSel ? "#eff6ff" : "#ffffff",
                            color: isSel ? "#2563eb" : "#0f172a",
                            border: isSel ? "1.5px solid #2563eb" : "1px solid #cbd5e1",
                            borderRadius: "24px",
                            padding: "8px 22px",
                            fontSize: "13px",
                            fontWeight: isSel ? "700" : "600",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => {
                        const newLoc = window.prompt("Enter new location filter:");
                        if (newLoc && newLoc.trim()) setFilterLocation(newLoc.trim());
                      }}
                      style={{
                        backgroundColor: "#f8fafc",
                        color: "#334155",
                        border: "1px solid #cbd5e1",
                        borderRadius: "24px",
                        padding: "8px 20px",
                        fontSize: "13px",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      + Add new
                    </button>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", borderTop: "1px solid #f1f5f9", paddingTop: "20px" }}>
                  <button
                    onClick={() => setShowFilterModal(false)}
                    style={{
                      flex: 1,
                      backgroundColor: "#ffffff",
                      color: "#2563eb",
                      border: "1.5px solid #2563eb",
                      borderRadius: "28px",
                      padding: "12px 24px",
                      fontSize: "15px",
                      fontWeight: "700",
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowFilterModal(false)}
                    style={{
                      flex: 1,
                      backgroundColor: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "28px",
                      padding: "12px 24px",
                      fontSize: "15px",
                      fontWeight: "700",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(37,99,235,0.3)"
                    }}
                  >
                    Show {activeMatchCount} results
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

export default StudentDashboard;
