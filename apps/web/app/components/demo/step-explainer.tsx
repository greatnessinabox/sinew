"use client";

import type { ExecutionStep } from "@/app/lib/demo/types";
import { useEffect, useState } from "react";

interface StepExplainerProps {
  steps: ExecutionStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  isAnimating: boolean;
  completedActions?: number;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}

export function StepExplainer({
  steps,
  currentStep,
  onStepChange,
  isAnimating,
  completedActions = 0,
}: StepExplainerProps) {
  const step = steps[currentStep];
  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const progressPercent = steps.length > 0 ? Math.round((completedSteps / steps.length) * 100) : 0;
  const allCompleted = completedSteps === steps.length && steps.length > 0;

  // Animate progress bar
  const [animatedProgress, setAnimatedProgress] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progressPercent), 100);
    return () => clearTimeout(timer);
  }, [progressPercent]);

  // Show initial state when no actions taken
  if (completedActions === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="bg-accent/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <SparkleIcon className="text-accent h-8 w-8" />
        </div>
        <h3 className="text-foreground text-lg font-semibold">Ready to explore</h3>
        <p className="text-muted mt-2 max-w-sm text-sm">
          Click an action above to start. Each action will guide you through the code execution
          step-by-step.
        </p>

        {/* Preview steps */}
        <div className="mt-6 w-full max-w-md">
          <p className="text-muted mb-3 text-xs font-medium tracking-wider uppercase">
            What you&apos;ll learn
          </p>
          <div className="space-y-2">
            {steps.slice(0, 3).map((s, idx) => (
              <div
                key={s.id}
                className="bg-surface border-border flex items-center gap-3 rounded-lg border px-4 py-2.5 text-left"
              >
                <span className="text-muted bg-border/50 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                  {idx + 1}
                </span>
                <span className="text-foreground text-sm">{s.title}</span>
              </div>
            ))}
            {steps.length > 3 && (
              <p className="text-muted text-xs">+ {steps.length - 3} more steps</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!step) {
    return (
      <div className="text-muted p-4 text-center">
        <p>Execute an action to see the step-by-step explanation.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Progress Header */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-muted text-sm font-medium">Progress</span>
          <span className="text-foreground text-sm font-semibold">
            {completedSteps}/{steps.length} steps
          </span>
        </div>
        <div className="bg-border/50 h-2 overflow-hidden rounded-full">
          <div
            className="from-accent h-full rounded-full bg-gradient-to-r to-green-500 transition-all duration-500 ease-out"
            style={{ width: `${animatedProgress}%` }}
          />
        </div>
        {allCompleted && (
          <div className="mt-2 flex items-center justify-center gap-2 text-green-400">
            <CheckIcon className="h-4 w-4" />
            <span className="text-sm font-medium">All steps completed!</span>
          </div>
        )}
      </div>

      {/* Step Progress Indicators */}
      <div className="mb-4 flex items-center justify-center gap-2">
        {steps.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => !isAnimating && onStepChange(idx)}
            disabled={isAnimating}
            className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 ${
              s.status === "completed"
                ? "scale-100 border-green-500 bg-green-500 text-white"
                : s.status === "running"
                  ? "border-accent text-accent animate-pulse"
                  : idx === currentStep
                    ? "border-accent text-accent"
                    : "border-border text-muted hover:border-muted"
            } ${!isAnimating ? "cursor-pointer" : "cursor-default"}`}
            title={s.title}
          >
            {s.status === "completed" ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <span className="text-sm font-medium">{idx + 1}</span>
            )}
            {s.status === "running" && (
              <span className="bg-accent absolute -top-0.5 -right-0.5 h-2 w-2 animate-ping rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Current Step Content */}
      <div
        className={`bg-surface border-border flex-1 overflow-auto rounded-lg border p-4 transition-all duration-300 sm:p-6 ${
          step.status === "completed"
            ? "border-green-500/30 bg-green-500/5"
            : step.status === "running"
              ? "border-accent/30 bg-accent/5"
              : ""
        }`}
      >
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              step.status === "completed"
                ? "bg-green-500/10 text-green-400"
                : step.status === "running"
                  ? "bg-accent/10 text-accent"
                  : "bg-accent/10 text-accent"
            }`}
          >
            Step {currentStep + 1} of {steps.length}
          </span>
          {step.status === "completed" && (
            <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
              <CheckIcon className="h-3 w-3" />
              Done
            </span>
          )}
          {step.status === "running" && (
            <span className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
              Running
            </span>
          )}
        </div>

        <h3 className="text-foreground mt-3 text-lg font-semibold">{step.title}</h3>
        <p className="text-muted mt-1 text-sm sm:text-base">{step.description}</p>

        {/* Explanation */}
        <div className="bg-code-bg mt-4 rounded-lg p-3 sm:p-4">
          <p className="text-muted text-sm leading-relaxed">{step.explanation}</p>
        </div>

        {/* Code Lines Reference */}
        {step.codeLines && (
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="text-muted/60">📍</span>
            <span className="text-accent font-mono">Lines {step.codeLines}</span>
            <span className="text-muted/60">highlighted in the code panel</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-4 flex justify-between">
        <button
          onClick={() => onStepChange(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0 || isAnimating}
          className="text-muted hover:text-foreground flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors disabled:opacity-40"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Previous
        </button>
        <button
          onClick={() => onStepChange(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1 || isAnimating}
          className="bg-accent hover:bg-accent-dark flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-40"
        >
          Next
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
