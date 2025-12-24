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
    tags?: string[];
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

// --- WORKOUT ENGINE TYPES ---
export type WorkoutSet = {
    id?: string;
    position: number;
    weight: number;
    reps: number;
    rpe?: number;
    type: "warmup" | "work" | "top" | "backoff";
};

export type WorkoutExercise = {
    id?: string;
    liftId: string;
    liftName?: string; // Hydrated
    position: number;
    notes?: string;
    sets: WorkoutSet[];
};

export type Workout = {
    id: string;
    date: string;
    focus?: string;
    notes?: string;
    exercises: WorkoutExercise[];
};

export type CreateWorkoutInput = {
    date: string;
    focus?: string;
    notes?: string;
    exercises: {
        liftId: string;
        position: number;
        notes?: string;
        sets: {
            position: number;
            weight: number;
            reps: number;
            rpe?: number;
            type: string;
        }[];
    }[];
};
