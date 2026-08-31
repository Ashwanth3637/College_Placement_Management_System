const express = require("express");
const router = express.Router();
const {
    getSelections,
    updateSelectionStatus,
    createSelection,
} = require("../controllers/selectionController");

router.get("/", getSelections);
router.post("/", createSelection);
router.put("/:id/status", updateSelectionStatus);

module.exports = router;
