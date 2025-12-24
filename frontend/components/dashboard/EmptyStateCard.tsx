import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, LayoutTemplate } from "lucide-react";
import Link from "next/link";

export function EmptyStateCard() {
    return (
        <Card className="border-dashed border-2 border-border/60 bg-muted/5 shadow-none">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="p-3 bg-primary/10 rounded-full text-primary ring-1 ring-inset ring-primary/20">
                    <Dumbbell className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-sm">
                    <h3 className="text-lg font-semibold tracking-tight">Log your first session</h3>
                    <p className="text-sm text-muted-foreground">
                        Start tracking your progress today. You can create a new workout or use a template.
                    </p>
                </div>
                <div className="flex gap-3 pt-2">
                    <Link href="/log">
                        <Button>
                            Log Today’s Lift
                        </Button>
                    </Link>
                    <Button variant="outline" className="gap-2" onClick={() => alert("Templates coming soon!")}>
                        <LayoutTemplate className="w-4 h-4" /> View Templates
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
