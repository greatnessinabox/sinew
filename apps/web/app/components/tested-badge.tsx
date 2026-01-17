interface TestedBadgeProps {
  node?: string;
  nextjs?: string;
  typescript?: string;
  react?: string;
}

export function TestedBadge({
  node = "20",
  nextjs = "16",
  typescript = "5.9",
  react = "19",
}: TestedBadgeProps) {
  return (
    <div className="text-muted inline-flex items-center gap-3 font-mono text-[11px]">
      <span className="flex items-center gap-1.5">
        <span className="bg-success h-1.5 w-1.5 rounded-full" />
        Tested on
      </span>
      <span className="bg-surface border-border flex items-center gap-2 rounded border px-2 py-1">
        <Badge icon="⬢" label="Node" value={node} />
        <Divider />
        <Badge icon="▲" label="Next.js" value={nextjs} />
        <Divider />
        <Badge icon="⚛" label="React" value={react} />
        <Divider />
        <Badge icon="TS" label="TypeScript" value={typescript} />
      </span>
    </div>
  );
}

function Badge({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <span className="flex items-center gap-1" title={`${label} ${value}`}>
      <span className="opacity-60">{icon}</span>
      <span className="text-foreground/80">{value}</span>
    </span>
  );
}

function Divider() {
  return <span className="bg-border h-3 w-px" />;
}
