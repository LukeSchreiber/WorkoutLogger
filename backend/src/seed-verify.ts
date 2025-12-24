
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
    console.log("🌱 Starting Database Verification...");

    // 1. Create User
    const username = "test_user_" + Math.random().toString(36).substring(7);
    console.log(`Creating user: ${username}...`);
    const user = await db.user.create({
        data: {
            username,
            password: "password123", // Basic mock
        },
    });
    console.log("✅ User created:", user.id);

    // 2. Create Lifts
    console.log("Creating lifts...");
    const liftsData = ["Squat", "Bench Press", "Deadlift"];
    const lifts = await Promise.all(
        liftsData.map((name) =>
            db.lift.create({
                data: { name, userId: user.id },
            })
        )
    );
    console.log(`✅ ${lifts.length} lifts created.`);

    // 3. Create a Robust Workout with Tags (Transactional)
    console.log("Creating transactional workout...");
    const workout = await db.$transaction(async (tx) => {
        // Create
        const w = await tx.workout.create({
            data: {
                userId: user.id,
                date: new Date(),
                focus: "SBD Day",
                notes: "Testing Supabase connectivity",
                tags: ["Heavy", "Verification", "Supabase"],
                exercises: {
                    create: [
                        {
                            liftId: lifts[0].id, // Squat
                            position: 0,
                            sets: {
                                create: [
                                    { position: 0, weight: 315, reps: 5, rpe: 8, type: "work" },
                                    { position: 1, weight: 315, reps: 5, rpe: 8.5, type: "work" },
                                ],
                            },
                        },
                        {
                            liftId: lifts[1].id, // Bench
                            position: 1,
                            sets: {
                                create: [
                                    { position: 0, weight: 225, reps: 8, rpe: 9, type: "top" },
                                ],
                            },
                        },
                    ],
                },
            },
            include: {
                exercises: { include: { sets: true, lift: true } },
            },
        });

        return w;
    });

    console.log("✅ Workout created successfully!");
    console.log("   ID:", workout.id);
    console.log("   Tags:", workout.tags);
    console.log("   Exercises:", workout.exercises.length);
    console.log("   Sets in Ex 1:", workout.exercises[0].sets.length);

    // 4. Verify Fetch
    const fetched = await db.workout.findUnique({
        where: { id: workout.id },
    });

    if (fetched) {
        console.log("🔍 Verified fetch: Data persisted correctly.");
    } else {
        console.error("❌ Could not fetch created workout!");
    }

    console.log("\n🎉 Database is fully operational on Supabase!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
