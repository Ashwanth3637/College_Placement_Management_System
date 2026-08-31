const mongoose = require("mongoose");
const Student = require("../models/studentModel");
const Selection = require("../models/selectionModel");
const CompanyDrive = require("../models/companyDriveModel");
const User = require("../models/user");
const Report = require("../models/reportModel");

// Helper to parse CTC string like "₹12 LPA" or "12 LPA" or "1200000" into a numeric LPA float
const parseCtcNumeric = (ctcStr) => {
    if (!ctcStr) return 0;
    if (typeof ctcStr === "number") return ctcStr;
    const cleaned = ctcStr.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
};

// GET /api/reports/overview
const getReportsOverview = async (req, res) => {
    try {
        const { academicYear, department, batch, jobRole, company, placementStatus } = req.query;

        // 1. Fetch Real Students from MongoDB
        let studentMatch = {};
        if (department && department !== "All") {
            studentMatch["personal.department"] = { $regex: new RegExp(department.replace(/[\(\)]/g, "\\$&"), "i") };
        }

        const realStudents = await Student.find(studentMatch).populate("user", "name email");
        const totalStudentsCount = realStudents.length;

        // 2. Fetch Real Selections from MongoDB
        let selectionMatch = {};
        if (department && department !== "All") {
            selectionMatch["department"] = { $regex: new RegExp(department.replace(/[\(\)]/g, "\\$&"), "i") };
        }
        if (academicYear && academicYear !== "All") {
            selectionMatch["academicYear"] = academicYear;
        }
        if (company && company !== "All") {
            selectionMatch["companyName"] = { $regex: new RegExp(company, "i") };
        }
        if (jobRole && jobRole !== "All") {
            selectionMatch["jobRole"] = { $regex: new RegExp(jobRole, "i") };
        }

        const realSelections = await Selection.find(selectionMatch);

        // Filter confirmed placed selections (Offer Accepted, Offer Released, Selected)
        const confirmedSelections = realSelections.filter(s =>
            ["Selected", "Offer Released", "Offer Accepted"].includes(s.status)
        );

        // Count unique placed student register numbers / IDs
        const uniquePlacedRegs = new Set(confirmedSelections.map(s => s.regNo || s.studentName));
        const placedCount = uniquePlacedRegs.size;

        const inProcessCount = realSelections.filter(s => s.status === "Shortlisted").length;
        const unplacedCount = Math.max(0, totalStudentsCount - placedCount);
        const placementRate = totalStudentsCount > 0 ? (placedCount / totalStudentsCount) * 100 : 0;

        // Unique companies in selections
        const uniqueCompanyNames = new Set(realSelections.map(s => s.companyName));
        const companiesVisited = uniqueCompanyNames.size;

        // 3. Dynamic Company Performance
        const companyMap = {};
        realSelections.forEach(s => {
            const comp = s.companyName || "Unknown Company";
            if (!companyMap[comp]) {
                companyMap[comp] = { companyName: comp, applications: 0, shortlisted: 0, selected: 0, totalCtc: 0, ctcCount: 0 };
            }
            companyMap[comp].applications += 1;
            if (s.status === "Shortlisted") companyMap[comp].shortlisted += 1;
            if (["Selected", "Offer Released", "Offer Accepted"].includes(s.status)) {
                companyMap[comp].selected += 1;
                const ctcNum = parseCtcNumeric(s.ctc);
                if (ctcNum > 0) {
                    companyMap[comp].totalCtc += ctcNum;
                    companyMap[comp].ctcCount += 1;
                }
            }
        });

        const companyPerformance = Object.values(companyMap).map(c => ({
            companyName: c.companyName,
            applications: c.applications,
            shortlisted: c.shortlisted,
            selected: c.selected,
            avgPackage: c.ctcCount > 0 ? `₹${(c.totalCtc / c.ctcCount).toFixed(1)} LPA` : "N/A"
        })).sort((a, b) => b.selected - a.selected);

        // 4. Dynamic Department Placements
        const deptMap = {};
        realStudents.forEach(st => {
            const d = st.personal?.department || "General";
            if (!deptMap[d]) {
                deptMap[d] = { department: d, totalStudents: 0, placedRegs: new Set() };
            }
            deptMap[d].totalStudents += 1;
            const reg = st.personal?.registerNumber || st.user?.name;
            if (reg && confirmedSelections.some(s => s.regNo === reg || s.studentName === st.user?.name)) {
                deptMap[d].placedRegs.add(reg);
            }
        });

        const departmentPlacements = Object.values(deptMap).map(d => {
            const placed = d.placedRegs.size;
            const rate = d.totalStudents > 0 ? (placed / d.totalStudents) * 100 : 0;
            return {
                department: d.department,
                totalStudents: d.totalStudents,
                placed,
                placementRate: `${rate.toFixed(1)}%`,
                rateNumeric: rate
            };
        });

        // 5. Dynamic Job Role Placements
        const roleMap = {};
        realSelections.forEach(s => {
            const r = s.jobRole || "General Role";
            if (!roleMap[r]) {
                roleMap[r] = { jobRole: r, eligible: 0, studentsPlaced: 0 };
            }
            roleMap[r].eligible += 1;
            if (["Selected", "Offer Released", "Offer Accepted"].includes(s.status)) {
                roleMap[r].studentsPlaced += 1;
            }
        });

        const jobRolePlacements = Object.values(roleMap).map(r => {
            const rate = r.eligible > 0 ? (r.studentsPlaced / r.eligible) * 100 : 0;
            return {
                jobRole: r.jobRole,
                eligible: r.eligible,
                studentsPlaced: r.studentsPlaced,
                placementRate: `${rate.toFixed(1)}%`
            };
        });

        // 6. Dynamic Salary Statistics
        const allPlacedCtcs = confirmedSelections
            .map(s => ({ ctcNum: parseCtcNumeric(s.ctc), company: s.companyName, ctcRaw: s.ctc }))
            .filter(item => item.ctcNum > 0)
            .sort((a, b) => a.ctcNum - b.ctcNum);

        let highestPackage = "₹0.0 LPA";
        let highestCompany = "";
        let averagePackage = "₹0.0 LPA";
        let medianPackage = "₹0.0 LPA";
        let lowestPackage = "₹0.0 LPA";

        if (allPlacedCtcs.length > 0) {
            const highestItem = allPlacedCtcs[allPlacedCtcs.length - 1];
            highestPackage = highestItem.ctcRaw || `₹${highestItem.ctcNum.toFixed(1)} LPA`;
            highestCompany = highestItem.company || "";

            const lowestItem = allPlacedCtcs[0];
            lowestPackage = lowestItem.ctcRaw || `₹${lowestItem.ctcNum.toFixed(1)} LPA`;

            const sumCtc = allPlacedCtcs.reduce((acc, curr) => acc + curr.ctcNum, 0);
            averagePackage = `₹${(sumCtc / allPlacedCtcs.length).toFixed(1)} LPA`;

            const mid = Math.floor(allPlacedCtcs.length / 2);
            const medianVal = allPlacedCtcs.length % 2 !== 0
                ? allPlacedCtcs[mid].ctcNum
                : (allPlacedCtcs[mid - 1].ctcNum + allPlacedCtcs[mid].ctcNum) / 2;
            medianPackage = `₹${medianVal.toFixed(1)} LPA`;
        }

        const salaryOverview = {
            highestPackage,
            highestCompany,
            averagePackage,
            medianPackage,
            lowestPackage
        };

        // 7. Dynamic Year-wise Placement Trend
        const yearMap = {};
        realSelections.forEach(s => {
            const yr = s.academicYear || "2025-2026";
            if (!yearMap[yr]) {
                yearMap[yr] = { year: yr, total: 0, placed: 0 };
            }
            yearMap[yr].total += 1;
            if (["Selected", "Offer Released", "Offer Accepted"].includes(s.status)) {
                yearMap[yr].placed += 1;
            }
        });

        const yearWiseTrend = Object.values(yearMap).map(y => ({
            year: y.year,
            placementRate: y.total > 0 ? `${((y.placed / y.total) * 100).toFixed(1)}%` : "0.0%"
        }));

        // 8. Dynamic Application Funnel
        const stageApplied = realSelections.length;
        const stageShortlisted = realSelections.filter(s => ["Shortlisted", "Selected", "Offer Released", "Offer Accepted"].includes(s.status)).length;
        const stageSelected = confirmedSelections.length;

        const applicationFunnelLifecycle = [
            { stage: "Applied", count: stageApplied },
            { stage: "Shortlisted", count: stageShortlisted },
            { stage: "Selected", count: stageSelected }
        ];

        // 9. Dynamic Unplaced Student Breakdown
        const unplacedAnalysis = [
            { category: "Seeking Placement", count: unplacedCount },
            { category: "Interview Rejected", count: realSelections.filter(s => s.status === "Rejected").length },
            { category: "Not Participated", count: 0 },
            { category: "Not Eligible", count: 0 },
            { category: "Higher Studies / Opted Out", count: 0 }
        ];

        // 10. Dynamic Upcoming Drives from MongoDB
        let driveMatch = {};
        if (company && company !== "All") {
            driveMatch["company"] = { $regex: new RegExp(company, "i") };
        }
        if (jobRole && jobRole !== "All") {
            driveMatch["role"] = { $regex: new RegExp(jobRole, "i") };
        }

        const realDrives = await CompanyDrive.find(driveMatch);
        const upcomingDrives = realDrives.map(d => ({
            company: d.company,
            role: d.role,
            date: d.deadline || "TBA",
            eligibleCount: totalStudentsCount,
            appliedCount: realSelections.filter(s => s.companyName === d.company).length,
            shortlistedCount: realSelections.filter(s => s.companyName === d.company && s.status === "Shortlisted").length,
            status: d.isActive ? "Upcoming" : "Completed"
        }));

        // 11. Dynamic Recent Placement Activity from MongoDB Selections
        const recentPlacementActivity = confirmedSelections
            .slice(-5)
            .reverse()
            .map(s => ({
                studentName: s.studentName,
                registerNo: s.regNo,
                company: s.companyName,
                role: s.jobRole,
                package: s.ctc,
                date: s.offerDate || "Recent"
            }));

        // 12. Dynamic Data Summary Meta Audit
        const dataSummary = {
            studentRecords: totalStudentsCount,
            placementRecords: placedCount,
            applicationsCount: realSelections.length,
            offersCount: confirmedSelections.length,
            companiesCount: companiesVisited,
            upcomingDrivesCount: realDrives.length
        };

        return res.status(200).json({
            summary: {
                totalStudents: totalStudentsCount,
                placed: placedCount,
                unplaced: unplacedCount,
                inProcess: inProcessCount,
                notPlaced: unplacedCount,
                placementRate,
                companiesVisited,
                totalOffers: confirmedSelections.length,
                uniqueCompanies: companiesVisited,
                highestPackage,
                averagePackage,
                medianPackage,
                lowestPackage
            },
            departmentPlacements,
            companyPerformance,
            salaryOverview,
            yearWiseTrend,
            applicationFunnelLifecycle,
            jobRolePlacements,
            unplacedAnalysis,
            upcomingDrives,
            recentPlacementActivity,
            dataSummary
        });
    } catch (error) {
        console.error("Error fetching reports overview:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// POST /api/reports/save -> Save Report Snapshot into MongoDB
const saveReportSnapshot = async (req, res) => {
    try {
        const { title, academicYear, department, batch, generatedBy, totalStudents, placedCount, placementRate, exportType } = req.body;
        const reportCount = await Report.countDocuments();
        const reportId = `REP-${String(reportCount + 1).padStart(3, "0")}`;

        const newReport = new Report({
            reportId,
            title: title || "Institutional Placement Analytics Report",
            academicYear: academicYear || "2025-2026",
            department: department || "All Departments",
            batch: batch || "All Batches",
            generatedBy: generatedBy || "Placement Officer",
            totalStudents: totalStudents || 0,
            placedCount: placedCount || 0,
            placementRate: placementRate || 0,
            exportType: exportType || "Snapshot"
        });

        await newReport.save();
        return res.status(201).json({ message: "Report snapshot saved successfully to MongoDB", report: newReport });
    } catch (error) {
        console.error("Error saving report snapshot to MongoDB:", error);
        return res.status(500).json({ message: "Failed to save report to MongoDB", error: error.message });
    }
};

// GET /api/reports/saved -> Get Saved Reports from MongoDB
const getSavedReports = async (req, res) => {
    try {
        const savedReports = await Report.find().sort({ createdAt: -1 });
        return res.status(200).json(savedReports);
    } catch (error) {
        console.error("Error fetching saved reports from MongoDB:", error);
        return res.status(500).json({ message: "Failed to fetch saved reports from MongoDB" });
    }
};

module.exports = {
    getReportsOverview,
    getStudentPlacementOverview: getReportsOverview,
    saveReportSnapshot,
    getSavedReports
};
