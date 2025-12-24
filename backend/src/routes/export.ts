
import express from "express";
import { db } from "../lib/db";
import { z } from "zod";

const router = express.Router();

// Helper to get user ID safely
const getUserId = (req: express.Request): string | null => {
    return (req as any).user?.userId || null;
};

router.get("/training-log", async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({ detail: "Unauthorized" });
            return
        }

        // 1. Fetch User Data (for metadata)
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true }
        });

        if (!user) {
            res.status(404).json({ detail: "User not found" });
            return
        }

        // 2. Fetch All Workouts with nested data
        const workouts = await db.workout.findMany({
            where: { userId },
            orderBy: { date: 'asc' },
            include: {
                exercises: {
                    include: {
                        lift: true,
                        sets: {
                            orderBy: { position: 'asc' }
                        }
                    },
                    orderBy: { position: 'asc' }
                }
            }
        });

        // 3. Transform to required JSON structure
        const exportData = {
            app: "WorkoutLogger",
            version: 1,
            exportedAt: new Date().toISOString(),
            user: {
                id: user.id,
                name: user.username
            },
            sessions: workouts.map(w => ({
                id: w.id,
                date: w.date.toISOString().split('T')[0], // YYYY-MM-DD
                title: w.focus || "Workout", // Fallback if no specific title field, 'focus' is closest
                tag: w.focus,
                notes: w.notes,
                exercises: w.exercises.map(ex => ({
                    name: ex.lift.name,
                    sets: ex.sets.map(s => ({
                        reps: s.reps,
                        weight: s.weight,
                        rpe: s.rpe,
                        notes: null // Sets don't have notes in current schema, matching requirement as null
                    }))
                }))
            }))
        };

        // 4. Send as Download
        const filename = `training-log-${new Date().toISOString().split('T')[0]}.json`;

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pretty print JSON for readability
        res.send(JSON.stringify(exportData, null, 2));

    } catch (e) {
        console.error("Export failed", e);
        res.status(500).json({ detail: "Export failed" });
    }
});

export default router;
