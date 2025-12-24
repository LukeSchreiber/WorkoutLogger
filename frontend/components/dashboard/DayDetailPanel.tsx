"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Dumbbell, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";

interface DayDetailPanelProps {
    date: string | null;
    workouts: any[];
    isOpen: boolean;
    onClose: () => void;
}

export function DayDetailPanel({ date, workouts, isOpen, onClose }: DayDetailPanelProps) {
    if (!date) return null;

    const displayDate = new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent>
                <SheetHeader className="mb-6">
                    <SheetTitle>{displayDate}</SheetTitle>
                    <SheetDescription>
                        {workouts.length} session{workouts.length !== 1 ? 's' : ''} logged
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                    {workouts.length === 0 ? (
                        <div className="text-center py-8 flex flex-col items-center gap-4">
                            <div className="text-muted-foreground">No workouts logged on this day.</div>
                            <Link href={`/log?date=${date}`}>
                                <Button>
                                    <Dumbbell className="w-4 h-4 mr-2" /> Log Session
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            {workouts.map((w: any) => (
                                <div key={w.id} className="border border-border/50 rounded-lg p-4 space-y-3 bg-muted/10">
                                    <div className="flex items-center justify-between">
                                        <div className="font-semibold text-base">{w.focus || "Workout"}</div>
                                        <div className="text-xs text-muted-foreground bg-background px-2 py-1 rounded border">
                                            {new Date(w.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>

                                    {w.notes && (
                                        <div className="text-sm text-muted-foreground italic">
                                            "{w.notes}"
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        {w.exercises?.map((ex: any) => (
                                            <div key={ex.id} className="text-sm flex items-center gap-2">
                                                <Dumbbell className="w-3 h-3 text-primary/70" />
                                                {ex.lift.name}
                                            </div>
                                        ))}
                                    </div>

                                    <Link href={`/log?copy=${w.id}`} className="block">
                                        <Button variant="outline" size="sm" className="w-full mt-2">
                                            View Details <ArrowRight className="w-3 h-3 ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                            <div className="pt-4 border-t border-border/50">
                                <Link href={`/log?date=${date}`}>
                                    <Button variant="secondary" className="w-full">
                                        <Plus className="w-4 h-4 mr-2" /> Log Another Session
                                    </Button>
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
