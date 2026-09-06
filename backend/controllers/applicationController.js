const Application = require("../models/applicationModel");

// GET /api/applications - Get all placement applications (supports filtering by email, companyName, status)
const getAllApplications = async (req, res) => {
    try {
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

        // Retrieve CompanyDrive to copy configured recruitment rounds
        let drive = null;
        try {
            const CompanyDrive = require("../models/companyDriveModel");
            if (body.driveId) {
                drive = await CompanyDrive.findById(body.driveId);
            }
            if (!drive && body.companyName) {
                const compPrefix = body.companyName.trim().split(" ")[0];
                drive = await CompanyDrive.findOne({
                    company: { $regex: new RegExp(compPrefix, "i") }
                });
            }
        } catch (de) {}

        const driveRounds = (drive && Array.isArray(drive.rounds) && drive.rounds.length > 0)
            ? drive.rounds
            : (Array.isArray(body.roundsWorkflow) && body.roundsWorkflow.length > 0 ? body.roundsWorkflow : []);

        const initialRoundName = driveRounds.length > 0 ? driveRounds[0].roundName : "Round 1: Selection Assessment";
        const totalRoundsCount = driveRounds.length > 0 ? driveRounds.length : 1;

        const payload = {
            studentId: body.studentId || "",
            studentName: body.studentName || body.name || "",
            regNo: body.regNo || body.registerNumber || "",
            department: body.department || body.branch || "",
            email: body.email.toLowerCase().trim(),
            phone: body.phone || "",
            cgpa: body.cgpa ? Number(body.cgpa) : 0,
            gradYear: body.gradYear ? Number(body.gradYear) : 2026,
            companyName: body.companyName,
            jobRole: body.jobRole,
            driveId: drive ? drive._id.toString() : (body.driveId || ""),
            appliedDate: body.appliedDate || todayStr,
            status: "Applied",
            currentRound: 1,
            totalRounds: totalRoundsCount,
            roundStatus: "In Progress",
            roundName: initialRoundName,
            roundsWorkflow: driveRounds,
            remarks: "Application submitted and registered successfully.",
            history: [
                {
                    date: todayStr,
                    title: "Application Submitted",
                    desc: `Opted in for ${body.companyName} - ${body.jobRole} drive`,
                    status: "Registered",
                    roundNumber: 1
                }
            ],
            interviewSchedule: {
                date: body.interviewDate || drive?.deadline || "",
                time: body.interviewTime || "",
                location: drive?.location || "",
                mode: driveRounds[0]?.mode || "Online",
                interviewer: `${body.companyName} Recruitment Team`,
                status: "Scheduled"
            }
        };

        const newApp = new Application(payload);
        await newApp.save();

        // Trigger notification for student
        try {
            const Notification = require("../models/notificationModel");
            await Notification.create({
                recipientId: newApp.studentId || "students",
                recipientEmail: newApp.email,
                title: `Application Confirmed: ${newApp.companyName}`,
                message: `Your application for ${newApp.jobRole} has been received. Initial stage: ${initialRoundName}.`,
                type: "Eligible",
                company: newApp.companyName,
                link: "/student/applications"
            });
        } catch (ne) {}

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

// =====================================================
// Flow 4: Opt-In for a Drive
// =====================================================
const optInDrive = async (req, res) => {
    try {
        const { userId, driveId, studentName, regNo, department, email, phone, cgpa, tenthPercentage, twelfthPercentage, backlogs, gradYear, companyName, jobRole } = req.body;

        if (!driveId || !email) {
            return res.status(400).json({ message: "Drive ID and student email are required." });
        }

        const CompanyDrive = require("../models/companyDriveModel");
        const drive = await CompanyDrive.findById(driveId);
        if (!drive) {
            return res.status(404).json({ message: "Drive not found." });
        }

        if (drive.optInOutDeadline && new Date() > new Date(drive.optInOutDeadline)) {
            return res.status(400).json({ message: "The opt-in/opt-out deadline for this drive has passed." });
        }

        const existing = await Application.findOne({
            email: email.toLowerCase().trim(),
            driveId: String(driveId),
            isActive: true,
        });

        if (existing) {
            existing.status = "Opted-In";
            existing.optInOutStatus = "opted-in";
            existing.optInOutDeadline = drive.optInOutDeadline;
            await existing.save();
            return res.status(200).json({ message: "Successfully opted in for this drive!", application: existing });
        }

        const app = await Application.create({
            studentId: userId || "",
            studentName: studentName || "Student",
            regNo: regNo || "",
            department: department || "",
            email: (email || "").toLowerCase().trim(),
            phone: phone || "",
            cgpa: cgpa || 0,
            tenthPercentage: tenthPercentage || 0,
            twelfthPercentage: twelfthPercentage || 0,
            backlogs: backlogs || 0,
            gradYear: gradYear || 2026,
            driveId: String(driveId),
            companyName: companyName || drive.company || "",
            jobRole: jobRole || drive.role || drive.jobTitle || "",
            status: "Opted-In",
            optInOutStatus: "opted-in",
            optInOutDeadline: drive.optInOutDeadline,
            appliedDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
            history: [{ date: new Date().toISOString(), title: "Opted In", desc: `Student opted in for ${drive.company}`, status: "Opted-In" }],
        });

        res.status(201).json({ message: "Successfully opted in for this drive!", application: app });
    } catch (error) {
        console.error("Opt-In Error:", error);
        res.status(500).json({ message: "Failed to opt in", error: error.message });
    }
};

// =====================================================
// Flow 4: Opt-Out from a Drive
// =====================================================
const optOutDrive = async (req, res) => {
    try {
        const { driveId, email } = req.body;

        if (!driveId || !email) {
            return res.status(400).json({ message: "Drive ID and email are required." });
        }

        const CompanyDrive = require("../models/companyDriveModel");
        const drive = await CompanyDrive.findById(driveId);

        if (drive && drive.optInOutDeadline && new Date() > new Date(drive.optInOutDeadline)) {
            return res.status(400).json({ message: "The opt-in/opt-out deadline for this drive has passed." });
        }

        const existing = await Application.findOne({
            email: email.toLowerCase().trim(),
            driveId: String(driveId),
            isActive: true,
        });

        if (existing) {
            existing.status = "Opted-Out";
            existing.optInOutStatus = "opted-out";
            await existing.save();
            return res.status(200).json({ message: "Successfully opted out from this drive.", application: existing });
        }

        const app = await Application.create({
            studentId: req.body.userId || "",
            studentName: req.body.studentName || "Student",
            regNo: req.body.regNo || "",
            department: req.body.department || "",
            email: email.toLowerCase().trim(),
            driveId: String(driveId),
            companyName: drive ? drive.company : "",
            jobRole: drive ? (drive.role || drive.jobTitle) : "",
            status: "Opted-Out",
            optInOutStatus: "opted-out",
            optInOutDeadline: drive ? drive.optInOutDeadline : null,
        });

        res.status(200).json({ message: "Successfully opted out from this drive.", application: app });
    } catch (error) {
        console.error("Opt-Out Error:", error);
        res.status(500).json({ message: "Failed to opt out", error: error.message });
    }
};

// =====================================================
// Flow 4: Get Eligible Drives for a Student
// =====================================================
const getEligibleDrives = async (req, res) => {
    try {
        const { userId } = req.params;
        const mongoose = require("mongoose");
        const Student = require("../models/studentModel");
        const User = require("../models/user");
        const CompanyDrive = require("../models/companyDriveModel");

        let student = null;
        if (mongoose.Types.ObjectId.isValid(userId)) {
            student = await Student.findOne({ user: userId }).lean();
            if (!student) student = await Student.findById(userId).lean();
        }
        if (!student) {
            const queryEmail = (req.query.email || "").toLowerCase().trim();
            if (queryEmail) {
                const userDoc = await User.findOne({ email: queryEmail });
                if (userDoc) student = await Student.findOne({ user: userDoc._id }).lean();
            }
        }

        if (!student) {
            return res.status(404).json({ message: "Student profile not found." });
        }

        let userDoc = null;
        if (student.user) {
            userDoc = await User.findById(student.user).lean();
        }
        if (userDoc && userDoc.isFrozen) {
            return res.status(200).json({
                eligible: [],
                ineligible: [],
                isFrozen: true,
                frozenAt: userDoc.frozenAt,
                message: "Your account has been frozen due to missing opt-in/opt-out deadlines. Please contact the Placement Officer.",
            });
        }

        const drives = await CompanyDrive.find({
            isActive: true,
            status: { $in: ["Approved", "Active", "Upcoming", "Ongoing", "Pending Approval"] },
        }).sort({ createdAt: -1 }).lean();

        const studentEmail = (student.personal?.email || userDoc?.email || "").toLowerCase().trim();
        const existingApps = await Application.find({ email: studentEmail, isActive: true }).lean();
        const appMap = {};
        for (const app of existingApps) { appMap[app.driveId] = app; }

        const eligible = [];
        const ineligible = [];

        const sCgpa = parseFloat(student.academic?.cgpa) || 0;
        const sTenth = parseFloat(student.academic?.tenthPercentage) || 0;
        const sTwelfth = parseFloat(student.academic?.twelfthPercentage) || 0;
        const sBacklogs = parseInt(student.academic?.backlogs) || 0;
        const sGradYear = parseInt(student.academic?.graduationYear) || 2026;
        const sDept = (student.personal?.department || "").toLowerCase().trim();

        for (const drive of drives) {
            const driveId = String(drive._id);
            const reasons = [];

            if (drive.minCgpa && sCgpa < drive.minCgpa) {
                reasons.push(`CGPA ${sCgpa} is below required ${drive.minCgpa}`);
            }
            if (drive.minTenth && sTenth < drive.minTenth) {
                reasons.push(`10th percentage ${sTenth}% is below required ${drive.minTenth}%`);
            }
            if (drive.minTwelfth && sTwelfth < drive.minTwelfth) {
                reasons.push(`12th percentage ${sTwelfth}% is below required ${drive.minTwelfth}%`);
            }
            if (drive.maxBacklogs !== undefined && drive.maxBacklogs !== null && sBacklogs > drive.maxBacklogs) {
                reasons.push(`Active backlogs (${sBacklogs}) exceed maximum allowed (${drive.maxBacklogs})`);
            }
            if (drive.gradYear && sGradYear !== drive.gradYear) {
                reasons.push(`Graduation year ${sGradYear} does not match required ${drive.gradYear}`);
            }
            if (drive.eligibleBranches && drive.eligibleBranches.length > 0) {
                const bl = drive.eligibleBranches.map(b => b.toLowerCase().trim());
                const aliases = [sDept];
                if (sDept.includes("computer") || sDept.includes("cse")) aliases.push("cse", "computer science", "cs");
                if (sDept.includes("information") || sDept.includes("it")) aliases.push("it", "information technology");
                if (sDept.includes("electronics") || sDept.includes("ece")) aliases.push("ece", "electronics");
                if (sDept.includes("mechanical") || sDept.includes("mech")) aliases.push("mech", "mechanical");
                if (sDept.includes("electrical") || sDept.includes("eee")) aliases.push("eee", "electrical");
                if (sDept.includes("civil")) aliases.push("civil");
                const match = aliases.some(a => bl.some(b => b.includes(a) || a.includes(b)));
                if (!match) {
                    reasons.push(`Department "${student.personal?.department || "N/A"}" is not in eligible branches: ${drive.eligibleBranches.join(", ")}`);
                }
            }

            const existingApp = appMap[driveId];
            const driveData = { ...drive, existingApplication: existingApp || null, optInOutStatus: existingApp?.optInOutStatus || "pending" };

            if (reasons.length === 0) {
                eligible.push(driveData);
            } else {
                ineligible.push({ ...driveData, ineligibilityReasons: reasons });
            }
        }

        // Freeze check
        const now = new Date();
        let shouldFreeze = false;
        for (const drive of eligible) {
            if (drive.optInOutDeadline && new Date(drive.optInOutDeadline) < now) {
                const app = appMap[String(drive._id)];
                if (!app || app.optInOutStatus === "pending") { shouldFreeze = true; break; }
            }
        }
        if (shouldFreeze && userDoc && !userDoc.isFrozen) {
            await User.findByIdAndUpdate(userDoc._id, { isFrozen: true, frozenAt: now });
        }

        res.status(200).json({
            eligible, ineligible, isFrozen: shouldFreeze,
            studentProfile: { cgpa: sCgpa, tenth: sTenth, twelfth: sTwelfth, backlogs: sBacklogs, gradYear: sGradYear, department: student.personal?.department || "" },
        });
    } catch (error) {
        console.error("Get Eligible Drives Error:", error);
        res.status(500).json({ message: "Failed to fetch eligible drives", error: error.message });
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
    deleteApplication,
    optInDrive,
    optOutDrive,
    getEligibleDrives,
};
