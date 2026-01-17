import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { redirect } from "next/navigation";

type PostSummary = {
  id: string;
  title: string;
  published: boolean;
  createdAt: Date;
};

type RecentPost = {
  id: string;
  title: string;
  createdAt: Date;
  author: {
    name: string | null;
  };
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const posts: PostSummary[] = await prisma.post.findMany({
    where: { authorId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const allPosts: RecentPost[] = await prisma.post.findMany({
    where: { published: true },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold">
            Sinew Example
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {session.user.name || session.user.email}
            </span>
            {session.user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="rounded-md bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
              >
                Admin
              </Link>
            )}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {session.user.name?.split(" ")[0] || "there"}!
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Your Posts */}
          <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Posts</h2>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium dark:bg-gray-800">
                {posts.length}
              </span>
            </div>
            {posts.length > 0 ? (
              <ul className="space-y-3">
                {posts.map((post) => (
                  <li
                    key={post.id}
                    className="flex items-center justify-between rounded-md border border-gray-100 p-3 dark:border-gray-800"
                  >
                    <div>
                      <p className="font-medium">{post.title}</p>
                      <p className="text-sm text-gray-500">{post.createdAt.toLocaleDateString()}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        post.published
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                      }`}
                    >
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                You haven&apos;t created any posts yet.
              </p>
            )}
          </section>

          {/* Recent Posts */}
          <section className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-xl font-semibold">Recent Posts</h2>
            {allPosts.length > 0 ? (
              <ul className="space-y-3">
                {allPosts.map((post) => (
                  <li
                    key={post.id}
                    className="rounded-md border border-gray-100 p-3 dark:border-gray-800"
                  >
                    <p className="font-medium">{post.title}</p>
                    <p className="text-sm text-gray-500">
                      by {post.author.name} · {post.createdAt.toLocaleDateString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No posts yet.</p>
            )}
          </section>
        </div>

        {/* API Example */}
        <section className="mt-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-xl font-semibold">API Endpoints</h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">Test the validated API endpoints:</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/api/posts"
              className="rounded-md bg-gray-100 px-3 py-2 font-mono text-sm hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              GET /api/posts
            </Link>
            <Link
              href="/api/health"
              className="rounded-md bg-gray-100 px-3 py-2 font-mono text-sm hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              GET /api/health
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
