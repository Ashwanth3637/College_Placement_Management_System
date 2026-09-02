const express = require("express");
const router = express.Router();
const {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
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

router.get("/seasons", getSeasons);
router.post("/seasons", createSeason);
router.put("/seasons/:id", updateSeason);

router.get("/audit-logs", getAuditLogs);
router.get("/system-health", getSystemHealth);

module.exports = router;
