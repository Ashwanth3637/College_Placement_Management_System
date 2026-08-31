const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const autoSeed = async () => {
    try {
        const User = require("../models/user");
        const Student = require("../models/studentModel");
        const CompanyProfile = require("../models/companyProfileModel");
        const CompanyDrive = require("../models/companyDriveModel");
        const Application = require("../models/applicationModel");
        const Interview = require("../models/interviewModel");
        const Selection = require("../models/selectionModel");
        const Report = require("../models/reportModel");
        const Attendance = require("../models/attendanceModel");

        const defaultPassword = await bcrypt.hash("password123", 10);

        // 1. Seed Users
        const usersToSeed = [
            { name: "Demo Student", email: "student@college.edu", password: defaultPassword, role: "student" },
            { name: "Demo Recruiter", email: "recruiter@company.com", password: defaultPassword, role: "recruiter" },
            { name: "Demo Coordinator", email: "coordinator@college.edu", password: defaultPassword, role: "coordinator" },
            { name: "Demo Admin", email: "admin@college.edu", password: defaultPassword, role: "admin" },
            { name: "Ashwanth S", email: "ashwanth@college.edu", password: defaultPassword, role: "student" }
        ];

        for (const u of usersToSeed) {
            const existing = await User.findOne({ email: u.email });
            if (!existing) {
                const createdUser = await User.create(u);
                if (u.role === "student") {
                    await Student.create({
                        user: createdUser._id,
                        personal: { name: u.name, email: u.email, department: "Computer Science" },
                        academic: { cgpa: 8.8, tenthPercentage: 90, twelfthPercentage: 88, backlogs: 0, graduationYear: 2026 },
                        isProfileComplete: true,
                        isVerified: true,
                    });
                }
            }
        }

        // 2. Seed Company Profiles
        const existingProfile = await CompanyProfile.findOne({ companyName: "Amazon Development Center" });
        if (!existingProfile) {
            await CompanyProfile.create({
                companyName: "Amazon Development Center",
                companyEmail: "recruitment@amazon.com",
                industry: "Cloud & Software Technology",
                website: "https://amazon.jobs",
                location: "Bangalore, India",
                description: "Amazon Development Center India engages in software development for AWS technologies.",
                contactPersonName: "Arvind Kumar",
                contactEmail: "arvind.k@amazon.com",
                contactPhone: "+91 98765 43210",
                logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
                status: "Approved",
                approvedBy: "Placement Officer"
            });
        }

        // 3. Seed Company Drives
        const existingDrive = await CompanyDrive.findOne({ company: "Amazon Development Center" });
        if (!existingDrive) {
            await CompanyDrive.create({
                company: "Amazon Development Center",
                jobTitle: "Software Development Engineer (SDE-1)",
                role: "Software Development Engineer (SDE-1)",
                jobType: "Full-Time (FTE)",
                location: "Bangalore, India",
                packageCtc: "₹18.0 LPA",
                ctc: "₹18.0 LPA",
                deadline: "03 Sep 2026",
                driveDate: "05 Sep 2026",
                status: "Approved",
                approvedBy: "Placement Officer",
                openings: 10
            });
        }

        // 4. Seed Applications
        const existingApp = await Application.findOne({ regNo: "1CS22CS014" });
        if (!existingApp) {
            await Application.create({
                studentName: "Ashwanth S",
                regNo: "1CS22CS014",
                department: "Computer Science & Engineering",
                email: "ashwanth@college.edu",
                cgpa: 9.2,
                companyName: "Amazon Development Center",
                jobRole: "Software Development Engineer (SDE-1)",
                status: "Shortlisted",
                currentRound: 2,
                roundStatus: "Scheduled",
                roundName: "Round 2: Technical Interview"
            });
        }

        // 5. Seed Interviews
        const existingInterview = await Interview.findOne({ company: "Amazon Development Center" });
        if (!existingInterview) {
            await Interview.create({
                company: "Amazon Development Center",
                role: "Software Development Engineer (SDE-1)",
                roundTitle: "Round 2: Technical Interview",
                date: "2026-09-05",
                time: "10:30 AM IST",
                status: "scheduled",
                mode: "Online",
                interviewer: "Amazon SDE Panel"
            });
        }

        // 6. Seed Selections
        const existingSel = await Selection.findOne({ selectionId: "SEL_2026_001" });
        if (!existingSel) {
            await Selection.create({
                selectionId: "SEL_2026_001",
                studentName: "Ashwanth S",
                regNo: "1CS22CS014",
                department: "Computer Science & Engineering",
                companyName: "Amazon Development Center",
                jobRole: "Software Development Engineer (SDE-1)",
                result: "Passed",
                status: "Offer Released",
                ctc: "₹18.0 LPA",
                location: "Bangalore, India"
            });
        }

        // 7. Seed Reports
        const existingReport = await Report.findOne({ reportId: "REP_2026_001" });
        if (!existingReport) {
            await Report.create({
                reportId: "REP_2026_001",
                title: "Annual Campus Placement Summary 2025-2026",
                academicYear: "2025-2026",
                department: "All Departments",
                generatedBy: "Placement Officer",
                totalStudents: 450,
                placedCount: 380,
                placementRate: 84.4,
                exportType: "PDF"
            });
        }

        // 8. Seed Event Attendance
        const existingAtt = await Attendance.findOne({ eventId: "evt_1", registerNo: "22CS001" });
        if (!existingAtt) {
            await Attendance.create({
                eventId: "evt_1",
                registerNo: "22CS001",
                studentName: "Arun Kumar",
                department: "CSE",
                status: "Present",
                markedBy: "Demo Coordinator"
            });
        }

        // 9. Seed Announcements
        const Announcement = require("../models/announcementModel");
        const existingAnn = await Announcement.findOne({ title: "Amazon SDE-1 Drive Shortlist & Technical Round Schedule" });
        if (!existingAnn) {
            await Announcement.create({
                title: "Amazon SDE-1 Drive Shortlist & Technical Round Schedule",
                description: "All shortlisted students for Amazon SDE-1 must report to Computer Lab 3 at 09:30 AM with college ID card and printed copies of their resume. Online technical assessment credentials will be shared on-site.",
                targetAudience: "Eligible Students",
                publishDate: "Aug 30, 2026",
                expiryDate: "2026-09-05",
                status: "Published",
                author: "Prof. Rajesh Sharma (Coordinator)",
                priority: "Urgent",
                referenceLink: "https://amazon.jobs/students"
            });
        }

        console.log("✅ Auto-seeded complete MongoDB database models!");
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