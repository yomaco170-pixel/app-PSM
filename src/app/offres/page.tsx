import { TicketPercent, Gift } from "lucide-react";
import { offers } from "@/data/mock";

const OffresPage = () => {
  return (
    <div className="space-y-6">
      <section className="card space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-nexo-600/10 text-nexo-600">
            <Gift className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Offres & fidélité</h1>
            <p className="text-sm text-slate-600">
              Vos avantages locaux en un clin d'œil.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {offers.map((offer) => (
          <article key={offer.id} className="card space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-nexo-600">
              <TicketPercent className="h-4 w-4" />
              {offer.title}
            </div>
            <p className="text-sm text-slate-700">{offer.detail}</p>
            <p className="text-xs text-slate-500">{offer.progress}</p>
            <span className="text-xs text-slate-400">{offer.expires}</span>
          </article>
        ))}
      </section>
    </div>
  );
};

export default OffresPage;
