"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Settings, Dumbbell } from "lucide-react";

// ...

export function TopNav() {
    const { user } = useAuth();

    return (
        <nav className="border-b bg-background">

            <div className="container flex h-14 items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
                        <div className="bg-primary text-primary-foreground p-1 rounded-md">
                            <Dumbbell className="h-4 w-4" />
                        </div>
                        WorkoutLogger
                    </Link>
                    {user && (
                        <div className="flex gap-4 text-sm font-medium">
                            <Link href="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">Dashboard</Link>

                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <ModeToggle />
                    {user && (
                        <Link href="/settings">
                            <Button variant="ghost" size="icon">
                                <Settings className="h-5 w-5" />
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}

