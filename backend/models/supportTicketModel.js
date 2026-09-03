const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
    {
        ticketId: { type: String, required: true, unique: true },
        collegeName: { type: String, required: true },
        subject: { type: String, required: true },
        priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
        status: { type: String, enum: ["Open", "In Progress", "Resolved"], default: "Open" },
        createdBy: { type: String, default: "" },
        message: { type: String, required: true },
        response: { type: String, default: "" },
    },
    { timestamps: true }
);

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
