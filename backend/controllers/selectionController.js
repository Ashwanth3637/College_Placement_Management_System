const Selection = require("../models/selectionModel");
const mongoose = require("mongoose");

const initialSelections = [
    {
        selectionId: "SEL-001",
        studentName: "Ashwanth",
        regNo: "22CSR025",
        department: "Computer Science & Engineering",
        companyName: "Amazon Development Center",
        jobRole: "SDE Trainee / Intern + FTE",
        finalRound: "Round 1",
        result: "Passed",
        status: "Offer Released",
        ctc: "₹28 LPA",
        location: "Bangalore",
        academicYear: "2025-2026",
        offerDate: "18 Aug 2026",
    }
];

// Get all selection records (Auto-seed single record)
const getSelections = async (req, res) => {
    try {
        let selections = await Selection.find().sort({ createdAt: -1 });

        if (!selections || selections.length === 0 || selections.length > 1) {
            console.log("Seeding single selection record into MongoDB...");
            await Selection.deleteMany({});
            selections = await Selection.insertMany(initialSelections);
        }

        res.status(200).json(selections);
    } catch (error) {
        console.error("Get Selections Error:", error);
        res.status(500).json({ message: "Failed to fetch selection records", error: error.message });
    }
};

// Update status of a selection record
const updateSelectionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ message: "Status parameter is required" });
        }

        // Find by selectionId or Mongo _id
        let selection = await Selection.findOne({
            $or: [
                { selectionId: id },
                ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
            ],
        });

        if (!selection) {
            return res.status(404).json({ message: "Selection record not found" });
        }

        selection.status = status;
        await selection.save();

        // Single Offer Policy: If candidate accepts an offer, automatically decline other accepted offers for same regNo
        if (status === "Offer Accepted") {
            await Selection.updateMany(
                {
                    regNo: selection.regNo,
                    selectionId: { $ne: selection.selectionId },
                    status: "Offer Accepted",
                },
                { status: "Offer Declined" }
            );
        }

        // Return all updated selection records for clean frontend sync
        const updatedSelections = await Selection.find().sort({ createdAt: -1 });
        res.status(200).json({
            message: `Selection status updated to ${status}`,
            updatedRecord: selection,
            selections: updatedSelections,
        });
    } catch (error) {
        console.error("Update Selection Status Error:", error);
        res.status(500).json({ message: "Failed to update selection status", error: error.message });
    }
};

// Create a new selection record
const createSelection = async (req, res) => {
    try {
        const data = req.body;
        if (!data.selectionId) {
            data.selectionId = `SEL-${Date.now().toString().slice(-4)}`;
        }
        const selection = new Selection(data);
        await selection.save();

        res.status(201).json({ message: "Selection record created successfully", selection });
    } catch (error) {
        console.error("Create Selection Error:", error);
        res.status(500).json({ message: "Failed to create selection record", error: error.message });
    }
};

module.exports = {
    getSelections,
    updateSelectionStatus,
    createSelection,
};
