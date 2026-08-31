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
