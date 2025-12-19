"use client";

import { SessionSummary } from "@/lib/training-logic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Flame } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";

interface TrainingLogListProps {
    sessions: SessionSummary[];
    onDelete?: (id: string, date: string) => void;
}

export function TrainingLogList({ sessions, onDelete }: TrainingLogListProps) {
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
                            <th className="p-3 font-medium text-right w-[100px]">Actions</th>
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
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link href={`/workouts/${session.id}`}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                            </Button>
                                        </Link>
                                        {onDelete && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive/50 hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => {
                                                    if (confirm("Are you sure you want to delete this workout?")) {
                                                        onDelete(session.id, session.date);
                                                    }
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
