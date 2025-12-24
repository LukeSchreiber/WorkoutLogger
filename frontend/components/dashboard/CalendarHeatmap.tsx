"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCalendarDays, getMonthStart, getMonthEnd, formatYYYYMMDD } from "@/lib/date-utils";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"


interface CalendarHeatmapProps {
    onSelectDay: (date: string, workouts: any[]) => void;
}

export function CalendarHeatmap({ onSelectDay }: CalendarHeatmapProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [workouts, setWorkouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const days = getCalendarDays(currentDate);

    // Fetch monthly data
    useEffect(() => {
        const fetchMonth = async () => {
            setLoading(true);
            try {
                // Get extended range to cover padding days
                const start = formatYYYYMMDD(days[0]);
                const end = formatYYYYMMDD(days[days.length - 1]);
                const res = await api.workouts.getRange(start, end);
                setWorkouts(res.workouts);
            } catch (e) {
                console.error("Failed to fetch calendar", e);
            } finally {
                setLoading(false);
            }
        };
        fetchMonth();
    }, [currentDate]); // eslint-disable-line react-hooks/exhaustive-deps

    // Helper to get workouts for a specific day
    const getWorkoutsForDay = (dateStr: string) => {
        // Date strings from DB are ISO. We compare YYYY-MM-DD.
        return workouts.filter(w => w.date.startsWith(dateStr));
    };

    const handlePrev = () => {
        const d = new Date(currentDate);
        d.setMonth(d.getMonth() - 1);
        setCurrentDate(d);
    };

    const handleNext = () => {
        const d = new Date(currentDate);
        d.setMonth(d.getMonth() + 1);
        setCurrentDate(d);
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const handleMonthChange = (monthStr: string) => {
        const d = new Date(currentDate);
        d.setMonth(parseInt(monthStr));
        setCurrentDate(d);
    };

    const handleYearChange = (yearStr: string) => {
        const d = new Date(currentDate);
        d.setFullYear(parseInt(yearStr));
        setCurrentDate(d);
    };

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Generate years (past 5 years + next year)
    const baseYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => baseYear - 4 + i).reverse(); // [2026, 2025, ... 2021]

    return (
        <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrev}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
                        <SelectTrigger className="w-[120px] h-8 text-xs font-semibold">
                            <SelectValue>{months[currentMonth]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((m, i) => (
                                <SelectItem key={m} value={i.toString()}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={currentYear.toString()} onValueChange={handleYearChange}>
                        <SelectTrigger className="w-[80px] h-8 text-xs">
                            <SelectValue>{currentYear}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((y) => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNext}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>

                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleToday}>
                        Today
                    </Button>
                </div>
                {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </CardHeader>
            <CardContent>
                {/* Weekday Header */}
                <div className="grid grid-cols-7 mb-2 text-center text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d}>{d}</div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {days.map((day, i) => {
                        const dateStr = formatYYYYMMDD(day);
                        const dayWorkouts = getWorkoutsForDay(dateStr);
                        const count = dayWorkouts.length;

                        // Check if day belongs to current month
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                        const isToday = dateStr === formatYYYYMMDD(new Date());

                        // Heatmap Color Logic
                        let bgClass = "bg-muted/5 hover:bg-muted/10"; // Default empty
                        if (count === 1) bgClass = "bg-primary/20 hover:bg-primary/30 border-primary/20";
                        if (count >= 2) bgClass = "bg-primary/50 hover:bg-primary/60 border-primary/40";
                        if (count >= 3) bgClass = "bg-primary text-primary-foreground border-primary";

                        // Dim padding days
                        if (!isCurrentMonth) bgClass += " opacity-30 grayscale";

                        // Highlight Today
                        const borderClass = isToday ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : "border border-transparent";

                        return (
                            <TooltipProvider key={i}>
                                <Tooltip delayDuration={100}>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => onSelectDay(dateStr, dayWorkouts)}
                                            className={cn(
                                                "aspect-square rounded-md flex flex-col items-center justify-center text-xs transition-all relative group",
                                                bgClass,
                                                borderClass
                                            )}
                                        >
                                            <span className={cn(
                                                "font-medium",
                                                !isCurrentMonth && "text-muted-foreground",
                                                count > 2 && "text-primary-foreground"
                                            )}>
                                                {day.getDate()}
                                            </span>
                                            {/* Dot indicators for low intensity if needed, but color handles it */}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs">
                                        <div className="font-bold">{dateStr}</div>
                                        <div>{count} session{count !== 1 ? 's' : ''}</div>
                                        {count > 0 && (
                                            <div className="mt-1 opacity-80">
                                                {dayWorkouts.map((w: any) => (
                                                    <div key={w.id} className="truncate max-w-[120px]">
                                                        • {w.focus || "Workout"}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
