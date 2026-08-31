import React, { useState, useEffect } from "react";

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

        // Fetch drives from MongoDB API
        try {
            const res = await fetch("http://localhost:5001/api/company/drives");
            if (res.ok) {
                const remoteDrives = await res.json();
                if (Array.isArray(remoteDrives) && remoteDrives.length > 0) {
                    remoteDrives.forEach((rd: any) => {
                        if (["comp_amazon", "comp_zoho", "comp_jac", "comp_cognizant"].includes(rd._id || rd.id)) return;
                        const rdComp = rd.company || rd.companyName || "Amazon Development Center";
                        const rdRole = rd.jobTitle || rd.role || rd.jobRole || "Software Developer";
                        const exists = combined.some(c => 
                            (c.companyName || "").toLowerCase().trim() === rdComp.toLowerCase().trim() && 
                            (c.jobRole || "").toLowerCase().trim() === rdRole.toLowerCase().trim()
                        );
                        if (!exists) {
                            combined.push({
                                id: rd._id || rd.id || `comp_${Date.now()}_${Math.random()}`,
                                companyName: rdComp,
                                recruiterName: rd.createdBy || rd.recruiterName || rdComp,
                                recruiterEmail: rd.recruiterEmail || "recruiter@company.com",
                                recruiterPhone: "+91 98765 43210",
                                jobRole: rdRole,
                                salaryPackage: rd.packageCtc || rd.ctc || "₹18.0 LPA",
                                driveDate: rd.driveDate || rd.deadline || "28 Aug 2026",
                                applications: rd.appliedStudents ? rd.appliedStudents.length : 0,
                                shortlisted: rd.shortlistedStudents ? rd.shortlistedStudents.length : 0,
                                registrationStatus: rd.status || "Pending Officer Approval",
                                status: rd.status || "Pending Officer Approval",
                                logoUrl: rd.logo || "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
                                industry: "Technology",
                                jobType: rd.jobType || "Full-Time"
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
                        if (["comp_amazon", "comp_zoho", "comp_jac", "comp_cognizant"].includes(pd.id || pd._id)) return;
                        const pdComp = pd.companyName || pd.company || "Amazon Development Center";
                        const pdRole = pd.jobRole || pd.jobTitle || pd.role || "Software Developer";
                        const existingIndex = combined.findIndex(c => 
                            (c.companyName || "").toLowerCase().trim() === pdComp.toLowerCase().trim() && 
                            (c.jobRole || "").toLowerCase().trim() === pdRole.toLowerCase().trim()
                        );
                        const newDriveObj = {
                            id: pd.id || pd._id || `comp_${Date.now()}_${Math.random()}`,
                            companyName: pdComp,
                            recruiterName: pd.createdBy || pd.recruiterName || pdComp,
                            recruiterEmail: pd.recruiterEmail || "recruiter@company.com",
                            recruiterPhone: "+91 98765 43210",
                            jobRole: pdRole,
                            salaryPackage: pd.salaryPackage || pd.packageCtc || pd.ctc || "₹18.0 LPA",
                            driveDate: pd.driveDate || pd.deadline || "28 Aug 2026",
                            applications: pd.applications !== undefined ? pd.applications : (pd.appliedCount || 0),
                            shortlisted: pd.shortlisted !== undefined ? pd.shortlisted : 0,
                            registrationStatus: pd.status || "Pending Officer Approval",
                            status: pd.status || "Pending Officer Approval",
                            logoUrl: pd.logoUrl || pd.logo || "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
                            industry: "Technology",
                            jobType: pd.jobType || "Full-Time"
                        };

                        if (existingIndex >= 0) {
                            const existingComp = combined[existingIndex];
                            const isApproved = existingComp.registrationStatus === "Approved" || existingComp.status === "Approved";
                            combined[existingIndex] = {
                                ...existingComp,
                                ...newDriveObj,
                                registrationStatus: isApproved ? "Approved" : newDriveObj.registrationStatus,
                                status: isApproved ? "Approved" : newDriveObj.status
                            };
                        } else {
                            combined.unshift(newDriveObj);
                        }
                    });
                }
            }
        } catch (e) { }

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
        let approvedCompName = "";
        setCompanies(prev => {
            const updated = prev.map(c => {
                if (c.id === id || c._id === id || String(c.id) === String(id)) {
                    approvedCompName = c.companyName || c.company || "";
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
                        const dComp = (d.companyName || d.company || "").toLowerCase().trim();
                        if (d.id === id || d._id === id || String(d.id) === String(id) || (approvedCompName && dComp === approvedCompName.toLowerCase().trim())) {
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
        } catch (e) {}

        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("cpms_companies_updated"));
        window.dispatchEvent(new CustomEvent("cpms_drives_updated"));

        if (selectedCompany && (selectedCompany.id === id || selectedCompany._id === id || String(selectedCompany.id) === String(id))) {
            setSelectedCompany((prev: any) => ({ ...prev, registrationStatus: "Approved", status: "Approved" }));
        }

        try {
            await fetch(`http://localhost:5001/api/company/profiles/${id}/approve`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ approvedBy: "Placement Officer" })
            });
        } catch (e) { }
    };

    const handleReject = async (id: string) => {
        const reason = window.prompt("Enter reason for rejecting this placement drive:", "Criteria not met") || "Criteria not met";
        setCompanies(prev => {
            const updated = prev.map(c => c.id === id ? { ...c, registrationStatus: "Rejected", status: "Rejected", rejectionReason: reason } : c);
            try {
                localStorage.setItem("cpms_companies", JSON.stringify(updated));
            } catch (e) { }
            return updated;
        });

        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("cpms_companies_updated"));

        if (selectedCompany && selectedCompany.id === id) {
            setSelectedCompany((prev: any) => ({ ...prev, registrationStatus: "Rejected", status: "Rejected", rejectionReason: reason }));
        }

        try {
            await fetch(`http://localhost:5001/api/company/profiles/${id}/reject`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rejectedBy: "Placement Officer", reason })
            });
        } catch (e) { }
    };

    const handleDeleteCompany = (id: string) => {
        if (!window.confirm("Are you sure you want to delete this company record?")) return;
        setCompanies(prev => {
            const updated = prev.filter(c => c.id !== id);
            try {
                localStorage.setItem("cpms_companies", JSON.stringify(updated));
                window.dispatchEvent(new Event("storage"));
                window.dispatchEvent(new CustomEvent("cpms_companies_updated"));
            } catch (e) { }
            return updated;
        });
        if (selectedCompany && selectedCompany.id === id) {
            setSelectedCompany(null);
        }
    };

    const handleRevokeApproval = (id: string) => {
        setCompanies(prev => prev.map(c => c.id === id ? { ...c, registrationStatus: "Pending Officer Approval" } : c));
        if (selectedCompany && selectedCompany.id === id) {
            setSelectedCompany((prev: any) => ({ ...prev, registrationStatus: "Pending Officer Approval" }));
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
            await fetch("http://localhost:5001/api/company/profiles/all", {
                method: "DELETE"
            });
            await fetch("http://localhost:5001/api/company/drives", {
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
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
                        🏢 Total Companies
                    </div>
                    <div style={{ fontSize: "28px", color: "#0f172a", fontWeight: "900", marginTop: "8px" }}>{totalCount}</div>
                </div>

                <div style={{ backgroundColor: "#fffbeb", borderRadius: "14px", padding: "18px 22px", border: "1px solid #fde68a", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "13px", color: "#92400e", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
                        ⏳ Pending Approval
                    </div>
                    <div style={{ fontSize: "28px", color: "#d97706", fontWeight: "900", marginTop: "8px" }}>{pendingCount}</div>
                </div>

                <div style={{ backgroundColor: "#f0fdf4", borderRadius: "14px", padding: "18px 22px", border: "1px solid #bbf7d0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "13px", color: "#166534", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
                        ✅ Approved / Active
                    </div>
                    <div style={{ fontSize: "28px", color: "#16a34a", fontWeight: "900", marginTop: "8px" }}>{approvedCount}</div>
                </div>

                <div style={{ backgroundColor: "#fef2f2", borderRadius: "14px", padding: "18px 22px", border: "1px solid #fecaca", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                    <div style={{ fontSize: "13px", color: "#991b1b", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}>
                        ❌ Rejected
                    </div>
                    <div style={{ fontSize: "28px", color: "#dc2626", fontWeight: "900", marginTop: "8px" }}>{rejectedCount}</div>
                </div>
            </div>
            {/* Search & Filters Bar matching spec */}
            <div style={{ backgroundColor: "#ffffff", padding: "14px 18px", borderRadius: "14px", border: "1px solid #eaedf0", marginBottom: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "12px", alignItems: "center" }}>
                    {/* Search Bar with Search Icon */}
                    <div style={{ position: "relative", width: "100%" }}>
                        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: "#94a3b8" }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search company, recruiter, or job role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "9px 12px 9px 36px",
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

            <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
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

                                    {/* Actions: ✓ | ✕ | 👁️ | 🗑️ */}
                                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                                        <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
                                            {isPending && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(c.id)}
                                                        title="Approve Company"
                                                        style={{
                                                            width: "32px",
                                                            height: "32px",
                                                            borderRadius: "8px",
                                                            backgroundColor: "#16a34a",
                                                            color: "#ffffff",
                                                            border: "none",
                                                            fontSize: "15px",
                                                            fontWeight: "800",
                                                            cursor: "pointer",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            boxShadow: "0 2px 4px rgba(22,163,74,0.25)",
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(c.id)}
                                                        title="Reject Company"
                                                        style={{
                                                            width: "32px",
                                                            height: "32px",
                                                            borderRadius: "8px",
                                                            backgroundColor: "#dc2626",
                                                            color: "#ffffff",
                                                            border: "none",
                                                            fontSize: "15px",
                                                            fontWeight: "800",
                                                            cursor: "pointer",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            boxShadow: "0 2px 4px rgba(220,38,38,0.25)",
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        ✕
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => setSelectedCompany(c)}
                                                title="View Details"
                                                style={{
                                                    width: "32px",
                                                    height: "32px",
                                                    borderRadius: "8px",
                                                    backgroundColor: "#f1f5f9",
                                                    color: "#64748b",
                                                    border: "1px solid #cbd5e1",
                                                    cursor: "pointer",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    flexShrink: 0
                                                }}
                                            >
                                                👁️
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCompany(c.id)}
                                                title="Delete Record"
                                                style={{
                                                    width: "32px",
                                                    height: "32px",
                                                    borderRadius: "8px",
                                                    backgroundColor: "#fef2f2",
                                                    color: "#dc2626",
                                                    border: "1px solid #fecaca",
                                                    cursor: "pointer",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    flexShrink: 0
                                                }}
                                            >
                                                🗑️
                                            </button>
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
                        style={{ backgroundColor: "#ffffff", borderRadius: "18px", maxWidth: "600px", width: "100%", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}
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
                                    <div style={{ backgroundColor: "#f8fafc", padding: "10px 14px", borderRadius: "10px", border: "1px solid #eaedf0" }}>
                                        <h4 style={{ margin: "0 0 6px 0", fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>1. Company Information</h4>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "12px", color: "#334155" }}>
                                            <div><strong>Company Name:</strong> {selectedCompany.companyName}</div>
                                            <div><strong>Industry:</strong> {selectedCompany.industry}</div>
                                            <div><strong>Website:</strong> <a href={selectedCompany.website} target="_blank" rel="noreferrer" style={{ color: "#2563eb", fontWeight: "600" }}>{selectedCompany.website}</a></div>
                                            <div><strong>Location:</strong> {selectedCompany.location}</div>
                                        </div>
                                    </div>

                                    {/* Section 2: Recruiter Contact Details */}
                                    <div style={{ backgroundColor: "#f8fafc", padding: "10px 14px", borderRadius: "10px", border: "1px solid #eaedf0" }}>
                                        <h4 style={{ margin: "0 0 6px 0", fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>2. Recruiter Contact Details</h4>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", fontSize: "12px", color: "#334155" }}>
                                            <div><strong>Recruiter Name:</strong> {selectedCompany.recruiterName}</div>
                                            <div><strong>Recruiter Email:</strong> {selectedCompany.recruiterEmail}</div>
                                            <div><strong>Recruiter Phone:</strong> {selectedCompany.recruiterPhone}</div>
                                        </div>
                                    </div>

                                    {/* Section 3: Job Details & Package */}
                                    <div style={{ backgroundColor: "#f8fafc", padding: "10px 14px", borderRadius: "10px", border: "1px solid #eaedf0" }}>
                                        <h4 style={{ margin: "0 0 6px 0", fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>3. Job Details & Package</h4>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "12px", color: "#334155" }}>
                                            <div><strong>Job Role:</strong> {selectedCompany.jobRole}</div>
                                            <div><strong>Salary Package:</strong> <strong style={{ color: "#16a34a" }}>{selectedCompany.salaryPackage}</strong></div>
                                            <div><strong>Job Type:</strong> {selectedCompany.jobType}</div>
                                            <div><strong>Required Skills:</strong> {Array.isArray(selectedCompany.requiredSkills) ? selectedCompany.requiredSkills.join(", ") : selectedCompany.requiredSkills}</div>
                                        </div>
                                    </div>

                                    {/* Section 4: Student Eligibility Requirements */}
                                    <div style={{ backgroundColor: "#f8fafc", padding: "10px 14px", borderRadius: "10px", border: "1px solid #eaedf0" }}>
                                        <h4 style={{ margin: "0 0 6px 0", fontSize: "11px", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>4. Student Eligibility Requirements</h4>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", fontSize: "12px", color: "#334155" }}>
                                            <div><strong>Depts:</strong> {selectedCompany.eligibility?.departments || "CSE, IT"}</div>
                                            <div><strong>Min CGPA:</strong> {selectedCompany.eligibility?.minCgpa || "7.0"}</div>
                                            <div><strong>Graduation Year:</strong> {selectedCompany.eligibility?.gradYear || "2026"}</div>
                                            <div><strong>10th Cutoff:</strong> {selectedCompany.eligibility?.tenthCutoff || "65%+"}</div>
                                            <div><strong>12th Cutoff:</strong> {selectedCompany.eligibility?.twelfthCutoff || "65%+"}</div>
                                            <div><strong>Max Backlogs:</strong> {selectedCompany.eligibility?.maxBacklogs || "0"}</div>
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
                                        <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Eligible Depts</label>
                                        <input type="text" placeholder="CSE, IT, ECE" value={newCompany.eligibility?.departments || ""} onChange={e => setNewCompany({ ...newCompany, eligibility: { ...newCompany.eligibility, departments: e.target.value } })} style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Min CGPA</label>
                                        <input type="text" placeholder="7.5" value={newCompany.eligibility?.minCgpa || ""} onChange={e => setNewCompany({ ...newCompany, eligibility: { ...newCompany.eligibility, minCgpa: e.target.value } })} style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Grad Year</label>
                                        <input type="text" placeholder="2026" value={newCompany.eligibility?.gradYear || ""} onChange={e => setNewCompany({ ...newCompany, eligibility: { ...newCompany.eligibility, gradYear: e.target.value } })} style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Min 10th %</label>
                                        <input type="text" placeholder="60%+" value={newCompany.eligibility?.tenthCutoff || ""} onChange={e => setNewCompany({ ...newCompany, eligibility: { ...newCompany.eligibility, tenthCutoff: e.target.value } })} style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Min 12th %</label>
                                        <input type="text" placeholder="60%+" value={newCompany.eligibility?.twelfthCutoff || ""} onChange={e => setNewCompany({ ...newCompany, eligibility: { ...newCompany.eligibility, twelfthCutoff: e.target.value } })} style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>Max Backlogs</label>
                                        <input type="text" placeholder="0" value={newCompany.eligibility?.maxBacklogs || ""} onChange={e => setNewCompany({ ...newCompany, eligibility: { ...newCompany.eligibility, maxBacklogs: e.target.value } })} style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }} />

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
