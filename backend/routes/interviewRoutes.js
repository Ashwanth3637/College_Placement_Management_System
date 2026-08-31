const express = require("express");
const router = express.Router();
const {
    getAllInterviews,
    createInterview,
    updateInterview,
    rescheduleInterview,
    cancelInterview,
} = require("../controllers/interviewController");

router.get("/all", getAllInterviews);
router.post("/create", createInterview);
router.put("/:id", updateInterview);
router.put("/:id/reschedule", rescheduleInterview);
router.put("/:id/cancel", cancelInterview);

module.exports = router;
