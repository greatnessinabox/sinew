import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const userCount = await prisma.user.count();

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Next.js + Prisma</h1>
      <p>Total users in database: {userCount}</p>
      <p>
        <a href="/api/users">View API: /api/users</a>
      </p>
    </main>
  );
}
