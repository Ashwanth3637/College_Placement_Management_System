const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        actorId: {
            type: String,
            default: "system",
        },
        actorName: {
            type: String,
            default: "System Admin",
        },
        actorRole: {
            type: String,
            default: "admin",
        },
        action: {
            type: String,
            required: true,
            trim: true,
        },
        entityType: {
            type: String,
            required: true,
            enum: ["USER", "STUDENT", "COMPANY", "DRIVE", "APPLICATION", "INTERVIEW", "OFFER", "SEASON", "SYSTEM"],
        },
        entityId: {
            type: String,
            default: "",
        },
        details: {
            type: String,
            default: "",
        },
        ipAddress: {
            type: String,
            default: "127.0.0.1",
        },
        status: {
            type: String,
            enum: ["SUCCESS", "FAILURE", "WARNING"],
            default: "SUCCESS",
        },
    },
    {
        timestamps: true,
    }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entityType: 1, action: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
