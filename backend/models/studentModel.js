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
            phone: { type: String, default: "" },
            department: {
                type: String,
                default: "Computer Science & Engineering",
            },
            registerNumber: {
                type: String,
                default: "",
            },
        },

        academic: {
            tenthPercentage: {
                type: Number,
                default: 0,
            },
            twelfthPercentage: {
                type: Number,
                default: 0,
            },
            cgpa: {
                type: Number,
                default: 0,
            },
            backlogs: {
                type: Number,
                default: 0,
            },
            graduationYear: {
                type: Number,
                default: 2026,
            },
        },

        professional: {
            skills: [{ type: String }],
            certifications: [{ type: String }],
            projects: [{ type: String }],
            internships: [{ type: String }],

            resumeName: {
                type: String,
                default: "",
            },

            resumeUrl: {
                type: String,
                default: "",
            },
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
    }
);

module.exports = mongoose.model("Student", studentSchema);