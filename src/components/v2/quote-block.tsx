type QuoteBlockProps = {
  quote: string;
  byline?: string;
};

export function QuoteBlock({ quote, byline }: QuoteBlockProps) {
  return (
    <blockquote className="v2-quote v2-stack-8">
      <p className="v2-body">{quote}</p>
      {byline ? <footer className="v2-caption">{byline}</footer> : null}
    </blockquote>
  );
}
