const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
    {
        eventId: {
            type: String,
            required: true,
            index: true,
        },
        registerNo: {
            type: String,
            required: true,
        },
        studentName: {
            type: String,
            required: true,
        },
        department: {
            type: String,
            default: "CSE",
        },
        status: {
            type: String,
            enum: ["Present", "Absent", "Not Marked"],
            default: "Not Marked",
        },
        markedBy: {
            type: String,
            default: "Coordinator",
        },
        markedAt: {
            type: Date,
            default: Date.now,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verifiedBy: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

// Compound unique index for eventId and registerNo to prevent duplicates
attendanceSchema.index({ eventId: 1, registerNo: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
