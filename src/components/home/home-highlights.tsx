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
      iconColor: "text-info",
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
      iconColor: "text-base-content/60",
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
      title: "Playing now",
      value: 8,
      iconColor: "text-success",
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
      iconColor: "text-warning",
    },
  ];
}
