const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/user");
const Student = require("./models/studentModel");
const CompanyProfile = require("./models/companyProfileModel");
const CompanyDrive = require("./models/companyDriveModel");
const Application = require("./models/applicationModel");
const Interview = require("./models/interviewModel");
const Selection = require("./models/selectionModel");
const Report = require("./models/reportModel");
const Attendance = require("./models/attendanceModel");
const Announcement = require("./models/announcementModel");
const Season = require("./models/seasonModel");
const AuditLog = require("./models/auditLogModel");

const seedAllModules = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/college_placement_db";
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB for complete system seeding...");

        const defaultPassword = await bcrypt.hash("password123", 10);

        // 1. SEED USERS & STUDENT PROFILES
        console.log("Seeding Users & Student Profiles...");
        const usersToSeed = [
            {
                name: "Ashwanth S",
                email: "ashwanth@college.edu",
                password: defaultPassword,
                role: "student",
                department: "Computer Science & Engineering",
                registerNo: "1CS22CS014",
                batch: "2022-2026",
                cgpa: 9.24
            },
            {
                name: "Rahul Kumar",
                email: "rahul@college.edu",
                password: defaultPassword,
                role: "student",
                department: "Computer Science & Engineering",
                registerNo: "1CS22CS045",
                batch: "2022-2026",
                cgpa: 8.80
            },
            {
                name: "Placement Director",
                email: "admin@college.edu",
                password: defaultPassword,
                role: "admin"
            }
        ];

        for (const userItem of usersToSeed) {
            let user = await User.findOne({ email: userItem.email });
            if (!user) {
                user = await User.create(userItem);
                console.log(`  + Seeded User: ${userItem.email} (${userItem.role})`);
            }

            if (userItem.role === "student") {
                const existingStudent = await Student.findOne({ user: user._id });
                if (!existingStudent) {
                    await Student.create({
                        user: user._id,
                        personal: {
                            department: userItem.department,
                            registerNumber: userItem.registerNo
                        },
                        academic: {
                            cgpa: userItem.cgpa,
                            graduationYear: 2026
                        },
                        verificationStatus: "verified",
                        isVerified: true,
                        isProfileComplete: true
                    });
                    console.log(`  + Seeded Student profile: ${userItem.name}`);
                }
            }
        }

        // 2. SEED COMPANY PROFILES
        console.log("Seeding Company Profiles...");
        const companiesToSeed = [
            {
                name: "Amazon Development Center",
                email: "campus@amazon.com",
                industry: "Cloud & E-Commerce",
                location: "Bangalore, India",
                website: "https://amazon.jobs",
                description: "Global technology and cloud infrastructure leader.",
                status: "Approved",
                hiringWorkflow: ["Online Assessment", "Technical Interview Round 1", "Technical Interview Round 2", "Bar Raiser / HR"]
            },
            {
                name: "Tata Consultancy Services",
                email: "campus@tcs.com",
                industry: "Information Technology",
                location: "Mumbai / Pan India",
                website: "https://tcs.com",
                description: "Leading multinational IT services and consulting company.",
                status: "Approved",
                hiringWorkflow: ["National Qualifier Test (NQT)", "Technical Round", "Management Interview"]
            }
        ];

        for (const comp of companiesToSeed) {
            const existing = await CompanyProfile.findOne({ name: comp.name });
            if (!existing) {
                await CompanyProfile.create(comp);
                console.log(`  + Seeded Company: ${comp.name}`);
            }
        }

        // 3. SEED COMPANY DRIVES
        console.log("Seeding Company Placement Drives...");
        const drivesToSeed = [
            {
                company: "Amazon Development Center",
                jobTitle: "Software Development Engineer (SDE-1)",
                role: "Software Development Engineer (SDE-1)",
                packageCtc: "₹18.0 LPA",
                ctc: "₹18.0 LPA",
                location: "Bangalore / Hyderabad",
                deadline: "2026-09-10",
                minCgpa: 8.0,
                eligibleBranches: ["Computer Science & Engineering", "Information Science", "Electronics & Communication"],
                status: "Active"
            },
            {
                company: "Tata Consultancy Services",
                jobTitle: "Systems Engineer (Digital / Ninja)",
                role: "Systems Engineer (Digital / Ninja)",
                packageCtc: "₹7.5 LPA",
                ctc: "₹7.5 LPA",
                location: "Pan India",
                deadline: "2026-09-15",
                minCgpa: 7.0,
                eligibleBranches: ["Computer Science & Engineering", "Information Science", "Electronics & Communication", "Mechanical Engineering"],
                status: "Active"
            }
        ];

        for (const drive of drivesToSeed) {
            const existing = await CompanyDrive.findOne({ company: drive.company, role: drive.role });
            if (!existing) {
                await CompanyDrive.create(drive);
                console.log(`  + Seeded Drive: ${drive.company} - ${drive.role}`);
            }
        }

        // 4. SEED APPLICATIONS
        console.log("Seeding Applications...");
        const appsToSeed = [
            {
                studentName: "Ashwanth S",
                regNo: "1CS22CS014",
                department: "Computer Science & Engineering",
                email: "ashwanth@college.edu",
                cgpa: 9.24,
                companyName: "Amazon Development Center",
                jobRole: "Software Development Engineer (SDE-1)",
                status: "Shortlisted",
                currentRound: 2,
                roundStatus: "Scheduled",
                roundName: "Round 2: Technical Interview"
            },
            {
                studentName: "Rahul Kumar",
                regNo: "1CS22CS045",
                department: "Computer Science & Engineering",
                email: "rahul@college.edu",
                cgpa: 8.8,
                companyName: "TCS - Tata Consultancy Services",
                jobRole: "Systems Engineer",
                status: "Applied",
                currentRound: 1,
                roundStatus: "In Progress",
                roundName: "Round 1: Online Aptitude"
            }
        ];

        for (const appItem of appsToSeed) {
            const existing = await Application.findOne({ regNo: appItem.regNo, companyName: appItem.companyName });
            if (!existing) {
                await Application.create(appItem);
                console.log(`  + Seeded Application: ${appItem.studentName} -> ${appItem.companyName}`);
            }
        }

        // 5. SEED INTERVIEWS
        console.log("Seeding Interviews...");
        const interviewsToSeed = [
            {
                company: "Amazon Development Center",
                role: "Software Development Engineer (SDE-1)",
                roundTitle: "Round 2: Technical Interview",
                date: "2026-09-05",
                time: "10:30 AM IST",
                status: "scheduled",
                mode: "Online",
                interviewer: "Amazon SDE Panel",
                candidates: [
                    { candidateName: "Ashwanth S", regNo: "1CS22CS014", email: "ashwanth@college.edu", status: "Scheduled", score: "Pending" }
                ]
            }
        ];

        for (const inv of interviewsToSeed) {
            const existing = await Interview.findOne({ company: inv.company, roundTitle: inv.roundTitle });
            if (!existing) {
                await Interview.create(inv);
                console.log(`  + Seeded Interview: ${inv.company} - ${inv.roundTitle}`);
            }
        }

        // 6. SEED SELECTIONS
        console.log("Seeding Selections...");
        const selectionsToSeed = [
            {
                selectionId: "SEL_2026_001",
                studentName: "Ashwanth S",
                regNo: "1CS22CS014",
                department: "Computer Science & Engineering",
                companyName: "Amazon Development Center",
                jobRole: "Software Development Engineer (SDE-1)",
                result: "Passed",
                status: "Offer Released",
                ctc: "₹18.0 LPA",
                location: "Bangalore, India",
                academicYear: "2025-2026"
            }
        ];

        for (const sel of selectionsToSeed) {
            const existing = await Selection.findOne({ selectionId: sel.selectionId });
            if (!existing) {
                await Selection.create(sel);
                console.log(`  + Seeded Selection: ${sel.studentName} -> ${sel.companyName}`);
            }
        }

        // 7. SEED REPORTS
        console.log("Seeding Reports...");
        const reportsToSeed = [
            {
                reportId: "REP_2026_001",
                title: "Annual Campus Placement Summary 2025-2026",
                academicYear: "2025-2026",
                department: "All Departments",
                generatedBy: "Placement Officer",
                totalStudents: 450,
                placedCount: 380,
                placementRate: 84.4,
                exportType: "PDF"
            }
        ];

        for (const rep of reportsToSeed) {
            const existing = await Report.findOne({ reportId: rep.reportId });
            if (!existing) {
                await Report.create(rep);
                console.log(`  + Seeded Report: ${rep.title}`);
            }
        }

        // 8. SEED ATTENDANCES
        console.log("Seeding Event Attendances...");
        const attendanceToSeed = [
            { eventId: "evt_1", registerNo: "22CS001", studentName: "Arun Kumar", department: "CSE", status: "Present", markedBy: "Demo Coordinator" },
            { eventId: "evt_1", registerNo: "22CS002", studentName: "Rahul Kumar", department: "CSE", status: "Absent", markedBy: "Demo Coordinator" },
            { eventId: "evt_1", registerNo: "22CS003", studentName: "Priya S", department: "CSE", status: "Present", markedBy: "Demo Coordinator" },
            { eventId: "evt_1", registerNo: "22CS004", studentName: "Ananya Verma", department: "ISE", status: "Not Marked", markedBy: "Demo Coordinator" },
            { eventId: "evt_1", registerNo: "22CS005", studentName: "Karthik V", department: "MECH", status: "Present", markedBy: "Demo Coordinator" }
        ];

        for (const att of attendanceToSeed) {
            const existing = await Attendance.findOne({ eventId: att.eventId, registerNo: att.registerNo });
            if (!existing) {
                await Attendance.create(att);
                console.log(`  + Seeded Attendance: ${att.registerNo} -> ${att.status}`);
            }
        }

        // 9. SEED ANNOUNCEMENTS
        console.log("Seeding Announcements...");
        const announcementsToSeed = [
            {
                title: "Amazon SDE-1 Drive Shortlist & Technical Round Schedule",
                description: "All shortlisted students for Amazon SDE-1 must report to Computer Lab 3 at 09:30 AM with college ID card and printed copies of their resume. Online technical assessment credentials will be shared on-site.",
                targetAudience: "Eligible Students",
                publishDate: "Aug 30, 2026",
                expiryDate: "2026-09-05",
                status: "Published",
                author: "Prof. Rajesh Sharma (Coordinator)",
                priority: "Urgent",
                referenceLink: "https://amazon.jobs/students"
            },
            {
                title: "TCS Pre-Placement Talk & Mandatory Registration Deadline",
                description: "TCS Campus Recruitment 2026 Pre-placement talk will be held in the Main Auditorium on Sep 3 at 11:00 AM. Attendance is strictly mandatory for all registered 2026 batch candidates.",
                targetAudience: "Selected Batch",
                targetBatch: "CSE 2026 - Batch A",
                publishDate: "Aug 29, 2026",
                expiryDate: "2026-09-03",
                status: "Published",
                author: "Prof. Rajesh Sharma (Coordinator)",
                priority: "High",
                referenceLink: "https://forms.google.com/tcs-registration"
            },
            {
                title: "Resume Building & Technical Mock Interview Workshop",
                description: "Department of Training & Placement is organizing a dedicated resume review session for all final year placement-registered students in Conference Hall B.",
                targetAudience: "All Students",
                publishDate: "Aug 25, 2026",
                expiryDate: "2026-09-10",
                status: "Published",
                author: "Placement Cell",
                priority: "Normal"
            },
            {
                title: "Google Cloud Tech Challenge Guidelines & Registration Link",
                description: "Draft guidelines containing test environment links, IDE instructions, and eligibility criteria for Google Cloud challenge.",
                targetAudience: "Eligible Students",
                publishDate: "Aug 31, 2026",
                expiryDate: "2026-09-15",
                status: "Draft",
                author: "Prof. Rajesh Sharma (Coordinator)",
                priority: "Normal",
                referenceLink: "https://cloud.google.com/edu"
            },
            {
                title: "Infosys Systems Engineer Drive Concluded — Offer Letters Released",
                description: "The campus placement drive for Infosys has been concluded. Selected candidates can collect their official physical offer letters from the Placement Office.",
                targetAudience: "Selected Batch",
                targetBatch: "All 2026 Batches",
                publishDate: "Aug 20, 2026",
                expiryDate: "2026-08-28",
                status: "Archived",
                author: "Placement Cell",
                priority: "Normal"
            }
        ];

        for (const ann of announcementsToSeed) {
            const existing = await Announcement.findOne({ title: ann.title });
            if (!existing) {
                await Announcement.create(ann);
                console.log(`  + Seeded Announcement: ${ann.title}`);
            }
        }

        // 10. SEED SEASONS
        console.log("Seeding Placement Seasons...");
        const seasonsToSeed = [
            {
                name: "Placement Season 2025-2026",
                code: "SEASON-2025-26",
                status: "active",
                startDate: new Date("2025-07-01"),
                endDate: new Date("2026-06-30"),
                description: "Primary placement drive cycle for graduating class of 2026.",
                eligibleBatches: ["2022-2026", "2024-2026"],
                rulesConfig: {
                    maxOffersPerStudent: 2,
                    dreamTierMinCtc: 12.0,
                    allowMultipleOffers: true,
                    requireCgpaVerification: true
                }
            },
            {
                name: "Placement Season 2026-2027",
                code: "SEASON-2026-27",
                status: "upcoming",
                startDate: new Date("2026-07-01"),
                endDate: new Date("2027-06-30"),
                description: "Upcoming placement cycle for graduating class of 2027.",
                eligibleBatches: ["2023-2027", "2025-2027"]
            }
        ];

        for (const season of seasonsToSeed) {
            const existing = await Season.findOne({ code: season.code });
            if (!existing) {
                await Season.create(season);
                console.log(`  + Seeded Season: ${season.name}`);
            }
        }

        // 11. SEED AUDIT LOGS
        console.log("Seeding Audit Trail Logs...");
        const auditLogsToSeed = [
            {
                actorName: "Placement Director",
                actorRole: "admin",
                action: "ACTIVATE_SEASON",
                entityType: "SEASON",
                details: "Activated Placement Season 2025-2026",
                ipAddress: "10.0.12.4"
            },
            {
                actorName: "Amazon Campus Recruiter",
                actorRole: "recruiter",
                action: "CREATE_DRIVE",
                entityType: "DRIVE",
                details: "Posted Software Development Engineer (SDE-1) drive",
                ipAddress: "172.16.4.19"
            },
            {
                actorName: "Prof. Rajesh Sharma",
                actorRole: "coordinator",
                action: "VERIFY_STUDENT",
                entityType: "STUDENT",
                details: "Verified academic records for Ashwanth S (1CS22CS014)",
                ipAddress: "192.168.1.50"
            }
        ];

        for (const logItem of auditLogsToSeed) {
            const existing = await AuditLog.findOne({ action: logItem.action, details: logItem.details });
            if (!existing) {
                await AuditLog.create(logItem);
                console.log(`  + Seeded Audit Log: ${logItem.action}`);
            }
        }

        // 12. SEED COLLEGES
        console.log("Seeding Institutional Colleges...");
        const College = require("./models/collegeModel");
        const collegesToSeed = [
            {
                name: "Kongu Engineering College",
                code: "KEC-738",
                email: "placement@kongu.edu",
                phone: "+91 98427 12345",
                contactPerson: "Dr. K. Senthil Kumar",
                contactEmail: "tpo@kongu.edu",
                address: "Perundurai, Erode District",
                city: "Perundurai",
                state: "Tamil Nadu",
                country: "India",
                pincode: "638060",
                website: "https://www.kongu.ac.in",
                establishedYear: 1984,
                status: "Active",
                currentPlan: "Pro",
                totalStudents: 1245,
                activeDrives: 28,
                totalPlaced: 980
            },
            {
                name: "PSG College of Technology",
                code: "PSG-102",
                email: "tpo@psgtech.edu",
                phone: "+91 94432 67890",
                contactPerson: "Dr. R. Nandagopal",
                contactEmail: "placement@psgtech.edu",
                address: "Avinashi Road, Peelamedu",
                city: "Coimbatore",
                state: "Tamil Nadu",
                country: "India",
                pincode: "641004",
                website: "https://www.psgtech.edu",
                establishedYear: 1951,
                status: "Active",
                currentPlan: "Premium",
                totalStudents: 1850,
                activeDrives: 45,
                totalPlaced: 1540
            },
            {
                name: "Coimbatore Institute of Technology",
                code: "CIT-204",
                email: "placements@cit.edu.in",
                phone: "+91 98765 43210",
                contactPerson: "Prof. S. Rajesh",
                contactEmail: "tpo@cit.edu.in",
                address: "Civil Aerodrome Post",
                city: "Coimbatore",
                state: "Tamil Nadu",
                country: "India",
                pincode: "641014",
                website: "https://www.cit.edu.in",
                establishedYear: 1956,
                status: "Active",
                currentPlan: "Basic",
                totalStudents: 490,
                activeDrives: 14,
                totalPlaced: 360
            },
            {
                name: "Bannari Amman Institute of Technology",
                code: "BIT-512",
                email: "admin@bitsathy.ac.in",
                phone: "+91 98433 99887",
                contactPerson: "Dr. M. Prakash",
                contactEmail: "placement@bitsathy.ac.in",
                address: "Alathukombai Post, Sathyamangalam",
                city: "Erode",
                state: "Tamil Nadu",
                country: "India",
                pincode: "638401",
                website: "https://www.bitsathy.ac.in",
                establishedYear: 1996,
                status: "Inactive",
                currentPlan: "Trial",
                totalStudents: 220,
                activeDrives: 4,
                totalPlaced: 95
            }
        ];

        for (const col of collegesToSeed) {
            const existing = await College.findOne({ code: col.code });
            if (!existing) {
                await College.create(col);
                console.log(`  + Seeded College: ${col.name}`);
            }
        }

        // 13. SEED SUBSCRIPTIONS
        console.log("Seeding Subscriptions...");
        const Subscription = require("./models/subscriptionModel");
        const subsToSeed = [
            {
                collegeName: "Kongu Engineering College",
                planName: "Pro",
                startDate: "15 Jan 2025",
                expiryDate: "15 Jan 2027",
                amount: 24999,
                status: "Active",
                usage: { studentsUsed: 1245, studentsLimit: 5000, recruitersUsed: 42, recruitersLimit: 250, drivesUsed: 28, drivesLimit: "Unlimited" }
            },
            {
                collegeName: "PSG College of Technology",
                planName: "Premium",
                startDate: "02 Feb 2025",
                expiryDate: "02 Aug 2026",
                amount: 14999,
                status: "Active",
                usage: { studentsUsed: 1850, studentsLimit: 2000, recruitersUsed: 94, recruitersLimit: 100, drivesUsed: 45, drivesLimit: 50 }
            },
            {
                collegeName: "Coimbatore Institute of Technology",
                planName: "Basic",
                startDate: "10 Mar 2025",
                expiryDate: "10 Apr 2026",
                amount: 7999,
                status: "Expiring Soon",
                usage: { studentsUsed: 490, studentsLimit: 500, recruitersUsed: 22, recruitersLimit: 25, drivesUsed: 14, drivesLimit: 15 }
            }
        ];

        for (const sub of subsToSeed) {
            const existing = await Subscription.findOne({ collegeName: sub.collegeName });
            if (!existing) {
                await Subscription.create(sub);
                console.log(`  + Seeded Subscription: ${sub.collegeName}`);
            }
        }

        // 14. SEED SUPPORT TICKETS
        console.log("Seeding Support Tickets...");
        const SupportTicket = require("./models/supportTicketModel");
        const ticketsToSeed = [
            {
                ticketId: "TKT-8841",
                collegeName: "Kongu Engineering College",
                subject: "Need student quota increase for upcoming IT recruitment drive",
                priority: "High",
                status: "Open",
                createdBy: "Dr. K. Senthil Kumar",
                message: "Our department has added 150 lateral entry students. We need to expand student capacity by 200."
            },
            {
                ticketId: "TKT-8839",
                collegeName: "PSG College of Technology",
                subject: "Custom NAAC accreditation excel format export assistance",
                priority: "Medium",
                status: "In Progress",
                createdBy: "Dr. R. Nandagopal",
                message: "Require guidance on custom column ordering for NBA Criterion 5 placement metric reporting."
            }
        ];

        for (const tck of ticketsToSeed) {
            const existing = await SupportTicket.findOne({ ticketId: tck.ticketId });
            if (!existing) {
                await SupportTicket.create(tck);
                console.log(`  + Seeded Ticket: ${tck.ticketId}`);
            }
        }

        console.log("🎉 Complete System MongoDB Seeding Finished Successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ System Seeding failed:", err.message);
        process.exit(1);
    }
};

seedAllModules();
