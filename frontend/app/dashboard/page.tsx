"use client";

import { useEffect, useState, useCallback } from "react";
import { Insight, Lift, Exposure } from "@/types";
import { getRecentSessions, SessionSummary } from "@/lib/training-logic";
import { TrainingLogList } from "@/components/dashboard/TrainingLogList";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link"; // Added

export default function Dashboard() {
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);
    // Removed LogModal state
    const [availableLifts, setAvailableLifts] = useState<Lift[]>([]); // Derived from history for now

    // Default to first lift for Quick Log
    const [selectedLiftId, setSelectedLiftId] = useState<string>("");
    const { toast } = useToast();

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const { workouts } = await api.workouts.list();
            const { lifts } = await api.lifts.list(); // Fetch real lifts
            setAvailableLifts(lifts);
            if (lifts.length > 0 && !selectedLiftId) setSelectedLiftId(lifts[0].id);

            // Transform Backend Data (Workout -> Exposure Summary)
            // We'll treat the FIRST exercise as the "Main Lift" for the summary card
            const convertedExposures: Exposure[] = workouts.map((w: any) => {
                const mainExercise = w.exercises[0]; // Primary lift
                const topSet = mainExercise?.sets.filter((s: any) => s.type === 'work' || s.type === 'top')[0] || mainExercise?.sets[0];

                return {
                    id: w.id,
                    liftId: mainExercise?.liftId || "unknown",
                    date: w.date,
                    focus: w.focus,
                    topSet: {
                        weight: topSet?.weight || 0,
                        reps: topSet?.reps || 0,
                        rpe: topSet?.rpe || 0,
                    },
                    backoffSets: [],
                    backoffNotes: w.exercises.length > 1 ? `+ ${w.exercises.length - 1} other exercises` : undefined, // Show count of other lifts
                    notes: w.notes
                };
            });

            // Sets are transformed, now we verify availableLifts is populated from API
            // (already done above)


            const recentSessions = getRecentSessions(convertedExposures, lifts);
            setSessions(recentSessions);

            // Fetch Insights (Placeholder logic for now or real API if implemented)
            // For now, we disable the mock insight fetch to prevent errors until endpoints exist
            setInsights([]);

        } catch (error) {
            console.error("Failed to load dashboard data", error);
            toast({
                variant: "destructive",
                title: "Error loading data",
                description: "Could not fetch your training log."
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleDelete = async (id: string, date: string) => {
        try {
            await api.workouts.delete(id);
            toast({
                title: "Workout Deleted",
                description: `Session from ${date} removed.`
            });
            loadData(); // Refresh list
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Failed to delete",
                description: "Something went wrong."
            });
        }
    };

    if (loading) return <div className="p-8 text-muted-foreground">Loading training log...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-10 gap-8 h-[calc(100vh-100px)] overflow-hidden">
            {/* Left 70%: Training Log List */}
            <div className="md:col-span-7 flex flex-col gap-4 overflow-hidden">
                <div className="flex justify-between items-center px-1">
                    <h1 className="text-3xl font-bold tracking-tight">Training Log</h1>
                    <Link href="/log">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" /> Log Session
                        </Button>
                    </Link>
                </div>

                <div className="overflow-auto flex-1 pb-10">
                    {sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pt-20">
                            <h3 className="text-2xl font-bold tracking-tight">Log your first session</h3>
                            <p className="text-muted-foreground w-[200px]">Start with today’s main lift.</p>
                            <Link href="/log">
                                <Button size="lg" className="mt-4">
                                    Log Today’s Lift
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <TrainingLogList sessions={sessions} onDelete={handleDelete} />
                    )}
                </div>
            </div>

            {/* Right 30%: Insights Panel */}
            <div className="md:col-span-3 flex flex-col gap-4 border-l border-border/50 pl-6 bg-muted/5">
                <h2 className="text-xl font-bold tracking-tight">Coaching Insights</h2>
                <div className="space-y-4 overflow-auto flex-1 pr-2">
                    {insights.map(insight => (
                        <Card key={insight.id} className={`
                            ${insight.severity === 'alert' ? 'border-red-900/50 bg-red-950/10' : ''}
                            ${insight.severity === 'warning' ? 'border-yellow-900/50 bg-yellow-950/10' : ''}
                            ${insight.severity === 'info' ? 'border-border bg-card/50' : ''}
                        `}>
                            <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start gap-2">
                                    <span className={`text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded
                                         ${insight.type === 'performance' ? 'bg-blue-500/10 text-blue-400' : ''}
                                         ${insight.type === 'recovery' ? 'bg-orange-500/10 text-orange-400' : ''}
                                         ${insight.type === 'focus' ? 'bg-zinc-500/10 text-zinc-400' : ''}
                                    `}>
                                        {insight.type}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                                <p className="text-sm leading-relaxed text-foreground/90 font-medium">
                                    {insight.message}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                    {insights.length === 0 && (
                        <div className="text-sm text-muted-foreground italic">No new insights. Log more workouts!</div>
                    )}
                </div>
            </div>

            <QuickLogModal
                isOpen={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                lifts={availableLifts} // Pass real lifts
                initialLiftId={selectedLiftId}
                onSave={async (exposure) => {
                    try {
                        await api.workouts.create(exposure);
                        toast({ title: "Session Logged", description: "Good work today." });
                        loadData(); // Refresh list
                    } catch (error) {
                        console.error(error);
                        toast({
                            variant: "destructive",
                            title: "Failed to save",
                            description: "Could not log session. Try again."
                        });
                    }
                }}
            />
        </div>
    );
}
