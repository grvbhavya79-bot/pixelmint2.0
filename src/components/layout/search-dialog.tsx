"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ToolIcon } from "@/components/tools/tool-icon";
import { searchTools, getPopularTools, getTool, CATEGORY_BY_ID } from "@/lib/tools/registry";
import { useRecents } from "@/hooks/use-local-tools";
import { cn } from "@/lib/utils";
import { Clock3, Flame } from "lucide-react";

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { recents } = useRecents();

  const results = useMemo(() => searchTools(query), [query]);
  const popular = useMemo(() => getPopularTools().slice(0, 8), []);

  const go = useCallback(
    (slug: string) => {
      onOpenChange(false);
      router.push(`/tools/${slug}`);
    },
    [onOpenChange, router],
  );

  const recentTools = useMemo(
    () => recents.map((slug) => getTool(slug)).filter((t) => t !== undefined).slice(0, 5),
    [recents],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search tools… (e.g. compress, jpg, merge)" value={query} onValueChange={setQuery} />
      <CommandList className="scrollbar-thin">
        <CommandEmpty>
          {query ? <span>No tools match “{query}”. Try “pdf”, “image”, “json”…</span> : null}
        </CommandEmpty>

        {query === "" && recentTools.length > 0 && (
          <CommandGroup heading={<span className="flex items-center gap-1.5"><Clock3 size={13} /> Recently used</span>}>
            {recentTools.map((tool) => (
              <CommandItem key={`recent-${tool.slug}`} value={`${tool.name} recent ${tool.slug}`} onSelect={() => go(tool.slug)}>
                <ToolIcon name={tool.icon} size={16} className="text-muted-foreground" />
                <span>{tool.name}</span>
                <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[10px]", CATEGORY_BY_ID[tool.category].chip)}>
                  {CATEGORY_BY_ID[tool.category].shortName}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {query === "" && (
          <CommandGroup heading={<span className="flex items-center gap-1.5"><Flame size={13} /> Popular tools</span>}>
            {popular.map((tool) => (
              <CommandItem key={`pop-${tool.slug}`} value={`${tool.name} popular ${tool.slug}`} onSelect={() => go(tool.slug)}>
                <ToolIcon name={tool.icon} size={16} className="text-muted-foreground" />
                <span>{tool.name}</span>
                <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[10px]", CATEGORY_BY_ID[tool.category].chip)}>
                  {CATEGORY_BY_ID[tool.category].shortName}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {query !== "" && (
          <CommandGroup heading={`${results.length} result${results.length === 1 ? "" : "s"}`}>
            {results.map((tool) => (
              <CommandItem key={tool.slug} value={`${tool.name} ${tool.slug} ${tool.tags.join(" ")}`} onSelect={() => go(tool.slug)}>
                <ToolIcon name={tool.icon} size={16} className="text-muted-foreground" />
                <span>{tool.name}</span>
                <span className="ml-2 hidden truncate text-xs text-muted-foreground sm:inline">{tool.description}</span>
                <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[10px]", CATEGORY_BY_ID[tool.category].chip)}>
                  {CATEGORY_BY_ID[tool.category].shortName}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
