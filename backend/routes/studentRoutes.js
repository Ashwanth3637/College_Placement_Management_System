const express = require("express");
const multer = require("multer");
const path = require("path");

const {
    saveStudentProfile,
    getStudentProfile,
    getAllStudents,
    getStudentById,
    verifyStudentProfile,
    rejectStudentProfile,
    updatePlacementStatus,
} = require("../controllers/studentController");

const router = express.Router();

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },

    filename: function (req, file, cb) {
        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    },
});

// Allow PDF, DOC and DOCX
const fileFilter = (req, file, cb) => {
    const allowedExtensions = [
        ".pdf",
        ".doc",
        ".docx",
    ];

    const extension = path
        .extname(file.originalname)
        .toLowerCase();

    if (allowedExtensions.includes(extension)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Only PDF, DOC, and DOCX files are allowed"
            )
        );
    }
};

// Multer configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

// Get All Student Profiles (Admin / Placement Officer)
router.get(
    "/all",
    getAllStudents
);

// Get Single Student Record (Admin / Placement Officer)
router.get(
    "/details/:studentId",
    getStudentById
);

// Save / Update Student Profile
router.post(
    "/profile",
    upload.single("resume"),
    saveStudentProfile
);

// Get Student Profile By User ID
router.get(
    "/profile/:userId",
    getStudentProfile
);

// Verify Student Profile (Admin / Placement Officer)
router.put(
    "/verify/:studentId",
    verifyStudentProfile
);

// Reject Student Profile (Admin / Placement Officer)
router.put(
    "/reject/:studentId",
    rejectStudentProfile
);

// Update Placement Status (Admin / Placement Officer)
router.put(
    "/placement-status/:studentId",
    updatePlacementStatus
);

module.exports = router;