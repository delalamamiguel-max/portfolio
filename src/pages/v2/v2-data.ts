export type V2CaseStudy = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  sections: Array<{ heading: string; body: string }>;
};

export const v2CaseStudies: V2CaseStudy[] = [
  {
    slug: "experimentation-platform",
    title: "Experimentation Platform",
    summary: "Scaled experimentation rigor to increase decision velocity across product teams.",
    tags: ["experimentation", "systems", "execution"],
    sections: [
      { heading: "Strategic Context", body: "Decision quality slowed because experimentation patterns were inconsistent across teams." },
      { heading: "Architecture", body: "Unified event taxonomy, guardrail metrics, and shared reporting surfaces for executive review." },
      { heading: "Execution", body: "Rolled out in phases with governance checkpoints and adoption scorecards." },
      { heading: "Impact", body: "Cycle time dropped and experiment confidence improved." },
    ],
  },
  {
    slug: "ml-modernization",
    title: "ML Modernization",
    summary: "Modernized recommendation architecture for measurable business efficiency.",
    tags: ["ml", "platform", "governance"],
    sections: [
      { heading: "Strategic Context", body: "Legacy scoring pipelines created latency and reliability risk." },
      { heading: "Trade-offs", body: "Prioritized reliability and observability over model complexity in phase one." },
      { heading: "Execution", body: "Introduced staged rollout gates and rollback guardrails." },
      { heading: "Impact", body: "Improved stability and reduced operating overhead." },
    ],
  },
];

export const v2Essays = [
  {
    slug: "strategy-through-constraints",
    title: "Strategy Through Constraints",
    summary: "Constraints reveal sequencing decisions faster than broad ideation alone.",
    tags: ["strategy"],
  },
  {
    slug: "governance-without-friction",
    title: "Governance Without Friction",
    summary: "Governance should accelerate decisions by clarifying boundaries early.",
    tags: ["governance", "execution"],
  },
];

export const v2Resume = {
  profile: "Senior product leader focused on platform strategy, data systems, and measurable execution.",
  downloadUrl: "/resume.pdf",
  experience: [
    {
      role: "Senior Product Leader",
      company: "Enterprise Platform",
      timeline: "Recent",
      highlights: [
        "Defined platform strategy tied to business outcomes.",
        "Built cross-functional operating model for delivery.",
        "Reduced friction between governance and execution.",
      ],
      metrics: ["+12% engagement", "$8M+ OPEX reduction"],
      tags: ["strategy", "platform", "execution"],
    },
    {
      role: "Product Leadership",
      company: "Data & Growth Systems",
      timeline: "Prior",
      highlights: [
        "Scaled experimentation framework across teams.",
        "Established decision cadence with clear scorecards.",
        "Improved roadmap confidence with measurable signals.",
      ],
      metrics: ["3x decision velocity"],
      tags: ["experimentation", "data", "leadership"],
    },
  ],
};
