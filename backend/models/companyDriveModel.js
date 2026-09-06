const mongoose = require("mongoose");

const companyDriveSchema = new mongoose.Schema(
    {
        company: {
            type: String,
            required: true,
        },
        jobTitle: {
            type: String,
            default: function () { return this.role || "Software Engineer"; }
        },
        role: {
            type: String,
            default: function () { return this.jobTitle || "Software Engineer"; }
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
            default: function () { return this.ctc || ""; }
        },
        ctc: {
            type: String,
            default: function () { return this.packageCtc || ""; }
        },
        deadline: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["Draft", "Pending Approval", "Approved", "Active", "Rejected", "Closed"],
            default: "Active",
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
            default: 1,
        },
        eligibleBranches: [{ type: String }],
        departments: [{ type: String }],
        department: {
            type: String,
            default: "",
        },
        minCgpa: {
            type: Number,
            default: 0,
        },
        minTenth: {
            type: Number,
            default: 0,
        },
        minTwelfth: {
            type: Number,
            default: 0,
        },
        gradYear: {
            type: Number,
            default: 2026,
        },
        batch: {
            type: String,
            default: "",
        },
        maxBacklogs: {
            type: Number,
            default: 0,
        },
        requiredSkills: [{ type: String }],
        jobDescription: {
            type: String,
            default: "",
        },
        selectionProcess: {
            type: String,
            default: "",
        },
        rounds: [
            {
                roundNumber: { type: Number, required: true },
                roundName: { type: String, required: true },
                mode: { type: String, default: "Online" },
                date: { type: String, default: "" },
                time: { type: String, default: "" },
                venue: { type: String, default: "" },
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

        // Flow 3: Enhanced drive details
        aboutCompany: {
            type: String,
            default: "",
        },
        jobLocations: [{ type: String }],
        roles: [{ type: String }],
        workArrangement: {
            type: String,
            enum: ["Remote", "WFO", "Hybrid", "On-site"],
            default: "WFO",
        },
        internStipend: {
            type: String,
            default: "",
        },
        keyResponsibilities: {
            type: String,
            default: "",
        },
        hiringProcess: {
            type: String,
            default: "",
        },
        eligibleCriteria: {
            type: String,
            default: "",
        },
        optInOutDeadline: {
            type: Date,
            default: null,
        },
        attachments: [{
            name: { type: String, default: "" },
            url: { type: String, default: "" },
            uploadedAt: { type: Date, default: Date.now },
        }],
        collegeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "College",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("CompanyDrive", companyDriveSchema);
