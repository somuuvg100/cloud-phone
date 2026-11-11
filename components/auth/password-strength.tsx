"use client";

import * as React from "react";
import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
  password?: string;
}

export function PasswordStrength({ password = "" }: PasswordStrengthProps) {
  const criteria = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter (A-Z)", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter (a-z)", met: /[a-z]/.test(password) },
    { label: "One number (0-9)", met: /[0-9]/.test(password) },
    { label: "One special character (!@#$%...)", met: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = criteria.filter((c) => c.met).length;

  const getStrengthMeta = () => {
    if (password.length === 0) return { label: "", color: "bg-muted", width: "w-0", textClass: "" };
    if (score <= 2) return { label: "Weak", color: "bg-rose-500", width: "w-1/4", textClass: "text-rose-500" };
    if (score === 3) return { label: "Fair", color: "bg-amber-500", width: "w-2/4", textClass: "text-amber-500" };
    if (score === 4) return { label: "Good", color: "bg-blue-500", width: "w-3/4", textClass: "text-blue-500" };
    return { label: "Strong", color: "bg-emerald-500", width: "w-full", textClass: "text-emerald-500" };
  };

  const meta = getStrengthMeta();

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-2.5 pt-1.5 transition-all duration-300">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-muted-foreground">Password strength:</span>
          <span className={`font-semibold ${meta.textClass}`}>{meta.label}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${meta.color} ${meta.width}`}
          />
        </div>
      </div>

      {/* Rules Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] pt-1">
        {criteria.map((item, index) => (
          <div
            key={index}
            className={`flex items-center gap-1.5 transition-colors ${
              item.met
                ? "text-emerald-600 dark:text-emerald-400 font-medium"
                : "text-muted-foreground"
            }`}
          >
            {item.met ? (
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
            )}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

