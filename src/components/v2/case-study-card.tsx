import { Link } from "react-router-dom";

type CaseStudyCardProps = {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
};

export function CaseStudyCard({ slug, title, summary, tags }: CaseStudyCardProps) {
  return (
    <article className="v2-case-study-card v2-stack-16">
      <h3 className="v2-h3">{title}</h3>
      <p className="v2-body">{summary}</p>
      <div className="v2-tags">
        {tags.slice(0, 4).map((tag) => (
          <span key={`${slug}-${tag}`} className="v2-chip">
            {tag}
          </span>
        ))}
      </div>
      <p>
        <Link to={`/v2/case-studies/${slug}`}>Open case study</Link>
      </p>
    </article>
  );
}
