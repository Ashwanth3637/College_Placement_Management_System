const Notification = require("../models/notificationModel");

// Get notifications for a user or student
const getNotifications = async (req, res) => {
    try {
        const { userId, email, role, type } = req.query;
        let query = {};

        const conditions = [{ recipientId: "all" }];
        if (role === "student" || !role) {
            conditions.push({ recipientId: "students" });
        }
        if (userId) {
            conditions.push({ recipientId: String(userId) });
        }
        if (email) {
            conditions.push({ recipientEmail: String(email).toLowerCase().trim() });
        }

        query.$or = conditions;

        if (type && type !== "All") {
            query.type = type;
        }

        const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
        res.status(200).json(notifications);
    } catch (error) {
        console.error("Get Notifications Error:", error);
        res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
    }
};

// Create a new notification
const createNotification = async (req, res) => {
    try {
        const { recipientId, recipientEmail, title, message, type, company, driveId, link } = req.body;

        if (!title || !message) {
            return res.status(400).json({ message: "Title and message are required" });
        }

        const notification = new Notification({
            recipientId: recipientId || "all",
            recipientEmail: recipientEmail ? recipientEmail.toLowerCase().trim() : "",
            title,
            message,
            type: type || "General",
            company: company || "",
            driveId: driveId || "",
            link: link || "",
            isRead: false,
        });

        await notification.save();
        res.status(201).json({ message: "Notification created successfully", notification });
    } catch (error) {
        console.error("Create Notification Error:", error);
        res.status(500).json({ message: "Failed to create notification", error: error.message });
    }
};

// Mark single notification as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await Notification.findByIdAndUpdate(
            id,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json({ message: "Notification marked as read", notification });
    } catch (error) {
        console.error("Mark Notification Read Error:", error);
        res.status(500).json({ message: "Failed to update notification", error: error.message });
    }
};

// Mark all as read for a user
const markAllAsRead = async (req, res) => {
    try {
        const { userId, email } = req.body;
        const conditions = [{ recipientId: "all" }, { recipientId: "students" }];
        if (userId) conditions.push({ recipientId: String(userId) });
        if (email) conditions.push({ recipientEmail: String(email).toLowerCase().trim() });

        await Notification.updateMany({ $or: conditions }, { isRead: true });
        res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Mark All Read Error:", error);
        res.status(500).json({ message: "Failed to mark all notifications as read", error: error.message });
    }
};

// Delete notification
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.findByIdAndDelete(id);
        res.status(200).json({ message: "Notification deleted" });
    } catch (error) {
        console.error("Delete Notification Error:", error);
        res.status(500).json({ message: "Failed to delete notification", error: error.message });
    }
};

module.exports = {
    getNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
