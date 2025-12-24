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
                <div key={session.id} className="group relative flex flex-col gap-3 p-5 rounded-xl border border-border/40 bg-card hover:bg-muted/40 hover:border-border/80 transition-all shadow-sm">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{session.displayDate}</span>
                                {session.focus && (
                                    <Badge variant="outline" className="text-[10px] py-0 h-4 border-primary/20 bg-primary/5 text-primary">
                                        {session.focus}
                                    </Badge>
                                )}
                                {session.tags && session.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-[10px] py-0 h-4 bg-muted text-muted-foreground hover:bg-muted font-normal">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                            <div className="text-lg font-semibold text-foreground tracking-tight">
                                {/* Assuming single top set description is primary */}
                                {session.topSetDescriptions[0] || "No Data"}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground/50 hover:text-destructive"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (confirm("Delete this session?")) onDelete(session.id, session.date);
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                                </Button>
                            )}
                            <Link href={`/workouts/${session.id}`}>
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                                    View <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Footer Infos */}
                    {(session.backoffNotes || session.notes) && (
                        <div className="flex flex-col gap-1 pt-2 border-t border-border/30">
                            {session.backoffNotes && (
                                <div className="text-xs text-muted-foreground font-mono">
                                    {session.backoffNotes}
                                </div>
                            )}
                            {session.notes && (
                                <div className="text-xs text-muted-foreground/60 italic">
                                    &quot;{session.notes}&quot;
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
