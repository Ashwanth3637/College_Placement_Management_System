import React, { useState, useEffect } from "react";

export interface CompanyProfileFormState {
    companyName: string;
    industry: string;
    description: string;
    website: string;
    location: string;
    contactPersonName: string;
    contactEmail: string;
    contactPhone: string;
    logoPreview: string;
}

export const RecruiterCompanyProfile: React.FC = () => {
    const [profile, setProfile] = useState<CompanyProfileFormState>({
        companyName: "Amazon Development Center",
        industry: "Cloud & Software Technology",
        description: "Amazon Development Center India engages in world-class software development for global retail, AWS cloud technologies, and high-performance distributed systems.",
        website: "https://amazon.jobs",
        location: "Bangalore, India",
        contactPersonName: "Arvind Kumar",
        contactEmail: "arvind.k@amazon.com",
        contactPhone: "+91 98765 43210",
        logoPreview: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
    });

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Fetch Profile from MongoDB Backend on Mount
    const fetchProfileFromMongoDB = async () => {
        setIsLoading(true);
        setMessage(null);
        try {
            const res = await fetch("http://localhost:5001/api/company/profile");
            if (res.ok) {
                const data = await res.json();
                if (data.companyName) {
                    setProfile({
                        companyName: data.companyName || "Amazon Development Center",
                        industry: data.industry || "Cloud & Software Technology",
                        description: data.description || "",
                        website: data.website || "https://amazon.jobs",
                        location: data.location || "Bangalore, India",
                        contactPersonName: data.contactPersonName || data.hrName || "Arvind Kumar",
                        contactEmail: data.contactEmail || data.companyEmail || "arvind.k@amazon.com",
                        contactPhone: data.contactPhone || data.contactNumber || "+91 98765 43210",
                        logoPreview: data.logo || "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
                    });
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
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({ ...prev, logoPreview: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const payload = {
                companyName: profile.companyName,
                industry: profile.industry,
                description: profile.description,
                website: profile.website,
                location: profile.location,
                contactPersonName: profile.contactPersonName,
                contactEmail: profile.contactEmail,
                contactPhone: profile.contactPhone,
                logo: profile.logoPreview,
                status: "Pending Officer Approval",
                registrationStatus: "Pending Officer Approval",
                // Aliases
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

            // 2. Sync to cpms_companies in localStorage for instant fraction-of-a-second reflection in Officer Dashboard
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
                    recruiterEmail: profile.contactEmail,
                    recruiterPhone: profile.contactPhone,
                    jobRole: "Pending Role Specification",
                    salaryPackage: "TBD by Officer",
                    jobType: "Full-Time",
                    requiredSkills: ["Software Engineering"],
                    eligibility: {
                        departments: "CSE, IT, ECE",
                        minCgpa: "6.5",
                        tenthCutoff: "65%+",
                        twelfthCutoff: "65%+",
                        maxBacklogs: "1",
                        gradYear: "2026"
                    },
                    registrationStatus: "Pending Officer Approval",
                    status: "Pending Officer Approval",
                    logoUrl: profile.logoPreview
                };

                const existingIndex = existingComps.findIndex((c: any) => 
                    (c.companyName || "").toLowerCase().trim() === (profile.companyName || "").toLowerCase().trim()
                );

                if (existingIndex >= 0) {
                    existingComps[existingIndex] = {
                        ...existingComps[existingIndex],
                        ...newCompObj,
                        registrationStatus: existingComps[existingIndex].registrationStatus === "Approved" ? "Approved" : "Pending Officer Approval"
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
                text: "✓ Company profile submitted! Sent to Placement Officer Dashboard under Company Management (Pending Officer Approval)."
            });
        } catch (err) {
            console.error("Error saving profile to MongoDB:", err);
            setMessage({ type: "error", text: "Error submitting company details." });
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

            {/* Outer White Card Container (Exact Student Profile Style) */}
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
                            Complete your Company Information, Recruiter Contact, and Branding details.
                        </p>
                    </div>

                    <span style={{
                        backgroundColor: "#dcfee7",
                        color: "#15803d",
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "700",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                    }}>
                        Profile 100% ✓
                    </span>
                </div>

                {/* Success / Error Notification Alert (Matching Student Profile Style) */}
                {message && (
                    <div style={{
                        backgroundColor: message.type === "success" ? "#f0fdf4" : "#fef2f2",
                        color: message.type === "success" ? "#166534" : "#dc2626",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "600",
                        borderLeft: message.type === "success" ? "4px solid #22c55e" : "4px solid #ef4444",
                        marginBottom: "24px"
                    }}>
                        {message.text}
                    </div>
                )}

                {/* Main Profile Setup Form */}
                <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                    {/* Section 1: Company Details */}
                    <div style={{
                        backgroundColor: "#f8fafc",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        padding: "24px"
                    }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                            1. Company Details
                        </h3>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="responsive-grid-2col">
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={profile.companyName}
                                    onChange={e => handleChange("companyName", e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        backgroundColor: "#ffffff",
                                        fontSize: "14px",
                                        color: "#0f172a",
                                        boxSizing: "border-box",
                                        outline: "none"
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                                    Industry
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={profile.industry}
                                    onChange={e => handleChange("industry", e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        backgroundColor: "#ffffff",
                                        fontSize: "14px",
                                        color: "#0f172a",
                                        boxSizing: "border-box",
                                        outline: "none"
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                                    Company Website
                                </label>
                                <input
                                    type="url"
                                    value={profile.website}
                                    onChange={e => handleChange("website", e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        backgroundColor: "#ffffff",
                                        fontSize: "14px",
                                        color: "#0f172a",
                                        boxSizing: "border-box",
                                        outline: "none"
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                                    Company Location
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={profile.location}
                                    onChange={e => handleChange("location", e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        backgroundColor: "#ffffff",
                                        fontSize: "14px",
                                        color: "#0f172a",
                                        boxSizing: "border-box",
                                        outline: "none"
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Recruiter / Contact Details */}
                    <div style={{
                        backgroundColor: "#f8fafc",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        padding: "24px"
                    }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                            2. Recruiter / Contact Details
                        </h3>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="responsive-grid-2col">
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                                    Contact Person Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={profile.contactPersonName}
                                    onChange={e => handleChange("contactPersonName", e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        backgroundColor: "#ffffff",
                                        fontSize: "14px",
                                        color: "#0f172a",
                                        boxSizing: "border-box",
                                        outline: "none"
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                                    Contact Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={profile.contactEmail}
                                    onChange={e => handleChange("contactEmail", e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        backgroundColor: "#ffffff",
                                        fontSize: "14px",
                                        color: "#0f172a",
                                        boxSizing: "border-box",
                                        outline: "none"
                                    }}
                                />
                            </div>

                            <div style={{ gridColumn: "span 2" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={profile.contactPhone}
                                    onChange={e => handleChange("contactPhone", e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        backgroundColor: "#ffffff",
                                        fontSize: "14px",
                                        color: "#0f172a",
                                        boxSizing: "border-box",
                                        outline: "none"
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Company Branding & Overview */}
                    <div style={{
                        backgroundColor: "#f8fafc",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        padding: "24px"
                    }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
                            3. Company Branding & Overview
                        </h3>

                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                                    Company Logo (URL & Upload File Options)
                                </label>
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                                    {/* Logo Preview Box */}
                                    <div style={{
                                        width: "76px",
                                        height: "76px",
                                        borderRadius: "10px",
                                        border: "1px solid #cbd5e1",
                                        backgroundColor: "#ffffff",
                                        padding: "6px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                                    }}>
                                        {profile.logoPreview ? (
                                            <img
                                                src={profile.logoPreview}
                                                alt="Logo Preview"
                                                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>No Logo</span>
                                        )}
                                    </div>

                                    {/* Dual Options: URL Input + File Upload */}
                                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                                        {/* Option 1: URL Input */}
                                        <div>
                                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                                                Option 1: Paste Logo Image URL
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="https://example.com/logo.png"
                                                value={profile.logoPreview}
                                                onChange={e => handleChange("logoPreview", e.target.value)}
                                                style={{
                                                    width: "100%",
                                                    padding: "9px 12px",
                                                    borderRadius: "8px",
                                                    border: "1px solid #cbd5e1",
                                                    backgroundColor: "#ffffff",
                                                    fontSize: "13px",
                                                    color: "#0f172a",
                                                    boxSizing: "border-box",
                                                    outline: "none"
                                                }}
                                            />
                                        </div>

                                        {/* Option 2: Upload File Button */}
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                                                Option 2: Upload File
                                            </span>
                                            <label
                                                htmlFor="recruiter-logo-file-input"
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    padding: "7px 14px",
                                                    backgroundColor: "#ffffff",
                                                    color: "#2563eb",
                                                    border: "1px solid #bfdbfe",
                                                    borderRadius: "6px",
                                                    fontSize: "12px",
                                                    fontWeight: "600",
                                                    cursor: "pointer",
                                                    transition: "all 0.15s ease-in-out"
                                                }}
                                            >
                                                📁 Choose Logo File
                                            </label>
                                            <input
                                                id="recruiter-logo-file-input"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                style={{ display: "none" }}
                                            />
                                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                                                Supports PNG, JPG, SVG
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                                    Company Description
                                </label>
                                <textarea
                                    rows={4}
                                    value={profile.description}
                                    onChange={e => handleChange("description", e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        backgroundColor: "#ffffff",
                                        fontSize: "14px",
                                        color: "#0f172a",
                                        boxSizing: "border-box",
                                        fontFamily: "inherit",
                                        outline: "none"
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Form Action Row */}
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                padding: "12px 24px",
                                backgroundColor: "#2563eb",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: "700",
                                cursor: "pointer",
                                transition: "all 0.15s ease-in-out"
                            }}
                        >
                            {saving ? "Saving Profile..." : "Save Profile Details"}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default RecruiterCompanyProfile;
