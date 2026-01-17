interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="border-border bg-surface/50 hover:border-accent/40 hover:bg-surface group relative rounded-xl border p-6 transition-all">
      <div className="bg-accent/10 text-accent mb-4 flex h-10 w-10 items-center justify-center rounded-lg">
        {icon}
      </div>
      <h3 className="text-foreground font-semibold">{title}</h3>
      <p className="text-muted mt-2 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

interface StepCardProps {
  number: number;
  command?: string;
  title: string;
  description: string;
}

export function StepCard({ number, command, title, description }: StepCardProps) {
  return (
    <div className="relative">
      <div className="flex items-start gap-4">
        <div className="bg-accent text-background flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
          {number}
        </div>
        <div className="flex-1">
          <h3 className="text-foreground font-semibold">{title}</h3>
          {command && (
            <code className="bg-code-bg text-foreground mt-2 block rounded-lg px-3 py-2 font-mono text-sm">
              {command}
            </code>
          )}
          <p className="text-muted mt-2 text-sm">{description}</p>
        </div>
      </div>
    </div>
  );
}
