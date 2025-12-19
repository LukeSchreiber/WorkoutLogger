import { Lift, Exposure, LiftStats, Insight } from "@/types";

// Epley Formula: Weight * (1 + Reps/30)
export function calculateEstimated1RM(weight: number, reps: number): number {
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
}

// Basic stress per session exposure
export function calculateStressScore(exposure: Exposure): number {
    let score = Math.max(0, exposure.topSet.rpe - 6) * exposure.topSet.reps;
    exposure.backoffSets.forEach(set => {
        const rpe = set.rpe ?? (exposure.topSet.rpe - 1);
        score += Math.max(0, rpe - 6) * set.reps;
    });
    return Math.round(score);
}

// New Deload Logic
export function calculateDeloadScore(exposures: Exposure[]): number {
    // Look at last 14 days
    const recent = exposures.filter(e =>
        (Date.now() - new Date(e.date).getTime()) < (1000 * 60 * 60 * 24 * 14)
    );

    let score = 0;

    // 1. High RPE Frequency (Working Sets >= 7.5)
    const hardSets = recent.filter(e => e.topSet.rpe >= 7.5 || e.backoffSets.some(b => (b.rpe ?? 0) >= 7.5)).length;
    score += (hardSets * 10);

    // 2. Training Density (Sessions in last 7 days)
    const lastWeekSessions = recent.filter(e =>
        (Date.now() - new Date(e.date).getTime()) < (1000 * 60 * 60 * 24 * 7)
    ).length;
    if (lastWeekSessions > 4) score += (lastWeekSessions * 5);

    // Cap at 100
    return Math.min(100, score);
}

export function calculateLiftStats(lift: Lift, exposures: Exposure[]): LiftStats {
    const history = exposures
        .filter(e => e.liftId === lift.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const lastExposure = history[0];
    const prevExposure = history[1];

    if (!lastExposure) {
        return {
            liftId: lift.id, liftName: lift.name, estimated1RM: 0, delta: 0, daysSinceLast: -1, status: "holding"
        };
    }

    const current1RM = calculateEstimated1RM(lastExposure.topSet.weight, lastExposure.topSet.reps);
    let delta = 0;

    if (prevExposure) {
        const prev1RM = calculateEstimated1RM(prevExposure.topSet.weight, prevExposure.topSet.reps);
        if (prev1RM > 0) delta = ((current1RM - prev1RM) / prev1RM) * 100;
    }

    const daysSinceLast = Math.floor((Date.now() - new Date(lastExposure.date).getTime()) / (1000 * 60 * 60 * 24));

    let status: "progressing" | "holding" | "regressing" = "holding";
    if (delta >= 0.5) status = "progressing";
    if (delta <= -0.5) status = "regressing";

    return {
        liftId: lift.id, liftName: lift.name, estimated1RM: current1RM, delta, daysSinceLast, status, lastExposure
    };
}

export function generateInsights(liftStats: LiftStats[]): Insight[] {
    const insights: Insight[] = [];

    // Rule 1: Regressing High RPE
    const strugglingLifts = liftStats.filter(s => s.status === "regressing" && (s.lastExposure?.topSet.rpe ?? 0) >= 8.5);
    if (strugglingLifts.length > 0) {
        insights.push({
            id: "ins-perf-1",
            type: "performance",
            message: `${strugglingLifts[0].liftName} is regressing despite high effort. Reduce load 5% next session.`,
            severity: "warning"
        });
    }

    // Rule 2: Re-acclimation
    const focusLift = liftStats.sort((a, b) => b.daysSinceLast - a.daysSinceLast)[0];
    if (focusLift && focusLift.daysSinceLast > 10) {
        insights.push({
            id: "ins-rec-1", type: "focus",
            message: `It's been ${focusLift.daysSinceLast} days since you trained ${focusLift.liftName}. Treat next session as re-acclimation (RPE 7 cap).`,
            severity: "info"
        });
    }

    // Rule 3: Progressing
    const progressing = liftStats.filter(s => s.status === "progressing" && (s.lastExposure?.topSet.rpe ?? 10) <= 8);
    if (progressing.length > 0) {
        insights.push({
            id: "ins-prog-1", type: "focus",
            message: `${progressing[0].liftName} is moving well. Add 2.5-5lbs or 1 rep next time.`,
            severity: "info"
        });
    }

    return insights.slice(0, 3);
}

// --- Session View Model ---
export type SessionSummary = {
    id: string; // composite date key
    date: string; // YYYY-MM-DD
    displayDate: string; // "Today", "Yesterday", etc.
    title: string; // e.g. "Upper Body"
    liftNames: string[]; // ["Squat", "Bench"]
    topSetDescriptions: string[]; // ["315x5 @8", "225x5 @9"]
    workingSetsCount: number; // Sets @ RPE >= 7.5
    rawDate: Date;
};

export function getRecentSessions(exposures: Exposure[], lifts: Lift[]): SessionSummary[] {
    const sessions: Record<string, SessionSummary> = {};

    exposures.forEach(exp => {
        const dateObj = new Date(exp.date);
        const dateKey = dateObj.toISOString().split('T')[0];

        if (!sessions[dateKey]) {
            sessions[dateKey] = {
                id: `session-${dateKey}`,
                date: dateKey,
                displayDate: dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
                title: "Workout",
                liftNames: [],
                topSetDescriptions: [],
                workingSetsCount: 0,
                rawDate: dateObj
            };
        }

        const session = sessions[dateKey];
        const liftName = lifts.find(l => l.id === exp.liftId)?.name || "Unknown Lift";

        session.liftNames.push(liftName);
        session.topSetDescriptions.push(`${liftName} ${exp.topSet.weight}x${exp.topSet.reps} @${exp.topSet.rpe}`);

        // Working sets (RPE >= 7.5)
        if (exp.topSet.rpe >= 7.5) session.workingSetsCount++;
        exp.backoffSets.forEach(b => {
            if ((b.rpe ?? 0) >= 7.5) session.workingSetsCount++;
        });
    });

    return Object.values(sessions).map(s => {
        const isLower = s.liftNames.some(l => l.includes("Squat") || l.includes("Deadlift"));
        const isUpper = s.liftNames.some(l => l.includes("Bench") || l.includes("Press"));

        if (isLower && isUpper) s.title = "Full Body";
        else if (isLower) s.title = "Lower Body";
        else if (isUpper) s.title = "Upper Body";

        return s;
    }).sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
}
