"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import GhostButton from "@/components/ui/ghost-button";
import ModalLayout from "@/components/ui/modal-layout";
import PrimaryButton from "@/components/ui/primary-button";

type CompletionState = {
  cartridge: boolean;
  manual: boolean;
  box: boolean;
};

type Game = {
  id: number;
  cover: string;
  name: string;
  platform: string;
  completion: CompletionState;
};

type GameCompletionModalProps = {
  game: Game | null;
  onClose: () => void;
  onSave: (completion: CompletionState) => void;
};

export default function GameCompletionModal({
  game,
  onClose,
  onSave,
}: GameCompletionModalProps) {
  const [localCompletion, setLocalCompletion] = useState<CompletionState>({
    cartridge: false,
    manual: false,
    box: false,
  });

  useEffect(() => {
    if (game) {
      setLocalCompletion(game.completion);
    }
  }, [game]);

  if (!game) {
    return null;
  }

  const toggleCompletion = (field: keyof CompletionState) => {
    setLocalCompletion((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSave = () => {
    onSave(localCompletion);
  };

  return (
    <ModalLayout
      onClose={onClose}
      contentClassName="w-full max-w-3xl bg-base-100 text-base-content"
      contentStyle={{ minWidth: "min(550px, calc(100vw - 32px))" }}
    >
      <div className="flex flex-col gap-6 md:flex-row">
        <div className="relative mx-auto w-56 shrink-0">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl shadow-lg">
            <Image
              src={game.cover}
              alt={game.name}
              fill
              className="object-cover"
              sizes="160px"
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-6">
          <div>
            <p className="caption-12 text-neutral-500 uppercase tracking-wide">
              {game.platform}
            </p>
            <h3 className="heading-4 text-white">{game.name}</h3>
          </div>

          <div>
            <p className="body-16 font-medium text-neutral-300">
              Is it complete?
            </p>
            <div className="mt-4 space-y-3">
              {[
                { key: "cartridge", label: "Cartridge" },
                { key: "manual", label: "Manual" },
                { key: "box", label: "Box" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-3 rounded-xl border border-base-300 bg-base-200/50 px-4 py-3 cursor-pointer hover:bg-neutral-900/50 transition-colors duration-300"
                >
                  <input
                    type="checkbox"
                    className="checkbox border-neutral-600 bg-neutral-900/80 checked:border-transparent checked:bg-purple-600 focus:ring-0 [--chkfg:#ffffff]"
                    checked={
                      localCompletion[item.key as keyof CompletionState]
                    }
                    onChange={() =>
                      toggleCompletion(item.key as keyof CompletionState)
                    }
                  />
                  <span className="body-16 text-white">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

        </div>
      </div>

      <div className="mt-4 flex w-full items-center justify-end gap-3">
        <GhostButton type="button" onClick={onClose}>
          Cancel
        </GhostButton>
        <PrimaryButton type="button" onClick={handleSave}>
          Save
        </PrimaryButton>
      </div>
    </ModalLayout>
  );
}
