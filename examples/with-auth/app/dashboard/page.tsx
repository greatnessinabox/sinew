import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function Dashboard() {
  const session = await auth();

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Dashboard</h1>
      <p>Welcome, {session?.user?.name || session?.user?.email}!</p>
      <p>This page is protected by middleware.</p>
      <p>
        <Link href="/">← Back to home</Link>
      </p>
    </main>
  );
}
