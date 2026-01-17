import type { ReactNode } from "react";
import AuthBrand from "@/components/auth/auth-brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen text-neutral-100 [background:radial-gradient(1000px_circle_at_top_center,rgba(168,85,247,0.15),transparent_60%),#030014]">
      <div className="mx-auto grid min-h-screen w-full max-w-5xl grid-cols-1 content-center items-center gap-10 px-6 py-12 md:grid-cols-2 md:gap-12">
        <div className="space-y-6">
          <AuthBrand />
          <p className="body-18 text-neutral-400">
            Your personal space to organize and revisit your game collection.
          </p>
        </div>
        <div className="w-full max-w-md overflow-hidden md:justify-self-end">
          {children}
        </div>
      </div>
    </div>
  );
}
