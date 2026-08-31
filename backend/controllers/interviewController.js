const Interview = require("../models/interviewModel");

const getAllInterviews = async (req, res) => {
    try {
        let interviews = await Interview.find().sort({ createdAt: -1 });
        return res.status(200).json(interviews || []);
    } catch (error) {
        console.error("Get All Interviews Error:", error);
        return res.status(500).json({
            message: "Failed to fetch interview records",
            error: error.message,
        });
    }
};

const createInterview = async (req, res) => {
    try {
        const interview = new Interview(req.body);
        await interview.save();
        return res.status(201).json({
            message: "Interview scheduled successfully",
            interview,
        });
    } catch (error) {
        console.error("Create Interview Error:", error);
        return res.status(500).json({
            message: "Failed to create interview record",
            error: error.message,
        });
    }
};

const updateInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Interview.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) {
            return res.status(404).json({ message: "Interview record not found" });
        }
        return res.status(200).json({
            message: "Interview record updated successfully",
            interview: updated,
        });
    } catch (error) {
        console.error("Update Interview Error:", error);
        return res.status(500).json({
            message: "Failed to update interview record",
            error: error.message,
        });
    }
};

const rescheduleInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, time, reason } = req.body;
        const existing = await Interview.findById(id);
        if (!existing) {
            return res.status(404).json({ message: "Interview record not found" });
        }

        existing.previousDate = existing.date;
        existing.previousTime = existing.time;
        existing.date = date || existing.date;
        existing.time = time || existing.time;
        existing.status = "rescheduled";
        existing.rescheduleReason = reason || "Officer rescheduled session slot";

        await existing.save();
        return res.status(200).json({
            message: "Interview rescheduled successfully",
            interview: existing,
        });
    } catch (error) {
        console.error("Reschedule Interview Error:", error);
        return res.status(500).json({
            message: "Failed to reschedule interview",
            error: error.message,
        });
    }
};

const cancelInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const existing = await Interview.findById(id);
        if (!existing) {
            return res.status(404).json({ message: "Interview record not found" });
        }

        existing.status = "cancelled";
        existing.cancelReason = reason || "Interview session cancelled by officer/recruiter";

        await existing.save();
        return res.status(200).json({
            message: "Interview cancelled successfully",
            interview: existing,
        });
    } catch (error) {
        console.error("Cancel Interview Error:", error);
        return res.status(500).json({
            message: "Failed to cancel interview",
            error: error.message,
        });
    }
};

module.exports = {
    getAllInterviews,
    createInterview,
    updateInterview,
    rescheduleInterview,
    cancelInterview,
};
