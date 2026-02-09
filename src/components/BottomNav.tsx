"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessagesSquare,
  MapPin,
  QrCode,
  TicketPercent,
  User
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { href: "/chats", label: "Chats", icon: MessagesSquare },
  { href: "/autour", label: "Autour", icon: MapPin },
  { href: "/scan", label: "Scanner", icon: QrCode },
  { href: "/offres", label: "Offres", icon: TicketPercent },
  { href: "/moi", label: "Moi", icon: User }
];

const BottomNav = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-slate-200 bg-white/95 px-4 py-2 backdrop-blur">
      <div className="flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-xs font-medium",
                isActive
                  ? "text-nexo-600"
                  : "text-slate-500 hover:text-nexo-600"
              )}
            >
              <Icon className={clsx("h-5 w-5", isActive && "fill-nexo-600/10")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
