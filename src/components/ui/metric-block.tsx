import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type MetricBlockProps = {
  value: string;
  label: string;
  context: string;
};

export function MetricBlock({ value, label, context }: MetricBlockProps) {
  return (
    <Card variant="metric" padding="md">
      <CardHeader className="space-y-3">
        <p className="text-3xl font-semibold text-impact-green">{value}</p>
        <CardTitle className="text-xl">{label}</CardTitle>
        <CardDescription>{context}</CardDescription>
      </CardHeader>
    </Card>
  );
}
