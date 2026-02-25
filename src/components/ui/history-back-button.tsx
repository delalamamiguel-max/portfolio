import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type HistoryBackButtonProps = {
  fallbackTo: string;
  label?: string;
  className?: string;
};

export function HistoryBackButton({
  fallbackTo,
  label = "Back",
  className,
}: HistoryBackButtonProps) {
  const navigate = useNavigate();

  const onBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallbackTo);
  };

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={onBack}
      className={cn("w-fit", className)}
      aria-label={`${label} (uses browser history, falls back to ${fallbackTo})`}
    >
      {label}
    </Button>
  );
}
