"use client"

import { Check, Circle, Loader2 } from "lucide-react"

export type WorkflowStep = 
  | "captcha"
  | "request"
  | "validation"
  | "orchestration"
  | "ready"
  | "download"

interface WorkflowStepsProps {
  currentStep: WorkflowStep
  completedSteps: WorkflowStep[]
}

const steps: { id: WorkflowStep; label: string; description: string }[] = [
  { id: "captcha", label: "Verification", description: "Confirm you are human" },
  { id: "request", label: "Request", description: "Describe your image" },
  { id: "validation", label: "Validation", description: "Check configuration" },
  { id: "orchestration", label: "Building", description: "Automated pipeline" },
  { id: "ready", label: "Ready", description: "Image complete" },
  { id: "download", label: "Download", description: "Get your image" },
]

export function WorkflowSteps({ currentStep, completedSteps }: WorkflowStepsProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep)

  return (
    <div className="flex items-center justify-center gap-1 py-3 px-4 bg-muted/50 border-b border-border overflow-x-auto">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id)
        const isCurrent = step.id === currentStep
        const isPending = !isCompleted && !isCurrent

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                    ? "bg-primary/20 text-primary border-2 border-primary"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-6 h-0.5 mx-1 ${
                  index < currentIndex ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
