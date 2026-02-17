import type { ArchitectureDiagram } from "@/lib/case-studies";

type ArchitectureDiagramProps = {
  diagram: ArchitectureDiagram;
};

export function ArchitectureDiagram({ diagram }: ArchitectureDiagramProps) {
  return (
    <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950/80 p-4">
      <p className="mono-label">{diagram.title}</p>
      <ul className="mt-3 space-y-3">
        {diagram.layers.map((layer) => (
          <li key={layer.name} className="rounded-md border border-slate-800 bg-slate-900/50 p-3">
            <p className="font-mono text-sm text-systems-teal">{layer.name}</p>
            <p className="mt-1 body-md">{layer.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
