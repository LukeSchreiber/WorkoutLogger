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
    displayDate: string; // "Today", "Oct 12", etc.
    focus?: string;
    liftNames: string[]; // ["Squat", "Bench"]
    topSetDescriptions: string[]; // ["Squat: 315x5 @8"]
    workingSetsCount: number; // Sets @ RPE >= 7.5
    rawDate: Date;
    backoffNotes?: string;
    notes?: string;
    tags?: string[];
};

export function getRecentSessions(exposures: Exposure[], lifts: Lift[]): SessionSummary[] {
    // In the new flow, 1 Exposure = 1 Session essentially (unless user logs multiple times a day perfectly sync'd)
    // We will still group by date just in case, but usually it's 1:1

    return exposures.map(exp => {
        const dateObj = new Date(exp.date);
        const liftName = lifts.find(l => l.id === exp.liftId)?.name || "Unknown";

        let desc = `${liftName}: ${exp.topSet.weight}x${exp.topSet.reps}`;
        if (exp.topSet.rpe) desc += ` @${exp.topSet.rpe}`;

        return {
            id: exp.id,
            date: exp.date,
            displayDate: dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
            focus: exp.focus || undefined,
            liftNames: [liftName],
            topSetDescriptions: [desc],
            workingSetsCount: 0, // Deprecated in UI but keep for type
            rawDate: dateObj,
            backoffNotes: exp.backoffNotes,
            notes: exp.notes,
            tags: exp.tags
        };
    }).sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
}
