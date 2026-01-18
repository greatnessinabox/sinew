"use client";

import { useState, useEffect, useRef } from "react";
import type { DemoAction, ParamDefinition } from "@/app/lib/demo/types";

interface ActionPanelProps {
  actions: DemoAction[];
  onExecute: (actionId: string, params?: Record<string, unknown>) => void;
  isExecuting: boolean;
}

function ActionButton({
  action,
  onExecute,
  isExecuting,
  isOpen,
  onToggle,
}: {
  action: DemoAction;
  onExecute: (actionId: string, params?: Record<string, unknown>) => void;
  isExecuting: boolean;
  isOpen: boolean;
  onToggle: (actionId: string | null) => void;
}) {
  const [params, setParams] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const hasParams = action.params && action.params.length > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        formRef.current &&
        !formRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        onToggle(null);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onToggle(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onToggle]);

  const handleClick = () => {
    if (hasParams) {
      onToggle(isOpen ? null : action.id);
    } else {
      onToggle(null); // Close any open dropdown
      onExecute(action.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const typedParams: Record<string, unknown> = {};

    action.params?.forEach((param) => {
      const value = params[param.name];
      if (value !== undefined && value !== "") {
        if (param.type === "number") {
          typedParams[param.name] = Number(value);
        } else if (param.type === "boolean") {
          typedParams[param.name] = value === "true";
        } else if (param.type === "json") {
          try {
            typedParams[param.name] = JSON.parse(value);
          } catch {
            typedParams[param.name] = value;
          }
        } else {
          typedParams[param.name] = value;
        }
      }
    });

    onExecute(action.id, typedParams);
    onToggle(null);
    setParams({}); // Reset params after execution
  };

  const buttonVariants = {
    default: "bg-accent hover:bg-accent-secondary text-white",
    secondary: "bg-surface border-border hover:border-accent/40 border text-foreground",
    destructive: "bg-red-500/10 border-red-500/30 hover:bg-red-500/20 border text-red-400",
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleClick}
        disabled={isExecuting}
        className={`rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors disabled:opacity-50 sm:px-4 ${
          buttonVariants[action.variant ?? "default"]
        } ${isOpen ? "ring-accent/50 ring-2" : ""}`}
        title={action.description}
      >
        {action.label}
      </button>

      {/* Params Form Dropdown */}
      {isOpen && hasParams && (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="bg-surface border-border absolute top-full left-0 z-50 mt-2 w-72 rounded-lg border p-4 shadow-xl sm:w-80"
        >
          <div className="space-y-3">
            {action.params?.map((param) => (
              <ParamInput
                key={param.name}
                param={param}
                value={params[param.name] ?? ""}
                onChange={(value) => setParams((p) => ({ ...p, [param.name]: value }))}
              />
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={isExecuting}
              className="bg-accent hover:bg-accent-secondary flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              Execute
            </button>
            <button
              type="button"
              onClick={() => onToggle(null)}
              className="text-muted hover:text-foreground px-4 py-2 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function ParamInput({
  param,
  value,
  onChange,
}: {
  param: ParamDefinition;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-foreground mb-1 block text-sm font-medium">
        {param.label ?? param.name}
        {param.required && <span className="text-accent ml-1">*</span>}
      </label>
      <input
        type={param.type === "number" ? "number" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={param.placeholder}
        required={param.required}
        className="bg-code-bg border-border text-foreground placeholder:text-muted/50 focus:border-accent w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
      />
    </div>
  );
}

export function ActionPanel({ actions, onExecute, isExecuting }: ActionPanelProps) {
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const handleToggle = (actionId: string | null) => {
    setOpenActionId(actionId);
  };

  // Close dropdown when executing
  const handleExecute = (actionId: string, params?: Record<string, unknown>) => {
    setOpenActionId(null);
    onExecute(actionId, params);
  };

  return (
    <div>
      <h3 className="text-muted mb-3 text-xs font-semibold tracking-wider uppercase">Actions</h3>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <ActionButton
            key={action.id}
            action={action}
            onExecute={handleExecute}
            isExecuting={isExecuting}
            isOpen={openActionId === action.id}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </div>
  );
}
