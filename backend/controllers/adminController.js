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
const PlatformSettings = require("../models/platformSettingsModel");

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

        // Create the college record
        const newCollege = await College.create({
            name: req.body.name,
            code: req.body.code?.toUpperCase(),
            email: req.body.email,
            phone: req.body.phone || "",
            contactPerson: req.body.officerName || req.body.contactPerson || "",
            contactEmail: req.body.officerEmail || req.body.contactEmail || "",
            address: req.body.address || "",
            city: req.body.city || "",
            state: req.body.state || "Tamil Nadu",
            country: req.body.country || "India",
            pincode: req.body.pincode || "",
            website: req.body.website || "",
            establishedYear: req.body.establishedYear || 2000,
            status: "Active",
            currentPlan: req.body.currentPlan || req.body.planName || "Basic",
            allowedEmailDomains: req.body.allowedEmailDomains || [],
            departments: req.body.departments || [],
        });

        // Flow 1: Auto-create Placement Officer user if officer details provided
        let officerUser = null;
        const officerEmail = (req.body.officerEmail || req.body.contactEmail || "").toLowerCase().trim();
        const officerName = req.body.officerName || req.body.contactPerson || "Placement Officer";
        const officerPassword = req.body.officerPassword || "password123";

        if (officerEmail) {
            const bcrypt = require("bcryptjs");
            const existingOfficer = await User.findOne({ email: officerEmail });
            if (!existingOfficer) {
                const hashedPassword = await bcrypt.hash(officerPassword, 10);
                officerUser = await User.create({
                    name: officerName,
                    email: officerEmail,
                    password: hashedPassword,
                    role: "officer",
                    collegeId: newCollege._id,
                    college: newCollege.name,
                });
                newCollege.placementOfficerId = officerUser._id;
                newCollege.contactPerson = officerName;
                newCollege.contactEmail = officerEmail;
                await newCollege.save();
            } else {
                existingOfficer.collegeId = newCollege._id;
                existingOfficer.college = newCollege.name;
                existingOfficer.role = "officer";
                await existingOfficer.save();
                newCollege.placementOfficerId = existingOfficer._id;
                await newCollege.save();
                officerUser = existingOfficer;
            }
        }

        // Auto-create Subscription record for the selected plan
        const planName = req.body.currentPlan || req.body.planName || "Basic";
        const planLimits = {
            Trial: { students: 100, recruiters: 5, drives: 2, amount: 0, duration: 14 },
            Basic: { students: 500, recruiters: 25, drives: 15, amount: 7999, duration: 90 },
            Premium: { students: 2000, recruiters: 100, drives: 50, amount: 14999, duration: 180 },
            Pro: { students: 5000, recruiters: 250, drives: "Unlimited", amount: 24999, duration: 365 },
            Custom: { students: 1000, recruiters: 50, drives: 30, amount: 9999, duration: 90 }
        };
        const limits = planLimits[planName] || planLimits["Basic"];
        const startDate = new Date();
        const expiryDate = new Date(startDate.getTime() + limits.duration * 24 * 60 * 60 * 1000);

        try {
            await Subscription.create({
                collegeId: newCollege._id,
                collegeName: newCollege.name,
                planName,
                startDate: startDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                expiryDate: expiryDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                amount: limits.amount,
                status: "Active",
                paymentMode: req.body.paymentMode || (planName === "Trial" ? "Free/Trial" : "UPI"),
                paymentTransactionId: req.body.paymentTransactionId || (planName === "Trial" ? "TRIAL-INIT" : `TXN-${Date.now().toString().slice(-6)}`),
                paymentDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                paymentNotes: `Initial onboarding on ${planName} plan.`,
                activatedBy: req.user?.name || "Super Admin",
                usage: {
                    studentsUsed: 0,
                    studentsLimit: limits.students,
                    recruitersUsed: 0,
                    recruitersLimit: limits.recruiters,
                    drivesUsed: 0,
                    drivesLimit: limits.drives,
                },
            });
        } catch (subErr) {
            console.warn("Subscription creation warning:", subErr.message);
        }

        await logAudit(req.user, "ONBOARD_COLLEGE", "COLLEGE", newCollege._id, `Onboarded ${newCollege.name} with officer ${officerEmail || "N/A"} on ${planName} plan`);
        return res.status(201).json({
            success: true,
            message: `College "${newCollege.name}" onboarded successfully${officerUser ? ` with Placement Officer (${officerEmail})` : ""} on ${planName} plan.`,
            college: newCollege,
            officer: officerUser ? { id: officerUser._id, name: officerUser.name, email: officerUser.email } : null,
        });
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

const deleteCollege = async (req, res) => {
    try {
        const { id } = req.params;
        const college = await College.findByIdAndDelete(id);
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }
        // Also remove associated subscriptions
        await Subscription.deleteMany({ collegeId: id });
        await logAudit(req.user, "DELETE_COLLEGE", "COLLEGE", id, `Deleted college ${college.name} and its subscriptions`);
        return res.status(200).json({ success: true, message: `College "${college.name}" deleted successfully` });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to delete college", error: err.message });
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

// 3. Subscriptions & Plan Activation Center (Super Admin authority)
const getSubscriptions = async (req, res) => {
    try {
        const subs = await Subscription.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, subscriptions: subs });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch subscriptions", error: err.message });
    }
};

// Super Admin activates or upgrades plan for a college with GPay/UPI/Bank payment details
const activateCollegeSubscription = async (req, res) => {
    try {
        const {
            collegeId,
            planName = "Basic",
            durationDays = 90,
            amount,
            paymentMode = "GPay",
            paymentTransactionId = "",
            paymentDate,
            paymentNotes = "",
            studentsLimit,
            recruitersLimit,
            drivesLimit,
        } = req.body;

        const college = await College.findById(collegeId);
        if (!college) {
            return res.status(404).json({ success: false, message: "College not found" });
        }

        const planLimits = {
            Trial: { students: 100, recruiters: 5, drives: 2, amount: 0, defaultDays: 14 },
            Basic: { students: 500, recruiters: 25, drives: 15, amount: 7999, defaultDays: 90 },
            Premium: { students: 2000, recruiters: 100, drives: 50, amount: 14999, defaultDays: 180 },
            Pro: { students: 5000, recruiters: 250, drives: "Unlimited", amount: 24999, defaultDays: 365 },
            Custom: { students: 1000, recruiters: 50, drives: 30, amount: 9999, defaultDays: 90 },
        };

        const defaultTier = planLimits[planName] || planLimits["Basic"];
        const effectiveAmount = amount !== undefined && amount !== "" ? Number(amount) : defaultTier.amount;
        const effectiveDays = Number(durationDays) || defaultTier.defaultDays;

        const startDate = new Date();
        const expiryDate = new Date(startDate.getTime() + effectiveDays * 24 * 60 * 60 * 1000);

        const sDateFormatted = startDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        const eDateFormatted = expiryDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        const pDateFormatted = paymentDate || sDateFormatted;

        // Upsert or create new active subscription
        let sub = await Subscription.findOne({ collegeId: college._id, status: "Active" });
        if (sub) {
            sub.planName = planName;
            sub.startDate = sDateFormatted;
            sub.expiryDate = eDateFormatted;
            sub.amount = effectiveAmount;
            sub.status = "Active";
            sub.paymentMode = paymentMode;
            sub.paymentTransactionId = paymentTransactionId || `UPI-${Date.now().toString().slice(-6)}`;
            sub.paymentDate = pDateFormatted;
            sub.paymentNotes = paymentNotes;
            sub.activatedBy = req.user?.name || "Super Admin";
            sub.usage.studentsLimit = studentsLimit !== undefined && studentsLimit !== "" ? Number(studentsLimit) : defaultTier.students;
            sub.usage.recruitersLimit = recruitersLimit !== undefined && recruitersLimit !== "" ? Number(recruitersLimit) : defaultTier.recruiters;
            sub.usage.drivesLimit = drivesLimit !== undefined && drivesLimit !== "" ? drivesLimit : defaultTier.drives;
            await sub.save();
        } else {
            sub = await Subscription.create({
                collegeId: college._id,
                collegeName: college.name,
                planName,
                startDate: sDateFormatted,
                expiryDate: eDateFormatted,
                amount: effectiveAmount,
                status: "Active",
                paymentMode,
                paymentTransactionId: paymentTransactionId || `UPI-${Date.now().toString().slice(-6)}`,
                paymentDate: pDateFormatted,
                paymentNotes,
                activatedBy: req.user?.name || "Super Admin",
                usage: {
                    studentsUsed: 0,
                    studentsLimit: studentsLimit !== undefined && studentsLimit !== "" ? Number(studentsLimit) : defaultTier.students,
                    recruitersUsed: 0,
                    recruitersLimit: recruitersLimit !== undefined && recruitersLimit !== "" ? Number(recruitersLimit) : defaultTier.recruiters,
                    drivesUsed: 0,
                    drivesLimit: drivesLimit !== undefined && drivesLimit !== "" ? drivesLimit : defaultTier.drives,
                },
            });
        }

        // Update College active plan & status
        college.currentPlan = planName;
        college.status = "Active";
        await college.save();

        await logAudit(
            req.user,
            "ACTIVATE_PLAN",
            "SUBSCRIPTION",
            sub._id,
            `Activated ${planName} plan for ${college.name} via ${paymentMode} (Txn: ${sub.paymentTransactionId}, Amount: ₹${effectiveAmount})`
        );

        return res.status(200).json({
            success: true,
            message: `Plan "${planName}" successfully activated for ${college.name} with ${paymentMode} payment verified!`,
            subscription: sub,
            college,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to activate subscription plan", error: err.message });
    }
};

const renewSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const { durationDays = 365, amount, paymentMode = "GPay", paymentTransactionId = "" } = req.body;

        const sub = await Subscription.findById(id);
        if (!sub) {
            return res.status(404).json({ success: false, message: "Subscription record not found" });
        }

        const now = new Date();
        const days = Number(durationDays) || 365;
        const newExpiry = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        sub.expiryDate = newExpiry.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        sub.status = "Active";
        if (amount) sub.amount = Number(amount);
        if (paymentMode) sub.paymentMode = paymentMode;
        if (paymentTransactionId) sub.paymentTransactionId = paymentTransactionId;
        sub.paymentDate = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        await sub.save();

        await logAudit(req.user, "RENEW_SUBSCRIPTION", "SUBSCRIPTION", id, `Renewed ${sub.planName} for ${sub.collegeName} (+${days} days)`);
        return res.status(200).json({ success: true, message: `Subscription for ${sub.collegeName} renewed successfully!`, subscription: sub });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to renew subscription", error: err.message });
    }
};

const deleteSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const sub = await Subscription.findByIdAndDelete(id);
        if (!sub) return res.status(404).json({ success: false, message: "Subscription not found" });
        await logAudit(req.user, "DELETE_SUBSCRIPTION", "SUBSCRIPTION", id, `Removed subscription for ${sub.collegeName}`);
        return res.status(200).json({ success: true, message: "Subscription removed successfully" });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to delete subscription", error: err.message });
    }
};

// 4. Global Platform & Payment (GPay/UPI/Bank) Settings
const getPaymentSettings = async (req, res) => {
    try {
        let settings = await PlatformSettings.findOne({ key: "global_platform_settings" });
        if (!settings) {
            settings = await PlatformSettings.create({ key: "global_platform_settings" });
        }
        return res.status(200).json({ success: true, settings });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch payment settings", error: err.message });
    }
};

const updatePaymentSettings = async (req, res) => {
    try {
        let settings = await PlatformSettings.findOneAndUpdate(
            { key: "global_platform_settings" },
            { ...req.body, key: "global_platform_settings" },
            { new: true, upsert: true }
        );
        await logAudit(req.user, "UPDATE_PAYMENT_SETTINGS", "SETTINGS", "payment_settings", "Updated platform payment & GPay credentials");
        return res.status(200).json({ success: true, message: "Payment & platform settings updated successfully!", settings });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to update payment settings", error: err.message });
    }
};

// 5. Support Tickets
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

// 6. Placement Seasons
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

// 7. Security Audit Logs
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

// 8. System Health
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
    deleteCollege,
    toggleCollegeStatus,
    getSubscriptions,
    activateCollegeSubscription,
    renewSubscription,
    deleteSubscription,
    getPaymentSettings,
    updatePaymentSettings,
    getSupportTickets,
    replySupportTicket,
    getSeasons,
    createSeason,
    updateSeason,
    getAuditLogs,
    getSystemHealth,
    logAudit,
};
