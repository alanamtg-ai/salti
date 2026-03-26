import { getStepLabel, getStepLight } from "@/lib/flowConfig";
import { cn } from "@/lib/utils";

export default function DemandFlowBadge({ step }) {
  return (
    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", getStepLight(step))}>
      {getStepLabel(step)}
    </span>
  );
}