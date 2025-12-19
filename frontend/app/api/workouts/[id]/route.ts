import { NextResponse } from "next/server";
import { mockExposures, mockLifts } from "@/lib/mock-db";
import { WorkoutSet } from "@/types";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const id = params.id; // Expected: "session-YYYY-MM-DD"

    if (!id.startsWith("session-")) {
        return new NextResponse("Invalid ID format", { status: 400 });
    }

    const targetDateStr = id.replace("session-", "");

    // Filter exposures that occur on this date (ignoring time)
    const sessionExposures = mockExposures.filter(e => {
        const exposureDate = new Date(e.date).toISOString().split('T')[0];
        return exposureDate === targetDateStr;
    });

    if (sessionExposures.length === 0) {
        return new NextResponse("Workout Not Found", { status: 404 });
    }

    // Construct the legacy "Workout" object wrapper
    const workout = {
        id: id,
        performedAt: sessionExposures[0].date, // Use the first exposure's time
        title: `Session on ${targetDateStr}`,
        rawText: "Generated from structured logging data.",
    };

    // Flatten exposures into a list of Sets for the UI table
    const sets: WorkoutSet[] = [];

    sessionExposures.forEach(exp => {
        const lift = mockLifts.find(l => l.id === exp.liftId);
        const baseName = lift ? lift.name : "Unknown Lift";

        // 1. Top Set
        sets.push({
            id: `${exp.id}-top`,
            exerciseName: baseName, // Main line item
            weight: exp.topSet.weight,
            reps: exp.topSet.reps,
            rpe: exp.topSet.rpe,
            notes: "Top Set"
        });

        // 2. Backoff Sets
        exp.backoffSets.forEach((bs, idx) => {
            sets.push({
                id: `${exp.id}-back-${idx}`,
                exerciseName: `${baseName} (Backoff)`, // Indicated as backoff
                weight: bs.weight || 0,
                reps: bs.reps,
                rpe: bs.rpe,
                notes: "Backoff Set"
            });
        });
    });

    return NextResponse.json({
        workout,
        sets,
        feedback: null // No AI feedback for these constructed sessions yet
    });
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    // For now, this is a mock no-op since deep-deleting from the mock DB 
    // based on a session ID is complex and resets on reload anyway.
    return NextResponse.json({ ok: true });
}
