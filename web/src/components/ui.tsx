import { cn } from "../lib/utils";
import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:opacity-50",
        variant === "primary" && "bg-spruce text-paper hover:bg-spruce-light",
        variant === "secondary" && "border border-spruce/20 bg-paper text-spruce hover:bg-mist",
        variant === "ghost" && "text-spruce hover:bg-mist/60",
        variant === "danger" && "bg-danger text-white hover:opacity-90",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-md border border-spruce/15 bg-white/70 px-3 py-2 text-sm outline-none ring-brass/40 focus:ring-2",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-md border border-spruce/15 bg-white/70 px-3 py-2 text-sm outline-none ring-brass/40 focus:ring-2",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-md border border-spruce/15 bg-white/70 px-3 py-2 text-sm outline-none ring-brass/40 focus:ring-2",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-muted", className)} {...props} />;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ok" | "warn" | "danger" | "brass";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold",
        tone === "neutral" && "bg-mist text-spruce",
        tone === "ok" && "bg-ok/15 text-ok",
        tone === "warn" && "bg-warn/15 text-warn",
        tone === "danger" && "bg-danger/15 text-danger",
        tone === "brass" && "bg-brass/20 text-brass-deep",
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-spruce/20 bg-white/40 px-6 py-10 text-center">
      <h3 className="font-display text-xl text-spruce">{title}</h3>
      <p className="mt-2 text-sm text-ink-muted">{body}</p>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
      {message}
    </div>
  );
}

export function LoadingBlock({ label = "Laster…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ink-muted">
      <span className="h-3 w-3 animate-pulse-soft rounded-full bg-brass" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
