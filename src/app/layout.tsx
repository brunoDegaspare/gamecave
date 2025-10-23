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
    <html lang="en-US" className={`${saira.variable} h-full`}>
      <body className="min-h-screen font-sans bg-neutral-950 text-neutral-100 antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
