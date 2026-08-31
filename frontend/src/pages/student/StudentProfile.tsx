import React, {
    useEffect,
    useMemo,
    useState,
} from "react";
import ClearDataButton from "../../components/ClearDataButton";

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

const API_BASE_URL = "http://localhost:5001";

const StudentProfile: React.FC<StudentProfileProps> = ({
    user,
    onProfileSaved,
}) => {
    const userId = user.id || user._id || "";

    // =========================================================
    const initialName = (() => {
        const saved = localStorage.getItem(`cpms_student_fullname_${userId}`) || localStorage.getItem("cpms_student_fullname");
        if (saved && saved.trim()) return saved.trim();
        if (user?.name) {
            const cleaned = user.name.split('@')[0].replace(/[0-9]/g, "").trim();
            if (cleaned) return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
            return user.name;
        }
        return "Student";
    })();

    const [fullName, setFullName] = useState(initialName);
    const [email, setEmail] = useState(user.email || "");
    const [phone, setPhone] = useState("");

    const [department, setDepartment] = useState(
        "Computer Science & Engineering"
    );

    const [registerNumber, setRegisterNumber] =
        useState("");

    // =========================================================
    // Academic Details
    // =========================================================

    const [tenthPercentage, setTenthPercentage] =
        useState<number | "">("");

    const [twelfthPercentage, setTwelfthPercentage] =
        useState<number | "">("");

    const [cgpa, setCgpa] =
        useState<number | "">("");

    const [backlogs, setBacklogs] =
        useState<number>(0);

    const [graduationYear, setGraduationYear] =
        useState<number>(2026);

    // =========================================================
    // Professional Details
    // =========================================================

    const [skills, setSkills] = useState("");
    const [certifications, setCertifications] =
        useState("");
    const [projects, setProjects] = useState("");
    const [internship, setInternship] =
        useState("");

    // =========================================================
    // Resume
    // =========================================================

    const [resumeFile, setResumeFile] =
        useState<File | null>(null);

    const [resumeName, setResumeName] =
        useState("");

    // Resume URL returned from backend
    const [resumeUrl, setResumeUrl] =
        useState<string | null>(null);

    // Temporary browser preview URL
    const [resumePreviewUrl, setResumePreviewUrl] =
        useState<string | null>(null);

    const [showResumeModal, setShowResumeModal] =
        useState(false);

    // =========================================================
    // UI State
    // =========================================================

    const [saving, setSaving] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [initialProfile, setInitialProfile] = useState<any>(null);

    const [alert, setAlert] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    // =========================================================
    // Profile Completion
    // =========================================================

    const completionPercentage = useMemo(() => {
        const fields = [
            phone.trim(),
            department.trim(),
            registerNumber.trim(),
            tenthPercentage !== "",
            twelfthPercentage !== "",
            cgpa !== "",
            graduationYear,
            skills.trim(),
            projects.trim(),
            resumeName.trim(),
        ];

        const completed = fields.filter((field) => {
            if (typeof field === "boolean") {
                return field;
            }

            return Boolean(field);
        }).length;

        return Math.round(
            (completed / fields.length) * 100
        );
    }, [
        phone,
        department,
        registerNumber,
        tenthPercentage,
        twelfthPercentage,
        cgpa,
        graduationYear,
        skills,
        projects,
        resumeName,
    ]);

    // =========================================================
    // Fetch Student Profile
    // =========================================================

    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId) {
                console.log(
                    "User ID not available"
                );

                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                const lookupKey = userId || (user?.email || "").toLowerCase().trim() || "student";
                const res = await fetch(
                    `${API_BASE_URL}/api/student/profile/${encodeURIComponent(lookupKey)}?email=${encodeURIComponent((user?.email || "").toLowerCase().trim())}`
                );

                const data = await res.json();

                console.log(
                    "Student profile from MongoDB:",
                    data
                );

                if (res.ok) {
                    const student = data;

                    if (student.user) {
                        if (student.user.name) setFullName(student.user.name);
                        if (student.user.email) setEmail(student.user.email);
                    }

                    if (student.personal) {
                        setPhone(
                            student.personal.phone ||
                            ""
                        );

                        setDepartment(
                            student.personal.department ||
                            "Computer Science & Engineering"
                        );

                        setRegisterNumber(
                            student.personal
                                .registerNumber || ""
                        );
                    }

                    // =================================================
                    // Academic Details
                    // =================================================

                    if (student.academic) {
                        setTenthPercentage(
                            student.academic.tenthPercentage && Number(student.academic.tenthPercentage) > 0
                                ? Number(student.academic.tenthPercentage)
                                : ""
                        );

                        setTwelfthPercentage(
                            student.academic.twelfthPercentage && Number(student.academic.twelfthPercentage) > 0
                                ? Number(student.academic.twelfthPercentage)
                                : ""
                        );

                        setCgpa(
                            student.academic.cgpa && Number(student.academic.cgpa) > 0
                                ? Number(student.academic.cgpa)
                                : ""
                        );

                        setBacklogs(
                            student.academic.backlogs !== undefined && student.academic.backlogs !== null && student.academic.backlogs !== ""
                                ? Number(student.academic.backlogs)
                                : 0
                        );

                        setGraduationYear(
                            Number(student.academic.graduationYear) || 2026
                        );
                    } else {
                        setTenthPercentage("");
                        setTwelfthPercentage("");
                        setCgpa("");
                        setBacklogs(0);
                        setGraduationYear(2026);
                    }

                    // =================================================
                    // Professional Details
                    // =================================================

                    if (student.professional) {
                        setSkills(
                            Array.isArray(student.professional.skills)
                                ? student.professional.skills.join(", ")
                                : student.professional.skills || ""
                        );

                        setCertifications(
                            Array.isArray(student.professional.certifications)
                                ? student.professional.certifications.join(", ")
                                : student.professional.certifications || ""
                        );

                        setProjects(
                            Array.isArray(student.professional.projects)
                                ? student.professional.projects.join(", ")
                                : student.professional.projects || ""
                        );

                        setInternship(
                            Array.isArray(student.professional.internships)
                                ? student.professional.internships.join(", ")
                                : student.professional.internships || ""
                        );

                        setResumeName(
                            student.professional.resumeName || ""
                        );

                        // Load uploaded resume URL
                        if (student.professional
                                .resumeUrl
                        ) {
                            setResumeUrl(
                                `${API_BASE_URL}${student.professional.resumeUrl}`
                            );
                        }
                    }

                    setInitialProfile({
                        phone: student.personal?.phone || "",
                        department: student.personal?.department || "Computer Science & Engineering",
                        registerNumber: student.personal?.registerNumber || "",
                        tenthPercentage: student.academic?.tenthPercentage ?? "",
                        twelfthPercentage: student.academic?.twelfthPercentage ?? "",
                        cgpa: student.academic?.cgpa ?? "",
                        backlogs: student.academic?.backlogs ?? 0,
                        graduationYear: student.academic?.graduationYear ?? 2026,
                        skills: student.professional?.skills?.join(", ") || "",
                        projects: student.professional?.projects?.join(", ") || "",
                        resumeName: student.professional?.resumeName || "",
                    });
                } else if (
                    res.status === 404
                ) {
                    console.log(
                        "No student profile found yet."
                    );
                } else {
                    console.error(
                        "Failed to fetch profile:",
                        data.message
                    );
                }
            } catch (error) {
                console.error(
                    "Error fetching student profile:",
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [userId]);

    // =========================================================
    // Cleanup Browser Resume Preview
    // =========================================================

    useEffect(() => {
        return () => {
            if (resumePreviewUrl) {
                URL.revokeObjectURL(
                    resumePreviewUrl
                );
            }
        };
    }, [resumePreviewUrl]);

    // =========================================================
    // Resume File Selection
    // =========================================================

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        if (
            !e.target.files ||
            !e.target.files[0]
        ) {
            return;
        }

        const file = e.target.files[0];

        // =====================================================
        // Extension Validation
        // =====================================================

        const ext = file.name
            .split(".")
            .pop()
            ?.toLowerCase();

        if (
            !["pdf", "doc", "docx"].includes(
                ext || ""
            )
        ) {
            setAlert({
                type: "error",
                text:
                    "Invalid file format. Please upload PDF, DOC, or DOCX.",
            });

            return;
        }

        // =====================================================
        // File Size Validation
        // =====================================================

        if (
            file.size >
            5 * 1024 * 1024
        ) {
            setAlert({
                type: "error",
                text:
                    "Resume size must be less than 5 MB.",
            });

            return;
        }

        // =====================================================
        // Remove Previous Browser Preview
        // =====================================================

        if (resumePreviewUrl) {
            URL.revokeObjectURL(
                resumePreviewUrl
            );
        }

        // =====================================================
        // Create New Browser Preview
        // =====================================================

        const previewUrl =
            URL.createObjectURL(file);

        setResumeFile(file);

        setResumeName(file.name);

        setResumePreviewUrl(
            previewUrl
        );

        setAlert({
            type: "success",
            text: `Selected resume: ${file.name}`,
        });

        setTimeout(() => {
            setAlert(null);
        }, 3000);
    };

    // =========================================================
    // View Resume
    // =========================================================

    const handleViewResume = () => {
        // Newly selected local file
        if (resumePreviewUrl) {
            window.open(
                resumePreviewUrl,
                "_blank"
            );

            return;
        }

        // Previously uploaded file
        if (resumeUrl) {
            window.open(
                resumeUrl,
                "_blank"
            );

            return;
        }

        // No uploaded resume
        setShowResumeModal(true);
    };

    // =========================================================
    // Download Resume
    // =========================================================

    const handleDownloadResume = () => {
        const downloadUrl =
            resumePreviewUrl ||
            resumeUrl;

        if (!downloadUrl) {
            setAlert({
                type: "error",
                text:
                    "Resume file is not available for download yet.",
            });

            return;
        }

        const link =
            document.createElement("a");

        link.href = downloadUrl;

        link.download =
            resumeName ||
            "Student_Resume";

        link.target = "_blank";

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);
    };

    // =========================================================
    // Save Student Profile
    // =========================================================

    const handleSubmit = async (
        e: React.FormEvent
    ) => {
        e.preventDefault();

        if (!userId) {
            setAlert({
                type: "error",
                text:
                    "User ID is missing. Please login again.",
            });

            return;
        }

        setSaving(true);

        setAlert(null);

        try {
            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });

            // =================================================
            // CREATE FORMDATA
            // =================================================

            const formData = new FormData();

            // =================================================
            // User ID
            // =================================================

            formData.append(
                "userId",
                userId
            );

            // =================================================
            // Personal Details
            // =================================================

            formData.append(
                "personal",
                JSON.stringify({
                    fullName,
                    email,
                    phone,
                    department,
                    registerNumber,
                })
            );
            formData.append("email", email);
            formData.append("fullName", fullName);

            // =================================================
            // Academic Details
            // =================================================

            formData.append(
                "academic",
                JSON.stringify({
                    tenthPercentage:
                        Number(
                            tenthPercentage
                        ),

                    twelfthPercentage:
                        Number(
                            twelfthPercentage
                        ),

                    cgpa:
                        Number(cgpa),

                    backlogs:
                        Number(backlogs),

                    graduationYear:
                        Number(
                            graduationYear
                        ),
                })
            );

            // =================================================
            // Professional Details
            // =================================================

            formData.append(
                "professional",
                JSON.stringify({
                    skills: skills
                        .split(",")
                        .map((s) =>
                            s.trim()
                        )
                        .filter(Boolean),

                    certifications:
                        certifications
                            .split(",")
                            .map((s) =>
                                s.trim()
                            )
                            .filter(Boolean),

                    projects: projects
                        .split(",")
                        .map((s) =>
                            s.trim()
                        )
                        .filter(Boolean),

                    internships:
                        internship
                            .split(",")
                            .map((s) =>
                                s.trim()
                            )
                            .filter(Boolean),

                    resumeName:
                        resumeName || "",
                })
            );

            // =================================================
            // Attach Resume
            // =================================================

            if (resumeFile) {
                formData.append(
                    "resume",
                    resumeFile
                );
            }

            const profilePayload = {
                personal: {
                    fullName: fullName.trim(),
                    phone: phone.trim(),
                    department: department.trim(),
                    registerNumber: registerNumber.trim(),
                    email: (email || user.email || "").toLowerCase().trim(),
                },
                academic: {
                    tenthPercentage: Number(tenthPercentage),
                    twelfthPercentage: Number(twelfthPercentage),
                    cgpa: Number(cgpa),
                    backlogs: Number(backlogs),
                    graduationYear: Number(graduationYear),
                },
                professional: {
                    skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
                    certifications: certifications.split(",").map((s) => s.trim()).filter(Boolean),
                    projects: projects.split(",").map((s) => s.trim()).filter(Boolean),
                    internships: internship.split(",").map((s) => s.trim()).filter(Boolean),
                    resumeName: resumeName || (resumeFile ? resumeFile.name : ""),
                }
            };

            const userKey = (user.email || userId).toLowerCase().trim();
            try {
                localStorage.setItem(`cpms_profile_${userId}`, JSON.stringify(profilePayload));
                localStorage.setItem(`cpms_profile_${userKey}`, JSON.stringify(profilePayload));
                localStorage.setItem(`cpms_pending_profile_${userId}`, JSON.stringify(profilePayload));
                localStorage.setItem(`cpms_pending_profile_${userKey}`, JSON.stringify(profilePayload));
                localStorage.setItem(`cpms_student_fullname_${userId}`, fullName.trim());
                localStorage.setItem(`cpms_student_fullname_${userKey}`, fullName.trim());
                localStorage.setItem(`cpms_student_fullname`, fullName.trim());
            } catch (e) {}

            // Detect modified fields
            const changedFields: string[] = [];
            if (initialProfile) {
                if (String(phone) !== String(initialProfile.phone)) changedFields.push("phone");
                if (String(department) !== String(initialProfile.department)) changedFields.push("department");
                if (String(registerNumber) !== String(initialProfile.registerNumber)) changedFields.push("registerNumber");
                if (String(tenthPercentage) !== String(initialProfile.tenthPercentage)) changedFields.push("tenthPercentage");
                if (String(twelfthPercentage) !== String(initialProfile.twelfthPercentage)) changedFields.push("twelfthPercentage");
                if (String(cgpa) !== String(initialProfile.cgpa)) changedFields.push("cgpa");
                if (Number(backlogs) !== Number(initialProfile.backlogs)) changedFields.push("backlogs");
                if (Number(graduationYear) !== Number(initialProfile.graduationYear)) changedFields.push("graduationYear");
                if (String(skills) !== String(initialProfile.skills)) changedFields.push("skills");
                if (String(projects) !== String(initialProfile.projects)) changedFields.push("projects");
                if (resumeFile) changedFields.push("resume");
            }

            formData.append("pendingFields", JSON.stringify(changedFields));

            // =================================================
            // Send Request
            // =================================================

            const res = await fetch(
                `${API_BASE_URL}/api/student/profile`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data =
                await res.json();

            console.log(
                "Student profile saved:",
                data
            );

            if (!res.ok) {
                throw new Error(
                    data.message ||
                    "Failed to save student profile"
                );
            }

            // =================================================
            // SUCCESS - Require Placement Officer Approval for Updated Fields
            // =================================================

            const pendingFieldsList = changedFields.length > 0
                ? changedFields
                : ["phone", "department", "registerNumber", "tenthPercentage", "twelfthPercentage", "cgpa", "backlogs", "graduationYear", "skills", "projects"];

            try {
                await fetch(`${API_BASE_URL}/api/student/verify/${userId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isVerified: false, pendingFields: pendingFieldsList }),
                });
            } catch (err) {}

            try {
                localStorage.setItem(`cpms_verification_status_${userKey}`, "Pending");
                localStorage.setItem(`cpms_verification_status_${userId}`, "Pending");
                localStorage.setItem(`cpms_verified_student_${userKey}`, "false");
                localStorage.setItem(`cpms_verified_student_${userId}`, "false");
                localStorage.setItem(`cpms_profile_verified_${userId}`, "false");
                localStorage.setItem(`cpms_profile_verified_${userKey}`, "false");
                localStorage.removeItem("cpms_profile_verified_global");
                localStorage.setItem(`cpms_pending_fields_${userKey}`, JSON.stringify(pendingFieldsList));
                localStorage.setItem(`cpms_pending_fields_${userId}`, JSON.stringify(pendingFieldsList));

                try {
                    const channel = new BroadcastChannel("cpms_profile_channel");
                    channel.postMessage({ type: "PROFILE_VERIFIED", isVerified: false, studentId: userId });
                    channel.close();
                } catch (e) {}

                window.dispatchEvent(new Event("cpms_profile_updated"));
            } catch (e) {}

            setAlert({
                type: "success",
                text:
                    "✓ Profile updated successfully! Changes submitted to Placement Officer for verification & approval.",
            });

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });

            // =================================================
            // Update Resume Information
            // =================================================

            if (
                data.student?.professional
                    ?.resumeName
            ) {
                setResumeName(
                    data.student
                        .professional
                        .resumeName
                );
            }

            if (
                data.student?.professional
                    ?.resumeUrl
            ) {
                setResumeUrl(
                    `${API_BASE_URL}${data.student.professional.resumeUrl}`
                );
            }

            // Clear selected local file
            setResumeFile(null);

            // Keep uploaded URL
            if (
                data.student?.professional
                    ?.resumeUrl
            ) {
                setResumePreviewUrl(null);
            }

            try {
                const userEmail = user.email || "";
                localStorage.setItem(`cpms_profile_verified_${userId}`, "false");
                localStorage.setItem(`cpms_profile_verified_${userEmail}`, "false");
                localStorage.setItem(`cpms_verified_student_${userId}`, "false");
                localStorage.setItem(`cpms_verified_student_${userEmail}`, "false");
                localStorage.setItem(`cpms_profile_verified_global`, "false");
                localStorage.setItem(`cpms_verification_status_${userId}`, "Pending Officer Approval");

                try {
                    const channel = new BroadcastChannel("cpms_profile_channel");
                    channel.postMessage({ type: "PROFILE_VERIFIED", isVerified: false, studentId: userId });
                    channel.close();
                } catch (e) {}

                window.dispatchEvent(new Event("cpms_profile_updated"));
            } catch (e) {}

            if (onProfileSaved) {
                onProfileSaved();
            }

            setTimeout(() => {
                setAlert(null);
            }, 4000);
        } catch (error: any) {
            console.error(
                "Save student profile error:",
                error
            );

            setAlert({
                type: "error",
                text:
                    error.message ||
                    "Something went wrong while saving profile.",
            });
        } finally {
            setSaving(false);
        }
    };

    // =========================================================
    // Loading
    // =========================================================

    if (loading) {
        return (
            <div
                style={
                    styles.loadingContainer
                }
            >
                <div
                    style={
                        styles.loadingText
                    }
                >
                    Loading student profile...
                </div>
            </div>
        );
    }

    // =========================================================
    // UI
    // =========================================================

    return (
        <div style={styles.container} className="profile-container">
            <div style={styles.card} className="profile-card">

                {/* =================================================
                    HEADER
                ================================================== */}

                <div
                    style={
                        styles.cardHeader
                    }
                    className="profile-card-header"
                >
                    <div>
                        <h2
                            style={
                                styles.title
                            }
                            className="profile-title"
                        >
                            Student Profile Setup
                        </h2>

                        <p
                            style={
                                styles.subtitle
                            }
                            className="profile-subtitle"
                        >
                            Complete your Personal,
                            Academic, Professional,
                            and Resume details
                            to enable placement
                            eligibility.
                        </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <ClearDataButton variant="compact" />
                        <div
                            style={{
                                ...styles.completionBadge,

                                backgroundColor:
                                    completionPercentage ===
                                        100
                                        ? "#dcfce7"
                                        : "#eff6ff",

                                color:
                                    completionPercentage ===
                                        100
                                        ? "#166534"
                                        : "#1d4ed8",
                            }}
                            className="profile-completion-badge"
                        >
                            Profile{" "}
                            {completionPercentage}%
                            ✓
                        </div>
                    </div>
                </div>

                {/* =================================================
                    ALERT
                ================================================== */}

                {alert && (
                    <div
                        style={
                            alert.type ===
                                "success"
                                ? styles.successBox
                                : styles.errorBox
                        }
                    >
                        {alert.text}
                    </div>
                )}

                <form
                    onSubmit={
                        handleSubmit
                    }
                    style={styles.form}
                >

                    {/* =================================================
                        SECTION 1 - PERSONAL
                    ================================================== */}

                    <div
                        style={
                            styles.section
                        }
                    >
                        <h3
                            style={
                                styles.sectionTitle
                            }
                        >
                            1. Personal Details
                        </h3>

                        <div
                            style={
                                styles.gridTwo
                            }
                            className="profile-grid-two"
                        >

                            {/* Full Name */}

                            <div
                                style={
                                    styles.fieldGroup
                                }
                            >
                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Full Name
                                </label>

                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFullName(val);
                                        try {
                                            if (userId) localStorage.setItem(`cpms_student_fullname_${userId}`, val);
                                            localStorage.setItem("cpms_student_fullname", val);
                                            window.dispatchEvent(new Event("cpms_profile_updated"));
                                        } catch (err) {}
                                    }}
                                    style={styles.input}
                                />
                            </div>

                            {/* Email */}

                            <div
                                style={
                                    styles.fieldGroup
                                }
                            >
                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Email Address
                                </label>

                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    style={styles.input}
                                />
                            </div>

                            {/* Phone */}

                            <div
                                style={
                                    styles.fieldGroup
                                }
                            >
                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Phone Number
                                </label>

                                <input
                                    type="tel"
                                    placeholder="+91 9876543210"
                                    value={
                                        phone
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setPhone(
                                            e.target
                                                .value
                                        )
                                    }
                                    required
                                    style={
                                        styles.input
                                    }
                                />
                            </div>

                            {/* Department */}

                            <div
                                style={
                                    styles.fieldGroup
                                }
                            >
                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Department
                                </label>

                                <select
                                    value={
                                        department
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setDepartment(
                                            e.target
                                                .value
                                        )
                                    }
                                    style={
                                        styles.input
                                    }
                                >
                                    <option value="Computer Science & Engineering">
                                        Computer Science & Engineering
                                    </option>

                                    <option value="Information Technology">
                                        Information Technology
                                    </option>

                                    <option value="Electronics & Communication">
                                        Electronics & Communication
                                    </option>

                                    <option value="Electrical & Electronics">
                                        Electrical & Electronics
                                    </option>

                                    <option value="Mechanical Engineering">
                                        Mechanical Engineering
                                    </option>
                                </select>
                            </div>

                            {/* Register Number */}

                            <div
                                style={
                                    styles.fieldGroup
                                }
                            >
                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Register Number
                                </label>

                                <input
                                    type="text"
                                    placeholder="e.g. 22CSR025"
                                    value={
                                        registerNumber
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setRegisterNumber(
                                            e.target
                                                .value
                                        )
                                    }
                                    required
                                    style={
                                        styles.input
                                    }
                                />
                            </div>

                        </div>
                    </div>

                    {/* =================================================
                        SECTION 2 - ACADEMIC
                    ================================================== */}

                    <div
                        style={
                            styles.section
                        }
                    >
                        <h3
                            style={
                                styles.sectionTitle
                            }
                        >
                            2. Academic Details
                        </h3>

                        <div
                            style={
                                styles.gridTwo
                            }
                            className="profile-grid-two"
                        >

                            {/* 10th */}

                            <div
                                style={
                                    styles.fieldGroup
                                }
                            >
                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    10th Percentage (%)
                                </label>

                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    placeholder="e.g. 87.50"
                                    value={
                                        tenthPercentage
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setTenthPercentage(
                                            e.target
                                                .value
                                                ? Number(
                                                    e
                                                        .target
                                                        .value
                                                )
                                                : ""
                                        )
                                    }
                                    required
                                    style={
                                        styles.input
                                    }
                                />
                            </div>

                            {/* 12th */}

                            <div
                                style={
                                    styles.fieldGroup
                                }
                            >
                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    12th / Diploma Percentage (%)
                                </label>

                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    placeholder="e.g. 77.33"
                                    value={
                                        twelfthPercentage
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setTwelfthPercentage(
                                            e.target
                                                .value
                                                ? Number(
                                                    e
                                                        .target
                                                        .value
                                                )
                                                : ""
                                        )
                                    }
                                    required
                                    style={
                                        styles.input
                                    }
                                />
                            </div>

                            {/* CGPA */}

                            <div
                                style={
                                    styles.fieldGroup
                                }
                            >
                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    CGPA
                                </label>

                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="10"
                                    placeholder="e.g. 8.34"
                                    value={
                                        cgpa
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setCgpa(
                                            e.target
                                                .value
                                                ? Number(
                                                    e
                                                        .target
                                                        .value
                                                )
                                                : ""
                                        )
                                    }
                                    required
                                    style={
                                        styles.input
                                    }
                                />
                            </div>

                            {/* Backlogs */}

                            <div
                                style={
                                    styles.fieldGroup
                                }
                            >
                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Pending Backlogs
                                </label>

                                <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={
                                        backlogs
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setBacklogs(
                                            Number(
                                                e.target
                                                    .value
                                            )
                                        )
                                    }
                                    required
                                    style={
                                        styles.input
                                    }
                                />
                            </div>

                            {/* Graduation Year */}

                            <div
                                style={
                                    styles.fieldGroup
                                }
                            >
                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Graduation Year
                                </label>

                                <select
                                    value={
                                        graduationYear
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setGraduationYear(
                                            Number(
                                                e.target
                                                    .value
                                            )
                                        )
                                    }
                                    style={
                                        styles.input
                                    }
                                >
                                    <option value={2026}>
                                        2026
                                    </option>

                                    <option value={2027}>
                                        2027
                                    </option>

                                    <option value={2028}>
                                        2028
                                    </option>
                                </select>
                            </div>

                        </div>
                    </div>

                    {/* =================================================
                        SECTION 3 - PROFESSIONAL
                    ================================================== */}

                    <div
                        style={
                            styles.section
                        }
                    >
                        <h3
                            style={
                                styles.sectionTitle
                            }
                        >
                            3. Professional Details
                        </h3>

                        <div
                            style={
                                styles.gridOne
                            }
                        >

                            {/* Skills */}

                            <div
                                style={
                                    styles.fieldGroup
                                }
                            >
                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Skills
                                </label>

                                <input
                                    type="text"
                                    placeholder="React, Node.js, Python, SQL, Git"
                                    value={
                                        skills
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setSkills(
                                            e.target
                                                .value
                                        )
                                    }
                                    style={
                                        styles.input
                                    }
                                />

                                <small
                                    style={
                                        styles.helpText
                                    }
                                >
                                    Separate multiple
                                    skills using
                                    commas.
                                </small>
                            </div>

                            {/* Certifications */}

                            <div
                                style={
                                    styles.fieldGroup
                                }
                            >
                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Certifications
                                </label>

                                <input
                                    type="text"
                                    placeholder="AWS, Infosys Springboard"
                                    value={
                                        certifications
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setCertifications(
                                            e.target
                                                .value
                                        )
                                    }
                                    style={
                                        styles.input
                                    }
                                />
                            </div>

                            {/* Projects */}

                            <div
                                style={
                                    styles.fieldGroup
                                }
                            >
                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Projects
                                </label>

                                <input
                                    type="text"
                                    placeholder="College Placement Management System"
                                    value={
                                        projects
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setProjects(
                                            e.target
                                                .value
                                        )
                                    }
                                    style={
                                        styles.input
                                    }
                                />
                            </div>

                            {/* Internship */}

                            <div
                                style={
                                    styles.fieldGroup
                                }
                            >
                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Internship Experience
                                </label>

                                <input
                                    type="text"
                                    placeholder="Software Development Intern"
                                    value={
                                        internship
                                    }
                                    onChange={(
                                        e
                                    ) =>
                                        setInternship(
                                            e.target
                                                .value
                                        )
                                    }
                                    style={
                                        styles.input
                                    }
                                />
                            </div>

                        </div>
                    </div>

                    {/* =================================================
                        SECTION 4 - RESUME
                    ================================================== */}

                    <div
                        style={
                            styles.section
                        }
                    >
                        <h3
                            style={
                                styles.sectionTitle
                            }
                        >
                            4. Resume Upload
                        </h3>

                        <div
                            style={
                                styles.uploadDropZone
                            }
                        >
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={
                                    handleFileChange
                                }
                                style={
                                    styles.fileInputHidden
                                }
                            />

                            <span
                                style={{
                                    fontSize:
                                        "32px",
                                }}
                            >
                                📄
                            </span>

                            <div
                                style={{
                                    textAlign:
                                        "center",
                                }}
                            >
                                <p
                                    style={{
                                        margin:
                                            "0 0 4px 0",
                                        fontWeight:
                                            "700",
                                        color:
                                            "#0f172a",
                                        fontSize:
                                            "15px",
                                    }}
                                >
                                    {resumeName
                                        ? `Attached Resume: ${resumeName}`
                                        : "Click to select Resume file"}
                                </p>

                                <span
                                    style={{
                                        fontSize:
                                            "12px",
                                        color:
                                            "#64748b",
                                    }}
                                >
                                    Accepted formats:
                                    PDF, DOC, DOCX
                                    <br />
                                    Maximum size:
                                    5 MB
                                </span>
                            </div>
                        </div>

                        {/* Resume Buttons */}
                        {resumeName && (
                            <div
                                style={{
                                    display: "flex",
                                    gap: "16px",
                                    justifyContent: "center",
                                    marginTop: "20px",
                                    flexWrap: "wrap",
                                }}
                                className="profile-actions-row"
                            >
                                <button
                                    type="button"
                                    onClick={handleViewResume}
                                    style={styles.viewResumeBtn}
                                >
                                    View Resume
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDownloadResume}
                                    style={styles.downloadResumeBtn}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    Download Resume
                                </button>
                            </div>
                        )}
                    </div>

                    {/* =================================================
                        SAVE BUTTON
                    ================================================== */}

                    <div
                        style={{
                            display:
                                "flex",
                            justifyContent:
                                "flex-end",
                            marginTop:
                                "12px",
                        }}
                    >
                        <button
                            type="submit"
                            disabled={saving}
                            className="profile-save-btn"
                            style={{
                                ...styles.saveBtn,

                                opacity:
                                    saving
                                        ? 0.7
                                        : 1,

                                cursor:
                                    saving
                                        ? "not-allowed"
                                        : "pointer",
                            }}
                        >
                            {saving
                                ? "Saving Profile..."
                                : "Save & Submit for Verification"}
                        </button>
                    </div>
                </form>

                {/* =================================================
                    RESUME MODAL
                ================================================== */}

                {showResumeModal && (
                    <div
                        style={
                            styles.modalOverlay
                        }
                        onClick={() =>
                            setShowResumeModal(
                                false
                            )
                        }
                    >
                        <div
                            style={
                                styles.modalContent
                            }
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >
                            <div
                                style={
                                    styles.modalHeader
                                }
                            >
                                <div>
                                    <h3
                                        style={{
                                            margin: 0,
                                            fontSize:
                                                "18px",
                                            color:
                                                "#0f172a",
                                        }}
                                    >
                                        📄 Resume Preview
                                    </h3>

                                    <span
                                        style={{
                                            fontSize:
                                                "13px",
                                            color:
                                                "#64748b",
                                        }}
                                    >
                                        {resumeName ||
                                            "Student Resume"}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowResumeModal(
                                            false
                                        )
                                    }
                                    style={
                                        styles.closeModalBtn
                                    }
                                >
                                    ✕ Close
                                </button>
                            </div>

                            <div
                                style={
                                    styles.modalBody
                                }
                            >
                                {resumePreviewUrl ? (
                                    <iframe
                                        src={
                                            resumePreviewUrl
                                        }
                                        title="Resume Preview"
                                        style={{
                                            width:
                                                "100%",
                                            height:
                                                "500px",
                                            border:
                                                "none",
                                            borderRadius:
                                                "6px",
                                        }}
                                    />
                                ) : resumeUrl ? (
                                    <iframe
                                        src={
                                            resumeUrl
                                        }
                                        title="Uploaded Resume"
                                        style={{
                                            width:
                                                "100%",
                                            height:
                                                "500px",
                                            border:
                                                "none",
                                            borderRadius:
                                                "6px",
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={
                                            styles.sampleResumeDocument
                                        }
                                    >
                                        <div
                                            style={{
                                                borderBottom:
                                                    "2px solid #2563eb",
                                                paddingBottom:
                                                    "12px",
                                                marginBottom:
                                                    "16px",
                                            }}
                                        >
                                            <h2
                                                style={{
                                                    margin:
                                                        "0 0 4px 0",
                                                    color:
                                                        "#1e293b",
                                                    fontSize:
                                                        "22px",
                                                }}
                                            >
                                                {
                                                    user.name
                                                }
                                            </h2>

                                            <p
                                                style={{
                                                    margin:
                                                        0,
                                                    fontSize:
                                                        "13px",
                                                    color:
                                                        "#475569",
                                                }}
                                            >
                                                {
                                                    user.email
                                                }{" "}
                                                |{" "}
                                                {phone ||
                                                    "+91 9876543210"}{" "}
                                                |{" "}
                                                {
                                                    department
                                                }
                                            </p>
                                        </div>

                                        <div
                                            style={{
                                                display:
                                                    "flex",
                                                flexDirection:
                                                    "column",
                                                gap:
                                                    "14px",
                                                textAlign:
                                                    "left",
                                                fontSize:
                                                    "13px",
                                            }}
                                        >
                                            <div>
                                                <h4
                                                    style={{
                                                        margin:
                                                            "0 0 4px 0",
                                                        color:
                                                            "#2563eb",
                                                        fontSize:
                                                            "14px",
                                                    }}
                                                >
                                                    ACADEMIC
                                                    HIGHLIGHTS
                                                </h4>

                                                <div>
                                                    CGPA:{" "}
                                                    <strong>
                                                        {
                                                            cgpa
                                                        }{" "}
                                                        /
                                                        10.0
                                                    </strong>

                                                    {" | "}

                                                    12th:{" "}
                                                    <strong>
                                                        {
                                                            twelfthPercentage
                                                        }
                                                        %
                                                    </strong>

                                                    {" | "}

                                                    10th:{" "}
                                                    <strong>
                                                        {
                                                            tenthPercentage
                                                        }
                                                        %
                                                    </strong>
                                                </div>

                                                <div>
                                                    Graduation
                                                    Year:{" "}
                                                    <strong>
                                                        {
                                                            graduationYear
                                                        }
                                                    </strong>

                                                    {" | "}

                                                    Backlogs:{" "}
                                                    <strong>
                                                        {
                                                            backlogs
                                                        }
                                                    </strong>
                                                </div>
                                            </div>

                                            <div>
                                                <h4
                                                    style={{
                                                        margin:
                                                            "0 0 4px 0",
                                                        color:
                                                            "#2563eb",
                                                        fontSize:
                                                            "14px",
                                                    }}
                                                >
                                                    TECHNICAL
                                                    SKILLS
                                                </h4>

                                                <div>
                                                    {skills ||
                                                        "No skills added"}
                                                </div>
                                            </div>

                                            <div>
                                                <h4
                                                    style={{
                                                        margin:
                                                            "0 0 4px 0",
                                                        color:
                                                            "#2563eb",
                                                        fontSize:
                                                            "14px",
                                                    }}
                                                >
                                                    CERTIFICATIONS
                                                </h4>

                                                <div>
                                                    {certifications ||
                                                        "No certifications added"}
                                                </div>
                                            </div>

                                            <div>
                                                <h4
                                                    style={{
                                                        margin:
                                                            "0 0 4px 0",
                                                        color:
                                                            "#2563eb",
                                                        fontSize:
                                                            "14px",
                                                    }}
                                                >
                                                    PROJECTS
                                                </h4>

                                                <div>
                                                    {projects ||
                                                        "No projects added"}
                                                </div>
                                            </div>

                                            <div>
                                                <h4
                                                    style={{
                                                        margin:
                                                            "0 0 4px 0",
                                                        color:
                                                            "#2563eb",
                                                        fontSize:
                                                            "14px",
                                                    }}
                                                >
                                                    INTERNSHIP
                                                </h4>

                                                <div>
                                                    {internship ||
                                                        "No internship added"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// =============================================================
// Styles
// =============================================================

const styles: {
    [key: string]: React.CSSProperties;
} = {
    container: {
        maxWidth: "960px",
        margin: "0 auto",
    },

    loadingContainer: {
        minHeight: "300px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },

    loadingText: {
        color: "#64748b",
        fontSize: "14px",
    },

    card: {
        backgroundColor: "#ffffff",
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
        boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.03)",
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
    },

    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        borderBottom:
            "1px solid #e2e8f0",
        paddingBottom: "16px",
        gap: "20px",
    },

    title: {
        margin: "0 0 4px 0",
        fontSize: "20px",
        fontWeight: "700",
        color: "#0f172a",
    },

    subtitle: {
        margin: 0,
        fontSize: "13px",
        color: "#64748b",
    },

    completionBadge: {
        fontWeight: "700",
        fontSize: "12px",
        padding: "6px 12px",
        borderRadius: "20px",
        whiteSpace: "nowrap",
    },

    successBox: {
        backgroundColor: "#f0fdf4",
        color: "#166534",
        borderLeft:
            "4px solid #22c55e",
        padding: "10px 14px",
        borderRadius: "6px",
        fontSize: "13px",
    },

    errorBox: {
        backgroundColor: "#fef2f2",
        color: "#dc2626",
        borderLeft:
            "4px solid #ef4444",
        padding: "10px 14px",
        borderRadius: "6px",
        fontSize: "13px",
    },

    form: {
        display: "flex",
        flexDirection: "column",
        gap: "24px",
    },

    section: {
        backgroundColor: "#f8fafc",
        padding: "18px",
        borderRadius: "10px",
        border:
            "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
    },

    sectionTitle: {
        margin: 0,
        fontSize: "15px",
        fontWeight: "700",
        color: "#1e293b",
    },

    gridTwo: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "14px",
    },

    gridOne: {
        display: "flex",
        flexDirection: "column",
        gap: "14px",
    },

    fieldGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },

    label: {
        fontSize: "12px",
        fontWeight: "600",
        color: "#475569",
    },

    input: {
        padding: "9px 12px",
        borderRadius: "6px",
        border:
            "1px solid #cbd5e1",
        fontSize: "14px",
        backgroundColor: "#ffffff",
        outline: "none",
        width: "100%",
        boxSizing: "border-box",
    },

    helpText: {
        fontSize: "11px",
        color: "#64748b",
    },

    uploadDropZone: {
        border:
            "2px dashed #cbd5e1",
        backgroundColor: "#ffffff",
        borderRadius: "8px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        position: "relative",
        cursor: "pointer",
    },

    fileInputHidden: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        opacity: 0,
        cursor: "pointer",
    },

    saveBtn: {
        padding: "10px 24px",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        border: "none",
        borderRadius: "6px",
        fontWeight: "600",
        fontSize: "14px",
    },

    viewResumeBtn: {
        padding: "12px 32px",
        backgroundColor: "#0084d4",
        color: "#ffffff",
        border: "none",
        borderRadius: "10px",
        fontWeight: "700",
        fontSize: "15px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        boxShadow: "0 2px 4px rgba(0, 132, 212, 0.2)",
    },

    downloadResumeBtn: {
        padding: "10px 28px",
        backgroundColor: "#ffffff",
        color: "#16a34a",
        border: "2px solid #16a34a",
        borderRadius: "10px",
        fontWeight: "700",
        fontSize: "15px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
    },

    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor:
            "rgba(15, 23, 42, 0.65)",
        backdropFilter:
            "blur(4px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
        padding: "20px",
    },

    modalContent: {
        backgroundColor: "#ffffff",
        borderRadius: "14px",
        maxWidth: "720px",
        width: "100%",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        display: "flex",
        flexDirection: "column",
    },

    modalHeader: {
        padding: "16px 24px",
        borderBottom:
            "1px solid #e2e8f0",
        display: "flex",
        justifyContent:
            "space-between",
        alignItems: "center",
        backgroundColor:
            "#f8fafc",
    },

    closeModalBtn: {
        padding: "6px 12px",
        backgroundColor: "#ef4444",
        color: "#ffffff",
        border: "none",
        borderRadius: "6px",
        fontWeight: "700",
        fontSize: "12px",
        cursor: "pointer",
    },

    modalBody: {
        padding: "24px",
    },

    sampleResumeDocument: {
        backgroundColor: "#ffffff",
        border:
            "1px solid #cbd5e1",
        borderRadius: "8px",
        padding: "28px",
        boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    },
};

export default StudentProfile;