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
        <h2 className="heading-4 text-base-content">Your shelf</h2>
      </div>

      <div className="overflow-x-auto rounded-xl border border-base-300 bg-base-200/40">
        <table className="min-w-full text-sm text-base-content/70">
          <thead className="bg-base-200/70 text-base-content/50">
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
                className="border-t border-base-300 hover:bg-base-200/50 transition-colors"
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
                <td className="px-4 py-3 font-medium text-base-content">
                  {g.name}
                </td>

                {/* Platform */}
                <td className="px-4 py-3 text-base-content/60">
                  {g.platform}
                </td>

                {/* Collections (até 2 + “+N”) */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {g.collections.slice(0, 2).map((c) => (
                      <span
                        key={c}
                        className={clsx(
                          "rounded-full px-2 py-0.5 text-xs",
                          "bg-base-300 text-base-content/80 border border-base-300"
                        )}
                        title={c}
                      >
                        {c}
                      </span>
                    ))}
                    {g.collections.length > 2 && (
                      <span
                        className="rounded-full px-2 py-0.5 text-xs bg-base-300 text-base-content/60 border border-base-300"
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
                    className="text-base-content/60 hover:text-base-content transition"
                    onClick={() => alert(`Viewing ${g.name}`)}
                  >
                    View
                  </button>
                  <button
                    className="text-error hover:text-error/80 transition"
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
          <div className="p-6 text-center text-base-content/50">
            No games in your collections yet.
          </div>
        )}
      </div>
    </section>
  );
}
