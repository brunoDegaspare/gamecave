import HomeHighlights from "@/components/home/home-highlights";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Qualquer hero/heading da Home */}
      <HomeHighlights />
      {/* Outros conteúdos da Home */}
    </div>
  );
}
