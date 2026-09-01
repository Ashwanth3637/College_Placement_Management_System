import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";

interface StudentProfileFormProps {
    userId: string;
    userName: string;
    userEmail: string;
    onSaveSuccess?: () => void;
}

const StudentProfileForm: React.FC<StudentProfileFormProps> = ({
    userId,
    userName,
    userEmail,
    onSaveSuccess,
}) => {
    const [activeSection, setActiveSection] = useState<"personal" | "academic" | "professional">("personal");

    // 6.1 Personal Details
    const [phone, setPhone] = useState("");
    const [department, setDepartment] = useState("");
    const [registerNumber, setRegisterNumber] = useState("");

    // 6.2 Academic Details
    const [tenthPercentage, setTenthPercentage] = useState<number | "">("");
    const [twelfthPercentage, setTwelfthPercentage] = useState<number | "">("");
    const [cgpa, setCgpa] = useState<number | "">("");
    const [backlogs, setBacklogs] = useState<number>(0);
    const [graduationYear, setGraduationYear] = useState<number | "">("");

    // 6.3 Professional Details (Empty defaults for genuine user input)
    const [skillsInput, setSkillsInput] = useState("");
    const [certificationsInput, setCertificationsInput] = useState("");
    const [projectsInput, setProjectsInput] = useState("");
    const [internshipInput, setInternshipInput] = useState("");
    const [resumeName, setResumeName] = useState("");

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId) return;
            try {
                const res = await fetch(`${API_BASE_URL}/api/student/profile/${userId}`);
                const data = await res.json();
                const s = data.student || data;
                if (res.ok && s) {
                    if (s.personal) {
                        setPhone(s.personal.phone || "");
                        if (s.personal.department) setDepartment(s.personal.department);
                        setRegisterNumber(s.personal.registerNumber || "");
                    }
                    if (s.academic) {
                        if (s.academic.tenthPercentage) setTenthPercentage(s.academic.tenthPercentage);
                        if (s.academic.twelfthPercentage) setTwelfthPercentage(s.academic.twelfthPercentage);
                        if (s.academic.cgpa) setCgpa(s.academic.cgpa);
                        setBacklogs(s.academic.backlogs ?? 0);
                        setGraduationYear(s.academic.graduationYear || 2026);
                    }
                    if (s.professional) {
                        if (s.professional.skills?.length) setSkillsInput(s.professional.skills.join(", "));
                        if (s.professional.certifications?.length) setCertificationsInput(s.professional.certifications.join(", "));
                        if (s.professional.projects?.length) setProjectsInput(s.professional.projects.join(", "));
                        if (s.professional.internships?.length) setInternshipInput(s.professional.internships.join(", "));
                        if (s.professional.resumeName) setResumeName(s.professional.resumeName);
                    }
                }
            } catch (err) {
                console.error("Failed to load profile", err);
            }
        };
        fetchProfile();
    }, [userId]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setResumeName(file.name);
            setMessage({ type: "success", text: `Selected resume file: ${file.name}` });
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        const activeUserId = userId || "650000000000000000000001";
        const payload = {
            userId: activeUserId,
            personal: {
                phone,
                department,
                registerNumber,
            },
            academic: {
                tenthPercentage: Number(tenthPercentage),
                twelfthPercentage: Number(twelfthPercentage),
                cgpa: Number(cgpa),
                backlogs: Number(backlogs),
                graduationYear: Number(graduationYear),
            },
            professional: {
                skills: skillsInput.split(",").map((s) => s.trim()).filter(Boolean),
                certifications: certificationsInput.split(",").map((s) => s.trim()).filter(Boolean),
                projects: projectsInput.split(",").map((s) => s.trim()).filter(Boolean),
                internships: internshipInput.split(",").map((s) => s.trim()).filter(Boolean),
                resumeName,
            },
        };

        try {
            const res = await fetch(`${API_BASE_URL}/api/student/profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to save profile");

            setMessage({ type: "success", text: "Student Profile saved & verified successfully!" });
            if (onSaveSuccess) onSaveSuccess();
        } catch (err: any) {
            setMessage({ type: "error", text: err.message || "Error saving profile" });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={styles.card}>
            <div style={styles.headerRow}>
                <div>
                    <h3 style={styles.title}>Student Profile Management</h3>
                    <p style={styles.subtitle}>
                        Complete all 3 sections to qualify for placement drives and eligibility checks.
                    </p>
                </div>
                <span style={styles.completenessBadge}>
                    Verified Profile ✓
                </span>
            </div>

            {/* Section Switcher */}
            <div style={styles.sectionNav}>
                <button
                    type="button"
                    onClick={() => setActiveSection("personal")}
                    style={{
                        ...styles.sectionBtn,
                        ...(activeSection === "personal" ? styles.activeSectionBtn : {}),
                    }}
                >
                    6.1 Personal Details
                </button>
                <button
                    type="button"
                    onClick={() => setActiveSection("academic")}
                    style={{
                        ...styles.sectionBtn,
                        ...(activeSection === "academic" ? styles.activeSectionBtn : {}),
                    }}
                >
                    6.2 Academic Details
                </button>
                <button
                    type="button"
                    onClick={() => setActiveSection("professional")}
                    style={{
                        ...styles.sectionBtn,
                        ...(activeSection === "professional" ? styles.activeSectionBtn : {}),
                    }}
                >
                    6.3 Professional Details
                </button>
            </div>

            {message && (
                <div
                    style={
                        message.type === "success" ? styles.successAlert : styles.errorAlert
                    }
                >
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave} style={styles.form}>
                {/* 6.1 Personal Details */}
                {activeSection === "personal" && (
                    <div style={styles.gridTwo}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Full Name</label>
                            <input type="text" value={userName} disabled style={{ ...styles.input, backgroundColor: "#f1f5f9" }} />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Email Address</label>
                            <input type="email" value={userEmail} disabled style={{ ...styles.input, backgroundColor: "#f1f5f9" }} />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Contact Phone Number</label>
                            <input
                                type="tel"
                                placeholder="+91 9876543210"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Department / Branch</label>
                            <select
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                style={styles.input}
                            >
                                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                                <option value="Information Technology">Information Technology</option>
                                <option value="Electronics & Communication">Electronics & Communication</option>
                                <option value="Electrical & Electronics">Electrical & Electronics</option>
                                <option value="Mechanical Engineering">Mechanical Engineering</option>
                            </select>
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>College Register Number</label>
                            <input
                                type="text"
                                placeholder="REG2026CSE042"
                                value={registerNumber}
                                onChange={(e) => setRegisterNumber(e.target.value)}
                                required
                                style={styles.input}
                            />
                        </div>
                    </div>
                )}

                {/* 6.2 Academic Details */}
                {activeSection === "academic" && (
                    <div style={styles.gridTwo}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>
                                10th Secondary Percentage (%) <span style={{ color: "#dc2626", fontWeight: "800" }}>*</span>
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                placeholder="88.5"
                                value={tenthPercentage}
                                onChange={(e) => setTenthPercentage(e.target.value ? Number(e.target.value) : "")}
                                required
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>
                                12th / Diploma Percentage (%) <span style={{ color: "#dc2626", fontWeight: "800" }}>*</span>
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                placeholder="91.2"
                                value={twelfthPercentage}
                                onChange={(e) => setTwelfthPercentage(e.target.value ? Number(e.target.value) : "")}
                                required
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Current CGPA (out of 10.0)</label>
                            <input
                                type="number"
                                step="0.01"
                                max="10.0"
                                placeholder="7.2"
                                value={cgpa}
                                onChange={(e) => setCgpa(e.target.value ? Number(e.target.value) : "")}
                                required
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Pending Backlogs (Count)</label>
                            <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={backlogs}
                                onChange={(e) => setBacklogs(Number(e.target.value))}
                                required
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Expected Graduation Year</label>
                            <select
                                value={graduationYear}
                                onChange={(e) => setGraduationYear(Number(e.target.value))}
                                style={styles.input}
                            >
                                <option value={2026}>2026</option>
                                <option value={2027}>2027</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* 6.3 Professional Details */}
                {activeSection === "professional" && (
                    <div style={styles.gridOne}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Technical Skills (Comma separated)</label>
                            <input
                                type="text"
                                placeholder="React, Node.js, Python, SQL"
                                value={skillsInput}
                                onChange={(e) => setSkillsInput(e.target.value)}
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Relevant Certifications</label>
                            <input
                                type="text"
                                placeholder="AWS Certified Practitioner, Java Specialist"
                                value={certificationsInput}
                                onChange={(e) => setCertificationsInput(e.target.value)}
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Academic / Personal Projects</label>
                            <input
                                type="text"
                                placeholder="Placement Portal System, E-commerce App"
                                value={projectsInput}
                                onChange={(e) => setProjectsInput(e.target.value)}
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Internship Experience</label>
                            <input
                                type="text"
                                placeholder="e.g. Software Development Intern (3 Months)"
                                value={internshipInput}
                                onChange={(e) => setInternshipInput(e.target.value)}
                                style={styles.input}
                            />
                        </div>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Upload Resume File (PDF / DOC / DOCX)</label>
                            <div style={styles.fileUploadBox}>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileUpload}
                                    style={styles.fileInput}
                                />
                                <span style={{ fontSize: "24px" }}>📄</span>
                                <span style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                                    {resumeName ? `Resume: ${resumeName}` : "Click to select or drag resume file"}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Save Button */}
                <div style={styles.actionRow}>
                    <button type="submit" disabled={saving} style={styles.saveBtn}>
                        {saving ? "Saving Profile..." : "Save Profile Details ✓"}
                    </button>
                </div>
            </form>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    card: {
        backgroundColor: "#ffffff",
        padding: "24px",
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.03)",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    title: {
        margin: "0 0 4px 0",
        fontSize: "18px",
        fontWeight: "700",
        color: "#0f172a",
    },
    subtitle: {
        margin: 0,
        fontSize: "13px",
        color: "#64748b",
    },
    completenessBadge: {
        backgroundColor: "#dcfce7",
        color: "#15803d",
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "700",
    },
    sectionNav: {
        display: "flex",
        gap: "8px",
        borderBottom: "1px solid #e2e8f0",
        paddingBottom: "12px",
    },
    sectionBtn: {
        padding: "8px 14px",
        backgroundColor: "#f8fafc",
        border: "1px solid #cbd5e1",
        borderRadius: "6px",
        fontSize: "13px",
        fontWeight: "600",
        color: "#64748b",
        cursor: "pointer",
    },
    activeSectionBtn: {
        backgroundColor: "#2563eb",
        color: "#ffffff",
        borderColor: "#2563eb",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    gridTwo: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "16px",
    },
    gridOne: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    inputGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    label: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#334155",
    },
    input: {
        padding: "10px 12px",
        borderRadius: "6px",
        border: "1px solid #cbd5e1",
        fontSize: "14px",
        outline: "none",
    },
    fileUploadBox: {
        border: "2px dashed #cbd5e1",
        borderRadius: "8px",
        padding: "20px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        position: "relative",
        backgroundColor: "#f8fafc",
        cursor: "pointer",
    },
    fileInput: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        opacity: 0,
        cursor: "pointer",
    },
    actionRow: {
        display: "flex",
        justifyContent: "flex-end",
        marginTop: "10px",
    },
    saveBtn: {
        padding: "10px 20px",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        border: "none",
        borderRadius: "6px",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
    },
    successAlert: {
        backgroundColor: "#f0fdf4",
        color: "#166534",
        padding: "10px 14px",
        borderRadius: "6px",
        fontSize: "13px",
        borderLeft: "4px solid #22c55e",
    },
    errorAlert: {
        backgroundColor: "#fef2f2",
        color: "#dc2626",
        padding: "10px 14px",
        borderRadius: "6px",
        fontSize: "13px",
        borderLeft: "4px solid #ef4444",
    },
};

export default StudentProfileForm;
