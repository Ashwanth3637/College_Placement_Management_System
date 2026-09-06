const express = require("express");
const router = express.Router();
const {
    getCollegeSettings,
    updateCollegeSettings,
    getPendingStudents,
    unfreezeStudent,
    freezeStudent,
} = require("../controllers/officerController");

// College Settings (email domains + departments)
router.get("/college-settings", getCollegeSettings);
router.put("/college-settings", updateCollegeSettings);

// Student verification management
router.get("/pending-students", getPendingStudents);

// Account freeze/unfreeze
router.post("/unfreeze-student/:studentId", unfreezeStudent);
router.post("/freeze-student/:studentId", freezeStudent);

module.exports = router;
