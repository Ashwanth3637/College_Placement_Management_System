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
                1. TOP EXECUTIVE UNIFIED PROFILE SHOWCASE CARD
               ========================================================================= */}
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0", padding: "24px 28px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "24px" }}>
                {/* Left Section: Avatar, Name, Verified Badge, Reg No, Contact Pills */}
                <div style={{ display: "flex", alignItems: "center", gap: "22px", flexWrap: "wrap", flex: "1 1 500px" }}>
                    {/* Avatar with Status Ring */}
                    <div style={{ position: "relative", width: "90px", height: "90px", flexShrink: 0 }}>
                        <label style={{ width: "90px", height: "90px", borderRadius: "50%", border: "3px solid #0B3D91", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#EFF6FF", cursor: "pointer", position: "relative", boxShadow: "0 4px 12px rgba(11, 61, 145, 0.15)" }} title="Click to upload profile photo">
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
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                <div style={{ width: "100%", height: "100%", backgroundColor: "#E6EEFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <svg width="46" height="46" viewBox="0 0 24 24" fill="#0B3D91">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                </div>
                            )}
                            <div style={{ position: "absolute", bottom: "2px", right: "2px", width: "26px", height: "26px", borderRadius: "50%", backgroundColor: "#FFFFFF", border: "2px solid #0B3D91", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.15)" }} title="Upload photo">
                                📷
                            </div>
                        </label>
                    </div>

                    {/* Name, Badges, and Details in Clean Rows */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, minWidth: "260px" }}>
                        {/* Row 1: Name + Verified Pill */}
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0F172A", margin: 0, letterSpacing: "-0.3px", whiteSpace: "nowrap" }}>
                                {fullName || "Ashwanth S"}
                            </h2>
                            <span style={{
                                backgroundColor: "#DCFCE7",
                                color: "#15803D",
                                padding: "4px 12px",
                                borderRadius: "20px",
                                fontSize: "11.5px",
                                fontWeight: "700",
                                border: "1px solid #86EFAC",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px"
                            }}>
                                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#16A34A" }}></span>
                                Verified Student
                            </span>
                        </div>

                        {/* Row 2: Reg No & Department */}
                        <div style={{ fontSize: "13.5px", color: "#334155", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", fontWeight: 600 }}>
                            <span>🎓 Reg No: <strong style={{ color: "#0F172A" }}>{registerNumber || "717822P101"}</strong></span>
                            <span style={{ color: "#CBD5E1" }}>•</span>
                            <span>🏛️ Dept: <strong style={{ color: "#0F172A" }}>{department || "Computer Science and Engineering"}</strong></span>
                        </div>

                        {/* Row 3: Personal & Contact Info Line */}
                        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", fontSize: "12.5px", color: "#64748B", paddingTop: "4px" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                <span>✉️</span>
                                <span style={{ color: "#0F172A", fontWeight: 500 }}>{email || "ashwanth@college.edu"}</span>
                            </div>
                            <span>•</span>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                <span>📞</span>
                                <span style={{ color: "#0F172A", fontWeight: 500 }}>{phone || "+91 9876543210"}</span>
                            </div>
                            <span>•</span>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                <span>📍</span>
                                <span style={{ color: "#0F172A", fontWeight: 500 }}>{location || "Erode"}</span>
                            </div>
                            <span>•</span>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                <span>🎂</span>
                                <span style={{ color: "#0F172A", fontWeight: 500 }}>{dob || "04-12-2004"}</span>
                            </div>
                            <span>•</span>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                <span>👤</span>
                                <span style={{ color: "#0F172A", fontWeight: 500 }}>{gender || "Male"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Profile Strength Widget & Edit Profile Action */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: "240px", backgroundColor: "#F8FAFC", padding: "16px 18px", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#334155" }}>Profile Strength</span>
                        <span style={{ fontSize: "13px", fontWeight: 800, color: "#0B3D91" }}>{completionPercentage}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: "100%", height: "8px", backgroundColor: "#E2E8F0", borderRadius: "10px", overflow: "hidden" }}>
                        <div style={{ width: `${completionPercentage}%`, height: "100%", backgroundColor: "#0B3D91", borderRadius: "10px", transition: "width 0.3s ease" }}></div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "11px", color: "#64748B" }}>
                        <span style={{ color: "#16A34A", fontWeight: 700 }}>✓ Academics</span>
                        <span>•</span>
                        <span style={{ color: "#16A34A", fontWeight: 700 }}>✓ Resume</span>
                        <span>•</span>
                        <span style={{ color: "#16A34A", fontWeight: 700 }}>✓ Verified</span>
                    </div>

                    <button
                        onClick={() => setShowEditProfileModal(true)}
                        style={{
                            padding: "9px 16px",
                            backgroundColor: "#0B3D91",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            transition: "all 0.15s ease",
                            boxShadow: "0 2px 6px rgba(11, 61, 145, 0.2)"
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit Profile Info
                    </button>
                </div>
            </div>

            {/* =========================================================================
                2. EXECUTIVE SEGMENTED NAVIGATION TABS
               ========================================================================= */}
            <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid #E2E8F0", paddingBottom: "12px", marginTop: "8px", flexWrap: "wrap" }}>
                {[
                    { id: "academic", label: "Academic Details", icon: "🎓" },
                    { id: "resume", label: "Resume & Documents", icon: "📄" },
                    { id: "driveSummary", label: "Drive Summary & Eligibility", icon: "📊" }
                ].map((tab) => {
                    const isSel = activeMainTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveMainTab(tab.id as any)}
                            style={{
                                padding: "9px 20px",
                                borderRadius: "8px",
                                border: isSel ? "1px solid #0B3D91" : "1px solid #E2E8F0",
                                backgroundColor: isSel ? "#0B3D91" : "#FFFFFF",
                                color: isSel ? "#FFFFFF" : "#475569",
                                fontWeight: isSel ? 700 : 600,
                                fontSize: "13.5px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                transition: "all 0.15s ease",
                                boxShadow: isSel ? "0 2px 6px rgba(11, 61, 145, 0.15)" : "none"
                            }}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* =========================================================================
                3. TAB 1 CONTENT: ACADEMIC DETAILS (STRUCTURED CORPORATE CARDS)
               ========================================================================= */}
            {activeMainTab === "academic" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {/* Header with Sub-tabs and Edit Button */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                        <div style={{ display: "flex", gap: "8px", backgroundColor: "#F1F5F9", padding: "4px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                            {[
                                { id: "ug", label: "Undergraduate (UG)" },
                                { id: "schools", label: "Schools & Secondary" },
                                { id: "pg", label: "Postgraduate (PG)" }
                            ].map((sub) => {
                                const isSub = activeAcademicSubtab === sub.id;
                                return (
                                    <button
                                        key={sub.id}
                                        onClick={() => setActiveAcademicSubtab(sub.id as any)}
                                        style={{
                                            padding: "6px 16px",
                                            borderRadius: "7px",
                                            border: "none",
                                            backgroundColor: isSub ? "#FFFFFF" : "transparent",
                                            color: isSub ? "#0B3D91" : "#475569",
                                            fontWeight: isSub ? 700 : 600,
                                            fontSize: "13px",
                                            cursor: "pointer",
                                            boxShadow: isSub ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                                            transition: "all 0.15s ease"
                                        }}
                                    >
                                        {sub.label}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => setShowUpdateCourseModal(true)}
                            style={{
                                padding: "8px 18px",
                                backgroundColor: "#FFFFFF",
                                color: "#0B3D91",
                                border: "1.5px solid #0B3D91",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px"
                            }}
                        >
                            ✏️ Edit Academic Info
                        </button>
                    </div>

                    {/* UG Details View */}
                    {activeAcademicSubtab === "ug" && (
                        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#0F172A" }}>
                                        {ugInstitution || "College of Engineering and Technology"}
                                    </h3>
                                    <div style={{ fontSize: "13px", color: "#2563EB", fontWeight: 700, marginTop: "2px" }}>
                                        {ugProgram || "Bachelor of Engineering (B.E)"} — {ugSpecialization || "Computer Science and Engineering"}
                                    </div>
                                </div>
                                <span style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8", padding: "4px 12px", borderRadius: "12px", fontSize: "12px", fontWeight: 700, border: "1px solid #BFDBFE" }}>
                                    Batch: 2022 – {graduationYear || "2026"}
                                </span>
                            </div>

                            {/* 4 Stat Metric Cards Grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
                                <div style={{ backgroundColor: "#F8FAFC", padding: "14px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                                    <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Cumulative CGPA</div>
                                    <div style={{ fontSize: "20px", fontWeight: 900, color: "#16A34A", marginTop: "4px" }}>
                                        {cgpa ? `${cgpa} / 10.0` : "8.42 / 10.0"}
                                    </div>
                                </div>
                                <div style={{ backgroundColor: "#F8FAFC", padding: "14px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                                    <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Current Semester</div>
                                    <div style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", marginTop: "4px" }}>
                                        {currentSemester || "Semester 8"}
                                    </div>
                                </div>
                                <div style={{ backgroundColor: "#F8FAFC", padding: "14px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                                    <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Standing Backlogs</div>
                                    <div style={{ fontSize: "18px", fontWeight: 800, color: Number(backlogs) === 0 ? "#16A34A" : "#DC2626", marginTop: "4px" }}>
                                        {backlogs || 0} Active
                                    </div>
                                </div>
                                <div style={{ backgroundColor: "#F8FAFC", padding: "14px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                                    <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>History of Backlogs</div>
                                    <div style={{ fontSize: "18px", fontWeight: 800, color: Number(backlogHistory) === 0 ? "#16A34A" : "#EA580C", marginTop: "4px" }}>
                                        {backlogHistory || 0} Total
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Schools & Diploma View */}
                    {activeAcademicSubtab === "schools" && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px" }}>
                            {/* Higher Secondary 12th */}
                            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A" }}>Higher Secondary (12th / HSC)</div>
                                    <span style={{ backgroundColor: "#F0FDF4", color: "#16A34A", padding: "3px 10px", borderRadius: "8px", fontSize: "13px", fontWeight: 800 }}>
                                        {twelfthPercentage ? `${twelfthPercentage}%` : "88.0%"}
                                    </span>
                                </div>
                                <div style={{ fontSize: "13px", color: "#475569" }}>
                                    <div><strong>Institution:</strong> {schoolName || "KNMHSS Senior Secondary School"}</div>
                                    <div style={{ marginTop: "4px" }}><strong>Board:</strong> State Board • Tamil Nadu</div>
                                </div>
                            </div>

                            {/* Secondary School 10th */}
                            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A" }}>Secondary School (10th / SSLC)</div>
                                    <span style={{ backgroundColor: "#F0FDF4", color: "#16A34A", padding: "3px 10px", borderRadius: "8px", fontSize: "13px", fontWeight: 800 }}>
                                        {tenthPercentage ? `${tenthPercentage}%` : "90.0%"}
                                    </span>
                                </div>
                                <div style={{ fontSize: "13px", color: "#475569" }}>
                                    <div><strong>Institution:</strong> {schoolName || "KNMHSS High School"}</div>
                                    <div style={{ marginTop: "4px" }}><strong>Board:</strong> State Board • Tamil Nadu</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PG Details View */}
                    {activeAcademicSubtab === "pg" && (
                        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
                            <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: 800, color: "#0F172A" }}>Postgraduate Studies</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", fontSize: "13.5px", color: "#334155" }}>
                                <div><strong>Institution:</strong> {pgInstitution || "N/A (Pursuing UG)"}</div>
                                <div><strong>Program:</strong> {pgProgram || "—"}</div>
                                <div><strong>Specialization:</strong> {pgSpecialization || "—"}</div>
                                <div><strong>PG Mark / CGPA:</strong> {pgCgpa || "—"}</div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* =========================================================================
                4. TAB 2 CONTENT: RESUME & DOCUMENTS
               ========================================================================= */}
            {activeMainTab === "resume" && (
                <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "18px" }}>
                        <div>
                            <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0F172A", margin: "0 0 4px 0" }}>Resume & Documents</h3>
                            <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>
                                Upload and manage your official resume for campus placement recruiters.
                            </p>
                        </div>
                    </div>

                    {/* Resume File Document Card */}
                    {resumeName ? (
                        <div style={{ backgroundColor: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                <div style={{ width: "44px", height: "44px", borderRadius: "10px", backgroundColor: "#EFF6FF", border: "1px solid #DBEAFE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
                                    📄
                                </div>
                                <div>
                                    <div style={{ fontSize: "14.5px", fontWeight: 800, color: "#0F172A" }}>{resumeName}</div>
                                    <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>Uploaded on {resumeUploadDate} • PDF Document</div>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "10px" }}>
                                <button
                                    onClick={handleViewResume}
                                    style={{
                                        padding: "8px 16px",
                                        backgroundColor: "#0B3D91",
                                        color: "#FFFFFF",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                        fontWeight: 700,
                                        cursor: "pointer"
                                    }}
                                >
                                    View Resume
                                </button>
                                <button
                                    onClick={handleDownloadResume}
                                    style={{
                                        padding: "8px 16px",
                                        backgroundColor: "#FFFFFF",
                                        color: "#334155",
                                        border: "1px solid #CBD5E1",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                        fontWeight: 700,
                                        cursor: "pointer"
                                    }}
                                >
                                    Download
                                </button>
                                <button
                                    onClick={handleDeleteResume}
                                    style={{
                                        padding: "8px 14px",
                                        backgroundColor: "#FEE2E2",
                                        color: "#DC2626",
                                        border: "1px solid #FCA5A5",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                        fontWeight: 700,
                                        cursor: "pointer"
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: "center", padding: "36px 20px", backgroundColor: "#F8FAFC", borderRadius: "12px", border: "2px dashed #CBD5E1" }}>
                            <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} style={{ display: "none" }} id="profile-resume-upload" />
                            <label htmlFor="profile-resume-upload" style={{ cursor: "pointer" }}>
                                <div style={{ fontSize: "38px", marginBottom: "8px" }}>📄</div>
                                <div style={{ fontSize: "15px", fontWeight: 800, color: "#0F172A" }}>Click to Upload Resume (PDF / DOCX)</div>
                                <div style={{ fontSize: "12.5px", color: "#64748B", marginTop: "4px" }}>Maximum file size: 5 MB</div>
                            </label>
                        </div>
                    )}
                </div>
            )}

            {/* =========================================================================
                5. TAB 3 CONTENT: DRIVE SUMMARY & ELIGIBILITY
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