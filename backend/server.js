const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const companyRoutes = require("./routes/companyRoutes");
const selectionRoutes = require("./routes/selectionRoutes");
const reportRoutes = require("./routes/reportRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const coordinatorRoutes = require("./routes/coordinatorRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded resumes
app.use("/uploads", express.static("uploads"));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/selections", selectionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/coordinator", coordinatorRoutes);

// System-wide data clear endpoint for testing
const handleClearAllSystemData = async (req, res) => {
    try {
        const mongoose = require("mongoose");
        if (mongoose.connection.readyState === 1) {
            const db = mongoose.connection.db;
            const collections = await db.collections();
            for (let col of collections) {
                const name = col.collectionName;
                if (name !== "users" && !name.startsWith("system.")) {
                    await col.deleteMany({});
                }
            }
        }
        return res.status(200).json({ success: true, message: "All system placement data, drives, applications, profiles, and logs cleared successfully!" });
    } catch (err) {
        console.error("Clear All Data Error:", err);
        return res.status(500).json({ success: false, message: "Failed to clear system data", error: err.message });
    }
};

app.post("/api/system/clear-all-data", handleClearAllSystemData);
app.get("/api/system/clear-all-data", handleClearAllSystemData);
app.delete("/api/system/clear-all-data", handleClearAllSystemData);

// Root API
app.get("/", (req, res) => {
    res.json({
        message: "College Placement Management System API is running",
    });
});

// Server initialization after DB connection
const PORT = process.env.PORT || 5001;

const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
};

startServer();