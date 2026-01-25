import type { ReactNode } from "react";
import AuthBrand from "@/components/auth/auth-brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen text-base-content bg-auth overflow-hidden">
      {/* Background blobs (decorative only) */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-24 -left-24 w-[500px] h-[500px]
                        bg-cyan-700 rounded-full mix-blend-screen
                        blur-3xl opacity-[0.12]
                        animate-blob"
        />

        <div
          className="absolute top-1/3 -right-32 w-[520px] h-[520px]
                        bg-purple-900 rounded-full mix-blend-screen
                        blur-3xl opacity-[0.10]
                        animate-blob animation-delay-2000"
        />

        <div
          className="absolute -bottom-40 left-1/4 w-[560px] h-[560px]
                        bg-indigo-500 rounded-full mix-blend-screen
                        blur-3xl opacity-[0.08]
                        animate-blob animation-delay-4000"
        />
      </div>

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
