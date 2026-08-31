const express = require("express");
const router = express.Router();
const { getReportsOverview, saveReportSnapshot, getSavedReports } = require("../controllers/reportController");

// GET /api/reports/overview
router.get("/overview", getReportsOverview);

// POST /api/reports/save -> Save Report Snapshot to MongoDB
router.post("/save", saveReportSnapshot);

// GET /api/reports/saved -> Get Saved Reports from MongoDB
router.get("/saved", getSavedReports);

module.exports = router;
