import { Lift, Exposure, LiftStats, Insight } from "@/types";
import { calculateLiftStats, generateInsights } from "@/lib/training-logic";

export const mockLifts: Lift[] = [
    { id: "lift-squat", name: "Squat" },
    { id: "lift-bench", name: "Bench Press" },
    { id: "lift-dl", name: "Deadlift" },
    { id: "lift-ohp", name: "Overhead Press" }
];

export const mockExposures: Exposure[] = [
    // Squat History
    {
        id: "exp-sq-1",
        liftId: "lift-squat",
        date: new Date(Date.now() - 86400000 * 4).toISOString(), // 4 days ago
        topSet: { weight: 315, reps: 5, rpe: 8 },
        backoffSets: [{ reps: 8, weight: 275, rpe: 7 }]
    },
    {
        id: "exp-sq-2",
        liftId: "lift-squat",
        date: new Date(Date.now() - 86400000 * 8).toISOString(), // 8 days ago
        topSet: { weight: 310, reps: 5, rpe: 8.5 },
        backoffSets: []
    },
    // Bench History
    {
        id: "exp-bp-1",
        liftId: "lift-bench",
        date: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
        topSet: { weight: 225, reps: 5, rpe: 9 }, // Stout effort
        backoffSets: [{ reps: 5, weight: 205, rpe: 8 }]
    },
    {
        id: "exp-bp-2",
        liftId: "lift-bench",
        date: new Date(Date.now() - 86400000 * 6).toISOString(),
        topSet: { weight: 225, reps: 4, rpe: 9.5 }, // Struggle last time
        backoffSets: []
    }
];

// Helper to hydrate the dashboard from these raw mocks
export function getDashboardData() {
    // Calculate stats on the fly
    const stats = mockLifts.map(lift => calculateLiftStats(lift, mockExposures));
    const insights = generateInsights(stats);
    return { stats, insights };
}

// End of V4 Data
