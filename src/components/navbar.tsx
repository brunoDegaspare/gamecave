import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/70 backdrop-blur dark:bg-neutral-950/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-bold tracking-tight text-lg">
          GameCave
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <a href="/collection" className="opacity-80 hover:opacity-100">
            Coleção
          </a>
          <a href="/favourites" className="opacity-80 hover:opacity-100">
            Favoritos
          </a>
          <a href="/profile" className="opacity-80 hover:opacity-100">
            Perfil
          </a>
        </nav>
      </div>
    </header>
  );
}
