"use client";

import * as React from "react";
import { Command } from "cmdk";

type Item = {
  id: string;
  label: string;
  group?: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action?: () => void;
};

const DOC_ITEMS: Item[] = [
  { id: "intro", label: "Introduction", group: "App", icon: "📄" },
  { id: "getting-started", label: "Getting Started", group: "App", icon: "🚀" },
  { id: "app-router", label: "App Router", group: "App", icon: "🧭" },
  { id: "architecture", label: "Architecture", group: "App", icon: "🏗️" },
  { id: "pages-router", label: "Pages Router", group: "Pages", icon: "📚" },
  { id: "api-ref", label: "API Reference", group: "Reference", icon: "🔗" },
  {
    id: "accessibility",
    label: "Accessibility",
    group: "Reference",
    icon: "♿",
  },
];

function groupBy<T extends { group?: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((acc, it) => {
    const key = it.group || "Other";
    (acc[key] ||= []).push(it);
    return acc;
  }, {});
}

export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);

  // ⌘K / Ctrl+K abre/fecha — Esc fecha
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === "k";
      const mod = e.metaKey || e.ctrlKey;

      if (isK && mod) {
        e.preventDefault();
        setOpen((p) => !p);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { open, setOpen };
}

export function SearchPalette({
  open,
  setOpen,
  items = DOC_ITEMS,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  items?: Item[];
}) {
  const groups = groupBy(items);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Container central (clique dentro não fecha) */}
      {open && (
        <div
          className="fixed inset-0 z-[10000] flex items-start justify-center p-4 pt-[10vh]"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/95 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <Command
              label="Global Search"
              className="w-full text-zinc-200"
              loop
              shouldFilter // deixa o cmdk filtrar por label
            >
              {/* Input */}
              <div className="relative">
                <Command.Input
                  autoFocus
                  placeholder="What are you searching for?"
                  className="w-full bg-transparent px-4 py-3 text-base placeholder-zinc-500 outline-none"
                />
                <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400">
                  Esc
                </kbd>
              </div>

              {/* Lista */}
              <Command.List className="max-h-[60vh] overflow-auto border-t border-zinc-800">
                <Command.Empty className="px-4 py-6 text-sm text-zinc-500">
                  No results found.
                </Command.Empty>

                {Object.entries(groups).map(([heading, groupItems]) => (
                  <Command.Group
                    key={heading}
                    heading={heading}
                    className="p-1"
                  >
                    {groupItems.map((it) => (
                      <Command.Item
                        key={it.id}
                        value={it.label}
                        onSelect={() => {
                          setOpen(false);
                          it.action?.();
                        }}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm data-[selected=true]:bg-zinc-800 data-[selected=true]:text-white"
                      >
                        {/* Ícone à esquerda */}
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm border border-zinc-700 text-[11px]">
                          {it.icon ?? "🔎"}
                        </span>

                        <span className="flex-1">{it.label}</span>

                        {/* Atalho opcional */}
                        {it.shortcut && (
                          <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                            {it.shortcut}
                          </kbd>
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </>
  );
}
