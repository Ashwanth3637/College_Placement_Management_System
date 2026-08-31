const Application = require("../models/applicationModel");

// Default initial candidate applications for system seeding
const initialApplicationsSeed = [
    {
        studentName: "Rahul Kumar",
        regNo: "22CSR101",
        department: "CSE",
        email: "rahul.k@gmail.com",
        phone: "+91 98765 43210",
        cgpa: 8.4,
        gradYear: 2026,
        companyName: "Amazon Development Center",
        jobRole: "Software Developer",
        appliedDate: "24 Aug 2026",
        status: "Applied",
        currentRound: 1,
        roundStatus: "In Progress",
        roundName: "Round 1: Technical Assessment",
        remarks: "Strong technical core in Java & Data Structures. Profile verified for Software Developer drive.",
        history: [
            { date: "24 Aug 2026", title: "Application Submitted", desc: "Applied for Amazon Development Center - Software Developer drive", status: "Passed ✓", roundNumber: 1 },
            { date: "25 Aug 2026", title: "Academic & Profile Verification", desc: "Profile verified by Placement Cell", status: "Passed ✓", roundNumber: 1 },
            { date: "26 Aug 2026", title: "Technical Assessment", desc: "Assessment link sent. Test evaluation in progress", status: "In Progress ⏳", roundNumber: 1 }
        ],
        interviewSchedule: {
            date: "28 Aug 2026",
            time: "10:00 AM IST",
            location: "College Main Auditorium & Online",
            mode: "Online",
            interviewer: "Amazon Tech Team",
            status: "Scheduled"
        }
    },
    {
        studentName: "Priya Sharma",
        regNo: "22IT045",
        department: "IT",
        email: "priya.sharma@gmail.com",
        phone: "+91 98765 43211",
        cgpa: 8.7,
        gradYear: 2026,
        companyName: "Amazon Development Center",
        jobRole: "Software Developer",
        appliedDate: "23 Aug 2026",
        status: "Shortlisted",
        currentRound: 1,
        roundStatus: "In Progress",
        roundName: "Round 1: Online Technical Assessment",
        remarks: "High CGPA 8.7 in IT department. Shortlisted for Online Assessment.",
        history: [
            { date: "23 Aug 2026", title: "Application Submitted", desc: "Applied for Software Developer drive", status: "Passed ✓", roundNumber: 1 },
            { date: "24 Aug 2026", title: "Shortlisted for Round 1", desc: "Cleared preliminary resume screening", status: "Passed ✓", roundNumber: 1 }
        ],
        interviewSchedule: {
            date: "27 Aug 2026",
            time: "11:30 AM IST",
            location: "Online HackerRank Platform",
            mode: "Online",
            interviewer: "Technical Evaluation Panel",
            status: "Scheduled"
        }
    },
    {
        studentName: "Arun Kumar",
        regNo: "22ECE032",
        department: "ECE",
        email: "arun.k@gmail.com",
        phone: "+91 98765 43212",
        cgpa: 7.9,
        gradYear: 2026,
        companyName: "Amazon Development Center",
        jobRole: "Sales Development",
        appliedDate: "22 Aug 2026",
        status: "Applied",
        currentRound: 1,
        roundStatus: "In Progress",
        roundName: "Round 1: Screening & Communication",
        remarks: "Application submitted for Sales Development drive. Pending document verification.",
        history: [
            { date: "22 Aug 2026", title: "Application Submitted", desc: "Applied for Sales Development drive", status: "Passed ✓", roundNumber: 1 }
        ],
        interviewSchedule: {
            date: "29 Aug 2026",
            time: "02:00 PM IST",
            location: "Placement Cell Discussion Room",
            mode: "On-site",
            interviewer: "Sales Manager / HR",
            status: "Scheduled"
        }
    },
    {
        studentName: "Ashwanth Kumar",
        regNo: "22CSR025",
        department: "CSE",
        email: "ashwanth@gmail.com",
        phone: "+91 98765 43213",
        cgpa: 8.45,
        gradYear: 2026,
        companyName: "Amazon Development Center",
        jobRole: "Cloud Engineer",
        appliedDate: "21 Aug 2026",
        status: "Technical Round",
        currentRound: 2,
        roundStatus: "Scheduled",
        roundName: "Round 2: Technical Interview",
        remarks: "Excellent project portfolio. Technical interview scheduled with Senior Engineering Lead.",
        history: [
            { date: "21 Aug 2026", title: "Application Submitted", desc: "Applied for Cloud Engineer drive", status: "Passed ✓", roundNumber: 1 },
            { date: "23 Aug 2026", title: "Passed Round 1: Assessment", desc: "Scored 92% in Online Coding Assessment", status: "Passed ✓", roundNumber: 1 },
            { date: "25 Aug 2026", title: "Advanced to Round 2", desc: "Scheduled for Technical & HR Interview", status: "Scheduled 🗓️", roundNumber: 2 }
        ],
        interviewSchedule: {
            date: "30 Aug 2026",
            time: "03:30 PM IST",
            location: "Google Meet / Amazon Chime",
            mode: "Online",
            interviewer: "Senior Cloud Lead",
            status: "Scheduled"
        }
    },
    {
        studentName: "Ananya Roy",
        regNo: "22CSR110",
        department: "CSE",
        email: "ananya.roy@gmail.com",
        phone: "+91 98765 43214",
        cgpa: 9.1,
        gradYear: 2026,
        companyName: "Amazon Development Center",
        jobRole: "Cloud Engineer",
        appliedDate: "20 Aug 2026",
        status: "Selected",
        currentRound: 3,
        roundStatus: "Passed",
        roundName: "Final Round Passed — Offer Letter Dispatched",
        remarks: "Top ranker (CGPA 9.1). Cleared all technical & HR rounds. Official offer letter issued.",
        history: [
            { date: "20 Aug 2026", title: "Application Submitted", desc: "Applied for Cloud Engineer drive", status: "Passed ✓", roundNumber: 1 },
            { date: "22 Aug 2026", title: "Passed Round 1: Assessment", desc: "Perfect score in coding evaluation", status: "Passed ✓", roundNumber: 1 },
            { date: "24 Aug 2026", title: "Passed Round 2: Technical Interview", desc: "Cleared System Architecture & Coding round", status: "Passed ✓", roundNumber: 2 },
            { date: "26 Aug 2026", title: "Passed Round 3: HR Bar Raiser", desc: "Cleared HR & Behavioral evaluation", status: "Passed ✓", roundNumber: 3 },
            { date: "27 Aug 2026", title: "Selected & Offer Released", desc: "Offer letter dispatched via Placement Cell", status: "Selected 🎉", roundNumber: 3 }
        ],
        interviewSchedule: {
            date: "26 Aug 2026",
            time: "04:00 PM IST",
            location: "Completed",
            mode: "Online",
            interviewer: "HR Director",
            status: "Completed"
        }
    }
];

// Helper to seed initial applications if MongoDB collection is empty
const ensureApplicationsSeeded = async () => {
    try {
        const count = await Application.countDocuments({ isActive: true });
        if (count === 0) {
            console.log("Seeding default placement applications in MongoDB...");
            await Application.insertMany(initialApplicationsSeed);
        }
    } catch (e) {
        console.error("Error seeding placement applications:", e);
    }
};

// GET /api/applications - Get all placement applications (supports filtering by email, companyName, status)
const getAllApplications = async (req, res) => {
    try {
        await ensureApplicationsSeeded();

        const { email, company, companyName, status, studentId } = req.query;
        let query = { isActive: true };

        if (email && email.trim()) {
            query.email = email.trim().toLowerCase();
        }
        const comp = companyName || company;
        if (comp && comp.trim()) {
            const cleanComp = comp.trim().split(" ")[0];
            query.companyName = { $regex: new RegExp(cleanComp, "i") };
        }
        if (status && status.trim()) {
            query.status = status.trim();
        }
        if (studentId && studentId.trim()) {
            query.studentId = studentId.trim();
        }

        const applications = await Application.find(query).sort({ createdAt: -1 });
        res.status(200).json(applications);
    } catch (error) {
        console.error("Get All Applications Error:", error);
        res.status(500).json({ message: "Failed to fetch applications", error: error.message });
    }
};

// GET /api/applications/:id - Get single application details
const getApplicationById = async (req, res) => {
    try {
        const { id } = req.params;
        const app = await Application.findById(id);
        if (!app) {
            return res.status(404).json({ message: "Application record not found" });
        }
        res.status(200).json(app);
    } catch (error) {
        console.error("Get Application By ID Error:", error);
        res.status(500).json({ message: "Failed to fetch application", error: error.message });
    }
};

// POST /api/applications - Apply for a placement drive
const createApplication = async (req, res) => {
    try {
        const body = req.body;
        if (!body.email || !body.companyName || !body.jobRole) {
            return res.status(400).json({ message: "Email, companyName, and jobRole are required" });
        }

        // Check if student already applied for this company + role
        const existing = await Application.findOne({
            email: body.email.toLowerCase().trim(),
            companyName: body.companyName,
            jobRole: body.jobRole,
            isActive: true
        });

        if (existing) {
            return res.status(200).json({ message: "Already applied for this drive", application: existing });
        }

        const todayStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        const payload = {
            studentId: body.studentId || "",
            studentName: body.studentName || body.name || "Student Candidate",
            regNo: body.regNo || body.registerNumber || "22CSR100",
            department: body.department || body.branch || "CSE",
            email: body.email.toLowerCase().trim(),
            phone: body.phone || "",
            cgpa: body.cgpa ? Number(body.cgpa) : 8.0,
            gradYear: body.gradYear ? Number(body.gradYear) : 2026,
            companyName: body.companyName,
            jobRole: body.jobRole,
            appliedDate: body.appliedDate || todayStr,
            status: "Applied",
            currentRound: 1,
            roundStatus: "In Progress",
            roundName: "Round 1: Technical Assessment",
            remarks: "Application submitted and verified by Placement Portal.",
            history: [
                {
                    date: todayStr,
                    title: "Application Submitted",
                    desc: `Applied for ${body.companyName} - ${body.jobRole} drive`,
                    status: "Passed ✓",
                    roundNumber: 1
                }
            ],
            interviewSchedule: {
                date: body.interviewDate || "28 Aug 2026",
                time: body.interviewTime || "10:00 AM IST",
                location: "College Main Auditorium & Online",
                mode: "Online",
                interviewer: `${body.companyName} Hiring Team`,
                status: "Scheduled"
            }
        };

        const newApp = new Application(payload);
        await newApp.save();

        res.status(201).json({ message: "Application submitted successfully in MongoDB", application: newApp });
    } catch (error) {
        console.error("Create Application Error:", error);
        res.status(500).json({ message: "Failed to submit application", error: error.message });
    }
};

// PUT /api/applications/:id/status - Officer/Recruiter updates round progression, status, history, and interview schedule
const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, currentRound, roundStatus, roundName, remarks, historyItem, interviewSchedule } = req.body;

        const app = await Application.findById(id);
        if (!app) {
            return res.status(404).json({ message: "Application record not found" });
        }

        if (status !== undefined) app.status = status;
        if (currentRound !== undefined) app.currentRound = currentRound;
        if (roundStatus !== undefined) app.roundStatus = roundStatus;
        if (roundName !== undefined) app.roundName = roundName;
        if (remarks !== undefined) app.remarks = remarks;

        if (historyItem && historyItem.title) {
            app.history.push({
                date: historyItem.date || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                title: historyItem.title,
                desc: historyItem.desc || "",
                status: historyItem.status || "Passed ✓",
                roundNumber: historyItem.roundNumber || app.currentRound
            });
        }

        if (interviewSchedule) {
            app.interviewSchedule = {
                ...app.interviewSchedule,
                ...interviewSchedule
            };
        }

        await app.save();
        res.status(200).json({ message: "Application status updated successfully in MongoDB", application: app });
    } catch (error) {
        console.error("Update Application Status Error:", error);
        res.status(500).json({ message: "Failed to update application status", error: error.message });
    }
};

// PUT /api/applications/:id/round-result - Recruiter submits round evaluation (PASS/FAIL) for Officer Verification
const submitRoundResult = async (req, res) => {
    try {
        const { id } = req.params;
        const { roundNumber, roundName, score, remarks, recruiterDecision } = req.body;

        const app = await Application.findById(id);
        if (!app) {
            return res.status(404).json({ message: "Application record not found" });
        }

        const decision = (recruiterDecision || "PASS").toUpperCase();
        const rNum = roundNumber || app.currentRound || 1;
        const rName = roundName || app.roundName || `Round ${rNum}`;

        // Upsert round result
        const existingIdx = (app.roundResults || []).findIndex(r => r.roundNumber === rNum);
        const resultObj = {
            roundNumber: rNum,
            roundName: rName,
            score: score || "Qualified",
            remarks: remarks || `Candidate evaluated by recruiter: ${decision}`,
            recruiterDecision: decision,
            officerVerified: false,
            verifiedAt: null,
            verifiedBy: ""
        };

        if (existingIdx >= 0) {
            app.roundResults[existingIdx] = resultObj;
        } else {
            app.roundResults.push(resultObj);
        }

        app.officerVerificationPending = true;
        app.roundStatus = "Pending Officer Verification";
        app.remarks = remarks || `Round ${rNum} marked ${decision} by recruiter. Awaiting Officer verification.`;

        const todayStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        app.history.push({
            date: todayStr,
            title: `Round ${rNum}: ${decision} (Submitted for Verification)`,
            desc: remarks || `Recruiter evaluated candidate as ${decision}. Sent to Placement Officer for official verification.`,
            status: "Pending Verification ⏳",
            roundNumber: rNum
        });

        await app.save();
        res.status(200).json({ message: "Round result submitted for Placement Officer verification", application: app });
    } catch (error) {
        console.error("Submit Round Result Error:", error);
        res.status(500).json({ message: "Failed to submit round result", error: error.message });
    }
};

// PUT /api/applications/:id/verify-round - Placement Officer verifies round result & advances student to next round or final selection
const verifyRoundResult = async (req, res) => {
    try {
        const { id } = req.params;
        const { officerDecision, verifiedBy, remarks } = req.body; // officerDecision: "APPROVE" or "REJECT"

        const app = await Application.findById(id);
        if (!app) {
            return res.status(404).json({ message: "Application record not found" });
        }

        const rNum = app.currentRound || 1;
        const latestResult = (app.roundResults || []).find(r => r.roundNumber === rNum) || {
            recruiterDecision: "PASS",
            roundName: app.roundName
        };

        const todayStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        latestResult.officerVerified = true;
        latestResult.verifiedAt = new Date();
        latestResult.verifiedBy = verifiedBy || "Placement Officer";

        if (latestResult.recruiterDecision === "PASS" && officerDecision !== "REJECT") {
            const totRounds = app.totalRounds || (app.roundsWorkflow && app.roundsWorkflow.length > 0 ? app.roundsWorkflow.length : 3);
            if (rNum < totRounds) {
                // Advance to next round
                const nextRNum = rNum + 1;
                const nextWorkflowRound = (app.roundsWorkflow || []).find(rw => rw.roundNumber === nextRNum);
                const nextRName = nextWorkflowRound ? nextWorkflowRound.roundName : `Round ${nextRNum}: Technical Interview`;

                app.currentRound = nextRNum;
                app.roundName = nextRName;
                app.status = "In Round";
                app.roundStatus = "Scheduled";
                app.officerVerificationPending = false;
                app.remarks = remarks || `Round ${rNum} passed and verified by Officer. Advanced to Round ${nextRNum}.`;

                app.history.push({
                    date: todayStr,
                    title: `Round ${rNum} Verified (PASS ✓)`,
                    desc: `Placement Officer verified Round ${rNum} results. Candidate advanced to ${nextRName}.`,
                    status: "Passed ✓",
                    roundNumber: rNum
                });
            } else {
                // Final round cleared!
                app.status = "Selected";
                app.roundStatus = "Passed";
                app.officerVerificationPending = false;
                app.roundName = "Final Selection Verified";
                app.remarks = remarks || "Candidate has cleared all recruitment rounds and has been officially verified by Placement Officer.";

                app.history.push({
                    date: todayStr,
                    title: "Final Selection Verified 🎉",
                    desc: `All ${totRounds} rounds cleared and verified by Placement Officer. Student officially Selected!`,
                    status: "Selected 🎉",
                    roundNumber: rNum
                });
            }
        } else {
            // Failed or rejected
            app.status = "Rejected";
            app.roundStatus = "Failed";
            app.officerVerificationPending = false;
            app.remarks = remarks || `Application rejected at Round ${rNum} upon Placement Officer review.`;

            app.history.push({
                date: todayStr,
                title: `Round ${rNum} (FAIL / Rejected ✕)`,
                desc: remarks || `Candidate did not clear Round ${rNum}. Official status marked as Rejected.`,
                status: "Rejected ✕",
                roundNumber: rNum
            });
        }

        await app.save();
        res.status(200).json({ message: "Placement Officer verification completed successfully", application: app });
    } catch (error) {
        console.error("Verify Round Result Error:", error);
        res.status(500).json({ message: "Failed to verify round result", error: error.message });
    }
};

// POST /api/applications/:id/offer-letter - Placement Officer releases official offer letter & creates placement record
const releaseOfferLetter = async (req, res) => {
    try {
        const { id } = req.params;
        const { ctc, joiningDate, location, offerLetterUrl } = req.body;

        const app = await Application.findById(id);
        if (!app) {
            return res.status(404).json({ message: "Application record not found" });
        }

        const todayStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
        app.status = "Selected";
        app.offerDetails = {
            ctc: ctc || "₹18.0 LPA",
            joiningDate: joiningDate || "01 Jul 2027",
            location: location || "Bangalore, India",
            offerLetterUrl: offerLetterUrl || `/offers/${app.regNo}_OfferLetter.pdf`,
            isReleased: true,
            releaseDate: todayStr
        };

        app.history.push({
            date: todayStr,
            title: "Official Offer Letter Released 📄",
            desc: `Offer of ${app.offerDetails.ctc} released for ${app.jobRole} at ${app.companyName}. Joining date: ${app.offerDetails.joiningDate}`,
            status: "Offer Released 📄",
            roundNumber: app.currentRound
        });

        await app.save();
        res.status(200).json({ message: "Official Offer Letter released and placement confirmed!", application: app });
    } catch (error) {
        console.error("Release Offer Letter Error:", error);
        res.status(500).json({ message: "Failed to release offer letter", error: error.message });
    }
};

// DELETE /api/applications/:id - Cancel/remove application
const deleteApplication = async (req, res) => {
    try {
        const { id } = req.params;
        await Application.findByIdAndUpdate(id, { isActive: false });
        res.status(200).json({ message: "Application removed successfully" });
    } catch (error) {
        console.error("Delete Application Error:", error);
        res.status(500).json({ message: "Failed to delete application", error: error.message });
    }
};

module.exports = {
    getAllApplications,
    getApplicationById,
    createApplication,
    updateApplicationStatus,
    submitRoundResult,
    verifyRoundResult,
    releaseOfferLetter,
    deleteApplication
};
