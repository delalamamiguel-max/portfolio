import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type MetricBlockProps = {
  value: string;
  label: string;
  context: string;
};

function splitIntoTwoLines(input: string, maxChars: number): [string, string] {
  const normalized = input.replace(/\s+/g, " ").trim();
  if (!normalized) return ["", ""];

  const trimmed =
    normalized.length > maxChars
      ? `${normalized.slice(0, Math.max(0, maxChars - 1)).replace(/\s+\S*$/, "").trim()}…`
      : normalized;

  const words = trimmed.split(" ");
  if (words.length <= 1) return [trimmed, ""];

  let bestIndex = 1;
  let bestDiff = Number.POSITIVE_INFINITY;

  for (let i = 1; i < words.length; i += 1) {
    const first = words.slice(0, i).join(" ");
    const second = words.slice(i).join(" ");
    const diff = Math.abs(first.length - second.length);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIndex = i;
    }
  }

  return [words.slice(0, bestIndex).join(" "), words.slice(bestIndex).join(" ")];
}

export function MetricBlock({ value, label, context }: MetricBlockProps) {
  const supportText = (context?.trim() || label).trim();
  const [metricLineOne, metricLineTwo] = splitIntoTwoLines(value, 44);
  const [supportLineOne, supportLineTwo] = splitIntoTwoLines(supportText, 90);

  return (
    <Card variant="metric" padding="md" className="h-full min-h-[252px]">
      <CardHeader className="grid h-full grid-rows-[auto_auto] content-start gap-4">
        <CardTitle className="text-[2.05rem] font-semibold leading-[1.14] tracking-tight text-impact-green md:text-[2.2rem]">
          <span className="metric-two-line">
            <span>{metricLineOne}</span>
            <span>{metricLineTwo || "\u00A0"}</span>
          </span>
        </CardTitle>
        <CardDescription className="text-[1.1rem] font-semibold leading-[1.4] text-primary-text/95">
          <span className="metric-two-line">
            <span>{supportLineOne}</span>
            <span>{supportLineTwo || "\u00A0"}</span>
          </span>
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
