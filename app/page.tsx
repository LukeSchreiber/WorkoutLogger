import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8">
            <div className="space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                    Workout Logger
                </h1>
                <p className="text-xl text-muted-foreground max-w-[600px]">
                    Log workouts like Notes, but synced + intelligent.
                    Stop tracking in spreadsheets, start logging naturally.
                </p>
            </div>

            <div className="flex gap-4">
                <Link href="/login">
                    <Button size="lg">Login</Button>
                </Link>
                <Link href="/register">
                    <Button variant="outline" size="lg">
                        Register
                    </Button>
                </Link>
            </div>
        </div>
    );
}
