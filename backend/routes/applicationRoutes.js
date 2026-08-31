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
    deleteApplication
} = require("../controllers/applicationController");

router.get("/", getAllApplications);
router.get("/:id", getApplicationById);
router.post("/", createApplication);
router.put("/:id/status", updateApplicationStatus);
router.put("/:id/round-result", submitRoundResult);
router.put("/:id/verify-round", verifyRoundResult);
router.post("/:id/offer-letter", releaseOfferLetter);
router.delete("/:id", deleteApplication);

module.exports = router;
