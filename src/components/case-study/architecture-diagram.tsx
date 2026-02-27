import type { ArchitectureDiagram } from "@/lib/case-studies";

type ArchitectureDiagramProps = {
  diagram: ArchitectureDiagram;
};

export function ArchitectureDiagram({ diagram }: ArchitectureDiagramProps) {
  return (
    <div className="mt-4 rounded-lg border border-border bg-card/90 p-4">
      <p className="mono-label">{diagram.title}</p>
      <ul className="mt-3 space-y-3">
        {diagram.layers.map((layer) => (
          <li key={layer.name} className="rounded-md border border-border bg-background/50 p-3">
            <p className="font-mono text-sm text-accent">{layer.name}</p>
            <p className="mt-1 body-md">{layer.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
