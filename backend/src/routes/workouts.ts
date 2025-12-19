import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "../lib/db";
import { Prisma } from "@prisma/client";

const router = Router();

// Middleware to mock auth for now (or get from header)
// TODO: Proper auth middleware verifying JWT
const getUserId = (req: Request) => {
    // For development/testing without full auth client integration yet
    // return "user-test"; 
    // In real implementation, this comes from req.user set by auth middleware
    // We'll trust the caller sends a header or just use a placeholder if not found for now
    // But since we implemented auth, we should verify token.
    // For this step, I'll extract it assuming a middleware placed it there.
    return (req as any).user?.userId;
};

// Validation
const setSchema = z.object({
    weight: z.number(),
    reps: z.number(),
    rpe: z.number().optional(),
    isTopSet: z.boolean().default(false),
});

const createWorkoutSchema = z.object({
    liftId: z.string(),
    date: z.string().datetime(),
    notes: z.string().optional(),
    focus: z.string().optional(),
    backoffNotes: z.string().optional(),
    sets: z.array(setSchema),
});

// GET / - List workouts
router.get("/", async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        // if (!userId) return res.status(401).json({ detail: "Unauthorized" });

        const workouts = await db.exposure.findMany({
            where: { userId },
            include: {
                lift: true,
                sets: true,
            },
            orderBy: { date: "desc" },
        });
        res.json({ workouts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: "Internal server error" });
    }
});

// POST / - Create workout
router.post("/", async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        // if (!userId) return res.status(401).json({ detail: "Unauthorized" });

        const body = createWorkoutSchema.parse(req.body);

        const workout = await db.exposure.create({
            data: {
                userId: userId!, // Force for now implies middleware exists
                liftId: body.liftId,
                date: body.date,
                focus: body.focus,
                notes: body.notes,
                backoffNotes: body.backoffNotes,
                sets: {
                    create: body.sets,
                },
            },
        });

        // Update Lift Usage Stats
        await db.lift.update({
            where: { id: body.liftId },
            data: {
                usageCount: { increment: 1 },
                lastUsedAt: new Date(),
            }
        });

        res.json(workout);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ detail: (error as any).errors });
        }
        console.error(error);
        res.status(500).json({ detail: "Internal server error" });
    }
});

// GET /:id - Get workout
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const workout = await db.exposure.findUnique({
            where: { id },
            include: { lift: true, sets: true },
        });

        if (!workout) return res.status(404).json({ detail: "Workout not found" });

        res.json(workout);
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: "Internal server error" });
    }
});

// DELETE /:id - Delete workout
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db.exposure.delete({ where: { id } });
        res.json({ ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: "Internal server error" });
    }
});

export default router;
