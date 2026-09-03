const User = require("../models/user");
const Student = require("../models/studentModel");
const CompanyProfile = require("../models/companyProfileModel");
const CompanyDrive = require("../models/companyDriveModel");
const Application = require("../models/applicationModel");
const Season = require("../models/seasonModel");
const AuditLog = require("../models/auditLogModel");
const College = require("../models/collegeModel");
const Subscription = require("../models/subscriptionModel");
const SupportTicket = require("../models/supportTicketModel");

// Helper to log audit actions
const logAudit = async (actor, action, entityType, entityId, details, ip = "127.0.0.1", status = "SUCCESS") => {
    try {
        await AuditLog.create({
            actorId: actor?._id || actor?.id || "system",
            actorName: actor?.name || "System Admin",
            actorRole: actor?.role || "admin",
            action,
            entityType,
            entityId: String(entityId || ""),
            details: typeof details === "object" ? JSON.stringify(details) : details,
            ipAddress: ip,
            status,
        });
    } catch (err) {
        console.error("Audit log error:", err.message);
    }
};

// 1. Users CRUD
const getAllUsers = async (req, res) => {
    try {
        const { role, search } = req.query;
        let query = {};
        if (role && role !== "All" && role !== "all") {
            query.role = { $regex: role, $options: "i" };
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }
        const users = await User.find(query).select("-password").sort({ createdAt: -1 });
        return res.status(200).json({ success: true, count: users.length, users });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch users", error: err.message });
    }
};

const createUser = async (req, res) => {
    try {
        const { name, email, password, role, department, college } = req.body;
        const bcrypt = require("bcryptjs");
        const existing = await User.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            return res.status(400).json({ success: false, message: "User with this email already exists" });
        }
        const hashedPassword = await bcrypt.hash(password || "password123", 10);
        const newUser = await User.create({
            name,
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: role || "student",
            department: department || "General",
            college: college || "Institution Partner",
        });

        await logAudit(req.user, "CREATE_USER", "USER", newUser._id, `Created ${newUser.role} user ${newUser.email}`);
        return res.status(201).json({ success: true, message: "User created successfully", user: newUser });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to create user", error: err.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await User.findByIdAndUpdate(id, req.body, { new: true }).select("-password");
        if (!updated) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        await logAudit(req.user, "UPDATE_USER", "USER", id, `Updated user ${updated.email}`);
        return res.status(200).json({ success: true, message: "User updated successfully", user: updated });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to update user", error: err.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        await logAudit(req.user, "DELETE_USER", "USER", id, `Deleted user ${user.email}`);
        return res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to delete user", error: err.message });
    }
};

// 2. Colleges CRUD
const getColleges = async (req, res) => {
    try {
        const colleges = await College.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, count: colleges.length, colleges });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch colleges", error: err.message });
    }
};

const createCollege = async (req, res) => {
    try {
        const existing = await College.findOne({ code: req.body.code?.toUpperCase() });
        if (existing) {
            return res.status(400).json({ success: false, message: "College with this code already exists" });
        }
        const newCollege = await College.create(req.body);
        await logAudit(req.user, "ONBOARD_COLLEGE", "COLLEGE", newCollege._id, `Onboarded ${newCollege.name}`);
        return res.status(201).json({ success: true, message: "College onboarded successfully", college: newCollege });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to create college", error: err.message });
    }
};

const updateCollege = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await College.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) {
            return res.status(404).json({ success: false, message: "College not found" });
        }
        await logAudit(req.user, "UPDATE_COLLEGE", "COLLEGE", id, `Updated college ${updated.name}`);
        return res.status(200).json({ success: true, message: "College updated", college: updated });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to update college", error: err.message });
    }
};

const toggleCollegeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const col = await College.findById(id);
        if (!col) return res.status(404).json({ success: false, message: "College not found" });
        col.status = col.status === "Active" ? "Inactive" : "Active";
        await col.save();
        await logAudit(req.user, "TOGGLE_COLLEGE_STATUS", "COLLEGE", id, `Toggled ${col.name} to ${col.status}`);
        return res.status(200).json({ success: true, message: `College status updated to ${col.status}`, college: col });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to update status", error: err.message });
    }
};

// 3. Subscriptions & Plans
const getSubscriptions = async (req, res) => {
    try {
        const subs = await Subscription.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, subscriptions: subs });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch subscriptions", error: err.message });
    }
};

// 4. Support Tickets
const getSupportTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, tickets });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch support tickets", error: err.message });
    }
};

const replySupportTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { response } = req.body;
        const ticket = await SupportTicket.findByIdAndUpdate(id, { response, status: "Resolved" }, { new: true });
        if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });
        await logAudit(req.user, "RESOLVE_TICKET", "TICKET", id, `Resolved support ticket ${ticket.ticketId}`);
        return res.status(200).json({ success: true, message: "Ticket resolved", ticket });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to update ticket", error: err.message });
    }
};

// 5. Get Placement Seasons
const getSeasons = async (req, res) => {
    try {
        const seasons = await Season.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, seasons });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch seasons", error: err.message });
    }
};

const createSeason = async (req, res) => {
    try {
        const { name, code, startDate, endDate, status, rulesConfig } = req.body;
        const existing = await Season.findOne({ code: code?.toUpperCase() });
        if (existing) {
            return res.status(400).json({ success: false, message: "Season with this code already exists" });
        }
        const season = await Season.create({
            name,
            code: code?.toUpperCase(),
            startDate: startDate || new Date(),
            endDate,
            status: status || "active",
            rulesConfig,
        });

        await logAudit(req.user, "CREATE_SEASON", "SEASON", season._id, `Created placement season ${season.name}`);
        return res.status(201).json({ success: true, message: "Placement season created", season });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to create season", error: err.message });
    }
};

const updateSeason = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Season.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) {
            return res.status(404).json({ success: false, message: "Season not found" });
        }
        await logAudit(req.user, "UPDATE_SEASON", "SEASON", id, `Updated season ${updated.name} (${updated.status})`);
        return res.status(200).json({ success: true, message: "Season updated", season: updated });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to update season", error: err.message });
    }
};

// 6. Get Audit Logs
const getAuditLogs = async (req, res) => {
    try {
        const { limit = 50, entityType, action } = req.query;
        let query = {};
        if (entityType && entityType !== "ALL") query.entityType = entityType;
        if (action) query.action = { $regex: action, $options: "i" };

        const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(Number(limit));
        return res.status(200).json({ success: true, count: logs.length, logs });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch audit logs", error: err.message });
    }
};

// 7. System Health
const getSystemHealth = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalColleges = await College.countDocuments();
        const totalStudents = await Student.countDocuments();
        const totalCompanies = await CompanyProfile.countDocuments();
        const totalDrives = await CompanyDrive.countDocuments();
        const totalApplications = await Application.countDocuments();
        const activeSeasons = await Season.find({ status: "active" });

        return res.status(200).json({
            success: true,
            health: {
                status: "Operational",
                uptime: process.uptime(),
                timestamp: new Date(),
                database: "Connected (MongoDB Atlas)",
                metrics: {
                    totalColleges,
                    totalUsers,
                    totalStudents,
                    totalCompanies,
                    totalDrives,
                    totalApplications,
                    activeSeason: activeSeasons[0]?.name || "2025-2026",
                },
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to get system health", error: err.message });
    }
};

module.exports = {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    getColleges,
    createCollege,
    updateCollege,
    toggleCollegeStatus,
    getSubscriptions,
    getSupportTickets,
    replySupportTicket,
    getSeasons,
    createSeason,
    updateSeason,
    getAuditLogs,
    getSystemHealth,
    logAudit,
};
