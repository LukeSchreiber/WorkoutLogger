"use client";

import { useEffect, useState, useCallback } from "react";
import { Insight, Lift, Exposure } from "@/types";
import { getRecentSessions, SessionSummary } from "@/lib/training-logic";
import { TrainingLogList } from "@/components/dashboard/TrainingLogList";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Calendar, Download } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link"; // Added
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { EmptyStateCard } from "@/components/dashboard/EmptyStateCard";
import { CalendarHeatmap } from "@/components/dashboard/CalendarHeatmap";
import { DayDetailPanel } from "@/components/dashboard/DayDetailPanel";

export default function Dashboard() {
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState<string>("");
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

            try {
                const { user } = await api.auth.me();
                setUsername(user.username);
            } catch (e) {
                console.error("Failed to fetch user", e);
            }

            setAvailableLifts(lifts);
            if (lifts.length > 0 && !selectedLiftId) setSelectedLiftId(lifts[0].id);

            // Transform Backend Data (Workout -> Exposure Summary)
            // We'll treat the FIRST exercise as the "Main Lift" for the summary card
            const convertedExposures: Exposure[] = workouts.map((w: any) => {
                const mainExercise = w.exercises[0]; // Primary lift
                const topSet = mainExercise?.sets?.filter((s: any) => s.type === 'work' || s.type === 'top')[0] || mainExercise?.sets?.[0];

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
                    notes: w.notes,
                    tags: w.tags || []
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

    // --- Stats Calculation ---
    // (Mock for now or derived from sessions)
    const totalSets = sessions.reduce((acc, s) => acc + (s.workingSetsCount || 5), 0); // Mock set count roughly
    const topLift = "Bench Press"; // Mock or derived

    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [selectedDayWorkouts, setSelectedDayWorkouts] = useState<any[]>([]);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleSelectDay = (date: string, workouts: any[]) => {
        setSelectedDay(date);
        setSelectedDayWorkouts(workouts);
        setIsDetailOpen(true);
    };

    // Filter Logic
    const filteredSessions = sessions.filter(s => {
        const matchesSearch = searchQuery.toLowerCase().trim() === "" ||
            s.liftNames.some(l => l.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (s.focus?.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (s.notes?.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesDate = dateFilter === "" || s.date.startsWith(dateFilter); // Simple string match yyyy-mm-dd

        return matchesSearch && matchesDate;
    });

    if (loading) return <div className="p-8 text-muted-foreground flex justify-center pt-20">Loading training log...</div>;

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* 1. Header Section */}
            <div className="border-b border-border/40 bg-background/95 backdrop-blur z-20 sticky top-0">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                        <h1 className="text-xl font-bold tracking-tight">Training Log</h1>
                        {username && <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">User: {username}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="hidden md:flex gap-1">
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={async () => {
                                try {
                                    await api.export.getTrainingLog();
                                    toast({ title: "Export Started", description: "Your training log is downloading." });
                                } catch (e) {
                                    toast({ variant: "destructive", title: "Export Failed", description: "Could not download log." });
                                }
                            }}>
                                <Download className="w-4 h-4 mr-1.5" /> Export JSON
                            </Button>
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                Templates
                            </Button>
                        </div>
                        <Link href="/log">
                            <Button size="sm" className="font-semibold shadow-sm">
                                <Plus className="w-4 h-4 mr-1.5" /> Log Session
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">

                    {/* Left Main (8 cols) */}
                    <div className="md:col-span-8 flex flex-col gap-6">

                        {/* Section Header & Filters */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="bg-muted/50 p-1 rounded-lg flex gap-1">
                                        <Button
                                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            className="h-7 text-xs px-2.5"
                                            onClick={() => setViewMode('list')}
                                        >
                                            List
                                        </Button>
                                        <Button
                                            variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                                            size="sm"
                                            className="h-7 text-xs px-2.5"
                                            onClick={() => setViewMode('calendar')}
                                        >
                                            Calendar
                                        </Button>
                                    </div>
                                    <h2 className="text-lg font-semibold tracking-tight ml-2">
                                        {viewMode === 'list' && "Recent Sessions"}
                                        {viewMode === 'list' && filteredSessions.length !== sessions.length && (
                                            <span className="text-muted-foreground text-sm font-normal ml-2">
                                                ({filteredSessions.length} found)
                                            </span>
                                        )}
                                    </h2>
                                </div>

                                {viewMode === 'list' && sessions.length > 0 && (
                                    <div className="flex gap-2">
                                        <div className="relative w-[180px] hidden sm:block">
                                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input
                                                type="search"
                                                placeholder="Search log..."
                                                className="h-8 pl-8 text-xs bg-muted/30 border-transparent hover:border-border transition-colors"
                                                value={searchQuery}
                                                onChange={(e: any) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            variant={showDatePicker || dateFilter ? "secondary" : "outline"}
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => setShowDatePicker(!showDatePicker)}
                                        >
                                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Filters / Expanded Date Picker (List Mode Only) */}
                            {viewMode === 'list' && (showDatePicker || dateFilter) && (
                                <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
                                    <Input
                                        type="date"
                                        className="w-auto h-8 text-xs"
                                        value={dateFilter}
                                        onChange={(e: any) => setDateFilter(e.target.value)}
                                    />
                                    {dateFilter && (
                                        <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => setDateFilter("")}>
                                            Clear
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        {viewMode === 'calendar' ? (
                            <CalendarHeatmap onSelectDay={handleSelectDay} />
                        ) : sessions.length === 0 ? (
                            <EmptyStateCard />
                        ) : (
                            <TrainingLogList sessions={filteredSessions} onDelete={handleDelete} />
                        )}
                    </div>

                    {/* Right Sidebar (4 cols) */}
                    <div className="md:col-span-4 flex flex-col gap-6">
                        {/* Stats */}
                        <StatsCard
                            sessionCount={sessions.length}
                            totalSets={totalSets}
                            topLift={topLift}
                        />

                        {/* Insights */}
                        <div className="flex flex-col gap-4 pl-1">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                Coaching Insights
                            </h3>

                            {insights.length === 0 ? (
                                <div className="space-y-3">
                                    <div className="p-3 rounded-lg border border-border/40 bg-muted/10 text-sm text-muted-foreground">
                                        <span className="block font-medium text-foreground mb-1">Unlock Trends</span>
                                        Log 3 more sessions to see volume and intensity trends.
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {insights.map(insight => (
                                        <Card key={insight.id} className={`
                                            shadow-sm transition-colors border
                                            ${insight.severity === 'alert' ? 'border-red-900/30 bg-red-950/5' : ''}
                                            ${insight.severity === 'warning' ? 'border-amber-900/30 bg-amber-950/5' : ''}
                                            ${insight.severity === 'info' ? 'border-blue-900/30 bg-blue-950/5' : ''}
                                        `}>
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge variant="outline" className={`
                                                        px-1.5 py-0 h-4 text-[9px] uppercase tracking-wider border-0
                                                        ${insight.type === 'performance' ? 'bg-blue-500/10 text-blue-500' : ''}
                                                        ${insight.type === 'recovery' ? 'bg-orange-500/10 text-orange-500' : ''}
                                                        ${insight.type === 'focus' ? 'bg-zinc-500/10 text-zinc-500' : ''}
                                                    `}>
                                                        {insight.type}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm font-medium leading-relaxed text-foreground/90">
                                                    {insight.message}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <DayDetailPanel
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                date={selectedDay}
                workouts={selectedDayWorkouts}
            />
        </div>
    );
}
