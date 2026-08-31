const mongoose = require("mongoose");

const selectionSchema = new mongoose.Schema(
    {
        selectionId: {
            type: String,
            required: true,
            unique: true,
        },
        studentName: {
            type: String,
            required: true,
        },
        regNo: {
            type: String,
            required: true,
        },
        department: {
            type: String,
            default: "Computer Science & Engineering",
        },
        companyName: {
            type: String,
            required: true,
        },
        jobRole: {
            type: String,
            required: true,
        },
        finalRound: {
            type: String,
            default: "Round 1",
        },
        result: {
            type: String,
            enum: ["Passed", "Failed"],
            default: "Passed",
        },
        status: {
            type: String,
            enum: [
                "Shortlisted",
                "Selected",
                "Offer Released",
                "Offer Accepted",
                "Offer Declined",
                "Rejected",
            ],
            default: "Shortlisted",
        },
        ctc: {
            type: String,
            default: "₹12 LPA",
        },
        location: {
            type: String,
            default: "Chennai",
        },
        academicYear: {
            type: String,
            default: "2025-2026",
        },
        offerDate: {
            type: String,
            default: "22 Aug 2026",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Selection", selectionSchema);
