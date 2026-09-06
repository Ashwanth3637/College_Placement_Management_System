const express = require("express");
const router = express.Router();
const {
    getAllApplications,
    getApplicationById,
    createApplication,
    updateApplicationStatus,
    submitRoundResult,
    verifyRoundResult,
    releaseOfferLetter,
    deleteApplication,
    optInDrive,
    optOutDrive,
    getEligibleDrives,
} = require("../controllers/applicationController");

router.get("/", getAllApplications);
router.get("/:id", getApplicationById);
router.post("/", createApplication);
router.put("/:id/status", updateApplicationStatus);
router.put("/:id/round-result", submitRoundResult);
router.put("/:id/verify-round", verifyRoundResult);
router.post("/:id/offer-letter", releaseOfferLetter);
router.delete("/:id", deleteApplication);

// Flow 4: Opt-in/Opt-out & Eligible Drives
router.post("/opt-in", optInDrive);
router.post("/opt-out", optOutDrive);
router.get("/eligible-drives/:userId", getEligibleDrives);

module.exports = router;
