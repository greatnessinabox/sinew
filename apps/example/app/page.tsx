import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight">Sinew Example App</h1>
        <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
          A kitchen sink demo showcasing integrated patterns: Auth, Database, API validation, and
          more.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/api/auth/signout"
                className="rounded-lg border border-gray-300 px-6 py-3 font-medium transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
              >
                Sign Out
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                Sign In
              </Link>
              <Link
                href="/api/posts"
                className="rounded-lg border border-gray-300 px-6 py-3 font-medium transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
              >
                View API
              </Link>
            </>
          )}
        </div>

        {session && (
          <div className="mt-8 rounded-lg border border-gray-200 p-4 text-left dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">Signed in as:</p>
            <p className="font-medium">{session.user?.name || session.user?.email}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Role: <span className="font-mono">{session.user?.role}</span>
            </p>
          </div>
        )}

        <div className="mt-12 grid gap-4 text-left sm:grid-cols-2">
          <FeatureCard
            title="🔐 Authentication"
            description="NextAuth.js with GitHub/Google OAuth, role-based access control"
          />
          <FeatureCard
            title="🗄️ Database"
            description="Prisma ORM with PostgreSQL, connection pooling, seeding"
          />
          <FeatureCard
            title="🛡️ API Validation"
            description="Zod schemas for request/response validation"
          />
          <FeatureCard
            title="🌍 Type-Safe Env"
            description="Validated environment variables with @t3-oss/env"
          />
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
      <h3 className="mb-1 font-semibold">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}
