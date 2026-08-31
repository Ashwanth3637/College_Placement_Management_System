const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        reportId: {
            type: String,
            required: true,
            unique: true,
        },
        title: {
            type: String,
            required: true,
            default: "Institutional Placement Analytics Report",
        },
        academicYear: {
            type: String,
            default: "2025-2026",
        },
        department: {
            type: String,
            default: "All Departments",
        },
        batch: {
            type: String,
            default: "All Batches",
        },
        generatedBy: {
            type: String,
            default: "Placement Officer",
        },
        totalStudents: {
            type: Number,
            default: 0,
        },
        placedCount: {
            type: Number,
            default: 0,
        },
        placementRate: {
            type: Number,
            default: 0,
        },
        exportType: {
            type: String,
            enum: ["Snapshot", "PDF", "Excel"],
            default: "Snapshot",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Report", reportSchema);
