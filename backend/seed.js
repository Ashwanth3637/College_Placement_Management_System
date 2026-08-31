const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/user");
const Student = require("./models/studentModel");

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/college_placement_db");
        console.log("Connected to MongoDB for seeding...");

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
                console.log(`Created user: ${u.email} (${u.role})`);

                if (u.role === "student") {
                    await Student.create({
                        user: createdUser._id,
                        personal: { department: "Computer Science" },
                        academic: { cgpa: 8.5, tenthPercentage: 90, twelfthPercentage: 88, backlogs: 0, graduationYear: 2026 },
                        isProfileComplete: true,
                        isVerified: true,
                    });
                }
            } else {
                console.log(`User already exists: ${u.email}`);
            }
        }

        console.log("Seeding complete!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err.message);
        process.exit(1);
    }
};

seedUsers();
