import type { ReactNode } from "react";
import AuthBrand from "@/components/auth/auth-brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen text-base-content bg-auth overflow-hidden">
      {/* Illustrated background texture (decorative only) */}
      <div
        className="absolute inset-0 pointer-events-none bg-[url('/assets/auth/bg-auth.png')] bg-cover bg-center opacity-[0.07]"
        aria-hidden="true"
      />

      {/* Content */}
      <div
        className="relative z-10 mx-auto grid min-h-screen w-full max-w-5xl
                      grid-cols-1 content-start items-start gap-10
                      px-6 py-12
                      md:grid-cols-2 md:content-center md:items-center md:gap-12"
      >
        <div className="space-y-6">
          <AuthBrand />
          <p className="body-18 text-base-content/60">
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
