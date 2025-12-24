
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
    console.log("🧹 Starting Database Cleanup...");

    // 1. Check current users
    const usersBefore = await db.user.findMany();
    console.log(`Current Users Count: ${usersBefore.length}`);
    usersBefore.forEach(u => console.log(` - ${u.username} (${u.id})`));

    // 2. Delete Test Data
    // Deleting the user will cascade delete their Workouts (per schema if configured, or we delete manually)
    // Schema check: Workout has `userId` ref. If we delete User, we need to know failure behavior.
    // Prisma `onDelete` isn't always set in DB unless migration enforced it.
    // Let's safe-delete.

    const testUsers = usersBefore.filter(u => u.username.startsWith("test_user_"));

    if (testUsers.length > 0) {
        console.log(`\nFound ${testUsers.length} test users to delete.`);
        for (const u of testUsers) {
            // Delete workouts first (just in case cascade isn't perfect, though likely is)
            await db.workout.deleteMany({ where: { userId: u.id } });
            // Delete lifts
            await db.lift.deleteMany({ where: { userId: u.id } });
            // Delete user
            await db.user.delete({ where: { id: u.id } });
            console.log(`Deleted test user: ${u.username}`);
        }
    } else {
        console.log("\nNo test users found to delete.");
    }

    // 3. Final Check
    const usersAfter = await db.user.findMany();
    console.log(`\nRemaining Users Count: ${usersAfter.length}`);
    if (usersAfter.length === 0) {
        console.log("The database is currently empty (no users).");
    } else {
        usersAfter.forEach(u => console.log(` - ${u.username}`));
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
