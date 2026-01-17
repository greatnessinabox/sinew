import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  // Create regular user
  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      name: "Test User",
      role: "USER",
      emailVerified: new Date(),
    },
  });

  // Create sample posts
  await prisma.post.createMany({
    skipDuplicates: true,
    data: [
      {
        title: "Getting Started with Sinew",
        content: "Learn how to use Sinew patterns to build production-ready apps.",
        published: true,
        authorId: admin.id,
      },
      {
        title: "Understanding Type-Safe Environment Variables",
        content: "How to use @t3-oss/env-nextjs for validated environment variables.",
        published: true,
        authorId: admin.id,
      },
      {
        title: "Draft: Advanced Patterns",
        content: "This is a draft post about advanced patterns.",
        published: false,
        authorId: user.id,
      },
    ],
  });

  console.log("✅ Seeding complete!");
  console.log(`   Created admin: ${admin.email}`);
  console.log(`   Created user: ${user.email}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
