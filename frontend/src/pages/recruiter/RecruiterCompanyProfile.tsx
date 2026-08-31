import React, { useState, useEffect } from "react";

export interface CompanyProfileFormState {
    companyName: string;
    industry: string;
    description: string;
    website: string;
    location: string;
    contactPersonName: string;
    designation: string;
    contactEmail: string;
    contactPhone: string;
    logoPreview: string;
}

export const RecruiterCompanyProfile: React.FC = () => {
    const defaultProfile: CompanyProfileFormState = {
        companyName: "Amazon Development Center",
        industry: "Cloud & Software Technology",
        description: "Amazon Development Center India engages in world-class software development for global retail, AWS cloud technologies, and high-performance distributed systems.",
        website: "https://amazon.jobs",
        location: "Bangalore, India",
        contactPersonName: "Arvind Kumar",
        designation: "Senior Technical Recruiter",
        contactEmail: "arvind.k@amazon.com",
        contactPhone: "+91 98765 43210",
        logoPreview: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
    };

    const [profile, setProfile] = useState<CompanyProfileFormState>(() => {
        try {
            const saved = localStorage.getItem("cpms_recruiter_company_profile");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.companyName) return { ...defaultProfile, ...parsed };
            }
        } catch (e) {}
        return defaultProfile;
    });

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Helper URL Validation
    const isValidUrl = (urlStr: string): boolean => {
        if (!urlStr) return false;
        try {
            const formatted = urlStr.startsWith("http://") || urlStr.startsWith("https://") ? urlStr : `https://${urlStr}`;
            new URL(formatted);
            return true;
        } catch (e) {
            return false;
        }
    };

    const getFormattedUrl = (urlStr: string): string => {
        if (!urlStr) return "#";
        return urlStr.startsWith("http://") || urlStr.startsWith("https://") ? urlStr : `https://${urlStr}`;
    };

    // Fetch Profile from MongoDB Backend on Mount
    const fetchProfileFromMongoDB = async () => {
        setIsLoading(true);
        setMessage(null);
        try {
            const res = await fetch("http://localhost:5001/api/company/profile");
            if (res.ok) {
                const data = await res.json();
                if (data.companyName) {
                    const loadedProfile: CompanyProfileFormState = {
                        companyName: data.companyName || profile.companyName,
                        industry: data.industry || profile.industry,
                        description: data.description || profile.description,
                        website: data.website || profile.website,
                        location: data.location || profile.location,
                        contactPersonName: data.contactPersonName || data.hrName || profile.contactPersonName,
                        designation: data.designation || profile.designation || "Senior Technical Recruiter",
                        contactEmail: data.contactEmail || data.companyEmail || profile.contactEmail,
                        contactPhone: data.contactPhone || data.contactNumber || profile.contactPhone,
                        logoPreview: data.logo || profile.logoPreview,
                    };
                    setProfile(loadedProfile);
                    localStorage.setItem("cpms_recruiter_company_profile", JSON.stringify(loadedProfile));
                }
            }
        } catch (e) {
            console.error("Error fetching company profile from MongoDB:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileFromMongoDB();
    }, []);

    const handleChange = (field: keyof CompanyProfileFormState, value: string) => {
        setProfile(prev => ({ ...prev, [field]: value }));
        setMessage(null);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const logoBase64 = reader.result as string;
                setProfile(prev => ({ ...prev, logoPreview: logoBase64 }));
                setMessage(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            // Save to localStorage immediately
            localStorage.setItem("cpms_recruiter_company_profile", JSON.stringify(profile));

            const payload = {
                companyName: profile.companyName,
                industry: profile.industry,
                description: profile.description,
                website: profile.website,
                location: profile.location,
                contactPersonName: profile.contactPersonName,
                designation: profile.designation,
                contactEmail: profile.contactEmail,
                contactPhone: profile.contactPhone,
                logo: profile.logoPreview,
                status: "Pending Officer Approval",
                registrationStatus: "Pending Officer Approval",
                hrName: profile.contactPersonName,
                companyEmail: profile.contactEmail,
                contactNumber: profile.contactPhone,
            };

            // 1. Submit to MongoDB API
            try {
                await fetch("http://localhost:5001/api/company/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            } catch (apiErr) {
                console.warn("MongoDB registration sync warning:", apiErr);
            }

            // 2. Sync to cpms_companies in localStorage for instant reflection in Officer Dashboard
            try {
                let existingComps: any[] = [];
                const saved = localStorage.getItem("cpms_companies");
                if (saved) existingComps = JSON.parse(saved);

                const newCompObj = {
                    id: `comp_${Date.now()}`,
                    companyName: profile.companyName,
                    industry: profile.industry,
                    website: profile.website,
                    location: profile.location,
                    recruiterName: profile.contactPersonName,
                    designation: profile.designation,
                    recruiterEmail: profile.contactEmail,
                    recruiterPhone: profile.contactPhone,
                    jobRole: "Software Developer",
                    salaryPackage: "₹18.5 LPA",
                    jobType: "Full-Time",
                    requiredSkills: ["Software Engineering"],
                    eligibility: {
                        departments: "CSE, IT, ECE",
                        minCgpa: "7.5",
                        maxBacklogs: "0",
                        gradYear: "2026"
                    },
                    registrationStatus: "Approved",
                    status: "Approved",
                    logoUrl: profile.logoPreview
                };

                const existingIndex = existingComps.findIndex((c: any) => 
                    (c.companyName || "").toLowerCase().trim() === (profile.companyName || "").toLowerCase().trim()
                );

                if (existingIndex >= 0) {
                    existingComps[existingIndex] = {
                        ...existingComps[existingIndex],
                        ...newCompObj
                    };
                } else {
                    existingComps.unshift(newCompObj);
                }

                localStorage.setItem("cpms_companies", JSON.stringify(existingComps));
                window.dispatchEvent(new Event("storage"));
                window.dispatchEvent(new CustomEvent("cpms_companies_updated"));
            } catch (localErr) {
                console.error("Local sync error:", localErr);
            }

            setMessage({
                type: "success",
                text: "✅ Profile details saved successfully. Synced with Placement Officer Dashboard."
            });
        } catch (err) {
            console.error("Error saving profile:", err);
            setMessage({ type: "error", text: "Error submitting company details. Please try again." });
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontFamily: "-apple-system, sans-serif" }}>
                Loading Recruiter Company Profile...
            </div>
        );
    }

    // Calculate Completion Percentage
    const requiredFields = [
        profile.companyName,
        profile.industry,
        profile.website,
        profile.location,
        profile.contactPersonName,
        profile.designation,
        profile.contactEmail,
        profile.contactPhone,
        profile.description
    ];
    const filledCount = requiredFields.filter(f => Boolean(f && f.trim())).length;
    const completionPercentage = Math.round((filledCount / requiredFields.length) * 100);

    return (
        <div style={{ maxWidth: "950px", margin: "0 auto", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}>
            <style>{`
                @media (max-width: 768px) {
                    .responsive-grid-2col {
                        grid-template-columns: 1fr !important;
                    }
                    .responsive-flex-wrap {
                        flex-wrap: wrap !important;
                    }
                    .responsive-grid-2col > div {
                        grid-column: span 1 !important;
                    }
                }
            `}</style>

            {/* Outer Card Container */}
            <div style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                padding: "28px 32px",
                border: "1px solid #eaedf0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
            }}>

                {/* Header Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }} className="responsive-flex-wrap">
                    <div>
                        <h2 style={{ margin: "0 0 6px 0", fontSize: "20px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.3px" }}>
                            Recruiter Profile Setup
                        </h2>
                        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                            Manage your Company Information, Recruiter Contact Details, and Branding.
                        </p>
                    </div>

                    {/* Completion Meter */}
                    <div style={{
                        backgroundColor: "#f8fafc",
                        border: "1px solid #eaedf0",
                        borderRadius: "12px",
                        padding: "10px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginTop: "8px"
                    }}>
                        <div>
                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>PROFILE STRENGTH</div>
                            <div style={{ fontSize: "16px", fontWeight: "800", color: completionPercentage === 100 ? "#16a34a" : "#2563eb" }}>
                                {completionPercentage}% Complete
                            </div>
                        </div>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: `conic-gradient(${completionPercentage === 100 ? "#16a34a" : "#2563eb"} ${completionPercentage * 3.6}deg, #e2e8f0 0deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800", color: "#0f172a" }}>
                                {completionPercentage}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Success / Error Alert Banner */}
                {message && (
                    <div style={{
                        padding: "12px 18px",
                        borderRadius: "10px",
                        marginBottom: "24px",
                        fontSize: "13px",
                        fontWeight: "700",
                        backgroundColor: message.type === "success" ? "#f0fdf4" : "#fef2f2",
                        color: message.type === "success" ? "#16a34a" : "#dc2626",
                        border: message.type === "success" ? "1px solid #bbf7d0" : "1px solid #fecaca",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                    }}>
                        <span>{message.text}</span>
                        <button onClick={() => setMessage(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: "800" }}>✕</button>
                    </div>
                )}

                <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                    {/* SECTION 1: COMPANY DETAILS */}
                    <div style={{ backgroundColor: "#f8fafc", borderRadius: "14px", padding: "22px", border: "1px solid #f1f5f9" }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "8px" }}>
                            🏢 1. Company Details
                        </h3>

                        <div className="responsive-grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                                    COMPANY NAME *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={profile.companyName}
                                    onChange={(e) => handleChange("companyName", e.target.value)}
                                    placeholder="e.g. Amazon Development Center"
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none",
                                        boxSizing: "border-box",
                                        color: "#0f172a",
                                        backgroundColor: "#ffffff"
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                                    INDUSTRY / SECTOR *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={profile.industry}
                                    onChange={(e) => handleChange("industry", e.target.value)}
                                    placeholder="e.g. Cloud & Software Technology"
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none",
                                        boxSizing: "border-box",
                                        color: "#0f172a",
                                        backgroundColor: "#ffffff"
                                    }}
                                />
                            </div>

                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                    <label style={{ fontSize: "12px", fontWeight: "700", color: "#475569" }}>
                                        COMPANY WEBSITE *
                                    </label>
                                    {isValidUrl(profile.website) && (
                                        <a
                                            href={getFormattedUrl(profile.website)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ fontSize: "11px", fontWeight: "700", color: "#2563eb", textDecoration: "none" }}
                                        >
                                            🔗 Visit Website ↗
                                        </a>
                                    )}
                                </div>
                                <input
                                    type="url"
                                    required
                                    value={profile.website}
                                    onChange={(e) => handleChange("website", e.target.value)}
                                    placeholder="https://amazon.jobs"
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none",
                                        boxSizing: "border-box",
                                        color: "#0f172a",
                                        backgroundColor: "#ffffff"
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                                    OFFICE LOCATION / HEADQUARTERS *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={profile.location}
                                    onChange={(e) => handleChange("location", e.target.value)}
                                    placeholder="e.g. Bangalore, India"
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none",
                                        boxSizing: "border-box",
                                        color: "#0f172a",
                                        backgroundColor: "#ffffff"
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: RECRUITER / CONTACT DETAILS (WITH RECRUITER DESIGNATION) */}
                    <div style={{ backgroundColor: "#f8fafc", borderRadius: "14px", padding: "22px", border: "1px solid #f1f5f9" }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "8px" }}>
                            👤 2. Recruiter / Contact Details
                        </h3>

                        <div className="responsive-grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                                    CONTACT PERSON NAME *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={profile.contactPersonName}
                                    onChange={(e) => handleChange("contactPersonName", e.target.value)}
                                    placeholder="e.g. Arvind Kumar"
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none",
                                        boxSizing: "border-box",
                                        color: "#0f172a",
                                        backgroundColor: "#ffffff"
                                    }}
                                />
                            </div>

                            {/* RECRUITER DESIGNATION FIELD */}
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                                    DESIGNATION / TITLE *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={profile.designation}
                                    onChange={(e) => handleChange("designation", e.target.value)}
                                    placeholder="e.g. Senior Technical Recruiter"
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none",
                                        boxSizing: "border-box",
                                        color: "#0f172a",
                                        backgroundColor: "#ffffff"
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                                    OFFICIAL CONTACT EMAIL *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={profile.contactEmail}
                                    onChange={(e) => handleChange("contactEmail", e.target.value)}
                                    placeholder="arvind.k@amazon.com"
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none",
                                        boxSizing: "border-box",
                                        color: "#0f172a",
                                        backgroundColor: "#ffffff"
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                                    PHONE NUMBER *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={profile.contactPhone}
                                    onChange={(e) => handleChange("contactPhone", e.target.value)}
                                    placeholder="+91 98765 43210"
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none",
                                        boxSizing: "border-box",
                                        color: "#0f172a",
                                        backgroundColor: "#ffffff"
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: BRANDING & OVERVIEW */}
                    <div style={{ backgroundColor: "#f8fafc", borderRadius: "14px", padding: "22px", border: "1px solid #f1f5f9" }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "800", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "8px" }}>
                            🎨 3. Company Branding & Overview
                        </h3>

                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {/* Logo URL & Upload Option */}
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                                    COMPANY LOGO (URL OR FILE UPLOAD)
                                </label>
                                <div style={{ display: "flex", gap: "16px", alignItems: "center" }} className="responsive-flex-wrap">
                                    <div style={{
                                        width: "60px",
                                        height: "60px",
                                        borderRadius: "12px",
                                        border: "1px solid #cbd5e1",
                                        backgroundColor: "#ffffff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        overflow: "hidden",
                                        padding: "6px",
                                        flexShrink: 0
                                    }}>
                                        {profile.logoPreview ? (
                                            <img src={profile.logoPreview} alt="Company Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                                        ) : (
                                            <span style={{ fontSize: "20px" }}>🏢</span>
                                        )}
                                    </div>

                                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                                        <input
                                            type="text"
                                            value={profile.logoPreview}
                                            onChange={(e) => handleChange("logoPreview", e.target.value)}
                                            placeholder="Paste logo image URL..."
                                            style={{
                                                width: "100%",
                                                padding: "9px 12px",
                                                borderRadius: "8px",
                                                border: "1px solid #cbd5e1",
                                                fontSize: "12px",
                                                outline: "none",
                                                color: "#0f172a",
                                                backgroundColor: "#ffffff"
                                            }}
                                        />
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Or upload logo image:</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                style={{ fontSize: "12px", color: "#475569" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Company Description */}
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px" }}>
                                    COMPANY DESCRIPTION / ABOUT US *
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={profile.description}
                                    onChange={(e) => handleChange("description", e.target.value)}
                                    placeholder="Provide a brief overview of your company, tech stack, culture, and career opportunities..."
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "13px",
                                        outline: "none",
                                        boxSizing: "border-box",
                                        color: "#0f172a",
                                        backgroundColor: "#ffffff",
                                        fontFamily: "inherit"
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SUBMIT ACTION BUTTON */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", alignItems: "center" }}>
                        {isValidUrl(profile.website) && (
                            <a
                                href={getFormattedUrl(profile.website)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    padding: "10px 18px",
                                    backgroundColor: "#f8fafc",
                                    color: "#2563eb",
                                    border: "1px solid #bfdbfe",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    textDecoration: "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px"
                                }}
                            >
                                🔗 Visit Company Website ↗
                            </a>
                        )}

                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                padding: "12px 28px",
                                backgroundColor: saving ? "#94a3b8" : "#2563eb",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: "700",
                                cursor: saving ? "not-allowed" : "pointer",
                                transition: "all 0.15s ease",
                                boxShadow: "0 2px 4px rgba(37,99,235,0.2)"
                            }}
                        >
                            {saving ? "Saving Profile Details..." : "Save Profile Details"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecruiterCompanyProfile;
