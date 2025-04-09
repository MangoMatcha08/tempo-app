
import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

export interface StepProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  isCompleted?: boolean;
  isActive?: boolean;
}

interface StepsProps {
  steps: StepProps[];
  activeStep: number;
  orientation?: "vertical" | "horizontal";
  className?: string;
}

const Step = ({
  title,
  description,
  icon,
  isCompleted,
  isActive
}: StepProps) => {
  return (
    <div className={cn("flex items-center gap-2", isCompleted ? "text-primary" : isActive ? "text-foreground" : "text-muted-foreground")}>
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-center",
        isCompleted ? "border-primary bg-primary text-primary-foreground" : 
        isActive ? "border-primary text-primary" : 
        "border-muted bg-background"
      )}>
        {isCompleted ? (
          <CheckIcon className="h-4 w-4" />
        ) : (
          icon || <span className="text-sm font-medium">{title.charAt(0)}</span>
        )}
      </div>
      <div className="flex flex-col">
        <div className={cn("text-sm font-medium", 
          isCompleted ? "text-primary" : 
          isActive ? "text-foreground" : 
          "text-muted-foreground"
        )}>
          {title}
        </div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </div>
    </div>
  );
};

export const Steps = ({
  steps,
  activeStep,
  orientation = "vertical",
  className
}: StepsProps) => {
  return (
    <div className={cn(
      "flex gap-2",
      orientation === "vertical" ? "flex-col" : "flex-row items-center justify-between",
      className
    )}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <Step
            {...step}
            isActive={index === activeStep}
            isCompleted={index < activeStep}
          />
          {index < steps.length - 1 && (
            <div
              className={cn(
                orientation === "vertical" 
                  ? "ms-4 h-8 w-px bg-border" 
                  : "h-px w-full bg-border"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
