import Link from "next/link";
import Image from "next/image";
import {
  FiberPattern,
  FiberPatternStatic,
  FiberAccent,
  FiberCorner,
} from "./components/fiber-pattern";
import { FeatureCard, StepCard } from "./components/feature-card";
import { Header } from "./components/header";
import { TerminalHero } from "./components/terminal-hero";
import { TestedBadge } from "./components/tested-badge";
import { getPatternGroups, getTotalPatternCount, getFeaturedPatterns } from "./lib/patterns";

const patternGroups = getPatternGroups();
const totalPatterns = getTotalPatternCount();
const featuredPatterns = getFeaturedPatterns();

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />

      <main id="main-content" role="main">
        {/* Hero */}
        <section
          className="relative flex items-center overflow-hidden pt-20"
          aria-labelledby="hero-heading"
        >
          <FiberPattern opacity={0.15} animated density="normal" />
          <FiberCorner position="top-right" className="opacity-60" />
          <FiberCorner position="bottom-left" className="opacity-40" />
          <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 lg:py-20">
            <div className="grid items-center gap-8 lg:grid-cols-[1.2fr,1fr] lg:gap-12">
              {/* Text content */}
              <div>
                <h1
                  id="hero-heading"
                  className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl"
                >
                  The connective tissue
                  <br />
                  <span className="text-accent">that makes apps work.</span>
                </h1>
                <p className="text-muted mt-6 text-lg leading-relaxed lg:mt-8 lg:text-xl">
                  Infrastructure patterns for databases, auth, deployment, and all the other stuff
                  that&apos;s hard to get right.{" "}
                  <span className="text-foreground font-medium">Copy. Paste. Ship.</span>
                </p>

                {/* Stats */}
                <div className="mt-6 flex flex-wrap items-center gap-4 text-sm lg:mt-8 lg:gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-accent text-xl font-bold lg:text-2xl">
                      {totalPatterns}
                    </span>
                    <span className="text-muted">patterns</span>
                  </div>
                  <div className="bg-border h-5 w-px lg:h-6" />
                  <div className="flex items-center gap-2">
                    <span className="text-accent text-xl font-bold lg:text-2xl">
                      {patternGroups.length}
                    </span>
                    <span className="text-muted">categories</span>
                  </div>
                  <div className="bg-border h-5 w-px lg:h-6" />
                  <div className="flex items-center gap-2">
                    <span className="text-accent font-medium">Open Source</span>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3 lg:gap-4">
                  <Link
                    href="/patterns"
                    className="bg-accent hover:bg-accent-secondary group inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-medium text-white transition-colors lg:px-6 lg:py-3"
                  >
                    Browse patterns
                    <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <a
                    href="https://github.com/greatnessinabox/sinew"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-border hover:bg-surface inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 font-medium transition-colors lg:px-6 lg:py-3"
                  >
                    <GitHubIcon className="h-5 w-5" />
                    View source
                  </a>
                </div>

                {/* Tested badge - hidden on mobile to save space */}
                <div className="mt-6 hidden sm:block lg:mt-8">
                  <TestedBadge />
                </div>
              </div>

              {/* Interactive terminal - always visible, stacked on mobile */}
              <div className="mt-8 lg:mt-0">
                <TerminalHero />
              </div>
            </div>
          </div>

          {/* Gradient fade at bottom */}
          <div className="from-background absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t to-transparent" />
        </section>

        {/* Why Sinew */}
        <section className="border-border relative z-10 border-t">
          <FiberAccent className="absolute left-0 right-0 top-0" />
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold">Why Sinew?</h2>
              <p className="text-muted mx-auto mt-4 max-w-2xl">
                Stop copy-pasting from old projects or chasing tutorials. Get production-ready code
                that you own.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<PackageIcon className="h-5 w-5" />}
                title="No Dependencies"
                description="You own the code. No packages to update, no breaking changes to chase. Just copy and customize."
              />
              <FeatureCard
                icon={<ShieldIcon className="h-5 w-5" />}
                title="Production-Ready"
                description="Battle-tested patterns from real applications. Not toy examples—code you can actually ship."
              />
              <FeatureCard
                icon={<LayersIcon className="h-5 w-5" />}
                title="Framework-Aware"
                description="Patterns tailored for Next.js, Remix, SvelteKit, and more. Not generic—optimized for your stack."
              />
              <FeatureCard
                icon={<TypeIcon className="h-5 w-5" />}
                title="Type-Safe"
                description="Full TypeScript support with proper types. IDE autocompletion and type checking out of the box."
              />
              <FeatureCard
                icon={<TerminalIcon className="h-5 w-5" />}
                title="CLI + Web"
                description="Use the CLI for quick setup or browse the web and copy directly. Whatever fits your workflow."
              />
              <FeatureCard
                icon={<UsersIcon className="h-5 w-5" />}
                title="Community-Driven"
                description="Open source and accepting contributions. Help make these patterns even better."
              />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-border relative overflow-hidden border-t">
          <FiberPatternStatic opacity={0.05} />
          <div className="relative z-10 mx-auto max-w-6xl px-6 py-20">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold">Get started in seconds</h2>
              <p className="text-muted mt-4">Three commands. That&apos;s all it takes.</p>
            </div>

            <div className="mx-auto max-w-2xl space-y-8">
              <StepCard
                number={1}
                title="Initialize in your project"
                command="npx sinew init"
                description="Sets up your project configuration for Sinew patterns."
              />
              <div className="from-accent/40 ml-4 h-8 w-px bg-gradient-to-b to-transparent" />
              <StepCard
                number={2}
                title="Add the patterns you need"
                command="npx sinew add database/connection-pooling"
                description="Copies production-ready code directly into your project."
              />
              <div className="from-accent/40 ml-4 h-8 w-px bg-gradient-to-b to-transparent" />
              <StepCard
                number={3}
                title="Ship it"
                description="The code is yours. Customize it, extend it, or use it as-is. No lock-in, no dependencies."
              />
            </div>

            <div className="mt-12 text-center">
              <p className="text-muted text-sm">
                Or just browse{" "}
                <Link href="/patterns" className="text-accent hover:underline">
                  the patterns
                </Link>{" "}
                and copy what you need.
              </p>
            </div>
          </div>
        </section>

        {/* Featured Patterns */}
        <section className="border-border relative z-10 border-t">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="mb-12 flex items-baseline justify-between">
              <div>
                <h2 className="text-3xl font-bold">Popular Patterns</h2>
                <p className="text-muted mt-2">The most used patterns to get you started.</p>
              </div>
              <Link
                href="/patterns"
                className="text-accent hover:text-accent-secondary text-sm transition-colors"
              >
                View all {totalPatterns} patterns →
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPatterns.map((pattern) => (
                <FeaturedPatternCard
                  key={`${pattern.category}/${pattern.slug}`}
                  category={pattern.category}
                  slug={pattern.slug}
                  name={pattern.name}
                  description={pattern.description}
                  command={pattern.command}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="border-border relative overflow-hidden border-t">
          <FiberPatternStatic opacity={0.08} />
          <div className="relative z-10 mx-auto max-w-6xl px-6 py-20">
            <div className="mb-12 flex items-baseline justify-between">
              <div>
                <h2 className="text-3xl font-bold">All Categories</h2>
                <p className="text-muted mt-2">
                  Production-ready code for the hard parts of web development.
                </p>
              </div>
              <Link
                href="/patterns"
                className="text-accent hover:text-accent-secondary text-sm transition-colors"
              >
                Browse all →
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {patternGroups.map((group) => (
                <div
                  key={group.slug}
                  className="border-border bg-surface/50 hover:border-accent/40 hover:bg-surface/80 group relative rounded-xl border p-6 transition-all duration-300"
                >
                  {/* Fiber accent lines */}
                  <div className="via-accent/60 absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="to-accent/40 absolute -top-4 left-1/4 h-4 w-px bg-gradient-to-b from-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="to-accent/30 absolute -top-4 right-1/3 h-4 w-px bg-gradient-to-b from-transparent opacity-0 transition-opacity delay-75 group-hover:opacity-100" />

                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold">{group.category}</h3>
                    <span className="text-muted bg-surface rounded-full px-2 py-1 text-xs">
                      {group.count} {group.count === 1 ? "pattern" : "patterns"}
                    </span>
                  </div>
                  <p className="text-muted mt-1 text-sm">{group.description}</p>

                  <ul className="mt-6 space-y-3">
                    {group.items.map((item) => (
                      <li key={item.slug}>
                        {item.ready ? (
                          <Link
                            href={`/patterns/${group.slug}/${item.slug}`}
                            className="text-foreground hover:text-accent flex items-center gap-2 transition-colors"
                          >
                            <span className="bg-accent h-1.5 w-1.5 rounded-full" />
                            {item.name}
                          </Link>
                        ) : (
                          <span className="text-muted flex items-center gap-2">
                            <span className="bg-border h-1.5 w-1.5 rounded-full" />
                            {item.name}
                            <span className="text-muted/60 text-xs">(soon)</span>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA / Support */}
        <section className="border-border relative overflow-hidden border-t">
          <FiberPattern opacity={0.08} density="sparse" />
          <div className="relative z-10 mx-auto max-w-6xl px-6 py-20">
            <div className="text-center">
              <h2 className="text-2xl font-bold">Free. Open source. Forever.</h2>
              <p className="text-muted mx-auto mt-4 max-w-md">
                Sinew is MIT licensed and community-driven. Contributions welcome.
              </p>

              {/* Support buttons */}
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <a
                  href="https://github.com/greatnessinabox/sinew"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-border hover:bg-surface hover:border-muted inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors"
                >
                  <GitHubIcon className="h-4 w-4" />
                  Star on GitHub
                </a>
                <a
                  href="https://github.com/sponsors/greatnessinabox"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-accent/50 bg-accent/10 text-accent hover:bg-accent/20 hover:border-accent inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors"
                >
                  <HeartIcon className="h-4 w-4" />
                  Sponsor on GitHub
                </a>
                <a
                  href="https://ko-fi.com/marquiscodes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-border hover:bg-surface hover:border-muted inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors"
                >
                  <CoffeeIcon className="h-4 w-4" />
                  Buy me a coffee
                </a>
              </div>

              <p className="text-muted/60 mt-8 text-xs">
                Your support helps keep this project free and maintained.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-border border-t" role="contentinfo">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-col items-center gap-6">
            {/* Avatar and attribution */}
            <div className="flex items-center gap-3">
              <div className="border-accent/30 h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2">
                <Image
                  src="/avatar.jpeg"
                  alt="Marquis"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="text-muted text-sm">
                Built with care by{" "}
                <a
                  href="https://marquis.codes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-accent font-medium transition-colors"
                >
                  marquis.codes
                </a>
              </p>
            </div>

            {/* Links */}
            <div className="text-muted flex items-center gap-6 text-sm">
              <a
                href="https://github.com/greatnessinabox/sinew"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <GitHubIcon className="h-4 w-4" />
                GitHub
              </a>
              <a
                href="https://bsky.app/profile/greatnessinabox.bsky.social"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <BlueskyIcon className="h-4 w-4" />
                Bluesky
              </a>
              <a
                href="https://github.com/greatnessinabox/sinew/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Contributing
              </a>
            </div>

            {/* Fiber accent */}
            <div className="via-accent/40 h-px w-32 bg-gradient-to-r from-transparent to-transparent" />

            <p className="text-muted/50 text-xs">MIT License. Free forever.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeaturedPatternCard({
  category,
  slug,
  name,
  description,
  command,
}: {
  category: string;
  slug: string;
  name: string;
  description: string;
  command: string;
}) {
  return (
    <Link
      href={`/patterns/${category}/${slug}`}
      className="border-border bg-surface/50 hover:border-accent/40 hover:bg-surface group relative rounded-xl border p-5 transition-all"
    >
      <div className="absolute right-4 top-4">
        <span className="bg-accent block h-2 w-2 rounded-full" />
      </div>
      <h3 className="text-foreground group-hover:text-accent font-semibold transition-colors">
        {name}
      </h3>
      <p className="text-muted mt-2 text-sm leading-relaxed">{description}</p>
      <code className="text-muted/70 mt-3 block truncate font-mono text-xs">{command}</code>
    </Link>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14 5l7 7m0 0l-7 7m7-7H3"
      />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function CoffeeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zm4-4h8m-4 0v4"
      />
    </svg>
  );
}

function BlueskyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 568 501">
      <path d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.21C491.866-1.611 568-28.906 568 57.947c0 17.346-9.945 145.713-15.778 166.555-20.275 72.453-94.155 90.933-159.875 79.748C507.222 323.8 536.444 388.56 473.333 453.32c-119.86 122.992-172.272-30.859-185.702-70.281-2.462-7.227-3.614-10.608-3.631-7.733-.017-2.875-1.169.506-3.631 7.733-13.43 39.422-65.842 193.273-185.702 70.281-63.111-64.76-33.889-129.52 80.986-149.071-65.72 11.185-139.6-7.295-159.875-79.748C9.945 203.659 0 75.291 0 57.946 0-28.906 76.135-1.612 123.121 33.664Z" />
    </svg>
  );
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
      />
    </svg>
  );
}

function TypeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
      />
    </svg>
  );
}

function TerminalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}
