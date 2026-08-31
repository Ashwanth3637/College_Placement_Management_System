const Interview = require("../models/interviewModel");

// Default initial seed data matching 10/10 specs
const defaultInterviews = [
    {
        company: "Microsoft India",
        role: "Support Engineer & Cloud Consultant",
        logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo_%282012%29.svg",
        status: "scheduled",
        roundTitle: "Round 1 — Online Assessment (Codility)",
        date: "31 Aug 2026",
        time: "10:00 AM IST",
        interviewer: "Siva (Senior Technical Lead)",
        mode: "Online",
        platform: "Codility",
        venue: "",
        meetingLink: "https://codility.com/test/ms-cloud-2026",
        instructions: [
            "Join 10 minutes prior to scheduled assessment time",
            "Keep college ID & Government ID ready for proctoring verification",
            "Ensure stable internet connection & working webcam/microphone",
            "Webcam must remain enabled throughout the assessment",
        ],
        history: [
            { round: "Round 3", name: "AA Leadership & HR Round", date: "03 Sep 2026", status: "Passed ✓" },
            { round: "Round 2", name: "Technical Interview (Cloud & OS)", date: "02 Sep 2026", status: "Passed ✓" },
            { round: "Round 1", name: "Online Assessment (Codility)", date: "31 Aug 2026", status: "Passed ✓" },
        ],
        timeline: [
            { round: "Round 1", title: "Online Assessment (Codility)", date: "31 Aug 2026", status: "Passed" },
            { round: "Round 2", title: "Technical Interview (Cloud & OS)", date: "02 Sep 2026", status: "Passed" },
            { round: "Round 3", title: "AA Leadership & HR Round", date: "03 Sep 2026", status: "Scheduled" },
            { round: "Round 4", title: "Final Executive Sign-off", date: "05 Sep 2026", status: "Not Scheduled" },
        ],
    },
    {
        company: "Zoho Corporation",
        role: "Software Developer Trainee",
        logo: "/company-logos/zoho.png",
        status: "today",
        roundTitle: "Round 2 — Technical Programming Interview",
        date: "27 Aug 2026",
        time: "02:30 PM IST",
        interviewer: "Rajesh Kumar (Principal Architect)",
        mode: "Offline",
        platform: "",
        venue: "Placement Cell — Room 204",
        meetingLink: "",
        instructions: [
            "Report to Placement Cell — Room 204 at least 15 minutes before slot",
            "Bring 2 printed copies of updated resume & college ID",
            "Bring notebook & pen for whiteboard algorithm discussion",
        ],
        history: [
            { round: "Round 1", name: "General Aptitude & C Programming Test", date: "22 Aug 2026", status: "Passed ✓" },
        ],
        timeline: [
            { round: "Round 1", title: "General Aptitude & C Test", date: "22 Aug 2026", status: "Passed" },
            { round: "Round 2", title: "Technical Programming Interview", date: "27 Aug 2026", status: "Today" },
            { round: "Round 3", title: "Advanced System Design & HR", date: "29 Aug 2026", status: "Not Scheduled" },
        ],
    },
    {
        company: "Accenture",
        role: "Advanced Application Engineering Associate",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Accenture.svg/512px-Accenture.svg.png",
        status: "rescheduled",
        roundTitle: "Round 3 — Technical & HR Interview",
        date: "29 Aug 2026",
        time: "11:00 AM IST",
        previousDate: "28 Aug 2026",
        previousTime: "02:00 PM IST",
        rescheduleReason: "Interviewer panel availability changed due to client emergency",
        interviewer: "Priya Sundaram (HR Lead)",
        mode: "Online",
        platform: "MS Teams",
        venue: "",
        meetingLink: "https://teams.microsoft.com/l/meetup-join/accenture-recruitment-2026",
        instructions: [
            "Join MS Teams meeting link 5 minutes before scheduled start time",
            "Keep digital resume PDF ready for screen sharing",
        ],
        history: [
            { round: "Round 2", name: "Coding & Technical Round", date: "26 Aug 2026", status: "Passed ✓" },
            { round: "Round 1", name: "Cognitive & Technical Assessment", date: "25 Aug 2026", status: "Passed ✓" },
        ],
        timeline: [
            { round: "Round 1", title: "Cognitive & Technical Assessment", date: "25 Aug 2026", status: "Passed" },
            { round: "Round 2", title: "Coding & Technical Round", date: "26 Aug 2026", status: "Passed" },
            { round: "Round 3", title: "Technical & HR Interview", date: "29 Aug 2026", status: "Rescheduled" },
        ],
    },
    {
        company: "Amazon Development Center",
        role: "SDE Trainee / Intern + FTE",
        logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
        status: "passed",
        roundTitle: "Round 3 — Bar Raiser & Technical Interview 2",
        date: "24 Aug 2026",
        time: "11:00 AM IST",
        interviewer: "Arun Prakash (Senior SDE Lead)",
        mode: "Online",
        platform: "Chime",
        venue: "",
        meetingLink: "",
        instructions: [],
        history: [
            { round: "Round 3", name: "Bar Raiser & Technical Interview 2", date: "24 Aug 2026", status: "Passed ✓" },
            { round: "Round 2", name: "Technical Interview 1 (DSA & Systems)", date: "23 Aug 2026", status: "Passed ✓" },
            { round: "Round 1", name: "Online Assessment (HackerRank)", date: "20 Aug 2026", status: "Passed ✓" },
        ],
        timeline: [
            { round: "Round 1", title: "Online Assessment (HackerRank)", date: "20 Aug 2026", status: "Passed" },
            { round: "Round 2", title: "Technical Interview 1", date: "23 Aug 2026", status: "Passed" },
            { round: "Round 3", title: "Bar Raiser & Technical Interview 2", date: "24 Aug 2026", status: "Passed" },
        ],
    },
    {
        company: "Cognizant",
        role: "GenC Next Developer",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Cognizant_logo_2022.svg/512px-Cognizant_logo_2022.svg.png",
        status: "cancelled",
        roundTitle: "Round 2 — Technical Interview",
        date: "28 Aug 2026",
        time: "03:00 PM IST",
        cancelReason: "Recruiter requested rescheduling drive date due to national holiday adjustment.",
        interviewer: "TPO Technical Panel",
        mode: "Online",
        platform: "Superset",
        venue: "",
        meetingLink: "",
        instructions: [],
        history: [
            { round: "Round 1", name: "GenC Aptitude & Technical Test", date: "25 Aug 2026", status: "Passed ✓" },
        ],
        timeline: [
            { round: "Round 1", title: "GenC Aptitude Test", date: "25 Aug 2026", status: "Passed" },
            { round: "Round 2", title: "Technical Interview", date: "28 Aug 2026", status: "Cancelled" },
        ],
    },
];

const getAllInterviews = async (req, res) => {
    try {
        let interviews = await Interview.find().sort({ createdAt: -1 });

        if (!interviews || interviews.length === 0) {
            interviews = await Interview.insertMany(defaultInterviews);
        }

        return res.status(200).json(interviews);
    } catch (error) {
        console.error("Get All Interviews Error:", error);
        return res.status(500).json({
            message: "Failed to fetch interview records",
            error: error.message,
        });
    }
};

const createInterview = async (req, res) => {
    try {
        const interview = new Interview(req.body);
        await interview.save();
        return res.status(201).json({
            message: "Interview scheduled successfully",
            interview,
        });
    } catch (error) {
        console.error("Create Interview Error:", error);
        return res.status(500).json({
            message: "Failed to create interview record",
            error: error.message,
        });
    }
};

const updateInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Interview.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) {
            return res.status(404).json({ message: "Interview record not found" });
        }
        return res.status(200).json({
            message: "Interview record updated successfully",
            interview: updated,
        });
    } catch (error) {
        console.error("Update Interview Error:", error);
        return res.status(500).json({
            message: "Failed to update interview record",
            error: error.message,
        });
    }
};

const rescheduleInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, time, reason } = req.body;
        const existing = await Interview.findById(id);
        if (!existing) {
            return res.status(404).json({ message: "Interview record not found" });
        }

        existing.previousDate = existing.date;
        existing.previousTime = existing.time;
        existing.date = date || existing.date;
        existing.time = time || existing.time;
        existing.status = "rescheduled";
        existing.rescheduleReason = reason || "Officer rescheduled session slot";

        await existing.save();
        return res.status(200).json({
            message: "Interview rescheduled successfully",
            interview: existing,
        });
    } catch (error) {
        console.error("Reschedule Interview Error:", error);
        return res.status(500).json({
            message: "Failed to reschedule interview",
            error: error.message,
        });
    }
};

const cancelInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const existing = await Interview.findById(id);
        if (!existing) {
            return res.status(404).json({ message: "Interview record not found" });
        }

        existing.status = "cancelled";
        existing.cancelReason = reason || "Interview session cancelled by officer/recruiter";

        await existing.save();
        return res.status(200).json({
            message: "Interview cancelled successfully",
            interview: existing,
        });
    } catch (error) {
        console.error("Cancel Interview Error:", error);
        return res.status(500).json({
            message: "Failed to cancel interview",
            error: error.message,
        });
    }
};

module.exports = {
    getAllInterviews,
    createInterview,
    updateInterview,
    rescheduleInterview,
    cancelInterview,
};
