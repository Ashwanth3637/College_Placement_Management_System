const mongoose = require("mongoose");

const companyProfileSchema = new mongoose.Schema(
    {
        companyName: {
            type: String,
            required: true,
            default: "Amazon Development Center",
        },
        companyEmail: {
            type: String,
            default: "recruitment@amazon.com",
        },
        industry: {
            type: String,
            default: "Cloud & Software Technology",
        },
        website: {
            type: String,
            default: "https://amazon.jobs",
        },
        location: {
            type: String,
            default: "Bangalore, India",
        },
        description: {
            type: String,
            default: "Amazon Development Center India engages in software development for global retail and cloud technologies.",
        },
        contactPersonName: {
            type: String,
            default: "Arvind Kumar",
        },
        contactEmail: {
            type: String,
            default: "arvind.k@amazon.com",
        },
        contactPhone: {
            type: String,
            default: "+91 98765 43210",
        },
        logo: {
            type: String,
            default: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
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
            default: "Arvind Kumar",
        },
        contactNumber: {
            type: String,
            default: "+91 98765 43210",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("CompanyProfile", companyProfileSchema);
