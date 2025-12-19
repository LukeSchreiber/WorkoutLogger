"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockLifts, mockExposures } from "@/lib/mock-db";
import { calculateEstimated1RM } from "@/lib/training-logic";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ExercisePage({ params }: { params: { id: string } }) {
    const [lift, setLift] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        // Mock Data Fetch
        const foundLift = mockLifts.find(l => l.id === params.id);
        const exposures = mockExposures
            .filter(e => e.liftId === params.id)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (foundLift) setLift(foundLift);

        // Transform for Chart
        const cData = exposures.map(e => ({
            date: new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            e1rm: calculateEstimated1RM(e.topSet.weight, e.topSet.reps),
            weight: e.topSet.weight,
            reps: e.topSet.reps
        }));

        setChartData(cData);
        setHistory(exposures.reverse()); // Show newest first in table
    }, [params.id]);

    if (!lift) return <div className="p-8">Loading...</div>;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">{lift.name}</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Chart */}
                <Card className="md:col-span-2 bg-muted/30 border-border">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Estimated 1RM Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="date" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Line type="monotone" dataKey="e1rm" stroke="#fff" strokeWidth={2} dot={{ r: 4, fill: "#fff" }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Best Set Stats (Placeholder for now) */}
                <Card className="bg-muted/30 border-border">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Personal Records</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="text-xs text-muted-foreground uppercase">Best e1RM</div>
                            <div className="text-2xl font-mono font-bold">
                                {Math.max(...chartData.map(d => d.e1rm), 0)} lbs
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground uppercase">Heaviest Top Set</div>
                            <div className="text-xl font-mono">
                                {Math.max(...chartData.map(d => d.weight), 0)} lbs
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* History Table */}
            <h2 className="text-xl font-bold tracking-tight mt-4">Recent History</h2>
            <div className="border rounded-md overflow-hidden bg-card">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground">
                        <tr>
                            <th className="p-3 font-medium">Date</th>
                            <th className="p-3 font-medium">Top Set</th>
                            <th className="p-3 font-medium">e1RM</th>
                            <th className="p-3 font-medium text-center">RPE</th>
                            <th className="p-3 font-medium">Backoffs</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {history.map((e: any) => (
                            <tr key={e.id} className="hover:bg-muted/50">
                                <td className="p-3 text-muted-foreground">
                                    {new Date(e.date).toLocaleDateString()}
                                </td>
                                <td className="p-3 font-mono font-medium">
                                    {e.topSet.weight} × {e.topSet.reps}
                                </td>
                                <td className="p-3 font-mono text-muted-foreground">
                                    {calculateEstimated1RM(e.topSet.weight, e.topSet.reps)}
                                </td>
                                <td className="p-3 text-center font-mono">
                                    {e.topSet.rpe}
                                </td>
                                <td className="p-3 text-xs text-muted-foreground">
                                    {e.backoffSets.map((b: any, i: number) => (
                                        <span key={i} className="mr-2">
                                            {b.weight}×{b.reps}@{b.rpe}
                                        </span>
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
