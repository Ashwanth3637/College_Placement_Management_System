const mongoose = require("mongoose");
const Attendance = require("../models/attendanceModel");
const Announcement = require("../models/announcementModel");

// GET /api/coordinator/events
const getCoordinatorEvents = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            events: []
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/coordinator/events/:eventId/attendance
const getEventAttendance = async (req, res) => {
    try {
        const { eventId } = req.params;

        if (mongoose.connection.readyState === 1) {
            const dbRecords = await Attendance.find({ eventId });
            if (dbRecords && dbRecords.length > 0) {
                let isEventVerified = false;
                let verifiedByName = "";

                const mapped = dbRecords.map(r => {
                    if (r.isVerified) {
                        isEventVerified = true;
                        verifiedByName = r.verifiedBy || "Coordinator";
                    }
                    return {
                        registerNo: r.registerNo,
                        studentName: r.studentName,
                        department: r.department,
                        attendance: r.status || "Not Marked"
                    };
                });

                return res.status(200).json({
                    success: true,
                    eventId,
                    attendance: mapped,
                    isVerified: isEventVerified,
                    verifiedBy: verifiedByName
                });
            }
        }

        return res.status(200).json({
            success: true,
            eventId,
            attendance: [],
            isVerified: false,
            verifiedBy: ""
        });
    } catch (error) {
        console.error("Error in getEventAttendance:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// PUT / POST /api/coordinator/events/:eventId/attendance
const saveEventAttendance = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { attendanceRecords, markedBy, isVerified } = req.body;

        if (!Array.isArray(attendanceRecords)) {
            return res.status(400).json({ success: false, message: "attendanceRecords array is required" });
        }

        if (mongoose.connection.readyState === 1) {
            const bulkOps = attendanceRecords.map(item => ({
                updateOne: {
                    filter: { eventId, registerNo: item.registerNo },
                    update: {
                        $set: {
                            studentName: item.studentName,
                            department: item.department,
                            status: item.attendance || "Not Marked",
                            markedBy: markedBy || "Coordinator",
                            isVerified: Boolean(isVerified),
                            verifiedBy: isVerified ? (markedBy || "Prof. Rajesh Sharma (Coordinator)") : "",
                            markedAt: new Date()
                        }
                    },
                    upsert: true
                }
            }));

            await Attendance.bulkWrite(bulkOps);
        }

        return res.status(200).json({
            success: true,
            message: `Attendance records for event ${eventId} saved successfully!`,
            eventId,
            attendance: attendanceRecords,
            isVerified: Boolean(isVerified)
        });
    } catch (error) {
        console.error("Error in saveEventAttendance:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// ANNOUNCEMENTS CRUD CONTROLLERS
// ==========================================

// GET /api/coordinator/announcements
const getAnnouncements = async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const announcements = await Announcement.find({}).sort({ createdAt: -1 });
            return res.status(200).json({
                success: true,
                count: announcements.length,
                announcements
            });
        }
        return res.status(200).json({
            success: true,
            count: 0,
            announcements: []
        });
    } catch (error) {
        console.error("Error in getAnnouncements:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/coordinator/announcements
const createAnnouncement = async (req, res) => {
    try {
        const {
            title,
            description,
            targetAudience,
            targetBatch,
            publishDate,
            expiryDate,
            status,
            priority,
            referenceLink,
            author
        } = req.body;

        if (!title || !description || !expiryDate) {
            return res.status(400).json({
                success: false,
                message: "Title, description, and expiry date are required fields."
            });
        }

        if (mongoose.connection.readyState === 1) {
            const newAnnouncement = await Announcement.create({
                title,
                description,
                targetAudience: targetAudience || "All Students",
                targetBatch: targetAudience === "Selected Batch" ? targetBatch : undefined,
                publishDate: publishDate || new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
                expiryDate,
                status: status || "Published",
                priority: priority || "Normal",
                referenceLink,
                author: author || "Prof. Rajesh Sharma (Coordinator)"
            });

            return res.status(201).json({
                success: true,
                message: "Announcement created successfully!",
                announcement: newAnnouncement
            });
        }

        return res.status(201).json({
            success: true,
            message: "Announcement created in local session.",
            announcement: { ...req.body, _id: `ann_${Date.now()}` }
        });
    } catch (error) {
        console.error("Error in createAnnouncement:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/coordinator/announcements/:id
const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
            const updated = await Announcement.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            if (!updated) {
                return res.status(404).json({ success: false, message: "Announcement not found." });
            }

            return res.status(200).json({
                success: true,
                message: "Announcement updated successfully!",
                announcement: updated
            });
        }

        return res.status(200).json({
            success: true,
            message: "Announcement updated.",
            announcement: { ...updateData, _id: id }
        });
    } catch (error) {
        console.error("Error in updateAnnouncement:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/coordinator/announcements/:id
const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id)) {
            const deleted = await Announcement.findByIdAndDelete(id);
            if (!deleted) {
                return res.status(404).json({ success: false, message: "Announcement not found." });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Announcement deleted successfully!"
        });
    } catch (error) {
        console.error("Error in deleteAnnouncement:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getCoordinatorEvents,
    getEventAttendance,
    saveEventAttendance,
    getAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
};
