import Image from "next/image";

type AuthBrandProps = {
  className?: string;
};

export default function AuthBrand({ className }: AuthBrandProps) {
  return (
    <Image
      src="/assets/gamecave-logo-beta.svg"
      alt="GameCave logo"
      width={320}
      height={40}
      className={`h-auto w-[min(320px,40vw)] ${className ?? ""}`}
    />
  );
}
