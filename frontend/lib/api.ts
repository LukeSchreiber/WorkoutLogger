import { getToken, logout } from "./auth";
import * as DataType from "@/types";


const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

type FetchOptions = RequestInit & {
    headers?: Record<string, string>;
};

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const token = getToken();

    const headers = new Headers(options.headers);

    if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        logout(); // Clear tokens and redirect
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
        throw new Error("Unauthorized");
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "API request failed");
    }

    return response.json();
}

// Endpoints
export const api = {
    auth: {
        register: (data: { username: string; password: string }) =>
            apiFetch<{ user: any; accessToken: string }>("/auth/register", {
                method: "POST",
                body: JSON.stringify(data),
            }),
        login: (data: { username: string; password: string }) =>
            apiFetch<{ user: any; accessToken: string }>("/auth/login", {
                method: "POST",
                body: JSON.stringify(data),
            }),
        me: () => apiFetch<{ user: any }>("/auth/me"),
    },
    workouts: {
        list: () => apiFetch<{ workouts: DataType.Workout[] }>("/workouts"),
        create: (data: DataType.CreateWorkoutInput) =>
            apiFetch<any>("/workouts", {
                method: "POST",
                body: JSON.stringify(data),
            }),
        getLast: () => apiFetch<DataType.Workout>("/workouts/last"),
        parse: (rawText: string) =>
            apiFetch<{ sets: DataType.WorkoutSet[] }>("/workouts/parse", {
                method: "POST",
                body: JSON.stringify({ rawText }),
            }),
        get: (id: string) => apiFetch<any>(`/workouts/${id}`),
        delete: (id: string) =>
            apiFetch<{ ok: true }>(`/workouts/${id}`, {
                method: "DELETE",
            }),
    },
    insights: {
        get: () => apiFetch<{ insights: DataType.Insight[] }>("/insights"),
    },
    lifts: {
        list: () => apiFetch<{ lifts: DataType.Lift[] }>("/lifts"),
        create: (name: string) =>
            apiFetch<DataType.Lift>("/lifts", {
                method: "POST",
                body: JSON.stringify({ name })
            }),
    },
};
