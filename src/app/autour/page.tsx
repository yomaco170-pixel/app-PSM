import Link from "next/link";
import {
  Filter,
  MapPin,
  Star,
  MessageCircle,
  Navigation,
  Phone
} from "lucide-react";
import { commerces } from "@/data/mock";

const chips = ["Ouverts", "<500m", "Top notés", "Boulangeries", "Café", "Mobilité"];

const AutourPage = () => {
  return (
    <div className="space-y-6">
      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Autour de moi</h1>
          <Filter className="h-5 w-5 text-slate-500" />
        </div>
        <input
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm focus:border-nexo-600 focus:outline-none"
          placeholder="Rechercher un commerce ou un service"
        />
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span key={chip} className="chip">
              {chip}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        {commerces.map((commerce) => (
          <article key={commerce.slug} className="card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {commerce.name}
                </h2>
                <p className="text-sm text-slate-600">{commerce.category}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  commerce.open
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {commerce.open ? "Ouvert" : "Fermé"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {commerce.distance}
              </span>
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-400" />
                {commerce.rating}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/chat/${commerce.chatId}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 py-2 text-sm font-medium text-slate-700"
              >
                <MessageCircle className="h-4 w-4" />
                Écrire
              </Link>
              <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 py-2 text-sm font-medium text-slate-700">
                <Navigation className="h-4 w-4" />
                Y aller
              </button>
              <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 py-2 text-sm font-medium text-slate-700">
                <Phone className="h-4 w-4" />
                Appeler
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default AutourPage;
