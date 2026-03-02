import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type MetricBlockProps = {
  value: string;
  label: string;
  context: string;
};

export function MetricBlock({ value, label, context }: MetricBlockProps) {
  return (
    <Card variant="metric" padding="md">
      <CardHeader className="space-y-4">
        <p className="text-[2.15rem] font-semibold leading-none tracking-tight text-impact-green md:text-[2.35rem]">{value}</p>
        <CardTitle className="text-[1.9rem] leading-[1.16] md:text-[2rem]">{label}</CardTitle>
        <CardDescription className="text-base leading-7 text-muted-text/90">{context}</CardDescription>
      </CardHeader>
    </Card>
  );
}
