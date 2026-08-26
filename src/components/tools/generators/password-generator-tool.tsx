"use client";

import { useMemo, useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OptionSlider, OptionSwitch } from "@/components/tools/shared/option-controls";
import { generatePassword, passwordStrengthBits, PASSWORD_CHARSETS } from "@/lib/text-tools";
import { copyText } from "@/lib/download";
import { cn } from "@/lib/utils";

function secureRandom(n: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] / 0x100000000) * n;
}

export default function PasswordGeneratorTool() {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({ uppercase: true, lowercase: true, numbers: true, symbols: true, excludeAmbiguous: false });
  const [password, setPassword] = useState(() => generatePassword({ uppercase: true, lowercase: true, numbers: true, symbols: true, excludeAmbiguous: false, length: 16 }, secureRandom));
  const [history, setHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const pw = generatePassword({ ...options, length }, secureRandom);
    if (!pw) {
      toast.error("Select at least one character type.");
      return;
    }
    setPassword(pw);
    setHistory((h) => [pw, ...h].slice(0, 5));
    setCopied(false);
  };

  const changeLength = (v: number) => {
    setLength(v);
    setPassword(generatePassword({ ...options, length: v }, secureRandom));
  };

  const changeOption = (patch: Partial<typeof options>) => {
    const next = { ...options, ...patch };
    setOptions(next);
    setPassword(generatePassword({ ...next, length }, secureRandom));
  };

  const strength = useMemo(() => passwordStrengthBits(password), [password]);
  const strengthColor =
    strength.label === "weak" ? "bg-destructive" : strength.label === "fair" ? "bg-amber-500" : strength.label === "strong" ? "bg-success" : "bg-emerald-600";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-5">
        <p className="font-mono text-lg font-semibold break-all text-foreground sm:text-xl" aria-live="polite">
          {password || "—"}
        </p>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Strength</span>
            <span className={cn("font-semibold capitalize", strength.label === "weak" ? "text-destructive" : "text-success")}>
              {strength.label} · {strength.bits} bits
            </span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={strength.score} aria-valuemin={0} aria-valuemax={100} aria-label="Password strength">
            <div className={cn("h-full rounded-full transition-all", strengthColor)} style={{ width: `${Math.max(6, strength.score)}%` }} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Button onClick={() => void copyText(password).then(() => { setCopied(true); toast.success("Password copied"); })} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {copied ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
            {copied ? "Copied" : "Copy password"}
          </Button>
          <Button variant="outline" onClick={generate}>
            <RefreshCw size={14} className="mr-1.5" /> Generate new
          </Button>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border bg-card p-4">
        <OptionSlider label="Length" value={length} onValueChange={changeLength} min={6} max={64} unit=" characters" />
        <div className="grid gap-2 sm:grid-cols-2">
          <OptionSwitch label="Uppercase (A-Z)" checked={options.uppercase} onCheckedChange={(v) => changeOption({ uppercase: v })} id="pw-upper" />
          <OptionSwitch label="Lowercase (a-z)" checked={options.lowercase} onCheckedChange={(v) => changeOption({ lowercase: v })} id="pw-lower" />
          <OptionSwitch label="Numbers (0-9)" checked={options.numbers} onCheckedChange={(v) => changeOption({ numbers: v })} id="pw-num" />
          <OptionSwitch label={`Symbols (${PASSWORD_CHARSETS.symbols.slice(0, 12)}…)`} checked={options.symbols} onCheckedChange={(v) => changeOption({ symbols: v })} id="pw-sym" />
          <OptionSwitch label="Exclude look-alikes (O0, Il, 1)" checked={options.excludeAmbiguous} onCheckedChange={(v) => changeOption({ excludeAmbiguous: v })} id="pw-ambig" />
        </div>
      </div>

      {history.length > 1 && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold text-foreground">Recent passwords (this visit only)</p>
          <ul className="mt-2 space-y-1">
            {history.slice(1).map((pw, i) => (
              <li key={i} className="flex items-center justify-between gap-2 font-mono text-xs text-muted-foreground">
                <span className="truncate">{pw}</span>
                <button type="button" onClick={() => void copyText(pw).then(() => toast.success("Copied"))} className="focus-ring shrink-0 rounded p-1 hover:text-primary" aria-label="Copy this password">
                  <Copy size={12} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
