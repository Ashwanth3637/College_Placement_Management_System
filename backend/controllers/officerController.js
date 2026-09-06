const mongoose = require("mongoose");
const College = require("../models/collegeModel");
const User = require("../models/user");
const Student = require("../models/studentModel");

// =====================================================
// Get College Settings (for logged-in officer)
// =====================================================
const getCollegeSettings = async (req, res) => {
    try {
        const { userId, email } = req.query;

        let college = null;

        // Try finding by officer's userId → collegeId
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            const userDoc = await User.findById(userId);
            if (userDoc && userDoc.collegeId) {
                college = await College.findById(userDoc.collegeId);
            }
            if (!college) {
                college = await College.findOne({ placementOfficerId: userId });
            }
        }

        // Try finding by officer's email
        if (!college && email) {
            const normalizedEmail = email.toLowerCase().trim();
            const userDoc = await User.findOne({ email: normalizedEmail });
            if (userDoc && userDoc.collegeId) {
                college = await College.findById(userDoc.collegeId);
            }
            if (!college) {
                college = await College.findOne({ contactEmail: normalizedEmail });
            }
        }

        if (!college) {
            // Return default empty settings
            return res.status(200).json({
                success: true,
                college: null,
                message: "No college linked to this officer account.",
            });
        }

        return res.status(200).json({
            success: true,
            college: {
                id: college._id,
                name: college.name,
                code: college.code,
                email: college.email,
                allowedEmailDomains: college.allowedEmailDomains || [],
                departments: college.departments || [],
                status: college.status,
                currentPlan: college.currentPlan,
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch college settings", error: err.message });
    }
};

// =====================================================
// Update College Settings (email domains + departments)
// =====================================================
const updateCollegeSettings = async (req, res) => {
    try {
        const { userId, email, allowedEmailDomains, departments } = req.body;

        let college = null;

        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
            const userDoc = await User.findById(userId);
            if (userDoc && userDoc.collegeId) {
                college = await College.findById(userDoc.collegeId);
            }
            if (!college) {
                college = await College.findOne({ placementOfficerId: userId });
            }
        }

        if (!college && email) {
            const normalizedEmail = email.toLowerCase().trim();
            const userDoc = await User.findOne({ email: normalizedEmail });
            if (userDoc && userDoc.collegeId) {
                college = await College.findById(userDoc.collegeId);
            }
            if (!college) {
                college = await College.findOne({ contactEmail: normalizedEmail });
            }
        }

        if (!college) {
            return res.status(404).json({ success: false, message: "No college found for this officer." });
        }

        // Update fields
        if (allowedEmailDomains !== undefined) {
            college.allowedEmailDomains = Array.isArray(allowedEmailDomains)
                ? allowedEmailDomains.map(d => d.toLowerCase().trim())
                : [];
        }
        if (departments !== undefined) {
            college.departments = Array.isArray(departments) ? departments : [];
        }

        await college.save();

        return res.status(200).json({
            success: true,
            message: "College settings updated successfully.",
            college: {
                id: college._id,
                name: college.name,
                allowedEmailDomains: college.allowedEmailDomains,
                departments: college.departments,
            },
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to update college settings", error: err.message });
    }
};

// =====================================================
// Get Pending Verification Students (for officer)
// =====================================================
const getPendingStudents = async (req, res) => {
    try {
        const { status } = req.query; // "pending", "verified", "rejected", or "all"
        let query = {};

        if (status && status !== "all") {
            query.verificationStatus = status;
        }

        const students = await Student.find(query)
            .populate("user", "name email role isFrozen")
            .sort({ updatedAt: -1 })
            .lean();

        // Ensure user data exists
        const result = students.map(s => ({
            ...s,
            id: s._id,
            user: s.user || {
                _id: s._id,
                name: s.personal?.fullName || "Student",
                email: s.personal?.email || "",
                role: "student",
            },
        }));

        return res.status(200).json({ success: true, students: result });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to fetch students", error: err.message });
    }
};

// =====================================================
// Unfreeze a Student Account (Flow 4)
// =====================================================
const unfreezeStudent = async (req, res) => {
    try {
        const { studentId } = req.params;

        let user = null;
        // Try finding user directly
        if (mongoose.Types.ObjectId.isValid(studentId)) {
            user = await User.findById(studentId);
            if (!user) {
                // Maybe studentId is a Student doc ID
                const student = await Student.findById(studentId);
                if (student && student.user) {
                    user = await User.findById(student.user);
                }
            }
        }

        if (!user) {
            return res.status(404).json({ success: false, message: "Student user not found." });
        }

        user.isFrozen = false;
        user.frozenAt = null;
        await user.save();

        return res.status(200).json({
            success: true,
            message: `Account for ${user.name} (${user.email}) has been unfrozen successfully.`,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to unfreeze student", error: err.message });
    }
};

// =====================================================
// Freeze a Student Account (Flow 4)
// =====================================================
const freezeStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { reason } = req.body;

        let user = null;
        if (mongoose.Types.ObjectId.isValid(studentId)) {
            user = await User.findById(studentId);
            if (!user) {
                const student = await Student.findById(studentId);
                if (student && student.user) {
                    user = await User.findById(student.user);
                }
            }
        }

        if (!user) {
            return res.status(404).json({ success: false, message: "Student user not found." });
        }

        user.isFrozen = true;
        user.frozenAt = new Date();
        await user.save();

        return res.status(200).json({
            success: true,
            message: `Account for ${user.name} (${user.email}) has been frozen.${reason ? " Reason: " + reason : ""}`,
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to freeze student", error: err.message });
    }
};

module.exports = {
    getCollegeSettings,
    updateCollegeSettings,
    getPendingStudents,
    unfreezeStudent,
    freezeStudent,
};
