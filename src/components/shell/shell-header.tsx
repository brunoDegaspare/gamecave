"use client";

import Icon from "@/components/ui/icon";
import {
  SearchPalette,
  useCommandPalette,
} from "@/components/ui/search-palette/search-palette";
import SearchPaletteTrigger from "@/components/ui/search-palette/search-palette-trigger";

type ShellHeaderProps = {
  collapsed: boolean;
  isHydrated: boolean;
  onToggleSidebar: () => void;
};

export default function ShellHeader({
  collapsed,
  isHydrated,
  onToggleSidebar,
}: ShellHeaderProps) {
  const { open, setOpen } = useCommandPalette();

  return (
    <header className="sticky top-0 z-40 bg-base-200/70 backdrop-blur-md border-b border-base-200">
      <div className="relative mx-auto w-full px-6 py-3">
        <button
          onClick={onToggleSidebar}
          className="cursor-pointer absolute left-6 top-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-lg hover:bg-base-200 transition-colors"
          aria-label={
            isHydrated
              ? collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
              : "Toggle sidebar"
          }
        >
          {isHydrated ? (
            <Icon
              name={
                collapsed ? "ico-arrow-right-outline" : "ico-arrow-left-outline"
              }
              size={24}
              viewBox="0 0 24 24"
              className="w-5 h-5 text-base-content"
            />
          ) : (
            <>
              <Icon
                name="ico-arrow-right-outline"
                size={24}
                viewBox="0 0 24 24"
                className="w-5 h-5 text-base-content md:hidden"
              />
              <Icon
                name="ico-arrow-left-outline"
                size={24}
                viewBox="0 0 24 24"
                className="hidden md:block w-5 h-5 text-base-content"
              />
            </>
          )}
        </button>

        <div className="flex justify-center-safe pl-14">
          <SearchPaletteTrigger
            onClick={() => setOpen(true)}
            leftIconName="ico-search-outline"
            widthClassName="w-full max-w-[680px]"
            heightClassName="h-11"
          />

          <SearchPalette
            open={open}
            setOpen={setOpen}
            items={[]}
            panelClassName="!max-w-3xl md:!max-w-[680px] w-[92vw]"
          />
        </div>
      </div>
    </header>
  );
}
