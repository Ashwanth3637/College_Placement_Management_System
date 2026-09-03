const express = require("express");
const router = express.Router();
const {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    getColleges,
    createCollege,
    updateCollege,
    toggleCollegeStatus,
    getSubscriptions,
    getSupportTickets,
    replySupportTicket,
    getSeasons,
    createSeason,
    updateSeason,
    getAuditLogs,
    getSystemHealth,
} = require("../controllers/adminController");

router.get("/users", getAllUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

router.get("/colleges", getColleges);
router.post("/colleges", createCollege);
router.put("/colleges/:id", updateCollege);
router.patch("/colleges/:id/toggle-status", toggleCollegeStatus);

router.get("/subscriptions", getSubscriptions);

router.get("/support-tickets", getSupportTickets);
router.post("/support-tickets/:id/reply", replySupportTicket);

router.get("/seasons", getSeasons);
router.post("/seasons", createSeason);
router.put("/seasons/:id", updateSeason);

router.get("/audit-logs", getAuditLogs);
router.get("/system-health", getSystemHealth);

module.exports = router;
