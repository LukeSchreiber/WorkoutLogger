"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Lift } from "@/types";
import { Search } from "lucide-react";

interface QuickLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    lifts: Lift[];
    initialLiftId?: string;
    onSave: (exposure: any) => void;
}

const FOCUS_OPTIONS = ["Push", "Pull", "Legs", "Upper", "Lower", "Full", "Arms", "Cardio"];
const QUICK_LIFTS = ["Squat", "Bench Press", "Deadlift", "Overhead Press"];

export function QuickLogModal({ isOpen, onClose, lifts, initialLiftId, onSave }: QuickLogModalProps) {
    const [liftId, setLiftId] = useState(initialLiftId || "");
    const [weight, setWeight] = useState("");
    const [reps, setReps] = useState("");
    const [rpe, setRpe] = useState("");
    const [showRpe, setShowRpe] = useState(false);
    const [backoffNotes, setBackoffNotes] = useState("");
    const [notes, setNotes] = useState("");
    const [focus, setFocus] = useState("Push"); // Default
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [isOtherLift, setIsOtherLift] = useState(false);

    // Filter quick lifts vs "Other"
    const quickLiftObjs = lifts.filter(l => QUICK_LIFTS.includes(l.name));
    const otherLifts = lifts.filter(l => !QUICK_LIFTS.includes(l.name));

    const handleSave = () => {
        onSave({
            liftId,
            date: new Date(date).toISOString(), // Convert back to ISO for DB
            focus,
            topSet: { weight: Number(weight), reps: Number(reps), rpe: showRpe ? Number(rpe) : 0 },
            backoffNotes,
            notes,
            sets: [] // Backend handles creating the real Set objects from topSet
        });
        // Reset (except maybe focus/date if logging multiple?)
        setWeight("");
        setReps("");
        setRpe("");
        setBackoffNotes("");
        setNotes("");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-background border-border p-0 gap-0 overflow-hidden">
                <div className="p-6 pb-2">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Log Session</DialogTitle>
                    </DialogHeader>
                </div>

                <div className="flex flex-col gap-6 p-6 pt-2">
                    {/* 1. Date & Focus */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Date</Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="bg-muted/30 border-border/50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Focus</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {FOCUS_OPTIONS.slice(0, 4).map(opt => (
                                    <Badge
                                        key={opt}
                                        variant={focus === opt ? "default" : "outline"}
                                        className="cursor-pointer font-medium"
                                        onClick={() => setFocus(opt)}
                                    >
                                        {opt}
                                    </Badge>
                                ))}
                                {/* Simple dropdown or more badge for others could go here, staying minimal for now */}
                            </div>
                        </div>
                    </div>

                    {/* 2. Main Lift Selection */}
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Main Lift</Label>
                        {!isOtherLift ? (
                            <div className="grid grid-cols-2 gap-2">
                                {quickLiftObjs.map(l => (
                                    <Button
                                        key={l.id}
                                        variant={liftId === l.id ? "default" : "outline"}
                                        className="justify-start h-10 px-3"
                                        onClick={() => setLiftId(l.id)}
                                    >
                                        {l.name}
                                    </Button>
                                ))}
                                <Button variant={liftId === "other" ? "default" : "ghost"} className="justify-start text-muted-foreground" onClick={() => setIsOtherLift(true)}>
                                    <Search className="w-4 h-4 mr-2" /> Other Lift...
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={liftId}
                                    onChange={(e) => setLiftId(e.target.value)}
                                >
                                    <option value="" disabled>Select a lift...</option>
                                    {otherLifts.map(l => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                    {quickLiftObjs.map(l => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                </select>
                                <Button variant="ghost" size="sm" onClick={() => setIsOtherLift(false)} className="text-xs h-6 px-0 pl-1">
                                    &larr; Back to Quick Lifts
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* 3. Top Set */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Main Lift Performance</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground uppercase font-bold">RPE?</span>
                                <Switch checked={showRpe} onCheckedChange={setShowRpe} className="scale-75 origin-right" />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Input
                                    type="number"
                                    value={weight}
                                    onChange={e => setWeight(e.target.value)}
                                    placeholder="0"
                                    className="pl-3 pr-8 text-lg font-mono"
                                    autoFocus
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">lbs</span>
                            </div>
                            <div className="relative w-20">
                                <Input
                                    type="number"
                                    value={reps}
                                    onChange={e => setReps(e.target.value)}
                                    placeholder="0"
                                    className="pl-3 pr-2 text-lg font-mono text-center"
                                />
                                <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground uppercase">Reps</span>
                            </div>
                            {showRpe && (
                                <div className="relative w-20 animate-in fade-in slide-in-from-right-4 duration-200">
                                    <Input
                                        type="number"
                                        value={rpe}
                                        onChange={e => setRpe(e.target.value)}
                                        placeholder="-"
                                        max={10}
                                        className="pl-3 pr-2 text-lg font-mono text-center bg-blue-500/5 border-blue-500/20 text-blue-400"
                                    />
                                    <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-blue-400/70 uppercase">RPE</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 4. Context (Backoffs & Notes) */}
                    <div className="space-y-4 pt-2 border-t border-border/50">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Context</Label>
                            <Input
                                value={backoffNotes}
                                onChange={e => setBackoffNotes(e.target.value)}
                                placeholder="Backoffs (optional): e.g. 3x5 @ -10%"
                                className="bg-muted/30 border-border/50 text-sm"
                            />
                            <Input
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Notes: bar speed, fatigue, cues"
                                className="bg-muted/30 border-border/50 text-sm"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 pt-2">
                    <Button onClick={handleSave} className="w-full h-11 text-base font-semibold" disabled={!liftId || !weight || !reps}>
                        Save Session
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
