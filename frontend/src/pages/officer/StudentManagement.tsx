import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { API_BASE_URL } from "../../config/api";

interface StudentRecord {
  _id?: string;
  id?: string;
  name?: string;
  user: {
    _id?: string;
    id?: string;
    name: string;
    email: string;
    role: string;
  };
  personal?: {
    fullName?: string;
    email?: string;
    phone?: string;
    department?: string;
    registerNumber?: string;
    location?: string;
    gender?: string;
    dob?: string;
  };
  academic?: {
    tenthPercentage?: number | string;
    twelfthPercentage?: number | string;
    cgpa?: number | string;
    backlogs?: number | string;
    graduationYear?: number | string;
    ugInstitution?: string;
    appNumber?: string;
    ugProgram?: string;
    ugSpecialization?: string;
    currentSemester?: string;
    backlogHistory?: number | string;
    schoolName?: string;
    diplomaInstitution?: string;
    diplomaSpecialization?: string;
    pgInstitution?: string;
    pgProgram?: string;
    pgSpecialization?: string;
    pgCgpa?: number | string;
    pgSemester?: string;
    pgGradYear?: number | string;
    [key: string]: any;
  };
  professional?: {
    skills?: string[];
    certifications?: string[];
    projects?: string[];
    internships?: string[];
    resumeName?: string;
    resumeUrl?: string;
  };
  isVerified: boolean;
  verificationStatus?: string;
  pendingFields?: string[];
  isProfileComplete: boolean;
  isPlaced?: boolean;
  placedCompany?: string;
  createdAt?: string;
  email?: string;
}

const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<StudentRecord[]>(() => {
    try {
      const cached = localStorage.getItem("cpms_cached_students_all");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: any) => {
            const sId = s._id || s.id || s.user?._id || "";
            const sEmail = (s.user?.email || "").toLowerCase().trim();

            const savedPlacement =
              localStorage.getItem(`cpms_placement_status_${sEmail}`) ||
              localStorage.getItem(`cpms_placement_status_${sId}`);

            if (savedPlacement === "placed") {
              s.isPlaced = true;
            } else if (savedPlacement === "available") {
              s.isPlaced = false;
            }
            return s;
          });
        }
      }
    } catch (e) { }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      const cached = localStorage.getItem("cpms_cached_students_all");
      if (cached && JSON.parse(cached).length > 0) return false;
    } catch (e) { }
    return true;
  });
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [editForm, setEditForm] = useState<{
    phone: string;
    department: string;
    registerNumber: string;
    tenthPercentage: number | string;
    twelfthPercentage: number | string;
    cgpa: number | string;
    backlogs: number;
    graduationYear: number;
    skills: string;
    projects: string;
  } | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);

  const openStudentModal = (st: StudentRecord) => {
    const sId = st._id || st.id || st.user?._id || "";
    const sEmail = (st.user?.email || "").toLowerCase().trim();

    let updatedSt = { ...st };

    try {
      const savedPendingStr =
        localStorage.getItem(`cpms_pending_profile_${sId}`) ||
        localStorage.getItem(`cpms_pending_profile_${sEmail}`) ||
        localStorage.getItem(`cpms_profile_${sId}`) ||
        localStorage.getItem(`cpms_profile_${sEmail}`) ||
        localStorage.getItem("cpms_pending_profile_global") ||
        localStorage.getItem("cpms_profile_global");

      if (savedPendingStr) {
        const parsed = JSON.parse(savedPendingStr);
        if (parsed.personal) {
          updatedSt.personal = { ...updatedSt.personal, ...parsed.personal };
          if (parsed.personal.fullName) {
            if (updatedSt.user) updatedSt.user = { ...updatedSt.user, name: parsed.personal.fullName };
            updatedSt.name = parsed.personal.fullName;
          }
          if (parsed.personal.email) {
            if (updatedSt.user) updatedSt.user = { ...updatedSt.user, email: parsed.personal.email };
            (updatedSt as any).email = parsed.personal.email;
          }
        }
        if (parsed.academic) {
          updatedSt.academic = { ...updatedSt.academic, ...parsed.academic };
        }
        if (parsed.professional) {
          updatedSt.professional = { ...updatedSt.professional, ...parsed.professional };
        }
      }
    } catch (e) { }

    let diffList: any[] = [];
    try {
      const diffStr =
        localStorage.getItem(`cpms_pending_diff_${sId}`) ||
        localStorage.getItem(`cpms_pending_diff_${sEmail}`) ||
        localStorage.getItem("cpms_pending_diff_global");
      if (diffStr) {
        diffList = JSON.parse(diffStr);
      }
    } catch (e) {}

    // If no stored diff list or stale data, compute exact diff between base record `st` and draft `updatedSt`
    if (!diffList || diffList.length === 0) {
      const addDiff = (field: string, label: string, oldV: any, newV: any) => {
        const normOld = oldV !== undefined && oldV !== null ? String(oldV).trim() : "";
        const normNew = newV !== undefined && newV !== null ? String(newV).trim() : "";
        if (normNew && normOld && normNew !== normOld) {
          diffList.push({ field, label, oldVal: normOld, newVal: normNew });
        }
      };

      addDiff("cgpa", "CGPA", st.academic?.cgpa, updatedSt.academic?.cgpa);
      addDiff("phone", "Phone Number", st.personal?.phone, updatedSt.personal?.phone);
      addDiff("department", "Department", st.personal?.department, updatedSt.personal?.department);
      addDiff("registerNumber", "Register Number", st.personal?.registerNumber, updatedSt.personal?.registerNumber);
      addDiff("location", "Location", st.personal?.location, updatedSt.personal?.location);
      addDiff("ugInstitution", "UG Institution", st.academic?.ugInstitution, updatedSt.academic?.ugInstitution);
      addDiff("appNumber", "Application Number", st.academic?.appNumber, updatedSt.academic?.appNumber);
      addDiff("ugProgram", "UG Program", st.academic?.ugProgram, updatedSt.academic?.ugProgram);
      addDiff("ugSpecialization", "UG Specialization", st.academic?.ugSpecialization, updatedSt.academic?.ugSpecialization);
      addDiff("currentSemester", "Current Semester", st.academic?.currentSemester, updatedSt.academic?.currentSemester);
      addDiff("backlogs", "Current Backlogs", st.academic?.backlogs, updatedSt.academic?.backlogs);
      addDiff("backlogHistory", "Backlog History", st.academic?.backlogHistory, updatedSt.academic?.backlogHistory);
      addDiff("graduationYear", "Graduation Year", st.academic?.graduationYear, updatedSt.academic?.graduationYear);
      addDiff("tenthPercentage", "10th %", st.academic?.tenthPercentage, updatedSt.academic?.tenthPercentage);
      addDiff("twelfthPercentage", "12th %", st.academic?.twelfthPercentage, updatedSt.academic?.twelfthPercentage);
      addDiff("schoolName", "School Name", st.academic?.schoolName, updatedSt.academic?.schoolName);
      addDiff("diplomaInstitution", "Diploma Institution", st.academic?.diplomaInstitution, updatedSt.academic?.diplomaInstitution);
      addDiff("diplomaSpecialization", "Diploma Specialization", st.academic?.diplomaSpecialization, updatedSt.academic?.diplomaSpecialization);
      addDiff("pgInstitution", "PG Institution", st.academic?.pgInstitution, updatedSt.academic?.pgInstitution);
      addDiff("pgProgram", "PG Program", st.academic?.pgProgram, updatedSt.academic?.pgProgram);
      addDiff("pgSpecialization", "PG Specialization", st.academic?.pgSpecialization, updatedSt.academic?.pgSpecialization);
      addDiff("pgCgpa", "PG CGPA", st.academic?.pgCgpa, updatedSt.academic?.pgCgpa);
    }

    (updatedSt as any).changedFields = (st as any).pendingChanges?.changedFields || diffList;
    (updatedSt as any).pendingFields = diffList.map(d => d.field);

    setSelectedStudent(updatedSt);
    setEditForm({
      phone: updatedSt.personal?.phone || "",
      department: updatedSt.personal?.department || "Computer Science & Engineering",
      registerNumber: updatedSt.personal?.registerNumber || "",
      tenthPercentage: updatedSt.academic?.tenthPercentage ?? "",
      twelfthPercentage: updatedSt.academic?.twelfthPercentage ?? "",
      cgpa: updatedSt.academic?.cgpa ?? "",
      backlogs: Number(updatedSt.academic?.backlogs ?? 0),
      graduationYear: Number(updatedSt.academic?.graduationYear ?? 2026),
      skills: Array.isArray(updatedSt.professional?.skills) ? updatedSt.professional.skills.join(", ") : (updatedSt.professional?.skills || ""),
      projects: Array.isArray(updatedSt.professional?.projects) ? updatedSt.professional.projects.join(", ") : (updatedSt.professional?.projects || ""),
    });
  };

  // Search & Filter States (Student Management PDF Spec)
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("All");
  const [yearFilter, setYearFilter] = useState<string>("All");
  const [verificationFilter, setVerificationFilter] = useState<string>("All");
  const [placementFilter, setPlacementFilter] = useState<string>("All");

  const fetchStudents = async () => {
    try {
      if (students.length === 0) {
        setLoading(true);
      }
      let rawData: any[] = [];

      // 1. Fetch from backend API
      try {
        const res = await fetch(`${API_BASE_URL}/api/student/all`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            rawData.push(...data);
          }
        }
      } catch (err) {}

      // 2. Fallback sample students if API is empty
      if (rawData.length === 0) {
        rawData = [
          {
            _id: "ashwanth_st",
            user: { name: "Ashwanth S", email: "ashwanth2567@gmail.com" },
            personal: { fullName: "Ashwanth S", registerNumber: "22CSR025", department: "Computer Science & Engineering", phone: "+91 9876543210" },
            academic: { cgpa: 7.24, tenthPercentage: 87, twelfthPercentage: 77.33, backlogs: 0, graduationYear: 2026 },
            isVerified: false,
            verificationStatus: "pending"
          },
          {
            _id: "rahul_st",
            user: { name: "Rahul Kumar", email: "rahul@college.edu" },
            personal: { fullName: "Rahul Kumar", registerNumber: "22ECR045", department: "Electronics & Communication", phone: "+91 9876543211" },
            academic: { cgpa: 8.40, tenthPercentage: 88, twelfthPercentage: 85, backlogs: 0, graduationYear: 2026 },
            isVerified: true,
            verificationStatus: "verified"
          },
          {
            _id: "priya_st",
            user: { name: "Priyadharshini R", email: "priya@college.edu" },
            personal: { fullName: "Priyadharshini R", registerNumber: "22ITR088", department: "Information Technology", phone: "+91 9876543212" },
            academic: { cgpa: 8.90, tenthPercentage: 92, twelfthPercentage: 90, backlogs: 0, graduationYear: 2026 },
            isVerified: true,
            verificationStatus: "verified"
          },
          {
            _id: "gobi_st",
            user: { name: "Gobi K", email: "gobi@college.edu" },
            personal: { fullName: "Gobi K", registerNumber: "22EEE026", department: "Electrical & Electronics", phone: "+91 9876543213" },
            academic: { cgpa: 7.80, tenthPercentage: 84, twelfthPercentage: 82, backlogs: 0, graduationYear: 2026 },
            isVerified: true,
            verificationStatus: "verified"
          }
        ];
      }

      const studentMap = new Map<string, any>();
      rawData.forEach((s: any) => {
        if (!s) return;

        let sName = s.personal?.fullName || s.user?.name || s.name || "Student";
        let sEmail = (s.personal?.email || s.user?.email || s.email || "").toLowerCase().trim();

        // Standardize student email for active candidate
        if (sEmail === "admin@college.edu" || sName.toLowerCase().includes("ashwanth")) {
          sEmail = "ashwanths.22cse@kongu.edu";
          sName = "Ashwanth";
        }

        // Exclude internal officer/staff roles only
        if (
          !sEmail ||
          sEmail.includes("officer@") ||
          sEmail.includes("tpo@") ||
          sEmail.includes("staff@")
        ) {
          return;
        }

        const sId = s._id || s.id || s.user?._id || sEmail;
        const pendingStatus =
          localStorage.getItem(`cpms_verification_status_${sEmail}`) ||
          localStorage.getItem(`cpms_verification_status_${sId}`) ||
          localStorage.getItem(`cpms_verification_status_admin@college.edu`) ||
          (sEmail.includes("ashwanth") ? localStorage.getItem("cpms_verification_status_global") : null);

        const savedPlacement = localStorage.getItem(`cpms_placement_status_${sEmail}`) || localStorage.getItem(`cpms_placement_status_${sId}`);

        // Check if student updated local profile
        let sRegNo = s.personal?.registerNumber || s.regNo || "22CSR025";
        let sDept = s.personal?.department || s.department || "Computer Science & Engineering";
        let sPhone = s.personal?.phone || s.phone || "9345271959";
        let sCgpa = Number(s.academic?.cgpa !== undefined ? s.academic.cgpa : (s.cgpa || 7.24));
        let sTenth = Number(s.academic?.tenthPercentage !== undefined ? s.academic.tenthPercentage : (s.tenth || 85.0));
        let sTwelfth = Number(s.academic?.twelfthPercentage !== undefined ? s.academic.twelfthPercentage : (s.twelfth || 85.0));
        let sBacklogs = Number(s.academic?.backlogs !== undefined ? s.academic.backlogs : (s.backlogs || 0));
        let sGradYear = Number(s.academic?.graduationYear || s.gradYear || 2026);

        const localDraftStr =
          localStorage.getItem(`cpms_pending_profile_${sEmail}`) ||
          localStorage.getItem(`cpms_pending_profile_${sId}`) ||
          localStorage.getItem(`cpms_profile_${sEmail}`) ||
          localStorage.getItem(`cpms_profile_${sId}`) ||
          localStorage.getItem("cpms_pending_profile_admin@college.edu") ||
          (sEmail.includes("ashwanth") ? (localStorage.getItem("cpms_pending_profile_global") || localStorage.getItem("cpms_profile_global")) : null);
        if (localDraftStr) {
          try {
            const draft = JSON.parse(localDraftStr);
            if (draft.personal?.fullName) sName = draft.personal.fullName;
            if (draft.personal?.registerNumber) sRegNo = draft.personal.registerNumber;
            if (draft.personal?.department) sDept = draft.personal.department;
            if (draft.personal?.phone) sPhone = draft.personal.phone;
            if (draft.academic?.cgpa !== undefined) sCgpa = Number(draft.academic.cgpa);
            if (draft.academic?.tenthPercentage !== undefined) sTenth = Number(draft.academic.tenthPercentage);
            if (draft.academic?.twelfthPercentage !== undefined) sTwelfth = Number(draft.academic.twelfthPercentage);
            if (draft.academic?.backlogs !== undefined) sBacklogs = Number(draft.academic.backlogs);
            if (draft.academic?.graduationYear !== undefined) sGradYear = Number(draft.academic.graduationYear);
          } catch (e) {}
        }

        let isPlaced = Boolean(s.isPlaced);
        if (savedPlacement === "placed") isPlaced = true;
        else if (savedPlacement === "available") isPlaced = false;

        let isVerified = Boolean(s.isVerified === true && s.verificationStatus !== "pending");
        let verificationStatus = isVerified ? "verified" : "pending";

        const hasPendingDraftOrDiff = Boolean(
          localStorage.getItem(`cpms_pending_diff_${sEmail}`) ||
          localStorage.getItem(`cpms_pending_diff_${sId}`) ||
          (sEmail.includes("ashwanth") ? localStorage.getItem("cpms_pending_diff_global") : null)
        );

        if (pendingStatus === "verified" || pendingStatus === "Approved" || (s.isVerified === true && s.verificationStatus === "verified" && pendingStatus !== "pending")) {
          isVerified = true;
          verificationStatus = "verified";
        } else if (pendingStatus === "pending" || pendingStatus === "Pending" || s.verificationStatus === "pending" || hasPendingDraftOrDiff) {
          isVerified = false;
          verificationStatus = "pending";
        }

        studentMap.set(sEmail, {
          _id: sId,
          id: sId,
          user: { name: sName, email: sEmail },
          personal: { fullName: sName, registerNumber: sRegNo, department: sDept, phone: sPhone },
          academic: { cgpa: sCgpa, tenthPercentage: sTenth, twelfthPercentage: sTwelfth, backlogs: sBacklogs, graduationYear: sGradYear },
          professional: s.professional || { skills: [], projects: [], resumeName: "", resumeUrl: "" },
          isVerified,
          verificationStatus,
          isPlaced
        });
      });

      // Synchronize pending profile status across all candidate records
      for (const [, st] of studentMap.entries()) {
        const sEmail = (st.user?.email || "").toLowerCase().trim();
        const sId = st._id || st.id || "";
        const pStatus =
          localStorage.getItem(`cpms_verification_status_${sEmail}`) ||
          localStorage.getItem(`cpms_verification_status_${sId}`) ||
          localStorage.getItem(`cpms_verification_status_admin@college.edu`) ||
          (sEmail.includes("ashwanth") ? localStorage.getItem("cpms_verification_status_global") : null);

        const hasDiff = Boolean(
          localStorage.getItem(`cpms_pending_diff_${sEmail}`) ||
          localStorage.getItem(`cpms_pending_diff_${sId}`) ||
          (sEmail.includes("ashwanth") ? localStorage.getItem("cpms_pending_diff_global") : null)
        );

        if (pStatus === "verified" || pStatus === "Approved" || (st.isVerified && pStatus !== "pending")) {
          st.isVerified = true;
          st.verificationStatus = "verified";
        } else if (pStatus === "pending" || pStatus === "Pending" || hasDiff) {
          st.isVerified = false;
          st.verificationStatus = "pending";
        }
      }

      // Filter out duplicate ashwanth2567 if ashwanths.22cse@kongu.edu is present
      if (studentMap.has("ashwanths.22cse@kongu.edu")) {
        studentMap.delete("ashwanth2567@gmail.com");
      }

      const valid = Array.from(studentMap.values());
      if (valid.length === 0) {
        valid.push({
          _id: "ashwanth_st",
          id: "ashwanth_st",
          user: { name: "Ashwanth", email: "ashwanths.22cse@kongu.edu" },
          personal: { fullName: "Ashwanth", registerNumber: "22CSR025", department: "Computer Science & Engineering" },
          academic: { cgpa: 7.60, tenthPercentage: 85.0, twelfthPercentage: 85.0, backlogs: 0, graduationYear: 2026 },
          isVerified: false,
          verificationStatus: "pending",
          isPlaced: false
        });
      }
      setStudents(valid);
      try {
        localStorage.setItem("cpms_cached_students_all", JSON.stringify(valid));
      } catch (e) { }
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();

    // 2-second real-time polling to immediately discover any newly logged-in/registered student
    const interval = setInterval(() => {
      fetchStudents();
    }, 2000);

    const handleProfileUpdated = () => {
      fetchStudents();
    };

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("cpms_profile_channel");
      channel.onmessage = (event) => {
        if (event.data) {
          fetchStudents();
        }
      };
    } catch (e) { }

    window.addEventListener("cpms_profile_updated", handleProfileUpdated);
    window.addEventListener("storage", handleProfileUpdated);
    return () => {
      clearInterval(interval);
      if (channel) channel.close();
      window.removeEventListener("cpms_profile_updated", handleProfileUpdated);
      window.removeEventListener("storage", handleProfileUpdated);
    };
  }, []);

  useEffect(() => {
    const isAnyModalOpen = selectedStudent !== null || showRejectModal;
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedStudent(null);
        setShowRejectModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedStudent, showRejectModal]);

  const handleVerify = async (studentId?: string) => {
    const targetId = studentId || selectedStudent?._id || (selectedStudent as any)?.id || selectedStudent?.user?._id || "";
    if (!targetId) return;

    const userKey = (selectedStudent?.user?.email || (selectedStudent as any)?.email || targetId).toLowerCase().trim();
    const studentIdKey = selectedStudent?._id || (selectedStudent as any)?.id || "";
    const userIdKey = selectedStudent?.user?._id || "";

    setStudents(prev => {
      const updated = prev.map(s => (s._id === targetId || (s as any).id === targetId || s.user?._id === targetId || (s.user?.email && s.user.email.toLowerCase().trim() === userKey)) ? { ...s, isVerified: true, verificationStatus: "verified", isProfileComplete: true, pendingFields: [] } : s);
      try {
        localStorage.setItem("cpms_cached_students_all", JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });

    if (selectedStudent) {
      setSelectedStudent(prev => prev ? { ...prev, isVerified: true, verificationStatus: "verified", isProfileComplete: true, pendingFields: [] } : null);
    }

    try {
      localStorage.setItem(`cpms_verification_status_${userKey}`, "verified");
      localStorage.setItem(`cpms_verification_status_${targetId}`, "verified");
      localStorage.setItem(`cpms_verified_student_${userKey}`, "true");
      localStorage.setItem(`cpms_profile_verified_${targetId}`, "true");
      localStorage.setItem(`cpms_profile_verified_${userKey}`, "true");
      if (studentIdKey) {
        localStorage.setItem(`cpms_profile_verified_${studentIdKey}`, "true");
        localStorage.setItem(`cpms_verification_status_${studentIdKey}`, "verified");
      }
      if (userIdKey) {
        localStorage.setItem(`cpms_profile_verified_${userIdKey}`, "true");
        localStorage.setItem(`cpms_verification_status_${userIdKey}`, "verified");
      }
      localStorage.setItem(`cpms_profile_verified_global`, "true");
      localStorage.setItem("cpms_verification_updated", String(Date.now()));

      // Clean up all pending diff and draft keys so verification persists cleanly
      localStorage.removeItem(`cpms_pending_diff_${userKey}`);
      localStorage.removeItem(`cpms_pending_diff_${targetId}`);
      if (studentIdKey) localStorage.removeItem(`cpms_pending_diff_${studentIdKey}`);
      if (userIdKey) localStorage.removeItem(`cpms_pending_diff_${userIdKey}`);
      localStorage.removeItem("cpms_pending_diff_global");

      localStorage.removeItem(`cpms_pending_profile_${userKey}`);
      localStorage.removeItem(`cpms_pending_profile_${targetId}`);
      if (studentIdKey) localStorage.removeItem(`cpms_pending_profile_${studentIdKey}`);
      if (userIdKey) localStorage.removeItem(`cpms_pending_profile_${userIdKey}`);
      localStorage.removeItem("cpms_pending_profile_global");

      localStorage.removeItem(`cpms_pending_fields_${userKey}`);
      localStorage.removeItem(`cpms_pending_fields_${targetId}`);
      if (studentIdKey) localStorage.removeItem(`cpms_pending_fields_${studentIdKey}`);
      if (userIdKey) localStorage.removeItem(`cpms_pending_fields_${userIdKey}`);
      localStorage.removeItem("cpms_pending_fields_global");

      try {
        const channel = new BroadcastChannel("cpms_profile_channel");
        channel.postMessage({ type: "PROFILE_VERIFIED", isVerified: true, studentId: targetId, studentEmail: userKey });
        channel.close();
      } catch (e) { }
    } catch (e) { }

    setActionMessage({ type: "success", text: ` Verified & Approved Student Profile` });

    try {
      await fetch(`${API_BASE_URL}/api/student/verify/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: true, pendingFields: [] }),
      });
      window.dispatchEvent(new Event("cpms_profile_updated"));
      window.dispatchEvent(new Event("cpms_verification_updated"));
      fetchStudents();
    } catch (err) { }

    setTimeout(() => {
      setSelectedStudent(null);
      setActionMessage(null);
    }, 1200);
  };

  const handleSaveAndVerify = async (shouldVerify: boolean = true) => {
    if (!selectedStudent || !editForm) return;

    const targetId = selectedStudent._id || (selectedStudent as any).id || selectedStudent.user?._id || "";
    if (!targetId) return;

    const updatedAcademic = {
      tenthPercentage: parseFloat(String(editForm.tenthPercentage)) || 0,
      twelfthPercentage: parseFloat(String(editForm.twelfthPercentage)) || 0,
      cgpa: parseFloat(String(editForm.cgpa)) || 0,
      backlogs: parseInt(String(editForm.backlogs)) || 0,
      graduationYear: parseInt(String(editForm.graduationYear)) || 2026,
    };

    const updatedPersonal = {
      phone: editForm.phone,
      department: editForm.department,
      registerNumber: editForm.registerNumber,
    };

    const updatedProfessional = {
      ...selectedStudent.professional,
      skills: editForm.skills.split(",").map(s => s.trim()).filter(Boolean),
      projects: editForm.projects.split(",").map(s => s.trim()).filter(Boolean),
    };

    setStudents(prev => {
      const updated = prev.map(s => {
        const idMatch = s._id === targetId || (s as any).id === targetId || s.user?._id === targetId;
        if (idMatch) {
          return {
            ...s,
            personal: updatedPersonal,
            academic: updatedAcademic,
            professional: updatedProfessional,
            isVerified: shouldVerify ? true : s.isVerified,
            verificationStatus: shouldVerify ? "verified" : s.verificationStatus,
            isProfileComplete: true,
          };
        }
        return s;
      });
      try {
        localStorage.setItem("cpms_cached_students_all", JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });

    const userKey = (selectedStudent.user?.email || (selectedStudent as any)?.email || targetId).toLowerCase().trim();
    const studentIdKey = selectedStudent?._id || (selectedStudent as any)?.id || "";
    const userIdKey = selectedStudent?.user?._id || "";

    if (shouldVerify) {
      try {
        localStorage.setItem(`cpms_verification_status_${userKey}`, "verified");
        localStorage.setItem(`cpms_verified_student_${userKey}`, "true");
        localStorage.setItem(`cpms_profile_verified_${targetId}`, "true");
        localStorage.setItem(`cpms_profile_verified_${userKey}`, "true");
        if (studentIdKey) {
          localStorage.setItem(`cpms_profile_verified_${studentIdKey}`, "true");
          localStorage.setItem(`cpms_verification_status_${studentIdKey}`, "verified");
        }
        if (userIdKey) {
          localStorage.setItem(`cpms_profile_verified_${userIdKey}`, "true");
          localStorage.setItem(`cpms_verification_status_${userIdKey}`, "verified");
        }
        localStorage.setItem(`cpms_profile_verified_global`, "true");
        localStorage.setItem("cpms_verification_updated", String(Date.now()));

        try {
          const channel = new BroadcastChannel("cpms_profile_channel");
          channel.postMessage({ type: "PROFILE_VERIFIED", isVerified: true, studentId: targetId, studentEmail: userKey });
          channel.close();
        } catch (e) { }
      } catch (e) { }
    }

    setActionMessage({
      type: "success",
      text: shouldVerify
        ? ` Updated & Verified ${selectedStudent.user?.name}'s Profile!`
        : ` Saved Changes for ${selectedStudent.user?.name}`,
    });

    setSelectedStudent(null);
    setEditForm(null);

    try {
      await fetch(`${API_BASE_URL}/api/student/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetId,
          personal: updatedPersonal,
          academic: updatedAcademic,
          professional: updatedProfessional,
        }),
      });
    } catch (err) { }

    if (shouldVerify) {
      try {
        await fetch(`${API_BASE_URL}/api/student/verify/${targetId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isVerified: true }),
        });
        window.dispatchEvent(new Event("cpms_profile_updated"));
        window.dispatchEvent(new Event("cpms_verification_updated"));
      } catch (err) { }
    }

    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleUnverify = async (studentId?: string) => {
    const targetId = studentId || selectedStudent?._id || selectedStudent?.id || selectedStudent?.user?._id;
    if (!targetId) return;

    setStudents(prev => prev.map(s => (s._id === targetId || s.id === targetId || s.user?._id === targetId) ? { ...s, isVerified: false } : s));
    if (selectedStudent) {
      setSelectedStudent(prev => prev ? { ...prev, isVerified: false } : null);
    }
    setActionMessage({ type: "error", text: `Revoked Verification for Student` });

    try {
      await fetch(`${API_BASE_URL}/api/student/verify/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: false }),
      });
    } catch (err) { }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleReject = async () => {
    if (!selectedStudent) return;
    const targetId = selectedStudent._id || selectedStudent.id || selectedStudent.user?._id || "";
    const targetName = selectedStudent.user?.name || "Student";
    if (!targetId) return;

    setStudents(prev => prev.map(s => (s._id === targetId || s.id === targetId || s.user?._id === targetId) ? { ...s, isVerified: false, isProfileComplete: false } : s));
    setSelectedStudent(prev => prev ? { ...prev, isVerified: false, isProfileComplete: false } : null);
    setShowRejectModal(false);
    setActionMessage({ type: "error", text: ` Rejected ${targetName} Profile` });

    try {
      await fetch(`${API_BASE_URL}/api/student/reject/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: rejectionReason || "Academic criteria verification failed" }),
      });
    } catch (err) { }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleTogglePlacementStatus = async (studentId?: string, isPlacedTarget?: boolean, companyNameTarget?: string) => {
    const targetStudent = selectedStudent || students.find(s => s._id === studentId || s.id === studentId || s.user?._id === studentId);
    const targetId = studentId || targetStudent?._id || targetStudent?.id || targetStudent?.user?._id || "";
    if (!targetId) return;

    const currentPlaced = targetStudent ? isStudentPlaced(targetStudent) : false;
    const newPlaced = isPlacedTarget !== undefined ? isPlacedTarget : !currentPlaced;

    let newCompany = "";
    if (newPlaced) {
      if (companyNameTarget) {
        newCompany = companyNameTarget;
      } else {
        const entered = prompt("Enter placed company name & package (e.g. Zoho Corporation • ₹12 LPA):", "Zoho Corporation (Software Developer • ₹12 LPA)");
        if (entered === null) return;
        newCompany = entered || "Placed at Zoho Corporation (Software Developer • ₹12 LPA)";
      }
    }

    const userKey = (targetStudent?.user?.email || "").toLowerCase().trim();
    if (userKey) localStorage.setItem(`cpms_placement_status_${userKey}`, newPlaced ? "placed" : "available");
    if (targetId) localStorage.setItem(`cpms_placement_status_${targetId}`, newPlaced ? "placed" : "available");

    setStudents(prev => {
      const updated = prev.map(s => (s._id === targetId || s.id === targetId || s.user?._id === targetId) ? { ...s, isPlaced: newPlaced, placedCompany: newCompany } : s);
      try {
        localStorage.setItem("cpms_cached_students_all", JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });

    if (selectedStudent && (selectedStudent._id === targetId || selectedStudent.id === targetId || selectedStudent.user?._id === targetId)) {
      setSelectedStudent(prev => prev ? { ...prev, isPlaced: newPlaced, placedCompany: newCompany } : null);
    }
    setActionMessage({ type: "success", text: `Updated Placement Status: ${newPlaced ? "Placed" : "Available"}` });

    try {
      await fetch(`${API_BASE_URL}/api/student/placement-status/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPlaced: newPlaced, placedCompany: newCompany }),
      });
    } catch (err) { }
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleDeleteStudent = (studentId?: string) => {
    if (!studentId) return;
    const confirmDelete = window.confirm("Are you sure you want to delete this student record?");
    if (!confirmDelete) return;

    setStudents(prev => {
      const updated = prev.filter(s => s._id !== studentId && s.id !== studentId && s.user?._id !== studentId);
      try {
        localStorage.setItem("cpms_cached_students_all", JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });
    if (selectedStudent && (selectedStudent._id === studentId || selectedStudent.id === studentId || selectedStudent.user?._id === studentId)) {
      setSelectedStudent(null);
    }
    setActionMessage({ type: "success", text: "Student record deleted successfully" });
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleDownloadResume = (resumeUrl?: string, resumeName?: string, studentName?: string) => {
    const targetName = resumeName || `${studentName || "Student"}_Resume.pdf`;

    // If actual uploaded file exists in backend uploads directory
    if (resumeUrl) {
      const fullUrl = resumeUrl.startsWith("http")
        ? resumeUrl
        : `${API_BASE_URL}${resumeUrl.startsWith("/") ? "" : "/"}${resumeUrl}`;

      // Create invisible anchor to trigger browser download and open
      const link = document.createElement("a");
      link.href = fullUrl;
      link.target = "_blank";
      link.download = targetName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Generate clean ATS Candidate Resume document for download & view
    const doc = new jsPDF();
    const sName = studentName || selectedStudent?.user?.name || "Ashwanth S";
    const email = selectedStudent?.user?.email || "ashwanth@gmail.com";
    const phone = selectedStudent?.personal?.phone || "+91 98765 43210";
    const dept = selectedStudent?.personal?.department || "Computer Science & Engineering";
    const regNo = selectedStudent?.personal?.registerNumber || "22CSR025";
    const cgpa = selectedStudent?.academic?.cgpa || 8.80;
    const tenth = selectedStudent?.academic?.tenthPercentage || 85.0;
    const twelfth = selectedStudent?.academic?.twelfthPercentage || 85.0;

    // Title Header
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.rect(0, 0, 210, 36, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text(sName.toUpperCase(), 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(56, 189, 248); // #38bdf8
    doc.text(`${dept} | Reg No: ${regNo}`, 14, 28);

    // Contact Info
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Email: ${email} | Phone: ${phone}`, 14, 46);

    // Line Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 52, 196, 52);

    // Section: ACADEMIC PROFILE
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("ACADEMIC PROFILE", 14, 62);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(`• Cumulative Grade Point Average (CGPA): ${cgpa} / 10.0`, 18, 70);
    doc.text(`• 10th Standard Score: ${tenth}%`, 18, 77);
    doc.text(`• 12th Standard Score: ${twelfth}%`, 18, 84);
    doc.text(`• Active Backlogs: 0`, 18, 91);
    doc.text(`• Graduation Batch Year: 2026`, 18, 98);

    // Section: TECHNICAL SKILLS
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("TECHNICAL SKILLS & COMPETENCIES", 14, 112);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("• Languages & Frameworks: React, Node.js, Python, TypeScript, SQL, HTML/CSS", 18, 120);
    doc.text("• Tools & Version Control: Git, GitHub, VS Code, REST APIs, MongoDB", 18, 127);
    doc.text("• Core Computer Science: Data Structures, Algorithms, OOP, Database Management Systems", 18, 134);

    // Section: PROJECTS & EXPERIENCES
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("KEY PROJECTS & EXPERIENCE", 14, 148);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("College Placement Management System (Full-Stack Web App)", 18, 156);
    doc.setFont("helvetica", "normal");
    doc.text("- Implemented end-to-end recruitment drives, eligibility filters, ATS resume tracking & officer portal.", 22, 163);
    doc.text("- Developed real-time dashboard analytics, placement confirmation workflows, and notification system.", 22, 170);

    // Section: PLACEMENT & SELECTIONS
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("CAMPUS PLACEMENT STATUS", 14, 184);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(22, 163, 74);
    doc.text("• Status: VERIFIED & PLACED", 18, 192);
    doc.setTextColor(51, 65, 85);
    doc.text("• Company Offer: Zoho Corporation (Software Developer • package ₹12 LPA)", 18, 199);

    // Footer Sign-off
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text("Verified Official ATS Resume Document - Placement Cell Sign-Off ", 14, 280);

    // Save & Open in Browser window
    doc.save(targetName);
    const pdfDataUri = doc.output("dataurlnewwindow");
  };

  const isStudentPlaced = (st: any) => {
    if (!st) return false;
    const sId = st._id || st.id || st.user?._id || "";
    const sEmail = (st.user?.email || "").toLowerCase().trim();

    try {
      const savedPlacement =
        (sEmail && localStorage.getItem(`cpms_placement_status_${sEmail}`)) ||
        (sId && localStorage.getItem(`cpms_placement_status_${sId}`));

      if (savedPlacement === "placed") return true;
      if (savedPlacement === "available") return false;
    } catch (e) { }

    return Boolean(st.isPlaced || st.placementStatus === "Placed");
  };

  // Filtered Students Array based on Search & Dropdowns
  const filteredStudents = students.filter((st) => {
    if (!st || !st.user || !st.user.name || !st.user.email) return false;

    const emailStr = (st.user.email || "").toLowerCase();
    const nameStr = (st.user.name || "").toLowerCase();

    // Exclude unwanted legacy test artifacts
    if (emailStr === "test@college.edu" || emailStr === "arvind@gmail.com" || nameStr.includes("test user") || nameStr.includes("arvind")) {
      return false;
    }

    const regNo = st.personal?.registerNumber || "";
    const matchesSearch =
      nameStr.includes(searchQuery.toLowerCase()) ||
      emailStr.includes(searchQuery.toLowerCase()) ||
      regNo.toLowerCase().includes(searchQuery.toLowerCase());

    const dept = st.personal?.department || "Computer Science & Engineering";
    const matchesDept = departmentFilter === "All" || dept === departmentFilter;

    const year = String(st.academic?.graduationYear || 2026);
    const matchesYear = yearFilter === "All" || year === yearFilter;

    let statusKey = "Pending Verification";
    if (st.isVerified) statusKey = "Verified";
    else if (st.isProfileComplete === false) statusKey = "Rejected";

    const matchesStatus = verificationFilter === "All" || statusKey === verificationFilter;

    const isPlaced = isStudentPlaced(st);
    const matchesPlacement =
      placementFilter === "All" ||
      (placementFilter === "Placed" && isPlaced) ||
      (placementFilter === "Not Placed" && !isPlaced);

    return matchesSearch && matchesDept && matchesYear && matchesStatus && matchesPlacement;
  });

  // Calculate Summary Metrics Dynamically
  const totalCount = students.length;
  const verifiedCount = students.filter(s => s.isVerified).length;
  const pendingCount = students.filter(s => !s.isVerified && s.isProfileComplete !== false).length;
  const placedCount = students.filter(s => isStudentPlaced(s)).length;

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>
             Student Management
          </h2>
          <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "#64748b" }}>
            Manage student profiles, verify academic criteria, and track placement statuses.
          </p>
        </div>
        <button onClick={fetchStudents} style={styles.refreshBtn}>
           Refresh List
        </button>
      </div>

      {/* Top Metric Cards Matching Dashboard Card Style */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        {[
          { label: "Total Students", value: totalCount, sub: "Registered candidate profiles", color: "#4F46E5", bg: "#EEF2FF", svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.3"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
          { label: "Verified Profiles", value: verifiedCount, sub: "Approved for campus drives", color: "#059669", bg: "#DCFCE7", svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
          { label: "Pending Verification", value: pendingCount, sub: "Awaiting officer audit", color: "#D97706", bg: "#FEF3C7", svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
          { label: "Placed Candidates", value: placedCount, sub: `${totalCount > 0 ? Math.round((placedCount / totalCount) * 100) : 0}% Placement Rate`, color: "#16A34A", bg: "#DCFCE7", svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.3"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17M14 14.66V17M18 4H6v7a6 6 0 0 0 12 0V4z"/></svg> }
        ].map((kpi, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: "#FFFFFF",
              padding: "16px 18px",
              borderRadius: "12px",
              border: "1px solid #E2E8F0",
              borderTop: `4px solid ${kpi.color}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              transition: "all 0.18s ease-in-out"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>{kpi.label}</span>
              <span style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {kpi.svg}
              </span>
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", marginTop: "6px" }}>{kpi.value}</div>
            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div style={{ backgroundColor: "#ffffff", padding: "14px 18px", borderRadius: "14px", border: "1px solid #eaedf0", marginBottom: "18px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          <input
            type="text"
            placeholder="Search Student, Email, Reg No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", outline: "none" }}
          />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#fff", outline: "none" }}
          >
            <option value="All">Department: All</option>
            <option value="Computer Science & Engineering">CSE</option>
            <option value="Information Technology">IT</option>
            <option value="Electronics & Communication">ECE</option>
            <option value="Electrical & Electronics">EEE</option>
            <option value="Mechanical Engineering">Mechanical</option>
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#fff", outline: "none" }}
          >
            <option value="All">Graduation Year: All</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#fff", outline: "none" }}
          >
            <option value="All">Verification: All</option>
            <option value="Verified">Verified </option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {actionMessage && (
        <div style={actionMessage.type === "success" ? styles.successBox : styles.errorBox}>
          {actionMessage.text}
        </div>
      )}

      {/* Clean Main Table Container */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #eaedf0", overflow: "hidden", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
        <div className="responsive-table-wrapper" style={{ overflowX: "auto", overflowY: "auto", maxHeight: "550px", WebkitOverflowScrolling: "touch" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "720px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", position: "sticky", top: 0, zIndex: 10 }}>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontWeight: "700" }}>Student</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#64748b", fontWeight: "700" }}>Department</th>
                <th style={{ padding: "12px 16px", textAlign: "center", color: "#64748b", fontWeight: "700" }}>CGPA</th>
                <th style={{ padding: "12px 16px", textAlign: "center", color: "#64748b", fontWeight: "700" }}>Graduation</th>
                <th style={{ padding: "12px 16px", textAlign: "center", color: "#64748b", fontWeight: "700" }}>Verification</th>
                <th style={{ padding: "12px 16px", textAlign: "center", color: "#64748b", fontWeight: "700" }}>Placement</th>
                <th style={{ padding: "12px 16px", textAlign: "center", color: "#64748b", fontWeight: "700" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
                    No student profiles found matching selected filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const isPlaced = isStudentPlaced(st);
                  return (
                    <tr key={st._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <strong style={{ color: "#0f172a", fontSize: "13px", display: "block" }}>{st.personal?.fullName || st.user?.name || "Student"}</strong>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>{st.personal?.email || st.user?.email || (st as any).email}</span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#334155", fontWeight: "600" }}>
                        {st.personal?.department || "CSE"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center", color: "#16a34a", fontWeight: "700" }}>
                        {st.academic?.cgpa || 7.24}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center", color: "#475569", fontWeight: "600" }}>
                        {st.academic?.graduationYear || 2026}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <span style={{ padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", backgroundColor: st.isProfileComplete === false ? "#fee2e2" : st.isVerified ? "#dcfce7" : "#fffbeb", color: st.isProfileComplete === false ? "#dc2626" : st.isVerified ? "#15803d" : "#b45309", border: st.isProfileComplete === false ? "1px solid #fecaca" : st.isVerified ? "1px solid #86efac" : "1px solid #fde68a" }}>
                          {st.isProfileComplete === false ? "Rejected " : st.isVerified ? "Verified " : "Pending"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePlacementStatus(st._id || st.id || st.user?._id);
                          }}
                          title="Click to toggle placement status (Placed / Available)"
                          style={{
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "700",
                            backgroundColor: isPlaced ? "#eff6ff" : "#f8fafc",
                            color: isPlaced ? "#2563eb" : "#64748b",
                            border: isPlaced ? "1px solid #bfdbfe" : "1px solid #cbd5e1",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                          }}
                        >
                          {isPlaced ? "Placed" : "Available"}
                        </button>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => openStudentModal(st)}
                          title="View Details"
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            backgroundColor: "#f8fafc",
                            border: "1.5px solid #cbd5e1",
                            color: "#475569",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.15s ease",
                            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)"
                          }}
                          onMouseEnter={(e: any) => {
                            e.currentTarget.style.backgroundColor = "#eff6ff";
                            e.currentTarget.style.borderColor = "#2563eb";
                            e.currentTarget.style.color = "#2563eb";
                          }}
                          onMouseLeave={(e: any) => {
                            e.currentTarget.style.backgroundColor = "#f8fafc";
                            e.currentTarget.style.borderColor = "#cbd5e1";
                            e.currentTarget.style.color = "#475569";
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
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

      {/* Student Details Verification Modal for Placement Officer */}
      {selectedStudent && (() => {
        let pendingFields: string[] = [];
        if ((selectedStudent as any).changedFields && Array.isArray((selectedStudent as any).changedFields)) {
          pendingFields = (selectedStudent as any).changedFields.map((c: any) => c.field);
        } else if (Array.isArray(selectedStudent.pendingFields)) {
          pendingFields = selectedStudent.pendingFields;
        }

        if (selectedStudent.isVerified && selectedStudent.verificationStatus === "verified") {
          pendingFields = [];
        }

        const isFieldPending = (fieldName: string) => {
          if (selectedStudent.isVerified && selectedStudent.verificationStatus === "verified") return false;

          // Strictly check if the field is in the changed fields list
          if ((selectedStudent as any).changedFields && Array.isArray((selectedStudent as any).changedFields)) {
            return (selectedStudent as any).changedFields.some((c: any) => c.field === fieldName);
          }

          if (pendingFields && Array.isArray(pendingFields) && pendingFields.length > 0) {
            return pendingFields.includes(fieldName);
          }

          return false;
        };

        const pendingBadgeStyle: React.CSSProperties = {
          fontSize: "10px",
          backgroundColor: "#FEF3C7",
          color: "#92400E",
          padding: "2px 7px",
          borderRadius: "5px",
          fontWeight: "700",
          marginLeft: "6px",
          border: "1px solid #FCD34D",
          display: "inline-flex",
          alignItems: "center",
          gap: "3px",
          verticalAlign: "middle",
          lineHeight: "1.2",
          boxShadow: "0 1px 2px rgba(180, 83, 9, 0.08)"
        };

        return (
          <div
            onClick={() => setSelectedStudent(null)}
            style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ backgroundColor: "#ffffff", borderRadius: "18px", maxWidth: "600px", width: "100%", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
            >
              {/* Modal Header */}
              <div style={{ backgroundColor: "#0f172a", color: "#ffffff", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#ffffff" }}>
                    {selectedStudent.user?.name || "Student Profile"}
                  </h3>
                  <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: "600" }}>{selectedStudent.personal?.department || "Computer Science & Engineering"}</span>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
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
                  }}
                  title="Close Modal (Esc)"
                >
                  
                </button>
              </div>

              {/* Modal Body - Clean Read-Only Profile Details for Verification with Field-level Badges */}
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", maxHeight: "72vh", overflowY: "auto" }}>

                {/* Pending Verification Banner */}
                {!selectedStudent.isVerified && (
                  <div style={{
                    backgroundColor: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    color: "#b45309",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    <span style={{ fontSize: "16px" }}>️</span>
                    <div>
                      <strong style={{ color: "#92400e" }}>Pending Officer Verification:</strong>{" "}
                      <span style={{ fontSize: "11px", color: "#b45309" }}>
                        Fields tagged with <span style={pendingBadgeStyle}>⏳ Pending</span> were edited by the student.
                      </span>
                    </div>
                  </div>
                )}

                {/* Personal Details */}
                <div style={{ backgroundColor: "#f8fafc", padding: "14px 18px", borderRadius: "12px", border: "1px solid #eaedf0" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Personal & Contact Details</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", color: "#334155" }}>
                    <div><strong>Email:</strong> {selectedStudent.personal?.email || selectedStudent.user?.email || (selectedStudent as any).email || "ashwanths.22cse@kongu.edu"}</div>
                    <div>
                      <strong>Phone:</strong> {selectedStudent.personal?.phone || "9345271959"}
                      {isFieldPending("phone") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                    </div>
                    <div>
                      <strong>Register Number:</strong> {selectedStudent.personal?.registerNumber || "22CSR025"}
                      {isFieldPending("registerNumber") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                    </div>
                    <div>
                      <strong>Department:</strong> {selectedStudent.personal?.department || "Computer Science & Engineering"}
                      {isFieldPending("department") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                    </div>
                    <div>
                      <strong>Location / City:</strong> {selectedStudent.personal?.location || "Erode"}
                      {isFieldPending("location") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                    </div>
                    <div>
                      <strong>Gender:</strong> {selectedStudent.personal?.gender || "Male"}
                      {isFieldPending("gender") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                    </div>
                  </div>
                </div>

                {/* Undergraduate (UG) Details */}
                <div style={{ backgroundColor: "#f8fafc", padding: "14px 18px", borderRadius: "12px", border: "1px solid #eaedf0" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Undergraduate (UG) Details</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", color: "#334155" }}>
                    <div>
                      <strong>UG Institution:</strong> {selectedStudent.academic?.ugInstitution || "KEC"}
                      {isFieldPending("ugInstitution") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                    </div>
                    <div>
                      <strong>Application Number:</strong> {selectedStudent.academic?.appNumber || "291930"}
                      {isFieldPending("appNumber") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                    </div>
                    <div>
                      <strong>UG Program (Degree):</strong> {selectedStudent.academic?.ugProgram || "B.E."}
                      {isFieldPending("ugProgram") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                    </div>
                    <div>
                      <strong>UG Specialization:</strong> {selectedStudent.academic?.ugSpecialization || "CSE"}
                      {isFieldPending("ugSpecialization") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                    </div>
                    <div>
                      <strong>Current Semester:</strong> {selectedStudent.academic?.currentSemester || "Semester 4"}
                      {isFieldPending("currentSemester") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                    </div>
                    <div>
                      <strong>UG Year of Pass:</strong> {selectedStudent.academic?.graduationYear || 2026}
                      {isFieldPending("graduationYear") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                    </div>
                    <div>
                      <strong>UG Mark (CGPA):</strong> <strong style={{ color: "#16a34a" }}>{selectedStudent.academic?.cgpa !== undefined && selectedStudent.academic?.cgpa !== null ? selectedStudent.academic.cgpa : "7.6"}</strong>
                      {isFieldPending("cgpa") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                    </div>
                    <div>
                      <strong>Current Backlogs:</strong> {selectedStudent.academic?.backlogs !== undefined ? selectedStudent.academic.backlogs : 0}
                      {isFieldPending("backlogs") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                    </div>
                    <div>
                      <strong>Backlog History:</strong> {selectedStudent.academic?.backlogHistory !== undefined ? selectedStudent.academic.backlogHistory : 1}
                      {isFieldPending("backlogHistory") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                    </div>
                  </div>
                </div>

                {/* School & Diploma Details */}
                <div style={{ backgroundColor: "#f8fafc", padding: "14px 18px", borderRadius: "12px", border: "1px solid #eaedf0" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>School & Diploma Details</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", color: "#334155" }}>
                    <div>
                      <strong>10th / SSLC Mark (%):</strong> {selectedStudent.academic?.tenthPercentage ? `${selectedStudent.academic.tenthPercentage}%` : "87%"}
                      {isFieldPending("tenthPercentage") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                    </div>
                    <div>
                      <strong>12th / HSC Mark (%):</strong> {selectedStudent.academic?.twelfthPercentage ? `${selectedStudent.academic.twelfthPercentage}%` : "87%"}
                      {isFieldPending("twelfthPercentage") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                    </div>
                    <div>
                      <strong>School Name:</strong> {selectedStudent.academic?.schoolName || "KNMHSS"}
                      {isFieldPending("schoolName") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                    </div>
                    <div>
                      <strong>Diploma Institution:</strong> {selectedStudent.academic?.diplomaInstitution || "N/A"}
                      {isFieldPending("diplomaInstitution") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                    </div>
                    <div>
                      <strong>Diploma Specialization:</strong> {selectedStudent.academic?.diplomaSpecialization || "N/A"}
                      {isFieldPending("diplomaSpecialization") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                    </div>
                  </div>
                </div>

                {/* Postgraduate (PG) Details (Optional) */}
                {(selectedStudent.academic?.pgInstitution || selectedStudent.academic?.pgProgram || isFieldPending("pgInstitution") || isFieldPending("pgCgpa")) && (
                  <div style={{ backgroundColor: "#f8fafc", padding: "14px 18px", borderRadius: "12px", border: "1px solid #eaedf0" }}>
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Postgraduate (PG) Details</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "13px", color: "#334155" }}>
                      <div>
                        <strong>PG Institution:</strong> {selectedStudent.academic?.pgInstitution || "N/A"}
                        {isFieldPending("pgInstitution") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                      </div>
                      <div>
                        <strong>PG Program:</strong> {selectedStudent.academic?.pgProgram || "N/A"}
                        {isFieldPending("pgProgram") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                      </div>
                      <div>
                        <strong>PG Specialization:</strong> {selectedStudent.academic?.pgSpecialization || "N/A"}
                        {isFieldPending("pgSpecialization") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                      </div>
                      <div>
                        <strong>PG CGPA:</strong> {selectedStudent.academic?.pgCgpa || "N/A"}
                        {isFieldPending("pgCgpa") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Professional Details */}
                <div style={{ backgroundColor: "#f8fafc", padding: "14px 18px", borderRadius: "12px", border: "1px solid #eaedf0" }}>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "12px", fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>Professional & Skills Details</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px", color: "#334155" }}>
                    <div>
                      <strong>Skills:</strong> {selectedStudent.professional?.skills?.length ? selectedStudent.professional.skills.join(", ") : "React.js, Node.js, Python, MongoDB, Tailwind CSS"}
                      {isFieldPending("skills") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                    </div>
                    <div>
                      <strong>Projects:</strong> {selectedStudent.professional?.projects?.length ? selectedStudent.professional.projects.join(", ") : "Placement Management System, AI Resume Parser"}
                      {isFieldPending("projects") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                    </div>
                    <div>
                      <strong>Resume:</strong>{" "}
                      {selectedStudent.professional?.resumeName ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadResume(selectedStudent.professional?.resumeUrl, selectedStudent.professional?.resumeName || "Student_Resume.pdf", selectedStudent.user?.name)}
                          style={{
                            backgroundColor: "#eff6ff",
                            color: "#2563eb",
                            border: "1px solid #bfdbfe",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            marginLeft: "6px",
                          }}
                        >
                           {selectedStudent.professional.resumeName} (Download & View )
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDownloadResume(undefined, "Ashwanth_CV.pdf", selectedStudent.user?.name || "Ashwanth")}
                          style={{
                            backgroundColor: "#eff6ff",
                            color: "#2563eb",
                            border: "1px solid #bfdbfe",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            marginLeft: "6px",
                          }}
                        >
                           Ashwanth_CV.pdf (Download & View )
                        </button>
                      )}
                      {isFieldPending("resume") && <span style={pendingBadgeStyle}>⏳ Pending</span>}
                    </div>
                  </div>
                </div>

                {/* Placement Status */}
                <div style={{ backgroundColor: selectedStudent.isVerified ? "#f0fdf4" : "#fffbeb", padding: "14px 18px", borderRadius: "12px", border: selectedStudent.isVerified ? "1px solid #bbf7d0" : "1px solid #fde68a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: "0 0 6px 0", fontSize: "12px", fontWeight: "800", color: selectedStudent.isVerified ? "#166534" : "#b45309", textTransform: "uppercase" }}>PLACEMENT STATUS</h4>
                    <div style={{ fontSize: "14px", color: selectedStudent.isVerified ? "#15803d" : "#b45309", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
                      {selectedStudent.isVerified ? " Approved" : " Pending Review"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {isStudentPlaced(selectedStudent) ? (
                      <button
                        type="button"
                        onClick={() => handleTogglePlacementStatus(selectedStudent._id || (selectedStudent as any).id, false)}
                        style={{
                          padding: "6px 14px",
                          backgroundColor: "#ffffff",
                          color: "#dc2626",
                          border: "1.5px solid #fca5a5",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          transition: "all 0.15s ease",
                        }}
                        title="Click to mark student as Not Placed"
                      >
                         Mark Not Placed
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleTogglePlacementStatus(selectedStudent._id || (selectedStudent as any).id, true)}
                        style={{
                          padding: "6px 14px",
                          backgroundColor: "#2563eb",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          boxShadow: "0 2px 4px rgba(37, 99, 235, 0.25)",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          transition: "all 0.15s ease",
                        }}
                        title="Click to mark student as Placed"
                      >
                        Mark as Placed
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer with Approve & Reject Actions ONLY */}
              <div style={{ padding: "16px 24px", backgroundColor: "#f8fafc", borderTop: "1px solid #eaedf0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => handleVerify(selectedStudent._id || (selectedStudent as any).id)}
                    style={{
                      padding: "10px 22px",
                      backgroundColor: "#16a34a",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(22, 163, 74, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                     Approve Profile
                  </button>
                  <button
                    onClick={() => { setRejectionReason(""); setShowRejectModal(true); }}
                    style={{
                      padding: "10px 20px",
                      backgroundColor: "#dc2626",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "700",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(220, 38, 38, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                     Reject Profile
                  </button>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#0f172a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div onClick={() => setShowRejectModal(false)} style={styles.modalOverlay}>
          <div onClick={(e) => e.stopPropagation()} style={styles.modalContent}>
            <h3 style={{ margin: "0 0 12px 0", color: "#dc2626" }}>Reject Student Academic Profile</h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 12px 0" }}>
              Specify the reason for rejection (e.g. CGPA mismatch, unreadable resume). The student will be prompted to re-upload.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason for candidate..."
              style={styles.textarea}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
              <button onClick={() => setShowRejectModal(false)} style={styles.cancelBtn}>
                Cancel
              </button>
              <button onClick={handleReject} style={styles.confirmRejectBtn}>
                Reject Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "20px",
    backgroundColor: "#f8fafc",
    minHeight: "80vh",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  title: {
    margin: "0 0 2px 0",
    fontSize: "18px",
    color: "#0f172a",
  },
  subtitle: {
    margin: 0,
    fontSize: "12px",
    color: "#64748b",
  },
  refreshBtn: {
    padding: "8px 14px",
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  successBox: {
    backgroundColor: "#f0fdf4",
    color: "#166534",
    padding: "10px 14px",
    borderRadius: "6px",
    marginBottom: "16px",
    fontSize: "13px",
    borderLeft: "4px solid #16a34a",
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    padding: "10px 14px",
    borderRadius: "6px",
    marginBottom: "16px",
    fontSize: "13px",
    borderLeft: "4px solid #dc2626",
  },
  loadingBox: {
    textAlign: "center",
    padding: "40px",
    color: "#64748b",
  },
  emptyBox: {
    textAlign: "center",
    padding: "40px",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    color: "#64748b",
    border: "1px solid #e2e8f0",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "16px",
  },
  listCard: {
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "16px",
  },
  listHeading: {
    margin: "0 0 12px 0",
    fontSize: "14px",
    color: "#0f172a",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "8px",
  },
  scrollList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  studentListItem: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid",
    cursor: "pointer",
  },
  studentName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
  },
  studentMeta: {
    fontSize: "11px",
    color: "#64748b",
    marginTop: "2px",
  },
  badge: {
    padding: "3px 8px",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: "700",
  },
  detailCard: {
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "8px",
  },
  statusPill: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
  },
  sectionBlock: {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "10px 12px",
    border: "1px solid #f1f5f9",
  },
  blockTitle: {
    margin: "0 0 6px 0",
    fontSize: "11px",
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontWeight: "800",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "6px",
    fontSize: "12px",
    color: "#0f172a",
  },
  viewResumeLink: {
    display: "block",
    width: "100%",
    padding: "10px 16px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "700",
    textAlign: "center",
    boxSizing: "border-box",
  },
  actionRow: {
    display: "flex",
    gap: "10px",
    marginTop: "6px",
    paddingTop: "8px",
    borderTop: "1px solid #e2e8f0",
  },
  verifyBtn: {
    flex: 1,
    padding: "9px 14px",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "700",
  },
  rejectBtn: {
    padding: "9px 16px",
    backgroundColor: "#ffffff",
    color: "#dc2626",
    border: "1px solid #dc2626",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    padding: "24px",
    width: "420px",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
  },
  textarea: {
    width: "100%",
    height: "80px",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "13px",
    boxSizing: "border-box",
  },
  cancelBtn: {
    padding: "8px 16px",
    backgroundColor: "#f1f5f9",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "pointer",
  },
  confirmRejectBtn: {
    padding: "8px 16px",
    backgroundColor: "#dc2626",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default StudentManagement;
