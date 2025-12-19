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
import { Workout, WorkoutSet, WorkoutFeedback } from "@/types";

export default function WorkoutDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [sets, setSets] = useState<WorkoutSet[]>([]);
    const [feedback, setFeedback] = useState<WorkoutFeedback | null>(null);

    useEffect(() => {
        const fetchWorkout = async () => {
            try {
                const res = await api.workouts.get(id);
                // Expecting { workout, sets?, feedback? }
                setWorkout(res.workout);
                if (res.sets) setSets(res.sets);
                if (res.feedback) setFeedback(res.feedback);
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
            toast({ title: "Workout deleted" });
            router.push("/dashboard");
        } catch (err) {
            toast({ title: "Delete failed", variant: "destructive" });
        }
    };

    if (loading) return <div className="py-12 text-center">Loading...</div>;
    if (!workout) return null;

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
                <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="pl-0">
                        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Button>
                </Link>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Are you sure?</DialogTitle>
                            <DialogDescription>
                                This action cannot be undone. This will permanently delete this workout log.
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

            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">{workout.title || "Untitled Workout"}</h1>
                <p className="text-muted-foreground">
                    {new Date(workout.performedAt).toLocaleString(undefined, {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'
                    })}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="whitespace-pre-wrap font-mono text-sm bg-muted/30 p-4 rounded-md">
                        {workout.rawText}
                    </div>
                </CardContent>
            </Card>

            {feedback && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="text-primary">AI Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-line">{feedback.summary}</p>
                    </CardContent>
                </Card>
            )}

            {sets.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Structured Sets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="border-b">
                                    <tr>
                                        <th className="py-2 px-1">Exercise</th>
                                        <th className="py-2 px-1">Kg/Lbs</th>
                                        <th className="py-2 px-1">Reps</th>
                                        <th className="py-2 px-1">RPE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sets.map((set) => (
                                        <tr key={set.id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="py-2 px-1 font-medium">{set.exerciseName}</td>
                                            <td className="py-2 px-1 text-muted-foreground">{set.weight}</td>
                                            <td className="py-2 px-1 text-muted-foreground">{set.reps}</td>
                                            <td className="py-2 px-1 text-muted-foreground">{set.rpe}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
