import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";
import { Eye, Trash2, Plus, Check, X, Building2, MapPin, Calendar, Users, DollarSign, ArrowRight } from "lucide-react";

export const DriveManagement: React.FC = () => {
  const [drives, setDrives] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDrive, setSelectedDrive] = useState<any | null>(null);

  // Multi-step Wizard State
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [driveToDelete, setDriveToDelete] = useState<any | null>(null);

  // Centered Alert Modal State (replaces browser window.alert)
  const [popupAlert, setPopupAlert] = useState<{
    show: boolean;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
  }>({
    show: false,
    type: "info",
    title: "",
    message: ""
  });

  const showAlertModal = (
    title: string,
    message: string,
    type: "success" | "error" | "warning" | "info" = "info"
  ) => {
    setPopupAlert({
      show: true,
      type,
      title,
      message
    });
  };

  const handleDeleteDrive = async (targetDrive: any) => {
    if (!targetDrive) return;
    const driveId = targetDrive._id || targetDrive.id;
    const company = targetDrive.company || targetDrive.companyName || "Drive";

    // 1. Update React state immediately
    setDrives(prev => prev.filter(d => (d._id || d.id) !== driveId && d.id !== driveId));
    if (selectedDrive && (selectedDrive._id === driveId || selectedDrive.id === driveId)) {
      setSelectedDrive(null);
    }

    // 2. Remove from localStorage
    try {
      const saved = localStorage.getItem("cpms_drives");
      if (saved) {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) {
          const filtered = arr.filter((d: any) => (d._id || d.id) !== driveId && d.id !== driveId);
          localStorage.setItem("cpms_drives", JSON.stringify(filtered));
        }
      }
    } catch (e) {}

    // 3. Call backend API
    try {
      await fetch(`${API_BASE_URL}/api/company/drives/${driveId}`, { method: "DELETE" });
      await fetch(`${API_BASE_URL}/api/drives/${driveId}`, { method: "DELETE" });
    } catch (e) {}

    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("cpms_drives_updated"));
    showAlertModal("Drive Deleted", `Placement drive for "${company}" has been deleted successfully.`, "success");
  };

  const initialWizardForm = {
    company: "",
    role: "",
    logo: "",
    website: "",
    ctc: "",
    location: "",
    jobDescription: "",
    recruiterName: "",
    recruiterEmail: "",
    recruiterMobile: "",
    workMode: "On-site",
    department: "",
    eligibleBranches: "",
    batch: "2026",
    gradYear: "2026",
    minTenth: "60",
    minTwelfth: "60",
    minCgpa: "6.0",
    maxBacklogs: "0",
    deadline: "",
    openings: "5",
    rounds: [
      { roundNumber: 1, roundName: "Online Aptitude & Coding Assessment", mode: "Online", date: "", time: "10:00 AM", venue: "College Lab / Online Portal", description: "Logical reasoning, DSA and coding" }
    ]
  };

  const [wizardForm, setWizardForm] = useState<any>(initialWizardForm);

  // Validate Mandatory Fields per Step
  const validateWizardStep = (step: number): boolean => {
    if (step === 1) {
      if (!wizardForm.company || !wizardForm.company.trim()) {
        showAlertModal("Mandatory Field Missing", "Please enter the Company Name.", "warning");
        return false;
      }
      if (!wizardForm.role || !wizardForm.role.trim()) {
        showAlertModal("Mandatory Field Missing", "Please enter the Job Role / Title.", "warning");
        return false;
      }
      if (!wizardForm.ctc || !wizardForm.ctc.trim()) {
        showAlertModal("Mandatory Field Missing", "Please enter the Package / CTC (LPA).", "warning");
        return false;
      }
      if (!wizardForm.location || !wizardForm.location.trim()) {
        showAlertModal("Mandatory Field Missing", "Please enter the Job Location.", "warning");
        return false;
      }
      if (!wizardForm.jobDescription || !wizardForm.jobDescription.trim()) {
        showAlertModal("Mandatory Field Missing", "Please enter a Job Description.", "warning");
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!wizardForm.recruiterName || !wizardForm.recruiterName.trim()) {
        showAlertModal("Mandatory Field Missing", "Please enter the Recruiter Contact Name.", "warning");
        return false;
      }
      if (!wizardForm.recruiterEmail || !wizardForm.recruiterEmail.trim()) {
        showAlertModal("Mandatory Field Missing", "Please enter the Recruiter Official Email.", "warning");
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(wizardForm.recruiterEmail.trim())) {
        showAlertModal("Invalid Email", "Please enter a valid Recruiter Official Email address (e.g. hr@company.com).", "warning");
        return false;
      }
      if (!wizardForm.recruiterMobile || !wizardForm.recruiterMobile.trim()) {
        showAlertModal("Mandatory Field Missing", "Please enter the Recruiter Mobile / Phone Number.", "warning");
        return false;
      }
      if (!wizardForm.workMode || !wizardForm.workMode.trim()) {
        showAlertModal("Mandatory Field Missing", "Please select the Work Mode.", "warning");
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (!wizardForm.rounds || wizardForm.rounds.length === 0) {
        showAlertModal("Mandatory Step Incomplete", "Please configure at least one Selection Round.", "warning");
        return false;
      }
      for (let i = 0; i < wizardForm.rounds.length; i++) {
        const r = wizardForm.rounds[i];
        if (!r.roundName || !r.roundName.trim()) {
          showAlertModal("Mandatory Field Missing", `Please enter the Round Title for Round ${i + 1}.`, "warning");
          return false;
        }
        if (!r.date || !r.date.trim()) {
          showAlertModal("Mandatory Field Missing", `Please select the Scheduled Date for Round ${i + 1} (${r.roundName}).`, "warning");
          return false;
        }
      }
      return true;
    }

    if (step === 4) {
      const deptVal = wizardForm.department || wizardForm.eligibleBranches;
      const batchVal = wizardForm.batch || wizardForm.gradYear;

      if (!deptVal || !String(deptVal).trim()) {
        showAlertModal("Mandatory Field Missing", "Please specify Eligible Department(s) / Branches.", "warning");
        return false;
      }
      if (!batchVal || !String(batchVal).trim()) {
        showAlertModal("Mandatory Field Missing", "Please specify Eligible Batch (Graduation / Pass-out Year).", "warning");
        return false;
      }
      if (wizardForm.minCgpa === "" || isNaN(Number(wizardForm.minCgpa)) || Number(wizardForm.minCgpa) < 0 || Number(wizardForm.minCgpa) > 10) {
        showAlertModal("Invalid / Missing CGPA", "Please specify a valid Minimum CGPA Cutoff between 0.0 and 10.0.", "warning");
        return false;
      }
      if (wizardForm.minTenth === "" || isNaN(Number(wizardForm.minTenth)) || Number(wizardForm.minTenth) < 0 || Number(wizardForm.minTenth) > 100) {
        showAlertModal("Invalid / Missing 10th Cutoff", "Please specify a valid Minimum 10th Standard Cutoff % (0 to 100).", "warning");
        return false;
      }
      if (wizardForm.minTwelfth === "" || isNaN(Number(wizardForm.minTwelfth)) || Number(wizardForm.minTwelfth) < 0 || Number(wizardForm.minTwelfth) > 100) {
        showAlertModal("Invalid / Missing 12th Cutoff", "Please specify a valid Minimum 12th / Diploma Cutoff % (0 to 100).", "warning");
        return false;
      }
      if (wizardForm.maxBacklogs === "" || isNaN(Number(wizardForm.maxBacklogs)) || Number(wizardForm.maxBacklogs) < 0) {
        showAlertModal("Invalid / Missing Backlogs", "Please specify Maximum Active Backlogs Allowed (0 or higher).", "warning");
        return false;
      }
      if (!wizardForm.deadline || !wizardForm.deadline.trim()) {
        showAlertModal("Mandatory Field Missing", "Please select the Application Registration Deadline Date.", "warning");
        return false;
      }
      if (wizardForm.openings === "" || isNaN(Number(wizardForm.openings)) || Number(wizardForm.openings) < 1) {
        showAlertModal("Invalid / Missing Openings", "Please specify the Estimated Openings count (minimum 1).", "warning");
        return false;
      }
      return true;
    }

    return true;
  };

  const handleAddRound = () => {
    setWizardForm((prev: any) => ({
      ...prev,
      rounds: [
        ...(prev.rounds || []),
        {
          roundNumber: ((prev.rounds || []).length) + 1,
          roundName: "",
          mode: "Online",
          date: "",
          time: "",
          venue: "",
          description: ""
        }
      ]
    }));
  };

  const handleUpdateRound = (index: number, field: string, value: any) => {
    setWizardForm((prev: any) => {
      const updated = [...(prev.rounds || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, rounds: updated };
    });
  };

  const handleRemoveRound = (index: number) => {
    setWizardForm((prev: any) => {
      const filtered = (prev.rounds || []).filter((_: any, i: number) => i !== index);
      const renumbered = filtered.map((r: any, idx: number) => ({ ...r, roundNumber: idx + 1 }));
      return { ...prev, rounds: renumbered };
    });
  };

  // Fetch Applications to calculate live Opt-In counts
  const fetchApplications = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/applications`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setApplications(data);
        }
      }
    } catch (e) {}
  };

  // Fetch Drives from MongoDB API
  const fetchDrives = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/company/drives`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const sorted = [...data].sort((a: any, b: any) => {
            const timeA = new Date(a.createdAt || a.publishDate || a.updatedAt || 0).getTime();
            const timeB = new Date(b.createdAt || b.publishDate || b.updatedAt || 0).getTime();
            return timeB - timeA;
          });
          setDrives(sorted);
        }
      }
    } catch (e) {
      console.error("Error fetching drives:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
    fetchApplications();
    const interval = setInterval(() => {
      fetchDrives();
      fetchApplications();
    }, 2000);

    const handleSync = () => {
      fetchDrives();
      fetchApplications();
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("cpms_applications_updated", handleSync);
    window.addEventListener("cpms_drives_updated", handleSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("cpms_applications_updated", handleSync);
      window.removeEventListener("cpms_drives_updated", handleSync);
    };
  }, []);

  // Compute live Opted-in Candidates list for a specific drive
  const getDriveOptedInCandidates = (d: any) => {
    if (!d) return [];
    const dId = String(d._id || d.id || "").toLowerCase().trim();
    const comp = String(d.company || d.companyName || "").toLowerCase().trim();
    const role = String(d.role || d.jobRole || d.jobTitle || "").toLowerCase().trim();

    const resultList: any[] = [];
    const seenEmails = new Set<string>();

    // 1. Check MongoDB applications
    applications.forEach(a => {
      if (a.status === "Withdrawn" || a.status === "Opted-Out") return;

      const aId = String(a.driveId || "").toLowerCase().trim();
      const aComp = String(a.companyName || a.company || "").toLowerCase().trim();
      const aRole = String(a.jobRole || a.role || a.jobTitle || "").toLowerCase().trim();
      const aEmail = String(a.email || a.studentEmail || "").toLowerCase().trim();

      // Strict matching:
      // If the application specifies a driveId, it MUST equal this drive's ID.
      // If no driveId is stored, it must match BOTH exact company name AND role.
      let isMatch = false;
      if (dId && aId) {
        isMatch = (dId === aId);
      } else if (comp && aComp) {
        if (role && aRole) {
          isMatch = (comp === aComp && role === aRole);
        } else {
          isMatch = (comp === aComp);
        }
      }

      if (isMatch && aEmail && !seenEmails.has(aEmail)) {
        seenEmails.add(aEmail);
        resultList.push(a);
      }
    });

    // 2. Check LocalStorage global applications
    try {
      const globalStr = localStorage.getItem("cpms_applied_drives_global");
      if (globalStr) {
        const globalArr = JSON.parse(globalStr);
        if (Array.isArray(globalArr)) {
          globalArr.forEach((g: any) => {
            const gId = String(g.driveId || "").toLowerCase().trim();
            const gComp = String(g.companyName || g.company || "").toLowerCase().trim();
            const gRole = String(g.role || g.jobRole || g.jobTitle || "").toLowerCase().trim();
            const gEmail = String(g.email || g.studentEmail || g.userKey || "").toLowerCase().trim();

            let isMatch = false;
            if (dId && gId) {
              isMatch = (dId === gId);
            } else if (comp && gComp) {
              if (role && gRole) {
                isMatch = (comp === gComp && role === gRole);
              } else {
                isMatch = (comp === gComp);
              }
            }

            if (isMatch && gEmail && !seenEmails.has(gEmail)) {
              seenEmails.add(gEmail);
              resultList.push({
                studentName: g.name || "Student Candidate",
                email: g.email || g.userKey,
                regNo: g.regNo || "Verified Student",
                department: g.department || "Engineering",
                status: "Opted-In"
              });
            }
          });
        }
      }
    } catch (e) {}

    return resultList;
  };

  // Publish New Drive (Step 4 Submit)
  const handlePublishDrive = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce all step validations
    if (!validateWizardStep(1)) {
      setCurrentStep(1);
      return;
    }
    if (!validateWizardStep(2)) {
      setCurrentStep(2);
      return;
    }
    if (!validateWizardStep(3)) {
      setCurrentStep(3);
      return;
    }
    if (!validateWizardStep(4)) {
      setCurrentStep(4);
      return;
    }

    const deptVal = wizardForm.department || wizardForm.eligibleBranches;
    const batchVal = wizardForm.batch || wizardForm.gradYear;

    try {
      const formattedRounds = (wizardForm.rounds || [])
        .filter((r: any) => r.roundName && r.roundName.trim().length > 0)
        .map((r: any, idx: number) => ({
          roundNumber: r.roundNumber || idx + 1,
          roundName: r.roundName.trim(),
          mode: r.mode || "Online",
          date: r.date || "",
          time: r.time || "",
          venue: r.venue || "",
          description: r.description || ""
        }));

      const driveId = "drive_" + Date.now();
      const parsedGradYear = Number(batchVal) || 2026;
      const parsedBranches = Array.isArray(deptVal)
        ? deptVal
        : String(deptVal).split(",").map((b: string) => b.trim()).filter(Boolean);

      const payload: any = {
        _id: driveId,
        id: driveId,
        company: (wizardForm.company || "Partner Company").trim(),
        companyName: (wizardForm.company || "Partner Company").trim(),
        jobTitle: (wizardForm.role || "Software Engineer").trim(),
        role: (wizardForm.role || "Software Engineer").trim(),
        jobRole: (wizardForm.role || "Software Engineer").trim(),
        packageCtc: (wizardForm.ctc || "6 LPA").trim(),
        ctc: (wizardForm.ctc || "6 LPA").trim(),
        salaryPackage: (wizardForm.ctc || "6 LPA").trim(),
        location: (wizardForm.location || "Pan-India / Flexible").trim(),
        logo: wizardForm.logo || "",
        logoUrl: wizardForm.logo || "",
        website: wizardForm.website || "",
        jobDescription: wizardForm.jobDescription || "",
        description: wizardForm.jobDescription || "",
        recruiterName: wizardForm.recruiterName || "",
        recruiterEmail: wizardForm.recruiterEmail || "",
        recruiterMobile: wizardForm.recruiterMobile || "",
        workMode: wizardForm.workMode || "On-site",
        department: parsedBranches.join(", "),
        departments: parsedBranches,
        eligibleBranches: parsedBranches,
        batch: String(batchVal).trim(),
        gradYear: parsedGradYear,
        minTenth: wizardForm.minTenth !== "" && !isNaN(Number(wizardForm.minTenth)) ? Number(wizardForm.minTenth) : 0,
        minTwelfth: wizardForm.minTwelfth !== "" && !isNaN(Number(wizardForm.minTwelfth)) ? Number(wizardForm.minTwelfth) : 0,
        minCgpa: wizardForm.minCgpa !== "" && !isNaN(Number(wizardForm.minCgpa)) ? Number(wizardForm.minCgpa) : 0,
        maxBacklogs: wizardForm.maxBacklogs !== "" && !isNaN(Number(wizardForm.maxBacklogs)) ? Number(wizardForm.maxBacklogs) : 0,
        deadline: wizardForm.deadline || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        driveDate: wizardForm.deadline || new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        openings: wizardForm.openings !== "" && !isNaN(Number(wizardForm.openings)) ? Number(wizardForm.openings) : 1,
        rounds: formattedRounds.length > 0 ? formattedRounds : [
          { roundNumber: 1, roundName: "Assessment / Interview", mode: "Online", date: wizardForm.deadline || "", time: "", venue: "", description: "" }
        ],
        status: "Active",
        isOfficerPublished: true,
        isCreatedByOfficer: true,
        createdBy: "Placement Officer",
        approvedBy: "Placement Officer",
        createdAt: new Date().toISOString()
      };

      // 1. Immediately persist to localStorage cpms_drives
      try {
        const saved = localStorage.getItem("cpms_drives");
        let arr = saved ? JSON.parse(saved) : [];
        if (!Array.isArray(arr)) arr = [];
        arr = arr.filter((d: any) => (d.id || d._id) !== driveId);
        arr.unshift(payload);
        localStorage.setItem("cpms_drives", JSON.stringify(arr));
      } catch (e) {}

      // 2. Update local state
      setDrives(prev => [payload, ...prev.filter(d => (d._id || d.id) !== driveId)]);

      // 3. Post to backend
      try {
        await fetch(`${API_BASE_URL}/api/company/drives`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        await fetch(`${API_BASE_URL}/api/drives`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (e) {}

      // 4. Dispatch sync events for all open tabs & dashboards
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("cpms_drives_updated", { detail: payload }));

      // 5. Close wizard & show alert
      setShowCreateWizard(false);
      setCurrentStep(1);
      setWizardForm(initialWizardForm);
      showAlertModal(
        "Drive Published Successfully",
        `Drive for "${payload.company}" (${payload.role}) is now LIVE. Eligible students (${payload.department}, Batch ${payload.batch}) can immediately apply from their portal!`,
        "success"
      );

      // Auto-revalidate
      fetchDrives();
    } catch (err: any) {
      showAlertModal("Error", "Failed to create drive. Please verify all details and try again.", "error");
    }
  };

  // Compute dynamic Drive Status based on Drive Date & Officer settings
  const getDriveStatus = (d: any): "Active" | "In Progress" | "Completed" | "Pending Approval" | "Closed" => {
    if (!d) return "Active";
    const explicitStatus = String(d.status || "").trim();

    // 1. If Officer explicitly completed or closed it
    if (explicitStatus.toLowerCase() === "completed" || explicitStatus.toLowerCase() === "closed") {
      return "Completed";
    }
    if (explicitStatus.toLowerCase() === "pending approval") {
      return "Pending Approval";
    }
    if (explicitStatus.toLowerCase() === "in progress" || explicitStatus.toLowerCase() === "ongoing") {
      return "In Progress";
    }

    // 2. Check Drive Date / Deadline to determine if Active or In Progress
    const driveDateStr = (d.rounds && d.rounds.length > 0 && d.rounds[0]?.date) || d.deadline || d.date || "";
    if (!driveDateStr) {
      return (explicitStatus as any) || "Active";
    }

    try {
      let targetDate: Date | null = null;
      if (driveDateStr.includes("-")) {
        const parts = driveDateStr.split("-");
        if (parts.length === 3) {
          targetDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        }
      } else if (driveDateStr.includes("/")) {
        const parts = driveDateStr.split("/");
        if (parts.length === 3) {
          const p1 = Number(parts[0]);
          const p2 = Number(parts[1]);
          const p3 = Number(parts[2]);
          if (p3 > 1000) {
            targetDate = new Date(p3, p2 - 1, p1);
          } else {
            targetDate = new Date(p1, p2 - 1, p3);
          }
        }
      } else {
        targetDate = new Date(driveDateStr);
      }

      if (targetDate && !isNaN(targetDate.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        targetDate.setHours(0, 0, 0, 0);

        // If today is on or after the drive date -> In Progress
        if (today.getTime() >= targetDate.getTime()) {
          return "In Progress";
        }
        // Before drive date -> Active
        return "Active";
      }
    } catch (e) {}

    return (explicitStatus as any) || "Active";
  };

  // Officer updates Drive Status (Active -> In Progress -> Completed)
  const handleUpdateDriveStatus = async (driveId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/company/drives/${driveId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setDrives(prev => prev.map(d => (d._id === driveId || d.id === driveId) ? { ...d, status: newStatus } : d));
        if (selectedDrive && (selectedDrive._id === driveId || selectedDrive.id === driveId)) {
          setSelectedDrive((prev: any) => ({ ...prev, status: newStatus }));
        }

        // Sync cpms_drives in localStorage
        try {
          const savedDrivesStr = localStorage.getItem("cpms_drives");
          if (savedDrivesStr) {
            const parsed = JSON.parse(savedDrivesStr);
            if (Array.isArray(parsed)) {
              const updated = parsed.map((d: any) => {
                if (d._id === driveId || d.id === driveId || (selectedDrive && ((d.company || d.companyName || "").toLowerCase() === (selectedDrive.company || "").toLowerCase()))) {
                  return { ...d, status: newStatus, driveStatus: newStatus };
                }
                return d;
              });
              localStorage.setItem("cpms_drives", JSON.stringify(updated));
            }
          }
        } catch (e) { }

        // If marked Completed, sync cpms_applications in localStorage too
        if (newStatus === "Completed" || newStatus === "Closed") {
          try {
            const savedAppsStr = localStorage.getItem("cpms_applications");
            if (savedAppsStr) {
              const parsedApps = JSON.parse(savedAppsStr);
              if (Array.isArray(parsedApps)) {
                const updatedApps = parsedApps.map((a: any) => {
                  const compMatch = selectedDrive && (
                    (a.company || a.companyName || "").toLowerCase().includes((selectedDrive.company || "").toLowerCase()) ||
                    (selectedDrive.company || "").toLowerCase().includes((a.company || a.companyName || "").toLowerCase())
                  );
                  if (a.driveId === driveId || compMatch) {
                    return {
                      ...a,
                      status: "Completed",
                      driveStatus: "Completed",
                      currentWorkflowStage: "Completed",
                      subMessage: "Placement recruitment drive has been marked as Completed by the Placement Cell."
                    };
                  }
                  return a;
                });
                localStorage.setItem("cpms_applications", JSON.stringify(updatedApps));
              }
            }
          } catch (e) { }
        }

        // Broadcast storage and custom events so student dashboard updates instantly
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("cpms_drives_updated", { detail: { id: driveId, status: newStatus } }));
        window.dispatchEvent(new CustomEvent("cpms_applications_updated"));

        showAlertModal(
          "Drive Status Updated!",
          `Placement Drive status has been updated to "${newStatus}".`,
          "success"
        );
        fetchDrives();
      } else {
        const errData = await res.json().catch(() => ({}));
        showAlertModal("Update Failed", errData.message || "Failed to update drive status.", "error");
      }
    } catch (err: any) {
      showAlertModal("Error", "Failed to update drive status: " + err.message, "error");
    }
  };

  // ⌨️ ESC key handler to close all popups/modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.code === "Escape" || e.keyCode === 27) {
        if (popupAlert.show) {
          setPopupAlert(prev => ({ ...prev, show: false }));
          return;
        }
        setShowCreateWizard(false);
        setSelectedDrive(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [popupAlert.show]);

  const filteredDrives = drives.filter(d => {
    const st = getDriveStatus(d);
    const matchesStatus = statusFilter === "All" || st.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch = !searchQuery ||
      (d.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.role || d.jobTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.location || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Top Action Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", fontWeight: 800, color: "#0F172A" }}>
            Campus Placement Drives Management
          </h2>
          <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B" }}>
            Add corporate partners, view automated live drive statuses (Active → In Progress → Completed), and manage student registrations.
          </p>
        </div>
        <button
          onClick={() => { setShowCreateWizard(true); setCurrentStep(1); }}
          style={{
            padding: "10px 18px",
            backgroundColor: "#0B3D91",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(11,61,145,0.2)"
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Create & Publish Drive</span>
        </button>
      </div>

      {/* Top 4 KPI Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
        {[
          { label: "Total Drives", value: drives.length, sub: "All hiring drives", color: "#1E5FCC", bg: "#EFF6FF" },
          { label: "Active (Upcoming)", value: drives.filter(d => getDriveStatus(d) === "Active").length, sub: "Open for candidate opt-in", color: "#059669", bg: "#DCFCE7" },
          { label: "In Progress (Live Today)", value: drives.filter(d => getDriveStatus(d) === "In Progress").length, sub: "Drive ongoing / today", color: "#2563EB", bg: "#DBEAFE" },
          { label: "Completed Drives", value: drives.filter(d => getDriveStatus(d) === "Completed").length, sub: "Recruitment concluded", color: "#64748B", bg: "#F1F5F9" }
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
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>{kpi.label}</div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: kpi.color, marginTop: "4px" }}>{kpi.value}</div>
            <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "2px" }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div style={{ backgroundColor: "#FFFFFF", padding: "14px 18px", borderRadius: "12px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "260px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search drive by company name, job role, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", outline: "none" }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {["All", "Active", "In Progress", "Completed", "Pending Approval"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "1px solid",
                borderColor: statusFilter === st ? "#0B3D91" : "#CBD5E1",
                backgroundColor: statusFilter === st ? "#EFF6FF" : "#FFFFFF",
                color: statusFilter === st ? "#0B3D91" : "#64748B",
                fontWeight: statusFilter === st ? 700 : 500,
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Placement Drives Data Table Container */}
      <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: "15px", color: "#0F172A" }}>
            Published Placement Drives ({filteredDrives.length})
          </div>
          <span style={{ fontSize: "12px", color: "#64748B" }}>
            Live MongoDB drives • Auto-Lifecycle: Active → In Progress → Completed
          </span>
        </div>

        <div className="responsive-table-wrapper" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: "760px", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569", fontSize: "11.5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Company & Job Role</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Package (CTC)</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Location</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Drive Date / Deadline</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Opted-In Students</th>
                <th style={{ padding: "14px 18px", fontWeight: 700 }}>Drive Status</th>
                <th style={{ padding: "14px 18px", fontWeight: 700, textAlign: "right" }}>Officer Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrives.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "36px", textAlign: "center", color: "#64748B" }}>
                    <div style={{ fontWeight: 700, color: "#0F172A", marginBottom: "4px" }}>No placement drives found matching criteria</div>
                    <div style={{ fontSize: "12px" }}>Click "+ Create & Publish Drive" button above to onboard a new recruitment drive.</div>
                  </td>
                </tr>
              ) : (
                filteredDrives.map((d) => {
                  const currentStatus = getDriveStatus(d);
                  const optedCandidates = getDriveOptedInCandidates(d);
                  const count = optedCandidates.length;

                  return (
                    <tr key={d._id || d.id} style={{ borderBottom: "1px solid #F1F5F9", transition: "background-color 0.15s ease" }}>
                      
                      {/* Company & Role */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "3px", flexShrink: 0 }}>
                            {d.logo ? (
                              <img src={d.logo} alt={d.company} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} onError={(e: any) => { e.target.style.display = "none"; }} />
                            ) : (
                              <span style={{ fontWeight: 800, color: "#0B3D91", fontSize: "14px" }}>{(d.company || "C").charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: "#0F172A", fontSize: "13.5px" }}>{d.company}</div>
                            <div style={{ fontSize: "12px", color: "#0B3D91", fontWeight: 600 }}>{d.role || d.jobTitle || "—"}</div>
                          </div>
                        </div>
                      </td>

                      {/* Package CTC */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                        <strong style={{ color: "#0B3D91", fontSize: "13.5px" }}>{d.ctc || d.packageCtc || "—"}</strong>
                      </td>

                      {/* Location */}
                      <td style={{ padding: "14px 18px", color: "#334155", whiteSpace: "nowrap", fontSize: "12.5px" }}>
                        {d.location || "—"}
                      </td>

                      {/* Deadline / Drive Date */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap", fontSize: "12px", color: currentStatus === "In Progress" ? "#2563EB" : currentStatus === "Completed" ? "#64748B" : "#DC2626", fontWeight: 700 }}>
                        {d.rounds && d.rounds[0]?.date ? d.rounds[0].date : d.deadline || "—"}
                      </td>

                      {/* Opted-In Students */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                        <span
                          onClick={() => setSelectedDrive(d)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            backgroundColor: count > 0 ? "#EEF2FF" : "#F8FAFC",
                            color: count > 0 ? "#4338CA" : "#64748B",
                            border: `1px solid ${count > 0 ? "#C7D2FE" : "#E2E8F0"}`,
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                          title="Click to view candidate list"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                          <span>{count} {count === 1 ? "Student" : "Students"} Applied</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                        {currentStatus === "Active" && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", backgroundColor: "#DCFCE7", color: "#059669", border: "1px solid #86EFAC", padding: "3px 9px", borderRadius: "14px", fontSize: "11px", fontWeight: 700 }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10B981" }}></span>
                            <span>Active (Open)</span>
                          </span>
                        )}
                        {currentStatus === "In Progress" && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", backgroundColor: "#DBEAFE", color: "#1D4ED8", border: "1px solid #93C5FD", padding: "3px 9px", borderRadius: "14px", fontSize: "11px", fontWeight: 700 }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#2563EB" }}></span>
                            <span>In Progress (Live)</span>
                          </span>
                        )}
                        {currentStatus === "Completed" && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", backgroundColor: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1", padding: "3px 9px", borderRadius: "14px", fontSize: "11px", fontWeight: 700 }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#64748B" }}></span>
                            <span>Completed</span>
                          </span>
                        )}
                        {currentStatus === "Pending Approval" && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", backgroundColor: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A", padding: "3px 9px", borderRadius: "14px", fontSize: "11px", fontWeight: 700 }}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#F59E0B" }}></span>
                            <span>Pending Approval</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <div style={{ display: "inline-flex", gap: "6px", justifyContent: "flex-end", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedDrive(d)}
                            className="btn-action-view"
                            title="View Details"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDriveToDelete(d);
                            }}
                            className="btn-action-delete"
                            title="Delete Placement Drive"
                          >
                            <Trash2 size={15} />
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
      </div>

      {/* ========================================================================= */}
      {/* MULTI-STEP DRIVE CREATION WIZARD MODAL (Step 1 -> Step 2 -> Step 3) */}
      {/* ========================================================================= */}
      {showCreateWizard && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", maxWidth: "680px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            
            {/* Modal Header & Close Button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "16px", marginBottom: "20px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 800, color: "#0F172A" }}>
                  Create & Publish Placement Drive
                </h3>
                <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                  Step {currentStep} of 4 • {
                    currentStep === 1 ? "Company & Role" :
                    currentStep === 2 ? "Recruiter POC Details" :
                    currentStep === 3 ? "Selection Rounds Setup" :
                    "Academic Eligibility & Publish"
                  }
                </div>
              </div>
              <button
                onClick={() => setShowCreateWizard(false)}
                style={{ background: "none", border: "none", fontSize: "20px", color: "#64748B", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Step Progress Pills Bar */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
              {[
                { step: 1, label: "1. Company & Role" },
                { step: 2, label: "2. Recruiter Contact" },
                { step: 3, label: "3. Selection Rounds" },
                { step: 4, label: "4. Criteria & Publish" }
              ].map((s) => (
                <div
                  key={s.step}
                  style={{
                    flex: 1,
                    padding: "8px 6px",
                    borderRadius: "8px",
                    textAlign: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    backgroundColor: currentStep === s.step ? "#EEF2FF" : (currentStep > s.step ? "#DCFCE7" : "#F8FAFC"),
                    color: currentStep === s.step ? "#4338CA" : (currentStep > s.step ? "#15803D" : "#94A3B8"),
                    border: `1px solid ${currentStep === s.step ? "#C7D2FE" : (currentStep > s.step ? "#86EFAC" : "#E2E8F0")}`
                  }}
                >
                  {s.label}
                </div>
              ))}
            </div>

            {/* STEP 1: COMPANY & JOB PROFILE */}
            {currentStep === 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Company Name <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amazon, Google, Zoho, TCS"
                    value={wizardForm.company}
                    onChange={(e) => setWizardForm({ ...wizardForm, company: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Job Role / Title <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Development Engineer"
                    value={wizardForm.role}
                    onChange={(e) => setWizardForm({ ...wizardForm, role: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Package / CTC (LPA) <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₹18.0 LPA"
                    value={wizardForm.ctc}
                    onChange={(e) => setWizardForm({ ...wizardForm, ctc: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Company Logo URL <span style={{ color: "#94A3B8", fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://.../logo.png"
                    value={wizardForm.logo}
                    onChange={(e) => setWizardForm({ ...wizardForm, logo: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Official Website URL <span style={{ color: "#94A3B8", fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://company.com"
                    value={wizardForm.website}
                    onChange={(e) => setWizardForm({ ...wizardForm, website: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Job Location <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bangalore, Hyderabad, Chennai"
                    value={wizardForm.location}
                    onChange={(e) => setWizardForm({ ...wizardForm, location: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Job Description <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Brief job overview, responsibilities and key requirements..."
                    value={wizardForm.jobDescription}
                    onChange={(e) => setWizardForm({ ...wizardForm, jobDescription: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>
            )}

            {/* STEP 2: RECRUITER CONTACT DETAILS */}
            {currentStep === 2 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Recruiter Name <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={wizardForm.recruiterName}
                    onChange={(e) => setWizardForm({ ...wizardForm, recruiterName: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Recruiter Official Email <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. campus@company.com"
                    value={wizardForm.recruiterEmail}
                    onChange={(e) => setWizardForm({ ...wizardForm, recruiterEmail: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Recruiter Mobile / Phone <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={wizardForm.recruiterMobile}
                    onChange={(e) => setWizardForm({ ...wizardForm, recruiterMobile: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Work Mode <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <select
                    value={wizardForm.workMode}
                    onChange={(e) => setWizardForm({ ...wizardForm, workMode: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  >
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
              </div>
            )}

            {/* STEP 3: SELECTION ROUNDS SETUP */}
            {currentStep === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#0F172A" }}>
                      Recruitment Selection Rounds <span style={{ color: "#DC2626" }}>*</span>
                    </h4>
                    <span style={{ fontSize: "12px", color: "#64748B" }}>
                      Configure selection rounds for this drive. Each round must have a title and scheduled date.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRound}
                    style={{
                      padding: "6px 14px",
                      backgroundColor: "#0B3D91",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    + Add Round
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "380px", overflowY: "auto", paddingRight: "4px" }}>
                  {(wizardForm.rounds || []).map((round: any, rIdx: number) => (
                    <div key={rIdx} style={{ backgroundColor: "#F8FAFC", padding: "14px", borderRadius: "10px", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "#0B3D91", backgroundColor: "#EFF6FF", padding: "3px 10px", borderRadius: "12px" }}>
                          Round {round.roundNumber || rIdx + 1}
                        </span>
                        {(wizardForm.rounds || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRound(rIdx)}
                            style={{ background: "none", border: "none", color: "#DC2626", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                          >
                            Remove Round
                          </button>
                        )}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                            Round Title <span style={{ color: "#DC2626" }}>*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Online Assessment, Technical Interview, HR Round"
                            value={round.roundName}
                            onChange={(e) => handleUpdateRound(rIdx, "roundName", e.target.value)}
                            style={{ width: "100%", padding: "7px 10px", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "12px", boxSizing: "border-box" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                            Mode <span style={{ color: "#DC2626" }}>*</span>
                          </label>
                          <select
                            value={round.mode}
                            onChange={(e) => handleUpdateRound(rIdx, "mode", e.target.value)}
                            style={{ width: "100%", padding: "7px 10px", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "12px", boxSizing: "border-box" }}
                          >
                            <option value="Online">Online</option>
                            <option value="In-Person Campus">In-Person Campus</option>
                            <option value="Hybrid">Hybrid</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                            Scheduled Date <span style={{ color: "#DC2626" }}>*</span>
                          </label>
                          <input
                            type="date"
                            required
                            value={round.date}
                            onChange={(e) => handleUpdateRound(rIdx, "date", e.target.value)}
                            style={{ width: "100%", padding: "7px 10px", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "12px", boxSizing: "border-box" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                            Scheduled Time <span style={{ color: "#94A3B8", fontWeight: 400 }}>(Optional)</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 10:00 AM"
                            value={round.time}
                            onChange={(e) => handleUpdateRound(rIdx, "time", e.target.value)}
                            style={{ width: "100%", padding: "7px 10px", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "12px", boxSizing: "border-box" }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                            Venue / Platform <span style={{ color: "#94A3B8", fontWeight: 400 }}>(Optional)</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Lab 2 / HackerRank / Teams"
                            value={round.venue}
                            onChange={(e) => handleUpdateRound(rIdx, "venue", e.target.value)}
                            style={{ width: "100%", padding: "7px 10px", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "12px", boxSizing: "border-box" }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#475569", marginBottom: "3px" }}>
                          Round Description / Syllabus <span style={{ color: "#94A3B8", fontWeight: 400 }}>(Optional)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. DSA, coding challenges, core computer science concepts"
                          value={round.description}
                          onChange={(e) => handleUpdateRound(rIdx, "description", e.target.value)}
                          style={{ width: "100%", padding: "7px 10px", border: "1px solid #CBD5E1", borderRadius: "6px", fontSize: "12px", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: ACADEMIC ELIGIBILITY & REGISTRATION DEADLINE */}
            {currentStep === 4 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Eligible Department(s) / Branches <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE, IT, ECE, AIDS, MECH"
                    value={wizardForm.department || wizardForm.eligibleBranches || ""}
                    onChange={(e) => setWizardForm({ ...wizardForm, department: e.target.value, eligibleBranches: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>Quick add:</span>
                    {["CSE", "IT", "ECE", "EEE", "AIDS", "MECH", "CIVIL", "All Departments"].map((dept) => (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => {
                          const current = (wizardForm.department || wizardForm.eligibleBranches || "").trim();
                          if (dept === "All Departments") {
                            setWizardForm({ ...wizardForm, department: "All Departments", eligibleBranches: "All Departments" });
                            return;
                          }
                          const parts = current.split(",").map((s: string) => s.trim()).filter(Boolean);
                          if (!parts.includes(dept)) {
                            const updated = parts.length > 0 ? `${current}, ${dept}` : dept;
                            setWizardForm({ ...wizardForm, department: updated, eligibleBranches: updated });
                          }
                        }}
                        style={{
                          fontSize: "11px",
                          padding: "2px 8px",
                          backgroundColor: "#F1F5F9",
                          border: "1px solid #CBD5E1",
                          borderRadius: "6px",
                          cursor: "pointer",
                          color: "#334155"
                        }}
                      >
                        + {dept}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Eligible Batch (Graduation / Pass-out Year) <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="2020"
                    max="2035"
                    placeholder="e.g. 2026"
                    value={wizardForm.batch || wizardForm.gradYear || ""}
                    onChange={(e) => setWizardForm({ ...wizardForm, batch: e.target.value, gradYear: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                  <div style={{ display: "flex", gap: "6px", marginTop: "6px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>Quick pick:</span>
                    {["2025", "2026", "2027", "2028"].map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setWizardForm({ ...wizardForm, batch: yr, gradYear: yr })}
                        style={{
                          fontSize: "11px",
                          padding: "2px 8px",
                          backgroundColor: (wizardForm.batch === yr || wizardForm.gradYear === yr) ? "#EEF2FF" : "#F1F5F9",
                          border: (wizardForm.batch === yr || wizardForm.gradYear === yr) ? "1px solid #6366F1" : "1px solid #CBD5E1",
                          color: (wizardForm.batch === yr || wizardForm.gradYear === yr) ? "#4F46E5" : "#334155",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontWeight: (wizardForm.batch === yr || wizardForm.gradYear === yr) ? 700 : 500
                        }}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Min CGPA Cutoff (0-10) <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="e.g. 6.5"
                    value={wizardForm.minCgpa}
                    onChange={(e) => setWizardForm({ ...wizardForm, minCgpa: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Min 10th Standard Cutoff (%) <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    placeholder="e.g. 60"
                    value={wizardForm.minTenth}
                    onChange={(e) => setWizardForm({ ...wizardForm, minTenth: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Min 12th / Diploma Cutoff (%) <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    placeholder="e.g. 60"
                    value={wizardForm.minTwelfth}
                    onChange={(e) => setWizardForm({ ...wizardForm, minTwelfth: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Max Active Backlogs Allowed <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="10"
                    placeholder="e.g. 0"
                    value={wizardForm.maxBacklogs}
                    onChange={(e) => setWizardForm({ ...wizardForm, maxBacklogs: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Application Deadline Date <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={wizardForm.deadline}
                    onChange={(e) => setWizardForm({ ...wizardForm, deadline: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Estimated Openings <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 10"
                    value={wizardForm.openings}
                    onChange={(e) => setWizardForm({ ...wizardForm, openings: e.target.value })}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", boxSizing: "border-box" }}
                  />
                </div>
              </div>
            )}

            {/* Modal Navigation Buttons: Previous / Next / Publish */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #E2E8F0", paddingTop: "20px", marginTop: "24px" }}>
              <button
                type="button"
                disabled={currentStep === 1}
                onClick={() => setCurrentStep((prev) => (prev > 1 ? (prev - 1) as any : 1))}
                style={{
                  padding: "9px 18px",
                  backgroundColor: currentStep === 1 ? "#F1F5F9" : "#FFFFFF",
                  color: currentStep === 1 ? "#94A3B8" : "#334155",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: currentStep === 1 ? "not-allowed" : "pointer"
                }}
              >
                ← Back
              </button>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateWizard(false)}
                  style={{ padding: "9px 18px", backgroundColor: "#F8FAFC", color: "#64748B", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!validateWizardStep(currentStep)) {
                        return;
                      }
                      setCurrentStep((prev) => (prev < 4 ? (prev + 1) as any : 4));
                    }}
                    style={{ padding: "9px 22px", backgroundColor: "#0B3D91", color: "#FFFFFF", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePublishDrive}
                    style={{ padding: "9px 24px", backgroundColor: "#16A34A", color: "#FFFFFF", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(22,163,74,0.2)" }}
                  >
                    Publish Drive to Students
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRIVE DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedDrive && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "20px" }}>
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", maxWidth: "640px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #E2E8F0", paddingBottom: "16px", marginBottom: "18px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 800, color: "#0F172A" }}>{selectedDrive.company}</h3>
                <div style={{ fontSize: "12px", color: "#4338CA", fontWeight: 700, marginTop: "2px" }}>{selectedDrive.role || selectedDrive.jobTitle}</div>
              </div>
              <button onClick={() => setSelectedDrive(null)} style={{ background: "none", border: "none", fontSize: "20px", color: "#64748B", cursor: "pointer" }}>✕</button>
            </div>

            {/* Placement Officer Lifecycle Status Controls */}
            {(() => {
              const currentStatus = getDriveStatus(selectedDrive);
              const driveId = selectedDrive._id || selectedDrive.id;
              return (
                <div style={{ backgroundColor: "#F8FAFC", padding: "14px 16px", borderRadius: "12px", border: "1px solid #E2E8F0", marginBottom: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status:</span>
                      {currentStatus === "Active" && (
                        <span style={{ backgroundColor: "#DCFCE7", color: "#059669", border: "1px solid #86EFAC", padding: "3px 10px", borderRadius: "12px", fontSize: "11.5px", fontWeight: 700 }}>
                          ● Active (Open for Opt-In)
                        </span>
                      )}
                      {currentStatus === "In Progress" && (
                        <span style={{ backgroundColor: "#DBEAFE", color: "#1D4ED8", border: "1px solid #93C5FD", padding: "3px 10px", borderRadius: "12px", fontSize: "11.5px", fontWeight: 700 }}>
                          In Progress (Live Drive)
                        </span>
                      )}
                      {currentStatus === "Completed" && (
                        <span style={{ backgroundColor: "#F1F5F9", color: "#475569", border: "1px solid #CBD5E1", padding: "3px 10px", borderRadius: "12px", fontSize: "11.5px", fontWeight: 700 }}>
                          Completed
                        </span>
                      )}
                      {currentStatus === "Pending Approval" && (
                        <span style={{ backgroundColor: "#FEF3C7", color: "#D97706", border: "1px solid #FDE68A", padding: "3px 10px", borderRadius: "12px", fontSize: "11.5px", fontWeight: 700 }}>
                          Pending Approval
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>Quick Status Update</span>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => handleUpdateDriveStatus(driveId, "Active")}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: currentStatus === "Active" ? "#DCFCE7" : "#FFFFFF",
                        color: currentStatus === "Active" ? "#15803D" : "#334155",
                        border: `1px solid ${currentStatus === "Active" ? "#86EFAC" : "#CBD5E1"}`,
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Set Active
                    </button>
                    <button
                      onClick={() => handleUpdateDriveStatus(driveId, "In Progress")}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: currentStatus === "In Progress" ? "#DBEAFE" : "#FFFFFF",
                        color: currentStatus === "In Progress" ? "#1D4ED8" : "#334155",
                        border: `1px solid ${currentStatus === "In Progress" ? "#93C5FD" : "#CBD5E1"}`,
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Set In Progress
                    </button>
                    <button
                      onClick={() => handleUpdateDriveStatus(driveId, "Completed")}
                      style={{
                        padding: "6px 14px",
                        backgroundColor: currentStatus === "Completed" ? "#0F172A" : "#16A34A",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Mark Completed
                    </button>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "13px", color: "#334155", marginBottom: "20px" }}>
              <div><strong>Package (CTC):</strong> {selectedDrive.ctc || selectedDrive.packageCtc}</div>
              <div><strong>Location:</strong> {selectedDrive.location}</div>
              <div><strong>Eligible Department(s):</strong> {Array.isArray(selectedDrive.eligibleBranches) && selectedDrive.eligibleBranches.length > 0 ? selectedDrive.eligibleBranches.join(", ") : (selectedDrive.department || selectedDrive.departments || "All Branches")}</div>
              <div><strong>Eligible Batch:</strong> {selectedDrive.batch || selectedDrive.gradYear || "All Batches"}</div>
              <div><strong>Min CGPA:</strong> {selectedDrive.minCgpa !== undefined && selectedDrive.minCgpa !== "" ? selectedDrive.minCgpa : "No cutoff"}</div>
              <div><strong>10th / 12th Cutoff:</strong> {selectedDrive.minTenth ? `${selectedDrive.minTenth}%` : "None"} / {selectedDrive.minTwelfth ? `${selectedDrive.minTwelfth}%` : "None"}</div>
              <div><strong>Max Backlogs:</strong> {selectedDrive.maxBacklogs ?? 0}</div>
              <div><strong>Deadline:</strong> {selectedDrive.deadline}</div>
              {selectedDrive.recruiterName && <div><strong>Recruiter Name:</strong> {selectedDrive.recruiterName}</div>}
              {selectedDrive.recruiterEmail && <div><strong>Recruiter Email:</strong> {selectedDrive.recruiterEmail}</div>}
            </div>

            <div style={{ backgroundColor: "#F8FAFC", padding: "14px", borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "12.5px", color: "#475569", lineHeight: 1.5, marginBottom: "16px" }}>
              <strong>Job Description:</strong>
              <div style={{ marginTop: "4px" }}>{selectedDrive.jobDescription || "No detailed description provided."}</div>
            </div>

            {/* Selection Rounds Section */}
            <div style={{ backgroundColor: "#F8FAFC", padding: "14px", borderRadius: "10px", border: "1px solid #E2E8F0", marginBottom: "20px" }}>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
                Selection Rounds Workflow ({((selectedDrive.rounds && selectedDrive.rounds.length > 0) ? selectedDrive.rounds : (selectedDrive.roundsWorkflow || [])).length})
              </div>
              {((selectedDrive.rounds && selectedDrive.rounds.length > 0) ? selectedDrive.rounds : (selectedDrive.roundsWorkflow || [])).length === 0 ? (
                <div style={{ fontSize: "12px", color: "#64748B", fontStyle: "italic" }}>No specific selection rounds configured for this drive.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {((selectedDrive.rounds && selectedDrive.rounds.length > 0) ? selectedDrive.rounds : (selectedDrive.roundsWorkflow || [])).map((rnd: any, idx: number) => (
                    <div key={idx} style={{ backgroundColor: "#FFFFFF", padding: "10px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", fontSize: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 800, color: "#4F46E5" }}>Round {rnd.roundNumber || idx + 1}: {rnd.roundName || rnd.name}</span>
                        <span style={{ fontSize: "10.5px", color: "#4F46E5", backgroundColor: "#EEF2FF", padding: "2px 8px", borderRadius: "8px", fontWeight: 700 }}>{rnd.mode || "Online"}</span>
                      </div>
                      {(rnd.date || rnd.time || rnd.venue) && (
                        <div style={{ fontSize: "11px", color: "#64748B", marginTop: "4px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          {rnd.date && <span><strong>Date:</strong> {rnd.date}</span>}
                          {rnd.time && <span><strong>Time:</strong> {rnd.time}</span>}
                          {rnd.venue && <span><strong>Venue:</strong> {rnd.venue}</span>}
                        </div>
                      )}
                      {rnd.description && (
                        <div style={{ fontSize: "11.5px", color: "#475569", marginTop: "4px" }}>{rnd.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Opted-In Candidates List */}
            {(() => {
              const opted = getDriveOptedInCandidates(selectedDrive);
              return (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Opted-In Students ({opted.length})
                    </h4>
                    <span style={{ fontSize: "11px", color: "#64748B" }}>Live student registrations</span>
                  </div>

                  {opted.length === 0 ? (
                    <div style={{ padding: "16px", backgroundColor: "#F8FAFC", borderRadius: "8px", border: "1px dashed #CBD5E1", textAlign: "center", color: "#64748B", fontSize: "12px" }}>
                      No students have opted-in for this drive yet.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto" }}>
                      {opted.map((c, cIdx) => (
                        <div key={cIdx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", backgroundColor: "#FFFFFF", borderRadius: "8px", border: "1px solid #E2E8F0", fontSize: "12.5px" }}>
                          <div>
                            <div style={{ fontWeight: 700, color: "#0F172A" }}>{c.studentName || c.name || "Student"}</div>
                            <div style={{ fontSize: "11px", color: "#64748B" }}>{c.regNo || "22CSR100"} • {c.department || "CSE"} • {c.email}</div>
                          </div>
                          <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#16A34A", backgroundColor: "#DCFCE7", padding: "3px 8px", borderRadius: "6px" }}>
                            {c.status || "Opted-In"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setSelectedDrive(null)}
                style={{ padding: "8px 20px", backgroundColor: "#F1F5F9", color: "#334155", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CUSTOM CENTERED POPUP MODAL (Replaces browser window.alert) */}
      {/* ========================================================================= */}
      {popupAlert.show && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.7)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1300,
            padding: "20px"
          }}
          onClick={() => setPopupAlert(prev => ({ ...prev, show: false }))}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              maxWidth: "460px",
              width: "100%",
              padding: "32px 28px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
              textAlign: "center",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button
              onClick={() => setPopupAlert(prev => ({ ...prev, show: false }))}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "#F1F5F9",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                color: "#64748B",
                cursor: "pointer"
              }}
            >
              ✕
            </button>

            {/* Icon Badge */}
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
                backgroundColor:
                  popupAlert.type === "success"
                    ? "#DCFCE7"
                    : popupAlert.type === "error"
                    ? "#FEE2E2"
                    : popupAlert.type === "warning"
                    ? "#FEF3C7"
                    : "#E0E7FF",
                color:
                  popupAlert.type === "success"
                    ? "#16A34A"
                    : popupAlert.type === "error"
                    ? "#DC2626"
                    : popupAlert.type === "warning"
                    ? "#D97706"
                    : "#4F46E5"
              }}
            >
              {popupAlert.type === "success" && (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
              {popupAlert.type === "error" && (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              )}
              {popupAlert.type === "warning" && (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              )}
              {popupAlert.type === "info" && (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              )}
            </div>

            {/* Modal Title */}
            <h3
              style={{
                margin: "0 0 10px 0",
                fontSize: "20px",
                fontWeight: 800,
                color: "#0F172A",
                lineHeight: "1.3"
              }}
            >
              {popupAlert.title}
            </h3>

            {/* Modal Message */}
            <p
              style={{
                margin: "0 0 24px 0",
                fontSize: "14.5px",
                color: "#475569",
                lineHeight: "1.6",
                wordBreak: "break-word"
              }}
            >
              {popupAlert.message}
            </p>

            {/* Action Button */}
            <button
              onClick={() => setPopupAlert(prev => ({ ...prev, show: false }))}
              style={{
                width: "100%",
                padding: "12px 24px",
                backgroundColor:
                  popupAlert.type === "success"
                    ? "#16A34A"
                    : popupAlert.type === "error"
                    ? "#DC2626"
                    : popupAlert.type === "warning"
                    ? "#D97706"
                    : "#0B3D91",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow:
                  popupAlert.type === "success"
                    ? "0 4px 14px rgba(22, 163, 74, 0.3)"
                    : popupAlert.type === "error"
                    ? "0 4px 14px rgba(220, 38, 38, 0.3)"
                    : popupAlert.type === "warning"
                    ? "0 4px 14px rgba(217, 119, 6, 0.3)"
                    : "0 4px 14px rgba(79, 70, 229, 0.3)"
              }}
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Permanent Drive Deletion */}
      {driveToDelete && (
        <div onClick={() => setDriveToDelete(null)} style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(4px)",
          zIndex: 10001,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "28px",
            maxWidth: "450px",
            width: "100%",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}>
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>
                  Delete Placement Drive?
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Permanent Deletion
                </span>
              </div>
            </div>
            <p style={{ margin: "0 0 24px 0", fontSize: "14px", color: "#334155", lineHeight: "1.6" }}>
              Are you sure you want to delete the placement drive for <strong>{driveToDelete.company}</strong> ({driveToDelete.role || "Role"})? This recruitment drive will be permanently removed.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setDriveToDelete(null)}
                style={{
                  padding: "10px 18px",
                  backgroundColor: "#f1f5f9",
                  color: "#334155",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = driveToDelete;
                  setDriveToDelete(null);
                  handleDeleteDrive(target);
                }}
                style={{
                  padding: "10px 18px",
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(220, 38, 38, 0.25)"
                }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DriveManagement;
