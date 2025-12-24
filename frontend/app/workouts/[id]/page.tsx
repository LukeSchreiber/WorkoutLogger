"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Workout, WorkoutSet } from "@/types";

export default function WorkoutDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [workout, setWorkout] = useState<Workout | null>(null);

    useEffect(() => {
        const fetchWorkout = async () => {
            try {
                const res = await api.workouts.get(id);
                setWorkout(res);
            } catch (err) {
                toast({ title: "Failed to load workout", variant: "destructive" });
                router.push("/dashboard");
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchWorkout();
    }, [id, router, toast]);

    const handleDelete = async () => {
        try {
            await api.workouts.delete(id);
            toast({ title: "Session Deleted" });
            router.push("/dashboard");
        } catch (err) {
            toast({ title: "Delete failed", variant: "destructive" });
        }
    };

    if (loading) return <div className="py-12 text-center text-muted-foreground">Loading session...</div>;
    if (!workout) return null;

    const dateStr = new Date(workout.date).toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <div className="space-y-6 max-w-2xl mx-auto p-4 md:p-0">
            {/* Header / Nav */}
            <div className="flex items-center justify-between">
                <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground">
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                </Link>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/80 hover:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete this session?</DialogTitle>
                            <DialogDescription>
                                This cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button variant="destructive" onClick={handleDelete}>
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Main Content Card */}
            <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <CardTitle className="text-2xl">
                                    {workout.focus || "Workout"}
                                </CardTitle>
                                {workout.tags && workout.tags.map(tag => (
                                    <span key={tag} className="text-[10px] font-bold uppercase tracking-wider bg-secondary px-2 py-0.5 rounded text-secondary-foreground">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <p className="text-muted-foreground font-mono text-sm">{dateStr}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    {/* Exercises List */}
                    {workout.exercises.map((exercise, idx) => {
                        const topSet = exercise.sets.find(s => s.type === 'top') || exercise.sets[0];
                        return (
                            <div key={exercise.id} className={idx !== 0 ? "pt-6 border-t border-border/40" : ""}>
                                <h3 className="text-lg font-semibold mb-3">{exercise.lift.name}</h3>

                                {/* Top Set Display */}
                                {topSet && (
                                    <div className="p-4 bg-muted/20 rounded-lg border border-border/50 mb-3">
                                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Top Set</div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-4xl font-bold tabular-nums tracking-tighter">{topSet.weight}</span>
                                            <span className="text-lg text-muted-foreground font-medium">lbs</span>
                                            <span className="mx-3 text-2xl text-muted-foreground/30">×</span>
                                            <span className="text-4xl font-bold tabular-nums tracking-tighter">{topSet.reps}</span>
                                            <span className="text-lg text-muted-foreground font-medium">reps</span>
                                        </div>
                                        {topSet.rpe && (
                                            <div className="mt-2 text-sm font-mono text-blue-400">@ RPE {topSet.rpe}</div>
                                        )}
                                    </div>
                                )}

                                {/* Other Sets / Volume */}
                                <div className="text-sm text-muted-foreground">
                                    {exercise.sets.length > 1 ? (
                                        <p>Total Sets: {exercise.sets.length}</p>
                                    ) : null}
                                </div>

                                {exercise.notes && (
                                    <div className="mt-2 text-sm italic text-muted-foreground">
                                        "{exercise.notes}"
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Workout Notes */}
                    {workout.notes && (
                        <div className="pt-6 border-t border-border/40">
                            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Session Notes</div>
                            <div className="text-sm italic text-muted-foreground break-words">"{workout.notes}"</div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
