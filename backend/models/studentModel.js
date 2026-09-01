const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        personal: {
            fullName: { type: String, default: "" },
            email: { type: String, default: "" },
            phone: { type: String, default: "" },
            department: { type: String, default: "" },
            registerNumber: { type: String, default: "" },
            location: { type: String, default: "" },
            gender: { type: String, default: "" },
            dob: { type: String, default: "" },
        },

        academic: {
            tenthPercentage: { type: mongoose.Schema.Types.Mixed, default: "" },
            twelfthPercentage: { type: mongoose.Schema.Types.Mixed, default: "" },
            schoolName: { type: String, default: "" },
            diplomaInstitution: { type: String, default: "" },
            diplomaSpecialization: { type: String, default: "" },
            cgpa: { type: mongoose.Schema.Types.Mixed, default: "" },
            backlogs: { type: Number, default: 0 },
            backlogHistory: { type: Number, default: 0 },
            graduationYear: { type: mongoose.Schema.Types.Mixed, default: 2026 },
            currentSemester: { type: String, default: "" },
            ugInstitution: { type: String, default: "" },
            ugProgram: { type: String, default: "" },
            ugSpecialization: { type: String, default: "" },
            appNumber: { type: String, default: "" },
            pgInstitution: { type: String, default: "" },
            pgProgram: { type: String, default: "" },
            pgSpecialization: { type: String, default: "" },
            pgGradYear: { type: mongoose.Schema.Types.Mixed, default: "" },
            pgCgpa: { type: mongoose.Schema.Types.Mixed, default: "" },
            pgSemester: { type: String, default: "" },
        },

        professional: {
            skills: [{ type: String }],
            certifications: [{ type: String }],
            projects: [{ type: String }],
            internships: [{ type: String }],
            resumeName: { type: String, default: "" },
            resumeUrl: { type: String, default: "" },
            resumeUploadDate: { type: String, default: "" },
        },

        verificationStatus: {
            type: String,
            enum: ["pending", "verified"],
            default: "pending",
        },

        isVerified: {
            type: Boolean,
            default: false,
        },

        pendingFields: [{ type: String }],

        isProfileComplete: {
            type: Boolean,
            default: false,
        },
    },

    {
        timestamps: true,
        strict: false,
    }
);

module.exports = mongoose.model("Student", studentSchema);