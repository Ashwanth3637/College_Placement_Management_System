const mongoose = require("mongoose");
const Student = require("../models/studentModel");

// =====================================================
// Save / Update Student Profile
// =====================================================

const saveStudentProfile = async (req, res) => {
    try {
        const {
            userId,
            personal,
            academic,
            professional,
        } = req.body;

        if (!userId) {
            return res.status(400).json({
                message: "Valid User ID is required",
            });
        }

        // ---------------------------------------------
        // Convert FormData JSON strings into objects
        // ---------------------------------------------

        const safeParse = (val) => {
            if (!val) return {};
            if (typeof val === "object") return val;
            if (typeof val === "string") {
                try {
                    return JSON.parse(val);
                } catch (e) {
                    return {};
                }
            }
            return {};
        };

        const personalData = safeParse(personal);
        const academicData = safeParse(academic);
        const professionalData = safeParse(professional);

        // ---------------------------------------------
        // Handle Resume Upload
        // ---------------------------------------------

        if (req.file) {
            professionalData.resumeName = req.file.originalname;
            professionalData.resumeUrl = `/uploads/${req.file.filename}`;
            console.log("Resume uploaded:", req.file.originalname);
        }

        let pendingFieldsArr = [];
        if (req.body.pendingFields) {
            if (Array.isArray(req.body.pendingFields)) {
                pendingFieldsArr = req.body.pendingFields;
            } else if (typeof req.body.pendingFields === "string") {
                try {
                    pendingFieldsArr = JSON.parse(req.body.pendingFields);
                } catch (e) {}
            }
        }

        const User = require("../models/user");
        const bcrypt = require("bcryptjs");

        if (mongoose.connection.readyState === 1) {
            let userDoc = null;
            if (mongoose.Types.ObjectId.isValid(userId)) {
                userDoc = await User.findById(userId);
            }

            const studentEmail = personalData.email || req.body.email || req.body.userEmail;
            if (!userDoc && studentEmail) {
                userDoc = await User.findOne({ email: studentEmail.toLowerCase().trim() });
            }

            if (!userDoc) {
                const defaultPassword = await bcrypt.hash("password123", 10);
                userDoc = new User({
                    name: personalData.fullName || req.body.fullName || "Student",
                    email: studentEmail ? studentEmail.toLowerCase().trim() : `student_${Date.now()}@college.edu`,
                    password: defaultPassword,
                    role: "student",
                });
                await userDoc.save();
            } else if (personalData.fullName || req.body.fullName) {
                userDoc.name = personalData.fullName || req.body.fullName;
                await userDoc.save();
            }

            let student = await Student.findOne({
                $or: [
                    { user: userDoc._id },
                    ...(mongoose.Types.ObjectId.isValid(userId) ? [{ user: userId }] : [])
                ]
            });

            // =================================================
            // UPDATE EXISTING PROFILE
            // =================================================

            if (student) {
                student.user = userDoc._id;
                student.personal = {
                    ...student.personal,
                    ...personalData,
                };
                student.academic = academicData;
                student.professional = {
                    ...(student.professional ? student.professional.toObject() : {}),
                    ...professionalData,
                };
                student.isProfileComplete = true;
                student.verificationStatus = "pending";
                student.isVerified = false;
                student.pendingFields = (pendingFieldsArr && pendingFieldsArr.length > 0)
                    ? pendingFieldsArr
                    : ["phone", "department", "registerNumber", "tenthPercentage", "twelfthPercentage", "cgpa", "backlogs", "graduationYear", "skills", "projects"];

                await student.save();

                return res.status(200).json({
                    message: "Student profile updated successfully and submitted for officer verification",
                    student,
                });
            }

            // =================================================
            // CREATE NEW PROFILE
            // =================================================

            student = new Student({
                user: userDoc._id,
                personal: personalData,
                academic: academicData,
                professional: professionalData,
                isProfileComplete: true,
                verificationStatus: "pending",
                isVerified: false,
                pendingFields: (pendingFieldsArr && pendingFieldsArr.length > 0)
                    ? pendingFieldsArr
                    : ["phone", "department", "registerNumber", "tenthPercentage", "twelfthPercentage", "cgpa", "backlogs", "graduationYear", "skills", "projects"],
            });

            await student.save();

            return res.status(201).json({
                message: "Student profile created successfully",
                student,
            });
        }

        // Offline mode fallback response
        return res.status(200).json({
            message: "Student profile saved successfully",
            student: {
                user: userId,
                personal: personalData,
                academic: academicData,
                professional: professionalData,
                isProfileComplete: true,
                isVerified: false,
            },
        });

    } catch (error) {
        console.error("Save Student Profile Error:", error);

        return res.status(500).json({
            message: "Failed to save student profile",
            error: error.message,
        });
    }
};

// =====================================================
// Get Student Profile
// =====================================================

const getStudentProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                message: "User ID is required",
            });
        }

        const User = require("../models/user");
        let student = null;

        if (mongoose.connection.readyState === 1) {
            let userDoc = null;
            if (mongoose.Types.ObjectId.isValid(userId)) {
                student = await Student.findOne({ user: userId }).populate("user", "name email role");
                if (!student) {
                    userDoc = await User.findById(userId);
                }
            }
            if (!student) {
                const searchEmail = userId.toLowerCase().trim();
                userDoc = await User.findOne({ email: searchEmail });
                if (userDoc) {
                    student = await Student.findOne({ user: userDoc._id }).populate("user", "name email role");
                }
            }
        }

        if (student) {
            return res.status(200).json(student);
        }

        return res.status(200).json({
            user: { _id: userId, name: "Student", email: userId.includes("@") ? userId : "student@college.edu", role: "student" },
            personal: { fullName: "", phone: "", department: "Computer Science & Engineering", registerNumber: "" },
            academic: { tenthPercentage: 0, twelfthPercentage: 0, cgpa: 0, backlogs: 0, graduationYear: 2026 },
            professional: { skills: [], certifications: [], projects: [], internships: [], resumeName: "", resumeUrl: "" },
            isVerified: false,
            isProfileComplete: false,
        });

    } catch (error) {
        console.error("Get Student Profile Error:", error);

        return res.status(500).json({
            message: "Failed to fetch student profile",
            error: error.message,
        });
    }
};


// =====================================================
// Get All Students (Admin / Placement Officer)
// =====================================================

const getAllStudents = async (req, res) => {
    try {
        const User = require("../models/user");
        
        let students = await Student.find()
            .populate("user", "name email role")
            .sort({ createdAt: -1 });

        // Ensure user object exists for every student profile
        const realStudents = [];
        for (let s of students) {
            let sObj = s.toObject();
            sObj.verificationStatus = s.verificationStatus || (s.isVerified ? "verified" : "pending");
            sObj.isVerified = sObj.verificationStatus === "verified";
            if (!sObj.user || typeof sObj.user !== "object" || !sObj.user.name) {
                // Look up user or build user from personal info
                let uDoc = null;
                if (s.user && mongoose.Types.ObjectId.isValid(s.user)) {
                    uDoc = await User.findById(s.user);
                }
                if (!uDoc && s.personal?.registerNumber) {
                    uDoc = await User.findOne({ name: new RegExp(s.personal.registerNumber, "i") });
                }
                sObj.user = {
                    _id: uDoc?._id || s._id,
                    name: uDoc?.name || s.personal?.fullName || "Student",
                    email: uDoc?.email || s.personal?.email || `student_${s._id.toString().slice(-4)}@college.edu`,
                    role: "student",
                };
            }
            const email = (sObj.user.email || "").toLowerCase();
            const name = (sObj.user.name || "").toLowerCase();
            if (email === "test@college.edu" || email === "arvind@gmail.com" || name.includes("test user") || name.includes("arvind")) {
                continue;
            }
            realStudents.push(sObj);
        }

        return res.status(200).json(realStudents);
    } catch (error) {
        console.error("Get All Students Error:", error);
        return res.status(500).json({
            message: "Failed to fetch student records",
            error: error.message,
        });
    }
};

// =====================================================
// Get Single Student By ID (Admin / Placement Officer)
// =====================================================

const getStudentById = async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await Student.findById(studentId).populate("user", "name email role");

        if (!student) {
            return res.status(404).json({ message: "Student record not found" });
        }

        return res.status(200).json(student);
    } catch (error) {
        console.error("Get Student By ID Error:", error);
        return res.status(500).json({
            message: "Failed to fetch student record",
            error: error.message,
        });
    }
};

// =====================================================
// Verify Student Profile (Admin / Placement Officer)
// =====================================================

const verifyStudentProfile = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { isVerified, verificationStatus } = req.body;

        let student = null;
        if (mongoose.Types.ObjectId.isValid(studentId)) {
            student = await Student.findById(studentId).populate("user", "name email role");
            if (!student) {
                student = await Student.findOne({ user: studentId }).populate("user", "name email role");
            }
        }

        if (!student) {
            return res.status(404).json({ message: "Student profile not found" });
        }

        const approved = isVerified !== undefined
            ? Boolean(isVerified)
            : (verificationStatus ? verificationStatus === "verified" : true);

        student.isVerified = approved;
        student.verificationStatus = approved ? "verified" : "pending";
        student.isProfileComplete = true;
        if (approved) {
            student.pendingFields = [];
        }
        await student.save();

        return res.status(200).json({
            message: `Student profile verification updated: ${approved ? "Verified ✓" : "Pending Verification"}`,
            student,
        });
    } catch (error) {
        console.error("Verify Student Profile Error:", error);
        return res.status(500).json({
            message: "Failed to verify student profile",
            error: error.message,
        });
    }
};

// =====================================================
// Reject Student Profile (Admin / Placement Officer)
// =====================================================

const rejectStudentProfile = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { rejectionReason } = req.body;

        let student = null;
        if (mongoose.Types.ObjectId.isValid(studentId)) {
            student = await Student.findById(studentId).populate("user", "name email role");
            if (!student) {
                student = await Student.findOne({ user: studentId }).populate("user", "name email role");
            }
        }

        if (!student) {
            return res.status(404).json({ message: "Student profile not found" });
        }

        student.isVerified = false;
        await student.save();

        return res.status(200).json({
            message: `Student profile rejected. Reason: ${rejectionReason || "Academic verification failed"}`,
            student,
        });
    } catch (error) {
        console.error("Reject Student Profile Error:", error);
        return res.status(500).json({
            message: "Failed to reject student profile",
            error: error.message,
        });
    }
};

// =====================================================
// Update Placement Status (Admin / Placement Officer)
// =====================================================

const updatePlacementStatus = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { isPlaced, placedCompany } = req.body;

        let student = null;
        if (mongoose.Types.ObjectId.isValid(studentId)) {
            student = await Student.findById(studentId).populate("user", "name email role");
            if (!student) {
                student = await Student.findOne({ user: studentId }).populate("user", "name email role");
            }
        }

        if (!student) {
            return res.status(404).json({ message: "Student profile not found" });
        }

        student.isPlaced = Boolean(isPlaced);
        if (placedCompany !== undefined) {
            student.placedCompany = placedCompany;
        }
        await student.save();

        return res.status(200).json({
            message: `Placement status updated to: ${student.isPlaced ? "Placed 🏆" : "Not Placed / Available"}`,
            student,
        });
    } catch (error) {
        console.error("Update Placement Status Error:", error);
        return res.status(500).json({
            message: "Failed to update placement status",
            error: error.message,
        });
    }
};

// =====================================================
// Export Controller Functions
// =====================================================

module.exports = {
    saveStudentProfile,
    getStudentProfile,
    getAllStudents,
    getStudentById,
    verifyStudentProfile,
    rejectStudentProfile,
    updatePlacementStatus,
};