type HeadingBlockProps = {
  eyebrow?: string;
  title: string;
  subtext?: string;
  level?: 1 | 2;
  className?: string;
};

export function HeadingBlock({ eyebrow, title, subtext, level = 2, className }: HeadingBlockProps) {
  const Tag = level === 1 ? "h1" : "h2";

  return (
    <header className={["v2-stack-16", className].filter(Boolean).join(" ")}>
      {eyebrow ? <p className="v2-eyebrow">{eyebrow}</p> : null}
      <Tag className={level === 1 ? "v2-h1" : "v2-h2"}>{title}</Tag>
      {subtext ? <p className="v2-body v2-text-column">{subtext}</p> : null}
    </header>
  );
}
