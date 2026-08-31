const express = require("express");
const router = express.Router();
const {
    getCoordinatorEvents,
    getEventAttendance,
    saveEventAttendance,
    getAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
} = require("../controllers/coordinatorController");

const { protectCoordinator } = require("../middleware/authMiddleware");

// ==========================================
// EVENTS & ATTENDANCE ENDPOINTS
// ==========================================

// GET /api/coordinator/events
router.get("/events", getCoordinatorEvents);

// GET /api/coordinator/events/:eventId/attendance
router.get("/events/:eventId/attendance", getEventAttendance);

// PUT /api/coordinator/events/:eventId/attendance (Protected)
router.put("/events/:eventId/attendance", protectCoordinator, saveEventAttendance);

// POST /api/coordinator/events/:eventId/attendance (Protected Alias)
router.post("/events/:eventId/attendance", protectCoordinator, saveEventAttendance);

// ==========================================
// ANNOUNCEMENTS ENDPOINTS
// ==========================================

// GET /api/coordinator/announcements
router.get("/announcements", getAnnouncements);

// POST /api/coordinator/announcements (Protected)
router.post("/announcements", protectCoordinator, createAnnouncement);

// PUT /api/coordinator/announcements/:id (Protected)
router.put("/announcements/:id", protectCoordinator, updateAnnouncement);

// DELETE /api/coordinator/announcements/:id (Protected)
router.delete("/announcements/:id", protectCoordinator, deleteAnnouncement);

module.exports = router;
