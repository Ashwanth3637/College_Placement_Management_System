const mongoose = require("mongoose");

const companyDriveSchema = new mongoose.Schema(
    {
        company: {
            type: String,
            required: true,
        },
        jobTitle: {
            type: String,
            default: function() { return this.role || "Software Engineer"; }
        },
        role: {
            type: String,
            default: function() { return this.jobTitle || "Software Engineer"; }
        },
        jobType: {
            type: String,
            default: "Full-Time (FTE)"
        },
        location: {
            type: String,
            required: true,
        },
        packageCtc: {
            type: String,
            default: function() { return this.ctc || "₹18.0 LPA"; }
        },
        ctc: {
            type: String,
            default: function() { return this.packageCtc || "₹18.0 LPA"; }
        },
        deadline: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["Draft", "Pending Approval", "Approved", "Active", "Rejected", "Closed"],
            default: "Pending Approval",
        },
        rejectionReason: {
            type: String,
            default: "",
        },
        approvedBy: {
            type: String,
            default: "",
        },
        createdBy: {
            type: String,
            default: "",
        },
        logo: {
            type: String,
            default: "",
        },
        website: {
            type: String,
            default: "",
        },
        recruiterName: {
            type: String,
            default: "",
        },
        recruiterEmail: {
            type: String,
            default: "",
        },
        recruiterMobile: {
            type: String,
            default: "",
        },
        openings: {
            type: Number,
            default: 10,
        },
        eligibleBranches: [{ type: String }],
        minCgpa: {
            type: Number,
            default: 7.0,
        },
        minTenth: {
            type: Number,
            default: 60.0,
        },
        minTwelfth: {
            type: Number,
            default: 60.0,
        },
        gradYear: {
            type: Number,
            default: 2026,
        },
        maxBacklogs: {
            type: Number,
            default: 0,
        },
        requiredSkills: [{ type: String }],
        jobDescription: {
            type: String,
            default: "Responsible for software development, technical problem solving, and building scalable applications.",
        },
        selectionProcess: {
            type: String,
            default: "Aptitude Test → Technical Interview → HR Round",
        },
        rounds: [
            {
                roundNumber: { type: Number, default: 1 },
                roundName: { type: String, default: "Round 1: Online Assessment" },
                mode: { type: String, enum: ["Online", "Offline", "Hybrid"], default: "Online" },
                date: { type: String, default: "" },
                description: { type: String, default: "" },
            }
        ],
        workMode: {
            type: String,
            enum: ["On-site", "Hybrid", "Remote"],
            default: "On-site",
        },
        bondAgreement: {
            type: String,
            default: "None",
        },
        benefitsPerks: {
            type: String,
            default: "",
        },
        additionalInstructions: {
            type: String,
            default: "",
        },
        bgColor: {
            type: String,
            default: "#f8fafc",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("CompanyDrive", companyDriveSchema);
