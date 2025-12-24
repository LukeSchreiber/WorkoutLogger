
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
    const users = await db.user.findMany();
    console.log(`User Count: ${users.length}`);
    users.forEach((u) => console.log(` - Username: ${u.username}, ID: ${u.id}`));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
