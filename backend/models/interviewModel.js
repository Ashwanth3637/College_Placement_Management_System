const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
    {
        company: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            required: true,
        },
        logo: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["scheduled", "today", "in_progress", "passed", "failed", "cancelled", "rescheduled"],
            default: "scheduled",
        },
        roundTitle: {
            type: String,
            required: true,
        },
        date: {
            type: String,
            required: true,
        },
        time: {
            type: String,
            required: true,
        },
        interviewer: {
            type: String,
            default: "TPO Technical Panel",
        },
        mode: {
            type: String,
            enum: ["Online", "Offline"],
            default: "Online",
        },
        platform: {
            type: String,
            default: "",
        },
        venue: {
            type: String,
            default: "",
        },
        meetingLink: {
            type: String,
            default: "",
        },
        previousDate: {
            type: String,
            default: "",
        },
        previousTime: {
            type: String,
            default: "",
        },
        rescheduleReason: {
            type: String,
            default: "",
        },
        cancelReason: {
            type: String,
            default: "",
        },
        instructions: {
            type: [String],
            default: [
                "Join 10 minutes early",
                "Keep college ID card ready",
                "Ensure stable high-speed internet connection",
                "Keep updated resume copy ready",
            ],
        },
        history: [
            {
                round: String,
                name: String,
                date: String,
                status: String,
            },
        ],
        timeline: [
            {
                round: String,
                title: String,
                date: String,
                status: String,
            },
        ],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Interview", interviewSchema);
