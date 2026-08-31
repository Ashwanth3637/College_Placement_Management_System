const jwt = require("jsonwebtoken");

const protectCoordinator = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            // Fallback for public / offline mode
            return next();
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "jwt_secret_key_123");

        const role = (decoded.role || "").toLowerCase();
        if (role !== "coordinator" && role !== "admin" && role !== "officer") {
            return res.status(403).json({
                success: false,
                message: "Access forbidden. Only authenticated Coordinators can access this route."
            });
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired authorization token."
        });
    }
};

module.exports = { protectCoordinator };
