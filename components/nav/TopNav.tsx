"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Settings } from "lucide-react";


// I will use a simple layout for now to avoid needing DropdownMenu code which is complex to copy-paste blindly without checking deps.
// Spec says "Show current user email and logout button" in Settings.
// TopNav can just have "Dashboard", "Settings".

export function TopNav() {
    const { user } = useAuth();

    return (
        <nav className="border-b bg-background">

            <div className="container flex h-14 items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/" className="font-bold text-lg">
                        WuL
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

