const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        role: {
            type: String,
            enum: ["student", "officer", "admin"],
            default: "student",
        },
        collegeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "College",
            default: null,
        },
        isFrozen: {
            type: Boolean,
            default: false,
        },
        frozenAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);
module.exports = mongoose.model("User", userSchema);
