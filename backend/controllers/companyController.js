const CompanyDrive = require("../models/companyDriveModel");

// Default initial placement drives data
const initialDrives = [
    {
        company: "Amazon Development Center",
        jobTitle: "SDE Trainee / Intern + FTE",
        role: "SDE Trainee / Intern + FTE",
        jobType: "Internship + FTE",
        location: "Bangalore, India",
        packageCtc: "₹22.0 LPA",
        ctc: "₹22.0 LPA",
        deadline: "08 Sep 2026",
        driveDate: "10 Sep 2026",
        status: "Pending Approval",
        createdBy: "Arya",
        recruiterName: "Arya",
        recruiterEmail: "arya@amazon.com",
        logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
        openings: 12,
        eligibleBranches: ["CSE", "IT", "ECE"],
        minCgpa: 7.5,
        gradYear: 2026,
        maxBacklogs: 0,
        requiredSkills: ["Java", "Data Structures", "AWS", "Python"],
        jobDescription: "Design, build, and maintain high-scale software systems and APIs for Amazon Web Services & Retail platform.",
        selectionProcess: "Online Assessment → Technical Interview 1 → Technical Interview 2 → HR Bar Raiser"
    }
];

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
        res.status(200).json(drives);
    } catch (error) {
        console.error("Get Company Drives Error:", error);
        res.status(500).json({ message: "Failed to fetch company drives", error: error.message });
    }
};

// Create a new placement drive in MongoDB (bound to recruiter's company)
const createDrive = async (req, res) => {
    try {
        const body = req.body;
        const payload = {
            company: body.company || "Amazon Development Center",
            jobTitle: body.jobTitle || body.role || "Software Engineer",
            role: body.role || body.jobTitle || "Software Engineer",
            jobType: body.jobType || "Full-Time (FTE)",
            location: body.location || "Bangalore, India",
            packageCtc: body.packageCtc || body.ctc || "₹18.0 LPA",
            ctc: body.ctc || body.packageCtc || "₹18.0 LPA",
            deadline: body.deadline || "30 Sep 2026",
            status: body.status || "Pending Approval",
            rejectionReason: body.rejectionReason || "",
            approvedBy: body.approvedBy || "",
            createdBy: body.createdBy || body.company || "",
            logo: body.logo || "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
            openings: body.openings ? Number(body.openings) : 10,
            eligibleBranches: Array.isArray(body.eligibleBranches) ? body.eligibleBranches : (body.eligibleBranches ? body.eligibleBranches.split(",").map(b => b.trim()) : ["CSE", "IT"]),
            minCgpa: body.minCgpa ? Number(body.minCgpa) : 7.0,
            gradYear: body.gradYear ? Number(body.gradYear) : 2026,
            maxBacklogs: body.maxBacklogs ? Number(body.maxBacklogs) : 0,
            requiredSkills: Array.isArray(body.requiredSkills) ? body.requiredSkills : (body.requiredSkills ? body.requiredSkills.split(",").map(s => s.trim()) : ["Java", "React"]),
            jobDescription: body.jobDescription || "Design, develop, and maintain software applications.",
            selectionProcess: body.selectionProcess || "Aptitude Test → Technical Interview → HR Round",
            workMode: body.workMode || "On-site",
            bondAgreement: body.bondAgreement || "None",
            benefitsPerks: body.benefitsPerks || "",
            additionalInstructions: body.additionalInstructions || "",
            isActive: true,
        };

        const drive = new CompanyDrive(payload);
        await drive.save();

        res.status(201).json({ message: "Placement drive created & saved successfully in MongoDB!", drive });
    } catch (error) {
        console.error("Create Company Drive Error:", error);
        res.status(500).json({ message: "Failed to create company drive in MongoDB", error: error.message });
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
            companyName: body.companyName || "New Enterprise",
            companyEmail: body.companyEmail || body.email || "contact@enterprise.com",
            industry: body.industry || "IT & Software Services",
            website: body.website || "https://enterprise.com",
            location: body.location || "Bangalore, India",
            description: body.description || "Enterprise technology and software solutions.",
            contactPersonName: body.contactPersonName || body.recruiterName || body.hrName || "Recruiter Lead",
            contactEmail: body.contactEmail || body.recruiterEmail || body.email || "recruitment@enterprise.com",
            contactPhone: body.contactPhone || body.recruiterPhone || body.contactNumber || "+91 98765 43210",
            logo: body.logo || body.logoUrl || "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
            status: "Pending Approval",
            rejectionReason: "",
            approvedBy: "",
        };

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

        if (!companies || companies.length === 0) {
            // Seed initial companies if empty
            const seedCompanies = [
                {
                    companyName: "Amazon Development Center",
                    companyEmail: "recruitment@amazon.com",
                    industry: "E-Commerce & Cloud Infrastructure",
                    website: "https://www.amazon.jobs",
                    location: "Bangalore / Hyderabad / Chennai",
                    description: "Amazon Software Development Center India engages in world-class software engineering.",
                    contactPersonName: "Arya",
                    contactEmail: "arya@amazon.com",
                    contactPhone: "+91 97654 32109",
                    status: "Approved",
                    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
                },
                {
                    companyName: "Zoho Corporation",
                    companyEmail: "recruitment@zoho.com",
                    industry: "SaaS & Cloud Software",
                    website: "https://www.zoho.com",
                    location: "Chennai / Tenkasi",
                    description: "Zoho Corporation develops cloud software applications for businesses worldwide.",
                    contactPersonName: "Siddharth",
                    contactEmail: "siddharth@zoho.com",
                    contactPhone: "+91 98765 43210",
                    status: "Approved",
                    logo: "/company-logos/zoho.png",
                },
                {
                    companyName: "JAC MediaLand",
                    companyEmail: "contact@jacmedialand.com",
                    industry: "Media & Design Technology",
                    website: "https://www.jacmedialand.com",
                    location: "Erode",
                    description: "JAC MediaLand specializes in digital media, UI/UX development, and design tech.",
                    contactPersonName: "Manikandan",
                    contactEmail: "contact@jacmedialand.com",
                    contactPhone: "+91 94433 22110",
                    status: "Approved",
                    logo: "/company-logos/jac-medialand.png",
                },
                {
                    companyName: "Cognizant Technology Solutions",
                    companyEmail: "recruitment@cognizant.com",
                    industry: "IT & Digital Services",
                    website: "https://www.cognizant.com",
                    location: "Coimbatore / Chennai",
                    description: "Cognizant provides digital transformation, IT consulting, and application services.",
                    contactPersonName: "Priya",
                    contactEmail: "priya@cognizant.com",
                    contactPhone: "+91 98123 45678",
                    status: "Approved",
                    logo: "/company-logos/cognizant.png",
                },
            ];
            companies = await CompanyProfile.insertMany(seedCompanies);
        }

        res.status(200).json(companies);
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
