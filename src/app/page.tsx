import Link from "next/link";
import {
  MessagesSquare,
  MapPin,
  QrCode,
  TicketPercent,
  User,
  ArrowRight
} from "lucide-react";

const cards = [
  {
    title: "Chats",
    description: "Vos conversations avec amis et commerces.",
    href: "/chats",
    icon: MessagesSquare
  },
  {
    title: "Autour de moi",
    description: "Trouver des lieux ouverts et tendances.",
    href: "/autour",
    icon: MapPin
  },
  {
    title: "Scanner",
    description: "Scanner un QR pour ouvrir un commerce.",
    href: "/scan",
    icon: QrCode
  },
  {
    title: "Offres",
    description: "Cartes fidélité et coupons locaux.",
    href: "/offres",
    icon: TicketPercent
  },
  {
    title: "Moi",
    description: "Profil, préférences et quartier.",
    href: "/moi",
    icon: User
  }
];

const HomePage = () => {
  return (
    <div className="space-y-6">
      <section className="card space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-nexo-600">
          Super-app locale
        </p>
        <h1 className="text-2xl font-semibold">
          Bienvenue sur NEXO, votre chat de quartier.
        </h1>
        <p className="text-sm text-slate-600">
          Centralisez vos conversations, commandes et bons plans à Nantes.
        </p>
      </section>

      <section className="grid gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="card flex items-center gap-4 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-nexo-600/10 text-nexo-600">
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900">
                  {card.title}
                </h2>
                <p className="text-sm text-slate-600">{card.description}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400" />
            </Link>
          );
        })}
      </section>
    </div>
  );
};

export default HomePage;
