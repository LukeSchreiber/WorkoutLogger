import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Dumbbell, Layers } from "lucide-react";

interface StatsCardProps {
    sessionCount: number;
    totalSets: number;
    topLift: string;
}

export function StatsCard({ sessionCount, totalSets, topLift }: StatsCardProps) {
    return (
        <Card className="border-border/50 bg-gradient-to-br from-card to-muted/20">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">This Week</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Activity className="w-3 h-3" /> Sessions
                        </div>
                        <div className="text-2xl font-bold">{sessionCount}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Layers className="w-3 h-3" /> Sets
                        </div>
                        <div className="text-2xl font-bold">{totalSets}</div>
                    </div>
                </div>
                <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Dumbbell className="w-3 h-3" /> Top Lift
                    </div>
                    <div className="text-sm font-medium truncate">{topLift || "—"}</div>
                </div>
            </CardContent>
        </Card>
    );
}
