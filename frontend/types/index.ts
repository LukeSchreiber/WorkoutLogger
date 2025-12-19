export type User = {
    id: string;
    username: string;
    name?: string;
};

// --- V4 LIFT & EXPOSURE ENGINE ---

export type Lift = {
    id: string;
    name: string; // "Squat", "Bench", "Deadlift"
};

export type BackoffSet = {
    reps: number;
    weight?: number;
    rpe?: number;
};

export type Exposure = {
    id: string;
    liftId: string;
    date: string; // ISO string
    topSet: {
        weight: number;
        reps: number;
        rpe: number;
    };
    backoffSets: BackoffSet[]; // Keeping for backward compatibility but UI might ignore
    focus?: string;
    backoffNotes?: string;
    notes?: string;
};

// Computed View Models (UI state)
export type LiftStats = {
    liftId: string;
    liftName: string;
    estimated1RM: number;
    delta: number; // Percentage vs last time
    daysSinceLast: number;
    status: "progressing" | "holding" | "regressing";
    lastExposure?: Exposure;
};

export type Insight = {
    id: string;
    type: "focus" | "performance" | "recovery";
    message: string;
    severity: "info" | "warning" | "alert";
};

// --- VIEW MODELS (Used for API responses) ---
export type WorkoutSet = { id?: string; exerciseName: string; weight: number; reps: number; rpe?: number; notes?: string; };

export type WorkoutFeedback = { question: string; answer: string; summary?: string; };

export type Workout = { id: string; userId?: string; performedAt: string; sets?: WorkoutSet[]; tags?: string[]; createdAt?: string; updatedAt?: string; rawText?: string; feedback?: WorkoutFeedback[]; title?: string; };
