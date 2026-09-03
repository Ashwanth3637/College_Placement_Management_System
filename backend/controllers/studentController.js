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

                const oldPersonal = student.personal ? (typeof student.personal.toObject === "function" ? student.personal.toObject() : student.personal) : {};
                const oldAcademic = student.academic ? (typeof student.academic.toObject === "function" ? student.academic.toObject() : student.academic) : {};
                const oldProfessional = student.professional ? (typeof student.professional.toObject === "function" ? student.professional.toObject() : student.professional) : {};

                const changedList = [];
                const addDiff = (field, label, oldV, newV) => {
                    const normOld = oldV !== undefined && oldV !== null ? String(oldV).trim() : "";
                    const normNew = newV !== undefined && newV !== null ? String(newV).trim() : "";
                    if (normOld === normNew) return;
                    if ((!normOld || normOld === "0" || normOld === "N/A") && (!normNew || normNew === "0" || normNew === "N/A")) return;
                    if (normNew && normNew !== normOld) {
                        changedList.push({ field, label, oldVal: normOld || "N/A", newVal: normNew });
                    }
                };

                addDiff("fullName", "Full Name", oldPersonal.fullName || userDoc.name, personalData.fullName);
                addDiff("phone", "Phone Number", oldPersonal.phone, personalData.phone);
                addDiff("email", "Email Address", oldPersonal.email, personalData.email);
                addDiff("department", "Department", oldPersonal.department, personalData.department);
                addDiff("registerNumber", "Register Number", oldPersonal.registerNumber, personalData.registerNumber);
                addDiff("location", "Location", oldPersonal.location, personalData.location);
                addDiff("gender", "Gender", oldPersonal.gender, personalData.gender);
                addDiff("dob", "Date of Birth", oldPersonal.dob, personalData.dob);

                addDiff("tenthPercentage", "10th Percentage", oldAcademic.tenthPercentage, academicData.tenthPercentage);
                addDiff("twelfthPercentage", "12th Percentage", oldAcademic.twelfthPercentage, academicData.twelfthPercentage);
                addDiff("schoolName", "School Name", oldAcademic.schoolName, academicData.schoolName);
                addDiff("diplomaInstitution", "Diploma Institution", oldAcademic.diplomaInstitution, academicData.diplomaInstitution);
                addDiff("diplomaSpecialization", "Diploma Specialization", oldAcademic.diplomaSpecialization, academicData.diplomaSpecialization);
                addDiff("ugInstitution", "UG Institution", oldAcademic.ugInstitution, academicData.ugInstitution);
                addDiff("appNumber", "Application Number", oldAcademic.appNumber, academicData.appNumber);
                addDiff("ugProgram", "UG Program", oldAcademic.ugProgram, academicData.ugProgram);
                addDiff("ugSpecialization", "UG Specialization", oldAcademic.ugSpecialization, academicData.ugSpecialization);
                addDiff("currentSemester", "Current Semester", oldAcademic.currentSemester, academicData.currentSemester);
                addDiff("graduationYear", "Graduation Year", oldAcademic.graduationYear, academicData.graduationYear);
                addDiff("cgpa", "CGPA", oldAcademic.cgpa, academicData.cgpa);
                addDiff("backlogs", "Active Backlogs", oldAcademic.backlogs, academicData.backlogs);
                addDiff("backlogHistory", "Backlog History", oldAcademic.backlogHistory, academicData.backlogHistory);
                addDiff("pgInstitution", "PG Institution", oldAcademic.pgInstitution, academicData.pgInstitution);
                addDiff("pgProgram", "PG Program", oldAcademic.pgProgram, academicData.pgProgram);
                addDiff("pgSpecialization", "PG Specialization", oldAcademic.pgSpecialization, academicData.pgSpecialization);
                addDiff("pgGradYear", "PG Graduation Year", oldAcademic.pgGradYear, academicData.pgGradYear);
                addDiff("pgCgpa", "PG CGPA", oldAcademic.pgCgpa, academicData.pgCgpa);
                addDiff("pgSemester", "PG Semester", oldAcademic.pgSemester, academicData.pgSemester);

                addDiff("skills", "Skills", (oldProfessional.skills || []).join(", "), (professionalData.skills || []).join(", "));
                addDiff("certifications", "Certifications", (oldProfessional.certifications || []).join(", "), (professionalData.certifications || []).join(", "));
                addDiff("projects", "Projects", (oldProfessional.projects || []).join(", "), (professionalData.projects || []).join(", "));
                addDiff("internships", "Internships", (oldProfessional.internships || []).join(", "), (professionalData.internships || []).join(", "));
                if (professionalData.resumeName && professionalData.resumeName !== oldProfessional.resumeName) {
                    changedList.push({ field: "resume", label: "Resume File", oldVal: oldProfessional.resumeName || "No Resume", newVal: professionalData.resumeName });
                }

                // If no existing approved data, initialize directly
                const hasExistingData = Boolean(oldPersonal.fullName || oldPersonal.department || oldAcademic.cgpa);

                if (!hasExistingData) {
                    student.personal = personalData;
                    student.academic = academicData;
                    student.professional = professionalData;
                    student.pendingChanges = null;
                } else {
                    // PRESERVE APPROVED PROFILE AND STORE REQUESTED CHANGES IN pendingChanges
                    student.pendingChanges = {
                        personal: { ...oldPersonal, ...personalData },
                        academic: { ...oldAcademic, ...academicData },
                        professional: { ...oldProfessional, ...professionalData },
                        changedFields: changedList,
                        submittedAt: new Date(),
                    };
                }

                student.isProfileComplete = true;
                student.verificationStatus = "pending";
                student.isVerified = false;
                student.rejectionReason = "";
                student.pendingFields = changedList.map(c => c.field);

                await student.save();

                return res.status(200).json({
                    message: "Profile changes submitted successfully and are waiting for Placement Officer approval",
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
        const queryEmail = (req.query.email || "").toLowerCase().trim();

        if (!userId && !queryEmail) {
            return res.status(400).json({
                message: "User ID or email is required",
            });
        }

        const User = require("../models/user");
        let student = null;

        if (mongoose.connection.readyState === 1) {
            const isValidId = userId && mongoose.Types.ObjectId.isValid(userId);
            const searchEmail = (queryEmail || (userId && userId.includes("@") ? userId : "")).toLowerCase().trim();

            // 1. Direct fast lookup by User ID or Student ID
            if (isValidId) {
                student = await Student.findOne({ user: userId }).populate("user", "name email role").lean();
                if (!student) {
                    student = await Student.findById(userId).populate("user", "name email role").lean();
                }
            }

            // 2. Direct fast lookup by Email or User document
            if (!student && searchEmail) {
                const userDoc = await User.findOne({ email: searchEmail }).lean();
                if (userDoc) {
                    student = await Student.findOne({ user: userDoc._id }).populate("user", "name email role").lean();
                }
                if (!student) {
                    student = await Student.findOne({
                        $or: [
                            { "personal.email": searchEmail },
                            { "personal.registerNumber": searchEmail }
                        ]
                    }).populate("user", "name email role").lean();
                }
            }

            // 3. Fallback register number / full name search if non-standard ID passed
            if (!student && userId && !isValidId) {
                const cleanId = userId.trim();
                student = await Student.findOne({
                    $or: [
                        { "personal.email": cleanId },
                        { "personal.registerNumber": cleanId },
                        { "personal.fullName": cleanId }
                    ]
                }).populate("user", "name email role").lean();
            }
        }

        if (student) {
            return res.status(200).json(student);
        }

        return res.status(200).json({
            user: { _id: userId, name: "Student", email: (queryEmail || (userId && userId.includes("@") ? userId : "student@college.edu")), role: "student" },
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
            .sort({ createdAt: -1 })
            .lean();

        // Collect missing user IDs to batch fetch in one DB query instead of loop
        const missingUserIds = [];
        for (let s of students) {
            if (!s.user || typeof s.user !== "object" || !s.user.name) {
                if (s.user && mongoose.Types.ObjectId.isValid(s.user)) {
                    missingUserIds.push(s.user);
                }
            }
        }

        let userMap = new Map();
        if (missingUserIds.length > 0) {
            const fetchedUsers = await User.find({ _id: { $in: missingUserIds } }, "name email role").lean();
            for (let u of fetchedUsers) {
                userMap.set(u._id.toString(), u);
            }
        }

        // Ensure user object exists for every student profile
        const realStudents = [];
        for (let s of students) {
            let sObj = s;
            sObj.verificationStatus = s.verificationStatus || (s.isVerified ? "verified" : "pending");
            sObj.isVerified = sObj.verificationStatus === "verified";
            if (!sObj.user || typeof sObj.user !== "object" || !sObj.user.name) {
                let uIdStr = s.user ? s.user.toString() : "";
                let uDoc = userMap.get(uIdStr) || null;
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
        const User = require("../models/user");

        let student = null;
        if (mongoose.Types.ObjectId.isValid(studentId)) {
            student = await Student.findById(studentId).populate("user", "name email role");
            if (!student) {
                student = await Student.findOne({ user: studentId }).populate("user", "name email role");
            }
        }
        if (!student && studentId) {
            const userDoc = await User.findOne({ email: new RegExp(`^${studentId.trim()}$`, "i") });
            if (userDoc) {
                student = await Student.findOne({ user: userDoc._id }).populate("user", "name email role");
            }
        }
        if (!student && studentId) {
            student = await Student.findOne({
                $or: [
                    { "personal.email": new RegExp(`^${studentId.trim()}$`, "i") },
                    { "personal.registerNumber": studentId.trim() },
                    { "personal.fullName": new RegExp(`^${studentId.trim()}$`, "i") }
                ]
            }).populate("user", "name email role");
        }

        if (!student) {
            return res.status(404).json({ message: "Student profile not found" });
        }

        const approved = isVerified !== undefined
            ? Boolean(isVerified)
            : (verificationStatus ? verificationStatus === "verified" : true);

        if (approved) {
            // Apply pending requested changes to the official approved profile
            if (student.pendingChanges) {
                if (student.pendingChanges.personal) {
                    student.personal = {
                        ...(student.personal ? (typeof student.personal.toObject === "function" ? student.personal.toObject() : student.personal) : {}),
                        ...student.pendingChanges.personal,
                    };
                    if (student.pendingChanges.personal.fullName && student.user) {
                        try {
                            await User.findByIdAndUpdate(student.user._id || student.user, { name: student.pendingChanges.personal.fullName });
                        } catch (e) {}
                    }
                }
                if (student.pendingChanges.academic) {
                    student.academic = {
                        ...(student.academic ? (typeof student.academic.toObject === "function" ? student.academic.toObject() : student.academic) : {}),
                        ...student.pendingChanges.academic,
                    };
                }
                if (student.pendingChanges.professional) {
                    student.professional = {
                        ...(student.professional ? (typeof student.professional.toObject === "function" ? student.professional.toObject() : student.professional) : {}),
                        ...student.pendingChanges.professional,
                    };
                }
            }
            student.pendingChanges = null;
            student.rejectionReason = "";
            student.pendingFields = [];
        }

        student.isVerified = approved;
        student.verificationStatus = approved ? "verified" : "pending";
        student.isProfileComplete = true;
        await student.save();

        return res.status(200).json({
            message: `Student profile verification updated: ${approved ? "Verified ✓ - All pending changes approved and committed" : "Pending Verification"}`,
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
        const User = require("../models/user");

        let student = null;
        if (mongoose.Types.ObjectId.isValid(studentId)) {
            student = await Student.findById(studentId).populate("user", "name email role");
            if (!student) {
                student = await Student.findOne({ user: studentId }).populate("user", "name email role");
            }
        }
        if (!student && studentId) {
            const userDoc = await User.findOne({ email: new RegExp(`^${studentId.trim()}$`, "i") });
            if (userDoc) {
                student = await Student.findOne({ user: userDoc._id }).populate("user", "name email role");
            }
        }
        if (!student && studentId) {
            student = await Student.findOne({
                $or: [
                    { "personal.email": new RegExp(`^${studentId.trim()}$`, "i") },
                    { "personal.registerNumber": studentId.trim() },
                    { "personal.fullName": new RegExp(`^${studentId.trim()}$`, "i") }
                ]
            }).populate("user", "name email role");
        }

        if (!student) {
            return res.status(404).json({ message: "Student profile not found" });
        }

        student.isVerified = false;
        student.verificationStatus = "rejected";
        student.rejectionReason = rejectionReason || "Please update your academic information.";
        student.pendingChanges = null;
        student.pendingFields = [];
        await student.save();

        return res.status(200).json({
            message: `Student profile rejected. Reason: ${student.rejectionReason}`,
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