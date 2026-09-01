import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";

export const INITIAL_COMPANIES: any[] = [];

const CompanyManagement: React.FC = () => {
    const [companies, setCompanies] = useState<any[]>(() => {
        try {
            if (localStorage.getItem("cpms_companies_cleared") === "true") {
                return [];
            }
            const saved = localStorage.getItem("cpms_companies");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.filter((c: any) => !["comp_amazon", "comp_zoho", "comp_jac", "comp_cognizant"].includes(c.id));
                }
            }
        } catch (e) { }
        return [];
    });

    useEffect(() => {
        try {
            localStorage.setItem("cpms_companies", JSON.stringify(companies));
        } catch (e) {
            console.error("Failed to save companies to localStorage", e);
        }
    }, [companies]);

    const reloadCompanies = async () => {
        if (localStorage.getItem("cpms_companies_cleared") === "true") {
            setCompanies([]);
            return;
        }

        let savedRecProfile: any = null;
        try {
            const profStr = localStorage.getItem("cpms_recruiter_company_profile");
            if (profStr) savedRecProfile = JSON.parse(profStr);
        } catch (e) { }

        const defaultRecName = savedRecProfile?.contactPersonName || "Arya (Placement Lead)";
        const defaultRecEmail = savedRecProfile?.contactEmail || "arya@amazon.com";
        const defaultRecPhone = savedRecProfile?.contactPhone || "+91 98765 12345";

        let combined: any[] = [];
        try {
            const saved = localStorage.getItem("cpms_companies");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    combined = parsed.filter((c: any) => !["comp_amazon", "comp_zoho", "comp_jac", "comp_cognizant"].includes(c.id));
                }
            }
        } catch (e) { }

        if (combined.length > 0) {
            try {
                localStorage.removeItem("cpms_companies_cleared");
            } catch (e) { }
        }

        let deletedIds: string[] = [];
        try {
            const delSaved = localStorage.getItem("cpms_deleted_company_ids");
            if (delSaved) deletedIds = JSON.parse(delSaved);
        } catch (e) { }

        combined = combined.filter(c => !deletedIds.includes(String(c.id)) && !deletedIds.includes(String(c._id)));

        // Fetch drives from MongoDB API
        try {
            const res = await fetch(`${API_BASE_URL}/api/company/drives`);
            if (res.ok) {
                const remoteDrives = await res.json();
                if (Array.isArray(remoteDrives) && remoteDrives.length > 0) {
                    remoteDrives.forEach((rd: any) => {
                        const rId = String(rd._id || rd.id);
                        if (["comp_amazon", "comp_zoho", "comp_jac", "comp_cognizant"].includes(rId) || deletedIds.includes(rId)) return;
                        const rdComp = rd.company || rd.companyName || "Amazon Development Center";
                        const rdRole = rd.jobTitle || rd.role || rd.jobRole || "Software Developer";
                        const exists = combined.some(c =>
                            (c.id && (String(c.id) === rId || String(c._id) === rId)) ||
                            ((c.companyName || "").toLowerCase().trim() === rdComp.toLowerCase().trim() &&
                                (c.jobRole || "").toLowerCase().trim() === rdRole.toLowerCase().trim())
                        );
                        if (!exists) {
                            combined.push({
                                id: rId,
                                companyName: rdComp,
                                recruiterName: (rd.recruiterName && rd.recruiterName !== rdComp) ? rd.recruiterName : (rd.createdBy && rd.createdBy !== rdComp ? rd.createdBy : defaultRecName),
                                recruiterEmail: (rd.recruiterEmail && rd.recruiterEmail !== "recruiter@company.com") ? rd.recruiterEmail : defaultRecEmail,
                                recruiterPhone: (rd.recruiterPhone && rd.recruiterPhone !== "+91 98765 43210") ? rd.recruiterPhone : defaultRecPhone,
                                jobRole: rdRole,
                                salaryPackage: rd.packageCtc || rd.ctc || "₹18.0 LPA",
                                driveDate: rd.driveDate || rd.deadline || "28 Aug 2026",
                                applications: rd.appliedStudents ? rd.appliedStudents.length : 0,
                                shortlisted: rd.shortlistedStudents ? rd.shortlistedStudents.length : 0,
                                registrationStatus: rd.status || "Pending Officer Approval",
                                status: rd.status || "Pending Officer Approval",
                                logoUrl: rd.logo || "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
                                industry: "Technology",
                                jobType: rd.jobType || "Full-Time",
                                rounds: rd.rounds || rd.roundsWorkflow,
                                selectionProcess: rd.selectionProcess,
                                eligibility: rd.eligibility || {
                                    departments: Array.isArray(rd.eligibleBranches) ? rd.eligibleBranches.join(", ") : (rd.eligibleBranches || "CSE, IT"),
                                    minCgpa: rd.minCgpa !== undefined ? String(rd.minCgpa) : "7.0",
                                    tenthCutoff: rd.minTenth ? `${rd.minTenth}%+` : "65%+",
                                    twelfthCutoff: rd.minTwelfth ? `${rd.minTwelfth}%+` : "65%+",
                                    maxBacklogs: rd.maxBacklogs !== undefined ? String(rd.maxBacklogs) : "0",
                                    gradYear: rd.gradYear ? String(rd.gradYear) : "2026"
                                }
                            });
                        }
                    });
                }
            }
        } catch (e) { }

        // Fetch drives from localStorage cpms_drives
        try {
            const savedDrives = localStorage.getItem("cpms_drives");
            if (savedDrives) {
                const parsedDrives = JSON.parse(savedDrives);
                if (Array.isArray(parsedDrives) && parsedDrives.length > 0) {
                    parsedDrives.forEach((pd: any) => {
                        const pId = String(pd.id || pd._id);
                        if (["comp_amazon", "comp_zoho", "comp_jac", "comp_cognizant"].includes(pId) || deletedIds.includes(pId)) return;
                        const pdComp = pd.companyName || pd.company || "Amazon Development Center";
                        const pdRole = pd.jobRole || pd.jobTitle || pd.role || "Software Developer";
                        const existingIndex = combined.findIndex(c =>
                            (c.id && (String(c.id) === pId || String(c._id) === pId)) ||
                            ((c.companyName || "").toLowerCase().trim() === pdComp.toLowerCase().trim() &&
                                (c.jobRole || "").toLowerCase().trim() === pdRole.toLowerCase().trim())
                        );
                        const newDriveObj = {
                            id: pId,
                            companyName: pdComp,
                            recruiterName: (pd.recruiterName && pd.recruiterName !== pdComp) ? pd.recruiterName : (pd.createdBy && pd.createdBy !== pdComp ? pd.createdBy : defaultRecName),
                            recruiterEmail: (pd.recruiterEmail && pd.recruiterEmail !== "recruiter@company.com") ? pd.recruiterEmail : defaultRecEmail,
                            recruiterPhone: (pd.recruiterPhone && pd.recruiterPhone !== "+91 98765 43210") ? pd.recruiterPhone : defaultRecPhone,
                            jobRole: pdRole,
                            salaryPackage: pd.salaryPackage || pd.packageCtc || pd.ctc || "₹18.0 LPA",
                            driveDate: pd.driveDate || pd.deadline || "28 Aug 2026",
                            applications: pd.applications !== undefined ? pd.applications : (pd.appliedCount || 0),
                            shortlisted: pd.shortlisted !== undefined ? pd.shortlisted : 0,
                            registrationStatus: pd.status || pd.registrationStatus || "Pending Officer Approval",
                            status: pd.status || pd.registrationStatus || "Pending Officer Approval",
                            logoUrl: pd.logoUrl || pd.logo || "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
                            industry: "Technology",
                            jobType: pd.jobType || "Full-Time",
                            rounds: pd.rounds || pd.roundsWorkflow,
                            selectionProcess: pd.selectionProcess,
                            eligibility: pd.eligibility || {
                                departments: Array.isArray(pd.eligibleBranches) ? pd.eligibleBranches.join(", ") : (pd.eligibleBranches || "CSE, IT"),
                                minCgpa: pd.minCgpa !== undefined ? String(pd.minCgpa) : "7.0",
                                tenthCutoff: pd.minTenth ? `${pd.minTenth}%+` : "65%+",
                                twelfthCutoff: pd.minTwelfth ? `${pd.minTwelfth}%+` : "65%+",
                                maxBacklogs: pd.maxBacklogs !== undefined ? String(pd.maxBacklogs) : "0",
                                gradYear: pd.gradYear ? String(pd.gradYear) : "2026"
                            }
                        };

                        if (existingIndex >= 0) {
                            combined[existingIndex] = {
                                ...combined[existingIndex],
                                ...newDriveObj,
                                rounds: newDriveObj.rounds || combined[existingIndex].rounds,
                                selectionProcess: newDriveObj.selectionProcess || combined[existingIndex].selectionProcess,
                                registrationStatus: combined[existingIndex].registrationStatus || newDriveObj.registrationStatus,
                                status: combined[existingIndex].status || newDriveObj.status
                            };
                        } else {
                            combined.unshift(newDriveObj);
                        }
                    });
                }
            }
        } catch (e) { }

        combined = combined.map(item => {
            const overrideStatus = localStorage.getItem(`cpms_override_status_${item.id}`) ||
                localStorage.getItem(`cpms_company_status_${item.id}`);
            if (overrideStatus) {
                const reason = localStorage.getItem(`cpms_company_status_${item.id}_reason`) || item.rejectionReason;
                return {
                    ...item,
                    registrationStatus: overrideStatus,
                    status: overrideStatus,
                    rejectionReason: overrideStatus === "Rejected" ? (reason || "Revoked by Placement Officer") : item.rejectionReason
                };
            }
            return item;
        });

        setCompanies(combined);
    };

    useEffect(() => {
        reloadCompanies();

        const handleSync = () => reloadCompanies();
        window.addEventListener("storage", handleSync);
        window.addEventListener("cpms_companies_updated", handleSync);

        let channel: BroadcastChannel | null = null;
        try {
            channel = new BroadcastChannel("cpms_company_channel");
            channel.onmessage = () => reloadCompanies();
        } catch (e) { }

        return () => {
            window.removeEventListener("storage", handleSync);
            window.removeEventListener("cpms_companies_updated", handleSync);
            if (channel) channel.close();
        };
    }, []);

    const [searchQuery, setSearchQuery] = useState("");
    const [industryFilter, setIndustryFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [jobTypeFilter, setJobTypeFilter] = useState("All");
    const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState<any>({});
    const [showAddNewModal, setShowAddNewModal] = useState(false);
    const [newCompany, setNewCompany] = useState({
        companyName: "",
        industry: "IT & Technology",
        website: "",
        location: "",
        recruiterName: "",
        recruiterEmail: "",
        recruiterPhone: "",
        jobRole: "",
        salaryPackage: "",
        jobType: "Full-Time",
        requiredSkills: "",
        logoUrl: "",
        eligibility: {
            departments: "",
            minCgpa: "",
            tenthCutoff: "",
            twelfthCutoff: "",
            maxBacklogs: "",
            gradYear: ""
        },
        registrationStatus: "Pending Officer Approval"
    });

    const totalCount = companies.length;
    const approvedCount = companies.filter(c => (c.registrationStatus === "Approved" || c.status === "Approved")).length;
    const pendingCount = companies.filter(c => (c.registrationStatus !== "Approved" && c.status !== "Approved" && c.registrationStatus !== "Rejected" && c.status !== "Rejected")).length;
    const rejectedCount = companies.filter(c => (c.registrationStatus === "Rejected" || c.status === "Rejected")).length;

    const filteredCompanies = companies.filter(c => {
        const compName = (c.companyName || c.company || "").toLowerCase();
        const rEmail = (c.recruiterEmail || c.contactEmail || "").toLowerCase();
        const rName = (c.recruiterName || c.createdBy || c.contactPersonName || "").toLowerCase();
        const jRole = (c.jobRole || c.jobTitle || c.role || "").toLowerCase();
        const ind = (c.industry || "Technology").toLowerCase();
        const jType = (c.jobType || "Full-Time").toLowerCase();
        const regStatus = c.registrationStatus || c.status || "Pending Approval";

        const matchesQuery = !searchQuery.trim() ||
            compName.includes(searchQuery.toLowerCase()) ||
            rEmail.includes(searchQuery.toLowerCase()) ||
            rName.includes(searchQuery.toLowerCase()) ||
            jRole.includes(searchQuery.toLowerCase()) ||
            ind.includes(searchQuery.toLowerCase());

        const matchesIndustry = industryFilter === "All" || ind.includes(industryFilter.toLowerCase());
        const matchesStatus = statusFilter === "All" ||
            (statusFilter === "Approved" && (regStatus === "Approved" || regStatus === "Active")) ||
            (statusFilter === "Pending" && (regStatus === "Pending Approval" || regStatus === "Pending Officer Approval" || regStatus === "Pending")) ||
            (statusFilter === "Rejected" && regStatus === "Rejected");
        const matchesJobType = jobTypeFilter === "All" || jType.includes(jobTypeFilter.toLowerCase());

        return matchesQuery && matchesIndustry && matchesStatus && matchesJobType;
    });

    useEffect(() => {
        const isAnyModalOpen = selectedCompany !== null || showAddNewModal;
        if (isAnyModalOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setSelectedCompany(null);
                setIsEditing(false);
                setShowAddNewModal(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedCompany, showAddNewModal]);

    const handleApprove = async (id: string) => {
        setCompanies(prev => {
            const updated = prev.map(c => {
                if (c.id === id || c._id === id || String(c.id) === String(id)) {
                    return { ...c, registrationStatus: "Approved", status: "Approved" };
                }
                return c;
            });
            try {
                localStorage.setItem("cpms_companies", JSON.stringify(updated));
            } catch (e) { }
            return updated;
        });

        try {
            const savedDrives = localStorage.getItem("cpms_drives");
            if (savedDrives) {
                let driveArr = JSON.parse(savedDrives);
                if (Array.isArray(driveArr)) {
                    let changed = false;
                    driveArr = driveArr.map((d: any) => {
                        if (d.id === id || d._id === id || String(d.id) === String(id)) {
                            changed = true;
                            return { ...d, status: "Approved", registrationStatus: "Approved" };
                        }
                        return d;
                    });
                    if (changed) {
                        localStorage.setItem("cpms_drives", JSON.stringify(driveArr));
                    }
                }
            }
        } catch (e) { }

        try {
            localStorage.setItem(`cpms_override_status_${id}`, "Approved");
            localStorage.setItem(`cpms_company_status_${id}`, "Approved");
        } catch (e) { }

        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("cpms_companies_updated"));
        window.dispatchEvent(new CustomEvent("cpms_drives_updated"));

        if (selectedCompany && (selectedCompany.id === id || selectedCompany._id === id || String(selectedCompany.id) === String(id))) {
            setSelectedCompany((prev: any) => ({ ...prev, registrationStatus: "Approved", status: "Approved" }));
        }

        try {
            await fetch(`${API_BASE_URL}/api/company/profiles/${id}/approve`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ approvedBy: "Placement Officer" })
            });
        } catch (e) { }
    };

    const handleReject = async (id: string) => {
        const reason = window.prompt("Enter reason for revoking / rejecting this company credentials:", "Company credentials criteria not met") || "Company credentials criteria not met";
        setCompanies(prev => {
            const updated = prev.map(c => {
                if (c.id === id || c._id === id || String(c.id) === String(id)) {
                    return { ...c, registrationStatus: "Rejected", status: "Rejected", rejectionReason: reason };
                }
                return c;
            });
            try {
                localStorage.setItem("cpms_companies", JSON.stringify(updated));
            } catch (e) { }
            return updated;
        });

        try {
            const savedDrives = localStorage.getItem("cpms_drives");
            if (savedDrives) {
                let driveArr = JSON.parse(savedDrives);
                if (Array.isArray(driveArr)) {
                    let changed = false;
                    driveArr = driveArr.map((d: any) => {
                        if (d.id === id || d._id === id || String(d.id) === String(id)) {
                            changed = true;
                            return { ...d, status: "Rejected", registrationStatus: "Rejected", rejectionReason: reason };
                        }
                        return d;
                    });
                    if (changed) {
                        localStorage.setItem("cpms_drives", JSON.stringify(driveArr));
                    }
                }
            }
        } catch (e) { }

        try {
            localStorage.setItem(`cpms_override_status_${id}`, "Rejected");
            localStorage.setItem(`cpms_company_status_${id}`, "Rejected");
            localStorage.setItem(`cpms_company_status_${id}_reason`, reason);
        } catch (e) { }

        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("cpms_companies_updated"));
        window.dispatchEvent(new CustomEvent("cpms_drives_updated"));

        if (selectedCompany && (selectedCompany.id === id || selectedCompany._id === id || String(selectedCompany.id) === String(id))) {
            setSelectedCompany((prev: any) => ({ ...prev, registrationStatus: "Rejected", status: "Rejected", rejectionReason: reason }));
        }
        try {
            await fetch(`${API_BASE_URL}/api/company/profiles/${id}/reject`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rejectedBy: "Placement Officer", reason })
            });
        } catch (e) { }
    };

    const handleDeleteCompany = (id: string) => {
        if (!window.confirm("Are you sure you want to delete this company record?")) return;

        try {
            const delSaved = localStorage.getItem("cpms_deleted_company_ids");
            let deletedArr: string[] = delSaved ? JSON.parse(delSaved) : [];
            if (!deletedArr.includes(String(id))) {
                deletedArr.push(String(id));
                localStorage.setItem("cpms_deleted_company_ids", JSON.stringify(deletedArr));
            }
        } catch (e) { }

        setCompanies(prev => {
            const updated = prev.filter(c => c.id !== id && c._id !== id && String(c.id) !== String(id));
            try {
                localStorage.setItem("cpms_companies", JSON.stringify(updated));
            } catch (e) { }
            return updated;
        });

        try {
            const savedDrives = localStorage.getItem("cpms_drives");
            if (savedDrives) {
                let driveArr = JSON.parse(savedDrives);
                if (Array.isArray(driveArr)) {
                    const filtered = driveArr.filter((d: any) => d.id !== id && d._id !== id && String(d.id) !== String(id));
                    localStorage.setItem("cpms_drives", JSON.stringify(filtered));
                }
            }
        } catch (e) { }

        try {
            localStorage.removeItem(`cpms_override_status_${id}`);
            localStorage.removeItem(`cpms_company_status_${id}`);
            localStorage.removeItem(`cpms_company_status_${id}_reason`);
        } catch (e) { }

        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("cpms_companies_updated"));
        window.dispatchEvent(new CustomEvent("cpms_drives_updated"));

        if (selectedCompany && (selectedCompany.id === id || selectedCompany._id === id || String(selectedCompany.id) === String(id))) {
            setSelectedCompany(null);
        }
    };

    const handleRevokeApproval = (id: string) => {
        setCompanies(prev => {
            const updated = prev.map(c => (c.id === id || c._id === id || String(c.id) === String(id)) ? { ...c, registrationStatus: "Pending Officer Approval", status: "Pending Officer Approval" } : c);
            try {
                localStorage.setItem("cpms_companies", JSON.stringify(updated));
            } catch (e) { }
            return updated;
        });

        try {
            const savedDrives = localStorage.getItem("cpms_drives");
            if (savedDrives) {
                let driveArr = JSON.parse(savedDrives);
                if (Array.isArray(driveArr)) {
                    let changed = false;
                    driveArr = driveArr.map((d: any) => {
                        if (d.id === id || d._id === id || String(d.id) === String(id)) {
                            changed = true;
                            return { ...d, status: "Pending Officer Approval", registrationStatus: "Pending Officer Approval" };
                        }
                        return d;
                    });
                    if (changed) {
                        localStorage.setItem("cpms_drives", JSON.stringify(driveArr));
                    }
                }
            }
        } catch (e) { }

        try {
            localStorage.setItem(`cpms_override_status_${id}`, "Pending Officer Approval");
            localStorage.setItem(`cpms_company_status_${id}`, "Pending Officer Approval");
        } catch (e) { }

        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("cpms_companies_updated"));
        window.dispatchEvent(new CustomEvent("cpms_drives_updated"));

        if (selectedCompany && (selectedCompany.id === id || selectedCompany._id === id || String(selectedCompany.id) === String(id))) {
            setSelectedCompany((prev: any) => ({ ...prev, registrationStatus: "Pending Officer Approval", status: "Pending Officer Approval" }));
        }
    };

    const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditMode: boolean = false) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.result) {
                    if (isEditMode) {
                        setEditFormData((prev: any) => ({ ...prev, logoUrl: reader.result as string }));
                    } else {
                        setNewCompany((prev: any) => ({ ...prev, logoUrl: reader.result as string }));
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleStartEdit = (company: any) => {
        setEditFormData({
            ...company,
            requiredSkills: Array.isArray(company.requiredSkills) ? company.requiredSkills.join(", ") : company.requiredSkills,
            eligibility: company.eligibility || {
                departments: "CSE, IT",
                minCgpa: "7.0",
                tenthCutoff: "65%+",
                twelfthCutoff: "65%+",
                maxBacklogs: "0",
                gradYear: "2026"
            }
        });
        setIsEditing(true);
    };

    const handleSaveEdit = () => {
        const updatedSkills = typeof editFormData.requiredSkills === "string"
            ? editFormData.requiredSkills.split(",").map((s: string) => s.trim()).filter(Boolean)
            : editFormData.requiredSkills;

        setCompanies(prev => prev.map(c => c.id === editFormData.id ? { ...editFormData, requiredSkills: updatedSkills } : c));
        setSelectedCompany({ ...editFormData, requiredSkills: updatedSkills });
        setIsEditing(false);
    };

    const handleCreateCompany = (e: React.FormEvent) => {
        e.preventDefault();
        const createdObj = {
            id: `comp_${Date.now()}`,
            ...newCompany,
            registrationStatus: "Pending Officer Approval",
            requiredSkills: typeof newCompany.requiredSkills === "string"
                ? newCompany.requiredSkills.split(",").map(s => s.trim()).filter(Boolean)
                : newCompany.requiredSkills
        };
        try {
            localStorage.removeItem("cpms_companies_cleared");
        } catch (e) { }
        setCompanies(prev => [createdObj, ...prev]);
        setSearchQuery("");
        setStatusFilter("All");
        setIndustryFilter("All");
        setJobTypeFilter("All");
        setShowAddNewModal(false);
        setNewCompany({
            companyName: "",
            industry: "IT & Technology",
            website: "",
            location: "",
            recruiterName: "",
            recruiterEmail: "",
            recruiterPhone: "",
            jobRole: "",
            salaryPackage: "",
            jobType: "Full-Time",
            requiredSkills: "",
            logoUrl: "",
            eligibility: {
                departments: "",
                minCgpa: "",
                tenthCutoff: "",
                twelfthCutoff: "",
                maxBacklogs: "",
                gradYear: ""
            },
            registrationStatus: "Pending Officer Approval"
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map(word => word[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase();
    };

    const handleClearAllCompanies = async () => {
        if (!window.confirm("⚠️ Are you sure you want to delete ALL company records? This action cannot be undone.")) return;

        try {
            localStorage.setItem("cpms_companies_cleared", "true");
            localStorage.setItem("cpms_companies", "[]");
            localStorage.setItem("cpms_drives", "[]");
            window.dispatchEvent(new Event("storage"));
            window.dispatchEvent(new CustomEvent("cpms_companies_updated"));
        } catch (e) { }

        setCompanies([]);
        setSelectedCompany(null);

        try {
            await fetch(`${API_BASE_URL}/api/company/profiles/all`, {
                method: "DELETE"
            });
            await fetch(`${API_BASE_URL}/api/company/drives`, {
                method: "DELETE"
            });
        } catch (e) { }
        alert("🗑️ All company records have been cleared.");
    };

    return (
        <div style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "#0f172a", fontWeight: "800" }}>
                        Company Management
                    </h3>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>
                        Manage registered companies, recruiter contacts, job roles and approval status.
                    </span>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <button
                        onClick={handleClearAllCompanies}
                        title="Delete All Companies"
                        style={{
                            backgroundColor: "#fef2f2",
                            color: "#dc2626",
                            border: "1px solid #fca5a5",
                            padding: "9px 16px",
                            borderRadius: "8px",
                            fontWeight: "700",
                            fontSize: "13px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                        }}
                    >
                        <span>🗑️</span> Clear All Companies
                    </button>
                    <button
                        onClick={() => setShowAddNewModal(true)}
                        style={{
                            backgroundColor: "#2563eb",
                            color: "#ffffff",
                            border: "none",
                            padding: "10px 18px",
                            borderRadius: "8px",
                            fontWeight: "700",
                            fontSize: "13px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            boxShadow: "0 2px 4px rgba(37,99,235,0.2)"
                        }}
                    >
                        <span>+ Register Company</span>
                    </button>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
                <div style={{ backgroundColor: "#f8fafc", borderRadius: "14px", padding: "18px 22px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "13px", color: "#475569", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>🏢</span> Total Companies
                    </div>
                    <div style={{ fontSize: "28px", color: "#0f172a", fontWeight: "900", marginTop: "8px" }}>{totalCount}</div>
                </div>

                <div style={{ backgroundColor: "#fffbeb", borderRadius: "14px", padding: "18px 22px", border: "1px solid #fde68a", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "13px", color: "#92400e", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>⏳</span> Pending Approval
                    </div>
                    <div style={{ fontSize: "28px", color: "#d97706", fontWeight: "900", marginTop: "8px" }}>{pendingCount}</div>
                </div>

                <div style={{ backgroundColor: "#f0fdf4", borderRadius: "14px", padding: "18px 22px", border: "1px solid #bbf7d0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "13px", color: "#166534", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>✅</span> Approved
                    </div>
                    <div style={{ fontSize: "28px", color: "#16a34a", fontWeight: "900", marginTop: "8px" }}>{approvedCount}</div>
                </div>

                <div style={{ backgroundColor: "#fef2f2", borderRadius: "14px", padding: "18px 22px", border: "1px solid #fecaca", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "13px", color: "#991b1b", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>❌</span> Rejected
                    </div>
                    <div style={{ fontSize: "28px", color: "#dc2626", fontWeight: "900", marginTop: "8px" }}>{rejectedCount}</div>
                </div>
            </div>
            {/* Search & Filters Bar matching spec */}
            <div style={{ backgroundColor: "#ffffff", padding: "14px 18px", borderRadius: "14px", border: "1px solid #eaedf0", marginBottom: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "12px", alignItems: "center" }}>
                    {/* Clean Search Bar */}
                    <div style={{ position: "relative", width: "100%" }}>
                        <input
                            type="text"
                            placeholder="Search company, recruiter, or job role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "9px 12px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "13px",
                                outline: "none",
                                backgroundColor: "#ffffff",
                                transition: "all 0.15s ease",
                                color: "#0f172a"
                            }}
                        />
                    </div>

                    {/* Filter 1: Industry Dropdown */}
                    <select
                        value={industryFilter}
                        onChange={(e) => setIndustryFilter(e.target.value)}
                        style={{
                            padding: "9px 12px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13px",
                            backgroundColor: "#ffffff",
                            color: "#334155",
                            outline: "none",
                            cursor: "pointer",
                            fontWeight: "500"
                        }}
                    >
                        <option value="All">All Industries</option>
                        <option value="Technology">Technology / Cloud</option>
                        <option value="Enterprise Software">Enterprise Software & SaaS</option>
                        <option value="Software & Cloud">Software & Cloud Services</option>
                        <option value="E-Commerce">E-Commerce & Infrastructure</option>
                    </select>

                    {/* Filter 2: Registration Status Dropdown */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            padding: "9px 12px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13px",
                            backgroundColor: "#ffffff",
                            color: "#334155",
                            outline: "none",
                            cursor: "pointer",
                            fontWeight: "500"
                        }}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Approved">Approved ✓</option>
                        <option value="Pending">Pending Approval</option>
                        <option value="Rejected">Rejected</option>
                    </select>

                    {/* Filter 3: Job Type Dropdown */}
                    <select
                        value={jobTypeFilter}
                        onChange={(e) => setJobTypeFilter(e.target.value)}
                        style={{
                            padding: "9px 12px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                            fontSize: "13px",
                            backgroundColor: "#ffffff",
                            color: "#334155",
                            outline: "none",
                            cursor: "pointer",
                            fontWeight: "500"
                        }}
                    >
                        <option value="All">All Job Types</option>
                        <option value="Full-Time">Full-Time Campus Hire</option>
                        <option value="Internship">Internship + Full-Time</option>
                    </select>
                </div>
            </div>

            <div className="responsive-table-wrapper" style={{ overflowX: "auto", overflowY: "auto", maxHeight: "550px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <table style={{ width: "100%", minWidth: "650px", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", position: "sticky", top: 0, zIndex: 10 }}>
                            <th style={{ padding: "14px 16px" }}>Company</th>
                            <th style={{ padding: "14px 16px" }}>Job Role</th>
                            <th style={{ padding: "14px 16px" }}>Drive Date</th>
                            <th style={{ padding: "14px 16px", textAlign: "center" }}>Status</th>
                            <th style={{ padding: "14px 16px", textAlign: "center" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCompanies.map((c) => {
                            const isPending = c.registrationStatus === "Pending Officer Approval" || c.registrationStatus === "Pending Approval" || c.registrationStatus === "Pending" || c.status === "Pending Approval" || c.status === "Pending";
                            const isRejected = c.registrationStatus === "Rejected" || c.status === "Rejected";

                            let statusBg = "#eff6ff";
                            let statusColor = "#2563eb";
                            let statusBorder = "#bfdbfe";
                            let statusLabel = "🔵 Upcoming";

                            if (isPending) {
                                statusBg = "#fffbeb";
                                statusColor = "#d97706";
                                statusBorder = "#fde68a";
                                statusLabel = "🟠 Pending";
                            } else if (isRejected) {
                                statusBg = "#fef2f2";
                                statusColor = "#dc2626";
                                statusBorder = "#fecaca";
                                statusLabel = "🔴 Rejected";
                            } else if (c.registrationStatus === "Approved" || c.status === "Approved") {
                                statusBg = "#f0fdf4";
                                statusColor = "#16a34a";
                                statusBorder = "#bbf7d0";
                                statusLabel = "🟢 Approved";
                            }

                            return (
                                <tr key={c.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                    {/* Company Column */}
                                    <td style={{ padding: "14px 16px", color: "#0f172a" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <div style={{ width: "38px", height: "38px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#ffffff", padding: "3px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                                                {c.logoUrl ? (
                                                    <img src={c.logoUrl} alt={c.companyName} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                                                ) : (
                                                    <span style={{ fontSize: "12px", fontWeight: "800", color: "#2563eb" }}>{getInitials(c.companyName)}</span>
                                                )}
                                            </div>
                                            <div>
                                                <strong style={{ fontSize: "13.5px", color: "#0f172a", display: "block" }}>{c.companyName}</strong>
                                                <div style={{ fontSize: "11px", color: "#64748b" }}>Created by: {c.recruiterName || c.createdBy || c.companyName}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Job Role */}
                                    <td style={{ padding: "14px 16px", color: "#334155", fontWeight: "700", fontSize: "13px" }}>
                                        {c.jobRole || c.role || "Software Developer"}
                                    </td>

                                    {/* Drive Date */}
                                    <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "13px" }}>
                                        {c.driveDate || c.applicationDeadline || "28 Aug 2026"}
                                    </td>

                                    {/* Status */}
                                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                                        <span style={{
                                            padding: "4px 12px",
                                            borderRadius: "14px",
                                            fontSize: "11px",
                                            fontWeight: "800",
                                            backgroundColor: statusBg,
                                            color: statusColor,
                                            border: `1px solid ${statusBorder}`,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px"
                                        }}>
                                            {statusLabel}
                                        </span>
                                    </td>

                                    {/* Actions: View (👁️) | Delete (🗑️) | Quick Approve (✓) | Quick Reject (✕) */}
                                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                                        <div style={{ display: "inline-flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
                                            {/* 1. View Icon Button (Always Position 1) */}
                                            <button
                                                type="button"
                                                onClick={() => setSelectedCompany(c)}
                                                title="View Details"
                                                style={{
                                                    width: "36px",
                                                    height: "36px",
                                                    borderRadius: "10px",
                                                    backgroundColor: "#ffffff",
                                                    border: "1.5px solid #cbd5e1",
                                                    color: "#334155",
                                                    cursor: "pointer",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    transition: "all 0.15s ease",
                                                    flexShrink: 0,
                                                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)"
                                                }}
                                                onMouseEnter={(e: any) => {
                                                    e.currentTarget.style.backgroundColor = "#eff6ff";
                                                    e.currentTarget.style.borderColor = "#2563eb";
                                                    e.currentTarget.style.color = "#2563eb";
                                                }}
                                                onMouseLeave={(e: any) => {
                                                    e.currentTarget.style.backgroundColor = "#ffffff";
                                                    e.currentTarget.style.borderColor = "#cbd5e1";
                                                    e.currentTarget.style.color = "#334155";
                                                }}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            </button>

                                            {/* 2. Delete / Bin Icon Button (Always Position 2) */}
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteCompany(c.id)}
                                                title="Delete Record"
                                                style={{
                                                    width: "36px",
                                                    height: "36px",
                                                    borderRadius: "10px",
                                                    backgroundColor: "#fff5f5",
                                                    color: "#dc2626",
                                                    border: "1.5px solid #fecaca",
                                                    cursor: "pointer",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    transition: "all 0.15s ease",
                                                    flexShrink: 0,
                                                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)"
                                                }}
                                                onMouseEnter={(e: any) => {
                                                    e.currentTarget.style.backgroundColor = "#fee2e2";
                                                    e.currentTarget.style.borderColor = "#ef4444";
                                                }}
                                                onMouseLeave={(e: any) => {
                                                    e.currentTarget.style.backgroundColor = "#fff5f5";
                                                    e.currentTarget.style.borderColor = "#fecaca";
                                                }}
                                            >
                                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    <line x1="10" y1="11" x2="10" y2="17" />
                                                    <line x1="14" y1="11" x2="14" y2="17" />
                                                </svg>
                                            </button>

                                            {/* 3. Quick Approve & Reject Buttons (Shown only when Pending) */}
                                            {isPending && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApprove(c.id)}
                                                        title="Approve Company"
                                                        style={{
                                                            width: "36px",
                                                            height: "36px",
                                                            borderRadius: "10px",
                                                            backgroundColor: "#16a34a",
                                                            color: "#ffffff",
                                                            border: "none",
                                                            fontSize: "16px",
                                                            fontWeight: "800",
                                                            cursor: "pointer",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            boxShadow: "0 2px 4px rgba(22, 163, 74, 0.25)",
                                                            flexShrink: 0,
                                                            transition: "all 0.15s ease"
                                                        }}
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleReject(c.id)}
                                                        title="Reject Company"
                                                        style={{
                                                            width: "36px",
                                                            height: "36px",
                                                            borderRadius: "10px",
                                                            backgroundColor: "#dc2626",
                                                            color: "#ffffff",
                                                            border: "none",
                                                            fontSize: "16px",
                                                            fontWeight: "800",
                                                            cursor: "pointer",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            boxShadow: "0 2px 4px rgba(220, 38, 38, 0.25)",
                                                            flexShrink: 0,
                                                            transition: "all 0.15s ease"
                                                        }}
                                                    >
                                                        ✕
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* View / Edit Company Complete Details Popup Modal */}
            {selectedCompany && (
                <div
                    onClick={() => { setSelectedCompany(null); setIsEditing(false); }}
                    style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ backgroundColor: "#ffffff", borderRadius: "18px", maxWidth: "700px", width: "100%", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
                    >
                        {/* Modal Header */}
                        <div style={{ backgroundColor: "#0f172a", color: "#ffffff", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#ffffff", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <img src={selectedCompany.logoUrl} alt={selectedCompany.companyName} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#ffffff" }}>{selectedCompany.companyName}</h3>
                                    <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: "600" }}>{selectedCompany.industry}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => { setSelectedCompany(null); setIsEditing(false); }}
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
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                                }}
                                title="Close Modal (Esc)"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: "16px 22px", maxHeight: "88vh", overflowY: "auto" }}>
                            {isEditing ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: "#2563eb" }}>✏️ Edit Company Details</h4>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                        <div>
                                            <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569" }}>Company Name</label>
                                            <input type="text" value={editFormData.companyName} onChange={e => setEditFormData({ ...editFormData, companyName: e.target.value })} style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569" }}>Industry</label>
                                            <input type="text" value={editFormData.industry} onChange={e => setEditFormData({ ...editFormData, industry: e.target.value })} style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }} />
                                        </div>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                        <div>
                                            <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569" }}>Job Role</label>
                                            <input type="text" value={editFormData.jobRole} onChange={e => setEditFormData({ ...editFormData, jobRole: e.target.value })} style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569" }}>Salary Package</label>
                                            <input type="text" value={editFormData.salaryPackage} onChange={e => setEditFormData({ ...editFormData, salaryPackage: e.target.value })} style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }} />
                                        </div>
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                        <div>
                                            <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569" }}>Recruiter Name</label>
                                            <input type="text" value={editFormData.recruiterName} onChange={e => setEditFormData({ ...editFormData, recruiterName: e.target.value })} style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569" }}>Recruiter Email</label>
                                            <input type="email" value={editFormData.recruiterEmail} onChange={e => setEditFormData({ ...editFormData, recruiterEmail: e.target.value })} style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }} />
                                        </div>
                                    </div>
                                    <div style={{ backgroundColor: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                                        <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "4px" }}>
                                            Company Logo (URL or Upload Image)
                                        </label>
                                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                            <div style={{ width: "42px", height: "42px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                                                {editFormData.logoUrl ? (
                                                    <img src={editFormData.logoUrl} alt="Logo preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                                                ) : (
                                                    <span style={{ fontSize: "16px", color: "#94a3b8" }}>🏢</span>
                                                )}
                                            </div>
                                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                                                <input
                                                    type="text"
                                                    placeholder="Paste Image URL"
                                                    value={editFormData.logoUrl || ""}
                                                    onChange={e => setEditFormData({ ...editFormData, logoUrl: e.target.value })}
                                                    style={{ width: "100%", padding: "5px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "11px" }}
                                                />
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <label style={{ padding: "4px 10px", backgroundColor: "#2563eb", color: "#ffffff", borderRadius: "5px", fontSize: "10px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                                        📁 Choose Image File
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={e => handleLogoFileUpload(e, true)}
                                                            style={{ display: "none" }}
                                                        />
                                                    </label>
                                                    {editFormData.logoUrl && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditFormData({ ...editFormData, logoUrl: "" })}
                                                            style={{ background: "none", border: "none", color: "#dc2626", fontSize: "10px", fontWeight: "700", cursor: "pointer" }}
                                                        >
                                                            Remove Logo
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "8px" }}>
                                        <button onClick={() => setIsEditing(false)} style={{ padding: "6px 14px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Cancel</button>
                                        <button onClick={handleSaveEdit} style={{ padding: "6px 16px", backgroundColor: "#16a34a", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Save Company Changes</button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {/* Section 1: Company Information */}
                                    <div style={{ backgroundColor: "#f8fafc", padding: "12px 16px", borderRadius: "10px", border: "1px solid #eaedf0" }}>
                                        <h4 style={{ margin: "0 0 8px 0", fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>1. Company Information</h4>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", fontSize: "12px", color: "#334155" }}>
                                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><strong>Company Name:</strong> {selectedCompany.companyName}</div>
                                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><strong>Industry:</strong> {selectedCompany.industry || "Technology"}</div>
                                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><strong>Website:</strong> <a href={selectedCompany.website ? (selectedCompany.website.startsWith("http") ? selectedCompany.website : `https://${selectedCompany.website}`) : "https://amazon.com"} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontWeight: "600" }}>{selectedCompany.website || "https://amazon.com"}</a></div>
                                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><strong>Location:</strong> {selectedCompany.location || "Bangalore, India"}</div>
                                        </div>
                                    </div>

                                    {/* Section 2: Recruiter Contact Details */}
                                    <div style={{ backgroundColor: "#f8fafc", padding: "12px 16px", borderRadius: "10px", border: "1px solid #eaedf0" }}>
                                        <h4 style={{ margin: "0 0 8px 0", fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>2. Recruiter Contact Details</h4>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", fontSize: "12px", color: "#334155" }}>
                                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><strong>Recruiter Name:</strong> {(!selectedCompany.recruiterName || selectedCompany.recruiterName === selectedCompany.companyName) ? (selectedCompany.createdBy || "Arya (Placement Lead)") : selectedCompany.recruiterName}</div>
                                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><strong>Recruiter Phone:</strong> {(!selectedCompany.recruiterPhone || selectedCompany.recruiterPhone === "+91 98765 43210") ? "+91 98765 12345" : selectedCompany.recruiterPhone}</div>
                                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", gridColumn: "span 2" }}><strong>Recruiter Email:</strong> {(!selectedCompany.recruiterEmail || selectedCompany.recruiterEmail === "recruiter@company.com") ? "arya@amazon.com" : selectedCompany.recruiterEmail}</div>
                                        </div>
                                    </div>

                                    {/* Section 3: Job Details & Package */}
                                    <div style={{ backgroundColor: "#f8fafc", padding: "12px 16px", borderRadius: "10px", border: "1px solid #eaedf0" }}>
                                        <h4 style={{ margin: "0 0 8px 0", fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>3. Job Details & Package</h4>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", fontSize: "12px", color: "#334155" }}>
                                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><strong>Job Role:</strong> {selectedCompany.jobRole}</div>
                                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><strong>Salary Package:</strong> <strong style={{ color: "#16a34a" }}>{selectedCompany.salaryPackage}</strong></div>
                                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><strong>Job Type:</strong> {selectedCompany.jobType || "Full-Time (FTE)"}</div>
                                            <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}><strong>Required Skills:</strong> {(Array.isArray(selectedCompany.requiredSkills) ? selectedCompany.requiredSkills.join(", ") : selectedCompany.requiredSkills) || "Java, Python, DSA"}</div>
                                        </div>
                                    </div>

                                    {/* Section 4: Student Eligibility Requirements */}
                                    <div style={{ backgroundColor: "#f8fafc", padding: "12px 16px", borderRadius: "10px", border: "1px solid #eaedf0" }}>
                                        <h4 style={{ margin: "0 0 8px 0", fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>4. Student Eligibility Requirements</h4>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 16px", fontSize: "12px", color: "#334155" }}>
                                            <div style={{ whiteSpace: "nowrap" }}><strong>Depts:</strong> {selectedCompany.eligibility?.departments || "CSE, IT, ECE"}</div>
                                            <div style={{ whiteSpace: "nowrap" }}><strong>Min CGPA:</strong> {selectedCompany.eligibility?.minCgpa || "7.0"}</div>
                                            <div style={{ whiteSpace: "nowrap" }}><strong>Graduation Year:</strong> {selectedCompany.eligibility?.gradYear || "2026"}</div>
                                            <div style={{ whiteSpace: "nowrap" }}><strong>10th Cutoff:</strong> {selectedCompany.eligibility?.tenthCutoff || "60%+"}</div>
                                            <div style={{ whiteSpace: "nowrap" }}><strong>12th Cutoff:</strong> {selectedCompany.eligibility?.twelfthCutoff || "60%+"}</div>
                                            <div style={{ whiteSpace: "nowrap" }}><strong>Max Backlogs:</strong> {selectedCompany.eligibility?.maxBacklogs || "0"}</div>
                                        </div>
                                    </div>

                                    {/* Section 5: Selection Rounds Workflow */}
                                    <div style={{ backgroundColor: "#f8fafc", padding: "10px 14px", borderRadius: "10px", border: "1px solid #eaedf0" }}>
                                        <h4 style={{ margin: "0 0 8px 0", fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                            🔄 5. Selection Rounds Workflow
                                        </h4>

                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                            {((selectedCompany.rounds && selectedCompany.rounds.length > 0)
                                                ? selectedCompany.rounds
                                                : (selectedCompany.roundsWorkflow && selectedCompany.roundsWorkflow.length > 0)
                                                    ? selectedCompany.roundsWorkflow
                                                    : [
                                                        { roundNumber: 1, roundName: "Round 1: Online Coding & Aptitude Assessment", mode: "Online", date: selectedCompany.driveDate || "05 Sep 2026", description: "Online coding test and quantitative aptitude" },
                                                        { roundNumber: 2, roundName: "Round 2: Technical Interview (DSA & Core)", mode: "Online", date: "07 Sep 2026", description: "Data structures, problem solving, system design" },
                                                        { roundNumber: 3, roundName: "Round 3: HR & Management Discussion", mode: "Online", date: "09 Sep 2026", description: "Behavioral assessment and culture fit" }
                                                    ]
                                            ).map((round: any, rIdx: number) => (
                                                <div key={rIdx} style={{ backgroundColor: "#ffffff", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#2563eb", backgroundColor: "#dbeafe", padding: "2px 8px", borderRadius: "10px" }}>
                                                            Round {round.roundNumber || rIdx + 1}
                                                        </span>
                                                        <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "#475569" }}>
                                                            <span><strong>Mode:</strong> {round.mode || "Online"}</span>
                                                            {(round.date || selectedCompany.driveDate) && (
                                                                <span><strong>Date:</strong> {round.date || selectedCompany.driveDate}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#0f172a" }}>
                                                        {round.roundName || round.name || `Round ${rIdx + 1}`}
                                                    </div>
                                                    {round.description && (
                                                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px", lineHeight: "1.3" }}>
                                                            {round.description}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Bottom Footer Actions */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid #e2e8f0" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Status:</span>
                                            <span style={{ padding: "3px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "800", backgroundColor: selectedCompany.registrationStatus === "Approved" ? "#dcfce7" : selectedCompany.registrationStatus === "Rejected" ? "#fee2e2" : "#fef3c7", color: selectedCompany.registrationStatus === "Approved" ? "#15803d" : selectedCompany.registrationStatus === "Rejected" ? "#dc2626" : "#b45309" }}>
                                                {selectedCompany.registrationStatus}
                                            </span>
                                            {selectedCompany.registrationStatus === "Approved" ? (
                                                <>
                                                    <button onClick={() => handleRevokeApproval(selectedCompany.id)} style={{ padding: "5px 12px", backgroundColor: "#d97706", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>Revoke Approval</button>
                                                    <button onClick={() => handleReject(selectedCompany.id)} style={{ padding: "5px 12px", backgroundColor: "#dc2626", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>Reject</button>
                                                </>
                                            ) : selectedCompany.registrationStatus === "Rejected" ? (
                                                <>
                                                    <button onClick={() => handleApprove(selectedCompany.id)} style={{ padding: "5px 12px", backgroundColor: "#16a34a", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>Approve Company</button>
                                                    <button onClick={() => handleRevokeApproval(selectedCompany.id)} style={{ padding: "5px 12px", backgroundColor: "#d97706", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>Revoke Rejection</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleApprove(selectedCompany.id)} style={{ padding: "5px 12px", backgroundColor: "#16a34a", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>Approve Company</button>
                                                    <button onClick={() => handleReject(selectedCompany.id)} style={{ padding: "5px 12px", backgroundColor: "#dc2626", color: "#ffffff", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}>Reject</button>
                                                </>
                                            )}
                                        </div>
                                        <button onClick={() => handleStartEdit(selectedCompany)} style={{ padding: "6px 16px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
                                            Edit Details
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Register New Company */}
            {showAddNewModal && (
                <div
                    onClick={() => setShowAddNewModal(false)}
                    style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ backgroundColor: "#ffffff", borderRadius: "18px", maxWidth: "680px", width: "100%", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
                    >
                        <div style={{ backgroundColor: "#2563eb", color: "#ffffff", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#ffffff" }}>+ Register New Company</h3>
                            <button
                                onClick={() => setShowAddNewModal(false)}
                                style={{
                                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                                    border: "1px solid rgba(255, 255, 255, 0.35)",
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
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                                }}
                                title="Close Modal (Esc)"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleCreateCompany} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px", maxHeight: "80vh", overflowY: "auto" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Company Name *</label>
                                    <input type="text" required placeholder="e.g. Google India" value={newCompany.companyName} onChange={e => setNewCompany({ ...newCompany, companyName: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Industry *</label>
                                    <input type="text" required placeholder="e.g. IT & Technology" value={newCompany.industry} onChange={e => setNewCompany({ ...newCompany, industry: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Job Role *</label>
                                    <input type="text" required placeholder="e.g. Software Engineer" value={newCompany.jobRole} onChange={e => setNewCompany({ ...newCompany, jobRole: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Salary Package *</label>
                                    <input type="text" required placeholder="e.g. ₹12 LPA" value={newCompany.salaryPackage} onChange={e => setNewCompany({ ...newCompany, salaryPackage: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Recruiter Name *</label>
                                    <input type="text" required placeholder="Full Name" value={newCompany.recruiterName} onChange={e => setNewCompany({ ...newCompany, recruiterName: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Recruiter Email *</label>
                                    <input type="email" required placeholder="email@company.com" value={newCompany.recruiterEmail} onChange={e => setNewCompany({ ...newCompany, recruiterEmail: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Recruiter Phone</label>
                                    <input type="text" placeholder="+91 9876543210" value={newCompany.recruiterPhone} onChange={e => setNewCompany({ ...newCompany, recruiterPhone: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Website URL</label>
                                    <input type="text" placeholder="https://company.com" value={newCompany.website} onChange={e => setNewCompany({ ...newCompany, website: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Office Location</label>
                                    <input type="text" placeholder="e.g. Bangalore" value={newCompany.location} onChange={e => setNewCompany({ ...newCompany, location: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                                </div>
                            </div>

                            <div style={{ backgroundColor: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
                                <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569", display: "block", marginBottom: "6px" }}>
                                    Company Logo (Upload Image or Paste URL)
                                </label>
                                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                    <div style={{ width: "52px", height: "52px", borderRadius: "10px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                                        {newCompany.logoUrl ? (
                                            <img src={newCompany.logoUrl} alt="Logo preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                                        ) : (
                                            <span style={{ fontSize: "20px" }}>🏢</span>
                                        )}
                                    </div>
                                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                                        <input
                                            type="text"
                                            placeholder="Paste Logo Image URL (e.g. https://...)"
                                            value={newCompany.logoUrl}
                                            onChange={e => setNewCompany({ ...newCompany, logoUrl: e.target.value })}
                                            style={{ width: "100%", padding: "7px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                                        />
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <label style={{ padding: "5px 12px", backgroundColor: "#2563eb", color: "#ffffff", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                📁 Choose Logo Image File
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={e => handleLogoFileUpload(e, false)}
                                                    style={{ display: "none" }}
                                                />
                                            </label>
                                            {newCompany.logoUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => setNewCompany({ ...newCompany, logoUrl: "" })}
                                                    style={{ background: "none", border: "none", color: "#dc2626", fontSize: "11px", fontWeight: "700", cursor: "pointer" }}
                                                >
                                                    Remove Logo
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>Required Technical Skills (comma separated)</label>
                                <input type="text" placeholder="e.g. React, Python, Data Structures" value={newCompany.requiredSkills} onChange={e => setNewCompany({ ...newCompany, requiredSkills: e.target.value })} style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                            </div>

                            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "10px", marginTop: "4px" }}>
                                <span style={{ fontSize: "12px", fontWeight: "800", color: "#0f172a" }}>Eligibility Criteria Setup</span>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginTop: "8px" }}>
                                    <div>
                                        <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Eligible Depts <span style={{ color: "#dc2626" }}>*</span></label>
                                        <input type="text" required placeholder="CSE, IT, ECE" value={newCompany.eligibility?.departments || ""} onChange={e => setNewCompany({ ...newCompany, eligibility: { ...newCompany.eligibility, departments: e.target.value } })} style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Min CGPA <span style={{ color: "#dc2626" }}>*</span></label>
                                        <input type="text" required placeholder="7.5" value={newCompany.eligibility?.minCgpa || ""} onChange={e => setNewCompany({ ...newCompany, eligibility: { ...newCompany.eligibility, minCgpa: e.target.value } })} style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Grad Year <span style={{ color: "#dc2626" }}>*</span></label>
                                        <input type="text" required placeholder="2026" value={newCompany.eligibility?.gradYear || ""} onChange={e => setNewCompany({ ...newCompany, eligibility: { ...newCompany.eligibility, gradYear: e.target.value } })} style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Min 10th % <span style={{ color: "#dc2626" }}>*</span></label>
                                        <input type="text" required placeholder="60%+" value={newCompany.eligibility?.tenthCutoff || ""} onChange={e => setNewCompany({ ...newCompany, eligibility: { ...newCompany.eligibility, tenthCutoff: e.target.value } })} style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Min 12th % <span style={{ color: "#dc2626" }}>*</span></label>
                                        <input type="text" required placeholder="60%+" value={newCompany.eligibility?.twelfthCutoff || ""} onChange={e => setNewCompany({ ...newCompany, eligibility: { ...newCompany.eligibility, twelfthCutoff: e.target.value } })} style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Max Backlogs <span style={{ color: "#dc2626" }}>*</span></label>
                                        <input type="text" required placeholder="0" value={newCompany.eligibility?.maxBacklogs || ""} onChange={e => setNewCompany({ ...newCompany, eligibility: { ...newCompany.eligibility, maxBacklogs: e.target.value } })} style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "12px" }}>
                                <button type="button" onClick={() => setShowAddNewModal(false)} style={{ padding: "8px 16px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Cancel</button>
                                <button type="submit" style={{ padding: "8px 20px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Save & Onboard Company</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyManagement;
