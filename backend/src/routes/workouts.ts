import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "../lib/db";
import { Prisma } from "@prisma/client";

const router = Router();

// Helper: Get user (mock or real)
const getUserId = (req: Request) => {
    return (req as any).user?.userId;
};

// Validation Schemas
const setSchema = z.object({
    position: z.number().default(0),
    weight: z.number(),
    reps: z.number(),
    rpe: z.number().optional(),
    type: z.string().default("work"),
});

const exerciseSchema = z.object({
    liftId: z.string(),
    position: z.number().default(0),
    notes: z.string().optional(),
    sets: z.array(setSchema),
});

const createWorkoutSchema = z.object({
    date: z.string().datetime(),
    focus: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
    exercises: z.array(exerciseSchema),
});

// ... (GET /range omitted, assuming it's before or after this block, kept intact by focusing replacement on correct range)

// POST / - Create Full Workout
// Transactional for robustness
router.post("/", async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ detail: "Unauthorized" });
        const body = createWorkoutSchema.parse(req.body);

        // Transactional Create: "All or Nothing"
        const workout = await db.$transaction(async (tx) => {
            // 1. Create Workout & Nested Data
            const newWorkout = await tx.workout.create({
                data: {
                    userId: userId!,
                    date: body.date,
                    focus: body.focus,
                    notes: body.notes,
                    tags: body.tags || [],
                    exercises: {
                        create: body.exercises.map(ex => ({
                            liftId: ex.liftId,
                            position: ex.position,
                            notes: ex.notes,
                            sets: {
                                create: ex.sets.map(s => ({
                                    position: s.position,
                                    weight: s.weight,
                                    reps: s.reps,
                                    rpe: s.rpe,
                                    type: s.type
                                }))
                            }
                        }))
                    }
                },
                include: {
                    exercises: {
                        include: { sets: true }
                    }
                }
            });

            // 2. Update stats for used lifts (Atomically)
            // Using Promise.all within the transaction context guarantees these run as part of the same connection/logic
            // Ideally stats updates would be a separate aggregation, but incrementing count here is efficiently done.
            await Promise.all(body.exercises.map(ex =>
                tx.lift.update({
                    where: { id: ex.liftId },
                    data: { usageCount: { increment: 1 }, lastUsedAt: new Date() }
                })
            ));

            return newWorkout;
        });

        res.json(workout);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ detail: (error as any).errors });
        }
        console.error("Create Workout Failed:", error);
        res.status(500).json({ detail: "Internal server error" });
    }
});

// GET /last - Get User's Latest Workout (for Copy Feature)
router.get("/last", async (req: Request, res: Response) => {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ detail: "Unauthorized" });
        const workout = await db.workout.findFirst({
            where: { userId },
            orderBy: { date: "desc" },
            include: {
                exercises: {
                    include: {
                        lift: true,
                        // Include sets to pre-fill?
                        // User asked to prefill OR leave blank. 
                        // Let's include sets so frontend can decide (e.g. use reps, clear weight).
                        sets: { orderBy: { position: "asc" } }
                    },
                    orderBy: { position: "asc" }
                }
            }
        });

        if (!workout) return res.status(404).json({ detail: "No previous workout found" });
        res.json(workout);
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: "Internal server error" });
    }
});

// GET /:id - Get workout detail
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ detail: "Unauthorized" });

        const workout = await db.workout.findUnique({
            where: { id },
            include: {
                exercises: {
                    include: { lift: true, sets: { orderBy: { position: "asc" } } },
                    orderBy: { position: "asc" }
                }
            },
        });

        if (!workout) return res.status(404).json({ detail: "Workout not found" });
        if (workout.userId !== userId) return res.status(403).json({ detail: "Forbidden" });
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
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ detail: "Unauthorized" });

        // Verify ownership before delete
        const workout = await db.workout.findUnique({ where: { id } });
        if (!workout) return res.status(404).json({ detail: "Workout not found" });
        if (workout.userId !== userId) return res.status(403).json({ detail: "Forbidden" });

        await db.workout.delete({ where: { id } });
        res.json({ ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ detail: "Internal server error" });
    }
});

export default router;
