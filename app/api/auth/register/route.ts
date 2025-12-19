import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const body = await request.json();
    const { username, password } = body;

    // Simulate success
    const user = {
        id: "user-" + Math.random().toString(36).substring(7),
        username,
        createdAt: new Date().toISOString(),
    };

    const accessToken = "mock-jwt-token-" + Math.random().toString(36).substring(7);

    return NextResponse.json({ user, accessToken });
}
