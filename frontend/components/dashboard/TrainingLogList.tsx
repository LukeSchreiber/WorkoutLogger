"use client";

import { SessionSummary } from "@/lib/training-logic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface TrainingLogListProps {
    sessions: SessionSummary[];
    onDelete?: (id: string, date: string) => void;
}

export function TrainingLogList({ sessions, onDelete }: TrainingLogListProps) {
    if (sessions.length === 0) return null; // Handled by empty state in parent

    return (
        <div className="flex flex-col gap-3">
            {sessions.map((session) => (
                <div key={session.id} className="group relative flex flex-col gap-2 p-4 rounded-lg bg-card border border-border/50 hover:bg-muted/20 hover:border-border transition-all">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-sm text-foreground/80">{session.displayDate}</span>
                            {session.focus && (
                                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold bg-muted text-muted-foreground px-1.5 py-0 h-5">
                                    {session.focus}
                                </Badge>
                            )}
                        </div>

                        {/* Actions (pushed to right) */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (confirm("Delete this session?")) onDelete(session.id, session.date);
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                </Button>
                            )}
                            <Link href={`/workouts/${session.id}`}>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div>
                        <div className="text-base font-medium text-foreground">
                            {/* Assuming single top set description is primary */}
                            {session.topSetDescriptions[0] || "No Data"}
                        </div>
                        {session.backoffNotes && (
                            <div className="text-sm text-muted-foreground mt-1 font-mono">
                                {session.backoffNotes}
                            </div>
                        )}
                        {session.notes && (
                            <div className="text-xs text-muted-foreground/50 mt-2 line-clamp-1 italic">
                                &quot;{session.notes}&quot;
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
