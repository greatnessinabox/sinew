import Link from "next/link";
import { auth } from "@/lib/auth";
import { PLANS } from "@/lib/stripe";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="text-xl font-bold">SaaS Starter</span>
          <div className="flex items-center gap-4">
            {session ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight">Build Your SaaS Faster</h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          A production-ready starter with auth, payments, email, and more. Built with Sinew
          patterns.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-black px-6 py-3 font-medium text-white dark:bg-white dark:text-black"
        >
          Get Started Free
        </Link>

        {/* Pricing */}
        <section className="mt-20">
          <h2 className="mb-8 text-3xl font-bold">Pricing</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {Object.entries(PLANS).map(([key, plan]) => (
              <div key={key} className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
                <h3 className="mb-2 text-xl font-semibold">{plan.name}</h3>
                <p className="mb-4 text-3xl font-bold">
                  ${plan.price}
                  <span className="text-sm font-normal text-gray-500">/mo</span>
                </p>
                <ul className="mb-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {plan.features.map((feature) => (
                    <li key={feature}>✓ {feature}</li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className="block w-full rounded-lg border border-gray-300 py-2 text-center font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
