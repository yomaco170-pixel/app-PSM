import { MapPin, Settings, Heart } from "lucide-react";
import { profile } from "@/data/mock";

const MoiPage = () => {
  return (
    <div className="space-y-6">
      <section className="card space-y-3">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-nexo-600/10 text-nexo-600">
            <span className="text-lg font-semibold">CD</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{profile.name}</h1>
            <p className="text-sm text-slate-600">{profile.status}</p>
          </div>
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <MapPin className="h-4 w-4" />
          Quartier
        </div>
        <p className="text-sm text-slate-600">{profile.neighborhood}</p>
      </section>

      <section className="card space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Heart className="h-4 w-4" />
          Préférences
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.preferences.map((preference) => (
            <span key={preference} className="chip">
              {preference}
            </span>
          ))}
        </div>
      </section>

      <section className="card space-y-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Settings className="h-4 w-4" />
          Préférences NEXO
        </div>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>Notifications: activées</li>
          <li>Mode sombre: désactivé</li>
          <li>Partage de position: actif</li>
        </ul>
      </section>
    </div>
  );
};

export default MoiPage;
