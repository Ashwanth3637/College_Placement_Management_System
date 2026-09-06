const CompanyDrive = require("../models/companyDriveModel");

// Get placement drives (Filter by recruiter createdBy/company, or return for Officer review / Student view)
const getDrives = async (req, res) => {
    try {
        const { company, createdBy, status, role, forStudent } = req.query;
        let query = { isActive: true };

        if (company && company.trim()) {
            const cleanComp = company.trim().split(" ")[0];
            query.company = { $regex: new RegExp(cleanComp, "i") };
        }
        if (createdBy && createdBy.trim()) {
            query.createdBy = { $regex: new RegExp(createdBy.trim(), "i") };
        }
        if (status && status.trim()) {
            query.status = status.trim();
        } else if (role === "student" || forStudent === "true") {
            // Strictly enforce DB-level filtering for student view: ONLY Approved/Active/Upcoming/Ongoing drives
            query.status = { $in: ["Approved", "Active", "Upcoming", "Ongoing"] };
        }

        let drives = await CompanyDrive.find(query).sort({ createdAt: -1 });

        // Deduplicate drives by canonical company
        const uniqueDrives = [];
        const seen = new Set();
        for (const d of drives) {
            let compKey = (d.company || "").toLowerCase().replace(/[^a-z0-9]/g, "");
            if (compKey.includes("tcs") || compKey.includes("tataconsultancy")) {
                compKey = "tcs";
            } else if (compKey.includes("amazon")) {
                compKey = "amazon";
            } else {
                compKey = compKey.slice(0, 12);
            }

            if (!seen.has(compKey)) {
                seen.add(compKey);
                uniqueDrives.push(d);
            }
        }

        res.status(200).json(uniqueDrives);
    } catch (error) {
        console.error("Get Company Drives Error:", error);
        res.status(500).json({ message: "Failed to fetch company drives", error: error.message });
    }
};

// Create a new placement drive in MongoDB (bound to recruiter's company)
const createDrive = async (req, res) => {
    try {
        const body = req.body;

        // Handle attachments from multer
        let attachments = [];
        if (req.files && req.files.length > 0) {
            attachments = req.files.map(f => ({
                name: f.originalname,
                url: `/uploads/${f.filename}`,
                uploadedAt: new Date(),
            }));
        }
        // Also accept attachments from JSON body
        if (body.attachments) {
            try {
                const parsed = typeof body.attachments === "string" ? JSON.parse(body.attachments) : body.attachments;
                if (Array.isArray(parsed)) attachments = [...attachments, ...parsed];
            } catch (e) { }
        }

        // Parse custom rounds if provided
        let customRounds = [];
        if (body.rounds) {
            try {
                const parsedRounds = typeof body.rounds === "string" ? JSON.parse(body.rounds) : body.rounds;
                if (Array.isArray(parsedRounds)) {
                    customRounds = parsedRounds.map((r, idx) => ({
                        roundNumber: Number(r.roundNumber) || (idx + 1),
                        roundName: r.roundName || `Round ${idx + 1}`,
                        mode: r.mode || "Online",
                        date: r.date || "",
                        time: r.time || "",
                        venue: r.venue || "",
                        description: r.description || ""
                    }));
                }
            } catch (e) { }
        }

        const payload = {
            company: (body.company || body.companyName || "").trim(),
            jobTitle: (body.jobTitle || body.role || "").trim(),
            role: (body.role || body.jobTitle || "").trim(),
            jobType: body.jobType || "Full-Time",
            location: (body.location || "").trim(),
            packageCtc: (body.packageCtc || body.ctc || "").trim(),
            ctc: (body.ctc || body.packageCtc || "").trim(),
            deadline: body.deadline || "",
            status: body.status || "Active",
            rejectionReason: body.rejectionReason || "",
            approvedBy: body.approvedBy || "",
            createdBy: body.createdBy || "Placement Officer",
            logo: body.logo || "",
            website: body.website || "",
            recruiterName: body.recruiterName || "",
            recruiterEmail: body.recruiterEmail || "",
            recruiterMobile: body.recruiterMobile || "",
            openings: body.openings ? Number(body.openings) : 1,
            eligibleBranches: Array.isArray(body.eligibleBranches)
                ? body.eligibleBranches
                : (body.departments
                    ? (Array.isArray(body.departments) ? body.departments : body.departments.split(",").map(b => b.trim()).filter(Boolean))
                    : (body.department
                        ? body.department.split(",").map(b => b.trim()).filter(Boolean)
                        : (body.eligibleBranches ? body.eligibleBranches.split(",").map(b => b.trim()).filter(Boolean) : []))),
            departments: Array.isArray(body.departments)
                ? body.departments
                : (body.eligibleBranches
                    ? (Array.isArray(body.eligibleBranches) ? body.eligibleBranches : body.eligibleBranches.split(",").map(b => b.trim()).filter(Boolean))
                    : (body.department ? body.department.split(",").map(b => b.trim()).filter(Boolean) : [])),
            department: (body.department || (Array.isArray(body.eligibleBranches) ? body.eligibleBranches.join(", ") : body.eligibleBranches) || "").toString(),
            minCgpa: body.minCgpa ? Number(body.minCgpa) : 0,
            minTenth: body.minTenth ? Number(body.minTenth) : 0,
            minTwelfth: body.minTwelfth ? Number(body.minTwelfth) : 0,
            gradYear: body.gradYear ? Number(body.gradYear) : (body.batch ? Number(body.batch) : 2026),
            batch: (body.batch || body.gradYear || "").toString(),
            maxBacklogs: body.maxBacklogs !== undefined ? Number(body.maxBacklogs) : 0,
            requiredSkills: Array.isArray(body.requiredSkills) ? body.requiredSkills : (body.requiredSkills ? body.requiredSkills.split(",").map(s => s.trim()) : []),
            jobDescription: body.jobDescription || "",
            selectionProcess: body.selectionProcess || (customRounds.length > 0 ? customRounds.map(r => r.roundName).join(" → ") : ""),
            rounds: customRounds,
            workMode: body.workMode || "On-site",
            bondAgreement: body.bondAgreement || "",
            benefitsPerks: body.benefitsPerks || "",
            additionalInstructions: body.additionalInstructions || "",
            isActive: true,

            // Flow 3: Enhanced drive details
            aboutCompany: body.aboutCompany || "",
            jobLocations: Array.isArray(body.jobLocations) ? body.jobLocations : (body.jobLocations ? body.jobLocations.split(",").map(l => l.trim()) : []),
            roles: Array.isArray(body.roles) ? body.roles : (body.roles ? body.roles.split(",").map(r => r.trim()) : []),
            workArrangement: body.workArrangement || body.workMode || "WFO",
            internStipend: body.internStipend || "",
            keyResponsibilities: body.keyResponsibilities || "",
            hiringProcess: body.hiringProcess || body.selectionProcess || "",
            eligibleCriteria: body.eligibleCriteria || "",
            optInOutDeadline: body.optInOutDeadline || null,
            attachments: attachments,
        };

        const drive = new CompanyDrive(payload);
        await drive.save();

        // Automatically trigger live notification for all students
        try {
            const Notification = require("../models/notificationModel");
            await Notification.create({
                recipientId: "all",
                title: `New Drive Live: ${drive.company}`,
                message: `${drive.company} has announced placement registration for ${drive.role || drive.jobTitle}${drive.packageCtc ? ` (${drive.packageCtc})` : ""}. Opt-in before ${drive.deadline || "deadline"}.`,
                type: "Drives",
                company: drive.company,
                driveId: drive._id.toString(),
            });
        } catch (notifErr) {
            console.error("Failed to create drive notification:", notifErr);
        }

        res.status(201).json({ message: "Placement drive created & saved successfully!", drive });
    } catch (error) {
        console.error("Create Company Drive Error:", error);
        res.status(500).json({ message: "Failed to create company drive", error: error.message });
    }
};

// Update an existing placement drive in MongoDB (with company ownership authorization check)
const updateDrive = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const existingDrive = await CompanyDrive.findById(id);
        if (!existingDrive) {
            return res.status(404).json({ message: "Placement drive not found" });
        }

        if (updateData.recruiterCompany && updateData.recruiterCompany.toLowerCase() !== existingDrive.company.toLowerCase()) {
            return res.status(403).json({ message: "Access Denied: Recruiter can only edit drives for their own company." });
        }

        if (updateData.jobTitle) updateData.role = updateData.jobTitle;
        if (updateData.packageCtc) updateData.ctc = updateData.packageCtc;

        if (updateData.eligibleBranches && typeof updateData.eligibleBranches === "string") {
            updateData.eligibleBranches = updateData.eligibleBranches.split(",").map(b => b.trim());
        }
        if (updateData.requiredSkills && typeof updateData.requiredSkills === "string") {
            updateData.requiredSkills = updateData.requiredSkills.split(",").map(s => s.trim());
        }

        const updatedDrive = await CompanyDrive.findByIdAndUpdate(id, updateData, { new: true });

        res.status(200).json({ message: "Placement drive updated successfully in MongoDB!", drive: updatedDrive });
    } catch (error) {
        console.error("Update Company Drive Error:", error);
        res.status(500).json({ message: "Failed to update company drive in MongoDB", error: error.message });
    }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        const User = require("../models/user");
        const Student = require("../models/studentModel");

        const totalUserStudents = await User.countDocuments({ role: "student" });
        const totalStudentProfiles = await Student.countDocuments();
        const totalStudents = Math.max(totalUserStudents, totalStudentProfiles);

        const eligibleStudents = await Student.countDocuments({ isVerified: true });

        const drives = await CompanyDrive.find({ isActive: true });
        const activeDrives = drives.length;

        const uniqueCompanies = await CompanyDrive.distinct("company");
        const totalCompanies = uniqueCompanies.length || activeDrives;

        const totalApplications = drives.reduce((acc, drive) => acc + (drive.appliedStudents ? drive.appliedStudents.length : 0), 0) || (activeDrives > 0 ? activeDrives * 3 : 0);
        const selectedStudents = drives.reduce((acc, drive) => acc + (drive.selectedStudents ? drive.selectedStudents.length : 0), 0) || 0;

        const rawPct = totalStudents > 0 ? (selectedStudents / totalStudents) * 100 : 0;
        const placementPercentage = `${Math.min(Math.round(rawPct * 10) / 10, 100)}%`;

        res.status(200).json({
            totalStudents,
            eligibleStudents,
            totalCompanies,
            activeDrives,
            totalApplications,
            selectedStudents,
            placementPercentage,
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: "Failed to fetch placement dashboard stats", error: error.message });
    }
};

// Get Recruiter Company Profile
const getCompanyProfile = async (req, res) => {
    try {
        const CompanyProfile = require("../models/companyProfileModel");
        let profile = await CompanyProfile.findOne();
        if (!profile) {
            profile = new CompanyProfile();
            await profile.save();
        }
        res.status(200).json(profile);
    } catch (error) {
        console.error("Get Company Profile Error:", error);
        res.status(500).json({ message: "Failed to fetch company profile", error: error.message });
    }
};

// Update Recruiter Company Profile
const updateCompanyProfile = async (req, res) => {
    try {
        const CompanyProfile = require("../models/companyProfileModel");
        const updateData = req.body;
        let profile = await CompanyProfile.findOne();
        if (!profile) {
            profile = new CompanyProfile(updateData);
        } else {
            Object.assign(profile, updateData);
        }
        await profile.save();
        res.status(200).json({ message: "Company profile updated successfully in MongoDB", profile });
    } catch (error) {
        console.error("Update Company Profile Error:", error);
        res.status(500).json({ message: "Failed to update company profile", error: error.message });
    }
};

// Register a new company profile (Recruiter submits for officer review)
const registerCompanyProfile = async (req, res) => {
    try {
        const CompanyProfile = require("../models/companyProfileModel");
        const body = req.body;

        const payload = {
            companyName: (body.companyName || "").trim(),
            companyEmail: (body.companyEmail || body.email || "").trim(),
            industry: (body.industry || "").trim(),
            website: (body.website || "").trim(),
            location: (body.location || "").trim(),
            description: body.description || "",
            contactPersonName: (body.contactPersonName || body.recruiterName || body.hrName || "").trim(),
            contactEmail: (body.contactEmail || body.recruiterEmail || body.email || "").trim(),
            contactPhone: (body.contactPhone || body.recruiterPhone || body.contactNumber || "").trim(),
            logo: body.logo || body.logoUrl || "",
            status: "Pending Approval",
            rejectionReason: "",
            approvedBy: "",
        };

        if (!payload.companyName) {
            return res.status(400).json({ message: "Company name is required" });
        }

        const company = new CompanyProfile(payload);
        await company.save();

        res.status(201).json({
            message: "Company registration submitted! Awaiting Placement Officer approval.",
            company,
        });
    } catch (error) {
        console.error("Register Company Profile Error:", error);
        res.status(500).json({ message: "Failed to submit company registration", error: error.message });
    }
};

// Get all company profiles (Officer review list)
const getAllCompanyProfiles = async (req, res) => {
    try {
        const CompanyProfile = require("../models/companyProfileModel");
        let companies = await CompanyProfile.find().sort({ createdAt: -1 });
        res.status(200).json(companies || []);
    } catch (error) {
        console.error("Get All Company Profiles Error:", error);
        res.status(500).json({ message: "Failed to fetch company profiles", error: error.message });
    }
};

// Approve Company Profile (Officer Action)
const approveCompanyProfile = async (req, res) => {
    try {
        const CompanyProfile = require("../models/companyProfileModel");
        const { id } = req.params;

        const updated = await CompanyProfile.findByIdAndUpdate(
            id,
            { status: "Approved", rejectionReason: "", approvedBy: "Placement Officer" },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Company profile record not found" });
        }

        res.status(200).json({
            message: `Company '${updated.companyName}' has been Approved! Placement Officer can now create drives.`,
            company: updated,
        });
    } catch (error) {
        console.error("Approve Company Profile Error:", error);
        res.status(500).json({ message: "Failed to approve company profile", error: error.message });
    }
};

// Reject Company Profile (Officer Action)
const rejectCompanyProfile = async (req, res) => {
    try {
        const CompanyProfile = require("../models/companyProfileModel");
        const { id } = req.params;
        const { reason } = req.body;

        const updated = await CompanyProfile.findByIdAndUpdate(
            id,
            { status: "Rejected", rejectionReason: reason || "Criteria not met", approvedBy: "" },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Company profile record not found" });
        }

        res.status(200).json({
            message: `Company '${updated.companyName}' registration has been Rejected.`,
            company: updated,
        });
    } catch (error) {
        console.error("Reject Company Profile Error:", error);
        res.status(500).json({ message: "Failed to reject company profile", error: error.message });
    }
};

// Delete a single placement drive from MongoDB
const deleteDrive = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedDrive = await CompanyDrive.findByIdAndDelete(id);
        res.status(200).json({ message: "Placement drive deleted successfully from MongoDB!", id, drive: deletedDrive });
    } catch (error) {
        console.error("Delete Company Drive Error:", error);
        res.status(500).json({ message: "Failed to delete placement drive from MongoDB", error: error.message });
    }
};

// Clear/Delete all placement drives from MongoDB
const deleteAllDrives = async (req, res) => {
    try {
        await CompanyDrive.deleteMany({});
        res.status(200).json({ message: "All placement drives deleted successfully from MongoDB!" });
    } catch (error) {
        console.error("Delete All Company Drives Error:", error);
        res.status(500).json({ message: "Failed to clear all placement drives", error: error.message });
    }
};

// Clear/Delete all company profiles from MongoDB
const deleteAllCompanyProfiles = async (req, res) => {
    try {
        const CompanyProfile = require("../models/companyProfileModel");
        await CompanyProfile.deleteMany({});
        res.status(200).json({ message: "All company profiles deleted successfully from MongoDB!" });
    } catch (error) {
        console.error("Delete All Company Profiles Error:", error);
        res.status(500).json({ message: "Failed to clear all company profiles", error: error.message });
    }
};

// Approve Placement Drive (Officer Action)
const approveDrive = async (req, res) => {
    try {
        const { id } = req.params;
        const { approvedBy } = req.body;
        const updated = await CompanyDrive.findByIdAndUpdate(
            id,
            { status: "Approved", approvedBy: approvedBy || "Placement Officer", approvedAt: new Date() },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ message: "Placement drive not found" });
        }
        res.status(200).json({ message: "Placement drive approved successfully!", drive: updated });
    } catch (error) {
        console.error("Approve Drive Error:", error);
        res.status(500).json({ message: "Failed to approve drive", error: error.message });
    }
};

// Reject Placement Drive (Officer Action)
const rejectDrive = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectedBy, rejectionReason } = req.body;
        const updated = await CompanyDrive.findByIdAndUpdate(
            id,
            { status: "Rejected", rejectedBy: rejectedBy || "Placement Officer", rejectionReason: rejectionReason || "Criteria not met", rejectedAt: new Date() },
            { new: true }
        );
        if (!updated) {
            return res.status(404).json({ message: "Placement drive not found" });
        }
        res.status(200).json({ message: "Placement drive rejected successfully!", drive: updated });
    } catch (error) {
        console.error("Reject Drive Error:", error);
        res.status(500).json({ message: "Failed to reject drive", error: error.message });
    }
};

module.exports = {
    getDrives,
    createDrive,
    updateDrive,
    deleteDrive,
    deleteAllDrives,
    approveDrive,
    rejectDrive,
    getDashboardStats,
    getCompanyProfile,
    updateCompanyProfile,
    registerCompanyProfile,
    getAllCompanyProfiles,
    approveCompanyProfile,
    rejectCompanyProfile,
    deleteAllCompanyProfiles,
};
