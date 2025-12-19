import { z } from "zod";

export const loginSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(1, "Password is required"), // weak requirement for test user ease
});

export const registerSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export const workoutSchema = z.object({
    title: z.string().optional(),
    performedAt: z.string(), // datetime-local string
    rawText: z.string().min(1, "Workout log cannot be empty"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type WorkoutInput = z.infer<typeof workoutSchema>;
