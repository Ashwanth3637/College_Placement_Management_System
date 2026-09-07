const mongoose = require("mongoose");

const platformSettingsSchema = new mongoose.Schema(
    {
        key: { type: String, default: "global_platform_settings", unique: true },
        platformName: { type: String, default: "Campus Placement Management System" },
        supportEmail: { type: String, default: "support@placementportal.io" },
        supportPhone: { type: String, default: "+91 98427 12345" },
        maintenanceMode: { type: Boolean, default: false },
        allowCollegeSelfRegistration: { type: Boolean, default: true },
        defaultTrialDays: { type: Number, default: 14 },
        enforceMultiFactorAuth: { type: Boolean, default: false },
        maxFileUploadMb: { type: Number, default: 15 },

        // Payment & GPay Settings
        upiId: { type: String, default: "placement.billing@okaxis" },
        gpayNumber: { type: String, default: "+91 98427 55443" },
        gpayName: { type: String, default: "CPMS Placement Portal Governance" },
        beneficiaryName: { type: String, default: "Campus Placement Management Solutions" },
        bankName: { type: String, default: "HDFC Bank" },
        accountNumber: { type: String, default: "50100458921478" },
        ifscCode: { type: String, default: "HDFC0001234" },
        branch: { type: String, default: "Anna Nagar, Chennai" },
        qrCodeUrl: { type: String, default: "" },
        paymentInstructions: {
            type: String,
            default: "Make payment via Google Pay (GPay) / UPI to the above UPI ID or mobile number. Enter the UTR / Transaction ID in your subscription request for instant verification and plan activation."
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("PlatformSettings", platformSettingsSchema);
