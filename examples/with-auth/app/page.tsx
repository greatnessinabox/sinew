import { auth, signIn, signOut } from "@/lib/auth";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>Next.js + Auth</h1>

      {session?.user ? (
        <div>
          <p>Signed in as {session.user.email}</p>
          <p>
            <Link href="/dashboard">Go to Dashboard</Link>
          </p>
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button type="submit">Sign out</button>
          </form>
        </div>
      ) : (
        <form
          action={async () => {
            "use server";
            await signIn("github");
          }}
        >
          <button type="submit">Sign in with GitHub</button>
        </form>
      )}
    </main>
  );
}
