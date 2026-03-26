import { getStepLabel, getStepColor, STEPS } from "@/lib/flowConfig";
import { cn } from "@/lib/utils";
import { Check, Clock } from "lucide-react";

export default function DemandTimeline({ stepsFlow, currentStepIndex }) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {stepsFlow.map((step, i) => {
        const done = i < currentStepIndex;
        const active = i === currentStepIndex;
        const color = getStepColor(step);
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center min-w-[56px]">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2",
                done ? "bg-emerald-500 border-emerald-500" :
                active ? `${color} border-transparent` :
                "bg-muted border-border text-muted-foreground"
              )}>
                {done ? <Check className="w-3 h-3" /> : active ? <Clock className="w-3 h-3" /> : i + 1}
              </div>
              <span className={cn(
                "text-[9px] mt-0.5 text-center leading-tight",
                active ? "text-foreground font-semibold" : "text-muted-foreground"
              )}>
                {getStepLabel(step)}
              </span>
            </div>
            {i < stepsFlow.length - 1 && (
              <div className={cn("h-0.5 w-4 mx-0.5 -mt-3", done ? "bg-emerald-400" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}