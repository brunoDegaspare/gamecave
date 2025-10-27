// src/components/home/game-shelve-table.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import clsx from "clsx";

type Game = {
  id: string;
  name: string;
  cover: string;
  platform: string;
  collections: string[];
};

export default function GameShelveTable() {
  const [games, setGames] = useState<Game[]>([
    {
      id: "sm",
      name: "Super Metroid",
      cover: "/covers/super-metroid.jpg",
      platform: "SNES",
      collections: ["SNES Classics"],
    },
    {
      id: "s2",
      name: "Sonic the Hedgehog 2",
      cover: "/covers/sonic-2-md.jpg",
      platform: "Mega Drive",
      collections: ["Playing", "Mega Drive"],
    },
    {
      id: "sf2",
      name: "Street Fighter II",
      cover: "/covers/street-fighter-ii.jpg",
      platform: "SNES",
      collections: ["SNES"],
    },
  ]);

  const handleDelete = (id: string) => {
    setGames((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="heading-4 text-neutral-100">Your shelf</h2>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900/40">
        <table className="min-w-full text-sm text-neutral-300">
          <thead className="bg-neutral-900/70 text-neutral-500">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Cover</th>
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Platform</th>
              <th className="px-4 py-3 text-left font-medium">Collections</th>
              <th className="px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>

          <tbody>
            {games.map((g) => (
              <tr
                key={g.id}
                className="border-t border-neutral-800 hover:bg-neutral-800/50 transition-colors"
              >
                {/* Cover */}
                <td className="px-4 py-3">
                  <div className="relative w-[70px] aspect-[2/3] overflow-hidden rounded-md">
                    <Image
                      src={g.cover}
                      alt={g.name}
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  </div>
                </td>

                {/* Title */}
                <td className="px-4 py-3 font-medium text-neutral-100">
                  {g.name}
                </td>

                {/* Platform */}
                <td className="px-4 py-3 text-neutral-400">{g.platform}</td>

                {/* Collections (até 2 + “+N”) */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {g.collections.slice(0, 2).map((c) => (
                      <span
                        key={c}
                        className={clsx(
                          "rounded-full px-2 py-0.5 text-xs",
                          "bg-neutral-800 text-neutral-300 border border-neutral-700"
                        )}
                        title={c}
                      >
                        {c}
                      </span>
                    ))}
                    {g.collections.length > 2 && (
                      <span
                        className="rounded-full px-2 py-0.5 text-xs bg-neutral-800 text-neutral-400 border border-neutral-700"
                        title={g.collections.slice(2).join(", ")}
                      >
                        +{g.collections.length - 2}
                      </span>
                    )}
                  </div>
                </td>

                {/* Action */}
                <td className="px-4 py-3 text-right space-x-3">
                  <button
                    className="text-neutral-400 hover:text-neutral-100 transition"
                    onClick={() => alert(`Viewing ${g.name}`)}
                  >
                    View
                  </button>
                  <button
                    className="text-red-500 hover:text-red-400 transition"
                    onClick={() => handleDelete(g.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {games.length === 0 && (
          <div className="p-6 text-center text-neutral-500">
            No games in your collections yet.
          </div>
        )}
      </div>
    </section>
  );
}
