import { Router, Request, Response } from "express";
import { db } from "../lib/db";

const router = Router();

// GET /api/health
router.get("/", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// GET /api/health/db
// Performs a real database query to verify connectivity
router.get("/db", async (req: Request, res: Response) => {
    try {
        // Run a simple raw query
        // The result of SELECT 1 is typically [ { '?column?': 1 } ]
        await db.$queryRaw`SELECT 1`;

        res.json({
            status: "connected",
            database: "postgres",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Health Check DB Failed:", error);
        res.status(503).json({
            status: "error",
            detail: "Database unreachable",
            timestamp: new Date().toISOString()
        });
    }
});

export default router;
