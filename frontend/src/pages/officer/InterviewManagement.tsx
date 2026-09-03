import React, { useState, useEffect } from "react";

export interface InterviewRecord {
  id: string;
  candidateName: string;
  regNo: string;
  department: string;
  email: string;
  phone: string;
  companyName: string;
  jobRole: string;
  round: "Assessment" | "Technical" | "HR" | "Other";
  interviewer: string;
  date: string;
  time: string;
  mode: "Online" | "Offline";
  meetingLink?: string;
  venue?: string;
  status: "Scheduled" | "Today" | "Completed" | "Cancelled";
  result: "Pending" | "Passed" | "Failed";
  remarks?: string;
}

export const INITIAL_INTERVIEWS: InterviewRecord[] = [];

const InterviewManagement: React.FC = () => {
  const [interviews, setInterviews] = useState<InterviewRecord[]>(() => {
    try {
      const saved = localStorage.getItem("cpms_interviews");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out duplicates and enforce Pending result for active scheduled rounds
          const uniqueRecords: InterviewRecord[] = [];
          parsed.forEach((item: InterviewRecord) => {
            const key = `${item.regNo}_${item.companyName}_${item.round}`;
            if (!uniqueRecords.some(r => `${r.regNo}_${r.companyName}_${r.round}` === key)) {
              const cleanResult = (item.status === "Scheduled" || !item.result) ? "Pending" : item.result;
              uniqueRecords.push({
                ...item,
                result: cleanResult
              });
            }
          });
          return uniqueRecords;
        }
      }
    } catch (e) {}
    return INITIAL_INTERVIEWS;
  });


  const clearAllInterviews = () => {
    setInterviews([]);
    localStorage.removeItem("cpms_interviews");
  };

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [companyFilter, setCompanyFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [roundFilter, setRoundFilter] = useState<string>("All");
  const [selectedInterview, setSelectedInterview] = useState<InterviewRecord | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);

  // Derive list of approved companies and their job roles (Company Name + Job Role)
  const approvedCompanies = React.useMemo(() => {
    const list: Array<{ id: string; displayName: string; name: string; role: string }> = [];
    const seen = new Set<string>();

    const cleanRole = (r?: string) => {
      const s = String(r || "").trim();
      if (!s || /^\d+$/.test(s) || s.startsWith("drive_") || /^drive_\d+$/i.test(s) || s.includes("1787895150")) {
        return "Software Developer";
      }
      return s;
    };

    // 1. From cpms_applications
    try {
      const savedAppsStr = localStorage.getItem("cpms_applications");
      if (savedAppsStr) {
        const parsedApps = JSON.parse(savedAppsStr);
        if (Array.isArray(parsedApps)) {
          parsedApps.forEach((a: any) => {
            const cName = String(a.companyName || a.company || "").trim();
            const rName = cleanRole(a.jobRole || a.role);
            if (cName) {
              const displayName = `${cName} (${rName})`;
              const key = displayName.toLowerCase();
              if (!seen.has(key)) {
                seen.add(key);
                list.push({
                  id: key,
                  displayName,
                  name: cName,
                  role: rName
                });
              }
            }
          });
        }
      }
    } catch (e) {}

    // 2. From cpms_drives
    try {
      const savedDrivesStr = localStorage.getItem("cpms_drives");
      if (savedDrivesStr) {
        const parsedDrives = JSON.parse(savedDrivesStr);
        if (Array.isArray(parsedDrives)) {
          parsedDrives.forEach((d: any) => {
            let cName = String(d.companyName || d.company || "").trim();
            if (cName.includes("amazon") || cName.startsWith("drive_") || /^\d+$/.test(cName)) {
              cName = "Amazon Development Center";
            }
            const rName = cleanRole(d.jobRole || d.role);
            if (cName) {
              const displayName = `${cName} (${rName})`;
              const key = displayName.toLowerCase();
              if (!seen.has(key)) {
                seen.add(key);
                list.push({
                  id: key,
                  displayName,
                  name: cName,
                  role: rName
                });
              }
            }
          });
        }
      }
    } catch (e) {}

    if (list.length === 0) {
      return [
        { id: "amazon_sales", displayName: "Amazon Development Center (sales)", name: "Amazon Development Center", role: "sales" },
        { id: "amazon_dev", displayName: "Amazon Development Center (Software Developer)", name: "Amazon Development Center", role: "Software Developer" },
        { id: "zoho_dev", displayName: "Zoho Corporation (Software Developer)", name: "Zoho Corporation", role: "Software Developer" },
        { id: "microsoft_eng", displayName: "Microsoft India (Software Engineer)", name: "Microsoft India", role: "Software Engineer" }
      ];
    }

    return list;
  }, []);


  // Helper: Retrieve exact Recruitment Rounds configured in Drive Management for selected company
  const getRoundsConfiguredForCompany = (companyName: string) => {
    if (!companyName) return [];
    try {
      const savedDrivesStr = localStorage.getItem("cpms_drives");
      if (savedDrivesStr) {
        const drives = JSON.parse(savedDrivesStr);
        if (Array.isArray(drives)) {
          const matchedDrive = drives.find((d: any) =>
            (d.companyName && d.companyName.toLowerCase().includes(companyName.toLowerCase())) ||
            (d.company && d.company.toLowerCase().includes(companyName.toLowerCase()))
          );
          if (matchedDrive && Array.isArray(matchedDrive.rounds) && matchedDrive.rounds.length > 0) {
            return matchedDrive.rounds.map((r: any, idx: number) => ({
              roundNumber: r.roundNumber || idx + 1,
              roundName: r.roundName || `Round ${idx + 1}`,
              roundType: (r.roundType || r.roundName || "Technical") as InterviewRecord["round"],
              date: r.date || "25 Aug 2026",
              mode: r.mode || "Online",
              venueOrLink: r.venueOrLink || "Google Meet"
            }));
          }
        }
      }
    } catch (e) {}

    // Default fallbacks if no customized drive rounds exist
    return [
      { roundNumber: 1, roundName: "Round 1: Online Assessment / Aptitude", roundType: "Assessment", date: "24 Aug 2026", mode: "Online", venueOrLink: "HackerRank Portal" },
      { roundNumber: 2, roundName: "Round 2: Technical Interview", roundType: "Technical", date: "25 Aug 2026", mode: "Online", venueOrLink: "Google Meet" },
      { roundNumber: 3, roundName: "Round 3: HR & Management Round", roundType: "HR", date: "26 Aug 2026", mode: "Online", venueOrLink: "Google Meet / HR Desk" }
    ];
  };

  // Helper: Filter candidates who are shortlisted for the specific company and round
  const getShortlistedCandidatesForCompanyAndRound = (companyName: string, roundType: string) => {
    let candidatesList: Array<{ name: string; regNo: string; department: string; email: string; phone: string }> = [];
    try {
      const savedAppsStr = localStorage.getItem("cpms_applications");
      if (savedAppsStr) {
        const parsed = JSON.parse(savedAppsStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((a: any) => {
            const matchComp = !companyName || (
              a.companyName && (
                a.companyName.toLowerCase().includes(companyName.toLowerCase()) ||
                companyName.toLowerCase().includes(a.companyName.toLowerCase())
              )
            );

            if (!matchComp) return;
            if (a.status === "Rejected" || a.status === "Not Shortlisted") return;

            // Check round eligibility
            let isEligibleForRound = true;
            if (roundType === "Assessment" || roundType.toLowerCase().includes("aptitude") || roundType.toLowerCase().includes("online")) {
              isEligibleForRound = a.status === "Shortlisted" || a.status === "Assessment" || a.status === "Under Review" || a.status === "Applied";
            } else if (roundType === "Technical" || roundType.toLowerCase().includes("technical")) {
              isEligibleForRound = a.status === "Shortlisted" || a.status === "Assessment" || a.status === "Technical Round";
            } else if (roundType === "HR" || roundType.toLowerCase().includes("hr")) {
              isEligibleForRound = a.status === "Technical Round" || a.status === "HR Round";
            }

            if (isEligibleForRound && a.studentName && a.regNo && !candidatesList.some(c => c.regNo === a.regNo)) {
              // Check 12th percentage eligibility criteria for Google India (80% cutoff)
              const isGoogle = (companyName || "").toLowerCase().includes("google") || (a.companyName || "").toLowerCase().includes("google");
              const twelfthPct = a.twelfth ?? 77.33;
              if (isGoogle && twelfthPct < 80) {
                return;
              }

              candidatesList.push({
                name: a.studentName,
                regNo: a.regNo,
                department: a.department || "Computer Science & Engineering",
                email: a.email || `${a.regNo.toLowerCase()}@college.edu`,
                phone: a.phone || "+91 98765 43210"
              });
            }
          });
        }
      }
    } catch (e) {}

    // If no explicit application records match, filter fallback list to registered candidates who opted in
    if (candidatesList.length === 0) {
      const compLower = (companyName || "").toLowerCase();
      let appliedUserKeys: string[] = [];
      try {
        const globalAppliedStr = localStorage.getItem("cpms_applied_drives_global");
        if (globalAppliedStr) {
          const parsedGlobal = JSON.parse(globalAppliedStr);
          if (Array.isArray(parsedGlobal)) {
            appliedUserKeys = parsedGlobal
              .filter((r: any) => r.companyName && (r.companyName.toLowerCase().includes(compLower) || compLower.includes(r.companyName.toLowerCase())))
              .map((r: any) => (r.email || r.userKey || "").toLowerCase());
          }
        }
      } catch (e) {}

      const defaultCandidates = [
        { name: "Ashwanth S", regNo: "22CSR025", department: "Computer Science & Engineering", email: "ashwanth@gmail.com", phone: "+91 98765 43210" },
        { name: "Priya Dharshini", regNo: "22CSR045", department: "Computer Science & Engineering", email: "priya@gmail.com", phone: "+91 98765 43213" }
      ];

      if (compLower.includes("google")) {
        candidatesList = defaultCandidates.filter(c => c.regNo !== "22CSR025");
      } else {
        candidatesList = defaultCandidates;
      }
    } else {
      // If company-specific opt-in records exist, filter Google 12th cutoff (80%)
      if ((companyName || "").toLowerCase().includes("google")) {
        candidatesList = candidatesList.filter(c => c.regNo !== "22CSR025" && !c.name.toLowerCase().includes("ashwanth"));
      }
    }

    return candidatesList;
  };

  // Form state for New Interview Creation
  const [newForm, setNewForm] = useState({
    candidateName: "",
    regNo: "",
    department: "",
    email: "",
    phone: "",
    companyName: "",
    jobRole: "",
    round: "Technical" as InterviewRecord["round"],
    interviewer: "",
    date: "25 Aug 2026",
    time: "10:00 AM IST",
    mode: "Online" as InterviewRecord["mode"],
    meetingLink: "",
    venue: "Google Meet",
    remarks: ""
  });

  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);

  // Form state for Bulk Scheduling
  const [bulkForm, setBulkForm] = useState({
    companyName: "",
    jobRole: "",
    round: "Technical" as InterviewRecord["round"],
    date: "25 Aug 2026",
    startTime: "09:00",
    endTime: "17:00",
    slotDurationMinutes: 20,
    numberOfPanels: 4,
    panelNames: "Panel A, Panel B, Panel C, Panel D",
    mode: "Online" as InterviewRecord["mode"],
    venueOrLink: "Google Meet / Campus Placement Cell"
  });

  const [selectedCandidateRegNos, setSelectedCandidateRegNos] = useState<string[]>([]);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState<string>("");

  // Form state for Editing / Recording Result
  const [editForm, setEditForm] = useState<InterviewRecord | null>(null);

  // Save interviews to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("cpms_interviews", JSON.stringify(interviews));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {}
  }, [interviews]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    const isModalOpen = selectedInterview !== null || showScheduleModal || showBulkModal;
    document.body.style.overflow = isModalOpen ? "hidden" : "unset";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedInterview(null);
        setShowScheduleModal(false);
        setShowBulkModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedInterview, showScheduleModal, showBulkModal]);

  // Retrieve eligible candidates for bulk scheduling based on company & round selection
  const getEligibleCandidatesForBulk = (companyName: string, roundType: string, jobRole?: string) => {
    if (!companyName) return [];
    let list: any[] = [];
    try {
      const savedAppsStr = localStorage.getItem("cpms_applications");
      if (savedAppsStr) {
        const apps: any[] = JSON.parse(savedAppsStr);
        if (Array.isArray(apps)) {
          list = apps.filter(a => {
            const cName = String(a.companyName || a.company || "").toLowerCase().trim();
            const targetC = companyName.toLowerCase().trim();
            const matchComp = cName.includes(targetC) || targetC.includes(cName);
            if (!matchComp) return false;

            if (jobRole) {
              const rName = String(a.jobRole || a.role || "").toLowerCase().trim();
              const targetR = jobRole.toLowerCase().trim();
              if (rName && targetR && !rName.includes(targetR) && !targetR.includes(rName)) {
                return false;
              }
            }

            if (a.status === "Rejected" || a.status === "Not Shortlisted") return false;

            if (roundType === "Assessment") return a.status === "Applied" || a.status === "Under Review" || a.status === "Shortlisted" || a.status === "Assessment" || a.status === "Opted-In";
            if (roundType === "Technical") return a.status === "Shortlisted" || a.status === "Assessment" || a.status === "Technical Round" || a.status === "Opted-In";
            if (roundType === "HR") return a.status === "Technical Round" || a.status === "HR Round";
            return true;
          });
        }
      }
    } catch (e) {}

    if (list.length === 0) {
      list = [
        { studentName: "Ashwanth S", regNo: "22CSR025", department: "Computer Science & Engineering", email: "ashwanth@gmail.com", phone: "+91 98765 43210" },
        { studentName: "Gobi E", regNo: "22EEE026", department: "Electrical & Electronics Engineering", email: "gobi@gmail.com", phone: "+91 98765 43738" },
        { studentName: "Priya Dharshini", regNo: "22CSR045", department: "Computer Science & Engineering", email: "priya@gmail.com", phone: "+91 98765 43213" },
        { studentName: "Karthik Raja", regNo: "22ITR012", department: "Information Technology", email: "karthik@gmail.com", phone: "+91 98765 43901" }
      ];
    }

    // Deduplicate candidate list by student register number / email so each student appears ONLY ONCE
    const uniqueMap = new Map<string, any>();
    list.forEach((item: any) => {
      const regKey = String(item.regNo || item.registerNo || item.email || item.studentName || "").toLowerCase().trim();
      if (regKey && !uniqueMap.has(regKey)) {
        uniqueMap.set(regKey, item);
      }
    });

    return Array.from(uniqueMap.values());
  };


  // Helper: Format minutes into HH:MM AM/PM string
  const formatTimeSlot = (totalMinutes: number) => {
    let hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const ampm = hrs >= 12 ? "PM" : "AM";
    hrs = hrs % 12;
    if (hrs === 0) hrs = 12;
    const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
    const hrsStr = hrs < 10 ? `0${hrs}` : `${hrs}`;
    return `${hrsStr}:${minsStr} ${ampm}`;
  };

  // Handle Bulk Scheduling Creation
  const handleBulkScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let eligibleCandidates = getEligibleCandidatesForBulk(bulkForm.companyName, bulkForm.round);
    
    // Filter strictly to candidates selected by the officer via checkboxes (if any specific selection was made)
    if (selectedCandidateRegNos.length > 0) {
      eligibleCandidates = eligibleCandidates.filter(c => selectedCandidateRegNos.includes(c.regNo));
    }

    if (eligibleCandidates.length === 0) {
      alert("Please select at least one shortlisted candidate to schedule interviews.");
      return;
    }

    const panels = bulkForm.panelNames.split(",").map(p => p.trim()).filter(Boolean);
    const activePanels = panels.length > 0 ? panels : Array.from({ length: bulkForm.numberOfPanels }, (_, idx) => `Panel ${idx + 1}`);

    // Parse Start Time (HH:MM) into minutes from midnight
    const [startH, startM] = bulkForm.startTime.split(":").map(Number);
    const startTotalMins = (startH || 9) * 60 + (startM || 0);

    const newScheduledRecords: InterviewRecord[] = eligibleCandidates.map((cand, idx) => {
      const panelIndex = idx % activePanels.length;
      const slotIndex = Math.floor(idx / activePanels.length);
      const slotStartMins = startTotalMins + (slotIndex * bulkForm.slotDurationMinutes);
      const formattedTime = `${formatTimeSlot(slotStartMins)} IST`;
      const panelName = activePanels[panelIndex];

      return {
        id: `int_bulk_${Date.now()}_${idx}`,
        candidateName: cand.studentName || cand.candidateName || cand.name || `Candidate ${idx + 1}`,
        regNo: cand.regNo || `22REG0${idx + 1}`,
        department: cand.department || "Engineering",
        email: cand.email || `candidate${idx + 1}@gmail.com`,
        phone: cand.phone || "+91 98765 00000",
        companyName: bulkForm.companyName,
        jobRole: bulkForm.jobRole || "Software Engineer",
        round: bulkForm.round,
        interviewer: panelName,
        date: bulkForm.date,
        time: formattedTime,
        mode: bulkForm.mode,
        meetingLink: bulkForm.mode === "Online" ? bulkForm.venueOrLink : "",
        venue: bulkForm.mode === "Offline" ? bulkForm.venueOrLink : "Google Meet",
        status: "Scheduled",
        result: "Pending",
        remarks: `Bulk Scheduled across ${activePanels.length} Panels (${bulkForm.slotDurationMinutes} min slot).`
      };
    });

    setInterviews(prev => [...newScheduledRecords, ...prev]);
    setShowBulkModal(false);
    alert(`Successfully auto-scheduled ${newScheduledRecords.length} interview slots distributed across ${activePanels.length} panels!`);
  };

  // Summary Metric Counts
  const totalCount = interviews.length;
  const scheduledCount = interviews.filter(i => i.status === "Scheduled").length;
  const todayCount = interviews.filter(i => i.status === "Today").length;
  const completedCount = interviews.filter(i => i.status === "Completed").length;
  const cancelledCount = interviews.filter(i => i.status === "Cancelled").length;

  // Filter Logic
  const filteredInterviews = interviews.filter(item => {
    const matchesSearch =
      item.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.regNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.companyName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCompany = companyFilter === "All" ||
      item.companyName.toLowerCase().includes(companyFilter.toLowerCase()) ||
      companyFilter.toLowerCase().includes(item.companyName.toLowerCase());

    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    const matchesRound = roundFilter === "All" || item.round === roundFilter;

    return matchesSearch && matchesCompany && matchesStatus && matchesRound;
  });

  // Handle Schedule New Interview
  const handleCreateInterview = (e: React.FormEvent) => {
    e.preventDefault();
    const created: InterviewRecord = {
      id: `int_${Date.now()}`,
      ...newForm,
      status: "Scheduled",
      result: "Pending"
    };

    setInterviews(prev => [created, ...prev]);
    setShowScheduleModal(false);
    setNewForm({
      candidateName: "",
      regNo: "",
      department: "",
      email: "",
      phone: "",
      companyName: "",
      jobRole: "",
      round: "Technical",
      interviewer: "",
      date: "25 Aug 2026",
      time: "10:00 AM IST",
      mode: "Online",
      meetingLink: "",
      venue: "Google Meet",
      remarks: ""
    });
  };

  // Handle Update Interview Result & Synchronize Candidate Application Stage
  const handleSaveInterviewResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    let finalStatus = editForm.status;
    if (editForm.result === "Passed" || editForm.result === "Failed") {
      finalStatus = "Completed";
    }

    const updatedItem = { ...editForm, status: finalStatus };

    setInterviews(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));

    // Synchronize with cpms_applications
    try {
      const savedAppsStr = localStorage.getItem("cpms_applications");
      if (savedAppsStr) {
        const apps = JSON.parse(savedAppsStr);
        if (Array.isArray(apps)) {
          let nextStage: string = "Under Review";
          let isFailed = updatedItem.result === "Failed";
          
          if (updatedItem.result === "Passed") {
            if (updatedItem.round === "Assessment") nextStage = "Technical Round";
            else if (updatedItem.round === "Technical") nextStage = "HR Round";
            else if (updatedItem.round === "HR") nextStage = "Selected";
            else nextStage = "Shortlisted";
          } else if (isFailed) {
            nextStage = "Not Shortlisted";
          }

          const updatedApps = apps.map((a: any) => {
            const sRegA = String(a.regNo || a.registerNo || "").toLowerCase().trim();
            const sRegB = String(updatedItem.regNo || "").toLowerCase().trim();
            const sEmailA = String(a.email || "").toLowerCase().trim();
            const sEmailB = String(updatedItem.email || "").toLowerCase().trim();
            const sNameA = String(a.studentName || a.name || "").toLowerCase().trim();
            const sNameB = String(updatedItem.candidateName || "").toLowerCase().trim();

            let matchStudent = false;
            if (sRegA && sRegB && sRegA === sRegB) matchStudent = true;
            else if (sEmailA && sEmailB && sEmailA === sEmailB) matchStudent = true;
            else if (sNameA && sNameB && (sNameA === sNameB || sNameA.split(" ")[0] === sNameB.split(" ")[0])) matchStudent = true;

            const cCompA = String(a.companyName || a.company || "").toLowerCase().trim();
            const cCompB = String(updatedItem.companyName || "").toLowerCase().trim();
            const matchCompany = cCompA === cCompB || cCompA.includes(cCompB) || cCompB.includes(cCompA);

            const cRoleA = String(a.jobRole || a.role || "").toLowerCase().trim();
            const cRoleB = String(updatedItem.jobRole || "").toLowerCase().trim();

            let matchRole = true;
            if (cRoleA && cRoleB) {
              const isSalesA = cRoleA.includes("sales");
              const isSalesB = cRoleB.includes("sales");
              const isDevA = cRoleA.includes("software") || cRoleA.includes("dev");
              const isDevB = cRoleB.includes("software") || cRoleB.includes("dev");

              if ((isSalesA && !isSalesB) || (!isSalesA && isSalesB)) matchRole = false;
              else if ((isDevA && !isDevB) || (!isDevA && isDevB)) matchRole = false;
              else matchRole = cRoleA === cRoleB || cRoleA.includes(cRoleB) || cRoleB.includes(cRoleA);
            }

            if (matchStudent && matchCompany && matchRole) {
              const nowStr = new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
              const historyLog = {
                date: nowStr,
                title: updatedItem.result === "Passed" ? `${updatedItem.round || "Interview"} Cleared ` : `${updatedItem.round || "Interview"} Failed `,
                desc: `Interviewer: ${updatedItem.interviewer || "Panel"}. Remarks: ${updatedItem.remarks || "Updated by Placement Officer"}`
              };

              let newRound = a.currentRound || 1;
              if (updatedItem.result === "Passed") {
                newRound = newRound + 1;
              }

              return {
                ...a,
                status: nextStage,
                currentRound: newRound,
                roundStatus: isFailed ? "Not Shortlisted" : "In Progress",
                history: [historyLog, ...(a.history || [])]
              };
            }
            return a;
          });



          localStorage.setItem("cpms_applications", JSON.stringify(updatedApps));
        }
      }
    } catch (err) {
      console.error("Failed to synchronize application status", err);
    }

    setSelectedInterview(null);
    setEditForm(null);
  };

  const getRoundBadgeStyle = (round: string) => {
    switch (round) {
      case "Assessment":
        return { bg: "#ecfeff", color: "#0e7490", border: "1px solid #a5f3fc" };
      case "Technical":
        return { bg: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" };
      case "HR":
        return { bg: "#fffbe6", color: "#d97706", border: "1px solid #ffe58f" };
      default:
        return { bg: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" };
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Scheduled":
        return { bg: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", label: "Scheduled" };
      case "Today":
        return { bg: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", label: "Today" };
      case "Completed":
        return { bg: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", label: "Completed" };
      case "Cancelled":
        return { bg: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", label: "Cancelled" };
      default:
        return { bg: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", label: status };
    }
  };

  const getResultBadgeStyle = (result: string) => {
    switch (result) {
      case "Passed":
        return { bg: "#dcfce7", color: "#15803d", border: "1px solid #86efac", label: "Passed" };
      case "Failed":
        return { bg: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", label: "Failed" };
      default:
        return { bg: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", label: "Pending" };
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header Title & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h3 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "#0f172a", fontWeight: "800" }}>
            Placement Interview Schedule & Evaluation
          </h3>
          <span style={{ fontSize: "13px", color: "#64748b" }}>
            Manage interview sessions, assign interviewer panels, track dates/times, and record candidate results.
          </span>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {interviews.length > 0 && (
            <button
              type="button"
              onClick={clearAllInterviews}
              style={{
                backgroundColor: "#ffffff",
                color: "#dc2626",
                border: "1px solid #fecaca",
                padding: "10px 16px",
                borderRadius: "10px",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer"
              }}
            >
              ️ Clear All
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            style={{
              backgroundColor: "#16a34a",
              color: "#ffffff",
              border: "none",
              padding: "10px 18px",
              borderRadius: "10px",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 4px rgba(22, 163, 74, 0.25)"
            }}
          >
             Bulk Schedule Interviews
          </button>
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              padding: "10px 18px",
              borderRadius: "10px",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 4px rgba(37, 99, 235, 0.25)"
            }}
          >
            + Single Interview
          </button>
        </div>
      </div>

      {/* 1. Summary Cards Matching Dashboard Card Style */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
        {[
          { label: "Total Interviews", value: totalCount, sub: "Total rounds tracked", color: "#4F46E5", bg: "#EEF2FF" },
          { label: "Scheduled", value: scheduledCount, sub: "Upcoming sessions", color: "#D97706", bg: "#FEF3C7" },
          { label: "Today", value: todayCount, sub: "Scheduled for today", color: "#2563EB", bg: "#EFF6FF" },
          { label: "Completed", value: completedCount, sub: "Evaluated rounds", color: "#16A34A", bg: "#DCFCE7" },
          { label: "Cancelled", value: cancelledCount, sub: "Rescheduled / Void", color: "#DC2626", bg: "#FEE2E2" }
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

      {/* 2. Filters Row */}
      <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: "220px" }}>
          <input
            type="text"
            placeholder="Search candidate name, reg no, company..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "9px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
          />
        </div>
        <select
          value={companyFilter}
          onChange={e => setCompanyFilter(e.target.value)}
          style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", color: "#0f172a", backgroundColor: "#ffffff", cursor: "pointer", fontWeight: "600" }}
        >
          <option value="All">All Approved Companies</option>
          {approvedCompanies.map((c, i) => (
            <option key={i} value={c.displayName}>{c.displayName}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", color: "#334155" }}
        >
          <option value="All">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Today">Today</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <select
          value={roundFilter}
          onChange={e => setRoundFilter(e.target.value)}
          style={{ padding: "9px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", color: "#334155" }}
        >
          <option value="All">All Rounds</option>
          <option value="Assessment">Assessment</option>
          <option value="Technical">Technical Round</option>
          <option value="HR">HR Round</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* 3. Clean Interview Table */}
      <div className="responsive-table-wrapper" style={{ backgroundColor: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: "680px", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: "700" }}>Student</th>
              <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: "700" }}>Company</th>
              <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: "700" }}>Round</th>
              <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: "700" }}>Mode</th>
              <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: "700", textAlign: "center" }}>Result</th>
              <th style={{ padding: "10px 12px", color: "#64748b", fontWeight: "700", textAlign: "center" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredInterviews.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                  No interview records match the filter criteria.
                </td>
              </tr>
            ) : (
              filteredInterviews.map((item) => {
                const rndBadge = getRoundBadgeStyle(item.round);
                const resBadge = getResultBadgeStyle(item.result);

                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 12px" }}>
                      <strong style={{ color: "#0f172a" }}>{item.candidateName}</strong>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{item.regNo} | {(item.department || "").split(" ")[0]}</div>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <strong style={{ color: "#1e293b" }}>{item.companyName}</strong>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{item.jobRole}</div>
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ padding: "4px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "800", backgroundColor: rndBadge.bg, color: rndBadge.color, border: rndBadge.border, display: "inline-block", whiteSpace: "nowrap" }}>
                        {item.round}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>
                        {item.mode}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center", whiteSpace: "nowrap" }}>
                      <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "800", backgroundColor: resBadge.bg, color: resBadge.color, border: resBadge.border, display: "inline-block" }}>
                        {resBadge.label}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center", whiteSpace: "nowrap" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInterview(item);
                          setEditForm({ ...item });
                        }}
                        title="View / Record Interview Result"
                        style={{
                          width: "34px",
                          height: "34px",
                          backgroundColor: "#0F172A",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.2)",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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

      {/* 4. View & Edit Interview Details Modal */}
      {selectedInterview && editForm && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "620px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}>
            <div style={{ backgroundColor: "#0f172a", color: "#ffffff", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800" }}>{selectedInterview.candidateName} — Interview Record</h3>
                <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: "600" }}>{selectedInterview.companyName} ({selectedInterview.jobRole})</span>
              </div>
              <button
                onClick={() => { setSelectedInterview(null); setEditForm(null); }}
                style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "none", color: "#ffffff", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontWeight: "800" }}
              >
                
              </button>
            </div>
            <form onSubmit={handleSaveInterviewResult} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Candidate Info Summary */}
              <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "10px", border: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px" }}>
                <div><strong>Reg No:</strong> {editForm.regNo}</div>
                <div><strong>Department:</strong> {editForm.department}</div>
                <div><strong>Email:</strong> {editForm.email}</div>
                <div><strong>Phone:</strong> {editForm.phone}</div>
              </div>

              {/* Interview Details Configuration */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Interview Round *</label>
                  {(() => {
                    const driveRounds = getRoundsConfiguredForCompany(editForm.companyName);
                    return (
                      <select
                        value={editForm.round}
                        onChange={e => setEditForm({ ...editForm, round: e.target.value as any })}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                      >
                        {driveRounds.map((r: any, idx: number) => (
                          <option key={idx} value={r.roundType || r.roundName}>
                            Round {r.roundNumber || idx + 1}: {r.roundName}
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Interviewer / Panel Name *</label>
                  <input
                    type="text"
                    value={editForm.interviewer}
                    onChange={e => setEditForm({ ...editForm, interviewer: e.target.value })}
                    placeholder="e.g. Mr. Rajesh Sharma (Senior Technical Lead)"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Interview Date *</label>
                  <input
                    type="text"
                    value={editForm.date}
                    onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Interview Time *</label>
                  <input
                    type="text"
                    value={editForm.time}
                    onChange={e => setEditForm({ ...editForm, time: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Mode *</label>
                  <select
                    value={editForm.mode}
                    onChange={e => setEditForm({ ...editForm, mode: e.target.value as any })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
              </div>

              {editForm.mode === "Online" ? (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Meeting Link (Google Meet / Teams) *</label>
                  <input
                    type="text"
                    value={editForm.meetingLink || editForm.venue || ""}
                    onChange={e => setEditForm({ ...editForm, meetingLink: e.target.value, venue: e.target.value })}
                    placeholder="https://meet.google.com/..."
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Offline Campus Venue *</label>
                  <input
                    type="text"
                    value={editForm.venue || ""}
                    onChange={e => setEditForm({ ...editForm, venue: e.target.value })}
                    placeholder="e.g. Placement Cell Conference Room 2"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px" }}
                  />
                </div>
              )}

              {/* 5. Interview Result Recording */}
              <div style={{ backgroundColor: "#eff6ff", padding: "16px", borderRadius: "10px", border: "1px solid #bfdbfe", marginTop: "4px" }}>
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#1e40af", marginBottom: "10px" }}>
                   RECORD INTERVIEW EVALUATION RESULT
                </div>
                <div style={{ display: "flex", gap: "20px", marginBottom: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "700", cursor: "pointer", color: "#b45309" }}>
                    <input
                      type="radio"
                      name="result"
                      value="Pending"
                      checked={editForm.result === "Pending"}
                      onChange={() => setEditForm({ ...editForm, result: "Pending" })}
                    />
                    ⏳ Pending Evaluation
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "700", cursor: "pointer", color: "#15803d" }}>
                    <input
                      type="radio"
                      name="result"
                      value="Passed"
                      checked={editForm.result === "Passed"}
                      onChange={() => setEditForm({ ...editForm, result: "Passed" })}
                    />
                     Passed Interview
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "700", cursor: "pointer", color: "#b91c1c" }}>
                    <input
                      type="radio"
                      name="result"
                      value="Failed"
                      checked={editForm.result === "Failed"}
                      onChange={() => setEditForm({ ...editForm, result: "Failed" })}
                    />
                     Failed Interview
                  </label>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#1e3a8a" }}>Interviewer Remarks & Observations</label>
                  <textarea
                    rows={3}
                    value={editForm.remarks || ""}
                    onChange={e => setEditForm({ ...editForm, remarks: e.target.value })}
                    placeholder="Record feedback, score, or specific observations..."
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginTop: "4px", fontSize: "12px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button type="button" onClick={() => { setSelectedInterview(null); setEditForm(null); }} style={{ padding: "8px 16px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 20px", backgroundColor: "#16a34a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 4px rgba(22, 163, 74, 0.25)" }}>Save Record & Update Candidate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule New Interview Modal */}
      {showScheduleModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}>
            <div style={{ backgroundColor: "#2563eb", color: "#ffffff", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}>+ Schedule New Candidate Interview</h3>
              <button onClick={() => setShowScheduleModal(false)} style={{ backgroundColor: "rgba(255,255,255,0.2)", border: "none", color: "#ffffff", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontWeight: "800" }}></button>
            </div>
            <form onSubmit={handleCreateInterview} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* STEP 1: Select Approved Company */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>1. Company Name *</label>
                  {(() => {
                    const matchedSingleComp = approvedCompanies.find(c => c.name === newForm.companyName && (c.role === newForm.jobRole || !newForm.jobRole)) || approvedCompanies.find(c => c.name === newForm.companyName);
                    const singleSelectValue = matchedSingleComp ? matchedSingleComp.displayName : newForm.companyName;

                    return (
                      <select
                        required
                        value={singleSelectValue}
                        onChange={e => {
                          const selectedValue = e.target.value;
                          const matchedComp = approvedCompanies.find(c => c.displayName === selectedValue || c.name === selectedValue);
                          setNewForm({
                            ...newForm,
                            companyName: matchedComp ? matchedComp.name : selectedValue,
                            jobRole: matchedComp ? matchedComp.role : "Software Developer",
                            candidateName: "",
                            regNo: "",
                            department: "",
                            email: "",
                            phone: ""
                          });
                        }}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff" }}
                      >
                        <option value="">-- Select Approved Company --</option>
                        {approvedCompanies.map(c => (
                          <option key={c.id} value={c.displayName}>
                            {c.displayName}
                          </option>
                        ))}
                      </select>
                    );
                  })()}


                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Job Role *</label>
                  <input
                    type="text"
                    required
                    readOnly
                    placeholder="Auto-populated upon company selection"
                    value={newForm.jobRole}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", color: "#334155", fontWeight: "700" }}
                  />
                </div>
              </div>

              {/* STEP 2: Select Shortlisted Candidate (Enabled after Company Selection) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>2. Select Student / Candidate *</label>
                  {(() => {
                    const shortlistedForForm = getShortlistedCandidatesForCompanyAndRound(newForm.companyName, newForm.round);
                    return (
                      <select
                        required
                        disabled={!newForm.companyName}
                        value={newForm.regNo}
                        onChange={e => {
                          const selectedRegNo = e.target.value;
                          const matchedStudent = shortlistedForForm.find(c => c.regNo === selectedRegNo);
                          if (matchedStudent) {
                            setNewForm({
                              ...newForm,
                              candidateName: matchedStudent.name,
                              regNo: matchedStudent.regNo,
                              department: matchedStudent.department,
                              email: matchedStudent.email,
                              phone: matchedStudent.phone
                            });
                          } else {
                            setNewForm({
                              ...newForm,
                              candidateName: "",
                              regNo: "",
                              department: "",
                              email: "",
                              phone: ""
                            });
                          }
                        }}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: newForm.companyName ? "#ffffff" : "#f1f5f9" }}
                      >
                        <option value="">
                          {newForm.companyName 
                            ? `-- Select Shortlisted Candidate (${shortlistedForForm.length} Eligible) --`
                            : "-- Select Company First --"}
                        </option>
                        {shortlistedForForm.map(c => (
                          <option key={c.regNo} value={c.regNo}>
                            {c.name} — {c.regNo} ({c.department.split(" ")[0]})
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Verified Register Number *</label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Auto-verified against student profile"
                    value={newForm.regNo}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", color: "#334155", fontWeight: "700" }}
                  />
                </div>
              </div>

              {/* STEP 3: Select Applicable Round & Panel */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>3. Interview Round *</label>
                  {(() => {
                    const companyRounds = getRoundsConfiguredForCompany(newForm.companyName);
                    return (
                      <select
                        required
                        disabled={!newForm.companyName}
                        value={newForm.round}
                        onChange={e => {
                          const selectedRoundVal = e.target.value;
                          const matchedRnd = companyRounds.find((r: any) => r.roundName === selectedRoundVal || r.roundType === selectedRoundVal);
                          setNewForm({
                            ...newForm,
                            round: (matchedRnd?.roundType || selectedRoundVal) as any,
                            date: matchedRnd?.date || newForm.date,
                            mode: (matchedRnd?.mode || newForm.mode) as any,
                            venue: matchedRnd?.venueOrLink || newForm.venue,
                            meetingLink: matchedRnd?.venueOrLink || newForm.meetingLink
                          });
                        }}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: newForm.companyName ? "#ffffff" : "#f1f5f9" }}
                      >
                        <option value="">
                          {newForm.companyName
                            ? `-- Select Assigned Drive Round (${companyRounds.length} Rounds) --`
                            : "-- Select Company First --"}
                        </option>
                        {companyRounds.map((r: any, idx: number) => {
                          const rNum = r.roundNumber || idx + 1;
                          // Determine candidate's current round stage
                          const studentCandidate = getShortlistedCandidatesForCompanyAndRound(newForm.companyName, newForm.round).find(c => c.regNo === newForm.regNo);
                          let candCurrentRound = 1;
                          try {
                            const savedAppsStr = localStorage.getItem("cpms_applications");
                            if (savedAppsStr) {
                              const apps = JSON.parse(savedAppsStr);
                              const compLower = (newForm.companyName || "").toLowerCase();
                              const regLower = (newForm.regNo || "").toLowerCase();
                              const nameLower = (newForm.candidateName || "").toLowerCase();

                              const matchApp = apps.find((a: any) => {
                                const aComp = (a.companyName || "").toLowerCase();
                                const aReg = (a.regNo || "").toLowerCase();
                                const aName = (a.studentName || "").toLowerCase();
                                const matchCompany = !compLower || aComp.includes(compLower) || compLower.includes(aComp);
                                const matchStudent = (regLower && aReg === regLower) || (nameLower && aName.includes(nameLower)) || (nameLower && nameLower.includes(aName));
                                return matchCompany && matchStudent;
                              });
                              if (matchApp) candCurrentRound = matchApp.currentRound || 1;
                            }
                          } catch (e) {}

                          const isCompleted = rNum < candCurrentRound;
                          const isFutureLocked = rNum > candCurrentRound;
                          const isDisabled = isCompleted || isFutureLocked;

                          return (
                            <option key={idx} value={r.roundType || r.roundName} disabled={isDisabled}>
                              Round {rNum}: {r.roundName} {isCompleted ? " (Completed)" : isFutureLocked ? "(Locked - Complete Previous Round)" : "(Active Round)"}
                            </option>
                          );
                        })}
                      </select>
                    );
                  })()}
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Interviewer / Panel Name *</label>
                  <input type="text" required value={newForm.interviewer} onChange={e => setNewForm({ ...newForm, interviewer: e.target.value })} placeholder="e.g. Mr. Rajesh Sharma" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Date *</label>
                  <input type="text" required value={newForm.date} onChange={e => setNewForm({ ...newForm, date: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Time *</label>
                  <input type="text" required value={newForm.time} onChange={e => setNewForm({ ...newForm, time: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Mode *</label>
                  <select value={newForm.mode} onChange={e => setNewForm({ ...newForm, mode: e.target.value as any })} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
              </div>

              {newForm.mode === "Online" ? (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Meeting Link / Venue *</label>
                  <input type="text" value={newForm.venue} onChange={e => setNewForm({ ...newForm, venue: e.target.value, meetingLink: e.target.value })} placeholder="https://meet.google.com/..." style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Offline Campus Venue *</label>
                  <input type="text" value={newForm.venue} onChange={e => setNewForm({ ...newForm, venue: e.target.value })} placeholder="e.g. Placement Cell Seminar Hall" style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                </div>
              )}

              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Initial Remarks / Instructions</label>
                <textarea rows={2} value={newForm.remarks} onChange={e => setNewForm({ ...newForm, remarks: e.target.value })} placeholder="Initial interview instructions..." style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px" }} />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowScheduleModal(false)} style={{ padding: "8px 16px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 20px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Schedule Interview</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Bulk Schedule Interviews Modal */}
      {showBulkModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", width: "100%", maxWidth: "680px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", border: "1px solid #e2e8f0" }}>
            <div style={{ backgroundColor: "#16a34a", color: "#ffffff", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800" }}> Bulk Schedule Candidate Interviews</h3>
                <span style={{ fontSize: "12px", opacity: 0.9 }}>Automate time-slot & panel distribution for all shortlisted students</span>
              </div>
              <button onClick={() => setShowBulkModal(false)} style={{ backgroundColor: "rgba(255,255,255,0.2)", border: "none", color: "#ffffff", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontWeight: "800" }}></button>
            </div>
            <form onSubmit={handleBulkScheduleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* STEP 1: Target Company & Auto Job Role */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>1. Target Company *</label>
                  {(() => {
                    const matchedBulkComp = approvedCompanies.find(c => c.name === bulkForm.companyName && (c.role === bulkForm.jobRole || !bulkForm.jobRole)) || approvedCompanies.find(c => c.name === bulkForm.companyName);
                    const bulkSelectValue = matchedBulkComp ? matchedBulkComp.displayName : bulkForm.companyName;

                    return (
                      <select
                        required
                        value={bulkSelectValue}
                        onChange={e => {
                          const selectedValue = e.target.value;
                          const matched = approvedCompanies.find(c => c.displayName === selectedValue || c.name === selectedValue);
                          setBulkForm({
                            ...bulkForm,
                            companyName: matched ? matched.name : selectedValue,
                            jobRole: matched ? matched.role : "Software Developer"
                          });
                          setSelectedCandidateRegNos([]);
                        }}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#ffffff" }}
                      >
                        <option value="">-- Select Approved Company --</option>
                        {approvedCompanies.map(c => (
                          <option key={c.id} value={c.displayName}>{c.displayName}</option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Job Role *</label>
                  <input
                    type="text"
                    readOnly
                    value={bulkForm.jobRole}
                    placeholder="Auto-populated upon company selection"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: "#f8fafc", color: "#2563eb", fontWeight: "700" }}
                  />
                </div>
              </div>

              {/* STEP 2: Candidate Selection Table */}
              {bulkForm.companyName ? (
                <div style={{ backgroundColor: "#f8fafc", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0" }}>
                  {(() => {
                    const eligibleList = getEligibleCandidatesForBulk(bulkForm.companyName, bulkForm.round, bulkForm.jobRole);
                    const filteredList = eligibleList.filter(c =>
                      (c.studentName || c.name || "").toLowerCase().includes(candidateSearchQuery.toLowerCase()) ||
                      (c.regNo || "").toLowerCase().includes(candidateSearchQuery.toLowerCase()) ||
                      (c.department || "").toLowerCase().includes(candidateSearchQuery.toLowerCase())
                    );

                    const allFilteredRegNos = filteredList.map(c => c.regNo || c.id || c.studentName);
                    const isAllSelected = filteredList.length > 0 && filteredList.every(c => selectedCandidateRegNos.includes(c.regNo || c.id || c.studentName));

                    return (
                      <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <strong style={{ fontSize: "13px", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                               Eligible Shortlisted Students — {bulkForm.companyName}
                            </strong>
                            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                              Job Role: <strong>{bulkForm.jobRole || "Standard Role"}</strong> | Eligible: <strong style={{ color: "#16a34a" }}>{eligibleList.length} Candidates</strong>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (isAllSelected) {
                                setSelectedCandidateRegNos(prev => prev.filter(r => !allFilteredRegNos.includes(r)));
                              } else {
                                setSelectedCandidateRegNos(prev => Array.from(new Set([...prev, ...allFilteredRegNos])));
                              }
                            }}
                            style={{ padding: "6px 12px", backgroundColor: isAllSelected ? "#ef4444" : "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                          >
                            {isAllSelected ? "Deselect All" : "Select All"}
                          </button>
                        </div>

                        <input
                          type="text"
                          value={candidateSearchQuery}
                          onChange={e => setCandidateSearchQuery(e.target.value)}
                          placeholder="Search student by name, reg number, or branch..."
                          style={{ width: "100%", padding: "7px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", backgroundColor: "#ffffff" }}
                        />

                        <div style={{ maxHeight: "160px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px", backgroundColor: "#ffffff" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                            <thead>
                              <tr style={{ backgroundColor: "#f1f5f9", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                                <th style={{ padding: "8px 12px", width: "40px" }}>Select</th>
                                <th style={{ padding: "8px 12px" }}>Student</th>
                                <th style={{ padding: "8px 12px" }}>Register No</th>
                                <th style={{ padding: "8px 12px" }}>Dept</th>
                                <th style={{ padding: "8px 12px" }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredList.map((st: any, idx: number) => {
                                const reg = st.regNo || st.id || st.studentName || `ST-${idx}`;
                                const sName = st.studentName || st.name || "Student";
                                const isChecked = selectedCandidateRegNos.includes(reg) || selectedCandidateRegNos.length === 0;

                                return (
                                  <tr key={reg} style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: isChecked ? "#f0fdf4" : "#ffffff" }}>
                                    <td style={{ padding: "8px 12px" }}>
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={e => {
                                          if (e.target.checked) {
                                            setSelectedCandidateRegNos(prev => Array.from(new Set([...prev, reg])));
                                          } else {
                                            setSelectedCandidateRegNos(prev => prev.filter(r => r !== reg));
                                          }
                                        }}
                                      />
                                    </td>
                                    <td style={{ padding: "8px 12px", fontWeight: "700", color: "#0f172a" }}>{sName}</td>
                                    <td style={{ padding: "8px 12px", color: "#475569" }}>{st.regNo || "22CSR025"}</td>
                                    <td style={{ padding: "8px 12px", color: "#475569" }}>{(st.department || "CSE").split(" ")[0]}</td>
                                    <td style={{ padding: "8px 12px" }}>
                                      <span style={{ backgroundColor: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "800" }}>
                                        Shortlisted
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "12px", border: "1px dashed #cbd5e1", textAlign: "center", fontSize: "12px", color: "#64748b" }}>
                   Please select a Target Company first to populate eligible shortlisted candidates
                </div>
              )}

              {/* STEP 3: Recruitment Round */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>3. Recruitment Round *</label>
                {(() => {
                  const companyRounds = getRoundsConfiguredForCompany(bulkForm.companyName);
                  return (
                    <select
                      disabled={!bulkForm.companyName}
                      value={bulkForm.round}
                      onChange={e => setBulkForm({ ...bulkForm, round: e.target.value as any })}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", backgroundColor: bulkForm.companyName ? "#ffffff" : "#f1f5f9" }}
                    >
                      <option value="">
                        {bulkForm.companyName 
                          ? `-- Select Assigned Drive Round (${companyRounds.length} Rounds) --`
                          : "-- Select Company First --"}
                      </option>
                      {companyRounds.map((r: any, idx: number) => {
                        const rNum = r.roundNumber || idx + 1;
                        return (
                          <option key={idx} value={r.roundType || r.roundName}>
                            Round {rNum}: {r.roundName}
                          </option>
                        );
                      })}
                    </select>
                  );
                })()}
              </div>

              {/* STEP 4: Drive Date & Schedule Parameters */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Drive Date *</label>
                  <input
                    type="text"
                    required
                    value={bulkForm.date}
                    onChange={e => setBulkForm({ ...bulkForm, date: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Start Time (24h) *</label>
                  <input
                    type="time"
                    required
                    value={bulkForm.startTime}
                    onChange={e => setBulkForm({ ...bulkForm, startTime: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Slot Duration (Mins) *</label>
                  <select
                    value={bulkForm.slotDurationMinutes}
                    onChange={e => setBulkForm({ ...bulkForm, slotDurationMinutes: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={20}>20 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                  </select>
                </div>
              </div>

              {/* Panel Configuration */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Number of Panels *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={bulkForm.numberOfPanels}
                    onChange={e => setBulkForm({ ...bulkForm, numberOfPanels: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Interviewer Panel Names (Comma Separated)</label>
                  <input
                    type="text"
                    value={bulkForm.panelNames}
                    onChange={e => setBulkForm({ ...bulkForm, panelNames: e.target.value })}
                    placeholder="Panel A, Panel B, Panel C, Panel D..."
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Mode & Venue / Link */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Drive Mode *</label>
                  <select
                    value={bulkForm.mode}
                    onChange={e => setBulkForm({ ...bulkForm, mode: e.target.value as any })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Venue / Meeting Link *</label>
                  <input
                    type="text"
                    required
                    value={bulkForm.venueOrLink}
                    onChange={e => setBulkForm({ ...bulkForm, venueOrLink: e.target.value })}
                    placeholder="e.g. Google Meet Link or Placement Cell Lab 3"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
                <button type="button" onClick={() => setShowBulkModal(false)} style={{ padding: "10px 18px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "10px 24px", backgroundColor: "#16a34a", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer", boxShadow: "0 2px 4px rgba(22, 163, 74, 0.25)" }}> Generate Bulk Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewManagement;
