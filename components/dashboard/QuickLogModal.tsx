"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Lift, BackoffSet } from "@/types";

interface QuickLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    lifts: Lift[];
    initialLiftId?: string;
    onSave: (exposure: any) => void;
}

export function QuickLogModal({ isOpen, onClose, lifts, initialLiftId, onSave }: QuickLogModalProps) {
    const [liftId, setLiftId] = useState(initialLiftId || "");
    const [weight, setWeight] = useState("");
    const [reps, setReps] = useState("");
    const [rpe, setRpe] = useState([8]); // Array for slider
    const [notes, setNotes] = useState("");
    const [backoffs, setBackoffs] = useState<BackoffSet[]>([]);

    const handleSave = () => {
        // Validation logic here
        onSave({
            liftId,
            topSet: { weight: Number(weight), reps: Number(reps), rpe: rpe[0] },
            backoffSets: backoffs,
            notes,
            date: new Date().toISOString()
        });
        onClose();
    };

    const addBackoff = () => {
        setBackoffs([...backoffs, { reps: Number(reps), weight: Number(weight) * 0.9, rpe: rpe[0] - 1 }]);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Log Top Set</DialogTitle>
                    <DialogDescription>Record your main work for the day.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Lift</Label>
                        <Select value={liftId} onValueChange={setLiftId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select lift" />
                            </SelectTrigger>
                            <SelectContent>
                                {lifts.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Weight</Label>
                        <Input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="col-span-3" placeholder="lbs" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Reps</Label>
                        <Input type="number" value={reps} onChange={e => setReps(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">RPE {rpe[0]}</Label>
                        <Slider value={rpe} onValueChange={setRpe} max={10} min={5} step={0.5} className="col-span-3" />
                    </div>

                    {/* Backoff Section */}
                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <Label className="text-xs uppercase text-muted-foreground">Backoffs</Label>
                            <Button type="button" variant="ghost" size="sm" onClick={addBackoff} className="h-6 text-xs">
                                + Add Set
                            </Button>
                        </div>
                        {backoffs.map((set, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                                <Input className="h-8 text-xs" defaultValue={set.weight} placeholder="wt" />
                                <Input className="h-8 text-xs" defaultValue={set.reps} placeholder="reps" />
                                <Input className="h-8 text-xs" defaultValue={set.rpe} placeholder="rpe" />
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Notes</Label>
                        <Input value={notes} onChange={e => setNotes(e.target.value)} className="col-span-3 h-8" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>Save Exposure</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
