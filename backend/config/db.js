const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const autoSeed = async () => {
    try {
        const User = require("../models/user");
        const Student = require("../models/studentModel");

        const defaultPassword = await bcrypt.hash("password123", 10);

        const usersToSeed = [
            { name: "Demo Student", email: "student@college.edu", password: defaultPassword, role: "student" },
            { name: "Demo Recruiter", email: "recruiter@company.com", password: defaultPassword, role: "recruiter" },
            { name: "Demo Coordinator", email: "coordinator@college.edu", password: defaultPassword, role: "coordinator" },
            { name: "Demo Admin", email: "admin@college.edu", password: defaultPassword, role: "admin" },
        ];

        for (const u of usersToSeed) {
            const existing = await User.findOne({ email: u.email });
            if (!existing) {
                const createdUser = await User.create(u);
                console.log(`✅ Auto-seeded demo user: ${u.email} (${u.role})`);
                if (u.role === "student") {
                    await Student.create({
                        user: createdUser._id,
                        personal: { department: "Computer Science" },
                        academic: { cgpa: 8.5, tenthPercentage: 90, twelfthPercentage: 88, backlogs: 0, graduationYear: 2026 },
                        isProfileComplete: true,
                        isVerified: true,
                    });
                }
            }
        }
    } catch (err) {
        console.warn("Auto-seeding warning:", err.message);
    }
};

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
        });

        console.log("✅ MongoDB connected successfully");
        await autoSeed();
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        console.log("⚡ Running in offline fallback mode for instant responsiveness...");
    }
};

module.exports = connectDB;