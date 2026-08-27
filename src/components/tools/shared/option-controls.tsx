"use client";

import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function OptionRow({ label, hint, children, htmlFor }: { label: string; hint?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-[13px] font-medium text-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function OptionSlider({
  label,
  value,
  onValueChange,
  min,
  max,
  step = 1,
  unit = "",
  hint,
}: {
  label: string;
  value: number;
  onValueChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  hint?: string;
}) {
  return (
    <OptionRow label={`${label}: ${value}${unit}`} hint={hint}>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onValueChange(v[0])}
        aria-label={label}
        className="py-1.5"
      />
    </OptionRow>
  );
}

export function OptionSelect<T extends string | number>({
  label,
  value,
  onValueChange,
  options,
  hint,
  id,
}: {
  label: string;
  value: T;
  onValueChange: (v: T) => void;
  options: { value: T; label: string }[];
  hint?: string;
  id?: string;
}) {
  const stringValue = String(value);
  return (
    <OptionRow label={label} hint={hint} htmlFor={id}>
      <Select value={stringValue} onValueChange={(v) => onValueChange((options.find((o) => String(o.value) === v)?.value ?? v) as T)}>
        <SelectTrigger id={id} className="w-full bg-card">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </OptionRow>
  );
}

export function OptionSwitch({
  label,
  checked,
  onCheckedChange,
  hint,
  id,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  hint?: string;
  id?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div>
        <Label htmlFor={id} className="text-[13px] font-medium text-foreground">
          {label}
        </Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

export function OptionInput({
  label,
  value,
  onValueChange,
  type = "text",
  placeholder,
  hint,
  id,
  min,
  max,
  step,
  className,
}: {
  label: string;
  value: string | number;
  onValueChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  id?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  return (
    <OptionRow label={label} hint={hint} htmlFor={id}>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn("bg-card", className)}
      />
    </OptionRow>
  );
}

export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  ariaLabel,
}: {
  value: T;
  onValueChange: (v: T) => void;
  options: { value: T; label: string }[];
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex w-full rounded-lg border bg-card p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onValueChange(opt.value)}
          className={cn(
            "focus-ring flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
            value === opt.value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
