"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Command } from "cmdk";

type Item = {
  id: string;
  label: string;
  group?: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action?: () => void;
};

function groupBy<T extends { group?: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((acc, it) => {
    const key = it.group || "Other";
    (acc[key] ||= []).push(it);
    return acc;
  }, {});
}

export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);

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

  // bloqueia scroll do body quando aberto
  React.useEffect(() => {
    if (!open) return;
    const { classList } = document.documentElement;
    classList.add("overflow-y-hidden");
    return () => classList.remove("overflow-y-hidden");
  }, [open]);

  return { open, setOpen };
}

export function SearchPalette({
  open,
  setOpen,
  items,
  panelClassName,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  items: Item[];
  panelClassName?: string;
}) {
  const groups = groupBy(items);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] gc-scrollbar"
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop: dim + blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Painel */}
      <div
        className="absolute left-1/2 top-24 w-full max-w-[700px] p-4 -translate-x-1/2 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/95 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          label="Global Search"
          className="w-full text-zinc-200"
          loop
          shouldFilter
        >
          <div className="relative">
            <Command.Input
              autoFocus
              placeholder="Type to search..."
              className="w-full bg-transparent px-4 py-3 text-base placeholder-zinc-500 outline-none"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400">
              Esc
            </kbd>
          </div>

          <Command.List className="max-h-[60vh] overflow-auto border-t border-zinc-800">
            <Command.Empty className="px-4 py-6 text-sm text-zinc-500">
              No results found.
            </Command.Empty>

            {Object.entries(groups).map(([heading, groupItems]) => (
              <Command.Group key={heading} heading={heading} className="p-1">
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
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm border border-zinc-700 text-[12px]">
                      {it.icon ?? "🔎"}
                    </span>
                    <span className="flex-1">{it.label}</span>
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
    </div>,
    document.body
  );
}
