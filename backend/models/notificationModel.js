const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipientId: {
            type: String,
            default: "all", // "all", "students", or specific userId / email
        },
        recipientEmail: {
            type: String,
            default: "",
        },
        title: {
            type: String,
            required: [true, "Notification title is required"],
            trim: true,
        },
        message: {
            type: String,
            required: [true, "Notification message is required"],
            trim: true,
        },
        type: {
            type: String,
            enum: ["Shortlists", "Deadlines", "Eligible", "Drives", "General", "Interview"],
            default: "General",
        },
        company: {
            type: String,
            default: "",
        },
        driveId: {
            type: String,
            default: "",
        },
        link: {
            type: String,
            default: "",
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Notification", notificationSchema);
