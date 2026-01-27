import type { Metadata } from "next";
import "./styles/globals.css";
import { saira } from "./font";
import ClientProviders from "@/app/client-providers";

export const metadata: Metadata = {
  title: "GameCave",
  description: "Busque jogos, crie e gerencie suas coleções.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-US"
      data-theme="black"
      className={`${saira.variable} h-full gc-scrollbar scroll-smooth md:scroll-auto`}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen min-h-[100dvh] font-sans bg-base-100 text-base-content antialiased"
        suppressHydrationWarning
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
