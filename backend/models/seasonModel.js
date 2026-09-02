const mongoose = require("mongoose");

const seasonSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Season name is required (e.g. 2026-2027)"],
            trim: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        endDate: {
            type: Date,
        },
        status: {
            type: String,
            enum: ["upcoming", "active", "frozen", "archived"],
            default: "active",
        },
        description: {
            type: String,
            default: "Campus Placement Season",
        },
        eligibleBatches: [{ type: String }],
        rulesConfig: {
            maxOffersPerStudent: { type: Number, default: 2 },
            dreamTierMinCtc: { type: Number, default: 12.0 },
            allowMultipleOffers: { type: Boolean, default: true },
            requireCgpaVerification: { type: Boolean, default: true },
        },
        createdBy: {
            type: String,
            default: "Placement Director",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Season", seasonSchema);
