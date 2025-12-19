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

app.get("/", (req, res) => {
    res.send("WorkoutLogger API is running!");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
