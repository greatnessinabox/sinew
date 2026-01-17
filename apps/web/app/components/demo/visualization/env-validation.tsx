"use client";

import type { EnvValidationData } from "@/app/lib/demo/types";

interface EnvValidationVisualizationProps {
  data: EnvValidationData;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}

export function EnvValidationVisualization({ data }: EnvValidationVisualizationProps) {
  const { variables, valid, missingRequired, invalidValues } = data;

  const validCount = variables.filter((v) => v.valid).length;
  const totalCount = variables.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-foreground font-medium">Environment Variables</h4>
        {valid ? (
          <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-400">
            <CheckIcon className="h-4 w-4" />
            All Valid
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-3 py-1 text-sm font-medium text-red-400">
            <XIcon className="h-4 w-4" />
            Invalid
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="text-muted flex justify-between text-xs">
          <span>
            {validCount} of {totalCount} valid
          </span>
          <span>{Math.round((validCount / totalCount) * 100)}%</span>
        </div>
        <div className="bg-code-bg h-2 overflow-hidden rounded-full">
          <div
            className={`h-full transition-all duration-500 ${valid ? "bg-green-500" : "bg-accent"}`}
            style={{ width: `${(validCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Variables List */}
      <div className="border-border bg-surface max-h-64 overflow-y-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border bg-code-bg border-b">
              <th className="text-muted px-3 py-2 text-left text-xs font-medium">Variable</th>
              <th className="text-muted px-3 py-2 text-left text-xs font-medium">Value</th>
              <th className="text-muted px-3 py-2 text-center text-xs font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {variables.map((v) => (
              <tr key={v.key} className={v.valid ? "" : "bg-red-500/5"}>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <code className="text-accent font-mono text-xs">{v.key}</code>
                    {v.required && (
                      <span className="rounded bg-yellow-500/10 px-1 py-0.5 text-[10px] font-medium text-yellow-400">
                        required
                      </span>
                    )}
                    {v.isSecret && <LockIcon className="text-muted h-3 w-3" />}
                  </div>
                </td>
                <td className="max-w-[140px] truncate px-3 py-2">
                  {v.isSecret && v.value ? (
                    <span className="text-muted font-mono text-xs">••••••••</span>
                  ) : v.value ? (
                    <span className="font-mono text-xs text-green-400">
                      {v.value.length > 20 ? v.value.slice(0, 20) + "..." : v.value}
                    </span>
                  ) : (
                    <span className="text-xs italic text-red-400">undefined</span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  {v.valid ? (
                    <div className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20">
                      <CheckIcon className="h-3 w-3 text-green-400" />
                    </div>
                  ) : (
                    <div className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20">
                      <XIcon className="h-3 w-3 text-red-400" />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Errors Summary */}
      {!valid && (missingRequired.length > 0 || invalidValues.length > 0) && (
        <div className="space-y-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          {missingRequired.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-400">Missing Required:</p>
              <p className="text-muted mt-1 font-mono text-xs">{missingRequired.join(", ")}</p>
            </div>
          )}
          {invalidValues.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-400">Invalid Values:</p>
              {invalidValues.map((iv) => (
                <p key={iv.key} className="text-muted mt-1 font-mono text-xs">
                  {iv.key}: expected {iv.expected}, got {iv.received}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
