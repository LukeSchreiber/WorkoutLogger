"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Lift } from "@/types";
import { api } from "@/lib/api";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    lifts: Lift[];
    initialLiftId?: string;
    onSave: (exposure: any) => void;
}

const FOCUS_OPTIONS = ["Push", "Pull", "Legs", "Upper", "Lower", "Full", "Arms", "Cardio"];
const DEFAULT_QUICK_LIFTS = ["Squat", "Bench Press", "Deadlift", "Overhead Press", "Pull-Up", "Barbell Row"];

export function QuickLogModal({ isOpen, onClose, lifts, initialLiftId, onSave }: QuickLogModalProps) {
    // Session State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [focus, setFocus] = useState("Push");
    const [weight, setWeight] = useState("");
    const [reps, setReps] = useState("");
    const [rpe, setRpe] = useState("");
    const [showRpe, setShowRpe] = useState(false);
    const [backoffNotes, setBackoffNotes] = useState("");
    const [notes, setNotes] = useState("");

    // Lift Logic
    const [liftId, setLiftId] = useState(initialLiftId || "");
    const [searchTerm, setSearchTerm] = useState("");
    const [isLiftDropdownOpen, setIsLiftDropdownOpen] = useState(false);

    // Derived: Quick Lifts (Top 6 most used or Defaults)
    // Lifts are already sorted by usageCount desc from backend
    const quickLifts = lifts.length > 0
        ? lifts.slice(0, 6)
        : DEFAULT_QUICK_LIFTS.map(name => ({ id: `default-${name}`, name } as Lift));

    // Derived: Filtered Lifts for Search
    const filteredLifts = lifts.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const hasExactMatch = filteredLifts.some(l => l.name.toLowerCase() === searchTerm.toLowerCase());

    const handleSelectLift = (lift: Lift) => {
        setLiftId(lift.id);
        setSearchTerm(lift.name);
        setIsLiftDropdownOpen(false);
    };

    const handleCreateLift = async () => {
        if (!searchTerm.trim()) return;

        // Optimistic UI for speed? Or wait? 
        // Let's create immediately.
        try {
            const newLift = await api.lifts.create(searchTerm.trim());
            // In a real app we'd update the parent SWR/Context, but here we might be stale.
            // Ideally we call a refresh or just use the ID. 
            // For now, let's assume we proceed with the ID. 
            // We can't easily push to 'lifts' prop without parent refresh.
            // Hack: we'll treat it as selected.
            setLiftId(newLift.id);
            setIsLiftDropdownOpen(false);
        } catch (e) {
            console.error("Failed to create lift", e);
            alert("Failed to create lift. Try again.");
        }
    };

    const handleSave = () => {
        onSave({
            liftId,
            date: new Date(date).toISOString(),
            focus,
            topSet: { weight: Number(weight), reps: Number(reps), rpe: showRpe ? Number(rpe) : 0 },
            backoffNotes,
            notes,
            sets: []
        });
        // Reset essential fields
        setWeight("");
        setReps("");
        setRpe("");
        setBackoffNotes("");
        setNotes("");
        setSearchTerm("");
        setLiftId("");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-background border-border p-0 gap-0 overflow-visible">
                {/* overflow-visible needed for absolute dropdown? maybe constrain it inside */}
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
                            </div>
                        </div>
                    </div>

                    {/* 2. Main Lift (Type-Ahead) */}
                    <div className="space-y-2 relative z-50">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Main Lift</Label>

                        {/* Quick Chips */}
                        <div className="flex flex-wrap gap-2 mb-2">
                            {quickLifts.map(l => (
                                <Badge
                                    key={l.id}
                                    variant={liftId === l.id || (l.id.startsWith("default") && searchTerm === l.name) ? "secondary" : "outline"}
                                    className="cursor-pointer hover:bg-muted/80 transition-colors"
                                    onClick={() => {
                                        if (l.id.startsWith("default")) {
                                            // Pre-fill search for creation
                                            setSearchTerm(l.name);
                                            setLiftId(""); // Needs creation
                                            setIsLiftDropdownOpen(true);
                                        } else {
                                            handleSelectLift(l);
                                        }
                                    }}
                                >
                                    {l.name}
                                </Badge>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <Input
                                placeholder="Search or type to create..."
                                value={searchTerm}
                                onChange={e => {
                                    setSearchTerm(e.target.value);
                                    setIsLiftDropdownOpen(true);
                                    if (liftId && e.target.value !== lifts.find(l => l.id === liftId)?.name) {
                                        setLiftId(""); // Clear selection on edit
                                    }
                                }}
                                onFocus={() => setIsLiftDropdownOpen(true)}
                                className={cn(liftId ? "border-primary/50 bg-primary/5" : "")}
                            />
                            {liftId && (
                                <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                            )}

                            {/* Dropdown */}
                            {isLiftDropdownOpen && searchTerm && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md max-h-[200px] overflow-auto z-50">
                                    {filteredLifts.length > 0 && (
                                        <div className="p-1">
                                            {filteredLifts.map(l => (
                                                <div
                                                    key={l.id}
                                                    className="px-3 py-2 text-sm hover:bg-accent rounded-sm cursor-pointer flex justify-between items-center"
                                                    onClick={() => handleSelectLift(l)}
                                                >
                                                    {l.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {!hasExactMatch && searchTerm.trim() && (
                                        <div
                                            className="p-1 border-t border-border/50"
                                            onClick={handleCreateLift}
                                        >
                                            <div className="px-3 py-2 text-sm hover:bg-accent rounded-sm cursor-pointer text-primary font-medium flex items-center gap-2">
                                                <Plus className="w-4 h-4" />
                                                Create "{searchTerm}"
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. Top Set */}
                    <div className="space-y-3 relative z-10">
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

                    {/* 4. Context */}
                    <div className="space-y-4 pt-2 border-t border-border/50 relative z-10">
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
