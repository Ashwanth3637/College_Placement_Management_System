import React, { useEffect, useMemo, useState } from "react";
import ClearDataButton from "../../components/ClearDataButton";
import { API_BASE_URL } from "../../config/api";

interface StudentProfileProps {
    user: {
        id?: string;
        _id?: string;
        name: string;
        email: string;
        role: string;
    };
    onProfileSaved?: () => void;
}

const StudentProfile: React.FC<StudentProfileProps> = ({
    user,
    onProfileSaved,
}) => {
    const userId = user.id || user._id || "";

    // Helper to get local cached profile data
    const getCachedProfile = () => {
        const userEmailKey = (user?.email || "").toLowerCase().trim();
        try {
            const savedStr =
                (userId ? localStorage.getItem(`cpms_pending_profile_${userId}`) : null) ||
                (userEmailKey ? localStorage.getItem(`cpms_pending_profile_${userEmailKey}`) : null) ||
                (userId ? localStorage.getItem(`cpms_profile_${userId}`) : null) ||
                (userEmailKey ? localStorage.getItem(`cpms_profile_${userEmailKey}`) : null) ||
                localStorage.getItem("cpms_profile_global");
            if (savedStr) {
                return JSON.parse(savedStr);
            }
        } catch (e) {}
        return null;
    };

    const cachedProfileData = getCachedProfile();

    const initialName = (() => {
        if (cachedProfileData?.personal?.fullName) return cachedProfileData.personal.fullName;
        const saved = localStorage.getItem(`cpms_student_fullname_${userId}`) || localStorage.getItem("cpms_student_fullname");
        if (saved && saved.trim()) return saved.trim();
        if (user?.name) {
            const cleaned = user.name.split('@')[0].replace(/[0-9]/g, "").trim();
            if (cleaned) return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
            return user.name;
        }
        return "";
    })();

    // Main Form & Profile State
    const userEmailKey = (user?.email || userId || "").toLowerCase().trim();
    const [profileImage, setProfileImage] = useState<string | null>(() => {
        return (
            localStorage.getItem(`cpms_student_avatar_${userId}`) ||
            localStorage.getItem(`cpms_student_avatar_${userEmailKey}`) ||
            cachedProfileData?.personal?.profileImage ||
            null
        );
    });

    const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setProfileImage(result);
                try {
                    localStorage.setItem(`cpms_student_avatar_${userId}`, result);
                    localStorage.setItem(`cpms_student_avatar_${userEmailKey}`, result);
                    window.dispatchEvent(new Event("cpms_profile_updated"));
                    window.dispatchEvent(new Event("storage"));
                } catch (err) {}
                setAlert({ type: "success", text: "✓ Profile photo updated successfully!" });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveProfileImage = () => {
        setProfileImage(null);
        try {
            localStorage.removeItem(`cpms_student_avatar_${userId}`);
            localStorage.removeItem(`cpms_student_avatar_${userEmailKey}`);
            window.dispatchEvent(new Event("cpms_profile_updated"));
            window.dispatchEvent(new Event("storage"));
        } catch (err) {}
        setAlert({ type: "success", text: "Profile photo removed." });
    };

    const [fullName, setFullName] = useState(initialName);
    const [email, setEmail] = useState(user.email || "");
    const [phone, setPhone] = useState(cachedProfileData?.personal?.phone || "");
    const [department, setDepartment] = useState(cachedProfileData?.personal?.department || "");
    const [registerNumber, setRegisterNumber] = useState(cachedProfileData?.personal?.registerNumber || "");
    const [location, setLocation] = useState(cachedProfileData?.personal?.location || "Erode");
    const [gender, setGender] = useState(cachedProfileData?.personal?.gender || "Female");
    const [dob, setDob] = useState(cachedProfileData?.personal?.dob || "12-11-2006");

    // Academic Details
    const [tenthPercentage, setTenthPercentage] = useState<number | "">(cachedProfileData?.academic?.tenthPercentage ?? "");
    const [twelfthPercentage, setTwelfthPercentage] = useState<number | "">(cachedProfileData?.academic?.twelfthPercentage ?? "");
    const [diplomaInstitution, setDiplomaInstitution] = useState<string>(cachedProfileData?.academic?.diplomaInstitution || "");
    const [diplomaSpecialization, setDiplomaSpecialization] = useState<string>(cachedProfileData?.academic?.diplomaSpecialization || "");
    const [schoolName, setSchoolName] = useState<string>(cachedProfileData?.academic?.schoolName || "");
    const [cgpa, setCgpa] = useState<number | "">(cachedProfileData?.academic?.cgpa ?? "");
    const [backlogs, setBacklogs] = useState<number>(cachedProfileData?.academic?.backlogs ?? 0);
    const [backlogHistory, setBacklogHistory] = useState<number>(cachedProfileData?.academic?.backlogHistory ?? 0);
    const [graduationYear, setGraduationYear] = useState<number | "">(cachedProfileData?.academic?.graduationYear ?? "");
    const [currentSemester, setCurrentSemester] = useState<string>(cachedProfileData?.academic?.currentSemester || "");
    const [ugInstitution, setUgInstitution] = useState<string>(cachedProfileData?.academic?.ugInstitution || "");
    const [ugProgram, setUgProgram] = useState<string>(cachedProfileData?.academic?.ugProgram || "");
    const [ugSpecialization, setUgSpecialization] = useState<string>(cachedProfileData?.academic?.ugSpecialization || "");
    const [appNumber, setAppNumber] = useState<string>(cachedProfileData?.academic?.appNumber || "");

    // PG Details
    const [pgInstitution, setPgInstitution] = useState<string>(cachedProfileData?.academic?.pgInstitution || "");
    const [pgProgram, setPgProgram] = useState<string>(cachedProfileData?.academic?.pgProgram || "");
    const [pgSpecialization, setPgSpecialization] = useState<string>(cachedProfileData?.academic?.pgSpecialization || "");
    const [pgGradYear, setPgGradYear] = useState<number | "">(cachedProfileData?.academic?.pgGradYear ?? "");
    const [pgCgpa, setPgCgpa] = useState<number | "">(cachedProfileData?.academic?.pgCgpa ?? "");
    const [pgSemester, setPgSemester] = useState<string>(cachedProfileData?.academic?.pgSemester || "");

    // Professional Details
    const [skills, setSkills] = useState(
        Array.isArray(cachedProfileData?.professional?.skills)
            ? cachedProfileData.professional.skills.join(", ")
            : cachedProfileData?.professional?.skills || ""
    );
    const [certifications, setCertifications] = useState(
        Array.isArray(cachedProfileData?.professional?.certifications)
            ? cachedProfileData.professional.certifications.join(", ")
            : cachedProfileData?.professional?.certifications || ""
    );
    const [projects, setProjects] = useState(
        Array.isArray(cachedProfileData?.professional?.projects)
            ? cachedProfileData.professional.projects.join(", ")
            : cachedProfileData?.professional?.projects || ""
    );
    const [internship, setInternship] = useState(
        Array.isArray(cachedProfileData?.professional?.internships)
            ? cachedProfileData.professional.internships.join(", ")
            : cachedProfileData?.professional?.internships || ""
    );

    // Resume State
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [resumeName, setResumeName] = useState(cachedProfileData?.professional?.resumeName || "");
    const [resumeUrl, setResumeUrl] = useState<string | null>(
        cachedProfileData?.professional?.resumeUrl ? `${API_BASE_URL}${cachedProfileData.professional.resumeUrl}` : null
    );
    const [resumeUploadDate, setResumeUploadDate] = useState<string>(cachedProfileData?.professional?.resumeUploadDate || "Feb 12, 2026");
    const [resumePreviewUrl, setResumePreviewUrl] = useState<string | null>(null);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [showResumeMenu, setShowResumeMenu] = useState(false);

    // Navigation & Tab States
    const [activeMainTab, setActiveMainTab] = useState<"academic" | "resume" | "driveSummary">("academic");
    const [activeAcademicSubtab, setActiveAcademicSubtab] = useState<"schools" | "ug" | "pg">("schools");

    // Edit Modals
    const [showUpdateCourseModal, setShowUpdateCourseModal] = useState(false);
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

    // Keyboard Event Listener to close popups on pressing ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" || e.key === "Esc") {
                setShowUpdateCourseModal(false);
                setShowEditProfileModal(false);
                setShowResumeModal(false);
                setShowResumeMenu(false);
                setShowDeleteConfirmModal(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Outside Click Listener to close 3-dot resume menu automatically
    useEffect(() => {
        if (!showResumeMenu) return;
        const handleOutsideClick = (e: MouseEvent) => {
            const container = document.getElementById("resume-menu-container");
            if (container && !container.contains(e.target as Node)) {
                setShowResumeMenu(false);
            }
        };
        window.addEventListener("click", handleOutsideClick);
        return () => window.removeEventListener("click", handleOutsideClick);
    }, [showResumeMenu]);

    // Saving & Loading
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [initialProfile, setInitialProfile] = useState<any>(cachedProfileData || null);
    const [alert, setAlert] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Auto-dismiss alert banner after 4 seconds
    useEffect(() => {
        if (!alert) return;
        const timer = setTimeout(() => {
            setAlert(null);
        }, 4000);
        return () => clearTimeout(timer);
    }, [alert]);

    // Completion Percentage Calculation
    const completionPercentage = useMemo(() => {
        const fields = [
            Boolean(phone && phone.trim()),
            Boolean(department && department.trim()),
            Boolean(registerNumber && registerNumber.trim()),
            tenthPercentage !== "" && tenthPercentage !== null && tenthPercentage !== undefined,
            twelfthPercentage !== "" && twelfthPercentage !== null && twelfthPercentage !== undefined,
            cgpa !== "" && cgpa !== null && cgpa !== undefined,
            Boolean(graduationYear),
            Boolean(ugInstitution && ugInstitution.trim()),
            Boolean(ugSpecialization && ugSpecialization.trim()),
            Boolean(skills && skills.trim()),
            Boolean(projects && projects.trim()),
            Boolean((resumeName && resumeName.trim()) || resumeUrl || resumeFile),
        ];
        const completed = fields.filter(Boolean).length;
        return Math.min(100, Math.max(0, Math.round((completed / fields.length) * 100)));
    }, [
        phone,
        department,
        registerNumber,
        tenthPercentage,
        twelfthPercentage,
        cgpa,
        graduationYear,
        ugInstitution,
        ugSpecialization,
        skills,
        projects,
        resumeName,
        resumeUrl,
        resumeFile,
    ]);

    // Dynamic Title based on calculated percentage
    const completionTitle = useMemo(() => {
        if (completionPercentage === 100) return "Your Profile is 100% Complete ! 🎉";
        if (completionPercentage >= 75) return "Your Profile is Almost Complete !";
        if (completionPercentage >= 40) return "Your Profile is Halfway There !";
        return "Complete Your Profile !";
    }, [completionPercentage]);

    const completionSubtitleText = useMemo(() => {
        if (completionPercentage === 100) return "Great job! Your profile is ready for placement drives.";
        return "Complete your profile to get better opportunities";
    }, [completionPercentage]);

    // Fetch Profile From Server & Hydrate LocalStorage Cache
    useEffect(() => {
        const fetchProfile = async () => {
            // Step 1: Load from cached localStorage FIRST to guarantee instant rendering & zero data loss on refresh
            const cached = getCachedProfile();
            if (cached) {
                if (cached.personal) {
                    if (cached.personal.fullName) setFullName(cached.personal.fullName);
                    if (cached.personal.email) setEmail(cached.personal.email);
                    if (cached.personal.phone) setPhone(cached.personal.phone);
                    if (cached.personal.department) setDepartment(cached.personal.department);
                    if (cached.personal.registerNumber) setRegisterNumber(cached.personal.registerNumber);
                    if (cached.personal.location) setLocation(cached.personal.location);
                    if (cached.personal.gender) setGender(cached.personal.gender);
                    if (cached.personal.dob) setDob(cached.personal.dob);
                }
                if (cached.academic) {
                    if (cached.academic.tenthPercentage !== undefined && cached.academic.tenthPercentage !== "") setTenthPercentage(cached.academic.tenthPercentage);
                    if (cached.academic.twelfthPercentage !== undefined && cached.academic.twelfthPercentage !== "") setTwelfthPercentage(cached.academic.twelfthPercentage);
                    if (cached.academic.schoolName) setSchoolName(cached.academic.schoolName);
                    if (cached.academic.diplomaInstitution) setDiplomaInstitution(cached.academic.diplomaInstitution);
                    if (cached.academic.diplomaSpecialization) setDiplomaSpecialization(cached.academic.diplomaSpecialization);
                    if (cached.academic.cgpa !== undefined && cached.academic.cgpa !== "") setCgpa(cached.academic.cgpa);
                    if (cached.academic.backlogs !== undefined) setBacklogs(Number(cached.academic.backlogs));
                    if (cached.academic.backlogHistory !== undefined) setBacklogHistory(Number(cached.academic.backlogHistory));
                    if (cached.academic.graduationYear) setGraduationYear(Number(cached.academic.graduationYear));
                    if (cached.academic.currentSemester) setCurrentSemester(cached.academic.currentSemester);
                    if (cached.academic.ugInstitution) setUgInstitution(cached.academic.ugInstitution);
                    if (cached.academic.ugProgram) setUgProgram(cached.academic.ugProgram);
                    if (cached.academic.ugSpecialization) setUgSpecialization(cached.academic.ugSpecialization);
                    if (cached.academic.appNumber) setAppNumber(cached.academic.appNumber);
                    if (cached.academic.pgInstitution) setPgInstitution(cached.academic.pgInstitution);
                    if (cached.academic.pgProgram) setPgProgram(cached.academic.pgProgram === "B.E." ? "M.E." : cached.academic.pgProgram);
                    if (cached.academic.pgSpecialization) setPgSpecialization(cached.academic.pgSpecialization);
                    if (cached.academic.pgGradYear) setPgGradYear(Number(cached.academic.pgGradYear));
                    if (cached.academic.pgCgpa !== undefined && cached.academic.pgCgpa !== "") setPgCgpa(cached.academic.pgCgpa);
                    if (cached.academic.pgSemester) setPgSemester(cached.academic.pgSemester);
                }
                if (cached.professional) {
                    if (cached.professional.skills) setSkills(Array.isArray(cached.professional.skills) ? cached.professional.skills.join(", ") : cached.professional.skills);
                    if (cached.professional.certifications) setCertifications(Array.isArray(cached.professional.certifications) ? cached.professional.certifications.join(", ") : cached.professional.certifications);
                    if (cached.professional.projects) setProjects(Array.isArray(cached.professional.projects) ? cached.professional.projects.join(", ") : cached.professional.projects);
                    if (cached.professional.internships) setInternship(Array.isArray(cached.professional.internships) ? cached.professional.internships.join(", ") : cached.professional.internships);
                    if (cached.professional.resumeName) setResumeName(cached.professional.resumeName);
                    if (cached.professional.resumeUrl) setResumeUrl(cached.professional.resumeUrl);
                    if (cached.professional.resumeUploadDate) setResumeUploadDate(cached.professional.resumeUploadDate);
                }
            }

            // Step 2: Fetch backend profile and safely update non-empty values
            if (!userId && !user?.email) return;
            try {
                const lookupKey = userId || (user?.email || "").toLowerCase().trim() || "student";
                const res = await fetch(
                    `${API_BASE_URL}/api/student/profile/${encodeURIComponent(lookupKey)}?email=${encodeURIComponent((user?.email || "").toLowerCase().trim())}`
                );
                if (!res.ok) return;
                const data = await res.json();
                if (data) {
                    const student = data;
                    if (student.user) {
                        if (student.user.name) setFullName(student.user.name);
                        if (student.user.email) setEmail(student.user.email);
                    }
                    if (student.personal) {
                        if (student.personal.phone) setPhone(student.personal.phone);
                        if (student.personal.department) setDepartment(student.personal.department);
                        if (student.personal.registerNumber) setRegisterNumber(student.personal.registerNumber);
                        if (student.personal.location) setLocation(student.personal.location);
                        if (student.personal.gender) setGender(student.personal.gender);
                        if (student.personal.dob) setDob(student.personal.dob);
                    }
                    if (student.academic) {
                        if (student.academic.tenthPercentage) setTenthPercentage(Number(student.academic.tenthPercentage));
                        if (student.academic.twelfthPercentage) setTwelfthPercentage(Number(student.academic.twelfthPercentage));
                        if (student.academic.schoolName) setSchoolName(student.academic.schoolName);
                        if (student.academic.diplomaInstitution) setDiplomaInstitution(student.academic.diplomaInstitution);
                        if (student.academic.diplomaSpecialization) setDiplomaSpecialization(student.academic.diplomaSpecialization);
                        if (student.academic.cgpa) setCgpa(Number(student.academic.cgpa));
                        if (student.academic.backlogs !== undefined) setBacklogs(Number(student.academic.backlogs));
                        if (student.academic.backlogHistory !== undefined) setBacklogHistory(Number(student.academic.backlogHistory));
                        if (student.academic.graduationYear) setGraduationYear(Number(student.academic.graduationYear));
                        if (student.academic.currentSemester) setCurrentSemester(student.academic.currentSemester);
                        if (student.academic.ugInstitution) setUgInstitution(student.academic.ugInstitution);
                        if (student.academic.ugProgram) setUgProgram(student.academic.ugProgram);
                        if (student.academic.ugSpecialization) setUgSpecialization(student.academic.ugSpecialization);
                        if (student.academic.appNumber) setAppNumber(student.academic.appNumber);
                        if (student.academic.pgInstitution) setPgInstitution(student.academic.pgInstitution);
                        if (student.academic.pgProgram) setPgProgram(student.academic.pgProgram === "B.E." ? "M.E." : student.academic.pgProgram);
                        if (student.academic.pgSpecialization) setPgSpecialization(student.academic.pgSpecialization);
                        if (student.academic.pgGradYear) setPgGradYear(Number(student.academic.pgGradYear));
                        if (student.academic.pgCgpa) setPgCgpa(Number(student.academic.pgCgpa));
                        if (student.academic.pgSemester) setPgSemester(student.academic.pgSemester);
                    }
                    if (student.professional) {
                        if (student.professional.skills) setSkills(Array.isArray(student.professional.skills) ? student.professional.skills.join(", ") : student.professional.skills);
                        if (student.professional.certifications) setCertifications(Array.isArray(student.professional.certifications) ? student.professional.certifications.join(", ") : student.professional.certifications);
                        if (student.professional.projects) setProjects(Array.isArray(student.professional.projects) ? student.professional.projects.join(", ") : student.professional.projects);
                        if (student.professional.internships) setInternship(Array.isArray(student.professional.internships) ? student.professional.internships.join(", ") : student.professional.internships);
                        if (student.professional.resumeName) setResumeName(student.professional.resumeName);
                        if (student.professional.resumeUrl) {
                            const formattedUrl = student.professional.resumeUrl.startsWith("http")
                                ? student.professional.resumeUrl
                                : `${API_BASE_URL}${student.professional.resumeUrl}`;
                            setResumeUrl(formattedUrl);
                        }
                    }

                    // Save complete merged profile to cache so initial render on next refresh is 100% accurate
                    const syncedPayload = {
                        user: {
                            name: student.user?.name || cached?.user?.name || "",
                            email: student.user?.email || cached?.user?.email || ""
                        },
                        personal: {
                            ...(cached?.personal || {}),
                            ...(student.personal || {})
                        },
                        academic: {
                            ...(cached?.academic || {}),
                            ...(student.academic || {})
                        },
                        professional: {
                            ...(cached?.professional || {}),
                            ...(student.professional || {})
                        }
                    };

                    const uKey = (user?.email || userId || "").toLowerCase().trim();
                    if (userId) {
                        localStorage.setItem(`cpms_profile_${userId}`, JSON.stringify(syncedPayload));
                        localStorage.setItem(`cpms_pending_profile_${userId}`, JSON.stringify(syncedPayload));
                    }
                    if (uKey) {
                        localStorage.setItem(`cpms_profile_${uKey}`, JSON.stringify(syncedPayload));
                        localStorage.setItem(`cpms_pending_profile_${uKey}`, JSON.stringify(syncedPayload));
                    }
                    localStorage.setItem("cpms_profile_global", JSON.stringify(syncedPayload));
                }
            } catch (err) {
                console.error("Fetch profile error:", err);
            }
        };
        fetchProfile();
    }, [userId, user?.email]);

    // Handle File Selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setResumeFile(file);
            setResumeName(file.name);
            setResumeUploadDate(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
            const localPreview = URL.createObjectURL(file);
            setResumePreviewUrl(localPreview);
            setAlert({ type: "success", text: `Selected resume file: ${file.name}` });
        }
    };

    // Download Resume
    const handleDownloadResume = () => {
        if (resumeUrl) {
            const link = document.createElement("a");
            link.href = resumeUrl;
            link.download = resumeName || "Resume.pdf";
            link.target = "_blank";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }
        if (resumePreviewUrl) {
            const link = document.createElement("a");
            link.href = resumePreviewUrl;
            link.download = resumeName || "Resume.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }
        window.alert(`Downloading ${resumeName}`);
    };

    // View Resume Modal
    const handleViewResume = () => {
        setShowResumeModal(true);
    };

    // Delete Resume Modal trigger
    const handleDeleteResume = () => {
        setShowResumeMenu(false);
        setShowDeleteConfirmModal(true);
    };

    // Execute Delete Resume
    const confirmDeleteResume = () => {
        setResumeFile(null);
        setResumeName("");
        setResumeUrl(null);
        setResumePreviewUrl(null);
        setShowResumeMenu(false);
        setShowDeleteConfirmModal(false);
        setAlert({ type: "success", text: "Resume deleted successfully." });
    };

    // Submit Profile Changes
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) {
            setAlert({ type: "error", text: "User ID missing. Please log in again." });
            return;
        }

        if (showUpdateCourseModal && activeAcademicSubtab === "schools") {
            if (tenthPercentage === "" || tenthPercentage === null || tenthPercentage === undefined) {
                setAlert({ type: "error", text: "10th / SSLC Mark (%) is a mandatory field." });
                return;
            }
            if (twelfthPercentage === "" || twelfthPercentage === null || twelfthPercentage === undefined) {
                setAlert({ type: "error", text: "12th / HSC Mark (%) is a mandatory field." });
                return;
            }
        }

        if (showUpdateCourseModal && activeAcademicSubtab === "ug") {
            if (!ugInstitution || !ugInstitution.trim()) {
                setAlert({ type: "error", text: "UG Institution is a mandatory field." });
                return;
            }
            if (!appNumber || !appNumber.trim()) {
                setAlert({ type: "error", text: "Application number is a mandatory field." });
                return;
            }
            if (!registerNumber || !registerNumber.trim()) {
                setAlert({ type: "error", text: "Register number is a mandatory field." });
                return;
            }
            if (cgpa === "" || cgpa === null || cgpa === undefined) {
                setAlert({ type: "error", text: "UG Mark (CGPA) is a mandatory field." });
                return;
            }
            if (!ugProgram || !ugProgram.trim()) {
                setAlert({ type: "error", text: "UG Program is a mandatory field." });
                return;
            }
            if (!ugSpecialization || !ugSpecialization.trim()) {
                setAlert({ type: "error", text: "UG Specialization is a mandatory field." });
                return;
            }
            if (!currentSemester || !currentSemester.trim()) {
                setAlert({ type: "error", text: "Current Semester is a mandatory field." });
                return;
            }
            if (!graduationYear) {
                setAlert({ type: "error", text: "UG Year of Pass is a mandatory field." });
                return;
            }
        }

        // PG Details are optional for Undergraduate (B.Tech / B.E.) candidates
        if (showUpdateCourseModal && activeAcademicSubtab === "pg") {
            // Only validate basic app/register number if provided
            if (registerNumber && !registerNumber.trim()) {
                setAlert({ type: "error", text: "Register number cannot be empty spaces." });
                return;
            }
        }

        setSaving(true);
        setAlert(null);

        try {
            const formData = new FormData();
            formData.append("userId", userId);
            formData.append("personal", JSON.stringify({ fullName, email, phone, department, registerNumber, location, gender, dob }));
            formData.append("email", email);
            formData.append("fullName", fullName);
            formData.append("academic", JSON.stringify({
                tenthPercentage: tenthPercentage !== "" ? Number(tenthPercentage) : "",
                twelfthPercentage: twelfthPercentage !== "" ? Number(twelfthPercentage) : "",
                schoolName: schoolName.trim(),
                diplomaInstitution: diplomaInstitution.trim(),
                diplomaSpecialization: diplomaSpecialization.trim(),
                cgpa: cgpa !== "" ? Number(cgpa) : "",
                backlogs: Number(backlogs),
                backlogHistory: Number(backlogHistory),
                graduationYear: Number(graduationYear),
                currentSemester,
                ugInstitution: ugInstitution.trim(),
                ugProgram: ugProgram.trim(),
                ugSpecialization: ugSpecialization.trim(),
                appNumber: appNumber.trim(),
                pgInstitution: pgInstitution.trim(),
                pgProgram: pgProgram.trim(),
                pgSpecialization: pgSpecialization.trim(),
                pgGradYear: Number(pgGradYear),
                pgCgpa: pgCgpa !== "" ? Number(pgCgpa) : "",
                pgSemester
            }));
            formData.append("professional", JSON.stringify({
                skills: skills.split(",").map((s: string) => s.trim()).filter(Boolean),
                certifications: certifications.split(",").map((s: string) => s.trim()).filter(Boolean),
                projects: projects.split(",").map((s: string) => s.trim()).filter(Boolean),
                internships: internship.split(",").map((s: string) => s.trim()).filter(Boolean),
                resumeName: resumeName || "",
            }));

            if (resumeFile) {
                formData.append("resume", resumeFile);
            }

            const profilePayload = {
                user: { name: fullName.trim(), email: email.trim() },
                personal: {
                    fullName: fullName.trim(),
                    email: email.trim(),
                    phone: phone.trim(),
                    department: department.trim(),
                    registerNumber: registerNumber.trim(),
                    location: location.trim(),
                    gender,
                    dob
                },
                academic: {
                    tenthPercentage: tenthPercentage !== "" ? Number(tenthPercentage) : "",
                    twelfthPercentage: twelfthPercentage !== "" ? Number(twelfthPercentage) : "",
                    schoolName: schoolName.trim(),
                    diplomaInstitution: diplomaInstitution.trim(),
                    diplomaSpecialization: diplomaSpecialization.trim(),
                    cgpa: cgpa !== "" ? Number(cgpa) : "",
                    backlogs: Number(backlogs),
                    backlogHistory: Number(backlogHistory),
                    graduationYear: Number(graduationYear),
                    currentSemester,
                    ugInstitution: ugInstitution.trim(),
                    ugProgram: ugProgram.trim(),
                    ugSpecialization: ugSpecialization.trim(),
                    appNumber: appNumber.trim(),
                    pgInstitution: pgInstitution.trim(),
                    pgProgram: pgProgram.trim(),
                    pgSpecialization: pgSpecialization.trim(),
                    pgGradYear: Number(pgGradYear),
                    pgCgpa: pgCgpa !== "" ? Number(pgCgpa) : "",
                    pgSemester
                },
                professional: {
                    skills: skills.split(",").map((s: string) => s.trim()).filter(Boolean),
                    certifications: certifications.split(",").map((s: string) => s.trim()).filter(Boolean),
                    projects: projects.split(",").map((s: string) => s.trim()).filter(Boolean),
                    internships: internship.split(",").map((s: string) => s.trim()).filter(Boolean),
                    resumeName: resumeName || (resumeFile ? resumeFile.name : ""),
                    resumeUrl: resumeUrl || "",
                    resumeUploadDate: resumeUploadDate || ""
                }
            };

            const userKey = (user.email || userId || "").toLowerCase().trim();
            if (userId) {
                localStorage.setItem(`cpms_profile_${userId}`, JSON.stringify(profilePayload));
                localStorage.setItem(`cpms_pending_profile_${userId}`, JSON.stringify(profilePayload));
                localStorage.setItem(`cpms_student_fullname_${userId}`, fullName.trim());
            }
            if (userKey) {
                localStorage.setItem(`cpms_profile_${userKey}`, JSON.stringify(profilePayload));
                localStorage.setItem(`cpms_pending_profile_${userKey}`, JSON.stringify(profilePayload));
                localStorage.setItem(`cpms_student_fullname_${userKey}`, fullName.trim());
            }
            localStorage.setItem("cpms_profile_global", JSON.stringify(profilePayload));
            localStorage.setItem("cpms_student_fullname", fullName.trim());

            try {
                const res = await fetch(`${API_BASE_URL}/api/student/profile`, {
                    method: "POST",
                    body: formData,
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.student?.professional?.resumeUrl) {
                        setResumeUrl(`${API_BASE_URL}${data.student.professional.resumeUrl}`);
                    }
                }
            } catch (err) {
                console.warn("Backend save notice:", err);
            }

            setAlert({ type: "success", text: "✓ Student profile updated successfully!" });
            setShowUpdateCourseModal(false);
            setShowEditProfileModal(false);
            if (onProfileSaved) onProfileSaved();
            window.dispatchEvent(new Event("cpms_profile_updated"));
        } catch (error: any) {
            setAlert({ type: "error", text: error.message || "Failed to save profile." });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={styles.container}>

            {/* Alert Message Banner */}
            {alert && (
                <div
                    style={{
                        ...(alert.type === "success" ? styles.successBox : styles.errorBox),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                    }}
                >
                    <span>{alert.text}</span>
                    <button
                        onClick={() => setAlert(null)}
                        style={{
                            background: "none",
                            border: "none",
                            color: alert.type === "success" ? "#166534" : "#991b1b",
                            fontSize: "16px",
                            fontWeight: "800",
                            cursor: "pointer",
                            padding: "0 4px",
                            lineHeight: "1",
                        }}
                        title="Dismiss"
                        aria-label="Dismiss Alert"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* =========================================================================
                1. TOP PROFILE HEADER & COMPLETION CARD
               ========================================================================= */}
            {/* Header Section: Avatar, Profile Details, Completion Ring */}
            <div style={styles.headerGrid}>
                {/* Profile Card */}
                <div style={styles.profileMainCard}>
                    <div className="profile-card-content">
                        {/* Avatar & Name Top Row */}
                        <div className="profile-card-top-row">
                            <div style={{ ...styles.avatarContainer, flexShrink: 0 }}>
                                <label style={styles.avatarCircleLabel} title="Click to upload profile photo">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProfileImageUpload}
                                        style={{ display: "none" }}
                                    />
                                    {profileImage ? (
                                        <img
                                            src={profileImage}
                                            alt="Student Avatar"
                                            style={styles.avatarImg}
                                        />
                                    ) : (
                                        <div style={{ width: "100%", height: "100%", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="#94a3b8">
                                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                            </svg>
                                        </div>
                                    )}
                                    <div style={styles.avatarCameraBadge} title="Upload photo">
                                        📷
                                    </div>
                                </label>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                <h2 style={styles.studentName}>{fullName}</h2>
                                <button
                                    onClick={() => setShowEditProfileModal(true)}
                                    style={styles.editBtn}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    Edit
                                </button>
                            </div>
                        </div>

                        {/* Profile Info Details Grid */}
                        <div className="profile-details-grid" style={styles.detailsGrid}>
                            <div style={styles.infoItem}>
                                <span style={styles.infoIcon}>📍</span>
                                <span>{location || "—"}</span>
                            </div>
                            <div style={styles.infoItem}>
                                <span style={styles.infoIcon}>📞</span>
                                <span>{phone || "—"}</span>
                            </div>
                            <div style={styles.infoItem}>
                                <span style={styles.infoIcon}>♀️</span>
                                <span>{gender || "—"}</span>
                            </div>
                            <div style={styles.infoItem}>
                                <span style={styles.infoIcon}>✉️</span>
                                <span style={{ wordBreak: "break-all" }}>{email || "—"}</span>
                            </div>
                            <div style={styles.infoItem}>
                                <span style={styles.infoIcon}>🎂</span>
                                <span>{dob || "—"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Completion Card */}
                <div className="profile-completion-card" style={styles.completionCard}>
                    <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                        <h3 style={styles.completionTitle}>{completionTitle}</h3>
                        <p style={styles.completionSubtitle}>
                            {completionSubtitleText}
                        </p>
                        <div style={styles.completionFooter}>
                            <span>✨ To Get High Just Tap !</span>
                        </div>
                    </div>

                    {/* Blue Circular Progress Indicator */}
                    <div style={{ ...styles.progressRingWrapper, flexShrink: 0 }}>
                        <svg width="76" height="76" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" stroke="#eff6ff" strokeWidth="10" fill="transparent" />
                            <circle
                                cx="50"
                                cy="50"
                                r="40"
                                stroke="#2563eb"
                                strokeWidth="10"
                                strokeDasharray={251.2}
                                strokeDashoffset={251.2 - (251.2 * completionPercentage) / 100}
                                strokeLinecap="round"
                                fill="transparent"
                                transform="rotate(-90 50 50)"
                            />
                        </svg>
                        <div style={styles.progressRingText}>{completionPercentage}%</div>
                    </div>
                </div>
            </div>

            {/* =========================================================================
                2. PROFILE NAVIGATION TABS (Academic Details, Resume, Drive Summary)
               ========================================================================= */}
            <div style={styles.mainTabsContainer}>
                <button
                    onClick={() => setActiveMainTab("academic")}
                    style={{
                        ...styles.mainTabBtn,
                        ...(activeMainTab === "academic" ? styles.mainTabActive : styles.mainTabInactive),
                    }}
                >
                    Academic Details
                </button>
                <button
                    onClick={() => setActiveMainTab("resume")}
                    style={{
                        ...styles.mainTabBtn,
                        ...(activeMainTab === "resume" ? styles.mainTabActive : styles.mainTabInactive),
                    }}
                >
                    Resume
                </button>
                <button
                    onClick={() => setActiveMainTab("driveSummary")}
                    style={{
                        ...styles.mainTabBtn,
                        ...(activeMainTab === "driveSummary" ? styles.mainTabActive : styles.mainTabInactive),
                    }}
                >
                    Drive Summary
                </button>
            </div>

            {/* =========================================================================
                3. TAB 1 CONTENT: ACADEMIC DETAILS
               ========================================================================= */}
            {activeMainTab === "academic" && (
                <div>
                    {/* Academic Subtabs: Schools & Diploma | UG Details | PG Details */}
                    <div style={styles.subtabsRow}>
                        <button
                            onClick={() => setActiveAcademicSubtab("schools")}
                            style={{
                                ...styles.subtabBtn,
                                ...(activeAcademicSubtab === "schools" ? styles.subtabActive : {}),
                            }}
                        >
                            Schools & Diploma
                        </button>
                        <button
                            onClick={() => setActiveAcademicSubtab("ug")}
                            style={{
                                ...styles.subtabBtn,
                                ...(activeAcademicSubtab === "ug" ? styles.subtabActive : {}),
                            }}
                        >
                            UG Details
                        </button>
                        <button
                            onClick={() => setActiveAcademicSubtab("pg")}
                            style={{
                                ...styles.subtabBtn,
                                ...(activeAcademicSubtab === "pg" ? styles.subtabActive : {}),
                            }}
                        >
                            PG Details
                        </button>
                    </div>

                    {/* Academic Info White Card */}
                    <div style={styles.whiteCard}>
                        <div style={styles.cardHeaderRow}>
                            <h3 style={styles.cardTitle}>Academic Info</h3>
                            <button
                                onClick={() => setShowUpdateCourseModal(true)}
                                style={styles.editBtn}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit
                            </button>
                        </div>

                        {/* UG Details View */}
                        {activeAcademicSubtab === "ug" && (
                            <div style={styles.infoRowList}>
                                <div style={styles.infoRow}>
                                    <span style={styles.fieldLabel}>UG Institution</span>
                                    <span style={styles.fieldValue}>{ugInstitution || "—"}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.fieldLabel}>UG Year of Pass</span>
                                    <span style={styles.fieldValue}>{graduationYear || "—"}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.fieldLabel}>Program</span>
                                    <span style={styles.fieldValue}>{ugProgram || "—"}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.fieldLabel}>UG Specialization</span>
                                    <span style={styles.fieldValue}>{ugSpecialization || "—"}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.fieldLabel}>Current Semester</span>
                                    <span style={styles.fieldValue}>{currentSemester || "—"}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.fieldLabel}>UG Mark</span>
                                    <span style={styles.fieldValue}>{cgpa || "—"}</span>
                                </div>
                            </div>
                        )}

                        {/* PG Details View */}
                        {activeAcademicSubtab === "pg" && (
                            <div style={styles.infoRowList}>
                                <div style={styles.infoRow}>
                                    <span style={styles.fieldLabel}>PG Institution</span>
                                    <span style={styles.fieldValue}>{pgInstitution || "—"}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.fieldLabel}>PG Year of Pass</span>
                                    <span style={styles.fieldValue}>{pgGradYear || "—"}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.fieldLabel}>Program</span>
                                    <span style={styles.fieldValue}>{pgProgram || "—"}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.fieldLabel}>PG Specialization</span>
                                    <span style={styles.fieldValue}>{pgSpecialization || "—"}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.fieldLabel}>Current Semester</span>
                                    <span style={styles.fieldValue}>{pgSemester || "—"}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.fieldLabel}>PG Mark</span>
                                    <span style={styles.fieldValue}>{pgCgpa || "—"}</span>
                                </div>
                            </div>
                        )}

                        {/* Schools & Diploma View */}
                        {activeAcademicSubtab === "schools" && (
                            <div style={styles.infoRowList}>
                                <div style={styles.infoRow}>
                                    <span style={styles.fieldLabel}>10th / SSLC Mark</span>
                                    <span style={styles.fieldValue}>{tenthPercentage ? `${tenthPercentage}%` : "—"}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.fieldLabel}>12th / HSC Mark</span>
                                    <span style={styles.fieldValue}>{twelfthPercentage ? `${twelfthPercentage}%` : "—"}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.fieldLabel}>School Name</span>
                                    <span style={styles.fieldValue}>{schoolName || "—"}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.fieldLabel}>Diploma Institution</span>
                                    <span style={styles.fieldValue}>{diplomaInstitution || "—"}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.fieldLabel}>Diploma Specialization</span>
                                    <span style={styles.fieldValue}>{diplomaSpecialization || "—"}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* =========================================================================
                4. TAB 2 CONTENT: RESUME PAGE
               ========================================================================= */}
            {activeMainTab === "resume" && (
                <div style={styles.whiteCard}>
                    <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#0f172a", margin: "0 0 6px 0" }}>Resume</h3>
                    <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px 0" }}>
                        Build a professional resume that helps you stand out to prospective recruiters during placement drives.
                    </p>

                    {/* Resume File Document Card */}
                    {resumeName ? (
                        <div style={{ ...styles.fileCard, position: "relative" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "calc(100% - 44px)", minWidth: 0, overflow: "hidden" }}>
                                <div style={styles.fileIconBox}>📄</div>
                                <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: "4px" }}>
                                        {resumeName}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        Uploaded on {resumeUploadDate}
                                    </div>
                                </div>
                            </div>

                            {/* Three dot actions menu anchored at TOP RIGHT corner */}
                            <div style={{ position: "absolute", top: "12px", right: "12px", zIndex: 10 }} id="resume-menu-container">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowResumeMenu((prev) => !prev);
                                    }}
                                    style={{
                                        background: "#ffffff",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "18px",
                                        color: "#2563eb",
                                        cursor: "pointer",
                                        padding: "2px 10px",
                                        borderRadius: "8px",
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                        lineHeight: "1.4"
                                    }}
                                    aria-label="Resume Options"
                                >
                                    ⋯
                                </button>
                                {showResumeMenu && (
                                    <div style={{ ...styles.dropdownMenu, top: "34px", right: 0 }} onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => {
                                                setShowResumeMenu(false);
                                                handleViewResume();
                                            }}
                                            style={styles.dropdownItem}
                                            title="View Resume"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                            <span>View Resume</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowResumeMenu(false);
                                                handleDownloadResume();
                                            }}
                                            style={styles.dropdownItem}
                                            title="Download"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                            <span>Download</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowResumeMenu(false);
                                                handleDeleteResume();
                                            }}
                                            style={{ ...styles.dropdownItem, color: "#dc2626" }}
                                            title="Delete File"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                            <span>Delete File</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={styles.uploadDropzone}>
                            <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} style={styles.hiddenFileInput} />
                            <div style={{ fontSize: "36px", marginBottom: "8px" }}>📄</div>
                            <div style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>Click or Drag PDF to Upload Resume</div>
                            <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>PDF, DOC, DOCX up to 5 MB</div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap", alignItems: "center" }}>
                        <button onClick={handleViewResume} style={{ ...styles.primaryBlueBtn, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "auto", padding: "8px 20px", fontSize: "13px" }} title="View Resume">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                            <span>View Resume</span>
                        </button>
                        <button onClick={handleDownloadResume} style={{ ...styles.secondaryBtn, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "auto", padding: "8px 20px", fontSize: "13px" }} title="Download PDF">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span>Download PDF</span>
                        </button>
                    </div>
                </div>
            )}

            {/* =========================================================================
                5. TAB 3 CONTENT: DRIVE SUMMARY
               ========================================================================= */}
            {activeMainTab === "driveSummary" && (
                <div style={{ width: "100%" }}>
                    <div className="drive-summary-grid">
                        {/* 1. Eligible */}
                        <div className="drive-stat-card" style={{ backgroundColor: "#e6f4ea" }}>
                            <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: "#0d652d", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "13px" }}>
                                ✓
                            </div>
                            <div>
                                <div style={{ fontSize: "32px", fontWeight: "800", color: "#0d652d", lineHeight: "1" }}>57</div>
                                <div style={{ fontSize: "14px", fontWeight: "600", color: "#137333", marginTop: "6px" }}>Eligible</div>
                            </div>
                        </div>

                        {/* 2. Opted-In */}
                        <div className="drive-stat-card" style={{ backgroundColor: "#ede9fe" }}>
                            <div style={{ color: "#4c1d95", display: "flex", alignItems: "center" }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="#4c1d95">
                                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                </svg>
                            </div>
                            <div>
                                <div style={{ fontSize: "32px", fontWeight: "800", color: "#4c1d95", lineHeight: "1" }}>47</div>
                                <div style={{ fontSize: "14px", fontWeight: "600", color: "#5b21b6", marginTop: "6px" }}>Opted-In</div>
                            </div>
                        </div>

                        {/* 3. Opted-Out */}
                        <div className="drive-stat-card" style={{ backgroundColor: "#fce8e6" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#7c0a0a", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "12px" }}>
                                ✕
                            </div>
                            <div>
                                <div style={{ fontSize: "32px", fontWeight: "800", color: "#7c0a0a", lineHeight: "1" }}>8</div>
                                <div style={{ fontSize: "14px", fontWeight: "600", color: "#991b1b", marginTop: "6px" }}>Opted-Out</div>
                            </div>
                        </div>

                        {/* 4. Placed */}
                        <div className="drive-stat-card" style={{ backgroundColor: "#e6f4ea" }}>
                            <div style={{ color: "#0d652d", display: "flex", alignItems: "center" }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V18H9v2h6v-2h-2v-2.1c1.95-.37 3.49-1.92 3.61-3.96C19.08 11.63 21 9.55 21 7V6c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/>
                                </svg>
                            </div>
                            <div>
                                <div style={{ fontSize: "32px", fontWeight: "800", color: "#0d652d", lineHeight: "1" }}>0</div>
                                <div style={{ fontSize: "14px", fontWeight: "600", color: "#137333", marginTop: "6px" }}>Placed</div>
                            </div>
                        </div>

                        {/* 5. Not Applied */}
                        <div className="drive-stat-card" style={{ backgroundColor: "#fef08a" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#78350f", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "12px" }}>
                                🕒
                            </div>
                            <div>
                                <div style={{ fontSize: "32px", fontWeight: "800", color: "#78350f", lineHeight: "1" }}>2</div>
                                <div style={{ fontSize: "14px", fontWeight: "600", color: "#92400e", marginTop: "6px" }}>Not Applied</div>
                            </div>
                        </div>

                        {/* 6. Not Eligible */}
                        <div className="drive-stat-card" style={{ backgroundColor: "#fce8e6" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: "2px solid #7c0a0a", color: "#7c0a0a", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "13px" }}>
                                ⃠
                            </div>
                            <div>
                                <div style={{ fontSize: "32px", fontWeight: "800", color: "#7c0a0a", lineHeight: "1" }}>32</div>
                                <div style={{ fontSize: "14px", fontWeight: "600", color: "#991b1b", marginTop: "6px" }}>Not Eligible</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================================
                6. UPDATE COURSE DETAILS FORM MODAL (Dynamic for Schools, UG, PG)
               ========================================================================= */}
            {showUpdateCourseModal && (
                <div className="cpms-modal-overlay" style={styles.modalOverlay} onClick={() => setShowUpdateCourseModal(false)}>
                    <div className="cpms-modal-content" style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className="cpms-modal-header" style={styles.modalHeader}>
                            <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#0f172a" }}>
                                {activeAcademicSubtab === "schools" && "Update School & Diploma Details"}
                                {activeAcademicSubtab === "ug" && "Update UG Details"}
                                {activeAcademicSubtab === "pg" && "Update PG Details"}
                            </h3>
                            <button onClick={() => setShowUpdateCourseModal(false)} style={styles.modalCloseBtn}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="cpms-modal-body" style={{ padding: "24px" }}>
                            {/* 1. SCHOOLS & DIPLOMA FORM */}
                            {activeAcademicSubtab === "schools" && (
                                <div style={styles.formGrid}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>
                                            10th / SSLC Mark (%) <span style={{ color: "#dc2626", fontWeight: "800" }}>*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            required
                                            value={tenthPercentage}
                                            onChange={(e) => setTenthPercentage(e.target.value === "" ? "" : Number(e.target.value))}
                                            style={styles.formInput}
                                            placeholder="e.g. 88.5"
                                        />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>
                                            12th / HSC Mark (%) <span style={{ color: "#dc2626", fontWeight: "800" }}>*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            required
                                            value={twelfthPercentage}
                                            onChange={(e) => setTwelfthPercentage(e.target.value === "" ? "" : Number(e.target.value))}
                                            style={styles.formInput}
                                            placeholder="e.g. 91.2"
                                        />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>School Name</label>
                                        <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} style={styles.formInput} />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>Diploma Institution</label>
                                        <input type="text" value={diplomaInstitution} onChange={(e) => setDiplomaInstitution(e.target.value)} style={styles.formInput} />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>Diploma Specialization</label>
                                        <input type="text" value={diplomaSpecialization} onChange={(e) => setDiplomaSpecialization(e.target.value)} style={styles.formInput} />
                                    </div>
                                </div>
                            )}

                            {/* 2. UG DETAILS FORM */}
                            {activeAcademicSubtab === "ug" && (
                                <div style={styles.formGrid}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>
                                            UG Institution <span style={{ color: "#dc2626", fontWeight: "800" }}>*</span>
                                        </label>
                                        <input type="text" required value={ugInstitution} onChange={(e) => setUgInstitution(e.target.value)} style={styles.formInput} placeholder="e.g. Kongu Engineering College" />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>
                                            Application number <span style={{ color: "#dc2626", fontWeight: "800" }}>*</span>
                                        </label>
                                        <input type="text" required value={appNumber} onChange={(e) => setAppNumber(e.target.value)} style={styles.formInput} placeholder="e.g. 7311GCEECE22" />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>
                                            UG Program <span style={{ color: "#dc2626", fontWeight: "800" }}>*</span>
                                        </label>
                                        <select value={ugProgram} onChange={(e) => setUgProgram(e.target.value)} style={styles.formSelect} required>
                                            <option value="">Select Degree</option>
                                            <option value="BTech">BTech</option>
                                            <option value="B.E.">B.E.</option>
                                            <option value="B.Sc">B.Sc</option>
                                            <option value="BCA">BCA</option>
                                        </select>
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>
                                            UG Specialization <span style={{ color: "#dc2626", fontWeight: "800" }}>*</span>
                                        </label>
                                        <input type="text" required value={ugSpecialization} onChange={(e) => setUgSpecialization(e.target.value)} style={styles.formInput} placeholder="e.g. Information Technology" />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>
                                            Register number / Roll No <span style={{ color: "#dc2626", fontWeight: "800" }}>*</span>
                                        </label>
                                        <input type="text" required value={registerNumber} onChange={(e) => setRegisterNumber(e.target.value)} style={styles.formInput} placeholder="e.g. 22CSR025" />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>
                                            Current Semester <span style={{ color: "#dc2626", fontWeight: "800" }}>*</span>
                                        </label>
                                        <select value={currentSemester} onChange={(e) => setCurrentSemester(e.target.value)} style={styles.formSelect} required>
                                            <option value="">Select Semester</option>
                                            <option value="Semester 1">Semester 1</option>
                                            <option value="Semester 2">Semester 2</option>
                                            <option value="Semester 3">Semester 3</option>
                                            <option value="Semester 4">Semester 4</option>
                                            <option value="Semester 5">Semester 5</option>
                                            <option value="Semester 6">Semester 6</option>
                                            <option value="Semester 7">Semester 7</option>
                                            <option value="Semester 8">Semester 8</option>
                                        </select>
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>
                                            UG Year of Pass <span style={{ color: "#dc2626", fontWeight: "800" }}>*</span>
                                        </label>
                                        <input type="number" required value={graduationYear} onChange={(e) => setGraduationYear(Number(e.target.value))} style={styles.formInput} placeholder="e.g. 2026" />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>
                                            UG Mark (CGPA) <span style={{ color: "#dc2626", fontWeight: "800" }}>*</span>
                                        </label>
                                        <input type="number" step="0.01" max="10" required value={cgpa} onChange={(e) => setCgpa(e.target.value === "" ? "" : Number(e.target.value))} style={styles.formInput} placeholder="e.g. 8.5" />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>Current Backlogs</label>
                                        <input type="number" value={backlogs} onChange={(e) => setBacklogs(Number(e.target.value))} style={styles.formInput} />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>Backlog History</label>
                                        <input type="number" value={backlogHistory} onChange={(e) => setBacklogHistory(Number(e.target.value))} style={styles.formInput} />
                                    </div>
                                </div>
                            )}

                            {/* 3. PG DETAILS FORM (OPTIONAL FOR B.TECH / UG CANDIDATES) */}
                            {activeAcademicSubtab === "pg" && (
                                <div>
                                    <div style={{ marginBottom: "18px", padding: "12px 16px", backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "10px", fontSize: "13px", color: "#0369a1", display: "flex", alignItems: "center", gap: "10px" }}>
                                        <span style={{ fontSize: "16px" }}>ℹ️</span>
                                        <div>
                                            <strong>Optional Section:</strong> Postgraduate (PG) details are optional for B.E. / B.Tech (Undergraduate) students. Only fill this section if you are currently pursuing or holding a Postgraduate degree (M.E. / M.Tech / MCA / M.Sc).
                                        </div>
                                    </div>
                                    <div style={styles.formGrid}>
                                        <div style={styles.formGroup}>
                                            <label style={styles.formLabel}>
                                                PG Institution <span style={{ color: "#64748b", fontWeight: "500", fontSize: "12px" }}>(Optional)</span>
                                            </label>
                                            <input type="text" value={pgInstitution} onChange={(e) => setPgInstitution(e.target.value)} style={styles.formInput} placeholder="e.g. Kongu Engineering College" />
                                        </div>
                                        <div style={styles.formGroup}>
                                            <label style={styles.formLabel}>
                                                Application number <span style={{ color: "#64748b", fontWeight: "500", fontSize: "12px" }}>(Optional)</span>
                                            </label>
                                            <input type="text" value={appNumber} onChange={(e) => setAppNumber(e.target.value)} style={styles.formInput} placeholder="e.g. 7311GCEECE22" />
                                        </div>
                                        <div style={styles.formGroup}>
                                            <label style={styles.formLabel}>
                                                PG Program <span style={{ color: "#64748b", fontWeight: "500", fontSize: "12px" }}>(Optional)</span>
                                            </label>
                                            <select value={pgProgram} onChange={(e) => setPgProgram(e.target.value)} style={styles.formSelect}>
                                                <option value="">Select Degree</option>
                                                <option value="M.E.">M.E.</option>
                                                <option value="M.Tech">M.Tech</option>
                                                <option value="MCA">MCA</option>
                                                <option value="M.Sc">M.Sc</option>
                                            </select>
                                        </div>
                                        <div style={styles.formGroup}>
                                            <label style={styles.formLabel}>
                                                PG Specialization <span style={{ color: "#64748b", fontWeight: "500", fontSize: "12px" }}>(Optional)</span>
                                            </label>
                                            <input type="text" value={pgSpecialization} onChange={(e) => setPgSpecialization(e.target.value)} style={styles.formInput} placeholder="e.g. Information Technology" />
                                        </div>
                                        <div style={styles.formGroup}>
                                            <label style={styles.formLabel}>
                                                Register number / Roll No <span style={{ color: "#64748b", fontWeight: "500", fontSize: "12px" }}>(Optional)</span>
                                            </label>
                                            <input type="text" value={registerNumber} onChange={(e) => setRegisterNumber(e.target.value)} style={styles.formInput} placeholder="e.g. 22CSR025" />
                                        </div>
                                        <div style={styles.formGroup}>
                                            <label style={styles.formLabel}>
                                                Current Semester <span style={{ color: "#64748b", fontWeight: "500", fontSize: "12px" }}>(Optional)</span>
                                            </label>
                                            <select value={pgSemester} onChange={(e) => setPgSemester(e.target.value)} style={styles.formSelect}>
                                                <option value="">Select Semester</option>
                                                <option value="Semester 1">Semester 1</option>
                                                <option value="Semester 2">Semester 2</option>
                                                <option value="Semester 3">Semester 3</option>
                                                <option value="Semester 4">Semester 4</option>
                                                <option value="Semester 5">Semester 5</option>
                                                <option value="Semester 6">Semester 6</option>
                                                <option value="Semester 7">Semester 7</option>
                                                <option value="Semester 8">Semester 8</option>
                                            </select>
                                        </div>
                                        <div style={styles.formGroup}>
                                            <label style={styles.formLabel}>
                                                PG Year of Pass <span style={{ color: "#64748b", fontWeight: "500", fontSize: "12px" }}>(Optional)</span>
                                            </label>
                                            <input type="number" value={pgGradYear} onChange={(e) => setPgGradYear(Number(e.target.value))} style={styles.formInput} placeholder="e.g. 2027" />
                                        </div>
                                        <div style={styles.formGroup}>
                                            <label style={styles.formLabel}>
                                                PG Mark (CGPA) <span style={{ color: "#64748b", fontWeight: "500", fontSize: "12px" }}>(Optional)</span>
                                            </label>
                                            <input type="number" step="0.01" max="10" value={pgCgpa} onChange={(e) => setPgCgpa(e.target.value === "" ? "" : Number(e.target.value))} style={styles.formInput} placeholder="e.g. 7.8" />
                                        </div>
                                        <div style={styles.formGroup}>
                                            <label style={styles.formLabel}>Current Backlogs</label>
                                            <input type="number" value={backlogs} onChange={(e) => setBacklogs(Number(e.target.value))} style={styles.formInput} />
                                        </div>
                                        <div style={styles.formGroup}>
                                            <label style={styles.formLabel}>Backlog History</label>
                                            <input type="number" value={backlogHistory} onChange={(e) => setBacklogHistory(Number(e.target.value))} style={styles.formInput} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={styles.formActions}>
                                <button type="button" onClick={() => setShowUpdateCourseModal(false)} style={styles.modalSecondaryBtn}>
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} style={styles.modalPrimaryBtn}>
                                    {saving ? "Saving..." : "Submit Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Full Profile Modal */}
            {showEditProfileModal && (
                <div className="cpms-modal-overlay" style={styles.modalOverlay} onClick={() => setShowEditProfileModal(false)}>
                    <div className="cpms-modal-content" style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className="cpms-modal-header" style={styles.modalHeader}>
                            <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#0f172a" }}>Edit Profile Details</h3>
                            <button onClick={() => setShowEditProfileModal(false)} style={styles.modalCloseBtn}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="cpms-modal-body" style={{ padding: "24px" }}>
                            {/* Profile Photo Uploader */}
                            <div style={{ backgroundColor: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px dashed #cbd5e1", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                    <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: "#f1f5f9", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", border: "2px solid #cbd5e1" }}>
                                        {profileImage ? (
                                            <img src={profileImage} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                        ) : (
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="#94a3b8">
                                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Profile Photo</div>
                                        <div style={{ fontSize: "12px", color: "#64748b" }}>Upload JPG, PNG or WEBP image</div>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <label style={{ padding: "8px 16px", backgroundColor: "#2563eb", color: "#ffffff", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                        📷 Upload Photo
                                        <input type="file" accept="image/*" onChange={handleProfileImageUpload} style={{ display: "none" }} />
                                    </label>
                                    {profileImage && (
                                        <button type="button" onClick={handleRemoveProfileImage} style={{ padding: "8px 14px", backgroundColor: "#ffffff", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div style={styles.formGrid}>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Full Name</label>
                                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} style={styles.formInput} />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Email</label>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.formInput} />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Phone</label>
                                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={styles.formInput} />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Location</label>
                                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} style={styles.formInput} />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Gender</label>
                                    <select value={gender} onChange={(e) => setGender(e.target.value)} style={styles.formSelect}>
                                        <option value="Female">Female</option>
                                        <option value="Male">Male</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Date of Birth</label>
                                    <input type="text" value={dob} onChange={(e) => setDob(e.target.value)} style={styles.formInput} />
                                </div>
                            </div>
                            <div style={styles.formActions}>
                                <button type="button" onClick={() => setShowEditProfileModal(false)} style={styles.modalSecondaryBtn}>Cancel</button>
                                <button type="submit" disabled={saving} style={styles.modalPrimaryBtn}>{saving ? "Saving..." : "Submit Changes"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Resume Preview Modal */}
            {showResumeModal && (
                <div style={styles.modalOverlay} onClick={() => setShowResumeModal(false)}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>📄 Resume Preview - {resumeName}</h3>
                            <button onClick={() => setShowResumeModal(false)} style={styles.modalCloseBtn}>✕ Close</button>
                        </div>
                        <div style={{ padding: "20px" }}>
                            {resumePreviewUrl || resumeUrl ? (
                                <iframe src={resumePreviewUrl || resumeUrl || ""} title="Resume Preview" style={{ width: "100%", height: "520px", border: "none", borderRadius: "8px" }} />
                            ) : (
                                <div style={{ padding: "30px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                                    <h3>{fullName}</h3>
                                    <p>{email} | {phone} | {ugSpecialization}</p>
                                    <p>CGPA: {cgpa} | Graduation: {graduationYear}</p>
                                    <p>Skills: {skills}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Centered Delete Resume Confirmation Modal (Matching Design) */}
            {showDeleteConfirmModal && (
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
                    onClick={() => setShowDeleteConfirmModal(false)}
                >
                    <div
                        style={{
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            padding: "28px",
                            maxWidth: "440px",
                            width: "100%",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                            position: "relative",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowDeleteConfirmModal(false)}
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
                            ✕
                        </button>
                        <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", margin: "0 0 12px 0" }}>
                            Delete Resume
                        </h3>
                        <p style={{ fontSize: "15px", color: "#475569", margin: "0 0 28px 0", lineHeight: "1.5" }}>
                            Are you sure you want to delete the uploaded resume?
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "14px" }}>
                            <button
                                onClick={() => setShowDeleteConfirmModal(false)}
                                style={{
                                    padding: "10px 22px",
                                    backgroundColor: "#ffffff",
                                    color: "#0f172a",
                                    border: "1.5px solid #cbd5e1",
                                    borderRadius: "10px",
                                    fontSize: "14px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteResume}
                                style={{
                                    padding: "10px 22px",
                                    backgroundColor: "#dc2626",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "10px",
                                    fontSize: "14px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                    boxShadow: "0 2px 4px rgba(220, 38, 38, 0.2)",
                                }}
                            >
                                Delete File
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// =========================================================================
// STYLES OBJECT (Strict Navy + Blue + White + Light Gray Palette)
// =========================================================================
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
    },

    headerGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "20px",
        alignItems: "stretch",
    },

    profileMainCard: {
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        padding: "24px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        boxSizing: "border-box",
    },

    avatarContainer: {
        position: "relative",
    },

    avatarCircleLabel: {
        width: "88px",
        height: "88px",
        borderRadius: "50%",
        border: "3px solid #2563eb",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#eff6ff",
        cursor: "pointer",
        position: "relative",
        boxShadow: "0 4px 10px rgba(37,99,235,0.2)",
    },

    avatarInitials: {
        width: "100%",
        height: "100%",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "800",
        fontSize: "32px",
    },

    avatarCameraBadge: {
        position: "absolute",
        bottom: "2px",
        right: "2px",
        width: "26px",
        height: "26px",
        borderRadius: "50%",
        backgroundColor: "#ffffff",
        border: "2px solid #2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
    },

    avatarImg: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },

    studentName: {
        fontSize: "22px",
        fontWeight: "800",
        color: "#0f172a",
        margin: 0,
    },

    editBtn: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        border: "none",
        borderRadius: "20px",
        padding: "6px 16px",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.15s ease",
        flexShrink: 0,
    },

    detailsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "10px 16px",
        fontSize: "13px",
        color: "#475569",
    },

    infoItem: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },

    infoIcon: {
        fontSize: "14px",
    },

    completionCard: {
        backgroundColor: "#2563eb",
        backgroundImage: "linear-gradient(135deg, #1e40af 0%, #2563eb 100%)",
        borderRadius: "16px",
        padding: "24px",
        color: "#ffffff",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "nowrap",
        boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.2)",
        boxSizing: "border-box",
    },

    completionTitle: {
        margin: "0 0 6px 0",
        fontSize: "18px",
        fontWeight: "800",
        color: "#ffffff",
    },

    completionSubtitle: {
        margin: "0 0 12px 0",
        fontSize: "13px",
        color: "#dbeafe",
        lineHeight: "1.4",
    },

    completionFooter: {
        fontSize: "11px",
        fontWeight: "700",
        color: "#eff6ff",
        letterSpacing: "0.5px",
    },

    progressRingWrapper: {
        position: "relative",
        width: "76px",
        height: "76px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },

    progressRingText: {
        position: "absolute",
        fontSize: "18px",
        fontWeight: "800",
        color: "#ffffff",
    },

    mainTabsContainer: {
        display: "flex",
        gap: "8px",
        borderBottom: "1px solid #e2e8f0",
        paddingBottom: "12px",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        paddingRight: "16px",
        scrollbarWidth: "none",
        flexWrap: "nowrap",
    },

    mainTabBtn: {
        padding: "8px 16px",
        borderRadius: "24px",
        fontSize: "13px",
        fontWeight: "700",
        cursor: "pointer",
        border: "1px solid transparent",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
        flexShrink: 0,
    },

    mainTabActive: {
        backgroundColor: "#2563eb",
        color: "#ffffff",
        borderColor: "#2563eb",
        boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
    },

    mainTabInactive: {
        backgroundColor: "#ffffff",
        color: "#64748b",
        borderColor: "#e2e8f0",
    },

    subtabsRow: {
        display: "flex",
        gap: "16px",
        marginBottom: "16px",
        borderBottom: "2px solid #e2e8f0",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        paddingRight: "16px",
        scrollbarWidth: "none",
        flexWrap: "nowrap",
    },

    subtabBtn: {
        padding: "8px 4px 10px 4px",
        background: "none",
        border: "none",
        fontSize: "13px",
        fontWeight: "700",
        color: "#64748b",
        cursor: "pointer",
        position: "relative",
        marginBottom: "-2px",
        whiteSpace: "nowrap",
        flexShrink: 0,
    },

    subtabActive: {
        color: "#2563eb",
        borderBottom: "3px solid #2563eb",
    },

    whiteCard: {
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        padding: "24px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
    },

    cardHeaderRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
    },

    cardTitle: {
        margin: 0,
        fontSize: "18px",
        fontWeight: "800",
        color: "#0f172a",
    },

    infoRowList: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        paddingTop: "8px",
    },

    infoRow: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid #f8fafc",
        gap: "4px 16px",
    },

    fieldLabel: {
        fontSize: "14px",
        color: "#64748b",
        fontWeight: "500",
        minWidth: "140px",
        flex: "1 1 140px",
    },

    fieldValue: {
        fontSize: "14px",
        color: "#0f172a",
        fontWeight: "600",
        textAlign: "right",
        wordBreak: "break-word",
        flex: "1 1 auto",
    },

    fileCard: {
        display: "flex",
        flexDirection: "row",
        flexWrap: "nowrap",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px",
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        marginBottom: "16px",
        width: "100%",
        boxSizing: "border-box",
        gap: "12px",
    },

    fileIconBox: {
        width: "44px",
        height: "44px",
        borderRadius: "10px",
        backgroundColor: "#eff6ff",
        color: "#2563eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "22px",
        flexShrink: 0,
    },

    threeDotBtn: {
        background: "none",
        border: "none",
        fontSize: "22px",
        color: "#64748b",
        cursor: "pointer",
        padding: "4px 8px",
        borderRadius: "6px",
    },

    dropdownMenu: {
        position: "absolute",
        right: 0,
        top: "36px",
        backgroundColor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        zIndex: 10,
        minWidth: "160px",
        overflow: "hidden",
    },

    dropdownItem: {
        width: "100%",
        padding: "10px 14px",
        background: "none",
        border: "none",
        textAlign: "left",
        fontSize: "13px",
        fontWeight: "600",
        color: "#0f172a",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },

    uploadDropzone: {
        border: "2px dashed #cbd5e1",
        backgroundColor: "#f8fafc",
        borderRadius: "12px",
        padding: "32px",
        textAlign: "center",
        cursor: "pointer",
        position: "relative",
        marginBottom: "16px",
    },

    hiddenFileInput: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        opacity: 0,
        cursor: "pointer",
    },

    primaryBlueBtn: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "8px 20px",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        border: "none",
        borderRadius: "24px",
        fontWeight: "700",
        fontSize: "13px",
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(37,99,235,0.2)",
        width: "auto",
    },

    secondaryBtn: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "8px 20px",
        backgroundColor: "#ffffff",
        color: "#2563eb",
        border: "1px solid #2563eb",
        borderRadius: "24px",
        fontWeight: "700",
        fontSize: "13px",
        cursor: "pointer",
        width: "auto",
    },

    modalPrimaryBtn: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 22px",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        border: "none",
        borderRadius: "24px",
        fontWeight: "700",
        fontSize: "14px",
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(37,99,235,0.2)",
        boxSizing: "border-box",
    },

    modalSecondaryBtn: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px 22px",
        backgroundColor: "#ffffff",
        color: "#2563eb",
        border: "1px solid #2563eb",
        borderRadius: "24px",
        fontWeight: "700",
        fontSize: "14px",
        cursor: "pointer",
        boxSizing: "border-box",
    },

    statsCardsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "16px",
    },

    statCard: {
        backgroundColor: "#ffffff",
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
        padding: "20px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
        position: "relative",
        overflow: "hidden",
    },

    statTitle: {
        fontSize: "14px",
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: "8px",
    },

    statNumber: {
        fontSize: "32px",
        fontWeight: "800",
        color: "#0f172a",
    },

    statBar: {
        height: "4px",
        width: "100%",
        position: "absolute",
        bottom: 0,
        left: 0,
    },

    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
    },

    modalContent: {
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        maxWidth: "680px",
        width: "100%",
        maxHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        boxSizing: "border-box",
        margin: "auto",
    },

    modalHeader: {
        padding: "18px 24px",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#f8fafc",
        flexShrink: 0,
    },

    modalCloseBtn: {
        border: "none",
        background: "none",
        fontSize: "18px",
        color: "#64748b",
        cursor: "pointer",
        padding: "4px",
    },

    formGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "16px",
    },

    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },

    formLabel: {
        fontSize: "13px",
        fontWeight: "700",
        color: "#0f172a",
    },

    formInput: {
        padding: "10px 14px",
        borderRadius: "8px",
        border: "1px solid #cbd5e1",
        fontSize: "14px",
        outline: "none",
        width: "100%",
        boxSizing: "border-box",
        backgroundColor: "#ffffff",
    },

    formSelect: {
        padding: "10px 14px",
        borderRadius: "8px",
        border: "1px solid #cbd5e1",
        fontSize: "14px",
        outline: "none",
        width: "100%",
        boxSizing: "border-box",
        backgroundColor: "#ffffff",
    },

    formActions: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "12px",
        marginTop: "20px",
        paddingTop: "16px",
        borderTop: "1px solid #e2e8f0",
        width: "100%",
        boxSizing: "border-box",
    },

    successBox: {
        backgroundColor: "#f0fdf4",
        color: "#166534",
        borderLeft: "4px solid #16a34a",
        padding: "12px 16px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "600",
    },

    errorBox: {
        backgroundColor: "#fef2f2",
        color: "#dc2626",
        borderLeft: "4px solid #dc2626",
        padding: "12px 16px",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: "600",
    },
};

export default StudentProfile;