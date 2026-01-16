import Image from "next/image";

type AuthBrandProps = {
  className?: string;
};

export default function AuthBrand({ className }: AuthBrandProps) {
  return (
    <Image
      src="/assets/gamecave-logo-beta.svg"
      alt="GameCave logo"
      width={350}
      height={70}
      className={`h-auto w-[min(350px,80vw)] ${className ?? ""}`}
    />
  );
}
