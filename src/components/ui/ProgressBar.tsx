import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  color?: string;
  showLabel?: boolean;
}

export default function ProgressBar({ value, max = 100, className, color = "bg-blue-500", showLabel = false }: ProgressBarProps) {
  const percent = Math.min(Math.round((value / max) * 100), 100);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-300", color)} style={{ width: `${percent}%` }} />
        </div>
        {showLabel && <span className="text-xs font-medium text-gray-600 tabular-nums">{percent}%</span>}
      </div>
    </div>
  );
}
