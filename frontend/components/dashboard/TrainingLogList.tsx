"use client";

import { SessionSummary } from "@/lib/training-logic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Flame } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";

interface TrainingLogListProps {
    sessions: SessionSummary[];
}

export function TrainingLogList({ sessions }: TrainingLogListProps) {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold tracking-tight">Training Log</h2>
                <div className="text-xs text-muted-foreground">{sessions.length} sessions logged</div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden bg-card/50">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                        <tr>
                            <th className="p-3 pl-4 font-medium w-[120px]">Date</th>
                            <th className="p-3 font-medium w-[120px]">Focus</th>
                            <th className="p-3 font-medium">Top Sets</th>
                            <th className="p-3 font-medium text-center w-[120px]">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="cursor-help underline decoration-dotted decoration-muted-foreground/50">
                                                Working Sets
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Sets performed at RPE ≥ 7.5</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </th>
                            <th className="p-3 font-medium text-right w-[80px]">View</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {sessions.map((session) => (
                            <tr key={session.id} className="hover:bg-muted/30 transition-colors group">
                                <td className="p-3 pl-4 font-mono text-muted-foreground whitespace-nowrap">
                                    {session.displayDate}
                                </td>

                                <td className="p-3">
                                    <Badge variant="outline" className="font-normal text-xs bg-background/50">
                                        {session.title}
                                    </Badge>
                                </td>

                                <td className="p-3">
                                    <div className="flex flex-col gap-1">
                                        {session.topSetDescriptions.map((desc, i) => (
                                            <div key={i} className="text-xs font-mono text-foreground/90">
                                                {desc}
                                            </div>
                                        ))}
                                    </div>
                                </td>

                                <td className="p-3 text-center">
                                    {session.workingSetsCount > 0 && (
                                        <div className="flex items-center justify-center gap-1 text-orange-500/80 font-mono text-xs">
                                            <Flame className="w-3 h-3" />
                                            {session.workingSetsCount}
                                        </div>
                                    )}
                                    {session.workingSetsCount === 0 && <span className="text-muted-foreground/30">-</span>}
                                </td>

                                <td className="p-3 text-right">
                                    <Link href={`/workouts/${session.id}`}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
