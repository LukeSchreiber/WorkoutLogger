import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const body = await request.json();
    const { username, password } = body;

    // Hardcoded Test User Check
    if (username === "test" && password === "test123") {
        const user = {
            id: "user-test",
            username: "test",
            createdAt: new Date().toISOString(),
        };
        const accessToken = "mock-jwt-token-test-user";
        return NextResponse.json({ user, accessToken });
    }

    // Allow any other user for now (legacy behavior) but using username
    // Or strictly enforce test user? User asked to "add a test user", implying others might exist or it's a dev mode.
    // Let's mimic the old behavior but with username for non-test users to avoid breaking others if they existed (though likely mock).

    // Better: Fail if not test user for now to be explicit? 
    // The prompt said: "add a test user... use username and password".
    // I'll stick to a mock success for any other username to keep it easy to use, mirroring previous "Mock login success for any credentials" behavior.

    const user = {
        id: "user-" + Math.random().toString(36).substring(7),
        username,
        createdAt: new Date().toISOString(),
    };

    const accessToken = "mock-jwt-token-" + Math.random().toString(36).substring(7);

    return NextResponse.json({ user, accessToken });
}
