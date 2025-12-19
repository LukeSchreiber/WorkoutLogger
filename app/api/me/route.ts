import { NextResponse } from "next/server";

export async function GET(request: Request) {
    // Always return the mock user
    return NextResponse.json({
        user: {
            id: "user-123",
            email: "mock@example.com",
            createdAt: new Date().toISOString(),
        },
    });
}
