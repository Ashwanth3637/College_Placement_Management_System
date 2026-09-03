const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
    {
        collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College" },
        collegeName: { type: String, required: true },
        planName: { type: String, enum: ["Trial", "Basic", "Premium", "Pro"], default: "Basic" },
        startDate: { type: String, default: "" },
        expiryDate: { type: String, default: "" },
        amount: { type: Number, default: 0 },
        status: { type: String, enum: ["Active", "Expiring Soon", "Expired"], default: "Active" },
        usage: {
            studentsUsed: { type: Number, default: 0 },
            studentsLimit: { type: Number, default: 500 },
            recruitersUsed: { type: Number, default: 0 },
            recruitersLimit: { type: Number, default: 25 },
            drivesUsed: { type: Number, default: 0 },
            drivesLimit: { type: mongoose.Schema.Types.Mixed, default: 15 },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
