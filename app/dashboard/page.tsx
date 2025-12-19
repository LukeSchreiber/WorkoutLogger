"use client";

import { useEffect, useState } from "react";
import { Insight } from "@/types";
import { getRecentSessions, SessionSummary } from "@/lib/training-logic";
import { TrainingLogList } from "@/components/dashboard/TrainingLogList";
import { QuickLogModal } from "@/components/dashboard/QuickLogModal";
import { getDashboardData, mockLifts } from "@/lib/mock-db";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Dashboard() {
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);

    // Default to first lift for Quick Log
    const [selectedLiftId, setSelectedLiftId] = useState<string>(mockLifts[0]?.id || "");

    useEffect(() => {
        const loadData = async () => {
            // 1. Load Local Data (Instant)
            const { mockExposures } = require("@/lib/mock-db");
            const recentSessions = getRecentSessions(mockExposures, mockLifts);
            setSessions(recentSessions);
            setLoading(false);

            // 2. Fetch AI Insights (Async)
            try {
                // Prepare small payload for AI
                const { getDashboardData } = require("@/lib/mock-db");
                const { stats } = getDashboardData();
                const recentHistory = mockExposures.slice(0, 5); // Send last 5 exposures

                const response = await fetch('/api/insights', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stats, recentHistory }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    const wrappedError: any = new Error(errorData.error || "Fetch failed");
                    wrappedError.debug = errorData.debug; // Attach debug info
                    throw wrappedError;
                }

                const data = await response.json();
                if (data.insights) {
                    setInsights(data.insights);
                }
            } catch (e) {
                console.error("Failed to load insights, falling back to local data.");
                // Fallback to local logic
                const { getDashboardData } = require("@/lib/mock-db");
                const { insights: localInsights } = getDashboardData();
                setInsights(localInsights);
            }
        };
        loadData();
    }, []);

    if (loading) return <div className="p-8 text-muted-foreground">Loading training log...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-10 gap-8 h-[calc(100vh-100px)] overflow-hidden">
            {/* Left 70%: Training Log List */}
            <div className="md:col-span-7 flex flex-col gap-4 overflow-hidden">
                <div className="flex justify-between items-center px-1">
                    <h1 className="text-3xl font-bold tracking-tight">Training Log</h1>
                    <Button onClick={() => setIsLogModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" /> Quick Log
                    </Button>
                </div>

                <div className="overflow-auto flex-1 pb-10">
                    <TrainingLogList sessions={sessions} />
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
                        <div className="text-sm text-muted-foreground italic">No insights available. Log more data.</div>
                    )}
                </div>
            </div>

            <QuickLogModal
                isOpen={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                lifts={mockLifts}
                initialLiftId={selectedLiftId}
                onSave={(exposure) => {
                    console.log("Saved", exposure);
                }}
            />
        </div>
    );
}
