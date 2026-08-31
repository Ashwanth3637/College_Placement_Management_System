export interface RecruiterActivityItem {
    id: string;
    type: 
        | "PLACEMENT_DRIVE_APPROVED" 
        | "PLACEMENT_DRIVE_REJECTED" 
        | "PLACEMENT_DRIVE_SUBMITTED"
        | "APPLICATION_RECEIVED"
        | "CANDIDATE_SHORTLISTED"
        | "INTERVIEW_SCHEDULED"
        | "CANDIDATE_SELECTED";
    title: string;
    message: string;
    company: string;
    driveRole?: string;
    createdAt: string;
}

export const getRecruiterActivities = (): RecruiterActivityItem[] => {
    try {
        const saved = localStorage.getItem("cpms_recruiter_activities");
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) { }

    // Initial default activity if none exist
    return [
        {
            id: "act_default_1",
            type: "PLACEMENT_DRIVE_APPROVED",
            title: "Placement Drive Approved",
            message: "Software Developer placement drive has been approved and applications are now open.",
            company: "Amazon Development Center",
            driveRole: "Software Developer",
            createdAt: new Date().toISOString()
        },
        {
            id: "act_default_2",
            type: "APPLICATION_RECEIVED",
            title: "New Application Received",
            message: "Rahul Kumar applied for Software Developer placement drive.",
            company: "Amazon Development Center",
            driveRole: "Software Developer",
            createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: "act_default_3",
            type: "CANDIDATE_SHORTLISTED",
            title: "Candidate Shortlisted",
            message: "Ashwanth S was shortlisted for Round 2 Technical Interview.",
            company: "Amazon Development Center",
            driveRole: "Cloud Engineer",
            createdAt: new Date(Date.now() - 7200000).toISOString()
        }
    ];
};

export const addRecruiterActivity = (activity: Omit<RecruiterActivityItem, "id" | "createdAt">) => {
    try {
        const list = getRecruiterActivities();
        const newAct: RecruiterActivityItem = {
            id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            ...activity,
            createdAt: new Date().toISOString()
        };

        // Prevent exact duplicate activity within last 10 seconds
        const isDup = list.some(
            a => a.type === activity.type &&
                a.driveRole === activity.driveRole &&
                (Date.now() - new Date(a.createdAt).getTime() < 10000)
        );

        if (!isDup) {
            const updated = [newAct, ...list].slice(0, 25);
            localStorage.setItem("cpms_recruiter_activities", JSON.stringify(updated));
            window.dispatchEvent(new Event("storage"));
        }
    } catch (e) {
        console.error("Failed to add recruiter activity", e);
    }
};

export const formatRelativeTime = (isoString: string): string => {
    try {
        const now = new Date();
        const past = new Date(isoString);
        const diffMs = now.getTime() - past.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);

        if (diffSec < 45) return "Just now";
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHour < 24) return `${diffHour}h ago`;
        return past.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch (e) {
        return "Just now";
    }
};
