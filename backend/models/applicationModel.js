const mongoose = require("mongoose");

const historyItemSchema = new mongoose.Schema({
    date: { type: String, required: true },
    title: { type: String, required: true },
    desc: { type: String, required: true },
    status: { type: String, required: true },
    roundNumber: { type: Number, default: 1 }
}, { _id: false });

const interviewScheduleSchema = new mongoose.Schema({
    date: { type: String, default: "" },
    time: { type: String, default: "" },
    location: { type: String, default: "" },
    mode: { type: String, default: "Online" },
    interviewer: { type: String, default: "" },
    status: { type: String, default: "Scheduled" }
}, { _id: false });

const roundResultSchema = new mongoose.Schema({
    roundNumber: { type: Number, required: true },
    roundName: { type: String, required: true },
    score: { type: String, default: "" },
    remarks: { type: String, default: "" },
    recruiterDecision: { type: String, enum: ["PENDING", "PASS", "FAIL"], default: "PENDING" },
    officerVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    verifiedBy: { type: String, default: "" }
}, { _id: false });

const offerDetailsSchema = new mongoose.Schema({
    ctc: { type: String, default: "" },
    joiningDate: { type: String, default: "" },
    location: { type: String, default: "" },
    offerLetterUrl: { type: String, default: "" },
    isReleased: { type: Boolean, default: false },
    releaseDate: { type: String, default: "" }
}, { _id: false });

const applicationSchema = new mongoose.Schema(
    {
        studentId: { type: String, default: "" },
        studentName: { type: String, required: true },
        regNo: { type: String, required: true },
        department: { type: String, required: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        phone: { type: String, default: "" },
        cgpa: { type: Number, default: 8.0 },
        tenthPercentage: { type: Number, default: 75.0 },
        twelfthPercentage: { type: Number, default: 75.0 },
        backlogs: { type: Number, default: 0 },
        gradYear: { type: Number, default: 2026 },

        driveId: { type: String, default: "" },
        companyName: { type: String, required: true },
        jobRole: { type: String, required: true },
        appliedDate: { type: String, default: () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) },

        status: {
            type: String,
            enum: ["Applied", "Opted-In", "Under Review", "Shortlisted", "Assessment", "Technical Round", "HR Round", "In Round", "Selected", "Rejected", "Not Shortlisted", "Withdrawn"],
            default: "Applied"
        },
        currentRound: { type: Number, default: 1 },
        totalRounds: { type: Number, default: 3 },
        roundStatus: { type: String, default: "In Progress" },
        roundName: { type: String, default: "Round 1: Online Assessment" },
        officerVerificationPending: { type: Boolean, default: false },

        roundsWorkflow: [
            {
                roundNumber: { type: Number },
                roundName: { type: String },
                mode: { type: String, default: "Online" },
                date: { type: String, default: "" },
                description: { type: String, default: "" }
            }
        ],
        roundResults: [roundResultSchema],
        offerDetails: { type: offerDetailsSchema, default: () => ({}) },

        history: [historyItemSchema],
        interviewSchedule: { type: interviewScheduleSchema, default: () => ({}) },

        remarks: { type: String, default: "Candidate profile verified by Placement Cell." },
        resumeName: { type: String, default: "Resume_Student.pdf" },
        resumeUrl: { type: String, default: "" },

        isActive: { type: Boolean, default: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);
