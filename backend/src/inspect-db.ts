import { db } from "./lib/db";

async function inspect() {
    console.log("🔍 Inspecting Database State...");

    try {
        const users = await db.user.findMany({
            include: {
                _count: {
                    select: { workouts: true, lifts: true }
                }
            }
        });

        console.log(`\nFound ${users.length} Users:`);
        users.forEach(u => {
            console.log(`- User: ${u.username} (ID: ${u.id})`);
            console.log(`  Target Workouts: ${u._count.workouts}`);
            console.log(`  Lifts: ${u._count.lifts}`);
        });

        const totalWorkouts = await db.workout.count();
        console.log(`\nTotal Workouts in DB: ${totalWorkouts}`);

    } catch (e) {
        console.error("Inspection failed:", e);
    }
}

inspect();
