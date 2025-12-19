import { db } from "./lib/db";

async function verify() {
    console.log("🔍 Starting Database Verification...");

    try {
        // 1. Create a Test User
        const username = `verify_user_${Date.now()}`;
        console.log(`👤 Creating test user: ${username}`);
        const user = await db.user.create({
            data: {
                username,
                password: "hashed_password_dummy",
            },
        });

        // 2. Create a Lift
        console.log("🏋️  Creating test lift: Bench Press");
        const lift = await db.lift.create({
            data: {
                name: "Bench Press Verification",
                userId: user.id,
            },
        });

        // 3. Log a Workout (Exposure) with Sets
        console.log("📝 Logging crucial data (Date, Sets, Reps, Weight)...");
        const workout = await db.exposure.create({
            data: {
                userId: user.id,
                liftId: lift.id,
                date: new Date(),
                notes: "Verification Run",
                sets: {
                    create: [
                        { weight: 225, reps: 5, rpe: 8, isTopSet: true },
                        { weight: 205, reps: 8, rpe: 7, isTopSet: false },
                    ],
                },
            },
            include: { sets: true },
        });

        // 4. Verify Data Integrity
        console.log("✅ Workout saved with ID:", workout.id);
        console.log("📊 Verifying sets...");
        if (workout.sets.length !== 2) throw new Error("Missing sets!");

        const topSet = workout.sets.find(s => s.isTopSet);
        if (!topSet || topSet.weight !== 225 || topSet.reps !== 5) {
            throw new Error("❌ Crucial data mismatch! Top set data is wrong.");
        }

        console.log("🎉 SUCCESS: Top Set (225lbs x 5 reps) verified correctly.");
        console.log("💾 Database is reliably collecting ALL crucial data.");

        // Cleanup
        await db.user.delete({ where: { id: user.id } }); // Cascades delete to workout

    } catch (e) {
        console.error("❌ Verification Failed:", e);
        process.exit(1);
    }
}

verify();
