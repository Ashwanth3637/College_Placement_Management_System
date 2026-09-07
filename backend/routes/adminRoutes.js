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
    deleteCollege,
    toggleCollegeStatus,
    getSubscriptions,
    activateCollegeSubscription,
    renewSubscription,
    deleteSubscription,
    getPaymentSettings,
    updatePaymentSettings,
    getSupportTickets,
    replySupportTicket,
    getSeasons,
    createSeason,
    updateSeason,
    getAuditLogs,
    getSystemHealth,
} = require("../controllers/adminController");

// Users
router.get("/users", getAllUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Colleges
router.get("/colleges", getColleges);
router.post("/colleges", createCollege);
router.put("/colleges/:id", updateCollege);
router.delete("/colleges/:id", deleteCollege);
router.patch("/colleges/:id/toggle-status", toggleCollegeStatus);

// Subscriptions & Plan Activations
router.get("/subscriptions", getSubscriptions);
router.post("/subscriptions/activate", activateCollegeSubscription);
router.post("/subscriptions/:id/renew", renewSubscription);
router.delete("/subscriptions/:id", deleteSubscription);

// Payment & Global Settings
router.get("/payment-settings", getPaymentSettings);
router.put("/payment-settings", updatePaymentSettings);

// Support
router.get("/support-tickets", getSupportTickets);
router.post("/support-tickets/:id/reply", replySupportTicket);

// Placement Seasons
router.get("/seasons", getSeasons);
router.post("/seasons", createSeason);
router.put("/seasons/:id", updateSeason);

// System
router.get("/audit-logs", getAuditLogs);
router.get("/system-health", getSystemHealth);

module.exports = router;
