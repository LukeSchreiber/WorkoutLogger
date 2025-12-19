import { Router, Request, Response } from "express";
import { db } from "../lib/db";

const router = Router();

// GET / - List all lifts for user
router.get("/", async (req: Request, res: Response) => {
    try {
        // Assume auth middleware populates user
        const userId = (req as any).user?.userId;
        if (!userId) return res.status(401).json({ detail: "Unauthorized" });

        const lifts = await db.lift.findMany({
            where: { userId },
            orderBy: [
                { usageCount: "desc" },
                { lastUsedAt: "desc" },
                { name: "asc" }
            ]
        });

        res.json({ lifts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: "Internal server error" });
    }
});

// POST / - Create a new lift (optional, but good to have)
router.post("/", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { name } = req.body;

        if (!name) return res.status(400).json({ detail: "Name required" });

        const lift = await db.lift.create({
            data: {
                name,
                userId
            }
        });
        res.json(lift);
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: "Internal server error" });
    }
});

export default router;
