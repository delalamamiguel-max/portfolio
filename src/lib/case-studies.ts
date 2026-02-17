export type CaseStudySection = {
  id: "strategic-context" | "architecture" | "trade-offs" | "execution-model" | "impact" | "whats-next";
  label: "Strategic Context" | "Architecture" | "Trade-offs" | "Execution Model" | "Impact" | "What's Next";
  content: string;
};

export type ArchitectureDiagram = {
  title: string;
  layers: { name: string; description: string }[];
};

export type CaseStudy = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  sections: CaseStudySection[];
  architectureDiagram?: ArchitectureDiagram;
};

const caseStudies: CaseStudy[] = [
  {
    slug: "ml-modernization",
    title: "ML Modernization",
    summary: "Placeholder executive narrative for modernizing legacy recommendation systems with measurable outcomes.",
    tags: ["ml", "platform", "governance"],
    architectureDiagram: {
      title: "System Architecture (Placeholder)",
      layers: [
        { name: "Data Ingestion", description: "Batch and streaming events normalized into governed feature pipelines." },
        { name: "Model Platform", description: "Versioned training and deployment workflows with rollback controls." },
        { name: "Decision Layer", description: "Low-latency scoring integrated with experimentation and observability." },
      ],
    },
    sections: [
      {
        id: "strategic-context",
        label: "Strategic Context",
        content: "Placeholder: business problem, operating constraints, and strategic objective framing.",
      },
      {
        id: "architecture",
        label: "Architecture",
        content: "Placeholder: platform topology, ownership boundaries, and lifecycle decisions.",
      },
      {
        id: "trade-offs",
        label: "Trade-offs",
        content: "Placeholder: explicit trade-offs between speed, risk, model quality, and governance.",
      },
      {
        id: "execution-model",
        label: "Execution Model",
        content: "Placeholder: cross-functional cadence, decision gates, and delivery plan.",
      },
      {
        id: "impact",
        label: "Impact",
        content: "Placeholder: measurable outcome summary tied to business and platform metrics.",
      },
      {
        id: "whats-next",
        label: "What's Next",
        content: "Placeholder: next evolution stage and what would be optimized in a follow-on phase.",
      },
    ],
  },
  {
    slug: "experimentation-platform",
    title: "Experimentation Platform",
    summary: "Placeholder executive narrative for scaling experimentation rigor across product surfaces.",
    tags: ["experimentation", "systems", "execution"],
    architectureDiagram: {
      title: "Experimentation Stack (Placeholder)",
      layers: [
        { name: "Instrumentation", description: "Unified event contracts and data quality guardrails across clients." },
        { name: "Experiment Engine", description: "Allocation, targeting, and holdout logic with governance controls." },
        { name: "Analysis Plane", description: "Decision-ready readouts for product, engineering, and leadership." },
      ],
    },
    sections: [
      {
        id: "strategic-context",
        label: "Strategic Context",
        content: "Placeholder: why experimentation maturity was critical to product and platform strategy.",
      },
      {
        id: "architecture",
        label: "Architecture",
        content: "Placeholder: system boundaries, instrumentation strategy, and control points.",
      },
      {
        id: "trade-offs",
        label: "Trade-offs",
        content: "Placeholder: speed vs statistical rigor, and local autonomy vs global standards.",
      },
      {
        id: "execution-model",
        label: "Execution Model",
        content: "Placeholder: operating model, staffing approach, and release governance.",
      },
      {
        id: "impact",
        label: "Impact",
        content: "Placeholder: business and behavioral metrics impacted by experimentation quality.",
      },
      {
        id: "whats-next",
        label: "What's Next",
        content: "Placeholder: next capability investments for experimentation at enterprise scale.",
      },
    ],
  },
];

export function getCaseStudies(): CaseStudy[] {
  return caseStudies;
}

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return caseStudies.find((study) => study.slug === slug);
}
