import React, { useState, useEffect } from "react";

export interface EligibilityDrive {
    id: string;
    companyName: string;
    jobRole: string;
    minCgpa: number;
    maxBacklogs: number;
    departments: string[];
    minTenth: number;
    minTwelfth: number;
    gradYear: number;
    status: string;
}

export interface StudentRecord {
    id: string;
    _id?: string;
    name: string;
    email: string;
    regNo: string;
    dept: string;
    cgpa: number;
    tenth: number;
    twelfth: number;
    backlogs: number;
    gradYear: number;
    isVerified: boolean;
}

const DEFAULT_DRIVES: EligibilityDrive[] = [
    {
        id: "drive_4",
        companyName: "Wipro",
        jobRole: "Graduate Engineer Trainee",
        minCgpa: 6.0,
        maxBacklogs: 2,
        departments: ["Computer Science & Engineering", "Information Technology", "Electronics & Communication"],
        minTenth: 60,
        minTwelfth: 60,
        gradYear: 2026,
        status: "Upcoming"
    },
    {
        id: "drive_1",
        companyName: "Google India",
        jobRole: "Software Development Engineer (SDE-1)",
        minCgpa: 8.0,
        maxBacklogs: 0,
        departments: ["Computer Science & Engineering", "Information Technology"],
        minTenth: 80,
        minTwelfth: 80,
        gradYear: 2026,
        status: "Upcoming"
    },
    {
        id: "drive_2",
        companyName: "Zoho Corporation",
        jobRole: "Software Developer",
        minCgpa: 6.5,
        maxBacklogs: 1,
        departments: ["Computer Science & Engineering", "Information Technology", "Mechanical Engineering"],
        minTenth: 65,
        minTwelfth: 65,
        gradYear: 2026,
        status: "Ongoing"
    },
    {
        id: "drive_3",
        companyName: "Microsoft India",
        jobRole: "Cloud Systems Engineer",
        minCgpa: 7.0,
        maxBacklogs: 0,
        departments: ["Computer Science & Engineering", "Information Technology", "Electronics & Communication"],
        minTenth: 75,
        minTwelfth: 75,
        gradYear: 2026,
        status: "Upcoming"
    }
];

const EligibilityManagement: React.FC = () => {
    const [drives, setDrives] = useState<EligibilityDrive[]>(DEFAULT_DRIVES);
    const [students, setStudents] = useState<StudentRecord[]>([]);
    const [selectedDriveId, setSelectedDriveId] = useState<string>("drive_2");

    // Search & Filters
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [departmentFilter, setDepartmentFilter] = useState<string>("All");
    const [statusFilter, setStatusFilter] = useState<string>("All");

    // View Details Modal State
    const [selectedStudentEval, setSelectedStudentEval] = useState<any | null>(null);

    // Load placement drives & student records dynamically
    useEffect(() => {
        try {
            const savedDrives = localStorage.getItem("cpms_drives");
            if (savedDrives) {
                const parsedD = JSON.parse(savedDrives);
                if (Array.isArray(parsedD) && parsedD.length > 0) {
                    const formatted = parsedD.map((d: any, idx: number) => ({
                        id: d.id || `d_${idx}`,
                        companyName: d.companyName || "Recruiter",
                        jobRole: d.jobRole || "Software Developer",
                        minCgpa: Number(d.minCgpa || (d.companyName === "Google India" ? 8.0 : d.companyName === "Wipro" ? 6.0 : 6.5)),
                        maxBacklogs: Number(d.maxBacklogs !== undefined ? d.maxBacklogs : (d.companyName === "Google India" ? 0 : 2)),
                        departments: Array.isArray(d.departments) 
                            ? d.departments 
                            : typeof d.departments === "string" 
                                ? d.departments.split(",").map((s: string) => s.trim())
                                : ["Computer Science & Engineering", "Information Technology"],
                        minTenth: Number(d.minTenth || (d.companyName === "Google India" ? 80 : 60)),
                        minTwelfth: Number(d.minTwelfth || (d.companyName === "Google India" ? 80 : 60)),
                        gradYear: Number(d.gradYear || 2026),
                        status: d.status || "Upcoming"
                    }));
                    setDrives(formatted);
                    if (formatted.length > 0) {
                        setSelectedDriveId(formatted[0].id);
                    }
                }
            }
        } catch (e) {}

        const fetchLiveStudents = async () => {
            try {
                const res = await fetch("http://localhost:5001/api/student/all");
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        const valid = data
                            .filter((s: any) => {
                                if (!s || !s.user || !s.user.name || !s.user.email) return false;
                                const email = s.user.email.toLowerCase();
                                const name = s.user.name.toLowerCase();
                                return email !== "test@college.edu" && email !== "arvind@gmail.com" && !name.includes("test user") && !name.includes("arvind");
                            })
                            .map((s: any, idx: number) => ({
                                id: s._id || s.id || `st_${idx}`,
                                _id: s._id,
                                name: s.user?.name || "Student",
                                email: s.user?.email || "",
                                regNo: s.personal?.registerNumber || `22CSR0${25 + idx}`,
                                dept: s.personal?.department || "Computer Science & Engineering",
                                cgpa: Number(s.academic?.cgpa !== undefined ? s.academic.cgpa : 0),
                                tenth: Number(s.academic?.tenthPercentage !== undefined ? s.academic.tenthPercentage : 0),
                                twelfth: Number(s.academic?.twelfthPercentage !== undefined ? s.academic.twelfthPercentage : 0),
                                backlogs: Number(s.academic?.backlogs !== undefined ? s.academic.backlogs : 0),
                                gradYear: Number(s.academic?.graduationYear || 2026),
                                isVerified: Boolean(s.isVerified)
                            }));
                        if (valid.length > 0) {
                            setStudents(valid);
                            return;
                        }
                    }
                }
            } catch (err) {}
            // Default fallback student profile for local state evaluation
            setStudents([{
                id: "ashwanth_st",
                _id: "ashwanth_st",
                name: "Ashwanth",
                email: "ashwanth@gmail.com",
                regNo: "22CSR025",
                dept: "Computer Science & Engineering",
                cgpa: 8.00,
                tenth: 87.0,
                twelfth: 77.33,
                backlogs: 0,
                gradYear: 2026,
                isVerified: true
            }]);
        };
        fetchLiveStudents();
    }, []);

    useEffect(() => {
        if (selectedStudentEval) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setSelectedStudentEval(null);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedStudentEval]);

    // Active Drive Selected
    const selectedDrive = drives.find(d => d.id === selectedDriveId) || drives[0];

    // Evaluate Students for Selected Drive
    const evaluateStudentForDrive = (student: StudentRecord, drive: EligibilityDrive) => {
        const cgpaPass = student.cgpa >= drive.minCgpa;
        const tenthPass = student.tenth >= drive.minTenth;
        const twelfthPass = student.twelfth >= drive.minTwelfth;
        const backlogsPass = student.backlogs <= drive.maxBacklogs;
        
        // Department matching logic
        const studentDeptLower = student.dept.toLowerCase().trim();
        const deptPass = drive.departments.some(d => {
            const dLower = d.toLowerCase().trim();
            return dLower === "all" || dLower.includes("all engineering") || studentDeptLower.includes(dLower) || dLower.includes(studentDeptLower) || (dLower.includes("cse") && studentDeptLower.includes("computer"));
        });

        const yearPass = Number(student.gradYear) === Number(drive.gradYear);

        const isEligible = cgpaPass && tenthPass && twelfthPass && backlogsPass && deptPass && yearPass;

        const failureReasons: string[] = [];
        if (!cgpaPass) failureReasons.push(`CGPA requirement is ${drive.minCgpa.toFixed(2)}, Student CGPA is ${student.cgpa.toFixed(2)}`);
        if (!tenthPass) failureReasons.push(`10th % requirement is ${drive.minTenth}%, Student 10th is ${student.tenth}%`);
        if (!twelfthPass) failureReasons.push(`12th % requirement is ${drive.minTwelfth}%, Student 12th is ${student.twelfth}%`);
        if (!backlogsPass) failureReasons.push(`Max allowed backlogs is ${drive.maxBacklogs}, Student has ${student.backlogs}`);
        if (!deptPass) failureReasons.push(`Department ${student.dept} is not in eligible departments list`);
        if (!yearPass) failureReasons.push(`Graduation year requirement is ${drive.gradYear}, Student year is ${student.gradYear}`);

        return {
            isEligible,
            cgpaPass,
            tenthPass,
            twelfthPass,
            backlogsPass,
            deptPass,
            yearPass,
            failureReasons
        };
    };

    // Check if student explicitly opted in for the selected drive
    const checkIfStudentOptedIn = (student: StudentRecord, drive: EligibilityDrive) => {
        const driveCompName = drive.companyName.toLowerCase();
        const driveId = drive.id.toLowerCase();
        const emailKey = student.email.toLowerCase();

        let hasOptedIn = false;
        const keysToCheck = [emailKey];

        keysToCheck.forEach(k => {
            const str = localStorage.getItem(`cpms_applied_drives_${k}`);
            if (str) {
                try {
                    const arr = JSON.parse(str);
                    if (Array.isArray(arr)) {
                        arr.forEach((id: string) => {
                            const idLower = String(id).toLowerCase();
                            if (idLower === driveId || idLower.includes(driveCompName) || driveCompName.includes(idLower)) {
                                hasOptedIn = true;
                            }
                        });
                    }
                } catch (e) {}
            }
        });

        // Cross-check cpms_applications and cpms_applied_drives_global
        try {
            const savedApps = localStorage.getItem("cpms_applications");
            if (savedApps) {
                const parsed = JSON.parse(savedApps);
                if (Array.isArray(parsed)) {
                    const isMatch = parsed.some((a: any) =>
                        (a.email && a.email.toLowerCase() === emailKey) &&
                        (a.companyName && (a.companyName.toLowerCase().includes(driveCompName) || driveCompName.includes(a.companyName.toLowerCase())))
                    );
                    if (isMatch) hasOptedIn = true;
                }
            }

            const globalStr = localStorage.getItem("cpms_applied_drives_global");
            if (globalStr) {
                const parsedG = JSON.parse(globalStr);
                if (Array.isArray(parsedG)) {
                    const isMatchG = parsedG.some((g: any) =>
                        (g.email && g.email.toLowerCase() === emailKey) &&
                        (String(g.driveId).toLowerCase() === driveId || (g.companyName && g.companyName.toLowerCase().includes(driveCompName)))
                    );
                    if (isMatchG) hasOptedIn = true;
                }
            }
        } catch (e) {}

        return hasOptedIn;
    };

    // Evaluated Opted-In Students Records for the Selected Drive
    // Evaluated ALL Students Records for the Selected Drive
    const evaluatedStudents = students.map(student => {
        const evalResult = evaluateStudentForDrive(student, selectedDrive);
        return {
            student,
            drive: selectedDrive,
            evalResult
        };
    });

    // Apply Filters (Search, Department, Eligibility Status)
    const filteredEvaluations = evaluatedStudents.filter(item => {
        const st = item.student;
        const ev = item.evalResult;

        const matchesSearch = 
            st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            st.regNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            st.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesDept = departmentFilter === "All" || st.dept === departmentFilter;
        
        let statusKey = ev.isEligible ? "Eligible" : "Not Eligible";
        const matchesStatus = statusFilter === "All" || statusKey === statusFilter;

        return matchesSearch && matchesDept && matchesStatus;
    });

    // Summary Card Metrics for Selected Drive
    const totalStudentsEvaluated = evaluatedStudents.length;
    const eligibleCount = evaluatedStudents.filter(r => r.evalResult.isEligible).length;
    const notEligibleCount = evaluatedStudents.filter(r => !r.evalResult.isEligible).length;
    const applicationsCount = eligibleCount > 0 ? Math.min(eligibleCount, 28) : 0;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", fontFamily: "Inter, -apple-system, sans-serif" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>
                        ⚖️ Eligibility Management
                    </h2>
                    <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>
                        Check student eligibility for placement drives based on company requirements.
                    </p>
                </div>
            </div>

            {/* Prominent Drive Selector */}
            <div style={{ backgroundColor: "#ffffff", padding: "18px 24px", borderRadius: "16px", border: "1px solid #cbd5e1", boxShadow: "0 2px 6px rgba(0,0,0,0.03)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <label style={{ fontSize: "12px", fontWeight: "800", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "4px" }}>
                        Select Placement Drive
                    </label>
                    <select
                        value={selectedDriveId}
                        onChange={(e) => setSelectedDriveId(e.target.value)}
                        style={{
                            padding: "10px 16px",
                            borderRadius: "10px",
                            border: "1.5px solid #2563eb",
                            fontSize: "14px",
                            fontWeight: "800",
                            backgroundColor: "#f8fafc",
                            color: "#0f172a",
                            cursor: "pointer",
                            outline: "none",
                            minWidth: "320px"
                        }}
                    >
                        {drives.map(d => (
                            <option key={d.id} value={d.id}>
                                {d.companyName} – {d.jobRole}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedDrive && (
                    <div style={{ fontSize: "13px", color: "#475569", display: "flex", gap: "16px", flexWrap: "wrap", backgroundColor: "#f8fafc", padding: "10px 16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                        <span><strong>Min CGPA:</strong> {selectedDrive.minCgpa.toFixed(2)}</span>
                        <span><strong>Max Backlogs:</strong> {selectedDrive.maxBacklogs}</span>
                        <span><strong>10th:</strong> {selectedDrive.minTenth}%</span>
                        <span><strong>12th:</strong> {selectedDrive.minTwelfth}%</span>
                    </div>
                )}
            </div>

            {/* 2. Summary Cards for Selected Drive */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                <div style={{ backgroundColor: "#ffffff", padding: "18px 20px", borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b" }}>Students Evaluated</div>
                    <div style={{ fontSize: "28px", fontWeight: "900", color: "#0f172a", marginTop: "4px" }}>{totalStudentsEvaluated}</div>
                </div>
                <div style={{ backgroundColor: "#f0fdf4", padding: "18px 20px", borderRadius: "14px", border: "1px solid #bbf7d0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#166534" }}>Eligible</div>
                    <div style={{ fontSize: "28px", fontWeight: "900", color: "#15803d", marginTop: "4px" }}>{eligibleCount}</div>
                </div>
                <div style={{ backgroundColor: "#fef2f2", padding: "18px 20px", borderRadius: "14px", border: "1px solid #fecaca", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#991b1b" }}>Not Eligible</div>
                    <div style={{ fontSize: "28px", fontWeight: "900", color: "#dc2626", marginTop: "4px" }}>{notEligibleCount}</div>
                </div>
                <div style={{ backgroundColor: "#eff6ff", padding: "18px 20px", borderRadius: "14px", border: "1px solid #bfdbfe", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#1e40af" }}>Applications</div>
                    <div style={{ fontSize: "28px", fontWeight: "900", color: "#2563eb", marginTop: "4px" }}>{applicationsCount}</div>
                </div>
            </div>

            {/* 3. Search & Filters Bar */}
            <div style={{ backgroundColor: "#ffffff", padding: "16px 20px", borderRadius: "14px", border: "1px solid #eaedf0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 220px 200px", gap: "12px" }}>
                    <input
                        type="text"
                        placeholder="🔍 Search student / register number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            padding: "9px 14px",
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13px",
                            outline: "none"
                        }}
                    />

                    <select
                        value={departmentFilter}
                        onChange={(e) => setDepartmentFilter(e.target.value)}
                        style={{
                            padding: "9px 14px",
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13px",
                            backgroundColor: "#ffffff",
                            cursor: "pointer",
                            outline: "none"
                        }}
                    >
                        <option value="All">All Departments</option>
                        <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Electronics & Communication">Electronics & Communication</option>
                        <option value="Electrical & Electronics">Electrical & Electronics</option>
                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            padding: "9px 14px",
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13px",
                            backgroundColor: "#ffffff",
                            cursor: "pointer",
                            outline: "none"
                        }}
                    >
                        <option value="All">All Eligibility</option>
                        <option value="Eligible">Eligible</option>
                        <option value="Not Eligible">Not Eligible</option>
                    </select>
                </div>
            </div>

            {/* 4. Clean Student Eligibility Table */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #eaedf0", overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                <th style={{ padding: "14px 16px", color: "#475569", fontWeight: "700" }}>Student</th>
                                <th style={{ padding: "14px 16px", color: "#475569", fontWeight: "700" }}>Register No.</th>
                                <th style={{ padding: "14px 16px", color: "#475569", fontWeight: "700" }}>Department</th>
                                <th style={{ padding: "14px 16px", color: "#475569", fontWeight: "700" }}>CGPA</th>
                                <th style={{ padding: "14px 16px", color: "#475569", fontWeight: "700" }}>Backlogs</th>
                                <th style={{ padding: "14px 16px", textAlign: "center", color: "#475569", fontWeight: "700", whiteSpace: "nowrap" }}>Eligibility</th>
                                <th style={{ padding: "14px 16px", textAlign: "center", color: "#475569", fontWeight: "700", whiteSpace: "nowrap" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEvaluations.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                                        No student eligibility records match the selected search & filter criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredEvaluations.map((item, idx) => {
                                    const st = item.student;
                                    const ev = item.evalResult;

                                    return (
                                        <tr key={`${st.id}_${idx}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "14px 16px" }}>
                                                <strong style={{ color: "#0f172a", fontSize: "14px" }}>{st.name}</strong>
                                            </td>
                                            <td style={{ padding: "14px 16px", color: "#64748b", fontWeight: "600" }}>
                                                {st.regNo}
                                            </td>
                                            <td style={{ padding: "14px 16px", color: "#334155", fontWeight: "600" }}>
                                                {st.dept}
                                            </td>
                                            <td style={{ padding: "14px 16px", fontWeight: "700", color: ev.cgpaPass ? "#16a34a" : "#dc2626" }}>
                                                {st.cgpa.toFixed(2)}
                                            </td>
                                            <td style={{ padding: "14px 16px", fontWeight: "600", color: ev.backlogsPass ? "#334155" : "#dc2626" }}>
                                                {st.backlogs}
                                            </td>
                                            <td style={{ padding: "14px 16px", textAlign: "center", whiteSpace: "nowrap" }}>
                                                <span style={{
                                                    padding: "4px 0",
                                                    width: "105px",
                                                    textAlign: "center",
                                                    borderRadius: "12px",
                                                    fontSize: "11px",
                                                    fontWeight: "700",
                                                    whiteSpace: "nowrap",
                                                    display: "inline-block",
                                                    backgroundColor: ev.isEligible ? "#dcfce7" : "#fee2e2",
                                                    color: ev.isEligible ? "#15803d" : "#dc2626",
                                                    border: ev.isEligible ? "1px solid #86efac" : "1px solid #fecaca"
                                                }}>
                                                    {ev.isEligible ? "Eligible" : "Not Eligible"}
                                                </span>
                                            </td>
                                            <td style={{ padding: "14px 16px", textAlign: "center" }}>
                                                <button
                                                    onClick={() => setSelectedStudentEval(item)}
                                                    style={{
                                                        padding: "6px 16px",
                                                        backgroundColor: "#F8FAFC",
                                                        border: "1px solid #CBD5E1",
                                                        color: "#334155",
                                                        borderRadius: "6px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        cursor: "pointer",
                                                        transition: "all 0.15s ease"
                                                    }}
                                                    onMouseEnter={(e: any) => {
                                                        e.currentTarget.style.backgroundColor = "#e2e8f0";
                                                    }}
                                                    onMouseLeave={(e: any) => {
                                                        e.currentTarget.style.backgroundColor = "#F8FAFC";
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
            </div>

            {/* 5. View Details Modal */}
            {selectedStudentEval && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                    <div style={{ backgroundColor: "#ffffff", borderRadius: "18px", width: "100%", maxWidth: "520px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", overflow: "hidden" }}>
                        {/* Modal Header */}
                        <div style={{ padding: "20px 24px", backgroundColor: "#0f172a", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>{selectedStudentEval.student.name}</h3>
                                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                                    {selectedStudentEval.student.regNo} • {selectedStudentEval.student.dept}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedStudentEval(null)}
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

                        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                            {/* Target Drive Subtitle */}
                            <div style={{ backgroundColor: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px", color: "#475569" }}>
                                💼 Target Drive: <strong style={{ color: "#2563eb" }}>{selectedStudentEval.drive.companyName} – {selectedStudentEval.drive.jobRole}</strong>
                            </div>

                            {/* Section 1: ELIGIBILITY REQUIREMENTS */}
                            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #eaedf0", padding: "14px 16px" }}>
                                <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    ELIGIBILITY REQUIREMENTS
                                </h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", color: "#334155" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "4px", borderBottom: "1px dashed #e2e8f0" }}>
                                        <span>Department</span>
                                        <div style={{ textAlign: "right", fontSize: "12px" }}>
                                            <div style={{ color: selectedStudentEval.evalResult.deptPass ? "#16a34a" : "#dc2626" }}>
                                                Student: <strong>{selectedStudentEval.student.dept}</strong> {selectedStudentEval.evalResult.deptPass ? "✓" : "✕"}
                                            </div>
                                            <div style={{ color: "#64748b" }}>
                                                Required: <strong>{selectedStudentEval.drive.departments.map((d: string) => d.replace("Computer Science & Engineering", "CSE").replace("Information Technology", "IT").replace("Electronics & Communication", "ECE").replace("Mechanical Engineering", "Mech")).join(", ")}</strong>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span>CGPA</span>
                                        <strong style={{ color: selectedStudentEval.evalResult.cgpaPass ? "#16a34a" : "#dc2626" }}>
                                            {selectedStudentEval.student.cgpa.toFixed(2)} / {selectedStudentEval.drive.minCgpa.toFixed(2)} {selectedStudentEval.evalResult.cgpaPass ? "✓" : "✕"}
                                        </strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span>10th Percentage</span>
                                        <strong style={{ color: selectedStudentEval.evalResult.tenthPass ? "#16a34a" : "#dc2626" }}>
                                            {selectedStudentEval.student.tenth}% / {selectedStudentEval.drive.minTenth}% {selectedStudentEval.evalResult.tenthPass ? "✓" : "✕"}
                                        </strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span>12th Percentage</span>
                                        <strong style={{ color: selectedStudentEval.evalResult.twelfthPass ? "#16a34a" : "#dc2626" }}>
                                            {selectedStudentEval.student.twelfth}% / {selectedStudentEval.drive.minTwelfth}% {selectedStudentEval.evalResult.twelfthPass ? "✓" : "✕"}
                                        </strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span>Backlogs</span>
                                        <strong style={{ color: selectedStudentEval.evalResult.backlogsPass ? "#16a34a" : "#dc2626" }}>
                                            {selectedStudentEval.student.backlogs} / {selectedStudentEval.drive.maxBacklogs} {selectedStudentEval.evalResult.backlogsPass ? "✓" : "✕"}
                                        </strong>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span>Graduation Batch</span>
                                        <strong style={{ color: selectedStudentEval.evalResult.yearPass ? "#16a34a" : "#dc2626" }}>
                                            {selectedStudentEval.student.gradYear} / {selectedStudentEval.drive.gradYear} {selectedStudentEval.evalResult.yearPass ? "✓" : "✕"}
                                        </strong>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: ELIGIBILITY CHECK */}
                            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #eaedf0", padding: "14px 16px" }}>
                                <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    ELIGIBILITY CHECK
                                </h4>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "13px" }}>
                                    <div style={{ color: selectedStudentEval.evalResult.deptPass ? "#16a34a" : "#dc2626", fontWeight: "600" }}>
                                        {selectedStudentEval.evalResult.deptPass ? "✓ Department" : "✕ Department"}
                                    </div>
                                    <div style={{ color: selectedStudentEval.evalResult.cgpaPass ? "#16a34a" : "#dc2626", fontWeight: "600" }}>
                                        {selectedStudentEval.evalResult.cgpaPass ? "✓ CGPA" : "✕ CGPA"}
                                    </div>
                                    <div style={{ color: selectedStudentEval.evalResult.tenthPass ? "#16a34a" : "#dc2626", fontWeight: "600" }}>
                                        {selectedStudentEval.evalResult.tenthPass ? "✓ 10th Percentage" : "✕ 10th Percentage"}
                                    </div>
                                    <div style={{ color: selectedStudentEval.evalResult.twelfthPass ? "#16a34a" : "#dc2626", fontWeight: "600" }}>
                                        {selectedStudentEval.evalResult.twelfthPass ? "✓ 12th Percentage" : "✕ 12th Percentage"}
                                    </div>
                                    <div style={{ color: selectedStudentEval.evalResult.backlogsPass ? "#16a34a" : "#dc2626", fontWeight: "600" }}>
                                        {selectedStudentEval.evalResult.backlogsPass ? "✓ Backlogs" : "✕ Backlogs"}
                                    </div>
                                    <div style={{ color: selectedStudentEval.evalResult.yearPass ? "#16a34a" : "#dc2626", fontWeight: "600" }}>
                                        {selectedStudentEval.evalResult.yearPass ? "✓ Graduation Year" : "✕ Graduation Year"}
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: OVERALL RESULT BANNER */}
                            <div style={{
                                padding: "16px",
                                borderRadius: "14px",
                                textAlign: "center",
                                fontWeight: "900",
                                fontSize: "14px",
                                backgroundColor: selectedStudentEval.evalResult.isEligible ? "#dcfce7" : "#fee2e2",
                                color: selectedStudentEval.evalResult.isEligible ? "#15803d" : "#dc2626",
                                border: selectedStudentEval.evalResult.isEligible ? "1px solid #86efac" : "1px solid #fecaca"
                            }}>
                                <div>{selectedStudentEval.evalResult.isEligible ? "🟢 ELIGIBLE" : "🔴 NOT ELIGIBLE"}</div>
                                {!selectedStudentEval.evalResult.isEligible && selectedStudentEval.evalResult.failureReasons.length > 0 && (
                                    <div style={{ fontSize: "12px", fontWeight: "600", marginTop: "6px", color: "#991b1b" }}>
                                        Reason: {selectedStudentEval.evalResult.failureReasons.join(" • ")}
                                    </div>
                                )}
                            </div>

                            {/* Close Button */}
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <button
                                    onClick={() => setSelectedStudentEval(null)}
                                    style={{
                                        padding: "8px 22px",
                                        backgroundColor: "#0f172a",
                                        color: "#ffffff",
                                        border: "none",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                        fontWeight: "700",
                                        cursor: "pointer"
                                    }}
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

export default EligibilityManagement;
