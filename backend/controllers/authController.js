const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const College = require("../models/collegeModel");

// In-memory OTP store: { email: { otp, expiresAt, collegeId } }
const otpStore = new Map();
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Standard demo accounts map for 3 Core Roles: Student, Placement Officer, Super Admin
const DEMO_USERS = {
    "ashwanth@college.edu": { name: "Ashwanth S", role: "student" },
    "student@college.edu": { name: "Ashwanth S (Student)", role: "student" },
    "officer@college.edu": { name: "Placement Officer", role: "officer" },
    "admin@college.edu": { name: "Super Admin", role: "admin" }
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // 1. Check required fields
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 2. Check DB if connected
        if (mongoose.connection.readyState === 1) {
            const existingUser = await User.findOne({ email: normalizedEmail });
            if (existingUser) {
                return res.status(400).json({
                    message: "User with this email already exists",
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await User.create({
                name,
                email: normalizedEmail,
                password: hashedPassword,
                role: role || "student",
            });

            if ((role || "student") === "student") {
                try {
                    const Student = require("../models/studentModel");
                    await Student.create({
                        user: user._id,
                        personal: {
                            fullName: user.name,
                            department: "Computer Science & Engineering",
                            registerNumber: "22CSR" + Math.floor(100 + Math.random() * 900)
                        },
                        academic: { cgpa: 7.5, tenthPercentage: 80, twelfthPercentage: 80, backlogs: 0, graduationYear: 2026 },
                        isProfileComplete: false,
                        isVerified: false,
                        verificationStatus: "pending"
                    });
                } catch (sErr) {
                    console.warn("Student profile creation warning:", sErr.message);
                }
            }

            return res.status(201).json({
                message: "User registered successfully",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        }

        // Offline mode registration fallback
        return res.status(201).json({
            message: "User registered successfully (Offline mode)",
            user: {
                id: "off_" + Date.now(),
                name,
                email: normalizedEmail,
                role: role || "student",
            },
        });
    } catch (error) {
        console.error("Registration error:", error.message);
        res.status(500).json({
            message: "Server error during registration: " + error.message,
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // 1. Validate input fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // 2. Attempt database lookup if connection is established
        let user = null;
        if (mongoose.connection.readyState === 1) {
            try {
                user = await User.findOne({ email: normalizedEmail });
            } catch (dbErr) {
                console.warn("DB lookup warning:", dbErr.message);
            }

            // If user not found in DB, check if it's one of default demo accounts and auto-create it
            if (!user && DEMO_USERS[normalizedEmail]) {
                const demoInfo = DEMO_USERS[normalizedEmail];
                try {
                    const hashedPassword = await bcrypt.hash("password123", 10);
                    user = await User.create({
                        name: demoInfo.name,
                        email: normalizedEmail,
                        password: hashedPassword,
                        role: demoInfo.role,
                    });
                    if (demoInfo.role === "student") {
                        try {
                            const Student = require("../models/studentModel");
                            await Student.create({
                                user: user._id,
                                personal: { department: "Computer Science" },
                                academic: { cgpa: 8.5, tenthPercentage: 90, twelfthPercentage: 88, backlogs: 0, graduationYear: 2026 },
                                isProfileComplete: true,
                                isVerified: true,
                            });
                        } catch (e) {}
                    }
                } catch (cErr) {
                    console.warn("Demo auto-creation warning:", cErr.message);
                }
            }
        }

        // 3. Database user verification
        if (user) {
            let isMatch = false;
            if (user.password) {
                try {
                    isMatch = await bcrypt.compare(password, user.password);
                } catch (bErr) {
                    isMatch = false;
                }
            }

            // Fallback for demo accounts if DB password hash mismatch occurs
            if (!isMatch && DEMO_USERS[normalizedEmail] && password === "password123") {
                try {
                    const hashedPassword = await bcrypt.hash("password123", 10);
                    user.password = hashedPassword;
                    user.role = DEMO_USERS[normalizedEmail].role;
                    await user.save();
                    isMatch = true;
                } catch (sErr) {
                    isMatch = true;
                }
            }

            if (!isMatch) {
                return res.status(400).json({
                    message: "Invalid email or password",
                });
            }

            if (user.role === "student") {
                try {
                    const Student = require("../models/studentModel");
                    let stDoc = await Student.findOne({ user: user._id });
                    if (!stDoc) {
                        await Student.create({
                            user: user._id,
                            personal: {
                                fullName: user.name,
                                department: "Computer Science & Engineering",
                                registerNumber: "22CSR" + Math.floor(100 + Math.random() * 900)
                            },
                            academic: { cgpa: 7.5, tenthPercentage: 80, twelfthPercentage: 80, backlogs: 0, graduationYear: 2026 },
                            isProfileComplete: false,
                            isVerified: false,
                            verificationStatus: "pending"
                        });
                    }
                } catch (sErr) {
                    console.warn("Student doc auto-creation on login warning:", sErr.message);
                }
            }

            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET || "jwt_secret_key_123",
                { expiresIn: "1d" }
            );

            return res.status(200).json({
                message: "Login successful",
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        }

        // 4. Offline mode or fallback for demo credentials when DB is unavailable
        const demoMatch = DEMO_USERS[normalizedEmail];
        const assignedRole = demoMatch ? demoMatch.role : (role || "student");
        const assignedName = demoMatch ? demoMatch.name : (normalizedEmail.split("@")[0] || "User");

        if (role && demoMatch && demoMatch.role.toLowerCase() !== role.toLowerCase()) {
            return res.status(400).json({
                message: `Account found, but registered role is '${demoMatch.role}'. Please select the '${demoMatch.role}' tab to sign in.`,
            });
        }

        const fallbackToken = jwt.sign(
            { id: "off_" + Date.now(), role: assignedRole },
            process.env.JWT_SECRET || "jwt_secret_key_123",
            { expiresIn: "1d" }
        );

        return res.status(200).json({
            message: "Login successful",
            token: fallbackToken,
            user: {
                id: "off_" + Date.now(),
                name: assignedName,
                email: normalizedEmail,
                role: assignedRole,
            },
        });
    } catch (error) {
        console.error("Login error details:", error);
        res.status(500).json({
            message: error.message || "Server error during login",
        });
    }
};

// =====================================================
// Send OTP for Student Registration (Flow 2)
// =====================================================
const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if user already exists
        if (mongoose.connection.readyState === 1) {
            const existingUser = await User.findOne({ email: normalizedEmail });
            if (existingUser) {
                return res.status(400).json({ message: "An account with this email already exists. Please login instead." });
            }
        }

        // Extract domain from email
        const emailDomain = "@" + normalizedEmail.split("@")[1];

        // Find college that allows this email domain
        let matchedCollege = null;
        if (mongoose.connection.readyState === 1) {
            matchedCollege = await College.findOne({
                allowedEmailDomains: { $in: [emailDomain, emailDomain.replace("@", "")] },
                status: "Active"
            });
        }

        if (!matchedCollege) {
            return res.status(400).json({
                message: `Email domain "${emailDomain}" is not registered with any active college. Please contact your placement officer.`
            });
        }

        // Generate 6-digit OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        // Store OTP in memory with expiry
        otpStore.set(normalizedEmail, {
            otp,
            expiresAt: Date.now() + OTP_EXPIRY_MS,
            collegeId: matchedCollege._id,
            collegeName: matchedCollege.name,
        });

        // Log OTP to console for development (replace with email sending in production)
        console.log(`\n========================================`);
        console.log(`📧 OTP for ${normalizedEmail}: ${otp}`);
        console.log(`   College: ${matchedCollege.name}`);
        console.log(`   Expires in 5 minutes`);
        console.log(`========================================\n`);

        return res.status(200).json({
            message: "OTP sent successfully to your email.",
            collegeName: matchedCollege.name,
            // Include OTP in dev mode for easier testing
            devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
        });
    } catch (error) {
        console.error("Send OTP error:", error);
        return res.status(500).json({ message: "Failed to send OTP: " + error.message });
    }
};

// =====================================================
// Verify OTP and Register Student (Flow 2)
// =====================================================
const verifyOtp = async (req, res) => {
    try {
        const { email, otp, name, password } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const storedData = otpStore.get(normalizedEmail);

        if (!storedData) {
            return res.status(400).json({ message: "No OTP found for this email. Please request a new OTP." });
        }

        if (Date.now() > storedData.expiresAt) {
            otpStore.delete(normalizedEmail);
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }

        if (storedData.otp !== String(otp).trim()) {
            return res.status(400).json({ message: "Invalid OTP. Please check and try again." });
        }

        // OTP verified — clear it
        otpStore.delete(normalizedEmail);

        // Register the student user
        if (!name || !password) {
            return res.status(400).json({ message: "Name and password are required to complete registration." });
        }

        if (mongoose.connection.readyState === 1) {
            const existingUser = await User.findOne({ email: normalizedEmail });
            if (existingUser) {
                return res.status(400).json({ message: "User with this email already exists." });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await User.create({
                name: name.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                role: "student",
                collegeId: storedData.collegeId,
            });

            // Create empty student profile
            try {
                const Student = require("../models/studentModel");
                await Student.create({
                    user: user._id,
                    collegeId: storedData.collegeId,
                    personal: {
                        fullName: name.trim(),
                        email: normalizedEmail,
                    },
                    isProfileComplete: false,
                    isVerified: false,
                    verificationStatus: "pending",
                });
            } catch (sErr) {
                console.warn("Student profile creation warning:", sErr.message);
            }

            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET || "jwt_secret_key_123",
                { expiresIn: "1d" }
            );

            return res.status(201).json({
                message: "Email verified and registration successful!",
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    collegeId: storedData.collegeId,
                    collegeName: storedData.collegeName,
                },
            });
        }

        return res.status(201).json({
            message: "Email verified and registration successful! (Offline mode)",
            user: { id: "off_" + Date.now(), name, email: normalizedEmail, role: "student" },
        });
    } catch (error) {
        console.error("Verify OTP error:", error);
        return res.status(500).json({ message: "Failed to verify OTP: " + error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    sendOtp,
    verifyOtp,
};