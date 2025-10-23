import CardStat from "@/components/ui/card-stat";
import Icon from "@/components/ui/icon";

export default function HomeHighlights() {
  const stats = [
    {
      icon: (
        <Icon
          name="ico-controller-outline"
          size={32}
          viewBox="0 0 24 24"
          className="w-full h-full"
        />
      ),
      title: "Total games",
      value: 124,
      iconColor: "text-cyan-400",
    },
    {
      icon: (
        <Icon
          name="ico-console-outline"
          size={32}
          viewBox="0 0 24 24"
          className="w-full h-full"
        />
      ),
      title: "Platforms",
      value: 32,
      iconColor: "text-slate-400",
    },
    {
      icon: (
        <Icon
          name="ico-playing-outline"
          size={32}
          viewBox="0 0 24 24"
          className="w-full h-full"
        />
      ),
      title: "Games in progress",
      value: 8,
      iconColor: "text-green-400",
    },
    {
      icon: (
        <Icon
          name="ico-trophy-outline"
          size={32}
          viewBox="0 0 24 24"
          className="w-full h-full"
        />
      ),
      title: "Finished games",
      value: 5,
      iconColor: "text-yellow-400",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <CardStat
          key={i}
          icon={stat.icon}
          title={stat.title}
          value={stat.value}
          iconColor={stat.iconColor} // optional (has default)
        />
      ))}
    </section>
  );
}
