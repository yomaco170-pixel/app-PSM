import Link from "next/link";

const Header = () => {
  return (
    <header className="sticky top-0 z-20 bg-nexo-600 px-5 py-4 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold tracking-wide">
          NEXO
        </Link>
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
          Nantes · Démo
        </span>
      </div>
    </header>
  );
};

export default Header;
