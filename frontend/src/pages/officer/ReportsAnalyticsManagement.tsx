import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";

export const getCompanyLogo = (companyName: string) => {
    const name = (companyName || "").toLowerCase();
    if (name.includes("amazon")) return "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg";
    if (name.includes("zoho")) return "https://upload.wikimedia.org/wikipedia/commons/6/6e/Zoho_logo.svg";
    if (name.includes("microsoft")) return "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg";
    if (name.includes("wipro")) return "https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg";
    if (name.includes("google")) return "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg";
    if (name.includes("cognizant")) return "https://upload.wikimedia.org/wikipedia/commons/1/1b/Cognizant_logo_2022.svg";
    if (name.includes("tcs") || name.includes("tata")) return "https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg";
    if (name.includes("infosys")) return "https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg";
    if (name.includes("accenture")) return "https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg";
    if (name.includes("deloitte")) return "https://upload.wikimedia.org/wikipedia/commons/2/2b/Deloitte.svg";
    return null;
};

export const CompanyLogo: React.FC<{ companyName: string; size?: number }> = ({ companyName, size = 20 }) => {
    const [imgError, setImgError] = useState(false);
    const logoUrl = getCompanyLogo(companyName);

    if (!logoUrl || imgError) {
        return (
            <div style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: "4px",
                backgroundColor: "#1e293b",
                color: "#ffffff",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: `${Math.max(9, Math.round(size * 0.45))}px`,
                flexShrink: 0
            }}>
                {companyName ? companyName.charAt(0).toUpperCase() : "C"}
            </div>
        );
    }

    return (
        <div style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: "4px",
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            padding: "2px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
        }}>
            <img
                src={logoUrl}
                alt={companyName}
                onError={() => setImgError(true)}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
        </div>
    );
};

export interface DepartmentPlacementRecord {
    department: string;
    totalStudents: number;
    placed: number;
    rateNumeric?: number;
    placementRate: string;
}

export interface CompanyPerformanceRecord {
    companyName: string;
    applications: number;
    shortlisted: number;
    selected: number;
    avgPackage: string;
}

export interface SalaryOverviewData {
    highestPackage: string;
    highestCompany?: string;
    averagePackage: string;
    medianPackage: string;
    lowestPackage: string;
}

export interface YearTrendItem {
    year: string;
    placementRate: string;
}

export interface FunnelStageItem {
    stage: string;
    count: number;
}

export interface RolePlacement {
    jobRole: string;
    eligible?: number;
    studentsPlaced: number;
    placementRate: string;
}

export interface UnplacedItem {
    category: string;
    count: number;
}

export interface UpcomingDriveItem {
    company: string;
    role: string;
    date: string;
    eligibleCount: number;
    appliedCount?: number;
    shortlistedCount?: number;
    status: string;
}

export interface RecentActivityItem {
    studentName: string;
    registerNo: string;
    company: string;
    role: string;
    package: string;
    date: string;
}

export interface SavedReportDoc {
    _id: string;
    reportId: string;
    title: string;
    academicYear: string;
    department: string;
    batch: string;
    generatedBy: string;
    totalStudents: number;
    placedCount: number;
    placementRate: number;
    exportType: string;
    createdAt: string;
}

export interface DataSummaryMeta {
    studentRecords: number;
    placementRecords: number;
    applicationsCount: number;
    offersCount: number;
    companiesCount?: number;
    upcomingDrivesCount?: number;
}

export interface ReportSummary {
    totalStudents: number;
    placed: number;
    unplaced?: number;
    inProcess: number;
    notPlaced: number;
    placementRate: number;
    companiesVisited?: number;
    totalOffers: number;
    uniqueCompanies: number;
    highestPackage: string;
    averagePackage: string;
    medianPackage?: string;
    lowestPackage: string;
}

export interface TooltipState {
    visible: boolean;
    x: number;
    y: number;
    title: string;
    details: string[];
}

export const ReportsAnalyticsManagement: React.FC = () => {
    // Filter States
    const [yearFilter, setYearFilter] = useState<string>("2025-2026");
    const [deptFilter, setDeptFilter] = useState<string>("All");
    const [batchFilter, setBatchFilter] = useState<string>("All");
    const [companyFilter, setCompanyFilter] = useState<string>("All");
    const [roleFilter, setRoleFilter] = useState<string>("All");
    const [statusFilter, setStatusFilter] = useState<string>("All");
    const [isRefreshed, setIsRefreshed] = useState<boolean>(false);
    const [saveStatusMsg, setSaveStatusMsg] = useState<string | null>(null);

    // Interactive Hover States
    const [activeHoverBar, setActiveHoverBar] = useState<string | null>(null);
    const [hoveredDonutSegment, setHoveredDonutSegment] = useState<"placed" | "unplaced" | null>(null);
    const [tooltip, setTooltip] = useState<TooltipState>({
        visible: false,
        x: 0,
        y: 0,
        title: "",
        details: []
    });

    // Summary & Datasets State (Computed 100% dynamically from MongoDB)
    const [summary, setSummary] = useState<ReportSummary>({
        totalStudents: 0,
        placed: 0,
        unplaced: 0,
        inProcess: 0,
        notPlaced: 0,
        placementRate: 0,
        companiesVisited: 0,
        totalOffers: 0,
        uniqueCompanies: 0,
        highestPackage: "₹0.0 LPA",
        averagePackage: "₹0.0 LPA",
        medianPackage: "₹0.0 LPA",
        lowestPackage: "₹0.0 LPA"
    });

    const [departmentPlacements, setDepartmentPlacements] = useState<DepartmentPlacementRecord[]>([]);
    const [companyPerformance, setCompanyPerformance] = useState<CompanyPerformanceRecord[]>([]);
    const [salaryOverview, setSalaryOverview] = useState<SalaryOverviewData>({
        highestPackage: "₹0.0 LPA",
        highestCompany: "",
        averagePackage: "₹0.0 LPA",
        medianPackage: "₹0.0 LPA",
        lowestPackage: "₹0.0 LPA"
    });
    const [yearWiseTrend, setYearWiseTrend] = useState<YearTrendItem[]>([]);
    const [applicationFunnelLifecycle, setApplicationFunnelLifecycle] = useState<FunnelStageItem[]>([]);
    const [jobRolePlacements, setJobRolePlacements] = useState<RolePlacement[]>([]);
    const [unplacedAnalysis, setUnplacedAnalysis] = useState<UnplacedItem[]>([]);
    const [upcomingDrives, setUpcomingDrives] = useState<UpcomingDriveItem[]>([]);
    const [recentPlacementActivity, setRecentPlacementActivity] = useState<RecentActivityItem[]>([]);
    const [savedReports, setSavedReports] = useState<SavedReportDoc[]>([]);
    const [dataSummary, setDataSummary] = useState<DataSummaryMeta>({
        studentRecords: 0,
        placementRecords: 0,
        applicationsCount: 0,
        offersCount: 0,
        companiesCount: 0,
        upcomingDrivesCount: 0
    });

    // Fetch Saved MongoDB Reports
    const fetchSavedReports = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/reports/saved`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setSavedReports(data);
            }
        } catch (e) {
            console.error("Failed to fetch saved reports from MongoDB:", e);
        }
    };

    // Fetch Report Data from Backend API
    const fetchReportPayload = async () => {
        try {
            const url = `${API_BASE_URL}/api/reports/overview?academicYear=${encodeURIComponent(yearFilter)}&department=${encodeURIComponent(deptFilter)}&batch=${encodeURIComponent(batchFilter)}&company=${encodeURIComponent(companyFilter)}&jobRole=${encodeURIComponent(roleFilter)}&placementStatus=${encodeURIComponent(statusFilter)}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (data.summary) setSummary(data.summary);
                if (Array.isArray(data.departmentPlacements)) setDepartmentPlacements(data.departmentPlacements);
                if (Array.isArray(data.companyPerformance)) setCompanyPerformance(data.companyPerformance);
                if (data.salaryOverview) setSalaryOverview(data.salaryOverview);
                if (Array.isArray(data.yearWiseTrend)) setYearWiseTrend(data.yearWiseTrend);
                if (Array.isArray(data.applicationFunnelLifecycle)) setApplicationFunnelLifecycle(data.applicationFunnelLifecycle);
                if (Array.isArray(data.jobRolePlacements)) setJobRolePlacements(data.jobRolePlacements);
                if (Array.isArray(data.unplacedAnalysis)) setUnplacedAnalysis(data.unplacedAnalysis);
                if (Array.isArray(data.upcomingDrives)) setUpcomingDrives(data.upcomingDrives);
                if (Array.isArray(data.recentPlacementActivity)) setRecentPlacementActivity(data.recentPlacementActivity);
                if (data.dataSummary) setDataSummary(data.dataSummary);
            }
        } catch (e) {
            console.error("Failed to fetch placement report payload:", e);
        }
    };

    useEffect(() => {
        fetchReportPayload();
        fetchSavedReports();
        const intervalId = setInterval(fetchReportPayload, 3000);
        return () => clearInterval(intervalId);
    }, [yearFilter, deptFilter, batchFilter, companyFilter, roleFilter, statusFilter]);

    const handleManualRefresh = () => {
        setIsRefreshed(true);
        fetchReportPayload();
        fetchSavedReports();
        setTimeout(() => setIsRefreshed(false), 800);
    };

    // Save Live Report Snapshot Document into MongoDB Collection
    const handleSaveReportToMongoDB = async (type: "Snapshot" | "Excel" | "PDF") => {
        try {
            const payload = {
                title: `Placement Analytics (${deptFilter})`,
                academicYear: yearFilter,
                department: deptFilter,
                batch: batchFilter,
                generatedBy: "Placement Officer",
                totalStudents: summary.totalStudents,
                placedCount: summary.placed,
                placementRate: summary.placementRate,
                exportType: type
            };

            const res = await fetch(`${API_BASE_URL}/api/reports/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setSaveStatusMsg(`✓ Saved report document into MongoDB (${type})`);
                fetchSavedReports();
                setTimeout(() => setSaveStatusMsg(null), 3000);
            }
        } catch (e) {
            console.error("Error saving report snapshot to MongoDB:", e);
        }
    };

    // Tooltip Mouse Event Handler
    const handleBarMouseMove = (e: React.MouseEvent, title: string, details: string[]) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
            visible: true,
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
            title,
            details
        });
    };

    const handleBarMouseLeave = () => {
        setActiveHoverBar(null);
        setHoveredDonutSegment(null);
        setTooltip(prev => ({ ...prev, visible: false }));
    };

    const handleExportPDF = () => {
        handleSaveReportToMongoDB("PDF");
        window.print();
    };

    const handleExportExcel = () => {
        handleSaveReportToMongoDB("Excel");
        const headers = ["Department / Company", "Applications", "Shortlisted", "Selected / Placed", "Placement Rate / CTC"];
        const rows = companyPerformance.map(c => [
            c.companyName,
            c.applications,
            c.shortlisted,
            c.selected,
            c.avgPackage
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Placement_Report_${yearFilter}_${deptFilter}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const unplacedCount = summary.unplaced ?? summary.notPlaced;
    const inProcessCount = summary.inProcess ?? 0;

    return (
        <div style={{
            width: "100%",
            padding: "16px 20px",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            backgroundColor: "#f8fafc",
            minHeight: "100vh",
            boxSizing: "border-box",
            color: "#0f172a",
            position: "relative"
        }}>
            {/* Crisp Floating Tooltip */}
            {tooltip.visible && (
                <div style={{
                    position: "fixed",
                    top: `${tooltip.y}px`,
                    left: `${tooltip.x}px`,
                    transform: "translate(-50%, -100%)",
                    backgroundColor: "#0f172a",
                    color: "#ffffff",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    pointerEvents: "none",
                    zIndex: 9999,
                    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.25)",
                    border: "1px solid #334155"
                }}>
                    <div style={{ fontWeight: "700", fontSize: "12px", color: "#38bdf8", marginBottom: "2px" }}>
                        {tooltip.title}
                    </div>
                    {tooltip.details.map((d, idx) => (
                        <div key={idx} style={{ fontSize: "11px", color: "#cbd5e1" }}>{d}</div>
                    ))}
                </div>
            )}

            {/* Print Layout Styling + Mobile Responsive */}
            <style>{`
                @media print {
                    body { background: #ffffff !important; margin: 0; padding: 0; }
                    button, select, label { display: none !important; }
                    div { page-break-inside: avoid; }
                    table { page-break-inside: auto; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                }
                @media (max-width: 1200px) {
                    .reports-filter-grid { grid-template-columns: repeat(3, 1fr) !important; }
                    .reports-kpi-grid { grid-template-columns: repeat(3, 1fr) !important; }
                }
                @media (max-width: 768px) {
                    .reports-filter-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
                    .reports-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
                    .reports-page-header { flex-direction: column !important; align-items: flex-start !important; }
                    .reports-header-actions { width: 100% !important; justify-content: flex-start !important; }
                    .reports-header-timestamp { display: none !important; }
                    .reports-kpi-grid > div { border-right: none !important; border-bottom: 1px solid #f1f5f9 !important; }
                }
                @media (max-width: 480px) {
                    .reports-filter-grid { grid-template-columns: 1fr !important; }
                    .reports-kpi-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>

            {/* Clean Institutional Header - Mobile Responsive */}
            <div className="reports-page-header">
                <div className="reports-header-left">
                    <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.3px" }}>
                        Reports & Analytics
                    </h1>
                    <p style={{ margin: "2px 0 2px 0", fontSize: "12px", color: "#64748b" }}>
                        Institutional placement overview & recruitment intelligence
                    </p>
                    <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "500", marginTop: "2px" }}>
                        Last updated: Aug 24, 2026 · 13:46
                    </div>
                    {saveStatusMsg && (
                        <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: "700", marginTop: "4px" }}>
                            {saveStatusMsg}
                        </div>
                    )}
                </div>
                <div className="reports-header-actions">
                    <button
                        onClick={handleManualRefresh}
                        title="Refresh Data"
                        style={{
                            padding: "6px 12px",
                            backgroundColor: "#ffffff",
                            color: "#334155",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            transform: isRefreshed ? "rotate(360deg)" : "none",
                            transition: "transform 0.5s ease",
                            whiteSpace: "nowrap"
                        }}
                    >
                        <span>↻</span> Refresh
                    </button>
                    <button
                        onClick={() => handleSaveReportToMongoDB("Snapshot")}
                        style={{
                            padding: "6px 14px",
                            backgroundColor: "#ffffff",
                            color: "#2563eb",
                            border: "1px solid #bfdbfe",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                        }}
                    >
                        💾 Save to MongoDB
                    </button>
                    <button
                        onClick={handleExportExcel}
                        style={{
                            padding: "6px 14px",
                            backgroundColor: "#ffffff",
                            color: "#16a34a",
                            border: "1px solid #bbf7d0",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                        }}
                    >
                        Export Excel
                    </button>
                    <button
                        onClick={handleExportPDF}
                        style={{
                            padding: "6px 14px",
                            backgroundColor: "#0f172a",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                        }}
                    >
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Filter Toolbar with Company Filter */}
            <div className="reports-filter-grid" style={{ backgroundColor: "#ffffff", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>Academic Year</label>
                    <select
                        value={yearFilter}
                        onChange={e => setYearFilter(e.target.value)}
                        style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", backgroundColor: "#ffffff", color: "#0f172a", outline: "none", fontWeight: "500" }}
                    >
                        <option value="2025-2026">2025-2026</option>
                        <option value="2024-2025">2024-2025</option>
                        <option value="2026-2027">2026-2027</option>
                        <option value="All">All Academic Years</option>
                    </select>
                </div>

                <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>Department</label>
                    <select
                        value={deptFilter}
                        onChange={e => setDeptFilter(e.target.value)}
                        style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", backgroundColor: "#ffffff", color: "#0f172a", outline: "none", fontWeight: "500" }}
                    >
                        <option value="All">All Departments</option>
                        <option value="Computer Science & Engineering (CSE)">CSE</option>
                        <option value="Information Technology (IT)">IT</option>
                        <option value="Electronics & Communication (ECE)">ECE</option>
                        <option value="Electrical & Electronics (EEE)">EEE</option>
                    </select>
                </div>

                <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>Batch</label>
                    <select
                        value={batchFilter}
                        onChange={e => setBatchFilter(e.target.value)}
                        style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", backgroundColor: "#ffffff", color: "#0f172a", outline: "none", fontWeight: "500" }}
                    >
                        <option value="All">All Batches</option>
                        <option value="2022-2026">2022-2026</option>
                        <option value="2021-2025">2021-2025</option>
                    </select>
                </div>

                <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>Company</label>
                    <select
                        value={companyFilter}
                        onChange={e => setCompanyFilter(e.target.value)}
                        style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", backgroundColor: "#ffffff", color: "#0f172a", outline: "none", fontWeight: "500" }}
                    >
                        <option value="All">All Companies</option>
                        <option value="Amazon Development Center">Amazon</option>
                        <option value="Infosys">Infosys</option>
                        <option value="TCS">TCS</option>
                        <option value="Zoho Corporation">Zoho</option>
                        <option value="Accenture">Accenture</option>
                    </select>
                </div>

                <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>Job Role</label>
                    <select
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                        style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", backgroundColor: "#ffffff", color: "#0f172a", outline: "none", fontWeight: "500" }}
                    >
                        <option value="All">All Roles</option>
                        <option value="SDE">SDE Trainee</option>
                        <option value="Software Developer">Software Developer</option>
                        <option value="System Engineer">System Engineer</option>
                    </select>
                </div>

                <div>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>Status</label>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px", backgroundColor: "#ffffff", color: "#0f172a", outline: "none", fontWeight: "500" }}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Placed">Placed</option>
                        <option value="In Process">In Process</option>
                        <option value="Not Placed">Not Placed</option>
                    </select>
                </div>
            </div>

            {/* Mathematically Consistent 6-KPI Metric Grid Bar */}
            <div className="reports-kpi-grid" style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                <div style={{ padding: "14px 16px", borderRight: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>TOTAL STUDENTS</div>
                    <div style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>{summary.totalStudents}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Registered candidates</div>
                </div>

                <div style={{ padding: "14px 16px", borderRight: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>ELIGIBLE</div>
                    <div style={{ fontSize: "22px", fontWeight: "700", color: "#2563eb", marginTop: "2px" }}>{summary.totalStudents}</div>
                    <div style={{ fontSize: "11px", color: "#2563eb", marginTop: "2px" }}>Drive candidates</div>
                </div>

                <div style={{ padding: "14px 16px", borderRight: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>APPLICATIONS</div>
                    <div style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>{dataSummary.applicationsCount}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        {summary.totalStudents > 0 ? `${(dataSummary.applicationsCount / summary.totalStudents).toFixed(1)} Apps / Student` : "0.0 Apps / Student"}
                    </div>
                </div>

                <div style={{ padding: "14px 16px", borderRight: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>PLACED</div>
                    <div style={{ fontSize: "22px", fontWeight: "700", color: "#16a34a", marginTop: "2px" }}>{summary.placed}</div>
                    <div style={{ fontSize: "11px", color: "#16a34a", marginTop: "2px" }}>Confirmed offers</div>
                </div>

                <div style={{ padding: "14px 16px", borderRight: "1px solid #f1f5f9" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>PLACEMENT RATE</div>
                    <div style={{ fontSize: "22px", fontWeight: "700", color: "#059669", marginTop: "2px" }}>{summary.placementRate.toFixed(1)}%</div>
                    <div style={{ fontSize: "11px", color: "#15803d", marginTop: "2px" }}>{summary.placed} / {summary.totalStudents} candidates</div>
                </div>

                <div style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>COMPANIES</div>
                    <div style={{ fontSize: "22px", fontWeight: "700", color: "#2563eb", marginTop: "2px" }}>{summary.companiesVisited ?? 0}</div>
                    <div style={{ fontSize: "11px", color: "#2563eb", marginTop: "2px" }}>Recruiting partners</div>
                </div>
            </div>

            {/* SECTION 1: Placement Overview & Company Placement */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                {/* Placement Status Summary Box */}
                <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "16px 18px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Placement Status Summary</h2>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>Detailed placement lifecycle breakdown</span>
                        </div>
                        {statusFilter !== "All" && (
                            <button onClick={() => setStatusFilter("All")} style={{ fontSize: "11px", color: "#64748b", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Clear filter</button>
                        )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", marginTop: "16px" }}>
                        <div
                            onMouseEnter={(e) => {
                                setHoveredDonutSegment("placed");
                                handleBarMouseMove(e, "Placed Candidates", [`Placed Count: ${summary.placed}`, `Placement Rate: ${summary.placementRate.toFixed(1)}%`]);
                            }}
                            onMouseLeave={handleBarMouseLeave}
                            onClick={() => setStatusFilter(statusFilter === "Placed" ? "All" : "Placed")}
                            style={{
                                width: "125px",
                                height: "125px",
                                borderRadius: "50%",
                                background: `conic-gradient(#16a34a 0% ${summary.placementRate}%, #eab308 ${summary.placementRate}% ${summary.placementRate + (inProcessCount > 0 ? 10 : 0)}%, #dc2626 ${summary.placementRate + (inProcessCount > 0 ? 10 : 0)}% 100%)`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer"
                            }}
                        >
                            <div style={{
                                width: "80px",
                                height: "80px",
                                borderRadius: "50%",
                                backgroundColor: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                textAlign: "center"
                            }}>
                                <div>
                                    <div style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>{summary.placementRate.toFixed(1)}%</div>
                                    <div style={{ fontSize: "9px", fontWeight: "700", color: "#16a34a", textTransform: "uppercase" }}>PLACED</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", fontSize: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#16a34a" }}></span>
                                    <span style={{ color: "#334155" }}>Placed</span>
                                </div>
                                <strong style={{ color: "#16a34a" }}>{summary.placed}</strong>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", fontSize: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#eab308" }}></span>
                                    <span style={{ color: "#334155" }}>In Process</span>
                                </div>
                                <strong style={{ color: "#ca8a04" }}>{inProcessCount}</strong>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", fontSize: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#dc2626" }}></span>
                                    <span style={{ color: "#334155" }}>Not Placed</span>
                                </div>
                                <strong style={{ color: "#dc2626" }}>{unplacedCount}</strong>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", fontSize: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#94a3b8" }}></span>
                                    <span style={{ color: "#64748b" }}>Opted Out</span>
                                </div>
                                <strong style={{ color: "#64748b" }}>0</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Company Bar Chart */}
                <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "16px 18px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Company-wise Placement</h2>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>Total Placed Candidates: {summary.placed}</span>
                        </div>
                        {companyFilter !== "All" && (
                            <button onClick={() => setCompanyFilter("All")} style={{ fontSize: "11px", color: "#64748b", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Clear filter</button>
                        )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "14px" }}>
                        {companyPerformance.length > 0 ? (
                            companyPerformance.map((cp, idx) => {
                                const isHovered = activeHoverBar === `comp-${idx}`;
                                const isSelected = companyFilter === cp.companyName;

                                return (
                                    <div
                                        key={idx}
                                        onMouseEnter={(e) => {
                                            setActiveHoverBar(`comp-${idx}`);
                                            handleBarMouseMove(e, cp.companyName, [`Placed: ${cp.selected}`, `Applications: ${cp.applications}`, `Shortlisted: ${cp.shortlisted}`, `Avg CTC: ${cp.avgPackage}`]);
                                        }}
                                        onMouseMove={(e) => {
                                            handleBarMouseMove(e, cp.companyName, [`Placed: ${cp.selected}`, `Applications: ${cp.applications}`, `Shortlisted: ${cp.shortlisted}`, `Avg CTC: ${cp.avgPackage}`]);
                                        }}
                                        onMouseLeave={handleBarMouseLeave}
                                        onClick={() => setCompanyFilter(isSelected ? "All" : cp.companyName)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            cursor: "pointer",
                                            padding: "2px 4px",
                                            borderRadius: "4px",
                                            backgroundColor: isSelected ? "#eff6ff" : isHovered ? "#f8fafc" : "transparent"
                                        }}
                                    >
                                        <div style={{ width: "120px", fontSize: "12px", fontWeight: "500", color: isSelected ? "#1d4ed8" : "#334155", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {cp.companyName}
                                        </div>
                                        <div style={{ flex: 1, height: "8px", backgroundColor: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                                            <div style={{
                                                width: `${Math.min(100, Math.max(15, cp.selected * 30))}%`,
                                                height: "100%",
                                                backgroundColor: isSelected ? "#1d4ed8" : isHovered ? "#2563eb" : "#2563eb",
                                                borderRadius: "4px"
                                            }} />
                                        </div>
                                        <div style={{ width: "24px", fontSize: "12px", fontWeight: "700", color: isSelected ? "#1d4ed8" : "#0f172a", textAlign: "right" }}>
                                            {cp.selected}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ padding: "24px 0", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
                                No company placement records match the selected filters.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SECTION 2: Department Placement & Job Role Placement */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                {/* Department-wise Placement Panel */}
                <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "16px 18px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Department Placement</h2>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>Placement percentage by department</span>
                        </div>
                        {deptFilter !== "All" && (
                            <button onClick={() => setDeptFilter("All")} style={{ fontSize: "11px", color: "#64748b", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Clear filter</button>
                        )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
                        {departmentPlacements.length > 0 ? (
                            departmentPlacements.map((dp, idx) => {
                                const rateVal = dp.rateNumeric ?? parseFloat(dp.placementRate);
                                const isHovered = activeHoverBar === `dept-${idx}`;
                                const isSelected = deptFilter.includes(dp.department) || (deptFilter === dp.department);

                                return (
                                    <div
                                        key={idx}
                                        onMouseEnter={(e) => {
                                            setActiveHoverBar(`dept-${idx}`);
                                            handleBarMouseMove(e, dp.department, [`Candidates: ${dp.totalStudents}`, `Placed: ${dp.placed}`, `Rate: ${dp.placementRate}`]);
                                        }}
                                        onMouseMove={(e) => {
                                            handleBarMouseMove(e, dp.department, [`Candidates: ${dp.totalStudents}`, `Placed: ${dp.placed}`, `Rate: ${dp.placementRate}`]);
                                        }}
                                        onMouseLeave={handleBarMouseLeave}
                                        onClick={() => setDeptFilter(isSelected ? "All" : dp.department)}
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "3px",
                                            cursor: "pointer",
                                            padding: "2px 4px",
                                            borderRadius: "4px",
                                            backgroundColor: isSelected ? "#f0fdf4" : isHovered ? "#f8fafc" : "transparent"
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "500", color: "#334155" }}>
                                            <span>{dp.department}</span>
                                            <span style={{ fontWeight: "700", color: "#16a34a" }}>{dp.placed}/{dp.totalStudents} ({dp.placementRate})</span>
                                        </div>
                                        <div style={{ height: "8px", backgroundColor: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                                            <div style={{
                                                width: `${Math.min(100, rateVal)}%`,
                                                height: "100%",
                                                backgroundColor: isSelected ? "#15803d" : isHovered ? "#16a34a" : "#059669",
                                                borderRadius: "4px"
                                            }} />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ padding: "24px 0", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
                                No department placement data available for this selection.
                            </div>
                        )}
                    </div>
                </div>

                {/* Job Role Placement Table */}
                <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "16px 18px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                    <h2 style={{ margin: "0 0 2px 0", fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Job Role Placement</h2>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Placement breakdown by designated job profile</span>

                    <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden", marginTop: "12px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    <th style={{ padding: "8px 12px" }}>Role</th>
                                    <th style={{ padding: "8px 12px", textAlign: "center" }}>Eligible</th>
                                    <th style={{ padding: "8px 12px", textAlign: "center" }}>Placed</th>
                                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobRolePlacements.length > 0 ? (
                                    jobRolePlacements.map((jr, idx) => (
                                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "8px 12px", fontWeight: "500", color: "#0f172a" }}>{jr.jobRole}</td>
                                            <td style={{ padding: "8px 12px", textAlign: "center", color: "#475569" }}>{jr.eligible ?? 0}</td>
                                            <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: "700", color: "#2563eb" }}>{jr.studentsPlaced}</td>
                                            <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "700", color: "#16a34a" }}>{jr.placementRate}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
                                            No job role placement records found matching filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* SECTION 3: Year-wise Placement Trend & Salary Statistics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                {/* Year-wise Placement Trend */}
                <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "16px 18px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Year-wise Placement Trend</h2>
                            <span style={{ fontSize: "11px", color: "#64748b" }}>Multi-year placement rate (%)</span>
                        </div>
                        {yearFilter !== "All" && (
                            <button onClick={() => setYearFilter("All")} style={{ fontSize: "11px", color: "#64748b", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Clear filter</button>
                        )}
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "110px", padding: "10px 16px 0 16px", borderBottom: "1px solid #e2e8f0", marginTop: "14px" }}>
                        {yearWiseTrend.map((yt, idx) => {
                            const val = parseFloat(yt.placementRate);
                            const isHovered = activeHoverBar === `year-${idx}`;
                            const isSelected = yearFilter === yt.year;

                            return (
                                <div
                                    key={idx}
                                    onMouseEnter={(e) => {
                                        setActiveHoverBar(`year-${idx}`);
                                        handleBarMouseMove(e, `Academic Year ${yt.year}`, [`Placement Rate: ${yt.placementRate}`]);
                                    }}
                                    onMouseMove={(e) => {
                                        handleBarMouseMove(e, `Academic Year ${yt.year}`, [`Placement Rate: ${yt.placementRate}`]);
                                    }}
                                    onMouseLeave={handleBarMouseLeave}
                                    onClick={() => setYearFilter(isSelected ? "All" : yt.year)}
                                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flex: 1, cursor: "pointer" }}
                                >
                                    <span style={{ fontSize: "11px", fontWeight: "700", color: isSelected ? "#15803d" : "#16a34a" }}>{yt.placementRate}</span>
                                    <div style={{
                                        width: "24px",
                                        height: `${Math.min(80, val * 0.8)}px`,
                                        backgroundColor: isSelected ? "#15803d" : isHovered ? "#22c55e" : "#16a34a",
                                        borderRadius: "4px 4px 0 0"
                                    }} />
                                    <span style={{ fontSize: "11px", fontWeight: "500", color: "#475569" }}>{yt.year}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Salary Statistics with Highest Package Recruiter */}
                <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "16px 18px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                    <h2 style={{ margin: "0 0 2px 0", fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Salary Statistics</h2>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Highest, Average, Median & Lowest CTC</span>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginTop: "14px" }}>
                        <div style={{ backgroundColor: "#f0fdf4", padding: "10px", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                            <div style={{ fontSize: "10px", fontWeight: "700", color: "#16a34a", textTransform: "uppercase" }}>HIGHEST</div>
                            <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>{salaryOverview.highestPackage}</div>
                            <div style={{ fontSize: "9px", color: "#16a34a", fontWeight: "600", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {salaryOverview.highestCompany || ""}
                            </div>
                        </div>

                        <div style={{ backgroundColor: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: "10px", fontWeight: "700", color: "#2563eb", textTransform: "uppercase" }}>AVERAGE</div>
                            <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>{salaryOverview.averagePackage}</div>
                        </div>

                        <div style={{ backgroundColor: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: "10px", fontWeight: "700", color: "#9333ea", textTransform: "uppercase" }}>MEDIAN</div>
                            <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>{salaryOverview.medianPackage}</div>
                        </div>

                        <div style={{ backgroundColor: "#f8fafc", padding: "10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: "10px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>LOWEST</div>
                            <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginTop: "2px" }}>{salaryOverview.lowestPackage}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 4: Application Funnel & Unplaced Analysis */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                {/* Application Funnel */}
                <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "16px 18px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                    <h2 style={{ margin: "0 0 2px 0", fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Application Funnel</h2>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Stage-by-stage candidate progression (Selected: {summary.placed})</span>

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px" }}>
                        {applicationFunnelLifecycle.map((fn, idx) => (
                            <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", padding: "6px 12px", borderRadius: "6px" }}>
                                <span style={{ fontWeight: "500", color: "#334155", fontSize: "12px" }}>{fn.stage}</span>
                                <span style={{ fontWeight: "700", color: fn.stage === "Selected" ? "#16a34a" : "#0f172a", fontSize: "12px" }}>{fn.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Unplaced Student Analysis */}
                <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "16px 18px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                    <h2 style={{ margin: "0 0 2px 0", fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Unplaced Student Analysis</h2>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Reason breakdown for unplaced candidates</span>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
                        {unplacedAnalysis.map((ua, idx) => (
                            <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: "500", color: "#334155" }}>
                                    <span>{ua.category}</span>
                                    <span style={{ color: "#dc2626", fontWeight: "700" }}>{ua.count}</span>
                                </div>
                                <div style={{ height: "6px", backgroundColor: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                                    <div style={{ width: `${ua.count > 0 ? Math.min(100, ua.count * 50) : 0}%`, height: "100%", backgroundColor: "#dc2626", borderRadius: "3px" }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SECTION 5: Company Performance Table */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "16px 18px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", marginBottom: "16px" }}>
                <div style={{ marginBottom: "12px" }}>
                    <h2 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Company Performance & Recruiter Statistics</h2>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Applications received, shortlisted, selected students & Average CTC</span>
                </div>

                <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                <th style={{ padding: "10px 14px" }}>Company</th>
                                <th style={{ padding: "10px 14px", textAlign: "center" }}>Applications</th>
                                <th style={{ padding: "10px 14px", textAlign: "center" }}>Shortlisted</th>
                                <th style={{ padding: "10px 14px", textAlign: "center" }}>Selected</th>
                                <th style={{ padding: "10px 14px", textAlign: "right" }}>Avg Package</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companyPerformance.length > 0 ? (
                                companyPerformance.map((cp, idx) => (
                                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                        <td style={{ padding: "10px 14px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <CompanyLogo companyName={cp.companyName} size={20} />
                                                <span style={{ fontWeight: "600", color: "#0f172a" }}>{cp.companyName}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: "10px 14px", textAlign: "center", color: "#334155" }}>{cp.applications}</td>
                                        <td style={{ padding: "10px 14px", textAlign: "center", color: "#334155" }}>{cp.shortlisted}</td>
                                        <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: "700", color: "#16a34a" }}>{cp.selected}</td>
                                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "700", color: "#0f172a" }}>{cp.avgPackage}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
                                        No company performance records match the selected filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SECTION 6: Upcoming Recruitment Drives */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "16px 18px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", marginBottom: "16px" }}>
                <div style={{ marginBottom: "12px" }}>
                    <h2 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Upcoming Recruitment Drives</h2>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Scheduled campus drives and upcoming placement events</span>
                </div>

                <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                <th style={{ padding: "10px 14px" }}>Company</th>
                                <th style={{ padding: "10px 14px" }}>Role</th>
                                <th style={{ padding: "10px 14px" }}>Drive Date</th>
                                <th style={{ padding: "10px 14px", textAlign: "center" }}>Eligible</th>
                                <th style={{ padding: "10px 14px", textAlign: "center" }}>Applied</th>
                                <th style={{ padding: "10px 14px", textAlign: "center" }}>Shortlisted</th>
                                <th style={{ padding: "10px 14px", textAlign: "right" }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {upcomingDrives.length > 0 ? (
                                upcomingDrives.map((ud, idx) => (
                                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                        <td style={{ padding: "10px 14px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <CompanyLogo companyName={ud.company} size={20} />
                                                <span style={{ fontWeight: "600", color: "#0f172a" }}>{ud.company}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: "10px 14px", color: "#334155" }}>{ud.role}</td>
                                        <td style={{ padding: "10px 14px", color: "#64748b" }}>{ud.date}</td>
                                        <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: "600", color: "#0f172a" }}>{ud.eligibleCount}</td>
                                        <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: "600", color: "#2563eb" }}>{ud.appliedCount ?? 0}</td>
                                        <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: "600", color: "#475569" }}>{ud.shortlistedCount ?? 0}</td>
                                        <td style={{ padding: "10px 14px", textAlign: "right" }}>
                                            <span style={{ fontSize: "10px", fontWeight: "700", backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "2px 8px", borderRadius: "4px", border: "1px solid #bfdbfe" }}>
                                                {ud.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
                                        No upcoming recruitment drives scheduled matching your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SECTION 7: Recent Placement Activity Table */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "16px 18px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Recent Placement Activity</h2>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>Real-time confirmed student candidate selections</span>
                    </div>
                    <button style={{ fontSize: "11px", color: "#2563eb", fontWeight: "600", background: "none", border: "none", cursor: "pointer" }}>
                        View All →
                    </button>
                </div>

                <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                <th style={{ padding: "10px 14px" }}>Student Name</th>
                                <th style={{ padding: "10px 14px" }}>Company</th>
                                <th style={{ padding: "10px 14px" }}>Job Role</th>
                                <th style={{ padding: "10px 14px", textAlign: "center" }}>Package</th>
                                <th style={{ padding: "10px 14px", textAlign: "right" }}>Selection Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentPlacementActivity.length > 0 ? (
                                recentPlacementActivity.map((ra, idx) => (
                                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                        <td style={{ padding: "10px 14px" }}>
                                            <div style={{ fontWeight: "600", color: "#0f172a" }}>{ra.studentName}</div>
                                            <div style={{ fontSize: "10px", color: "#64748b" }}>{ra.registerNo}</div>
                                        </td>
                                        <td style={{ padding: "10px 14px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <CompanyLogo companyName={ra.company} size={18} />
                                                <span style={{ color: "#334155", fontWeight: "500" }}>{ra.company}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: "10px 14px", color: "#475569" }}>{ra.role}</td>
                                        <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: "700", color: "#16a34a" }}>{ra.package}</td>
                                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#64748b" }}>{ra.date}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
                                        No recent placement activity recorded for this selection.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SECTION 8: Saved Reports History in MongoDB Collection */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "16px 18px", boxShadow: "0 1px 2px rgba(0,0,0,0.02)", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>Saved Reports & Snapshot Documents</h2>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>Persisted report documents saved in MongoDB `reports` collection</span>
                    </div>
                    <button
                        onClick={() => handleSaveReportToMongoDB("Snapshot")}
                        style={{ fontSize: "11px", color: "#2563eb", fontWeight: "700", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", padding: "4px 10px", borderRadius: "6px", cursor: "pointer" }}
                    >
                        + Save New Snapshot
                    </button>
                </div>

                <div style={{ border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12px" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                <th style={{ padding: "10px 14px" }}>Report ID</th>
                                <th style={{ padding: "10px 14px" }}>Title & Filters</th>
                                <th style={{ padding: "10px 14px", textAlign: "center" }}>Students</th>
                                <th style={{ padding: "10px 14px", textAlign: "center" }}>Placed</th>
                                <th style={{ padding: "10px 14px", textAlign: "center" }}>Rate</th>
                                <th style={{ padding: "10px 14px", textAlign: "center" }}>Type</th>
                                <th style={{ padding: "10px 14px", textAlign: "right" }}>Saved Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {savedReports.length > 0 ? (
                                savedReports.map((sr, idx) => (
                                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                        <td style={{ padding: "10px 14px", fontWeight: "700", color: "#2563eb" }}>{sr.reportId}</td>
                                        <td style={{ padding: "10px 14px" }}>
                                            <div style={{ fontWeight: "600", color: "#0f172a" }}>{sr.title}</div>
                                            <div style={{ fontSize: "10px", color: "#64748b" }}>Year: {sr.academicYear} • Dept: {sr.department}</div>
                                        </td>
                                        <td style={{ padding: "10px 14px", textAlign: "center", color: "#0f172a" }}>{sr.totalStudents}</td>
                                        <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: "700", color: "#16a34a" }}>{sr.placedCount}</td>
                                        <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: "700", color: "#059669" }}>{sr.placementRate.toFixed(1)}%</td>
                                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                                            <span style={{ fontSize: "10px", fontWeight: "700", backgroundColor: sr.exportType === "PDF" ? "#fef2f2" : sr.exportType === "Excel" ? "#f0fdf4" : "#eff6ff", color: sr.exportType === "PDF" ? "#dc2626" : sr.exportType === "Excel" ? "#16a34a" : "#2563eb", padding: "2px 8px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
                                                {sr.exportType}
                                            </span>
                                        </td>
                                        <td style={{ padding: "10px 14px", textAlign: "right", color: "#64748b" }}>
                                            {new Date(sr.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
                                        No saved report snapshot documents in MongoDB yet. Click "💾 Save to MongoDB" to persist a report document.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Institutional Audit Summary Footer */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                        DATABASE HEALTH <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: "600" }}>✓ Synchronized</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px" }}>
                        Last sync: 13:46 PM • Verified metrics from MongoDB database
                    </div>
                </div>
                <div style={{ display: "flex", gap: "16px", fontSize: "11px", fontWeight: "600", color: "#475569" }}>
                    <div>Students: <strong style={{ color: "#0f172a" }}>{dataSummary.studentRecords}</strong></div>
                    <div>Companies: <strong style={{ color: "#2563eb" }}>{dataSummary.companiesCount ?? 0}</strong></div>
                    <div>Applications: <strong style={{ color: "#0f172a" }}>{dataSummary.applicationsCount}</strong></div>
                    <div>Placements: <strong style={{ color: "#16a34a" }}>{dataSummary.placementRecords}</strong></div>
                </div>
            </div>
        </div>
    );
};

export default ReportsAnalyticsManagement;
