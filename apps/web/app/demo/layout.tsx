import { Header } from "@/app/components/header";
import { FiberPatternStatic, FiberCorner } from "@/app/components/fiber-pattern";

export const metadata = {
  title: "Interactive Playground | Sinew",
  description:
    "Experience Sinew patterns in action. Interactive demos with real-time visualization and step-by-step explanations.",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      {/* Background fibers */}
      <FiberPatternStatic opacity={0.04} />
      <FiberCorner position="top-right" className="opacity-30" />

      <Header />

      <main id="main-content" className="relative z-10" role="main">
        {children}
      </main>
    </div>
  );
}
