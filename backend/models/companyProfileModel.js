const mongoose = require("mongoose");

const companyProfileSchema = new mongoose.Schema(
    {
        companyName: {
            type: String,
            required: true,
            trim: true,
        },
        companyEmail: {
            type: String,
            default: "",
            trim: true,
        },
        industry: {
            type: String,
            default: "",
            trim: true,
        },
        website: {
            type: String,
            default: "",
            trim: true,
        },
        location: {
            type: String,
            default: "",
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        contactPersonName: {
            type: String,
            default: "",
            trim: true,
        },
        contactEmail: {
            type: String,
            default: "",
            trim: true,
        },
        contactPhone: {
            type: String,
            default: "",
            trim: true,
        },
        logo: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["Pending Approval", "Approved", "Rejected"],
            default: "Pending Approval",
        },
        rejectionReason: {
            type: String,
            default: "",
        },
        approvedBy: {
            type: String,
            default: "",
        },
        // Aliases for compatibility
        hrName: {
            type: String,
            default: "",
        },
        contactNumber: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("CompanyProfile", companyProfileSchema);
