const express = require("express");
const multer = require("multer");
const path = require("path");
const {
    getDrives,
    createDrive,
    updateDrive,
    deleteDrive,
    deleteAllDrives,
    getDashboardStats,
    getCompanyProfile,
    updateCompanyProfile,
    registerCompanyProfile,
    getAllCompanyProfiles,
    approveCompanyProfile,
    rejectCompanyProfile,
    deleteAllCompanyProfiles,
    approveDrive,
    rejectDrive,
} = require("../controllers/companyController");

const router = express.Router();

// Multer for JD attachments
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => {
        const uniqueName = "jd_" + Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get("/drives", getDrives);
router.post("/drives", upload.array("attachmentFiles", 5), createDrive);
router.put("/drives/:id", updateDrive);
router.put("/drives/:id/approve", approveDrive);
router.put("/drives/:id/reject", rejectDrive);
router.delete("/drives/:id", deleteDrive);
router.delete("/drives", deleteAllDrives);
router.get("/dashboard-stats", getDashboardStats);

// Recruiter Company Profile & Registration Routes
router.get("/profile", getCompanyProfile);
router.put("/profile", updateCompanyProfile);
router.post("/profile", updateCompanyProfile);
router.post("/register", registerCompanyProfile);
router.get("/profiles/all", getAllCompanyProfiles);
router.delete("/profiles/all", deleteAllCompanyProfiles);
router.put("/profiles/:id/approve", approveCompanyProfile);
router.put("/profiles/:id/reject", rejectCompanyProfile);

module.exports = router;
