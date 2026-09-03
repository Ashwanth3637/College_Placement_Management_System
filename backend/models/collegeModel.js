const mongoose = require("mongoose");

const collegeSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        code: { type: String, required: true, uppercase: true, unique: true, trim: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        phone: { type: String, default: "" },
        contactPerson: { type: String, default: "" },
        contactEmail: { type: String, default: "" },
        address: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "Tamil Nadu" },
        country: { type: String, default: "India" },
        pincode: { type: String, default: "" },
        website: { type: String, default: "" },
        establishedYear: { type: Number, default: 2000 },
        logo: { type: String, default: "" },
        status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
        currentPlan: { type: String, enum: ["Trial", "Basic", "Premium", "Pro"], default: "Basic" },
        totalStudents: { type: Number, default: 0 },
        activeDrives: { type: Number, default: 0 },
        totalPlaced: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model("College", collegeSchema);
