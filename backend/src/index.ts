import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

import authRoutes from "./routes/auth";

import workoutRoutes from "./routes/workouts";

// Auth Middleware (Placeholder)
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
            (req as any).user = decoded;
        } catch (e) {
            // console.error("Invalid token");
        }
    }
    next();
};

app.use(cors());
app.use(express.json());
app.use(authenticate);

import liftRoutes from "./routes/lifts";

app.use("/auth", authRoutes);
app.use("/workouts", workoutRoutes);
app.use("/lifts", liftRoutes);

import { db } from "./lib/db";

// Global Error Handler
const errorHandler: express.ErrorRequestHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const userId = (req as any).user?.userId;

    // 1. Console Log (for Render/Dev)
    console.error(`[ERROR] ${req.method} ${req.path} (${userId || "anon"})`, err);

    // 2. Database Log (Persistent)
    db.errorLog.create({
        data: {
            userId,
            path: req.path,
            method: req.method,
            statusCode,
            message,
            stack: err.stack
        }
    }).catch(e => console.error("Failed to write error log to DB", e));

    // 3. Response
    res.status(statusCode).json({
        detail: message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
};

app.use(("/" as any), (req: any, res: any, next: any) => {
    // 404 handler for unknown routes
    res.status(404).json({ detail: "Not Found" });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
