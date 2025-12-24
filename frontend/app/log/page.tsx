"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Copy, Save, ChevronLeft, Dumbbell, GripVertical, X } from "lucide-react";
import { api } from "@/lib/api";
import { Lift, WorkoutExercise, CreateWorkoutInput } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// --- Components ---

// Simple command-like lift search
function LiftSelector({ lifts, onSelect, onCreate }: { lifts: Lift[], onSelect: (l: Lift) => void, onCreate: (name: string) => void }) {
    const [search, setSearch] = useState("");
    const filtered = lifts.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-2 p-2">
            <Input
                autoFocus
                placeholder="Search lift..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="text-base"
            />
            <div className="max-h-[200px] overflow-auto space-y-1">
                {filtered.map(l => (
                    <Button key={l.id} variant="ghost" className="w-full justify-start h-9" onClick={() => onSelect(l)}>
                        {l.name}
                    </Button>
                ))}
                {search && !filtered.find(l => l.name.toLowerCase() === search.toLowerCase()) && (
                    <Button variant="ghost" className="w-full justify-start h-9 text-primary" onClick={() => onCreate(search)}>
                        <Plus className="w-3 h-3 mr-2" /> Create "{search}"
                    </Button>
                )}
            </div>
        </div>
    )
}

// --- Main Page ---

export default function LogWorkoutPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const copyId = searchParams.get('copy');
    const prefillDate = searchParams.get('date');
    const { toast } = useToast();

    // Global State
    const [date, setDate] = useState(prefillDate || new Date().toISOString().split('T')[0]);
    const [focus, setFocus] = useState("Push");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [notes, setNotes] = useState("");

    const handleAddTag = () => {
        if (!tagInput.trim()) return;
        if (tags.includes(tagInput.trim())) return;
        setTags([...tags, tagInput.trim()]);
        setTagInput("");
    };

    const handleRemoveTag = (tag: string) => {
        setTags(tags.filter(t => t !== tag));
    };

    // Exercises Draft State
    // We map UI ID (random) to actual data so we can reorder easily if needed
    type DraftEx = WorkoutExercise & { uiId: string };
    const [exercises, setExercises] = useState<DraftEx[]>([]);

    // Metadata
    const [lifts, setLifts] = useState<Lift[]>([]);
    const [showLiftSelector, setShowLiftSelector] = useState(false);
    const [loading, setLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        api.lifts.list().then(res => {
            setLifts(res.lifts);
            setLoading(false);
        });
    }, []);

    // --- Actions ---

    const addExercise = (lift: Lift) => {
        const newEx: DraftEx = {
            uiId: Math.random().toString(36),
            liftId: lift.id,
            liftName: lift.name,
            position: exercises.length,
            sets: [
                { position: 0, weight: 0, reps: 0, type: "work" } // Start with 1 empty set
            ]
        };
        setExercises([...exercises, newEx]);
        setShowLiftSelector(false);
    };

    const handleCreateLift = async (name: string) => {
        try {
            const newLift = await api.lifts.create(name);
            setLifts(prev => [...prev, newLift]); // Add to local list
            addExercise(newLift);
        } catch (e) {
            toast({ title: "Failed to create lift", variant: "destructive" });
        }
    };

    const updateSet = (exIndex: number, setIndex: number, field: string, val: any) => {
        const newExs = [...exercises];
        newExs[exIndex].sets[setIndex] = { ...newExs[exIndex].sets[setIndex], [field]: val };
        setExercises(newExs);
    };

    const addSet = (exIndex: number) => {
        const newExs = [...exercises];
        const previousSet = newExs[exIndex].sets[newExs[exIndex].sets.length - 1];
        newExs[exIndex].sets.push({
            position: newExs[exIndex].sets.length,
            weight: previousSet ? previousSet.weight : 0, // Auto-copy weight
            reps: previousSet ? previousSet.reps : 0,    // Auto-copy reps
            type: "work"
        });
        setExercises(newExs);
    };

    const removeSet = (exIndex: number, setIndex: number) => {
        const newExs = [...exercises];
        newExs[exIndex].sets.splice(setIndex, 1);
        setExercises(newExs);
    };

    const removeExercise = (index: number) => {
        const newExs = [...exercises];
        newExs.splice(index, 1);
        setExercises(newExs);
    };

    const copyLastWorkout = async () => {
        try {
            const last = await api.workouts.getLast();
            // Transform to draft
            // We strip IDs to treat them as new
            // If we have a prefill date, we keep it, otherwise default to today (already set in state)
            setFocus(last.focus || "Push");
            const newExs: DraftEx[] = last.exercises.map((ex: any) => ({
                uiId: Math.random().toString(36),
                liftId: ex.liftId,
                liftName: ex.lift.name,
                position: ex.position,
                sets: ex.sets.map((s: any) => ({
                    position: s.position,
                    weight: s.weight,
                    reps: s.reps,
                    rpe: s.rpe,
                    type: s.type
                }))
            }));
            setExercises(newExs);
            toast({ title: "Copied Last Workout" });
        } catch (e) {
            toast({ title: "No previous workout found", variant: "destructive" });
        }
    };

    const handleSave = async () => {
        if (exercises.length === 0) {
            toast({ title: "Add at least one exercise", variant: "destructive" });
            return;
        }

        const payload: CreateWorkoutInput = {
            date: new Date().toISOString(),
            focus,
            tags,
            notes,
            exercises: exercises.map((ex, i) => ({
                liftId: ex.liftId,
                position: i,
                notes: ex.notes,
                sets: ex.sets.map((s, j) => ({
                    position: j,
                    weight: Number(s.weight),
                    reps: Number(s.reps),
                    rpe: s.rpe ? Number(s.rpe) : undefined,
                    type: s.type
                }))
            }))
        };

        try {
            await api.workouts.create(payload);
            toast({ title: "Workout Saved", description: "Good job." });
            router.push("/dashboard");
        } catch (e) {
            console.error(e);
            toast({ title: "Failed to save", variant: "destructive" });
        }
    };

    // Quick Chips
    const quickLifts = ["Squat", "Bench Press", "Deadlift", "Overhead Press"];

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center h-14 px-4 gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="font-bold text-lg flex-1">Log Session</h1>
                    <Button size="sm" onClick={handleSave} disabled={exercises.length === 0}>
                        <Save className="h-4 w-4 mr-2" /> Save
                    </Button>
                </div>
            </header>

            <div className="p-4 max-w-xl mx-auto space-y-6">

                {/* 1. Meta */}
                <Card className="border-border/50">
                    <CardContent className="p-4 space-y-4">
                        <div className="flex gap-4">
                            <div className="space-y-1.5 flex-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Date</Label>
                                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-muted/50" />
                            </div>
                            <div className="space-y-1.5 flex-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Focus</Label>
                                <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                                    {["Push", "Pull", "Legs", "Upper", "Lower", "Custom"].map(f => {
                                        const standard = ["Push", "Pull", "Legs", "Upper", "Lower"];
                                        const isCustom = !standard.includes(focus);
                                        const isActive = f === "Custom" ? isCustom : focus === f;

                                        return (
                                            <Badge
                                                key={f}
                                                variant={isActive ? "default" : "outline"}
                                                className="cursor-pointer whitespace-nowrap"
                                                onClick={() => {
                                                    if (f === "Custom") {
                                                        if (!isCustom) setFocus(""); // Clear only if switching TO custom
                                                    } else {
                                                        setFocus(f);
                                                    }
                                                }}
                                            >
                                                {f}
                                            </Badge>
                                        );
                                    })}
                                </div>
                                {(!["Push", "Pull", "Legs", "Upper", "Lower"].includes(focus)) && (
                                    <Input
                                        placeholder="Enter custom focus..."
                                        value={focus}
                                        onChange={e => setFocus(e.target.value)}
                                        className="h-8 text-xs mt-2 animate-in fade-in zoom-in-95 duration-200"
                                        autoFocus
                                    />
                                )}
                            </div>
                            <div className="space-y-1.5 flex-1">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Labels</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                                        placeholder="Add tag..."
                                        className="h-9 text-sm bg-muted/50"
                                    />
                                    <Button size="sm" variant="ghost" onClick={handleAddTag} disabled={!tagInput} className="px-2">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {tags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="px-2 py-0.5 text-xs font-normal gap-1">
                                            {tag}
                                            <X className="w-3 h-3 cursor-pointer opacity-50 hover:opacity-100" onClick={() => handleRemoveTag(tag)} />
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {exercises.length === 0 && (
                            <Button variant="outline" className="w-full" onClick={copyLastWorkout}>
                                <Copy className="w-4 h-4 mr-2" /> Copy Last Workout
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* 2. Exercises List */}
                <div className="space-y-4">
                    {exercises.map((ex, i) => (
                        <Card key={ex.uiId} className="border-border/50 overflow-hidden">
                            <CardHeader className="p-3 bg-muted/20 flex flex-row items-center justify-between space-y-0">
                                <div className="font-bold text-base flex items-center gap-2">
                                    <div className="bg-primary/10 p-1.5 rounded-md text-primary">
                                        <Dumbbell className="w-4 h-4" />
                                    </div>
                                    {ex.liftName}
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeExercise(i)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                {/* Sets Table */}
                                <div className="w-full text-sm">
                                    <div className="grid grid-cols-10 gap-2 px-3 py-2 bg-muted/5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        <div className="col-span-1 text-center">#</div>
                                        <div className="col-span-3 text-center">Lbs</div>
                                        <div className="col-span-3 text-center">Reps</div>
                                        <div className="col-span-2 text-center">RPE</div>
                                        <div className="col-span-1"></div>
                                    </div>
                                    <div className="divide-y divide-border/50">
                                        {ex.sets.map((set, j) => (
                                            <div key={j} className="grid grid-cols-10 gap-2 px-3 py-2 items-center">
                                                <div className="col-span-1 text-center font-mono text-muted-foreground">{j + 1}</div>
                                                <div className="col-span-3">
                                                    <Input
                                                        type="number"
                                                        value={set.weight || ""}
                                                        onChange={e => updateSet(i, j, "weight", e.target.value)}
                                                        className="h-8 text-center font-mono bg-transparent border-transparent hover:border-input focus:border-input transition-colors"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <Input
                                                        type="number"
                                                        value={set.reps || ""}
                                                        onChange={e => updateSet(i, j, "reps", e.target.value)}
                                                        className="h-8 text-center font-mono bg-transparent border-transparent hover:border-input focus:border-input transition-colors"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <Input
                                                        type="number"
                                                        value={set.rpe || ""}
                                                        onChange={e => updateSet(i, j, "rpe", e.target.value)}
                                                        className="h-8 text-center font-mono bg-transparent border-transparent hover:border-input focus:border-input transition-colors placeholder:text-muted-foreground/30"
                                                        placeholder="-"
                                                    />
                                                </div>
                                                <div className="col-span-1 flex justify-end">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/50 hover:text-destructive" onClick={() => removeSet(i, j)}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Button variant="ghost" className="w-full rounded-none h-10 border-t border-border/50 text-muted-foreground hover:text-primary" onClick={() => addSet(i)}>
                                    <Plus className="w-4 h-4 mr-2" /> Add Set
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* 3. Add Exercise Area */}
                <div className="space-y-4 pt-4">
                    {/* Quick Chips */}
                    {exercises.length === 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                            {quickLifts.map(q => (
                                <Badge
                                    key={q}
                                    variant="secondary"
                                    className="px-3 py-1.5 text-sm cursor-pointer hover:bg-primary/20"
                                    onClick={() => {
                                        const found = lifts.find(l => l.name === q);
                                        if (found) addExercise(found);
                                        else handleCreateLift(q); // Auto create if missing
                                    }}
                                >
                                    + {q}
                                </Badge>
                            ))}
                        </div>
                    )}

                    {showLiftSelector ? (
                        <Card className="animate-in slide-in-from-bottom-2">
                            <CardHeader className="p-3 pb-0">
                                <CardTitle className="text-sm">Select Exercise</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <LiftSelector
                                    lifts={lifts}
                                    onSelect={(l) => { addExercise(l); }}
                                    onCreate={(n) => { handleCreateLift(n); }}
                                />
                                <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => setShowLiftSelector(false)}>Cancel</Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Button variant="outline" size="lg" className="w-full border-dashed border-2 py-8 text-muted-foreground hover:text-foreground" onClick={() => setShowLiftSelector(true)}>
                            <Plus className="w-5 h-5 mr-2" /> Add Exercise
                        </Button>
                    )}
                </div>

                {/* 4. Global Notes */}
                <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider">Session Notes</Label>
                    <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="How did it feel?" />
                </div>

                <div className="h-10"></div>
            </div>
        </div>
    );
}
