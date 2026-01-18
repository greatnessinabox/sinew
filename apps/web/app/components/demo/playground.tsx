"use client";

import type {
  CacheVisualizationData,
  EnvValidationData,
  ErrorVisualizationData,
  ExecutionStep,
  LogEntry,
  LogStreamData,
  PatternDemoConfig,
  RateLimitData,
  SessionVisualizationData,
  ValidationResult,
} from "@/app/lib/demo/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActionPanel } from "./action-panel";
import { DemoCodeBlock } from "./demo-code-block";
import { LogViewer } from "./log-viewer";
import { StepExplainer } from "./step-explainer";
import { CacheStateVisualization } from "./visualization/cache-state";
import { EnvValidationVisualization } from "./visualization/env-validation";
import { ErrorStackVisualization } from "./visualization/error-stack";
import { LogStreamVisualization } from "./visualization/log-stream";
import { RateLimitVisualization } from "./visualization/rate-limit";
import { SessionListVisualization } from "./visualization/session-list";
import { ValidationTreeVisualization } from "./visualization/validation-tree";

type VisualizationData =
  | CacheVisualizationData
  | RateLimitData
  | ErrorVisualizationData
  | EnvValidationData
  | SessionVisualizationData
  | LogStreamData
  | ValidationResult
  | null;

type OutputView = "steps" | "logs";

interface PlaygroundProps {
  demo: PatternDemoConfig;
}

function generateSessionId(): string {
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`animate-fade-in fixed right-4 bottom-4 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all ${
        type === "success"
          ? "border-green-500/30 bg-green-500/10 text-green-400"
          : "border-red-500/30 bg-red-500/10 text-red-400"
      }`}
    >
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="text-current opacity-60 hover:opacity-100">
        ×
      </button>
    </div>
  );
}

function MobileCodePanel({
  code,
  highlightedLines,
  visualization,
}: {
  code: string;
  highlightedLines?: string;
  visualization: React.ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-border border-t lg:hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-muted hover:text-foreground flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
          {isExpanded ? "Hide Code & Visualization" : "Show Code & Visualization"}
        </span>
        <svg
          className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-border border-t">
          <div className="max-h-64 overflow-auto p-4">
            <DemoCodeBlock code={code} language="typescript" highlightedLines={highlightedLines} />
          </div>
          {visualization && <div className="border-border border-t p-4">{visualization}</div>}
        </div>
      )}
    </div>
  );
}

export function Playground({ demo }: PlaygroundProps) {
  const [outputView, setOutputView] = useState<OutputView>("steps");
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [steps, setSteps] = useState<ExecutionStep[]>(demo.steps);
  const [isExecuting, setIsExecuting] = useState(false);
  const [sessionId] = useState(generateSessionId);
  const [highlightedLines, setHighlightedLines] = useState<string | undefined>(
    demo.steps[0]?.codeLines
  );
  const [visualizationData, setVisualizationData] = useState<VisualizationData>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [completedActions, setCompletedActions] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "1") {
        setOutputView("steps");
      } else if (e.key === "2") {
        setOutputView("logs");
      } else if (e.key === "ArrowLeft" && currentStep > 0) {
        setCurrentStep((s) => s - 1);
      } else if (e.key === "ArrowRight" && currentStep < steps.length - 1) {
        setCurrentStep((s) => s + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, steps.length]);

  // Update highlighted lines when step changes
  useEffect(() => {
    const step = steps[currentStep];
    if (step?.codeLines) {
      setHighlightedLines(step.codeLines);
    }
  }, [currentStep, steps]);

  const addLog = useCallback((log: Omit<LogEntry, "id" | "timestamp">) => {
    const entry: LogEntry = {
      ...log,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
    };
    setLogs((prev) => [...prev.slice(-99), entry]);
  }, []);

  const animateSteps = useCallback(
    (executionSteps: ExecutionStep[]) => {
      // Map execution steps to demo steps by matching id or title
      const matchStep = (execStep: ExecutionStep) => {
        return steps.findIndex((s) => s.id === execStep.id || s.title === execStep.title);
      };

      let execIndex = 0;

      const animate = () => {
        if (execIndex >= executionSteps.length) return;

        const execStep = executionSteps[execIndex];
        if (!execStep) return;

        const stepIndex = matchStep(execStep);
        const targetIndex = stepIndex >= 0 ? stepIndex : execIndex;

        setCurrentStep(targetIndex);
        setSteps((prev) =>
          prev.map((s, i) => ({
            ...s,
            status: i < targetIndex ? "completed" : i === targetIndex ? "running" : s.status,
          }))
        );

        if (execStep.codeLines) {
          setHighlightedLines(execStep.codeLines);
        }

        execIndex++;
        if (execIndex < executionSteps.length) {
          setTimeout(animate, 600);
        } else {
          // Mark current and previous as completed
          setTimeout(() => {
            setSteps((prev) =>
              prev.map((s, i) => ({
                ...s,
                status: i <= targetIndex ? "completed" : s.status,
              }))
            );
          }, 400);
        }
      };

      animate();
    },
    [steps]
  );

  const executeAction = useCallback(
    async (actionId: string, params?: Record<string, unknown>) => {
      setIsExecuting(true);

      addLog({
        level: "info",
        message: `Executing: ${actionId}`,
        data: params,
        source: "playground",
      });

      try {
        const response = await fetch("/api/demo/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: demo.category,
            slug: demo.slug,
            action: actionId,
            params,
            sessionId,
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Add logs from execution
          if (result.logs) {
            result.logs.forEach((log: LogEntry) => {
              setLogs((prev) => [...prev.slice(-99), log]);
            });
          }

          // Update visualization data (don't auto-switch tabs - let user explore)
          if (result.visualizationData) {
            setVisualizationData(result.visualizationData);
          }

          // Animate through steps if provided
          if (result.steps && result.steps.length > 0) {
            animateSteps(result.steps);
          }

          // Track completed actions for progress
          setCompletedActions((prev) => prev + 1);

          addLog({
            level: "info",
            message: `✓ ${actionId} completed`,
            data: { duration: result.duration },
            source: "playground",
          });

          // Show success toast
          setToast({ message: `Action completed in ${result.duration}ms`, type: "success" });
        } else {
          addLog({
            level: "error",
            message: result.error ?? "Action failed",
            source: "playground",
          });
        }
      } catch (error) {
        addLog({
          level: "error",
          message: error instanceof Error ? error.message : "Unknown error",
          source: "playground",
        });
      } finally {
        setIsExecuting(false);
      }
    },
    [demo.category, demo.slug, sessionId, addLog, animateSteps]
  );

  const renderVisualization = () => {
    if (!visualizationData) return null;

    const vizType = demo.visualizations[0]?.type;

    switch (vizType) {
      case "cache-state":
        return <CacheStateVisualization data={visualizationData as CacheVisualizationData} />;
      case "rate-limit":
        return <RateLimitVisualization data={visualizationData as RateLimitData} />;
      case "error-stack":
        return <ErrorStackVisualization data={visualizationData as ErrorVisualizationData} />;
      case "env-validation":
        return <EnvValidationVisualization data={visualizationData as EnvValidationData} />;
      case "session-list":
        return <SessionListVisualization data={visualizationData as SessionVisualizationData} />;
      case "log-stream":
        return <LogStreamVisualization data={visualizationData as LogStreamData} />;
      case "validation-tree":
        return <ValidationTreeVisualization data={visualizationData as ValidationResult} />;
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="relative grid h-full grid-cols-1 lg:grid-cols-2">
      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Left Panel: Code + Visualization (desktop only) */}
      <div className="border-border hidden overflow-hidden border-r lg:flex lg:flex-col">
        {/* Code Block */}
        <div className="flex-1 overflow-auto p-4">
          <DemoCodeBlock
            code={demo.codeContent ?? "// Code not available"}
            language="typescript"
            highlightedLines={highlightedLines}
          />
        </div>

        {/* Visualization */}
        {demo.visualizations.length > 0 && (
          <div className="border-border flex-shrink-0 border-t p-4">
            {renderVisualization() ?? (
              <div className="bg-surface border-border rounded-lg border p-6 text-center">
                <div className="bg-accent/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                  <svg
                    className="text-accent h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <p className="text-foreground font-medium">Ready to explore</p>
                <p className="text-muted mt-1 text-sm">
                  Click an action on the right to see{" "}
                  {demo.visualizations[0]?.label?.toLowerCase() ?? "results"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Panel: Actions + Output */}
      <div className="flex flex-col overflow-hidden">
        {/* Action Panel */}
        <div className="border-border flex-shrink-0 border-b p-3 sm:p-4">
          <ActionPanel actions={demo.actions} onExecute={executeAction} isExecuting={isExecuting} />
        </div>

        {/* Output Tabs */}
        <div className="border-border flex flex-shrink-0 items-center justify-between border-b">
          <div className="flex">
            <button
              onClick={() => setOutputView("steps")}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                outputView === "steps" ? "text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              Steps
              {steps.filter((s) => s.status === "completed").length > 0 && (
                <span className="ml-1.5 rounded-full bg-green-500/20 px-1.5 text-xs text-green-400">
                  {steps.filter((s) => s.status === "completed").length}/{steps.length}
                </span>
              )}
              {outputView === "steps" && (
                <span className="bg-accent absolute right-0 bottom-0 left-0 h-0.5" />
              )}
            </button>
            <button
              onClick={() => setOutputView("logs")}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                outputView === "logs" ? "text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              Logs
              {logs.length > 0 && (
                <span className="bg-accent/20 text-accent ml-1.5 rounded-full px-1.5 text-xs">
                  {logs.length}
                </span>
              )}
              {outputView === "logs" && (
                <span className="bg-accent absolute right-0 bottom-0 left-0 h-0.5" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-3 pr-4">
            {completedActions > 0 && (
              <span className="text-muted text-xs">
                {completedActions} action{completedActions !== 1 ? "s" : ""} completed
              </span>
            )}
            <div className="text-muted hidden items-center gap-1 text-xs lg:flex">
              <kbd className="bg-code-bg rounded px-1.5 py-0.5 font-mono text-[10px]">1</kbd>
              <kbd className="bg-code-bg rounded px-1.5 py-0.5 font-mono text-[10px]">2</kbd>
            </div>
          </div>
        </div>

        {/* Output Content */}
        <div className="flex-1 overflow-auto p-3 sm:p-4">
          {outputView === "logs" ? (
            <LogViewer logs={logs} />
          ) : (
            <StepExplainer
              steps={steps}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
              isAnimating={isExecuting}
              completedActions={completedActions}
            />
          )}
        </div>

        {/* Mobile: Collapsible code/visualization section */}
        <MobileCodePanel
          code={demo.codeContent ?? "// Code not available"}
          highlightedLines={highlightedLines}
          visualization={renderVisualization()}
        />
      </div>
    </div>
  );
}
